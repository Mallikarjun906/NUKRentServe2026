
document.addEventListener("DOMContentLoaded", () => {
  const f = $("#pf");
  const AGE =
    "You must be at least 18 years old to register as a service provider.";

  const STEPS = [
    ["fullName", "dob", "mobile", "email", "password", "address"],
    ["city", "category", "experience", "description", "area"],
    ["aadhaarDocument"],
    ["consent", "terms"],
  ];

  const len = (n, message) => (v) =>
    v.trim().length < n ? message : "";

  const fileOk = (el) => {
    const file = el.files[0];

    // Aadhaar image is optional for testing.
    if (!file) return "";

    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];

    if (!allowedTypes.includes(file.type)) {
      return "Use a JPG, PNG or PDF document.";
    }

    if (file.size > CONFIG.MAX_UPLOAD_MB * 1048576) {
      return `Image must be under ${CONFIG.MAX_UPLOAD_MB} MB.`;
    }

    return "";
  };

  const R = {
    fullName: len(3, "Enter your full legal name"),

    dob: (v) =>
      !v
        ? "Select your date of birth"
        : age(v) < CONFIG.MIN_AGE
          ? AGE
          : "",

    mobile: (v) =>
      /^[6-9]\d{9}$/.test(v)
        ? ""
        : "Enter a valid 10-digit mobile number",

    email: (v) =>
      /^\S+@\S+\.\S+$/.test(v)
        ? ""
        : "Enter a valid email address",

    password: (v) =>
      v.length < 8 ? "Use at least 8 characters" : "",

    address: len(8, "Enter your address"),

    city: (v) =>
      CONFIG.CITIES.includes(v) ? "" : "Choose a supported city",

    category: (v) => (v ? "" : "Choose a category"),

    experience: len(1, "Enter your experience"),

    description: len(
      10,
      "Describe your services (at least 10 characters)"
    ),

    area: len(2, "Enter your service area"),
  };

  let step = 0;
  let emailVerificationToken = "";
  let verifiedEmail = "";
  const otpStatus = document.getElementById("otp-status");
  const emailInput = f.elements.email;
  emailInput.addEventListener("input", () => { emailVerificationToken = ""; verifiedEmail = ""; if (otpStatus) { otpStatus.textContent = "Email changed. Verify this address again."; otpStatus.className = "mute"; } });
  document.getElementById("send-otp").addEventListener("click", async () => {
    const email = emailInput.value.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) { otpStatus.textContent = "Enter a valid email address first."; otpStatus.className = "err"; return; }
    const button = document.getElementById("send-otp"); setBusy(button, true, "Sending…");
    try { await API.req("auth/send-otp", { method: "POST", body: { email, purpose: "provider-registration" } }); otpStatus.textContent = "OTP sent. Check your inbox and spam folder. It expires in 5 minutes."; otpStatus.className = "okmsg"; }
    catch (error) { otpStatus.textContent = error.message; otpStatus.className = "err"; } finally { setBusy(button, false); }
  });
  document.getElementById("verify-otp").addEventListener("click", async () => {
    const email = emailInput.value.trim().toLowerCase(); const otp = document.getElementById("email-otp").value.trim();
    if (!/^\d{6}$/.test(otp)) { otpStatus.textContent = "Enter the six-digit OTP."; otpStatus.className = "err"; return; }
    const button = document.getElementById("verify-otp"); setBusy(button, true, "Verifying…");
    try { const result = await API.req("auth/verify-otp", { method: "POST", body: { email, otp, purpose: "provider-registration" } }); emailVerificationToken = result.verificationToken; verifiedEmail = email; otpStatus.textContent = "Email verified successfully."; otpStatus.className = "okmsg"; }
    catch (error) { emailVerificationToken = ""; verifiedEmail = ""; otpStatus.textContent = error.message; otpStatus.className = "err"; } finally { setBusy(button, false); }
  });

  function show(n) {
    step = n;

    $$(".step", f).forEach((section, i) =>
      section.classList.toggle("on", i === n)
    );

    $$("#steps li").forEach((item, i) => {
      item.classList.toggle("on", i === n);
      item.classList.toggle("dn", i < n);
    });

    $("#back").hidden = !n;
    $("#next").textContent =
      n === 3 ? "Submit application" : "Continue";

    window.scrollTo(0, 0);
  }

  function check(i) {
    let valid = true;

    STEPS[i].forEach((name) => {
      const el = f.elements[name];
      const output = $("#e-" + name);

      let message = "";

      if (name === "aadhaarDocument") {
        message = fileOk(el);
      } else if (el.type === "checkbox") {
        // Aadhaar consent is optional when no document is uploaded.
        if (name === "consent" && !f.elements.aadhaarDocument.files.length) {
          message = "";
        } else {
          message = el.checked ? "" : "This is required";
        }
      } else {
        message = R[name](el.value);
      }

      if (output) output.textContent = message;
      if (message) valid = false;
    });

    return valid;
  }

  f.elements.aadhaarDocument.addEventListener("change", () => {
    const output = $("#e-aadhaarDocument");
    if (output) output.textContent = fileOk(f.elements.aadhaarDocument);

    // If no image is selected, document consent is not required.
    if (!f.elements.aadhaarDocument.files.length) {
      $("#e-consent").textContent = "";
    }
  });

  f.elements.dob.addEventListener("input", (event) => {
    const message = $("#agemsg");
    const value = event.target.value;
    const years = value ? age(value) : -1;

    message.className =
      years >= 0 && years < CONFIG.MIN_AGE ? "err" : "okmsg";

    message.textContent = !value
      ? ""
      : years < CONFIG.MIN_AGE
        ? AGE
        : `Age ${years}: you meet the age requirement.`;
  });

  $("#back").addEventListener("click", () => show(step - 1));

  $("#next").addEventListener("click", async () => {
    if (!check(step)) return;

    if (step < 3) {
      show(step + 1);
      return;
    }

    for (let i = 0; i < 3; i++) {
      if (!check(i)) {
        show(i);
        return;
      }
    }

    const button = $("#next");
    setBusy(button, true, "Submitting application…");
    $("#form-err").textContent = "";

    try {
      const payload = new FormData();

      payload.append("fullName", f.elements.fullName.value.trim());
      payload.append("dob", f.elements.dob.value);
      payload.append("phone", f.elements.mobile.value.trim());
      payload.append("email", f.elements.email.value.trim());
      if (!emailVerificationToken || verifiedEmail !== f.elements.email.value.trim().toLowerCase()) throw new Error("Verify your email address before submitting your application.");
      payload.append("emailVerificationToken", emailVerificationToken);
      payload.append("password", f.elements.password.value);
      payload.append("address", f.elements.address.value.trim());
      payload.append("city", f.elements.city.value);
      payload.append("category", f.elements.category.value);
      payload.append("experience", f.elements.experience.value.trim());
      payload.append("area", f.elements.area.value.trim());
      payload.append("price", f.elements.priceRange.value.trim());
      payload.append("description", f.elements.description.value.trim());
      payload.append("consent", f.elements.consent.checked ? "true" : "false");
      payload.append("terms", f.elements.terms.checked ? "true" : "false");

      // Append the image only when the user selects one.
      const aadhaarFile = f.elements.aadhaarDocument.files[0];

      if (aadhaarFile) {
        payload.append("aadhaarDocument", aadhaarFile);
      }

      const result = await API.registerProvider(payload);

      if (result && result.accessToken) {
        Auth.acceptSession(result);
      }

      f.elements.password.value = "";
      f.hidden = true;
      $("#steps").hidden = true;
      $("#done").hidden = false;
      $("#done-demo").hidden = !CONFIG.DEMO_MODE;

      window.scrollTo(0, 0);
    } catch (error) {
      $("#form-err").textContent = error.message;
      setBusy(button, false);
    }
  });

  show(0);
});
