(function () {
  var USERS_KEY = "yahya_site_users_v1";
  var SESSION_KEY = "yahya_site_session_v1";
  var authModal = null;

  function readUsers() {
    try {
      return JSON.parse(window.localStorage.getItem(USERS_KEY) || "{}") || {};
    } catch (error) {
      return {};
    }
  }

  function writeUsers(users) {
    window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function normalizeEmail(value) {
    return String(value || "").trim().toLowerCase();
  }

  function toHex(bytes) {
    var output = "";
    for (var index = 0; index < bytes.length; index += 1) {
      output += ("0" + bytes[index].toString(16)).slice(-2);
    }
    return output;
  }

  function randomSalt() {
    if (window.crypto && window.crypto.getRandomValues) {
      var values = new Uint8Array(16);
      window.crypto.getRandomValues(values);
      return toHex(values);
    }
    return "salt-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  function fallbackHash(value) {
    var hash = 2166136261;
    for (var index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = (hash * 16777619) >>> 0;
    }
    return "fallback-" + (hash >>> 0).toString(16);
  }

  function hashPassword(password, salt) {
    if (window.crypto && window.crypto.subtle && window.TextEncoder) {
      var encoder = new TextEncoder();
      return window.crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits"]
      ).then(function (key) {
        return window.crypto.subtle.deriveBits(
          { name: "PBKDF2", salt: encoder.encode(salt), iterations: 120000, hash: "SHA-256" },
          key,
          256
        );
      }).then(function (bits) {
        return toHex(new Uint8Array(bits));
      });
    }
    return Promise.resolve(fallbackHash(salt + ":" + password));
  }

  function getSession() {
    try {
      return JSON.parse(window.localStorage.getItem(SESSION_KEY) || "null");
    } catch (error) {
      return null;
    }
  }

  function setSession(user) {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  }

  function clearSession() {
    window.localStorage.removeItem(SESSION_KEY);
  }

  function getUser() {
    var session = getSession();
    if (!session || !session.email) return null;
    return session;
  }

  function isLoggedIn() {
    return !!getUser();
  }

  function emit() {
    updateUI();
    if (typeof window.CustomEvent === "function") {
      window.dispatchEvent(new window.CustomEvent("yahya-auth-change", { detail: getUser() }));
    }
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
      if (name) name.textContent = user.name || "";
      if (email) email.textContent = user.email || "";
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
    var firstInput = authModal.querySelector(target === "register" ? "#authRegisterName" : "#authLoginEmail");
    if (firstInput && !getUser()) window.setTimeout(function () { firstInput.focus(); }, 80);
  }

  function register(name, email, password) {
    return new Promise(function (resolve, reject) {
      name = String(name || "").trim();
      email = normalizeEmail(email);
      password = String(password || "");
      if (name.length < 2) return reject(new Error("أدخل اسمًا من حرفين على الأقل."));
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reject(new Error("أدخل بريدًا إلكترونيًا صحيحًا."));
      if (password.length < 6) return reject(new Error("كلمة المرور يجب أن تكون 6 أحرف على الأقل."));
      var users = readUsers();
      if (users[email]) return reject(new Error("هذا البريد مسجل مسبقًا. جرّب تسجيل الدخول."));
      var salt = randomSalt();
      hashPassword(password, salt).then(function (hash) {
        users[email] = {
          name: name,
          email: email,
          salt: salt,
          hash: hash,
          createdAt: Date.now()
        };
        writeUsers(users);
        var session = { name: name, email: email, loginAt: Date.now() };
        setSession(session);
        emit();
        resolve(session);
      }).catch(reject);
    });
  }

  function login(email, password) {
    return new Promise(function (resolve, reject) {
      email = normalizeEmail(email);
      password = String(password || "");
      var users = readUsers();
      var user = users[email];
      if (!user) return reject(new Error("لا يوجد حساب بهذا البريد."));
      hashPassword(password, user.salt).then(function (hash) {
        if (hash !== user.hash) return reject(new Error("كلمة المرور غير صحيحة."));
        var session = { name: user.name, email: user.email, loginAt: Date.now() };
        setSession(session);
        emit();
        resolve(session);
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
            '<input id="authLoginEmail" type="email" autocomplete="email" required>' +
            '<label for="authLoginPassword">كلمة المرور</label>' +
            '<input id="authLoginPassword" type="password" autocomplete="current-password" required>' +
            '<button class="btn" type="submit">تسجيل الدخول</button>' +
          '</form>' +
          '<form id="registerForm" class="auth-form" novalidate hidden>' +
            '<label for="authRegisterName">الاسم</label>' +
            '<input id="authRegisterName" type="text" autocomplete="name" required>' +
            '<label for="authRegisterEmail">البريد الإلكتروني</label>' +
            '<input id="authRegisterEmail" type="email" autocomplete="email" required>' +
            '<label for="authRegisterPassword">كلمة المرور</label>' +
            '<input id="authRegisterPassword" type="password" autocomplete="new-password" required>' +
            '<button class="btn" type="submit">إنشاء الحساب</button>' +
          '</form>' +
        '</div>' +
        '<div class="auth-account" hidden>' +
          '<p>مسجل الدخول باسم <strong id="authUserName"></strong></p>' +
          '<p class="muted" id="authUserEmail" dir="ltr"></p>' +
          '<button class="btn btn-ghost" type="button" id="authLogout">تسجيل الخروج</button>' +
        '</div>' +
        '<p class="auth-message" id="authMessage" role="status" aria-live="polite"></p>' +
        '<p class="muted auth-note">التسجيل محلي على هذا الجهاز ولا يُرسل إلى خادم.</p>' +
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
          setMessage(error.message, "error");
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
      button.textContent = user ? "حسابي" : "تسجيل الدخول";
      button.setAttribute("aria-label", user ? "حساب " + user.name : "تسجيل الدخول إلى الموقع");
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

  function init() {
    buildModal();
    bindAccountButtons();
    updateUI();
  }

  window.YahyaAuth = {
    register: register,
    login: login,
    logout: logout,
    getUser: getUser,
    isLoggedIn: isLoggedIn,
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
