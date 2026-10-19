document.addEventListener('DOMContentLoaded', () => {
  const f = $('#filters'), out = $('#results'), p = params();
  ['q', 'city', 'type'].forEach(k => { if (p[k] && f.elements[k]) f.elements[k].value = p[k]; });
  async function run() {
    const q = Object.fromEntries(new FormData(f)); showLoading(out);
    try { const a = await API.list('properties', q); $('#count').textContent = a.length + (a.length === 1 ? ' property' : ' properties'); renderList(out, a, propertyCard, 'No properties found. Try another city or type.'); } catch (e) { showError(out, e); }
  }
  f.addEventListener('submit', e => { e.preventDefault(); history.replaceState(null, '', '?' + new URLSearchParams([...new FormData(f)].filter(([, v]) => v))); run(); });
  f.addEventListener('change', () => f.requestSubmit()); run();
});
