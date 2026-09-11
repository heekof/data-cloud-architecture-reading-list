let discoveryRevision = '', discoveryCandidates = [], discoveryBusy = false;
const accessLabels = { full_text: 'Texte intégral déclaré', abstract: 'Résumé seulement', metadata: 'Métadonnées seulement' };
const discoveryLabels = { pending: 'À examiner', later: 'Pour plus tard', dismissed: 'Écarté', accepted: 'Ajouté à la bibliothèque' };
function receiveDiscoveries(data) {
  discoveryRevision = data.revision; discoveryCandidates = data.candidates; renderDiscoveries();
}
async function loadDiscovery() {
  if (discoveryBusy) return;
  $('discovery-message').textContent = 'Chargement des propositions…';
  try { receiveDiscoveries(await get('/api/discovery')); $('discovery-message').textContent = ''; }
  catch (error) { $('discovery-message').textContent = error.message; }
}
function renderDiscoveries() {
  const selectedStatus = $('discovery-filter').value;
  const rows = discoveryCandidates.filter(c => !selectedStatus || c.status === selectedStatus);
  $('discovery-count').textContent = `${rows.length} proposition(s) affichée(s) sur ${discoveryCandidates.length}`;
  $('discovery-list').replaceChildren();
  for (const candidate of rows) {
    const card = element('article', 'result discovery-card');
    const top = element('div', 'card-top');
    top.append(element('span', 'category', candidate.category), element('span', 'badge', discoveryLabels[candidate.status]));
    card.append(top, element('h3', '', candidate.title));
    card.append(element('p', 'discovery-topic', `Sujet : ${candidate.topic}`));
    const source = link('Ouvrir la source pour vérifier ↗', candidate.url);
    card.append(source, element('p', 'review-help', `${accessLabels[candidate.access]} par le LLM · URL non vérifiée par l’outil`));
    for (const [heading, value] of [['Pertinence', candidate.reason], ['Apport au corpus', candidate.contribution], ['Limites', candidate.caveats || 'Non précisées par le LLM']]) {
      card.append(element('h4', '', heading), element('p', '', value));
    }
    if (candidate.evidence) card.append(element('blockquote', 'discovery-evidence', candidate.evidence));
    if (candidate.existing_id) card.append(element('p', 'review-issues', 'Cette URL figure déjà dans la bibliothèque.'));
    else if (candidate.similar_title) card.append(element('p', 'review-issues', 'Un titre similaire existe déjà : vérifiez qu’il s’agit d’un autre article.'));
    const buttons = element('div', 'discovery-actions');
    if (candidate.status !== 'accepted') {
      const accept = element('button', 'primary', candidate.existing_id ? 'Rattacher à l’article existant' : 'Ajouter à la bibliothèque');
      accept.disabled = discoveryBusy;
      accept.addEventListener('click', () => discoveryAction('accept', { id: candidate.id }));
      buttons.append(accept);
      for (const [status, label] of [['later', 'Plus tard'], ['dismissed', 'Écarter'], ['pending', 'Réexaminer']]) {
        if (candidate.status === status || (candidate.status === 'pending' && status === 'pending')) continue;
        const button = element('button', 'text-button', label); button.disabled = discoveryBusy;
        button.addEventListener('click', () => discoveryAction('decision', { id: candidate.id, status })); buttons.append(button);
      }
    } else card.append(element('p', 'review-help', 'Article ajouté à l’index. Lancez l’archivage pour récupérer sa source et extraire son texte.'));
    card.append(buttons); $('discovery-list').append(card);
  }
  if (!rows.length) $('discovery-list').append(element('p', 'empty', 'Aucune proposition dans cette vue. Préparez une demande, puis importez la réponse du LLM.'));
}
async function discoveryAction(action, values) {
  if (discoveryBusy) return;
  discoveryBusy = true; renderDiscoveries();
  $('discovery-message').textContent = 'Enregistrement…';
  try {
    const data = await postAction(`/api/discovery/${action}`, { ...values, revision: discoveryRevision });
    receiveDiscoveries(data);
    $('discovery-message').textContent = action === 'accept' ? (data.warnings?.length ? data.warnings.join(' ') : 'Article ajouté à la bibliothèque. Lancez l’archivage pour récupérer les sources manquantes.') : 'Décision enregistrée.';
  } catch (error) { $('discovery-message').textContent = error.message; }
  finally { discoveryBusy = false; renderDiscoveries(); }
}
async function copyDiscoveryText(id, statusId) {
  const field = $(id);
  try { await navigator.clipboard.writeText(field.value); $(statusId).textContent = 'Copié. Vous pouvez le coller dans votre LLM.'; }
  catch { const details = field.closest('details'); if (details) details.open = true; field.focus(); field.select(); $(statusId).textContent = 'Texte sélectionné : utilisez le raccourci de copie de votre navigateur.'; }
}
function initDiscovery() {
  for (const id of ['discovery-topic', 'discovery-criteria']) $(id).addEventListener('input', () => {
    $('copy-discovery').disabled = true; $('discovery-prompt').value = '';
    $('discovery-prompt-status').textContent = 'Préparez la demande avec ces critères.';
  });
  $('prepare-discovery').addEventListener('click', async () => {
    const topic = $('discovery-topic').value, criteria = $('discovery-criteria').value;
    $('prepare-discovery').disabled = true; $('discovery-prompt-status').textContent = 'Préparation…';
    try {
      const data = await postAction('/api/discovery/prompt', { topic, criteria });
      if (topic !== $('discovery-topic').value || criteria !== $('discovery-criteria').value) return;
      $('discovery-prompt').value = data.prompt; $('copy-discovery').disabled = false;
      $('discovery-prompt-status').textContent = `Demande prête : ${data.examples} lectures représentatives et ${data.known} articles connus, avec un format JSON imposé.`;
    } catch (error) { $('discovery-prompt-status').textContent = error.message; }
    finally { $('prepare-discovery').disabled = false; }
  });
  $('copy-discovery').addEventListener('click', () => copyDiscoveryText('discovery-prompt', 'discovery-prompt-status'));
  $('import-discovery').addEventListener('click', async () => {
    if (discoveryBusy) return;
    discoveryBusy = true; $('import-discovery').disabled = true; renderDiscoveries();
    $('discovery-import-status').textContent = 'Validation du JSON…';
    try {
      const data = await postAction('/api/discovery/import', { response: $('discovery-response').value, revision: discoveryRevision });
      if (data.added > 0) $('discovery-filter').value = 'pending';
      $('discovery-message').textContent = '';
      receiveDiscoveries(data);
      $('discovery-import-status').textContent = `${data.added} proposition(s) ajoutée(s), ${data.duplicates} doublon(s) ignoré(s).`;
    } catch (error) { $('discovery-import-status').textContent = error.message; }
    finally { discoveryBusy = false; $('import-discovery').disabled = false; renderDiscoveries(); }
  });
  $('refresh-discovery').addEventListener('click', loadDiscovery);
  $('discovery-filter').addEventListener('change', renderDiscoveries);
}
