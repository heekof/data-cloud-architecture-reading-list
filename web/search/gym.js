let gymCurrent = null;
function showGymSession(session) {
  gymCurrent = session;
  $('gym-answer-form').hidden = true; $('gym-coaching').hidden = false;
  $('gym-evidence').textContent = `Votre réponse initiale\n\n${session.initial_answer}\n\n` + session.critique.map(c => `${c.dimension}: ${c.question} [${c.evidence}]`).join('\n\n') + '\n\n' + session.evidence.map(e => `[${e.reference}] ${e.title} — lignes ${e.start}–${e.end} — ${labels[e.quality]}\n${e.text}`).join('\n\n');
  $('gym-critique').value = session.critique_notes || ''; $('gym-revised').value = session.revised_decision || ''; $('gym-reconsider').value = session.reconsider_when || '';
  $('gym-download').href = `/gym/decision?id=${encodeURIComponent(session.id)}`;
  $('gym-message').textContent = `Session conservée · version ${session.revision} · ${session.stage === 'complete' ? 'décision révisée' : 'réponse initiale'}.`;
}
async function loadGym() {
  try {
    const data = await get('/api/gym');
    $('gym-title').textContent = data.scenario.title; $('gym-scenario').textContent = data.scenario.question;
    $('gym-milestone').textContent = `${data.milestone.validated}/5 lectures validées · ${data.milestone.completed} décision(s) travaillée(s).`;
    $('gym-readings').replaceChildren(...data.readings.map(r => {
      const item = element('li', '', `${r.title} — ${labels[r.quality]}`);
      const review = element('button', 'text-button', 'Revoir');
      review.addEventListener('click', () => { $('review-filter').value = ''; $('review-query').value = r.id; document.querySelector('[data-view="reviews"]').click(); });
      item.append(review); return item;
    }));
    $('gym-sessions').replaceChildren(...data.sessions.map(s => { const button = element('button', 'text-button', `${s.updated_at.slice(0, 10)} · v${s.revision} · ${s.stage}`); button.addEventListener('click', async () => { try { showGymSession(await get(`/api/gym?id=${s.id}`)); } catch (e) { $('gym-message').textContent = e.message; } }); return button; }));
  } catch (e) { $('gym-message').textContent = e.message; }
}
function initGym() {
  for (const [form, action] of [['gym-answer-form', 'answer'], ['gym-revise-form', 'revise']]) $(form).addEventListener('submit', async event => {
    event.preventDefault(); const button = event.submitter; button.disabled = true;
    try {
      const body = action === 'answer' ? { action, initial_answer: $('gym-answer').value } : { action, id: gymCurrent.id, revision: gymCurrent.revision, critique_notes: $('gym-critique').value, revised_decision: $('gym-revised').value, reconsider_when: $('gym-reconsider').value };
      showGymSession(await postAction('/api/gym', body)); await loadGym();
    } catch (e) { $('gym-message').textContent = e.message; }
    finally { button.disabled = false; }
  });
  $('gym-new').addEventListener('click', () => { gymCurrent = null; $('gym-answer').value = ''; $('gym-answer-form').hidden = false; $('gym-coaching').hidden = true; $('gym-message').textContent = ''; });
  loadGym();
}
