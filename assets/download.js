(function () {
  var CATEGORY_LABELS = {
    tools: "أدوات",
    islamic: "أذكار",
    security: "حماية",
    games: "شحن ألعاب",
    diagnostics: "تشخيص",
    system: "نظامي"
  };
  var currentApp = null;

  function el(tag, className, text) {
    var element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined && text !== null) element.textContent = String(text);
    return element;
  }

  function formatFileSize(value) {
    var bytes = Number(value) || 0;
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    return Math.max(1, Math.round(bytes / 1024)) + " KB";
  }

  function categoryLabel(category) {
    return CATEGORY_LABELS[category] || "تطبيق";
  }

  function normalizeManifestApp(app) {
    return {
      id: app.package || app.name,
      package: app.package || "",
      name: app.name || "تطبيق",
      version: "v" + String(app.version || "1.0").replace(/^v/i, ""),
      size: formatFileSize(app.size),
      platform: "Android",
      languages: "عربي",
      category: app.category || "tools",
      icon: app.icon || "assets/icons/system.svg",
      iconClass: "icon-cyan",
      description: app.description || "",
      download: "apps/" + app.filename,
      screenshots: app.screenshots || [],
      sha256: app.sha256 || "",
      external: "",
      type: "APK"
    };
  }

  function loadApps() {
    var staticApps = (window.YAHYA_APP_CATALOG || []).slice();
    var request;
    try {
      request = fetch("apps/manifest.json", { cache: "no-store" });
    } catch (error) {
      return Promise.resolve(staticApps);
    }
    if (!request || typeof request.then !== "function") return Promise.resolve(staticApps);
    return request.then(function (response) {
      if (!response.ok) return { apps: [] };
      return response.json();
    }).catch(function () {
      return { apps: [] };
    }).then(function (manifest) {
      var dynamicApps = (manifest.apps || []).map(normalizeManifestApp);
      return staticApps.concat(dynamicApps);
    });
  }

  function getAppKey() {
    var match = /[?&]app=([^&]+)/.exec(window.location.search || "");
    if (match) {
      try { return decodeURIComponent(match[1]); } catch (error) { return match[1]; }
    }
    if (window.URLSearchParams) {
      return new window.URLSearchParams(window.location.search).get("app") || "";
    }
    return "";
  }

  function findApp(apps, key) {
    if (!key) return null;
    var decoded = key;
    try { decoded = decodeURIComponent(key); } catch (error) {}
    for (var index = 0; index < apps.length; index += 1) {
      var app = apps[index];
      if (app.id === decoded || app.package === decoded || app.name === decoded) return app;
    }
    return null;
  }

  function createIcon(app, large) {
    var icon = el("div", "app-icon " + (app.iconClass || "icon-cyan"));
    if (large) icon.classList.add("download-icon");
    if (app.icon) {
      var image = document.createElement("img");
      image.src = app.icon;
      image.alt = "";
      image.width = large ? 58 : 38;
      image.height = large ? 58 : 38;
      icon.appendChild(image);
    } else {
      icon.textContent = String(app.name || "?").charAt(0);
    }
    return icon;
  }

  function setDownloadLink(button, app) {
    var href = app.download || "#";
    button.href = href;
    if (/^https?:/i.test(href)) {
      button.target = "_blank";
      button.rel = "noopener noreferrer";
      button.removeAttribute("download");
    } else {
      button.removeAttribute("target");
      button.removeAttribute("rel");
      button.setAttribute("download", href.split("/").pop());
    }
  }

  function updateGate() {
    var gate = document.getElementById("downloadGate");
    var button = document.getElementById("downloadButton");
    if (!gate || !button || !currentApp) return;
    var user = window.YahyaAuth ? window.YahyaAuth.getUser() : null;
    gate.innerHTML = "";
    if (user) {
      var owner = window.YahyaAuth && window.YahyaAuth.isOwner && window.YahyaAuth.isOwner();
      gate.className = "download-gate ready";
      gate.appendChild(el("p", "", "أنت مسجل الدخول باسم " + (user.name || user.email) + (owner ? " — مالك الموقع" : "") + ". التحميل جاهز."));
      button.hidden = false;
      setDownloadLink(button, currentApp);
      var logout = el("button", "btn btn-ghost btn-small", "تسجيل الخروج");
      logout.type = "button";
      logout.addEventListener("click", function () {
        if (window.YahyaAuth) window.YahyaAuth.logout();
      });
      gate.appendChild(logout);
      return;
    }
    gate.className = "download-gate locked";
    gate.appendChild(el("p", "", "التسجيل مطلوب قبل تحميل التطبيقات. أنشئ حسابًا أو سجّل الدخول عبر Firebase للمتابعة."));
    var login = el("button", "btn", "تسجيل الدخول");
    login.type = "button";
    login.addEventListener("click", function () {
      if (window.YahyaAuth) window.YahyaAuth.open("login");
    });
    gate.appendChild(login);
    var register = el("button", "btn btn-ghost", "إنشاء حساب");
    register.type = "button";
    register.addEventListener("click", function () {
      if (window.YahyaAuth) window.YahyaAuth.open("register");
    });
    gate.appendChild(register);
    button.hidden = true;
  }

  function renderApp(app) {
    currentApp = app;
    if (window.YahyaAnalytics) window.YahyaAnalytics.trackAppView(app.id);
    var container = document.getElementById("downloadApp");
    if (!container) return;
    container.innerHTML = "";
    document.title = "تحميل " + app.name + " | Yahya Tech";

    var head = el("div", "download-head");
    head.appendChild(createIcon(app, true));
    var copy = el("div", "download-copy");
    copy.appendChild(el("span", "eyebrow", categoryLabel(app.category)));
    copy.appendChild(el("h1", "", app.name));
    copy.appendChild(el("p", "muted", [app.version, app.size, app.platform].filter(Boolean).join(" · ")));
    head.appendChild(copy);
    container.appendChild(head);

    container.appendChild(el("p", "download-description", app.description || "لا يوجد وصف لهذا التطبيق."));

    var meta = el("div", "download-meta");
    if (app.platform) meta.appendChild(el("span", "", app.platform));
    if (app.size) meta.appendChild(el("span", "", app.size));
    if (app.languages) meta.appendChild(el("span", "", app.languages));
    if (app.type) meta.appendChild(el("span", "", app.type));
    if (app.activation) meta.appendChild(el("span", "", "يتطلب تفعيل " + (Number(app.activation.price) || 25) + "$"));
    container.appendChild(meta);

    if (app.activation) {
      var activation = el("div", "download-activation");
      var price = Number(app.activation.price) || 25;
      activation.appendChild(el("strong", "", "تفعيل التطبيق — " + price + "$"));
      activation.appendChild(el("p", "", app.activation.note || "بعد التثبيت افتح التطبيق وانسخ كود الجهاز، ثم أرسله عبر واتساب لطلب كود التفعيل."));
      var request = el("a", "btn", "طلب كود التفعيل عبر واتساب");
      request.href = app.activation.whatsapp + "?text=" + encodeURIComponent(
        "أريد تفعيل " + app.name + " — " + price + "$\nسأرسل كود الجهاز بعد التثبيت."
      );
      request.target = "_blank";
      request.rel = "noopener noreferrer";
      activation.appendChild(request);
      container.appendChild(activation);
    }

    if (app.screenshots && app.screenshots.length) {
      var screenshots = el("div", "download-screenshots");
      app.screenshots.forEach(function (source) {
        var image = document.createElement("img");
        image.src = source;
        image.alt = "لقطة من تطبيق " + app.name;
        image.loading = "lazy";
        screenshots.appendChild(image);
      });
      container.appendChild(screenshots);
    }

    var gate = el("div", "download-gate");
    gate.id = "downloadGate";
    container.appendChild(gate);

    var actions = el("div", "download-actions");
    var download = el("a", "btn", "تحميل " + (app.type || "الملف"));
    download.id = "downloadButton";
    download.hidden = true;
    download.addEventListener("click", function () {
      if (window.YahyaAnalytics) window.YahyaAnalytics.trackDownload(app.id);
    });
    actions.appendChild(download);
    var back = el("a", "btn btn-ghost", "العودة إلى الصفحة الرئيسية");
    back.href = "index.html";
    actions.appendChild(back);
    container.appendChild(actions);

    var links = el("div", "download-links");
    if (app.external) {
      var external = el("a", "text-link", "صفحة التفاصيل");
      external.href = app.external;
      external.target = "_blank";
      external.rel = "noopener noreferrer";
      links.appendChild(external);
    }
    var checksum = el("a", "text-link", "التحقق من SHA-256");
    checksum.href = "apps/SHA256SUMS.txt";
    checksum.target = "_blank";
    checksum.rel = "noopener noreferrer";
    links.appendChild(checksum);
    container.appendChild(links);

    updateGate();
  }

  function renderNotFound() {
    currentApp = null;
    var container = document.getElementById("downloadApp");
    if (!container) return;
    container.innerHTML = "";
    container.appendChild(el("h1", "", "التطبيق غير موجود"));
    container.appendChild(el("p", "muted", "لم نعثر على التطبيق المطلوب. يمكنك العودة إلى مكتبة التطبيقات واختيار تطبيق آخر."));
    var actions = el("div", "download-actions");
    var back = el("a", "btn", "العودة إلى الصفحة الرئيسية");
    back.href = "index.html";
    actions.appendChild(back);
    var apps = el("a", "btn btn-ghost", "عرض كل التطبيقات");
    apps.href = "index.html#apps";
    actions.appendChild(apps);
    container.appendChild(actions);
  }

  function renderAppList(apps) {
    currentApp = null;
    var container = document.getElementById("downloadApp");
    if (!container) return;
    container.innerHTML = "";
    container.appendChild(el("h1", "", "اختر تطبيقًا للتحميل"));
    container.appendChild(el("p", "muted", "كل تطبيق له صفحة تحميل مستقلة مع زر رجوع سهل إلى الصفحة الرئيسية."));
    var list = el("div", "download-list");
    apps.forEach(function (app) {
      var link = document.createElement("a");
      link.href = "download.html?app=" + encodeURIComponent(app.id);
      link.appendChild(createIcon(app, false));
      var text = el("span", "", app.name);
      link.appendChild(text);
      var version = el("small", "", app.version + " · " + app.size);
      link.appendChild(version);
      list.appendChild(link);
    });
    container.appendChild(list);
    var actions = el("div", "download-actions");
    var back = el("a", "btn btn-ghost", "العودة إلى الصفحة الرئيسية");
    back.href = "index.html";
    actions.appendChild(back);
    container.appendChild(actions);
  }

  function init() {
    var year = document.getElementById("year");
    if (year) year.textContent = String(new Date().getFullYear());
    loadApps().then(function (apps) {
      var key = getAppKey();
      if (!key) {
        renderAppList(apps);
        return;
      }
      var app = findApp(apps, key);
      if (!app) {
        renderNotFound();
        return;
      }
      renderApp(app);
    });
    window.addEventListener("yahya-auth-change", updateGate);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
