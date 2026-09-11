const contextSelection = new Map();
let reviewRows = [], exportResult = null, contextGeneration = 0;
const issueLabels = { missing_source: 'Source manquante', missing_markdown: 'Texte à extraire', empty_markdown: 'Texte vide', review_rejected: 'Source rejetée' };
async function postAction(url, body) {
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Library-Action': '1' }, body: JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Action impossible.');
  return data;
}
function invalidateExport() {
  contextGeneration++;
  exportResult = null;
  $('download-context').disabled = true;
  $('context-preview').textContent = '';
  $('context-summary').textContent = '';
}
function updateSelection() {
  $('selection-count').textContent = contextSelection.size;
  $('selection-list').replaceChildren();
  for (const article of contextSelection.values()) {
    const row = element('li', 'selection-row');
    row.append(element('span', '', article.title));
    const remove = element('button', 'text-button', 'Retirer');
    remove.setAttribute('aria-label', `Retirer ${article.title}`);
    remove.addEventListener('click', () => {
      contextSelection.delete(article.id); updateSelection();
      for (const input of document.querySelectorAll('[data-select-id]')) if (input.dataset.selectId === article.id) input.checked = false;
    });
    row.append(remove); $('selection-list').append(row);
  }
  if (!contextSelection.size) $('selection-list').append(element('li', '', 'Sélectionnez des articles depuis les résultats de recherche.'));
  $('preview-context').disabled = !contextSelection.size;
  invalidateExport();
}
function addSelectionControl(article, container) {
  const label = element('label', 'select-context');
  const checkbox = element('input'); checkbox.type = 'checkbox';
  checkbox.dataset.selectId = article.id;
  checkbox.checked = contextSelection.has(article.id);
  checkbox.disabled = article.review === 'rejected';
  checkbox.setAttribute('aria-label', `Ajouter ${article.title} au dossier de contexte`);
  checkbox.addEventListener('change', () => {
    if (checkbox.checked && !contextSelection.has(article.id) && contextSelection.size >= 10) {
      checkbox.checked = false; $('selection-message').textContent = 'Le dossier est limité à dix articles.'; return;
    }
    if (checkbox.checked) contextSelection.set(article.id, article); else contextSelection.delete(article.id);
    $('selection-message').textContent = ''; updateSelection();
  });
  label.append(checkbox, document.createTextNode(article.review === 'rejected' ? 'Export exclu' : 'Ajouter au contexte'));
  container.append(label);
}
function renderReviews() {
  const status = $('review-filter').value, query = $('review-query').value.toLocaleLowerCase();
  const rows = reviewRows.filter(row => (!status || row.quality === status) && `${row.title} ${row.id} ${row.category}`.toLocaleLowerCase().includes(query));
  $('review-count').textContent = `${rows.length} article(s) affiché(s) sur ${reviewRows.length}`;
  $('review-list').replaceChildren();
  for (const row of rows) {
    const card = element('article', 'result review-card');
    const top = element('div', 'card-top'); top.append(element('span', 'category', row.category), element('span', `badge${row.quality === 'needs_review' ? ' warning' : ''}`, labels[row.quality]));
    card.append(top, element('h3', '', row.title));
    const issues = element('p', 'review-issues', row.issues.map(issue => issueLabels[issue] || issue).join(' · ') || (row.review === 'approved' ? 'Revue humaine effectuée.' : 'Comparer le texte à la source avant de valider.'));
    card.append(issues);
    const actions = element('div', 'review-links');
    if (row.word_count) { const read = element('button', 'read-button', 'Lire le texte →'); read.addEventListener('click', () => openReader({ ...row, start_line: 1, end_line: 0 })); actions.append(read); }
    if (row.pdf) actions.append(link('PDF ↗', `/source?id=${encodeURIComponent(row.id)}`));
    if (row.url) actions.append(link('Site d’origine ↗', row.url));
    card.append(actions);
    if (row.issues.includes('missing_source')) card.append(element('p', 'review-help', row.url ? 'À faire : récupérer la source avec l’archivage ou fournir le document manuellement.' : 'À faire : renseigner l’URL dans l’index global ou fournir une source locale.'));
    else if (row.issues.includes('missing_markdown') || row.issues.includes('empty_markdown')) card.append(element('p', 'review-help', 'À faire : extraire le texte ou corriger manuellement l’extraction, puis relancer l’archivage.'));
    const form = element('form', 'review-form');
    const statusLabel = element('label', '', 'Décision');
    const select = element('select');
    for (const [value, text] of [['pending', 'À revoir'], ['approved', 'Valider'], ['rejected', 'Rejeter']]) {
      const option = element('option', '', text); option.value = value;
      if (value === 'approved' && row.issues.some(issue => issue !== 'review_rejected')) option.disabled = true;
      select.append(option);
    }
    select.value = row.review; statusLabel.append(select);
    const notesLabel = element('label', '', 'Note de revue');
    const notes = element('textarea'); notes.maxLength = 4000; notes.rows = 2; notes.value = row.notes;
    notes.placeholder = 'Complétude, problème constaté, correction à effectuer…'; notesLabel.append(notes);
    const save = element('button', 'primary', 'Enregistrer'); save.type = 'submit';
    const message = element('p', 'review-save-status'); message.setAttribute('role', 'status');
    form.append(statusLabel, notesLabel, save, message);
    form.addEventListener('submit', async event => {
      event.preventDefault(); save.disabled = true; message.textContent = 'Enregistrement…';
      try {
        const result = await postAction('/api/review', { id: row.id, version: row.version, status: select.value, notes: notes.value });
        reviewRows = result.rows;
        $('review-message').textContent = result.warnings.length ? result.warnings.join(' ') : `Décision enregistrée pour « ${row.title} ». Rapports et recherche actualisés.`;
        renderReviews();
        await search();
        // Invalidate selected excerpts after a quality edit that may rebuild passages.
        contextSelection.clear(); updateSelection();
        for (const input of document.querySelectorAll('[data-select-id]')) input.checked = false;
      } catch (error) { message.textContent = error.message; save.disabled = false; }
    });
    card.append(form); $('review-list').append(card);
  }
  if (!rows.length) $('review-list').append(element('p', 'empty', 'Aucun article dans cette vue.'));
}
async function loadReviews() {
  $('review-message').textContent = 'Chargement de la file…';
  try { const data = await get('/api/reviews'); reviewRows = data.rows; renderReviews(); $('review-message').textContent = `${data.counts.needs_review} à vérifier · ${data.counts.not_reviewed} non revus · ${data.counts.ok} validés`; }
  catch (error) { $('review-message').textContent = error.message; }
}
function initWorkbench() {
  for (const button of document.querySelectorAll('[data-view]')) button.addEventListener('click', () => {
    const reviews = button.dataset.view === 'reviews';
    $('search-section').hidden = reviews; $('search-workspace').hidden = reviews; $('review-workspace').hidden = !reviews;
    for (const tab of document.querySelectorAll('[data-view]')) tab.setAttribute('aria-pressed', String(tab === button));
    if (reviews) loadReviews();
  });
  $('review-filter').addEventListener('change', renderReviews);
  $('review-query').addEventListener('input', renderReviews);
  $('refresh-reviews').addEventListener('click', loadReviews);
  $('open-context').addEventListener('click', () => { updateSelection(); $('context-dialog').showModal(); document.body.classList.add('reading'); });
  $('close-context').addEventListener('click', () => $('context-dialog').close());
  $('context-dialog').addEventListener('close', () => document.body.classList.remove('reading'));
  for (const id of ['context-mode', 'context-budget', 'context-question']) $(id).addEventListener('input', invalidateExport);
  $('preview-context').addEventListener('click', async () => {
    const generation = contextGeneration;
    $('preview-context').disabled = true; $('context-summary').textContent = 'Préparation du dossier…';
    try {
      const result = await postAction('/api/context', { items: [...contextSelection.values()].map(a => ({ id: a.id, passage_id: a.passage_id, revision: a.revision })), mode: $('context-mode').value, maxWords: Number($('context-budget').value), question: $('context-question').value });
      if (generation !== contextGeneration) return;
      exportResult = result;
      $('context-preview').textContent = result.markdown;
      $('context-summary').textContent = `${result.included.length} source(s) incluse(s) · ${number(result.words)} mots de contenu · ${result.omitted.length} omission(s)${result.omitted.length ? ' : ' + result.omitted.map(item => `${item.title} (${item.reason})`).join(' ; ') : ''}`;
      $('download-context').disabled = result.included.length === 0;
    } catch (error) { invalidateExport(); $('context-summary').textContent = error.message; }
    finally { $('preview-context').disabled = contextSelection.size === 0; }
  });
  $('download-context').addEventListener('click', () => {
    if (!exportResult?.included.length) return;
    const url = URL.createObjectURL(new Blob([exportResult.markdown], { type: 'text/markdown;charset=utf-8' }));
    const anchor = element('a'); anchor.href = url; anchor.download = 'dossier-contexte.md'; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  updateSelection();
}
