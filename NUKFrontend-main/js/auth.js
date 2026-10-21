/* Authentication uses short-lived tokens in sessionStorage only. */
const Auth = (() => {
  const K = "nuk_session";
  const ACCESS = "nuk_access_token";
  const REFRESH = "nuk_refresh_token";
  const HOME = {
    customer: "customer-dashboard.html",
    provider: "provider-dashboard.html",
    admin: "admin-dashboard.html",
    owner: "owner-dashboard.html"
  };
  const user = () => { try { return JSON.parse(sessionStorage.getItem(K)); } catch { return null; } };
  const token = () => sessionStorage.getItem(ACCESS);
  const acceptSession = payload => {
    const data = payload?.data || payload;
    if (!data?.user || !data?.accessToken) throw new Error("The server did not return a valid login session.");
    sessionStorage.setItem(K, JSON.stringify({
      id: data.user.id || data.user._id,
      name: data.user.name,
      email: data.user.email,
      role: data.user.role,
      location: data.user.location
    }));
    sessionStorage.setItem(ACCESS, data.accessToken);
    if (data.refreshToken) sessionStorage.setItem(REFRESH, data.refreshToken);
    return user();
  };
  const clear = () => {
    sessionStorage.removeItem(K);
    sessionStorage.removeItem(ACCESS);
    sessionStorage.removeItem(REFRESH);
  };
  const safeNext = n => (/^[\w-]+\.html(\?[\w=&%.-]*)?$/.test(n || "") ? n : null);
  return {
    user, token, HOME, acceptSession,
    require(role) {
      const current = user();
      if (!current || (role && current.role !== role && !(role === "provider" && current.role === "owner"))) {
        location.href = (role === "admin" ? "admin-login.html" : "login.html") + "?next=" + encodeURIComponent(location.pathname.split("/").pop() + location.search);
        return null;
      }
      return current;
    },
    expire() {
      clear();
      if (!/login\.html$/.test(location.pathname)) location.href = "login.html?expired=1";
    },
    async login(identifier, password) {
      const data = await API.auth.login({ email: identifier.trim(), password });
      return acceptSession(data);
    },
    demoLogin(role) {
      const demoUser = DEMO.users[role];
      sessionStorage.setItem(K, JSON.stringify(demoUser));
      return demoUser;
    },
    async logout() {
      try { if (!CONFIG.DEMO_MODE && token()) await API.auth.logout(); } catch (_) {}
      clear();
      location.href = "index.html";
    },
    safeNext
  };
})();

document.addEventListener("DOMContentLoaded", () => {
  const lf = document.getElementById("login-form");
  const rf = document.getElementById("register-form");
  const dm = document.getElementById("demo-login");
  const next = Auth.safeNext(new URLSearchParams(location.search).get("next"));
  if (new URLSearchParams(location.search).get("expired")) toast("Your session expired. Please log in again.", "error");

  if (dm && CONFIG.DEMO_MODE) {
    dm.hidden = false;
    dm.addEventListener("click", e => {
      const b = e.target.closest("[data-role]");
      if (!b) return;
      const u = Auth.demoLogin(b.dataset.role);
      location.href = next || Auth.HOME[u.role] || "index.html";
    });
  }

  if (lf) lf.addEventListener("submit", async e => {
    e.preventDefault();
    const err = document.getElementById("login-err");
    err.textContent = "";
    if (!lf.reportValidity()) return;
    const button = lf.querySelector('button[type="submit"]');
    setBusy(button, true, "Logging in…");
    try {
      const u = await Auth.login(lf.identifier.value, lf.password.value);
      lf.password.value = "";
      location.href = next || Auth.HOME[u.role] || "index.html";
    } catch (error) {
      err.textContent = error.message;
      setBusy(button, false);
    }
  });

  let registrationVerificationToken = "";
  let registrationVerifiedEmail = "";
  const otpStatus = document.getElementById("register-otp-status");
  if (rf && otpStatus) {
    rf.email.addEventListener("input", () => { registrationVerificationToken = ""; registrationVerifiedEmail = ""; otpStatus.textContent = "Email changed. Verify this address again."; otpStatus.className = "mute"; });
    document.getElementById("register-send-otp").addEventListener("click", async () => {
      const email = rf.email.value.trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(email)) { otpStatus.textContent = "Enter a valid email first."; otpStatus.className = "err"; return; }
      const button = document.getElementById("register-send-otp"); setBusy(button, true, "Sending…");
      try { await API.req("auth/send-otp", { method: "POST", body: { email, purpose: "customer-registration" } }); otpStatus.textContent = "OTP sent. Check your inbox and spam folder."; otpStatus.className = "okmsg"; }
      catch (error) { otpStatus.textContent = error.message; otpStatus.className = "err"; } finally { setBusy(button, false); }
    });
    document.getElementById("register-verify-otp").addEventListener("click", async () => {
      const email = rf.email.value.trim().toLowerCase(), otp = document.getElementById("register-otp").value.trim();
      if (!/^\d{6}$/.test(otp)) { otpStatus.textContent = "Enter the six-digit OTP."; otpStatus.className = "err"; return; }
      const button = document.getElementById("register-verify-otp"); setBusy(button, true, "Verifying…");
      try { const result = await API.req("auth/verify-otp", { method: "POST", body: { email, otp, purpose: "customer-registration" } }); registrationVerificationToken = result.verificationToken; registrationVerifiedEmail = email; otpStatus.textContent = "Email verified successfully."; otpStatus.className = "okmsg"; }
      catch (error) { registrationVerificationToken = ""; registrationVerifiedEmail = ""; otpStatus.textContent = error.message; otpStatus.className = "err"; } finally { setBusy(button, false); }
    });
  }

  if (rf) rf.addEventListener("submit", async e => {
    e.preventDefault();
    const err = document.getElementById("register-err");
    err.textContent = "";
    if (!rf.reportValidity()) return;
    if (rf.password.value.length < 8) { err.textContent = "Use at least 8 characters for your password."; return; }
    if (!registrationVerificationToken || registrationVerifiedEmail !== rf.email.value.trim().toLowerCase()) { err.textContent = "Verify your email address before creating your account."; return; }
    const button = rf.querySelector('button[type="submit"]');
    setBusy(button, true, "Creating account…");
    try {
      await API.auth.register({
        name: rf.name.value.trim(),
        email: rf.email.value.trim(),
        phone: rf.mobile.value.trim(),
        location: rf.city.value,
        password: rf.password.value,
        emailVerificationToken: registrationVerificationToken,
        role: rf.accountType ? rf.accountType.value : "customer"
      });
      rf.password.value = "";
      location.href = "login.html?registered=1";
    } catch (error) {
      err.textContent = error.message;
      setBusy(button, false);
    }
  });
});


/* NUK RentServe — Google Sign-In */

function initializeGoogleSignIn() {
  const buttonContainer = document.getElementById("google-signin-button");

  if (!buttonContainer) return;

  if (!window.google || !google.accounts || !google.accounts.id) {
    buttonContainer.textContent =
      "Google Sign-In could not load. Please refresh the page.";
    return;
  }

  google.accounts.id.initialize({
    client_id: "YOUR_GOOGLE_CLIENT_ID",
    callback: handleGoogleSignIn,
    auto_select: false
  });

  google.accounts.id.renderButton(buttonContainer, {
    theme: "outline",
    size: "large",
    text: "continue_with",
    shape: "rectangular",
    width: 300
  });
}

async function handleGoogleSignIn(response) {
  const errorElement = document.getElementById("google-login-error");
  const buttonContainer = document.getElementById("google-signin-button");

  if (errorElement) errorElement.textContent = "";

  try {
    if (!response || !response.credential) {
      throw new Error("Google did not return a valid credential.");
    }

    if (buttonContainer) {
      buttonContainer.style.pointerEvents = "none";
    }

    const result = await API.req("auth/google", {
      method: "POST",
      body: {
        credential: response.credential
      }
    });

    const user = Auth.acceptSession(result);

    const params = new URLSearchParams(window.location.search);
    const next = Auth.safeNext(params.get("next"));

    window.location.href =
      next || Auth.HOME[user.role] || "index.html";
  } catch (error) {
    if (errorElement) {
      errorElement.textContent =
        error.message || "Google Sign-In failed. Please try again.";
    } else {
      alert(error.message || "Google Sign-In failed. Please try again.");
    }

    if (buttonContainer) {
      buttonContainer.style.pointerEvents = "";
    }
  }
}

function waitForGoogleSignIn() {
  if (window.google?.accounts?.id) {
    initializeGoogleSignIn();
    return;
  }

  let attempts = 0;

  const timer = setInterval(() => {
    attempts++;

    if (window.google?.accounts?.id) {
      clearInterval(timer);
      initializeGoogleSignIn();
    } else if (attempts >= 30) {
      clearInterval(timer);

      const container = document.getElementById("google-signin-button");
      if (container) {
        container.textContent =
          "Google Sign-In unavailable. Refresh and try again.";
      }
    }
  }, 200);
}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    waitForGoogleSignIn
  );
} else {
  waitForGoogleSignIn();
}
