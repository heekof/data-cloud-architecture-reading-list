const $ = id => document.getElementById(id);
const number = value => new Intl.NumberFormat('fr-FR').format(value);
const labels = { not_reviewed: 'Non revu', needs_review: 'À vérifier', ok: 'Validé' };
let page = 1, totalPages = 0, request, readerRequest;
const params = new URLSearchParams(location.search);
for (const [key, id] of [['q', 'query'], ['rating', 'rating'], ['quality', 'quality']]) if (params.has(key)) $(id).value = params.get(key);
$('rejected').checked = params.get('rejected') === '1';
function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}
function highlighted(text) {
  const fragment = document.createDocumentFragment();
  let active = false;
  for (const part of text.split(/([\x01\x02])/)) {
    if (part === '\x01') active = true;
    else if (part === '\x02') active = false;
    else fragment.append(active ? element('mark', '', part) : document.createTextNode(part));
  }
  return fragment;
}
async function get(url, signal) {
  const response = await fetch(url, { signal });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Impossible de charger les résultats.');
  return data;
}
function link(text, href) {
  const node = element('a', '', text);
  node.href = href; node.target = '_blank'; node.rel = 'noopener noreferrer';
  return node;
}
async function openReader(article) {
  readerRequest?.abort();
  readerRequest = new AbortController();
  const signal = readerRequest.signal;
  $('reader-title').textContent = article.title;
  $('reader-category').textContent = article.category;
  $('reader-meta').textContent = `${number(article.word_count)} mots · ${labels[article.quality] || article.quality}`;
  $('reader-content').textContent = 'Chargement du texte…';
  $('reader-links').replaceChildren();
  if (article.pdf) $('reader-links').append(link('Ouvrir le PDF ↗', `/source?id=${encodeURIComponent(article.id)}`));
  if (article.url && /^https?:\/\//i.test(article.url)) $('reader-links').append(link('Site d’origine ↗', article.url));
  $('reader-warning').textContent = article.review === 'rejected' ? `Source rejetée. ${article.notes || 'La fiabilité de ce texte doit être vérifiée.'}` : article.quality === 'needs_review' ? `Texte à vérifier. ${article.notes || ''}` : '';
  $('reader').showModal(); document.body.classList.add('reading');
  document.querySelector('.reader-scroll').scrollTop = 0;
  try {
    const data = await get(`/api/article?id=${encodeURIComponent(article.id)}`, signal);
    const fragment = document.createDocumentFragment();
    data.markdown.replace(/\r\n?/g, '\n').split('\n').forEach((line, index) => {
      const heading = line.match(/^#{1,6}\s+(.+)/);
      const node = element('p', `reader-line${heading ? ' is-heading' : ''}`, heading ? heading[1] : line);
      if (index + 1 >= article.start_line && index + 1 <= article.end_line) node.classList.add('matched');
      fragment.append(node);
    });
    $('reader-content').replaceChildren(fragment);
    const target = $('reader-content').querySelector('.matched');
    if ($('query').value.trim() && target) target.scrollIntoView({ block: 'start', behavior: 'instant' });
  } catch (error) { if (error.name !== 'AbortError') $('reader-content').textContent = error.message; }
}
$('close-reader').addEventListener('click', () => $('reader').close());
$('reader').addEventListener('close', () => { document.body.classList.remove('reading'); readerRequest?.abort(); });
function card(article) {
  const node = element('article', 'result');
  const top = element('div', 'card-top');
  top.append(element('span', 'category', article.category));
  const rating = element('span', 'rating', article.rating == null ? 'Non noté' : `★ ${article.rating}`);
  if (article.rating != null) rating.append(element('small', '', ' / 10'));
  top.append(rating);
  const heading = element('h3');
  const title = element('button', 'title-button', article.title);
  title.addEventListener('click', () => openReader(article)); heading.append(title);
  const excerpt = element('p', 'excerpt'); excerpt.append(highlighted(article.excerpt));
  const bottom = element('div', 'card-bottom'), details = element('div', 'details');
  details.append(element('span', `badge${article.review === 'rejected' || article.quality === 'needs_review' ? ' warning' : article.quality === 'ok' ? ' approved' : ''}`, article.review === 'rejected' ? 'Source rejetée' : labels[article.quality] || article.quality));
  details.append(element('span', '', `${number(article.word_count)} mots`));
  if ($('query').value.trim()) details.append(element('span', '', `· ${article.matches} passage${article.matches > 1 ? 's' : ''}`));
  const read = element('button', 'read-button', 'Lire le passage →');
  read.addEventListener('click', () => openReader(article));
  addSelectionControl(article, details);
  bottom.append(details, read); node.append(top, heading, excerpt, bottom);
  return node;
}
async function search({ keepPage = false } = {}) {
  if (!keepPage) page = 1;
  request?.abort(); request = new AbortController();
  const signal = request.signal;
  const query = new URLSearchParams();
  for (const [key, id] of [['q', 'query'], ['category', 'category'], ['rating', 'rating'], ['quality', 'quality']]) if ($(id).value.trim()) query.set(key, $(id).value.trim());
  if ($('rejected').checked) query.set('rejected', '1');
  if (page > 1) query.set('page', page);
  history.replaceState(null, '', query.size ? `/?${query}` : '/');
  $('results').setAttribute('aria-busy', 'true');
  $('result-count').textContent = 'Recherche…';
  try {
    const data = await get(`/api/search?${query}`, signal);
    totalPages = data.pages;
    $('results-title').textContent = $('query').value.trim() ? `Résultats pour « ${$('query').value.trim()} »` : 'Explorer la collection';
    $('sort-label').textContent = $('query').value.trim() ? 'PAR PERTINENCE' : 'PAR NOTE';
    $('result-count').textContent = `${data.total} article${data.total > 1 ? 's' : ''}${$('rejected').checked ? ' · sources rejetées incluses' : ' · sources rejetées masquées'}`;
    $('results').replaceChildren(...data.results.map(card));
    if (!data.results.length) {
      const empty = element('div', 'empty');
      empty.append(element('h3', '', 'Une autre piste ?'), element('p', '', 'Aucun article ne correspond. Essayez moins de mots, un terme anglais ou des filtres plus larges.'));
      $('results').append(empty);
    }
    $('pagination').hidden = totalPages <= 1;
    $('previous').disabled = page <= 1; $('next').disabled = page >= totalPages;
    $('page-label').textContent = `${page} / ${totalPages}`;
  } catch (error) {
    if (error.name === 'AbortError') return;
    $('result-count').textContent = 'Recherche indisponible';
    $('results').replaceChildren(element('p', 'empty', error.message));
    $('pagination').hidden = true;
  } finally { if (!signal.aborted) $('results').setAttribute('aria-busy', 'false'); }
}
$('search-form').addEventListener('submit', event => { event.preventDefault(); search(); });
for (const id of ['category', 'rating', 'quality', 'rejected']) $(id).addEventListener('change', () => search());
for (const button of document.querySelectorAll('[data-query]')) button.addEventListener('click', () => { $('query').value = button.dataset.query; search(); });
$('reset').addEventListener('click', () => { for (const id of ['category', 'rating', 'quality']) $(id).value = ''; $('rejected').checked = false; search(); });
$('previous').addEventListener('click', () => { page--; search({ keepPage: true }); });
$('next').addEventListener('click', () => { page++; search({ keepPage: true }); });
async function init() {
  initWorkbench();
  initDiscovery();
  try {
    const stats = await get('/api/stats');
    $('stat-articles').textContent = number(stats.articles); $('stat-words').textContent = number(stats.words);
    for (const category of stats.categories) { const option = element('option', '', `${category.category} (${category.count})`); option.value = category.category; $('category').append(option); }
    if (params.has('category')) $('category').value = params.get('category');
    page = Math.max(1, Math.trunc(Number(params.get('page'))) || 1);
    await search({ keepPage: true });
  } catch (error) { $('result-count').textContent = error.message; $('results').setAttribute('aria-busy', 'false'); }
}
init();
