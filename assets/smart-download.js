(function () {
  var activeId = "";
  var activeApp = null;
  var overlay = null;
  var appsPromise = null;
  var started = {};

  function el(tag, className, text) {
    var element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined && text !== null) element.textContent = String(text);
    return element;
  }

  function isHttp(value) {
    return /^https?:\/\//i.test(String(value || "").trim());
  }

  function queryOpen() {
    var params = new URLSearchParams(window.location.search || "");
    return params.get("open") || params.get("smart") || "";
  }

  function fileName(href) {
    return String(href || "").split("?")[0].split("/").pop() || "download";
  }

  function formatSize(value) {
    var bytes = Number(value) || 0;
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    return Math.max(1, Math.round(bytes / 1024)) + " KB";
  }

  function normalize(app) {
    var filename = String(app.filename || "").trim();
    var href = String(app.download || app.downloadUrl || app.url || "").trim();
    if (!href) href = isHttp(filename) ? filename : (filename ? "apps/" + filename : "#");
    var id = String(app.package || app.id || app.name || "").trim();
    var type = String(app.type || "").trim();
    if (!type) {
      var ext = (filename || href).split("?")[0].split(".").pop().toUpperCase();
      type = /^[A-Z0-9]{2,5}$/.test(ext) ? ext : "APK";
    }
    return {
      id: id,
      name: app.name || "تطبيق",
      version: "v" + String(app.version || "1.0").replace(/^v/i, ""),
      size: app.size ? formatSize(app.size) : (app.sizeLabel || ""),
      icon: app.icon || "assets/icons/system.svg",
      download: href,
      filename: filename || fileName(href),
      sha256: app.sha256 || "",
      type: type
    };
  }

  function loadApps() {
    if (appsPromise) return appsPromise;
    var staticApps = (window.YAHYA_APP_CATALOG || []).map(normalize);
    appsPromise = fetch("apps/manifest.json?t=" + Date.now(), { cache: "no-store" })
      .then(function (response) { return response.ok ? response.json() : { apps: [] }; })
      .catch(function () { return { apps: [] }; })
      .then(function (manifest) {
        return staticApps.concat((manifest.apps || []).map(normalize));
      });
    return appsPromise;
  }

  function findApp(apps, key) {
    for (var index = 0; index < apps.length; index += 1) {
      var app = apps[index];
      if (app.id === key || app.name === key || app.filename === key || app.download === key) return app;
    }
    return null;
  }

  function track(app) {
    if (!app || started[app.id]) return;
    started[app.id] = true;
    if (window.YahyaAnalytics && window.YahyaAnalytics.trackDownload) window.YahyaAnalytics.trackDownload(app.id);
  }

  function cleanUrl() {
    return window.location.pathname + "#apps";
  }

  function smartUrl(id) {
    return window.location.pathname + "?open=" + encodeURIComponent(id) + "#apps";
  }

  function ensureHistory(id) {
    if (window.history && window.history.replaceState && window.history.pushState) {
      window.history.replaceState({ yahyaSmartBase: true }, "", cleanUrl());
      window.history.pushState({ yahyaSmart: id }, "", smartUrl(id));
    } else {
      window.location.replace(smartUrl(id));
    }
  }

  function startDownload(app, statusNode) {
    if (!app || !app.download || app.download === "#") return;
    track(app);
    var anchor = document.createElement("a");
    anchor.href = app.download;
    if (isHttp(app.download)) {
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
    } else {
      anchor.setAttribute("download", app.filename || fileName(app.download));
    }
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    if (statusNode) statusNode.textContent = "بدأ التحميل ويمكنك العودة إلى الموقع؛ التحميل سيستمر.";
  }

  function hide() {
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    overlay = null;
    activeApp = null;
    document.body.classList.remove("smart-download-open");
  }

  function back() {
    if (window.history.state && window.history.state.yahyaSmart) window.history.back();
    else hide();
  }

  function actions(app, card) {
    var row = el("div", "smart-download-actions");

    var download = el("button", "btn", "تنزيل الآن");
    download.type = "button";
    var statusNode = card.querySelector(".smart-download-status");
    download.addEventListener("click", function () { startDownload(app, statusNode); });
    row.appendChild(download);

    var home = el("button", "btn btn-ghost", "العودة إلى الموقع");
    home.type = "button";
    home.addEventListener("click", back);
    row.appendChild(home);

    var full = el("a", "btn btn-ghost", "صفحة التحميل الكاملة");
    full.href = "download.html?app=" + encodeURIComponent(app.id);
    row.appendChild(full);

    return row;
  }

  function render(app) {
    hide();
    activeApp = app;
    document.title = "تحميل " + app.name + " | Yahya Tech";
    overlay = el("div", "smart-download-overlay");
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "تنزيل " + app.name);

    var card = el("div", "smart-download-card");

    var head = el("div", "quick-download-head");
    var icon = el("div", "app-icon icon-cyan");
    var image = document.createElement("img");
    image.src = app.icon;
    image.alt = "";
    image.width = 44;
    image.height = 44;
    icon.appendChild(image);
    head.appendChild(icon);

    var copy = el("div", "quick-download-copy");
    copy.appendChild(el("span", "eyebrow", "تحميل مباشر"));
    copy.appendChild(el("h1", "", app.name));
    copy.appendChild(el("p", "muted", [app.version, app.size, app.type].filter(Boolean).join(" · ")));
    head.appendChild(copy);
    card.appendChild(head);

    card.appendChild(el("p", "smart-download-note", "الموقع مفتوح خلف هذه الصفحة. بدأ التحميل ويمكنك الضغط على زر رجوع في الهاتف للبقاء في الموقع أثناء اكتماله."));
    card.appendChild(el("p", "quick-download-status", "جارٍ بدء التحميل..."));
    card.appendChild(actions(app, card));

    var links = el("div", "quick-download-links");
    var home = el("a", "text-link", "كل التطبيقات");
    home.href = "index.html#apps";
    home.addEventListener("click", function (event) { event.preventDefault(); back(); });
    links.appendChild(home);
    var checksum = el("a", "text-link", "التحقق من SHA-256");
    checksum.href = "apps/SHA256SUMS.txt";
    checksum.target = "_blank";
    checksum.rel = "noopener noreferrer";
    links.appendChild(checksum);
    card.appendChild(links);

    if (app.sha256) card.appendChild(el("p", "quick-download-sha", "SHA-256: " + app.sha256));

    overlay.appendChild(card);
    document.body.appendChild(overlay);
    document.body.classList.add("smart-download-open");

    setTimeout(function () { startDownload(app, card.querySelector(".smart-download-status")); }, 350);
  }

  function renderNotFound(id) {
    hide();
    overlay = el("div", "smart-download-overlay");
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    var card = el("div", "smart-download-card");
    card.appendChild(el("h1", "", "التطبيق غير موجود"));
    card.appendChild(el("p", "muted", "لم نعثر على " + id + ". يمكنك العودة إلى الموقع وتصفح التطبيقات."));
    var row = el("div", "smart-download-actions");
    var home = el("button", "btn", "العودة إلى الموقع");
    home.type = "button";
    home.addEventListener("click", back);
    row.appendChild(home);
    card.appendChild(row);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    document.body.classList.add("smart-download-open");
  }

  function show(id) {
    if (!id) return;
    activeId = id;
    if (activeApp && activeApp.id === id && overlay) return;
    loadApps().then(function (apps) {
      if (activeId !== id) return;
      var app = findApp(apps, id);
      if (app) render(app);
      else renderNotFound(id);
    });
  }

  function open(id) {
    if (!id) return;
    if (queryOpen() !== id) ensureHistory(id);
    show(id);
  }

  window.YahyaSmartDownload = { open: open, back: back };

  window.addEventListener("popstate", function (event) {
    if (event.state && event.state.yahyaSmart) show(event.state.yahyaSmart);
    else hide();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      var id = queryOpen();
      if (!id) return;
      ensureHistory(id);
      show(id);
    });
  } else {
    var id = queryOpen();
    if (id) {
      ensureHistory(id);
      show(id);
    }
  }
})();
