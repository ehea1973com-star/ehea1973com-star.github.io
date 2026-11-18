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

  function readCache(day) {
    try {
      var data = JSON.parse(window.sessionStorage.getItem(CACHE_KEY) || "null");
      if (!data || !data.values || !Array.isArray(data.apps) || data.day !== day) return null;
      var age = Date.now() - Number(data.time);
      if (!(age >= 0) || age > CACHE_TTL) return null;
      return data;
    } catch (error) {
      return null;
    }
  }

  function writeCache(values, apps, day) {
    try {
      window.sessionStorage.setItem(CACHE_KEY, JSON.stringify({
        time: Date.now(),
        day: day,
        values: values,
        apps: apps
      }));
    } catch (error) {}
  }

  function formatNumber(value) {
    return (Number(value) || 0).toLocaleString("ar-EG");
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
      .then(function (response) {
        return response.ok ? response.json() : { apps: [] };
      })
      .catch(function () {
        return { apps: [] };
      })
      .then(function (manifest) {
        (manifest.apps || []).forEach(function (app) {
          if (!app || !app.name) return;
          var id = app.package || app.name;
          var exists = apps.some(function (item) {
            return item.id === id || item.name === app.name;
          });
          if (!exists) apps.push({ id: id, name: app.name });
        });
        return apps;
      });
  }

  function render(values, apps) {
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
      return (b.clicks + b.downloads) - (a.clicks + a.downloads) || a.name.localeCompare(b.name, "ar");
    });

    tableBody.innerHTML = "";
    if (!rows.length) {
      var empty = document.createElement("tr");
      var cell = document.createElement("td");
      cell.colSpan = 3;
      cell.textContent = "لا توجد تطبيقات بعد.";
      empty.appendChild(cell);
      tableBody.appendChild(empty);
      return;
    }

    rows.forEach(function (row) {
      var tr = document.createElement("tr");
      var name = document.createElement("td");
      var clicks = document.createElement("td");
      var downloads = document.createElement("td");
      name.textContent = row.name;
      clicks.textContent = formatNumber(row.clicks);
      downloads.textContent = formatNumber(row.downloads);
      tr.appendChild(name);
      tr.appendChild(clicks);
      tr.appendChild(downloads);
      tableBody.appendChild(tr);
    });
  }

  function loadStats(force) {
    if (loading) return;
    var day = analytics.today();
    if (!force) {
      var cached = readCache(day);
      if (cached) {
        render(cached.values, cached.apps);
        if (updatedNode) {
          updatedNode.textContent = "آخر تحديث: " + new Date(cached.time).toLocaleTimeString("ar-SY", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
          });
        }
        return;
      }
    }

    loading = true;
    if (refreshButton) {
      refreshButton.disabled = true;
      refreshButton.textContent = "جارٍ التحديث...";
    }
    if (updatedNode) updatedNode.textContent = "جارٍ قراءة الأرقام...";

    loadApps().then(function (apps) {
      var keys = [
        "visitors-total",
        "visits",
        "registrations",
        "downloads-total",
        "clicks-total",
        "visitors-day-" + day,
        "visits-day-" + day,
        "downloads-day-" + day,
        "clicks-day-" + day
      ];
      apps.forEach(function (app) {
        var id = analytics.safeKey(app.id);
        keys.push("clicks-" + id);
        keys.push("downloads-" + id);
      });
      return analytics.getMany(keys).then(function (values) {
        render(values, apps);
        writeCache(values, apps, day);
        if (updatedNode) {
          updatedNode.textContent = "آخر تحديث: " + new Date().toLocaleTimeString("ar-SY", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
          });
        }
      });
    }).catch(function () {
      if (updatedNode) updatedNode.textContent = "تعذّر تحميل الإحصائيات. حاول مرة أخرى.";
    }).then(function () {
      loading = false;
      if (refreshButton) {
        refreshButton.disabled = false;
        refreshButton.textContent = "تحديث الأرقام";
      }
    });
  }

  function maybeLoad() {
    if (!adminContent || adminContent.hidden) return;
    loadStats(false);
  }

  if (refreshButton) {
    refreshButton.addEventListener("click", function () {
      loadStats(true);
    });
  }
  window.addEventListener("yahya-auth-change", maybeLoad);
  maybeLoad();
})();
