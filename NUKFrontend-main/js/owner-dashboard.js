document.addEventListener('DOMContentLoaded', () => {
  const u = Auth.user();
  if (!u || !['customer', 'owner', 'provider'].includes(u.role)) { location.href = 'login.html?next=owner-dashboard.html'; return; }
  $('#who').textContent = u.name;
  crud({ list: $('#listings'), form: $('#pf'), kind: 'properties',
    card: x => '<span class="badge">' + esc(typeLabel(x.type)) + '</span> ' + demoBadge(x) + '<h3>' + esc(x.title) + '</h3><p class="mute">' + esc(x.locality) + ', ' + esc(x.city) + '</p><p><b>' + money(x.rent) + '</b> / month · ' + (x.available === false ? 'Not available' : 'Available') + '</p>' });
  const bookings = $('#booking-requests');
  if (bookings && API.bookings) {
    const loadBookings = async () => {
      showLoading(bookings);
      try {
        const rows = await API.bookings.received();
        renderList(bookings, rows, b => {
          const property = b.propertyId || {}; const customer = b.customerId || {};
          return '<article class="card"><h3>' + esc(property.title || 'Property') + '</h3><p>Request from <b>' + esc(customer.name || 'Customer') + '</b> · ' + esc(customer.phone || customer.email || '') + '</p><p>' + esc(b.message || 'No message') + '</p><p>Status: <b>' + esc(b.status) + '</b></p>' + (b.status === 'pending' ? '<div class="row"><button class="btn btn-sm" data-booking-action="accepted" data-id="' + esc(b.id || b._id) + '">Accept</button><button class="btn btn-sm btn-outline" data-booking-action="rejected" data-id="' + esc(b.id || b._id) + '">Reject</button></div>' : '') + '</article>';
        }, 'No booking requests yet.');
      } catch (e) { showError(bookings, e); }
    };
    bookings.addEventListener('click', async e => {
      const button = e.target.closest('[data-booking-action]'); if (!button) return;
      try { await API.bookings.updateStatus(button.dataset.id, button.dataset.bookingAction); toast('Booking request updated.'); loadBookings(); }
      catch (error) { toast(error.message, 'error'); }
    });
    loadBookings();
  }
});
