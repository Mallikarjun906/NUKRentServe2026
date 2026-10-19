document.addEventListener('DOMContentLoaded', async () => {
  const u = Auth.require('customer'); if (!u) return;
  $('#who').textContent = u.name;
  const out = $('#enq-list'); showLoading(out);
  try { const a = await API.myEnquiries(); renderList(out, a, x => '<div class="enq"><b>' + esc(x.from || 'You') + '</b> <span class="mute">' + esc(x.when || '') + '</span><br>' + esc(x.message) + '</div>', 'You have not sent any enquiries yet.'); } catch (e) { showError(out, e); }
  const bookingsOut = $('#booking-list');
  if (bookingsOut && API.bookings) {
    try { const bookings = await API.bookings.mine(); renderList(bookingsOut, bookings, b => { const property = b.propertyId || {}; return '<article class="enq"><b>' + esc(property.title || 'Property') + '</b><p>Status: ' + esc(b.status) + '</p><p>' + esc(b.message || '') + '</p>' + (b.status === 'pending' ? '<button class="btn btn-sm btn-outline" data-cancel-booking="' + esc(b.id || b._id) + '">Cancel request</button>' : '') + '</article>'; }, 'No booking requests yet. Open a rental and select Request booking.'); } catch (e) { showError(bookingsOut, e); }
    bookingsOut.addEventListener('click', async e => { const button = e.target.closest('[data-cancel-booking]'); if (!button) return; try { await API.bookings.updateStatus(button.dataset.cancelBooking, 'cancelled'); toast('Booking request cancelled.'); location.reload(); } catch (error) { toast(error.message, 'error'); } });
  }
});
