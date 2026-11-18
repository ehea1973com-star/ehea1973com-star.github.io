(function () {
  var NAMESPACE = "ehea1973com-star.github.io";
  var BASE = "https://abacus.jasoncameron.dev";
  var VISITOR_DAY_KEY = "yahya_visitor_day_v1";
  var VISITOR_TOTAL_KEY = "yahya_visitor_total_v1";
  var PUBLIC_CACHE_KEY = "yahya_public_stats_cache_v1";
  var PUBLIC_CACHE_TTL = 30000;
  var isAdminPage = /(^|\/)admin\.html$/i.test(window.location.pathname);
  var jsonpCounter = 0;

  function today() {
    var date = new Date();
    var month = String(date.getMonth() + 1);
    var day = String(date.getDate());
    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;
    return date.getFullYear() + month + day;
  }

  function safeKey(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64);
  }

  function hit(key) {
    var clean = safeKey(key);
    if (!clean) return;
    var image = new Image();
    image.referrerPolicy = "no-referrer";
    image.src = BASE + "/hit/" + encodeURIComponent(NAMESPACE) + "/" + encodeURIComponent(clean) + "?t=" + Date.now();
  }

  function jsonp(key) {
    return new Promise(function (resolve) {
      var clean = safeKey(key);
      if (!clean) return resolve(0);
      var callback = "yahyaAbacus" + Date.now() + (jsonpCounter += 1);
      var script = document.createElement("script");
      var timer = window.setTimeout(function () {
        cleanup();
        resolve(0);
      }, 9000);
      function cleanup() {
        window.clearTimeout(timer);
        try {
          delete window[callback];
        } catch (error) {
          window[callback] = undefined;
        }
        if (script && script.parentNode) script.parentNode.removeChild(script);
      }
      window[callback] = function (data) {
        cleanup();
        resolve(Number(data && data.value) || 0);
      };
      script.onerror = function () {
        cleanup();
        resolve(0);
      };
      script.src = BASE + "/get/" + encodeURIComponent(NAMESPACE) + "/" + encodeURIComponent(clean) +
        "?callback=" + encodeURIComponent(callback) + "&t=" + Date.now();
      document.head.appendChild(script);
    });
  }

  function getMany(keys) {
    var result = {};
    var list = [];
    keys.forEach(function (key) {
      var clean = safeKey(key);
      if (clean && list.indexOf(clean) === -1) list.push(clean);
    });
    var gap = list.length > 8 ? 340 : 160;
    var tasks = list.map(function (key, index) {
      return new Promise(function (resolve) {
        window.setTimeout(resolve, index * gap);
      }).then(function () {
        return jsonp(key);
      }).then(function (value) {
        result[key] = value;
      });
    });
    return Promise.all(tasks).then(function () {
      return result;
    });
  }

  function trackVisit() {
    if (isAdminPage) return;
    var day = today();
    hit("visits");
    hit("visits-day-" + day);

    var lastDay = "";
    var totalCounted = false;
    try {
      lastDay = window.localStorage.getItem(VISITOR_DAY_KEY) || "";
      totalCounted = window.localStorage.getItem(VISITOR_TOTAL_KEY) === "1";
    } catch (error) {}

    if (lastDay !== day) {
      hit("visitors-day-" + day);
      try {
        window.localStorage.setItem(VISITOR_DAY_KEY, day);
      } catch (error) {}
    }

    if (!totalCounted) {
      hit("visitors-total");
      try {
        window.localStorage.setItem(VISITOR_TOTAL_KEY, "1");
      } catch (error) {}
    }
  }

  function trackAppClick(appId) {
    var id = safeKey(appId);
    if (!id) return;
    var day = today();
    hit("clicks-total");
    hit("clicks-day-" + day);
    hit("clicks-" + id);
  }

  function trackAppView(appId) {
    var id = safeKey(appId);
    if (!id) return;
    hit("app-views-total");
    hit("app-views-" + id);
  }

  function trackDownload(appId) {
    var id = safeKey(appId);
    if (!id) return;
    var day = today();
    hit("downloads-total");
    hit("downloads-day-" + day);
    hit("downloads-" + id);
  }

  function trackRegistration() {
    var day = today();
    hit("registrations");
    hit("registrations-day-" + day);
  }

  function bindAppClicks() {
    document.addEventListener("click", function (event) {
      var target = event.target;
      var link = target && target.closest ? target.closest("a") : null;
      if (!link) return;
      var href = link.getAttribute("href") || "";
      var match = /(?:^|\/)download\.html\?app=([^&#]+)/i.exec(href);
      if (!match) return;
      var appId = match[1];
      try {
        appId = decodeURIComponent(appId);
      } catch (error) {}
      trackAppClick(appId);
    }, true);
  }

  function renderPublicStats() {
    var nodes = document.querySelectorAll("[data-site-stat]");
    if (!nodes.length) return;

    function applyValues(values) {
      Array.prototype.forEach.call(nodes, function (node) {
        var key = node.getAttribute("data-site-stat");
        var value = Number(values[key]) || 0;
        node.textContent = value.toLocaleString("ar-EG");
      });
    }

    var cached = null;
    try {
      cached = JSON.parse(window.sessionStorage.getItem(PUBLIC_CACHE_KEY) || "null");
    } catch (error) {}
    var age = cached ? Date.now() - Number(cached.time) : NaN;
    if (cached && cached.values && age >= 0 && age < PUBLIC_CACHE_TTL) {
      applyValues(cached.values);
      return;
    }

    var keys = [];
    Array.prototype.forEach.call(nodes, function (node) {
      var key = node.getAttribute("data-site-stat");
      if (key && keys.indexOf(key) === -1) keys.push(key);
    });
    getMany(keys).then(function (values) {
      applyValues(values);
      try {
        window.sessionStorage.setItem(PUBLIC_CACHE_KEY, JSON.stringify({
          time: Date.now(),
          values: values
        }));
      } catch (error) {}
    });
  }

  function init() {
    trackVisit();
    bindAppClicks();
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", renderPublicStats);
    } else {
      renderPublicStats();
    }
  }

  window.YahyaAnalytics = {
    namespace: NAMESPACE,
    today: today,
    safeKey: safeKey,
    hit: hit,
    get: jsonp,
    getMany: getMany,
    trackVisit: trackVisit,
    trackAppClick: trackAppClick,
    trackAppView: trackAppView,
    trackDownload: trackDownload,
    trackRegistration: trackRegistration,
    renderPublicStats: renderPublicStats
  };

  init();
})();
