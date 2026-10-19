document.addEventListener('DOMContentLoaded', async () => {
  const out = $('#detail'), id = params().id; if (!id) return showError(out, 'No provider selected. Go back to Services.');
  showLoading(out);
  try {
    const x = await API.get('services', id);
    out.innerHTML = '<div class="detail"><div class="card"><div class="row">' + ph(x) + '<div><h1 style="font-size:1.7rem;margin:0">' + esc(x.name) + '</h1><span class="mute">' + esc(x.category) + ' · ' + esc(x.city) + '</span></div></div><div class="row">' + (x.verificationStatus === 'verified' ? '<span class="badge dark">Verified</span>' : '') + demoBadge(x) + '</div><h2>About</h2><p>' + esc(x.description) + '</p><p><b>Experience:</b> ' + esc(x.experience || '-') + '<br><b>Service area:</b> ' + esc(x.area || x.city) + '<br><b>Price:</b> ' + esc(x.priceRange || 'On request') + '<br><b>Availability:</b> ' + (x.available === false ? 'Not available now' : 'Available') + '</p></div>' +
      '<aside class="card"><h2>Contact</h2><div class="row">' + contactBtns(x) + '</div><h3>Send an enquiry</h3><form id="enq" novalidate><label>Your message<textarea name="message" required maxlength="500"></textarea></label><span class="err" id="enq-err"></span><button class="btn btn-block" type="submit">Send enquiry</button></form><p class="mute" style="margin-top:.8rem;font-size:.85rem">Enquiries need a free customer login. Browsing never does.</p></aside></div>';
    $('#enq').addEventListener('submit', async e => {
      e.preventDefault(); const f = e.target, err = $('#enq-err'); err.textContent = '';
      if (!Auth.user()) { location.href = 'login.html?next=' + encodeURIComponent('service-details.html?id=' + id); return; }
      if (f.message.value.trim().length < 5) { err.textContent = 'Write a short message (at least 5 characters).'; return; }
      const b = f.querySelector('button'); setBusy(b, true, 'Sending…');
      try { await API.sendEnquiry({ listingId: id, listingType: 'service', message: f.message.value.trim() }); toast(CONFIG.DEMO_MODE ? 'Demo mode: enquiry not sent' : 'Enquiry sent'); f.reset(); } catch (x) { err.textContent = x.message; }
      setBusy(b, false);
    });
  } catch (e) { showError(out, e); }
});
