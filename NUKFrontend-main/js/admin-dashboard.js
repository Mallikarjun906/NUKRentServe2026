document.addEventListener("DOMContentLoaded", () => {
  const u = Auth.require("admin"); if (!u) return;
  const out = $("#pending");
  const escv = value => esc(String(value == null ? "" : value));

  // Use an in-page dialog for private document previews. window.open() with
  // noopener can return null even when successful, and can falsely report a
  // popup-blocked error. A dialog also avoids creating a separate tab.
  const documentDialog = document.createElement("dialog");
  documentDialog.className = "admin-document-dialog";
  documentDialog.style.cssText = "width:min(960px,94vw);max-height:90vh;border:0;border-radius:16px;padding:1rem;box-shadow:0 24px 80px #0005";
  documentDialog.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;gap:1rem;margin-bottom:.75rem"><strong>Private identity document</strong><button type="button" class="btn btn-outline" data-close-document>Close</button></div><div data-document-content style="max-height:75vh;overflow:auto;text-align:center"></div>';
  document.body.appendChild(documentDialog);
  let activeDocumentUrl = null;
  const closeDocument = () => {
    if (documentDialog.open) documentDialog.close();
    documentDialog.querySelector("[data-document-content]").replaceChildren();
    if (activeDocumentUrl) URL.revokeObjectURL(activeDocumentUrl);
    activeDocumentUrl = null;
  };
  documentDialog.querySelector("[data-close-document]").addEventListener("click", closeDocument);
  documentDialog.addEventListener("click", event => { if (event.target === documentDialog) closeDocument(); });
  documentDialog.addEventListener("close", () => {
    documentDialog.querySelector("[data-document-content]").replaceChildren();
    if (activeDocumentUrl) URL.revokeObjectURL(activeDocumentUrl);
    activeDocumentUrl = null;
  });
  async function load() {
    showLoading(out);
    try {
      const items = await API.admin.pending();
      if (!items.length) { out.innerHTML = '<div class="card"><h2>All caught up</h2><p class="mute">There are no provider applications waiting for review.</p></div>'; return; }
      out.innerHTML = items.map(x => `<article class="card" data-id="${escv(x.id)}" style="padding:1.25rem;border:1px solid #eadfce;border-radius:18px"><div style="display:flex;justify-content:space-between;gap:.5rem;flex-wrap:wrap"><h2>${escv(x.name)}</h2><span class="badge">${escv(x.status)}</span></div><p class="mute">${escv(x.category)} · ${escv(x.city)} · ${escv(x.submitted ? new Date(x.submitted).toLocaleString() : "")}</p><p><b>Email:</b> ${escv(x.email)}<br><b>Phone:</b> ${escv(x.phone)}<br><b>Experience:</b> ${escv(x.experience || "Not provided")}</p><p>${escv(x.description || "")}</p><p class="mute">${x.aadhaarDocumentAvailable ? 'Identity document uploaded · private' : 'Identity document not uploaded'}</p><p><b>Identity review:</b> ${escv((x.identityReviewStatus || "not_checked").replaceAll("_", " "))}</p><div class="admin-actions" style="display:flex;gap:.5rem;flex-wrap:wrap;margin:.75rem 0">${x.aadhaarDocumentAvailable ? '<button type="button" class="btn btn-outline" data-doc>View identity document</button>' : ''}</div><label>Aadhaar name (type the name as shown on document)<input maxlength="100" data-aadhaar-name value="${escv(x.aadhaarName || "")}" placeholder="Name printed on document"></label><label>Identity review note<input maxlength="500" data-identity-note value="${escv(x.identityReviewNote || "")}" placeholder="Optional review note"></label><div class="admin-actions" style="display:flex;gap:.5rem;flex-wrap:wrap;margin:.75rem 0"><button type="button" class="btn btn-outline" data-identity="match">Mark name matched</button><button type="button" class="btn btn-outline" data-identity="possible_mismatch">Mark mismatch</button><button type="button" class="btn btn-outline" data-identity="manual_review_required">Manual review</button></div><label>Decision note / rejection reason<input maxlength="500" data-note value="${escv(x.note || "")}" placeholder="Explain decision or request changes"></label><div class="admin-actions" style="display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.75rem"><button type="button" class="btn" data-d="approve">Approve provider</button><button type="button" class="btn btn-outline" data-d="info">Request more info</button><button type="button" class="btn btn-outline" data-d="reject">Reject application</button></div></article>`).join("");
    } catch (e) { showError(out, e); }
  }
  out.addEventListener("click", async e => {
    const card = e.target.closest("[data-id]"); if (!card) return;
    const docButton = e.target.closest("[data-doc]");
    if (docButton) {
      const url = `${CONFIG.API_BASE}/admin/provider-applications/${encodeURIComponent(card.dataset.id)}/document`;
      setBusy(docButton, true, "Loading document…");
      try {
        const response = await fetch(url, { headers: { Authorization: `Bearer ${Auth.token()}` }, cache: "no-store" });
        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.message || "Could not load identity document.");
        }
        const blob = await response.blob();
        if (!blob.size) throw new Error("The identity document is empty.");
        closeDocument();
        activeDocumentUrl = URL.createObjectURL(blob);
        const content = documentDialog.querySelector("[data-document-content]");
        if (blob.type === "application/pdf") {
          const frame = document.createElement("iframe");
          frame.title = "Private identity document PDF";
          frame.src = activeDocumentUrl;
          frame.style.cssText = "width:100%;height:70vh;border:0";
          content.appendChild(frame);
        } else if (blob.type.startsWith("image/")) {
          const image = document.createElement("img");
          image.alt = "Uploaded identity document";
          image.src = activeDocumentUrl;
          image.style.cssText = "max-width:100%;max-height:70vh;object-fit:contain";
          content.appendChild(image);
        } else {
          throw new Error("This identity document format cannot be previewed.");
        }
        if (typeof documentDialog.showModal === "function") documentDialog.showModal();
        else window.open(activeDocumentUrl, "_blank", "noopener");
      } catch (error) {
        closeDocument();
        toast(error.message, "error");
      } finally {
        setBusy(docButton, false);
      }
      return;
    }
    const identity = e.target.closest("[data-identity]");
    const decisionButton = e.target.closest("[data-d]");
    if (!identity && !decisionButton) return;
    const button = identity || decisionButton; setBusy(button, true, "Saving…");
    try {
      if (identity) {
        await API.req(`admin/provider-applications/${encodeURIComponent(card.dataset.id)}/identity-review`, { method: "PATCH", body: { status: identity.dataset.identity, aadhaarName: card.querySelector("[data-aadhaar-name]").value.trim(), note: card.querySelector("[data-identity-note]").value.trim() } });
        toast("Identity review saved.");
      } else {
        const decision = decisionButton.dataset.d;
        if (decision === "reject" && !card.querySelector("[data-note]").value.trim()) { throw new Error("Enter a rejection reason before rejecting this application."); }
        if (decision === "approve" && card.querySelector("[data-aadhaar-name]") && card.querySelector("[data-aadhaar-name]").value.trim() && !confirm("Confirm that you inspected the identity document and the registered name matches the document name?")) { setBusy(button, false); return; }
        await API.admin.decide(card.dataset.id, decision, card.querySelector("[data-note]").value.trim());
        toast("Application decision saved.");
      }
      await load();
    } catch (error) { toast(error.message, "error"); setBusy(button, false); }
  });
  $("#refresh-applications")?.addEventListener("click", load);
  load();
});
