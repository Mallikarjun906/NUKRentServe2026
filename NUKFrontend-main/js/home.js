document.addEventListener('DOMContentLoaded', async () => {
  $('#home-search').addEventListener('submit', e => { e.preventDefault(); const f = [...new FormData(e.target)].filter(([, v]) => v); location.href = 'services.html?' + new URLSearchParams(f); });
  $('#cat-grid').innerHTML = CONFIG.SERVICE_CATEGORIES.map(c => '<a class="tile" href="services.html?category=' + encodeURIComponent(c) + '"><b>' + esc(c) + '</b><span class="kn">' + esc(CONFIG.KN_CATEGORY[c] || '') + '</span></a>').join('');
  $('#city-grid').innerHTML = CONFIG.CITIES.map(c => { const i = CONFIG.CITY_INFO[c] || {}; return '<a class="tile" href="services.html?city=' + encodeURIComponent(c) + '"><b>' + esc(c) + '</b><span class="kn">' + esc(i.kn || '') + '</span><small>' + esc(i.note || '') + '</small></a>'; }).join('');
  $('#rent-grid').innerHTML = CONFIG.PROPERTY_TYPES.map(t => '<a class="tile" href="rentals.html?type=' + t.id + '"><b>' + esc(t.label) + '</b><span class="kn">' + esc(CONFIG.KN_TYPE[t.id] || '') + '</span></a>').join('');
  const s = $('#feat-s'), p = $('#feat-p'); showLoading(s); showLoading(p);
  try { renderList(s, (await API.list('services')).slice(0, 3), serviceCard); } catch (e) { showError(s, e); }
  try { renderList(p, (await API.list('properties')).slice(0, 3), propertyCard); } catch (e) { showError(p, e); }
});
