(function () {
  var section = document.getElementById("reactions");
  if (!section) return;

  var STORAGE_KEY = "yahya_reactions_v1";
  var NOTIFICATION_KEY = "yahya_notification_events_v1";
  var SESSION_KEY = "yahya_firebase_session_v1";
  var config = window.YAHYA_FIREBASE_CONFIG || {};
  var defaults = { like: 0, love: 0, heart: 0, fire: 0, clap: 0, wow: 0 };
  var labels = { like: "إعجاب", love: "حب", heart: "قلب", fire: "رائع", clap: "تصفيق", wow: "مذهل" };
  var base = "https://firestore.googleapis.com/v1/projects/" + encodeURIComponent(config.projectId || "") + "/databases/(default)/documents";
  var counts = {};
  var comments = [];
  var votes = {};
  var remoteReady = false;
  var attachSticker = false;

  var reactionBar = document.getElementById("reactionBar");
  var commentForm = document.getElementById("reactionCommentForm");
  var commentInput = document.getElementById("reactionCommentInput");
  var commentList = document.getElementById("reactionComments");
  var statusBox = document.getElementById("reactionStatus");
  var stickerBtn = document.getElementById("reactionStickerBtn");
  var loginBtn = document.getElementById("reactionLoginBtn");

  function hasOwn(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
  }

  function numberOrZero(value) {
    var number = Number(value);
    return isFinite(number) && number > 0 ? Math.floor(number) : 0;
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[character];
    });
  }

  function getToken() {
    try {
      var session = JSON.parse(window.localStorage.getItem(SESSION_KEY) || "null");
      if (session && session.idToken && (!session.expiresAt || session.expiresAt > Date.now() + 30000)) return session.idToken;
    } catch (error) {}
    return "";
  }

  function currentUser() {
    return window.YahyaAuth && window.YahyaAuth.getUser ? window.YahyaAuth.getUser() : null;
  }

  function requireLogin() {
    if (currentUser() && getToken()) return true;
    setStatus("سجّل الدخول بالموقع أولًا لإرسال التفاعل أو التعليق.");
    if (window.YahyaAuth && window.YahyaAuth.open) window.YahyaAuth.open("login");
    return false;
  }

  function appendLocalNotification(item) {
    try {
      var items = JSON.parse(window.localStorage.getItem(NOTIFICATION_KEY) || "[]");
      if (!items || !items.length) items = [];
      items.unshift(item);
      window.localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(items.slice(0, 40)));
    } catch (error) {}
  }

  function sendNotification(type, message, reaction) {
    var user = currentUser() || {};
    var item = {
      id: "local-" + Date.now() + "-" + Math.floor(Math.random() * 100000),
      type: type,
      message: message,
      name: user.name || "زائر",
      email: user.email || "",
      reaction: reaction || "",
      source: "Yahya Tech",
      createdAt: new Date().toISOString(),
      read: false
    };
    appendLocalNotification(item);
    if (!getToken()) return;
    var fields = {
      type: stringField(item.type),
      message: stringField(item.message),
      name: stringField(item.name),
      email: stringField(item.email),
      reaction: stringField(item.reaction),
      source: stringField(item.source),
      createdAt: timestampField(item.createdAt),
      read: boolField(false)
    };
    api("/siteNotifications", { method: "POST", body: { fields: fields } }).catch(function () {});
  }

  function readLocal() {
    var data = {};
    try {
      data = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}") || {};
    } catch (error) {}
    var result = { counts: {}, comments: [], votes: {} };
    Object.keys(defaults).forEach(function (key) {
      result.counts[key] = numberOrZero(data.counts && data.counts[key]);
    });
    if (data.comments && data.comments.length) {
      result.comments = data.comments.slice(0, 60).filter(function (item) {
        return item && item.text;
      });
    }
    if (data.votes) result.votes = data.votes;
    return result;
  }

  function saveLocal() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ counts: counts, comments: comments, votes: votes }));
    } catch (error) {}
  }

  function setStatus(message) {
    if (statusBox) statusBox.textContent = message || "";
  }

  function api(path, options) {
    if (!config.apiKey || !config.projectId || !window.fetch) return Promise.reject(new Error("unavailable"));
    var url = base + path + (path.indexOf("?") >= 0 ? "&" : "?") + "key=" + encodeURIComponent(config.apiKey);
    var settings = { method: (options && options.method) || "GET", headers: { "Content-Type": "application/json" } };
    var token = getToken();
    if (token) settings.headers.Authorization = "Bearer " + token;
    if (options && options.updateMask) url += "&updateMask.fieldPaths=" + encodeURIComponent(options.updateMask);
    if (options && options.body) settings.body = JSON.stringify(options.body);
    return window.fetch(url, settings).then(function (response) {
      return response.text().then(function (text) {
        var data = {};
        try { data = text ? JSON.parse(text) : {}; } catch (error) {}
        if (!response.ok) throw new Error((data && data.error && data.error.message) || "request failed");
        return data;
      });
    });
  }

  function stringField(value) {
    return { stringValue: String(value || "") };
  }

  function integerField(value) {
    return { integerValue: String(numberOrZero(value)) };
  }

  function boolField(value) {
    return { booleanValue: !!value };
  }

  function timestampField(value) {
    return { timestampValue: value || new Date().toISOString() };
  }

  function fieldText(field) {
    return field && typeof field.stringValue === "string" ? field.stringValue : "";
  }

  function fieldInteger(field) {
    return numberOrZero(field && field.integerValue);
  }

  function fieldTime(field) {
    var value = field && (field.timestampValue || field.stringValue);
    if (!value) return "";
    var date = new Date(value);
    if (isNaN(date.getTime())) return "";
    try { return date.toLocaleString("ar"); } catch (error) { return date.toISOString(); }
  }

  function renderCounts() {
    if (!reactionBar) return;
    var buttons = reactionBar.querySelectorAll("[data-reaction]");
    Array.prototype.forEach.call(buttons, function (button) {
      var key = button.getAttribute("data-reaction");
      var countNode = button.querySelector("[data-reaction-count]");
      if (countNode) countNode.textContent = String(numberOrZero(counts[key]));
      var active = !!votes[key];
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function renderComments() {
    if (!commentList) return;
    commentList.innerHTML = "";
    if (!comments.length) {
      var empty = document.createElement("p");
      empty.className = "comment-empty";
      empty.textContent = "لا توجد تعليقات بعد. كن أول من يعلّق.";
      commentList.appendChild(empty);
      return;
    }
    comments.slice(0, 60).forEach(function (item) {
      var card = document.createElement("article");
      card.className = "comment-item";
      var head = document.createElement("div");
      head.className = "comment-head";
      var name = document.createElement("strong");
      name.textContent = item.name || "زائر";
      var time = document.createElement("span");
      time.textContent = fieldTime({ timestampValue: item.createdAt }) || fieldTime({ stringValue: item.createdAt });
      head.appendChild(name);
      head.appendChild(time);
      var text = document.createElement("p");
      text.textContent = item.text;
      card.appendChild(head);
      card.appendChild(text);
      if (item.sticker) {
        var badge = document.createElement("span");
        badge.className = "comment-sticker";
        badge.textContent = "إيموجي الموقع";
        card.appendChild(badge);
      }
      commentList.appendChild(card);
    });
  }

  function render() {
    renderCounts();
    renderComments();
  }

  function updateRemoteCounter(key, notify) {
    if (!getToken()) {
      setStatus("سجّل الدخول لمشاركة تفاعلك.");
      return;
    }
    var fields = {};
    Object.keys(defaults).forEach(function (name) {
      fields[name] = integerField(counts[name]);
    });
    api("/siteReactions/counters", { method: "PATCH", body: { fields: fields }, updateMask: key }).then(function () {
      remoteReady = true;
      setStatus("تم حفظ تفاعلك ومشاركته.");
      if (notify) {
        var user = currentUser() || {};
        sendNotification("reaction", "تفاعل جديد: " + (labels[key] || key) + " من " + (user.name || user.email || "مستخدم مسجل"), key);
      }
    }).catch(function () {
      if (notify) {
        var user = currentUser() || {};
        sendNotification("reaction", "تفاعل جديد: " + (labels[key] || key) + " من " + (user.name || user.email || "مستخدم مسجل"), key);
      }
      setStatus("تم حفظ تفاعلك على هذا الجهاز.");
    });
  }

  function react(key) {
    if (!hasOwn(defaults, key)) return;
    if (!requireLogin()) return;
    var active = !!votes[key];
    var previousCount = numberOrZero(counts[key]);
    if (active) delete votes[key];
    else votes[key] = true;
    counts[key] = Math.max(0, previousCount + (active ? -1 : 1));
    render();
    saveLocal();
    updateRemoteCounter(key, !active);
  }

  function submitComment(event) {
    if (event) event.preventDefault();
    if (!requireLogin()) return;
    var text = commentInput ? String(commentInput.value || "").trim() : "";
    if (!text) {
      setStatus("اكتب تعليقًا أولًا.");
      if (commentInput) commentInput.focus();
      return;
    }
    var user = currentUser();
    var item = {
      id: "local-" + Date.now(),
      name: user && user.name ? user.name : "زائر",
      text: text.slice(0, 500),
      createdAt: new Date().toISOString(),
      sticker: !!attachSticker
    };
    comments.unshift(item);
    if (comments.length > 60) comments.length = 60;
    if (commentInput) commentInput.value = "";
    attachSticker = false;
    if (stickerBtn) {
      stickerBtn.classList.remove("active");
      stickerBtn.textContent = "إرفاق صورة الإيموجي";
    }
    render();
    saveLocal();

    if (!remoteReady && !getToken()) {
      setStatus("تم حفظ تعليقك على هذا الجهاز.");
      return;
    }

    var fields = {
      name: stringField(item.name),
      text: stringField(item.text),
      createdAt: timestampField(item.createdAt),
      sticker: boolField(item.sticker)
    };
    api("/siteComments", { method: "POST", body: { fields: fields } }).then(function () {
      setStatus("تم نشر تعليقك.");
      sendNotification("comment", "تعليق جديد من " + (item.name || "مستخدم مسجل") + ": " + item.text, "");
      return loadRemote();
    }).catch(function () {
      sendNotification("comment", "تعليق جديد من " + (item.name || "مستخدم مسجل") + ": " + item.text, "");
      setStatus("تم حفظ تعليقك على هذا الجهاز.");
    });
  }

  function loadRemote() {
    if (!config.apiKey || !config.projectId || !window.fetch) return Promise.reject(new Error("unavailable"));
    var query = "/siteComments?orderBy=" + encodeURIComponent("createdAt desc") + "&limit=60";
    return Promise.all([api("/siteReactions/counters"), api(query)]).then(function (results) {
      var remoteCounts = results[0] && results[0].fields ? results[0].fields : {};
      var documents = results[1] && results[1].documents ? results[1].documents : [];
      Object.keys(defaults).forEach(function (key) {
        if (remoteCounts[key]) counts[key] = fieldInteger(remoteCounts[key]);
      });
      var loaded = documents.map(function (document) {
        var fields = document.fields || {};
        return {
          id: document.name || "",
          name: fieldText(fields.name) || "زائر",
          text: fieldText(fields.text),
          createdAt: fields.createdAt && (fields.createdAt.timestampValue || fields.createdAt.stringValue) || "",
          sticker: !!(fields.sticker && fields.sticker.booleanValue)
        };
      }).filter(function (item) {
        return item.text;
      });
      if (loaded.length) comments = loaded;
      remoteReady = true;
      render();
      saveLocal();
      setStatus("التفاعل العام مفعّل.");
      return true;
    });
  }

  if (reactionBar) {
    reactionBar.addEventListener("click", function (event) {
      var button = null;
      var node = event.target;
      while (node && node !== reactionBar) {
        if (node.getAttribute && node.getAttribute("data-reaction")) {
          button = node;
          break;
        }
        node = node.parentNode;
      }
      if (!button || !reactionBar.contains(button)) return;
      react(button.getAttribute("data-reaction"));
    });
  }

  if (commentForm) commentForm.addEventListener("submit", submitComment);

  if (stickerBtn) {
    stickerBtn.addEventListener("click", function () {
      attachSticker = !attachSticker;
      stickerBtn.classList.toggle("active", attachSticker);
      stickerBtn.textContent = attachSticker ? "تم إرفاق الإيموجي" : "إرفاق صورة الإيموجي";
      setStatus(attachSticker ? "سيُرفق إيموجي الموقع مع تعليقك." : "تمت إزالة إيموجي الموقع من التعليق.");
    });
  }

  if (loginBtn) {
    loginBtn.addEventListener("click", function () {
      if (window.YahyaAuth && window.YahyaAuth.open) window.YahyaAuth.open("login");
      else setStatus("سجّل الدخول لتفعيل التفاعل العام.");
    });
  }

  window.addEventListener("yahya-auth-change", function () {
    loadRemote().catch(function () {
      setStatus(getToken() ? "التفاعل العام غير متاح حاليًا." : "سجّل الدخول لإرسال التعليق أو التفاعل.");
    });
  });

  var local = readLocal();
  counts = local.counts;
  comments = local.comments;
  votes = local.votes;
  render();
  setStatus(getToken() ? "جارٍ تحميل التفاعل العام..." : "القراءة متاحة للجميع؛ سجّل الدخول لإرسال تعليق أو تفاعل.");
  loadRemote().catch(function () {
    setStatus(getToken() ? "التفاعل العام غير متاح حاليًا." : "القراءة متاحة للجميع؛ سجّل الدخول للتفاعل.");
  });
})();
