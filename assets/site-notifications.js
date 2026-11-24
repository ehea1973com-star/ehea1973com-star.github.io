(function () {
  var SESSION_KEY = "yahya_firebase_session_v1";
  var SEEN_KEY = "yahya_notification_seen_v1";
  var LOCAL_KEY = "yahya_notification_events_v1";
  var config = window.YAHYA_FIREBASE_CONFIG || {};
  var base = "https://firestore.googleapis.com/v1/projects/" + encodeURIComponent(config.projectId || "") + "/databases/(default)/documents";
  var listNode = document.getElementById("ownerNotifications");
  var statusNode = document.getElementById("ownerNotificationsStatus");
  var enableBtn = document.getElementById("notificationEnableBtn");
  var refreshBtn = document.getElementById("notificationRefreshBtn");
  var seen = {};
  var firstLoad = true;

  function getSession() {
    try {
      return JSON.parse(window.localStorage.getItem(SESSION_KEY) || "null");
    } catch (error) {
      return null;
    }
  }

  function normalizeEmail(value) {
    return String(value || "").trim().toLowerCase();
  }

  function isOwner() {
    var auth = window.YahyaAuth;
    var user = auth && auth.getUser ? auth.getUser() : null;
    if (!user || !user.email || !getSession()) return false;
    var owners = config.ownerEmails || [];
    var email = normalizeEmail(user.email);
    for (var index = 0; index < owners.length; index += 1) {
      if (normalizeEmail(owners[index]) === email) return true;
    }
    return false;
  }

  function readSeen() {
    try {
      seen = JSON.parse(window.localStorage.getItem(SEEN_KEY) || "{}") || {};
    } catch (error) {
      seen = {};
    }
  }

  function writeSeen() {
    try {
      var trimmed = {};
      var keys = Object.keys(seen).slice(-200);
      keys.forEach(function (key) { trimmed[key] = true; });
      window.localStorage.setItem(SEEN_KEY, JSON.stringify(trimmed));
    } catch (error) {}
  }

  function setStatus(message) {
    if (statusNode) statusNode.textContent = message || "";
  }

  function api(path, options) {
    if (!config.apiKey || !config.projectId || !window.fetch) return Promise.reject(new Error("unavailable"));
    var session = getSession();
    if (!session || !session.idToken) return Promise.reject(new Error("unauthorized"));
    var url = base + path + (path.indexOf("?") >= 0 ? "&" : "?") + "key=" + encodeURIComponent(config.apiKey);
    var settings = { method: (options && options.method) || "GET", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + session.idToken } };
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

  function fieldText(field) {
    return field && typeof field.stringValue === "string" ? field.stringValue : "";
  }

  function fieldBool(field) {
    return !!(field && field.booleanValue);
  }

  function docId(name) {
    return String(name || "").split("/").pop();
  }

  function formatTime(value) {
    if (!value) return "";
    var date = new Date(value);
    if (isNaN(date.getTime())) return "";
    try { return date.toLocaleString("ar"); } catch (error) { return date.toISOString(); }
  }

  function readLocalNotifications() {
    try {
      var items = JSON.parse(window.localStorage.getItem(LOCAL_KEY) || "[]");
      if (!items || !items.length) return [];
      return items.filter(function (item) {
        return item && item.id && item.message;
      }).slice(0, 40);
    } catch (error) {
      return [];
    }
  }

  function writeLocalNotifications(items) {
    try {
      window.localStorage.setItem(LOCAL_KEY, JSON.stringify(items.slice(0, 40)));
    } catch (error) {}
  }

  function showBrowserNotification(item) {
    if (!("Notification" in window) || window.Notification.permission !== "granted") return;
    try {
      var title = item.type === "comment" ? "تعليق جديد في موقع يحيى" : "تفاعل جديد في موقع يحيى";
      new window.Notification(title, { body: item.message, tag: item.id });
    } catch (error) {}
  }

  function showToast(message) {
    var toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    window.setTimeout(function () { toast.classList.remove("show"); }, 4000);
  }

  function markRead(id) {
    if (!id) return;
    var local = readLocalNotifications().map(function (item) {
      if (item.id === id) item.read = true;
      return item;
    });
    writeLocalNotifications(local);
    api("/siteNotifications/" + encodeURIComponent(id), {
      method: "PATCH",
      body: { fields: { read: { booleanValue: true } } },
      updateMask: "read"
    }).catch(function () {});
  }

  function render(items) {
    if (!listNode) return;
    listNode.innerHTML = "";
    if (!items.length) {
      var empty = document.createElement("p");
      empty.className = "notification-empty";
      empty.textContent = "لا توجد إشعارات بعد.";
      listNode.appendChild(empty);
      return;
    }
    items.forEach(function (item) {
      var card = document.createElement("article");
      card.className = "notification-item";
      if (!item.read) card.classList.add("unread");
      var head = document.createElement("div");
      head.className = "notification-head";
      var badge = document.createElement("span");
      badge.className = "notification-badge";
      badge.textContent = item.type === "comment" ? "تعليق" : "تفاعل";
      var time = document.createElement("span");
      time.textContent = formatTime(item.createdAt);
      head.appendChild(badge);
      head.appendChild(time);
      var message = document.createElement("p");
      message.textContent = item.message;
      var meta = document.createElement("small");
      meta.textContent = item.name || "زائر";
      card.appendChild(head);
      card.appendChild(message);
      card.appendChild(meta);
      listNode.appendChild(card);
    });
  }

  function present(items, localOnly) {
    var unseen = [];
    if (!firstLoad) {
      items.forEach(function (item) {
        if (!seen[item.id]) unseen.push(item);
      });
    }
    items.forEach(function (item) { seen[item.id] = true; });
    writeSeen();
    firstLoad = false;
    unseen.forEach(function (item) {
      showBrowserNotification(item);
      showToast(item.message);
      markRead(item.id);
    });
    render(items);
    setStatus("آخر تحديث: " + new Date().toLocaleTimeString("ar") + (localOnly ? " — محلي" : "") + (unseen.length ? " — إشعارات جديدة: " + unseen.length : ""));
    return true;
  }

  function load() {
    if (!isOwner()) {
      setStatus("سجّل الدخول بحساب المالك لعرض الإشعارات.");
      return Promise.resolve(false);
    }
    var localItems = readLocalNotifications();
    var query = "/siteNotifications?orderBy=" + encodeURIComponent("createdAt desc") + "&limit=40";
    return api(query).then(function (data) {
      var documents = data && data.documents ? data.documents : [];
      var items = documents.map(function (document) {
        var fields = document.fields || {};
        return {
          id: docId(document.name),
          type: fieldText(fields.type) || "reaction",
          message: fieldText(fields.message),
          name: fieldText(fields.name),
          reaction: fieldText(fields.reaction),
          createdAt: fields.createdAt && (fields.createdAt.timestampValue || fields.createdAt.stringValue) || "",
          read: fieldBool(fields.read)
        };
      }).filter(function (item) {
        return item.id && item.message;
      });
      if (!items.length) items = localItems;
      return present(items, !items.length || items === localItems);
    }).catch(function () {
      return present(localItems, true);
    });
  }

  readSeen();

  if (enableBtn) {
    enableBtn.addEventListener("click", function () {
      if (!("Notification" in window)) {
        setStatus("متصفحك لا يدعم إشعارات المتصفح.");
        return;
      }
      window.Notification.requestPermission().then(function (permission) {
        setStatus(permission === "granted" ? "إشعارات المتصفح مفعّلة." : "لم يتم السماح بإشعارات المتصفح.");
      }).catch(function () {
        setStatus("تعذّر تفعيل إشعارات المتصفح.");
      });
    });
  }

  if (refreshBtn) refreshBtn.addEventListener("click", function () { load(); });
  window.addEventListener("yahya-auth-change", function () { firstLoad = true; load(); });

  load();
  window.setInterval(function () { load(); }, 20000);
})();
