(function () {
  var tableBody = document.getElementById("statsApps");
  var refreshButton = document.getElementById("refreshStats");
  var updatedNode = document.getElementById("statsUpdated");
  var adminContent = document.getElementById("adminContent");
  var analytics = window.YahyaAnalytics;

  if (!tableBody || !analytics) return;

  var loading = false;
  var CACHE_KEY = "yahya_admin_stats_cache_v1";
  var CACHE_TTL = 30000;
  var lastValues = null;
  var lastApps = null;
  var lastTime = 0;

  function tr(key, fb) {
    try { if (window.YahyaI18n && typeof window.YahyaI18n.t === "function") { var v = window.YahyaI18n.t(key); if (v) return v; } } catch (e) {}
    return fb || "";
  }
  function currentLang() {
    try { if (window.YahyaI18n && window.YahyaI18n.getLang) return window.YahyaI18n.getLang(); } catch (e) {}
    try { return localStorage.getItem("yahya_site_lang") || "ar"; } catch (e) { return "ar"; }
  }
  function localeFor(lang) {
    var map = {ar:"ar-EG",en:"en-US",fr:"fr-FR",es:"es-ES",de:"de-DE",tr:"tr-TR",ru:"ru-RU",pt:"pt-PT",it:"it-IT",nl:"nl-NL",id:"id-ID",hi:"hi-IN",ur:"ur-PK",fa:"fa-IR",zh:"zh-CN",ja:"ja-JP",ko:"ko-KR"};
    return map[lang] || "en-US";
  }
  function timeLocale(lang) {
    var map = {ar:"ar-SY",en:"en-US",fr:"fr-FR",es:"es-ES",de:"de-DE",tr:"tr-TR",ru:"ru-RU",pt:"pt-PT",it:"it-IT",nl:"nl-NL",id:"id-ID",hi:"hi-IN",ur:"ur-PK",fa:"fa-IR",zh:"zh-CN",ja:"ja-JP",ko:"ko-KR"};
    return map[lang] || "en-US";
  }

  function readCache(day) {
    try {
      var data = JSON.parse(window.sessionStorage.getItem(CACHE_KEY) || "null");
      if (!data || !data.values || !Array.isArray(data.apps) || data.day !== day) return null;
      var age = Date.now() - Number(data.time);
      if (!(age >= 0) || age > CACHE_TTL) return null;
      return data;
    } catch (error) { return null; }
  }

  function writeCache(values, apps, day) {
    lastValues = values; lastApps = apps; lastTime = Date.now();
    try {
      window.sessionStorage.setItem(CACHE_KEY, JSON.stringify({ time: lastTime, day: day, values: values, apps: apps }));
    } catch (error) {}
  }

  function formatNumber(value) {
    try { return (Number(value) || 0).toLocaleString(localeFor(currentLang())); } catch (e) { return String(Number(value) || 0); }
  }

  function setText(id, value) {
    var node = document.getElementById(id);
    if (node) node.textContent = formatNumber(value);
  }

  function loadApps() {
    var apps = (window.YAHYA_APP_CATALOG || []).map(function (app) {
      return { id: app.id, name: app.name || app.id };
    });
    return fetch("apps/manifest.json", { cache: "no-store" })
      .then(function (response) { return response.ok ? response.json() : { apps: [] }; })
      .catch(function () { return { apps: [] }; })
      .then(function (manifest) {
        (manifest.apps || []).forEach(function (app) {
          if (!app || !app.name) return;
          var id = app.package || app.name;
          var exists = apps.some(function (item) { return item.id === id || item.name === app.name; });
          if (!exists) apps.push({ id: id, name: app.name });
        });
        return apps;
      });
  }

  function render(values, apps) {
    lastValues = values; lastApps = apps;
    setText("statsVisitors", values["visitors-total"]);
    setText("statsVisits", values.visits);
    setText("statsRegistrations", values.registrations);
    setText("statsDownloads", values["downloads-total"]);
    setText("statsClicks", values["clicks-total"]);

    var day = analytics.today();
    setText("todayVisitors", values["visitors-day-" + day]);
    setText("todayVisits", values["visits-day-" + day]);
    setText("todayDownloads", values["downloads-day-" + day]);
    setText("todayClicks", values["clicks-day-" + day]);

    var rows = apps.map(function (app) {
      var clicks = Number(values["clicks-" + analytics.safeKey(app.id)]) || 0;
      var downloads = Number(values["downloads-" + analytics.safeKey(app.id)]) || 0;
      return { name: app.name, clicks: clicks, downloads: downloads };
    }).sort(function (a, b) {
      return (b.clicks + b.downloads) - (a.clicks + a.downloads) || a.name.localeCompare(b.name, currentLang());
    });

    tableBody.innerHTML = "";
    if (!rows.length) {
      var empty = document.createElement("tr");
      var cell = document.createElement("td");
      cell.colSpan = 3;
      cell.textContent = tr("admin.noApps","لا توجد تطبيقات بعد.");
      empty.appendChild(cell);
      tableBody.appendChild(empty);
      return;
    }

    rows.forEach(function (row) {
      var trEl = document.createElement("tr");
      var name = document.createElement("td");
      var clicks = document.createElement("td");
      var downloads = document.createElement("td");
      name.textContent = row.name;
      clicks.textContent = formatNumber(row.clicks);
      downloads.textContent = formatNumber(row.downloads);
      trEl.appendChild(name);
      trEl.appendChild(clicks);
      trEl.appendChild(downloads);
      tableBody.appendChild(trEl);
    });
  }

  function setUpdatedTime(ts) {
    if (!updatedNode) return;
    if (!ts) { updatedNode.textContent = "—"; return; }
    try {
      updatedNode.textContent = tr("admin.lastUpdate","آخر تحديث:") + " " + new Date(ts).toLocaleTimeString(timeLocale(currentLang()), {
        hour: "2-digit", minute: "2-digit", second: "2-digit"
      });
    } catch (e) { updatedNode.textContent = tr("admin.lastUpdate","آخر تحديث:") + " —"; }
  }

  function loadStats(force) {
    if (loading) return;
    var day = analytics.today();
    if (!force) {
      var cached = readCache(day);
      if (cached) {
        render(cached.values, cached.apps);
        lastTime = cached.time;
        setUpdatedTime(cached.time);
        return;
      }
    }

    loading = true;
    if (refreshButton) {
      refreshButton.disabled = true;
      refreshButton.textContent = tr("admin.updating","جارٍ التحديث...");
    }
    if (updatedNode) updatedNode.textContent = tr("admin.reading","جارٍ قراءة الأرقام...");

    loadApps().then(function (apps) {
      var keys = [
        "visitors-total", "visits", "registrations", "downloads-total", "clicks-total",
        "visitors-day-" + day, "visits-day-" + day, "downloads-day-" + day, "clicks-day-" + day
      ];
      apps.forEach(function (app) {
        var id = analytics.safeKey(app.id);
        keys.push("clicks-" + id);
        keys.push("downloads-" + id);
      });
      return analytics.getMany(keys).then(function (values) {
        render(values, apps);
        writeCache(values, apps, day);
        setUpdatedTime(lastTime);
      });
    }).catch(function () {
      if (updatedNode) updatedNode.textContent = tr("admin.loadFail","تعذّر تحميل الإحصائيات. حاول مرة أخرى.");
    }).then(function () {
      loading = false;
      if (refreshButton) {
        refreshButton.disabled = false;
        refreshButton.textContent = tr("admin.refresh","تحديث الأرقام");
      }
    });
  }

  function maybeLoad() {
    if (!adminContent || adminContent.hidden) return;
    loadStats(false);
  }

  if (refreshButton) {
    refreshButton.addEventListener("click", function () { loadStats(true); });
  }
  window.addEventListener("yahya-auth-change", maybeLoad);
  document.addEventListener("yahya:langchange", function () {
    if (lastValues && lastApps) {
      render(lastValues, lastApps);
      setUpdatedTime(lastTime);
    }
    if (refreshButton && !loading) refreshButton.textContent = tr("admin.refresh","تحديث الأرقام");
  });
  maybeLoad();
})();
