(function () {
  var CONFIG = window.YAHYA_FIREBASE_CONFIG || {};
  var SESSION_KEY = "yahya_firebase_session_v1";
  var authModal = null;
  var refreshTimer = null;

  var FIREBASE_MESSAGES = {
    EMAIL_EXISTS: "هذا البريد مسجل مسبقًا. انتقل إلى تبويب «دخول» وسجّل بنفس البريد وكلمة المرور.",
    EMAIL_NOT_FOUND: "لا يوجد حساب بهذا البريد. أنشئ حسابًا جديدًا أولًا.",
    INVALID_PASSWORD: "كلمة المرور غير صحيحة.",
    INVALID_EMAIL: "البريد غير صالح لدى Firebase. اكتبه بالإنجليزية كاملًا مثل name@gmail.com.",
    MISSING_EMAIL: "أدخل البريد الإلكتروني.",
    MISSING_PASSWORD: "أدخل كلمة المرور.",
    USER_DISABLED: "هذا الحساب معطل.",
    OPERATION_NOT_ALLOWED: "تسجيل البريد وكلمة المرور غير مفعّل في Firebase.",
    CONFIGURATION_NOT_FOUND: "فعّل Email/Password من Firebase Authentication > Sign-in method.",
    API_KEY_INVALID: "apiKey غير صحيح.",
    INVALID_API_KEY: "apiKey غير صحيح."
  };

  function normalizeEmail(value) {
    return String(value || "")
      .replace(/[\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/g, "")
      .replace(/\s+/g, "")
      .replace(/\.+$/, "")
      .toLowerCase();
  }

  function apiKey() {
    var key = String(CONFIG.apiKey || "").trim();
    if (!key) throw new Error("أضف apiKey Firebase في assets/firebase-config.js لتشغيل المصادقة.");
    return key;
  }

  function firebaseMessage(code) {
    var value = String(code || "UNKNOWN");
    if (value.indexOf("WEAK_PASSWORD") === 0) return "كلمة المرور يجب أن تكون 6 أحرف على الأقل.";
    if (value.indexOf("INVALID_LOGIN_CREDENTIALS") === 0) return "البريد أو كلمة المرور غير صحيحة.";
    if (value.indexOf("TOO_MANY_ATTEMPTS_TRY_LATER") === 0) return "محاولات كثيرة. حاول لاحقًا.";
    if (value.indexOf("API key not valid") >= 0) return "apiKey غير صحيح.";
    return FIREBASE_MESSAGES[value] || "تعذر إكمال العملية. تحقق من إعداد Firebase.";
  }

  function parseJson(response) {
    return response.json().catch(function () {
      return {};
    });
  }

  function errorFrom(response, data) {
    var code = data && data.error && data.error.message
      ? data.error.message
      : (data && data.error ? String(data.error) : "UNKNOWN");
    var error = new Error(firebaseMessage(code));
    error.code = code;
    return error;
  }

  function authRequest(path, payload) {
    var key;
    try {
      key = apiKey();
    } catch (error) {
      return Promise.reject(error);
    }
    var request;
    try {
      request = fetch("https://identitytoolkit.googleapis.com/v1/" + path + "?key=" + encodeURIComponent(key), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      return Promise.reject(error);
    }
    return request.then(function (response) {
      return parseJson(response).then(function (data) {
        if (!response.ok) throw errorFrom(response, data);
        return data;
      });
    });
  }

  function tokenRequest(refreshToken) {
    var key;
    try {
      key = apiKey();
    } catch (error) {
      return Promise.reject(error);
    }
    var request;
    try {
      request = fetch("https://securetoken.googleapis.com/v1/token?key=" + encodeURIComponent(key), {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "grant_type=refresh_token&refresh_token=" + encodeURIComponent(refreshToken)
      });
    } catch (error) {
      return Promise.reject(error);
    }
    return request.then(function (response) {
      return parseJson(response).then(function (data) {
        if (!response.ok) throw errorFrom(response, data);
        return data;
      });
    });
  }

  function readSession() {
    try {
      return JSON.parse(window.localStorage.getItem(SESSION_KEY) || "null");
    } catch (error) {
      return null;
    }
  }

  function writeSession(session) {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  function clearSession() {
    if (refreshTimer) {
      window.clearTimeout(refreshTimer);
      refreshTimer = null;
    }
    try {
      window.localStorage.removeItem(SESSION_KEY);
    } catch (error) {}
  }

  function getUser() {
    var session = readSession();
    if (!session || !session.user || !session.idToken) return null;
    return session.user;
  }

  function isLoggedIn() {
    return !!getUser();
  }

  function isOwner() {
    var user = getUser();
    if (!user || !user.email) return false;
    var owners = CONFIG.ownerEmails || [];
    var email = normalizeEmail(user.email);
    for (var index = 0; index < owners.length; index += 1) {
      if (normalizeEmail(owners[index]) === email) return true;
    }
    return false;
  }

  function emit() {
    updateUI();
    if (typeof window.CustomEvent === "function") {
      window.dispatchEvent(new window.CustomEvent("yahya-auth-change", { detail: getUser() }));
    }
  }

  function buildSession(data, name, email) {
    var expiresIn = Number(data.expiresIn) || 3600;
    var session = {
      idToken: data.idToken,
      refreshToken: data.refreshToken,
      expiresAt: Date.now() + expiresIn * 1000,
      user: {
        name: name || data.displayName || String(email || data.email || "").split("@")[0],
        email: email || data.email || "",
        localId: data.localId || data.userId || ""
      }
    };
    writeSession(session);
    scheduleRefresh(session);
    return session;
  }

  function applyRefresh(data, previous) {
    var expiresIn = Number(data.expires_in) || 3600;
    var session = {
      idToken: data.id_token,
      refreshToken: data.refresh_token || previous.refreshToken,
      expiresAt: Date.now() + expiresIn * 1000,
      user: previous.user
    };
    writeSession(session);
    scheduleRefresh(session);
    return session;
  }

  function refreshSession(refreshToken) {
    return tokenRequest(refreshToken).then(function (data) {
      var previous = readSession();
      if (!previous || !previous.user) throw new Error("انتهت الجلسة. سجّل الدخول من جديد.");
      var session = applyRefresh(data, previous);
      emit();
      return session.user;
    });
  }

  function scheduleRefresh(session) {
    if (!session || !session.refreshToken) return;
    if (refreshTimer) window.clearTimeout(refreshTimer);
    var delay = Math.max(60000, (Number(session.expiresAt) || 0) - Date.now() - 300000);
    refreshTimer = window.setTimeout(function () {
      refreshSession(session.refreshToken).catch(function () {
        clearSession();
        emit();
      });
    }, delay);
  }

  function isFatalRefreshError(error) {
    var code = String(error && (error.code || error.error || error.message) || "");
    return /TOKEN_EXPIRED|INVALID_REFRESH_TOKEN|USER_DISABLED|USER_NOT_FOUND|INVALID_ID_TOKEN|INVALID_IDP_RESPONSE|INVALID_GRANT/.test(code);
  }

  function restoreSession() {
    var session = readSession();
    if (!session || !session.refreshToken || !session.user) return Promise.resolve(null);
    if (session.expiresAt && session.expiresAt > Date.now() + 60000) {
      scheduleRefresh(session);
      return Promise.resolve(session.user);
    }
    return refreshSession(session.refreshToken).then(function (user) {
      return user;
    }).catch(function (error) {
      if (isFatalRefreshError(error)) {
        clearSession();
        return null;
      }
      scheduleRefresh(session);
      return session.user;
    });
  }

  function setMessage(message, type) {
    if (!authModal) return;
    var box = authModal.querySelector("#authMessage");
    if (!box) return;
    box.textContent = message || "";
    box.className = "auth-message" + (type ? " " + type : "");
  }

  function setMode(mode) {
    if (!authModal) return;
    var user = getUser();
    var forms = authModal.querySelector(".auth-forms");
    var account = authModal.querySelector(".auth-account");
    var tabs = authModal.querySelector(".auth-tabs");
    var title = authModal.querySelector("#authTitle");
    if (forms) forms.hidden = !!user;
    if (account) account.hidden = !user;
    if (tabs) tabs.hidden = !!user;
    if (user) {
      if (title) title.textContent = "حسابك في الموقع";
      var name = authModal.querySelector("#authUserName");
      var email = authModal.querySelector("#authUserEmail");
      var ownerBadge = authModal.querySelector("#authOwnerBadge");
      var adminLink = authModal.querySelector("#authAdminLink");
      if (name) name.textContent = user.name || "";
      if (email) email.textContent = user.email || "";
      if (ownerBadge) ownerBadge.hidden = !isOwner();
      if (adminLink) adminLink.hidden = !isOwner();
      return;
    }
    if (title) title.textContent = mode === "register" ? "إنشاء حساب جديد" : "تسجيل الدخول";
    Array.prototype.forEach.call(authModal.querySelectorAll("[data-auth-tab]"), function (button) {
      var active = button.getAttribute("data-auth-tab") === mode;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", active ? "true" : "false");
    });
    var loginForm = authModal.querySelector("#loginForm");
    var registerForm = authModal.querySelector("#registerForm");
    if (loginForm) loginForm.hidden = mode === "register";
    if (registerForm) registerForm.hidden = mode !== "register";
    setMessage("", "");
  }

  function close() {
    if (!authModal) return;
    authModal.hidden = true;
    document.body.classList.remove("modal-open");
  }

  function open(mode) {
    buildModal();
    if (!authModal) return;
    var target = mode || (getUser() ? "account" : "login");
    authModal.hidden = false;
    document.body.classList.add("modal-open");
    setMode(target);
    if (!String(CONFIG.apiKey || "").trim() && !getUser()) {
      setMessage("أضف apiKey Firebase في assets/firebase-config.js لتشغيل المصادقة.", "error");
    }
    var firstInput = authModal.querySelector(target === "register" ? "#authRegisterName" : "#authLoginEmail");
    if (firstInput && !getUser()) window.setTimeout(function () { firstInput.focus(); }, 80);
  }

  function register(name, email, password) {
    return new Promise(function (resolve, reject) {
      name = String(name || "").trim();
      email = normalizeEmail(email);
      password = String(password || "");
      if (name.length < 2) return reject(new Error("أدخل اسمًا من حرفين على الأقل."));
      if (!email) return reject(new Error("أدخل البريد الإلكتروني."));
      if (password.length < 6) return reject(new Error("كلمة المرور يجب أن تكون 6 أحرف على الأقل."));
      authRequest("accounts:signUp", {
        email: email,
        password: password,
        returnSecureToken: true
      }).then(function (data) {
        return authRequest("accounts:update", {
          idToken: data.idToken,
          displayName: name,
          returnSecureToken: true
        }).then(function (profile) {
          return { signUp: data, profile: profile };
        }).catch(function () {
          return { signUp: data, profile: null };
        });
      }).then(function (result) {
        var data = result.profile || result.signUp;
        var displayName = result.profile && result.profile.displayName ? result.profile.displayName : name;
        var session = buildSession(data, displayName, email);
        emit();
        if (window.YahyaAnalytics) window.YahyaAnalytics.trackRegistration();
        resolve(session.user);
      }).catch(reject);
    });
  }

  function resetPassword(email) {
    return new Promise(function (resolve, reject) {
      email = normalizeEmail(email);
      if (!email) return reject(new Error("أدخل البريد الإلكتروني أولًا."));
      authRequest("accounts:sendOobCode", {
        requestType: "PASSWORD_RESET",
        email: email
      }).then(function () {
        resolve(email);
      }).catch(reject);
    });
  }

  function login(email, password) {
    return new Promise(function (resolve, reject) {
      email = normalizeEmail(email);
      password = String(password || "");
      if (!email || !password) return reject(new Error("أدخل البريد وكلمة المرور."));
      authRequest("accounts:signInWithPassword", {
        email: email,
        password: password,
        returnSecureToken: true
      }).then(function (data) {
        var name = data.displayName || email.split("@")[0];
        var session = buildSession(data, name, data.email || email);
        emit();
        resolve(session.user);
      }).catch(reject);
    });
  }

  function logout() {
    clearSession();
    emit();
    setMode("login");
    setMessage("تم تسجيل الخروج.", "success");
  }

  function buildModal() {
    if (authModal || !document.body) return;
    authModal = document.createElement("div");
    authModal.className = "auth-modal";
    authModal.id = "authModal";
    authModal.hidden = true;
    authModal.innerHTML =
      '<div class="app-modal-backdrop" data-auth-close></div>' +
      '<div class="auth-panel" role="dialog" aria-modal="true" aria-labelledby="authTitle">' +
        '<button class="modal-close" type="button" data-auth-close aria-label="إغلاق نافذة الحساب">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>' +
        '</button>' +
        '<span class="eyebrow">حساب الموقع</span>' +
        '<h2 id="authTitle">تسجيل الدخول</h2>' +
        '<div class="auth-tabs" role="tablist" aria-label="دخول أو تسجيل">' +
          '<button class="auth-tab active" type="button" data-auth-tab="login" role="tab" aria-selected="true">دخول</button>' +
          '<button class="auth-tab" type="button" data-auth-tab="register" role="tab" aria-selected="false">تسجيل جديد</button>' +
        '</div>' +
        '<div class="auth-forms">' +
          '<form id="loginForm" class="auth-form" novalidate>' +
            '<label for="authLoginEmail">البريد الإلكتروني</label>' +
            '<input id="authLoginEmail" type="text" autocomplete="email" inputmode="email" autocapitalize="none" spellcheck="false" dir="ltr" placeholder="name@gmail.com" required>' +
            '<p class="auth-hint">استخدم بريدك الشخصي نفسه عند الدخول.</p>' +
            '<label for="authLoginPassword">كلمة المرور</label>' +
            '<input id="authLoginPassword" type="password" autocomplete="current-password" required>' +
            '<button class="btn" type="submit">تسجيل الدخول</button>' +
            '<button class="auth-link" type="button" id="authForgotPassword">نسيت كلمة المرور؟</button>' +
          '</form>' +
          '<form id="registerForm" class="auth-form" novalidate hidden>' +
            '<label for="authRegisterName">الاسم</label>' +
            '<input id="authRegisterName" type="text" autocomplete="name" required>' +
            '<label for="authRegisterEmail">البريد الإلكتروني</label>' +
            '<input id="authRegisterEmail" type="text" autocomplete="email" inputmode="email" autocapitalize="none" spellcheck="false" dir="ltr" placeholder="name@gmail.com" required>' +
            '<p class="auth-hint">أي بريد شخصي يعمل: Gmail أو Yahoo أو Hotmail أو غيرها.</p>' +
            '<label for="authRegisterPassword">كلمة المرور</label>' +
            '<input id="authRegisterPassword" type="password" autocomplete="new-password" required>' +
            '<button class="btn" type="submit">إنشاء الحساب</button>' +
          '</form>' +
        '</div>' +
        '<div class="auth-account" hidden>' +
          '<span class="owner-badge" id="authOwnerBadge" hidden>مالك الموقع</span>' +
          '<p>مسجل الدخول باسم <strong id="authUserName"></strong></p>' +
          '<p class="muted" id="authUserEmail" dir="ltr"></p>' +
          '<div class="auth-account-actions">' +
            '<a class="btn btn-ghost" id="authAdminLink" href="admin.html" hidden>لوحة الإدارة</a>' +
            '<button class="btn btn-ghost" type="button" id="authLogout">تسجيل الخروج</button>' +
          '</div>' +
        '</div>' +
        '<p class="auth-message" id="authMessage" role="status" aria-live="polite"></p>' +
        '<p class="muted auth-note">تتم المصادقة عبر Firebase.</p>' +
      '</div>';
    document.body.appendChild(authModal);

    Array.prototype.forEach.call(authModal.querySelectorAll("[data-auth-close]"), function (button) {
      button.addEventListener("click", close);
    });
    Array.prototype.forEach.call(authModal.querySelectorAll("[data-auth-tab]"), function (button) {
      button.addEventListener("click", function () {
        setMode(button.getAttribute("data-auth-tab"));
      });
    });
    var loginForm = authModal.querySelector("#loginForm");
    var registerForm = authModal.querySelector("#registerForm");
    var logoutButton = authModal.querySelector("#authLogout");
    if (loginForm) {
      loginForm.addEventListener("submit", function (event) {
        event.preventDefault();
        var email = authModal.querySelector("#authLoginEmail").value;
        var password = authModal.querySelector("#authLoginPassword").value;
        var submit = loginForm.querySelector("button[type=submit]");
        if (submit) submit.disabled = true;
        setMessage("جارٍ تسجيل الدخول...", "");
        login(email, password).then(function (user) {
          setMessage("مرحبًا " + user.name + "، تم تسجيل الدخول.", "success");
          window.setTimeout(close, 500);
        }).catch(function (error) {
          setMessage(error.message, "error");
        }).then(function () {
          if (submit) submit.disabled = false;
        });
      });
    }
    var forgotPassword = authModal.querySelector("#authForgotPassword");
    if (forgotPassword) {
      forgotPassword.addEventListener("click", function () {
        var email = authModal.querySelector("#authLoginEmail").value;
        forgotPassword.disabled = true;
        setMessage("جارٍ إرسال رابط استعادة كلمة المرور...", "");
        resetPassword(email).then(function (sentTo) {
          setMessage("أرسلنا رابط الاستعادة إلى " + sentTo + ". تحقق من البريد الوارد والسبام.", "success");
        }).catch(function (error) {
          setMessage(error.message, "error");
        }).then(function () {
          forgotPassword.disabled = false;
        });
      });
    }
    if (registerForm) {
      registerForm.addEventListener("submit", function (event) {
        event.preventDefault();
        var name = authModal.querySelector("#authRegisterName").value;
        var email = authModal.querySelector("#authRegisterEmail").value;
        var password = authModal.querySelector("#authRegisterPassword").value;
        var submit = registerForm.querySelector("button[type=submit]");
        if (submit) submit.disabled = true;
        setMessage("جارٍ إنشاء الحساب...", "");
        register(name, email, password).then(function (user) {
          setMessage("تم إنشاء الحساب، مرحبًا " + user.name + ".", "success");
          window.setTimeout(close, 600);
        }).catch(function (error) {
          if (error.code === "EMAIL_EXISTS") {
            var loginEmail = authModal.querySelector("#authLoginEmail");
            if (loginEmail) loginEmail.value = normalizeEmail(email);
            setMode("login");
            setMessage("هذا البريد مسجل مسبقًا. أدخل كلمة المرور ثم اضغط «تسجيل الدخول»، أو استخدم «نسيت كلمة المرور؟».", "error");
          } else {
            setMessage(error.message, "error");
          }
        }).then(function () {
          if (submit) submit.disabled = false;
        });
      });
    }
    if (logoutButton) {
      logoutButton.addEventListener("click", logout);
    }
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && authModal && !authModal.hidden) close();
    });
  }

  function updateUI() {
    var user = getUser();
    Array.prototype.forEach.call(document.querySelectorAll("[data-account-button]"), function (button) {
      button.textContent = user ? (isOwner() ? "حسابي · مالك" : "حسابي") : "تسجيل الدخول";
      button.setAttribute("aria-label", user ? (isOwner() ? "حساب المالك " + user.name : "حساب " + user.name) : "تسجيل الدخول إلى الموقع");
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-auth-gate]"), function (element) {
      element.hidden = !!user;
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-auth-user]"), function (element) {
      element.textContent = user ? user.name : "";
    });
    if (authModal && !authModal.hidden) setMode(user ? "account" : "login");
  }

  function bindAccountButtons() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-account-button]"), function (button) {
      if (button.getAttribute("data-auth-bound") === "1") return;
      button.setAttribute("data-auth-bound", "1");
      button.addEventListener("click", function () {
        open(getUser() ? "account" : "login");
      });
    });
  }

  function clearLegacyStorage() {
    try {
      window.localStorage.removeItem("yahya_site_users_v1");
      window.localStorage.removeItem("yahya_site_session_v1");
    } catch (error) {}
  }

  function init() {
    buildModal();
    bindAccountButtons();
    clearLegacyStorage();
    var cached = readSession();
    if (cached && cached.user && cached.idToken) {
      scheduleRefresh(cached);
    }
    window.addEventListener("storage", function (event) {
      if (event.key === SESSION_KEY) updateUI();
    });
    if (cached && cached.user) {
      updateUI();
    }
    restoreSession().then(function () {
      emit();
    }).catch(function () {
      emit();
    });
  }

  window.YahyaAuth = {
    register: register,
    login: login,
    resetPassword: resetPassword,
    logout: logout,
    getUser: getUser,
    isLoggedIn: isLoggedIn,
    isOwner: isOwner,
    open: open,
    close: close,
    updateUI: updateUI
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
