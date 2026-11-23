(function () {
  function el(tag, className, text) {
    var element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined && text !== null) element.textContent = String(text);
    return element;
  }

  function isHttp(value) {
    return /^https?:\/\//i.test(String(value || "").trim());
  }

  function queryKey() {
    var match = /[?&]app=([^&]+)/.exec(window.location.search || "");
    if (!match) return "";
    try { return decodeURIComponent(match[1]); } catch (error) { return match[1]; }
  }

  function fileName(href) {
    return String(href || "").split("?")[0].split("/").pop() || "download";
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

  function formatSize(value) {
    var bytes = Number(value) || 0;
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    return Math.max(1, Math.round(bytes / 1024)) + " KB";
  }

  function loadApps() {
    var staticApps = (window.YAHYA_APP_CATALOG || []).map(normalize);
    return fetch("apps/manifest.json?t=" + Date.now(), { cache: "no-store" })
      .then(function (response) { return response.ok ? response.json() : { apps: [] }; })
      .catch(function () { return { apps: [] }; })
      .then(function (manifest) {
        return staticApps.concat((manifest.apps || []).map(normalize));
      });
  }

  function findApp(apps, key) {
    for (var index = 0; index < apps.length; index += 1) {
      var app = apps[index];
      if (app.id === key || app.name === key || app.filename === key || app.download === key) return app;
    }
    return null;
  }

  function track(app) {
    if (window.YahyaAnalytics && window.YahyaAnalytics.trackDownload) window.YahyaAnalytics.trackDownload(app.id);
  }

  function setStatus(node, message) {
    if (node) node.textContent = message;
  }

  function downloadSilently(app, statusNode) {
    var href = app.download || "#";
    if (href === "#") return;
    track(app);
    var anchor = document.createElement("a");
    anchor.href = href;
    if (!isHttp(href)) anchor.setAttribute("download", app.filename || fileName(href));
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setStatus(statusNode, "بدأ التحميل ويمكنك البقاء في هذه الصفحة.");
  }

  function openInstaller(app, statusNode) {
    var href = app.download || "#";
    if (href === "#") return;
    track(app);
    if (isHttp(href)) {
      var openedExternal = window.open(href, "_blank", "noopener,noreferrer");
      if (!openedExternal) window.location.href = href;
      setStatus(statusNode, "تم فتح صفحة الملف في تبويب جديد.");
      return;
    }
    var opened = window.open(href, "_blank");
    if (opened) {
      try { opened.opener = null; } catch (error) {}
      setStatus(statusNode, "تم فتح المثبت في تبويب جديد وتبقى هذه الصفحة مفتوحة.");
    } else {
      downloadSilently(app, statusNode);
    }
  }

  function goBack(app) {
    var referrer = document.referrer || "";
    if (referrer && referrer.indexOf(window.location.origin) === 0 && referrer.indexOf("d.html") === -1) {
      window.history.back();
    } else {
      window.location.href = "download.html?app=" + encodeURIComponent(app.id);
    }
  }

  function render(app) {
    var container = document.getElementById("quickDownload");
    if (!container) return;
    container.innerHTML = "";
    document.title = "تثبيت " + app.name + " | Yahya Tech";

    var head = el("div", "quick-download-head");
    var icon = el("div", "app-icon icon-cyan");
    if (app.icon) {
      var image = document.createElement("img");
      image.src = app.icon;
      image.alt = "";
      image.width = 44;
      image.height = 44;
      icon.appendChild(image);
    } else {
      icon.textContent = app.name.charAt(0);
    }
    head.appendChild(icon);
    var copy = el("div", "quick-download-copy");
    copy.appendChild(el("span", "eyebrow", "تثبيت سريع"));
    copy.appendChild(el("h1", "", app.name));
    copy.appendChild(el("p", "muted", [app.version, app.size, app.type].filter(Boolean).join(" · ")));
    head.appendChild(copy);
    container.appendChild(head);

    container.appendChild(el("p", "quick-download-note", "اختر ما يناسبك: افتح المثبت في تبويب جديد وابقَ هنا، أو نزّل الملف فقط، أو ألغِ وارجع إلى صفحة التحميل."));

    var statusNode = el("p", "quick-download-status", "");
    container.appendChild(statusNode);

    var actions = el("div", "quick-download-actions");
    var install = el("button", "btn", "تثبيت APK");
    install.type = "button";
    install.addEventListener("click", function () { openInstaller(app, statusNode); });
    actions.appendChild(install);

    var silent = el("button", "btn btn-ghost", "تنزيل فقط والبقاء هنا");
    silent.type = "button";
    silent.addEventListener("click", function () { downloadSilently(app, statusNode); });
    actions.appendChild(silent);

    var cancel = el("button", "btn btn-ghost", "إلغاء / رجوع");
    cancel.type = "button";
    cancel.addEventListener("click", function () { goBack(app); });
    actions.appendChild(cancel);
    container.appendChild(actions);

    var links = el("div", "quick-download-links");
    var fullPage = el("a", "text-link", "صفحة التحميل الكاملة");
    fullPage.href = "download.html?app=" + encodeURIComponent(app.id);
    links.appendChild(fullPage);
    var home = el("a", "text-link", "الصفحة الرئيسية");
    home.href = "index.html#apps";
    links.appendChild(home);
    var checksum = el("a", "text-link", "التحقق من SHA-256");
    checksum.href = "apps/SHA256SUMS.txt";
    checksum.target = "_blank";
    checksum.rel = "noopener noreferrer";
    links.appendChild(checksum);
    container.appendChild(links);

    if (app.sha256) container.appendChild(el("p", "quick-download-sha", "SHA-256: " + app.sha256));
  }

  function renderNotFound() {
    var container = document.getElementById("quickDownload");
    if (!container) return;
    container.innerHTML = "";
    container.appendChild(el("h1", "", "التطبيق غير موجود"));
    container.appendChild(el("p", "muted", "لم نعثر على التطبيق المطلوب."));
    var actions = el("div", "quick-download-actions");
    var home = el("a", "btn", "الصفحة الرئيسية");
    home.href = "index.html#apps";
    actions.appendChild(home);
    var list = el("a", "btn btn-ghost", "كل التطبيقات");
    list.href = "download.html";
    actions.appendChild(list);
    container.appendChild(actions);
  }

  function init() {
    var key = queryKey();
    if (!key) {
      window.location.replace("download.html");
      return;
    }
    loadApps().then(function (apps) {
      var app = findApp(apps, key);
      if (!app) { renderNotFound(); return; }
      render(app);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
