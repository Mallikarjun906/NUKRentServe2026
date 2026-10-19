/* Shared UI helpers */
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const params = () => Object.fromEntries(new URLSearchParams(location.search));
const money = n => (n === undefined || n === null || n === '' ? 'On request' : '₹' + Number(n).toLocaleString('en-IN'));
const age = d => { const b = new Date(d), n = new Date(); if (isNaN(b)) return -1; let a = n.getFullYear() - b.getFullYear(), m = n.getMonth() - b.getMonth(); if (m < 0 || (m === 0 && n.getDate() < b.getDate())) a--; return a; };
const STATUS = { none: 'Not Submitted', pending: 'Pending Verification', verified: 'Verified', rejected: 'Rejected', info: 'Additional Information Required' };
const typeLabel = id => (CONFIG.PROPERTY_TYPES.find(t => t.id === id) || {}).label || id;

function toast(m, type) { const t = document.createElement('div'); t.className = 'toast ' + (type || ''); t.setAttribute('role', 'status'); t.textContent = m; document.body.append(t); setTimeout(() => t.remove(), 3000); }
function setBusy(b, on, label) { if (!b) return; if (on) { b.dataset.l = b.textContent; b.disabled = true; b.innerHTML = '<span class="spinner"></span> ' + esc(label || 'Please wait…'); } else { b.disabled = false; b.textContent = b.dataset.l || b.textContent; } }
function showLoading(el) { el.innerHTML = '<div class="state" role="status"><span class="spinner"></span> Loading…</div>'; }
function showError(el, e) { el.innerHTML = '<div class="state error" role="alert">' + esc(e.message || e) + '</div>'; }
function renderList(el, items, fn, msg) { el.innerHTML = items.length ? items.map(fn).join('') : '<div class="state">' + esc(msg || 'Nothing found. Try a different city or category.') + '</div>'; }

const safeImg = u => (/^(https?:\/\/|assets\/)/.test(u || '') ? u : null);
const ph = x => '<div class="ph" aria-hidden="true">' + (safeImg(x.image) ? '<img src="' + esc(x.image) + '" alt="">' : esc(String(x.name || x.title || 'N')[0])) + '</div>';
const demoBadge = x => (x.demo ? '<span class="badge demo">Demo Data</span>' : '');
function contactBtns(x) {
  const p = String(x.phone || '').replace(/\D/g, '');
  return p ? '<a class="btn btn-sm" href="tel:+91' + p + '">Call</a><a class="btn btn-sm btn-outline" href="https://wa.me/91' + p + '" target="_blank" rel="noopener">WhatsApp</a>'
    : '<button class="btn btn-sm btn-outline" disabled>' + (x.demo ? 'Contact hidden in demo' : 'Contact not provided') + '</button>';
}
const serviceCard = x => '<article class="card"><div class="row">' + ph(x) + '<div><h3><a href="service-details.html?id=' + encodeURIComponent(x.id) + '">' + esc(x.name) + '</a></h3><span class="mute">' + esc(x.category) + ' · ' + esc(x.city) + '</span></div></div><p>' + esc(x.title || '') + '</p><div class="row"><b>' + esc(x.priceRange || 'Price on request') + '</b>' + (x.verificationStatus === 'verified' ? '<span class="badge dark">Verified</span>' : '') + demoBadge(x) + '</div></article>';
const propertyCard = x => '<article class="card"><div class="row"><span class="badge">' + esc(typeLabel(x.type)) + '</span>' + (x.available === false ? '<span class="badge">Not available</span>' : '<span class="badge dark">Available</span>') + demoBadge(x) + '</div><h3><a href="property-details.html?id=' + encodeURIComponent(x.id) + '">' + esc(x.title) + '</a></h3><p class="mute">' + esc(x.locality) + ', ' + esc(x.city) + '</p><p><b>' + money(x.rent) + '</b> / month<br><span class="mute">Deposit ' + money(x.deposit) + '</span></p></article>';

function fillSelects() {
  const sources = {
    cities: CONFIG.CITIES.map(c => [c, c]),
    categories: CONFIG.SERVICE_CATEGORIES.map(c => [c, c]),
    types: CONFIG.PROPERTY_TYPES.map(t => [t.id, t.label])
  };
  $$('select[data-fill]').forEach(select => {
    const values = sources[select.dataset.fill] || [];
    const existing = new Set([...select.options].map(option => option.value));
    values.forEach(([value, label]) => { if (!existing.has(value)) select.add(new Option(label, value)); });
  });
  if (!CONFIG.DEMO_MODE && typeof API !== 'undefined' && API.categories) {
    API.categories.list().then(categories => {
      if (!categories.length) return;
      $$('select[data-fill="categories"]').forEach(select => {
        const selected = select.value;
        select.querySelectorAll('option:not(:first-child)').forEach(option => option.remove());
        categories.forEach(category => select.add(new Option(category.name, category.name)));
        if (selected) select.value = selected;
      });
    }).catch(() => {
      // Keep configured categories visible if the category endpoint is temporarily unavailable.
    });
  }
}
function initChrome() {
  fillSelects();
  const page = location.pathname.split('/').pop() || 'index.html';
  $$('.nav-links a').forEach(a => { if (a.getAttribute('href') === page) a.setAttribute('aria-current', 'page'); });
  const u = Auth.user(), al = $('#auth-link');
  if (al) {
    if (u) { al.textContent = 'Dashboard'; al.href = Auth.HOME[u.role]; const li = document.createElement('li'); li.innerHTML = '<a href="#" id="logout">Log out</a>'; al.parentElement.after(li); $('#logout').addEventListener('click', e => { e.preventDefault(); Auth.logout(); }); }
  }
  const t = $('.nav-toggle'); if (t) t.addEventListener('click', () => { const o = $('.nav-links').classList.toggle('open'); t.setAttribute('aria-expanded', o); });
}
document.addEventListener('DOMContentLoaded', initChrome);

/* Generic create/edit/remove manager used by the provider and owner dashboards */
function crud({ list, form, kind, card, hiddenNote }) {
  let editId = null; const items = {}, sb = form.querySelector('[type=submit]'), label = sb.textContent;
  const reset = () => { editId = null; form.reset(); sb.textContent = label; };
  const load = async () => {
    showLoading(list);
    try {
      const a = await API.mine(kind); a.forEach(x => items[x.id] = x);
      renderList(list, a, x => '<div class="card">' + card(x) + (hiddenNote && hiddenNote(x) ? '<p class="mute">' + esc(hiddenNote(x)) + '</p>' : '') + '<div class="row"><button class="btn btn-sm btn-outline" data-edit="' + esc(x.id) + '">Edit</button><button class="btn btn-sm btn-outline" data-del="' + esc(x.id) + '">Remove</button></div></div>', 'No listings yet. Add your first one with the form.');
    } catch (e) { showError(list, e); }
  };
  list.addEventListener('click', async e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.edit) {
      editId = b.dataset.edit; const it = items[editId];
      [...form.elements].forEach(el => { if (el.name && el.type !== 'file' && it[el.name] !== undefined) { if (el.type === 'checkbox') el.checked = !!it[el.name]; else el.value = it[el.name]; } });
      sb.textContent = 'Update listing'; form.scrollIntoView({ behavior: 'smooth' });
    }
    if (b.dataset.del && confirm('Remove this listing?')) { try { await API.remove(kind, b.dataset.del); toast('Listing removed'); load(); } catch (x) { toast(x.message, 'error'); } }
  });
  form.addEventListener('submit', async e => {
    e.preventDefault(); if (!form.reportValidity()) return;
    const fd = new FormData(form); let body = fd;
    if (CONFIG.DEMO_MODE) { body = Object.fromEntries([...fd].filter(([, v]) => !(v instanceof File))); ['rent', 'deposit'].forEach(k => { if (body[k] !== undefined) body[k] = Number(body[k]); }); }
    const av = form.elements.available; if (av) { if (body instanceof FormData) body.set('available', av.checked); else body.available = av.checked; }
    setBusy(sb, true, 'Saving…');
    try { editId ? await API.update(kind, editId, body) : await API.create(kind, body); toast('Listing saved'); reset(); load(); }
    catch (x) { toast(x.message, 'error'); setBusy(sb, false); }
  });
  $('[data-cancel]', form)?.addEventListener('click', reset);
  load();
}
