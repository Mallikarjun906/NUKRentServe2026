document.addEventListener('DOMContentLoaded', async () => {
  const u = Auth.require('provider'); if (!u) return;
  $('#who').textContent = u.name; let status = 'none';
  const MSG = { none: 'Complete registration to start verification. Listings cannot be published yet.', pending: 'Your application is being reviewed. You can prepare listings, but they stay hidden from customers until you are verified.', verified: 'You are verified. Your available listings are public and customers can contact you.', rejected: 'Your application was rejected. You cannot publish listings. Contact support or apply again with correct details.', info: 'We need more information from you. Follow the instructions below. Listings stay hidden until you are verified.' };
  try {
    const p = await API.profile(); status = p.verificationStatus === 'unverified' ? 'none' : (p.verificationStatus || 'none');
    $('#status').innerHTML = '<span class="badge ' + (status === 'verified' ? 'dark' : '') + '">' + esc(STATUS[status] || status) + '</span>';
    $('#status-msg').textContent = MSG[status] || ''; if (p.reviewNote || p.note) $('#status-note').textContent = 'Reviewer note: ' + (p.reviewNote || p.note);
  } catch (e) { showError($('#status-msg'), e); }
  crud({ list: $('#listings'), form: $('#lf'), kind: 'services', hiddenNote: () => status !== 'verified' ? 'Hidden from customers until verification is complete.' : '',
    card: x => '<h3>' + esc(x.title) + '</h3><p class="mute">' + esc(x.category) + ' · ' + esc(x.city) + '</p><p><b>' + esc(x.priceRange || 'On request') + '</b> · ' + (x.available === false ? 'Unavailable' : 'Available') + '</p>' });
  const out = $('#enq-list'); showLoading(out);
  try { const a = status === 'verified' || CONFIG.DEMO_MODE ? await API.myEnquiries() : []; renderList(out, a, x => '<div class="enq"><b>' + esc(x.from) + '</b> <span class="mute">' + esc(x.when || '') + '</span><br>' + esc(x.message) + '</div>', 'No enquiries yet.'); } catch (e) { showError(out, e); }
});
