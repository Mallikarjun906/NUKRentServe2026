document.addEventListener('DOMContentLoaded', async () => {
  const out = $('#detail'), id = params().id; if (!id) return showError(out, 'No property selected. Go back to Rentals.');
  showLoading(out);
  try {
    const x = await API.get('properties', id);
    out.innerHTML = '<div class="detail"><div class="card"><div class="row"><span class="badge">' + esc(typeLabel(x.type)) + '</span>' + (x.available === false ? '<span class="badge">Not available</span>' : '<span class="badge dark">Available</span>') + demoBadge(x) + '</div><h1 style="font-size:1.8rem">' + esc(x.title) + '</h1><p class="mute">' + esc(x.locality) + ', ' + esc(x.city) + '</p><h2>Details</h2><p>' + esc(x.description) + '</p><p><b>Facilities:</b> ' + esc(x.facilities || '-') + '</p></div>' +
      '<aside class="card"><h2>' + money(x.rent) + ' <span class="mute" style="font-size:.9rem">/ month</span></h2><p>Security deposit: <b>' + money(x.deposit) + '</b></p><h3>Contact owner</h3><div class="row">' + contactBtns(x) + '</div><hr><h3>Request booking</h3><p class="mute">This sends a booking request to the owner; it does not charge a payment.</p><form id="booking-form"><label>Preferred move-in date<input name="requestedMoveInDate" type="date"></label><label>Message to owner<textarea name="message" maxlength="1500" placeholder="Tell the owner when you would like to move in"></textarea></label><p id="booking-error" class="err" role="alert"></p><button class="btn btn-block" type="submit">Request booking</button></form></aside></div>';
    const bookingForm = $('#booking-form');
    bookingForm.addEventListener('submit', async event => {
      event.preventDefault();
      const user = Auth.user();
      if (!user) { location.href = 'login.html?next=' + encodeURIComponent('property-details.html?id=' + id); return; }
      if (!['customer', 'owner'].includes(user.role)) { $('#booking-error').textContent = 'Please use a customer or property-owner account to request a booking.'; return; }
      const button = bookingForm.querySelector('button[type=submit]'); setBusy(button, true, 'Sending request…'); $('#booking-error').textContent = '';
      try {
        await API.bookings.create({ propertyId: id, requestedMoveInDate: bookingForm.elements.requestedMoveInDate.value || undefined, message: bookingForm.elements.message.value.trim() });
        toast('Booking request sent to the owner.'); bookingForm.reset(); setBusy(button, false);
      } catch (error) { $('#booking-error').textContent = error.message; setBusy(button, false); }
    });
  } catch (e) { showError(out, e); }
});
