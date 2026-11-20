(function () {
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  var toast = document.getElementById("toast");
  var toastTimer = null;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.classList.remove("show");
    }, 2400);
  }

  function t(key, fallback) {
    try { if (window.YahyaI18n && window.YahyaI18n.t) { var v = window.YahyaI18n.t(key); if (v) return v; } } catch (e) {}
    return fallback || "";
  }

  function copyText(value, done, fail) {
    function fallback() {
      var input = document.createElement("textarea");
      input.value = value;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      try {
        var copied = document.execCommand("copy");
        document.body.removeChild(input);
        if (copied) done();
        else fail();
      } catch (error) {
        document.body.removeChild(input);
        fail();
      }
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(value).then(done).catch(fallback);
    } else {
      fallback();
    }
  }

  var copyButtons = document.querySelectorAll("[data-copy]");
  Array.prototype.forEach.call(copyButtons, function (button) {
    button.addEventListener("click", function () {
      var value = button.getAttribute("data-copy") || "";
      copyText(
        value,
        function () { showToast(t("action.copyLink","تم نسخ رابط الموقع")); },
        function () { showToast(t("label.copyFail","تعذّر نسخ الرابط")); }
      );
    });
  });

  var TAVILY_SEARCH_URL = "https://api.tavily.com/search";
  var TAVILY_EXTRACT_URL = "https://api.tavily.com/extract";
  var WEB_SEARCH_CACHE_KEY = "yahya_web_search_cache_v1";
  var webSearchForm = document.getElementById("webSearchForm");
  var webSearchInput = document.getElementById("webSearchInput");
  var webSearchButton = document.getElementById("webSearchButton");
  var webSearchStatus = document.getElementById("webSearchStatus");
  var webSearchResults = document.getElementById("webSearchResults");
  var webAnswer = document.getElementById("webAnswer");
  var readerModal = document.getElementById("readerModal");
  var readerTitle = document.getElementById("readerTitle");
  var readerSource = document.getElementById("readerSource");
  var readerContent = document.getElementById("readerContent");

  function tavilyRequest(url, payload) {
    return fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tavily-Access-Mode": "keyless"
      },
      body: JSON.stringify(payload)
    }).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (data) {
        if (!response.ok) {
          var message = "فشل الطلب";
          if (data && data.error && data.error.message) message = data.error.message;
          else if (data && data.detail && data.detail.error) message = data.detail.error;
          else if (response.statusText) message = response.statusText;
          if (response.status === 429) {
            message = "تم بلوغ حد البحث المجاني مؤقتًا. انتظر دقيقة ثم حاول مجددًا.";
          }
          throw new Error(message);
        }
        return data;
      });
    });
  }

  function readWebSearchCache() {
    try {
      return JSON.parse(window.localStorage.getItem(WEB_SEARCH_CACHE_KEY) || "{}") || {};
    } catch (error) {
      return {};
    }
  }

  function getCachedWebSearch(query) {
    var cache = readWebSearchCache();
    var item = cache[query.toLowerCase()];
    if (!item || !item.data) return null;
    if (Date.now() - item.time > 10 * 60 * 1000) return null;
    return item.data;
  }

  function cacheWebSearch(query, data) {
    var cache = readWebSearchCache();
    cache[query.toLowerCase()] = { time: Date.now(), data: data };
    var keys = Object.keys(cache);
    if (keys.length > 12) {
      keys.sort(function (a, b) { return cache[a].time - cache[b].time; });
      for (var index = 0; index < keys.length - 12; index += 1) {
        delete cache[keys[index]];
      }
    }
    try {
      window.localStorage.setItem(WEB_SEARCH_CACHE_KEY, JSON.stringify(cache));
    } catch (error) {}
  }

  function setWebSearchStatus(message) {
    if (webSearchStatus) webSearchStatus.textContent = message;
  }

  function createWebResult(item, index) {
    var itemUrl = item.url || "";
    var itemTitle = item.title || itemUrl;
    var card = document.createElement("article");
    card.className = "web-result";

    var heading = document.createElement("h3");
    var titleLink = document.createElement("a");
    titleLink.href = itemUrl;
    titleLink.target = "_blank";
    titleLink.rel = "noopener noreferrer";
    titleLink.textContent = itemTitle;
    heading.appendChild(titleLink);
    card.appendChild(heading);

    var url = document.createElement("p");
    url.className = "web-result-url";
    url.textContent = itemUrl;
    card.appendChild(url);

    if (item.content) {
      var snippet = document.createElement("p");
      snippet.className = "web-result-snippet";
      snippet.textContent = item.content;
      card.appendChild(snippet);
    }

    var actions = document.createElement("div");
    actions.className = "web-result-actions";

    var readButton = document.createElement("button");
    readButton.type = "button";
    readButton.className = "btn btn-ghost btn-small";
    readButton.textContent = "قراءة داخل الموقع";
    readButton.setAttribute("data-read-url", itemUrl);
    readButton.setAttribute("data-read-title", itemTitle);
    actions.appendChild(readButton);

    var sourceLink = document.createElement("a");
    sourceLink.className = "mini-link";
    sourceLink.href = itemUrl;
    sourceLink.target = "_blank";
    sourceLink.rel = "noopener noreferrer";
    sourceLink.textContent = "فتح المصدر";
    actions.appendChild(sourceLink);

    card.appendChild(actions);
    return card;
  }

  function renderWebSearch(query, data) {
    var results = data && data.results ? data.results : [];
    if (webAnswer) {
      webAnswer.hidden = !data.answer;
      webAnswer.textContent = data.answer || "";
    }
    if (webSearchResults) {
      webSearchResults.innerHTML = "";
      results.forEach(function (item, index) {
        if (item && item.url) webSearchResults.appendChild(createWebResult(item, index));
      });
    }
    if (!results.length) {
      setWebSearchStatus("لا توجد نتائج ظاهرة لـ «" + query + "». جرّب كلمات أخرى.");
      return;
    }
    setWebSearchStatus("تم العثور على " + results.length + " نتيجة لـ «" + query + "».");
  }

  function closeReader() {
    if (!readerModal) return;
    readerModal.hidden = true;
    document.body.classList.remove("modal-open");
  }

  function openReader(url, title) {
    if (!readerModal || !url) return;
    readerModal.hidden = false;
    document.body.classList.add("modal-open");
    if (readerTitle) readerTitle.textContent = title || t("label.reading","قراءة الصفحة");
    if (readerSource) readerSource.href = url;
    if (readerContent) readerContent.textContent = t("label.loadingPage","جاري تحميل الصفحة...");
    tavilyRequest(TAVILY_EXTRACT_URL, { urls: [url] }).then(function (data) {
      var results = data && data.results ? data.results : [];
      var content = results[0] && (results[0].raw_content || results[0].content);
      if (!content) throw new Error("لم يتم العثور على نص قابل للقراءة في هذه الصفحة.");
      if (readerContent) readerContent.textContent = content;
    }).catch(function (error) {
      if (readerContent) {
        readerContent.textContent = "تعذّر تحميل محتوى الصفحة داخل الموقع: " + error.message +
          "\n\nيمكنك فتح المصدر الأصلي من الرابط أعلاه.";
      }
    });
  }

  if (webSearchForm) {
    webSearchForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var query = webSearchInput ? webSearchInput.value.trim() : "";
      if (!query) {
        if (webSearchInput) webSearchInput.focus();
        showToast(t("status.searchEmpty","اكتب كلمة للبحث أولًا"));
        return;
      }
      var cached = getCachedWebSearch(query);
      if (cached) {
        renderWebSearch(query, cached);
        return;
      }
      if (webSearchButton) {
        webSearchButton.disabled = true;
        webSearchButton.textContent = t("status.searching","جارٍ البحث...");
      }
      setWebSearchStatus(t("status.webSearching","جارٍ البحث في الإنترنت عبر Tavily..."));
      if (webAnswer) webAnswer.hidden = true;
      if (webSearchResults) webSearchResults.innerHTML = "";
      tavilyRequest(TAVILY_SEARCH_URL, {
        query: query,
        max_results: 10,
        search_depth: "basic",
        include_answer: true
      }).then(function (data) {
        cacheWebSearch(query, data);
        renderWebSearch(query, data);
      }).catch(function (error) {
        setWebSearchStatus("تعذّر البحث: " + error.message);
      }).then(function () {
        if (webSearchButton) {
          webSearchButton.disabled = false;
          webSearchButton.textContent = t("action.search","بحث");
        }
      });
    });
  }

  if (webSearchResults) {
    webSearchResults.addEventListener("click", function (event) {
      var target = event.target;
      while (target && target !== webSearchResults && !target.getAttribute("data-read-url")) {
        target = target.parentNode;
      }
      if (!target || target === webSearchResults) return;
      event.preventDefault();
      openReader(target.getAttribute("data-read-url"), target.getAttribute("data-read-title"));
    });
  }

  Array.prototype.forEach.call(document.querySelectorAll("[data-reader-close]"), function (button) {
    button.addEventListener("click", closeReader);
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && readerModal && !readerModal.hidden) closeReader();
  });

  var shareSite = document.getElementById("shareSite");
  if (shareSite) {
    shareSite.addEventListener("click", function () {
      var url = window.location.origin + window.location.pathname;
      function fallbackShare() {
        copyText(
          url,
          function () { showToast(t("action.copyLink","تم نسخ رابط الموقع للمشاركة")); },
          function () { showToast(t("label.copyFail","تعذّر نسخ الرابط")); }
        );
      }
      if (navigator.share) {
        navigator.share({
          title: "Yahya Tech — يحيى الحمزة",
          text: "تطبيقات أندرويد وأدوات تشخيص هواتف من يحيى الحمزة.",
          url: url
        }).catch(fallbackShare);
        return;
      }
      fallbackShare();
    });
  }

  var header = document.getElementById("header");
  var lastScrollY = window.scrollY || window.pageYOffset || 0;
  function onScroll() {
    var y = window.scrollY || window.pageYOffset || 0;
    if (header) {
      header.classList.toggle("scrolled", y > 16);
      if (y > 140 && y > lastScrollY + 8) {
        header.classList.add("header-hidden");
      } else if (y < lastScrollY - 8 || y <= 80) {
        header.classList.remove("header-hidden");
      }
    }
    lastScrollY = y;
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  Array.prototype.forEach.call(document.querySelectorAll(".reveal"), function (element) {
    element.classList.add("in-view");
  });

  // animations removed by user request

  var liveIframe = document.getElementById("liveIframe");
  var liveNote = document.getElementById("liveNote");
  var liveTabs = document.querySelectorAll("[data-live-tab]");
  var LIVE_SOURCES = {
    videos: "https://www.youtube-nocookie.com/embed/videoseries?list=UUmChpVHGV74adiyqncSyocg&rel=0",
    live: "https://www.youtube-nocookie.com/embed/live_stream?channel=UCmChpVHGV74adiyqncSyocg&rel=0"
  };
  var currentLiveTab = "videos";
  function liveNoteText(name) {
    if (name === "live") return t("live.noteLive", "إذا ظهر «غير متوفر» فهذا يعني أن القناة لا تبث الآن. افتح القناة على يوتيوب لمعرفة موعد البث القادم.");
    return t("live.noteVideos", "يعرض هذا القسم آخر فيديوهات القناة. عند بدء بث مباشر اختر «البث المباشر» أو افتح القناة على يوتيوب.");
  }
  function setLiveTab(name) {
    if (!LIVE_SOURCES[name]) name = "videos";
    currentLiveTab = name;
    if (liveIframe && liveIframe.getAttribute("src") !== LIVE_SOURCES[name]) {
      liveIframe.setAttribute("src", LIVE_SOURCES[name]);
      liveIframe.setAttribute("title", name === "live" ? t("live.live","البث المباشر") : t("live.videos","آخر الفيديوهات"));
    }
    if (liveNote) liveNote.textContent = liveNoteText(name);
    Array.prototype.forEach.call(liveTabs, function (button) {
      var active = button.getAttribute("data-live-tab") === name;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", active ? "true" : "false");
    });
  }
  Array.prototype.forEach.call(liveTabs, function (button) {
    button.addEventListener("click", function () {
      setLiveTab(button.getAttribute("data-live-tab"));
    });
  });
  document.addEventListener("yahya:langchange", function () {
    setLiveTab(currentLiveTab);
  });

  var appsGrid = document.getElementById("apps-grid");
  var searchInput = document.getElementById("appSearch");
  var filterButtons = document.querySelectorAll("[data-filter]");
  var emptyState = document.getElementById("appsEmpty");
  var resultCount = document.getElementById("appsResultCount");
  var activeFilter = "all";
  var appCountBase = 7;
  var currentShareUrl = window.location.href;
  var deepLinkOpened = false;
  var currentModalCard = null;
  var UPLOAD_TOKEN_KEY = "yahya_site_upload_token";
  var GITHUB_API = "https://api.github.com/repos/ehea1973com-star/ehea1973com-star.github.io/contents/";
  var GITHUB_BRANCH = "main";
  var MAX_SCREENSHOTS = 3;
  var MAX_SCREENSHOT_BYTES = 1024 * 1024;

  var STATIC_META = {
    "Smart Phone Detective": { category: "diagnostics" },
    "نور الفجر": { category: "islamic" },
    "Yahya Manager 2": { category: "tools" },
    "Yahya RepairLive": { category: "tools" },
    "Yahya Shield": { category: "security" },
    "Yahya Account Help": { category: "security" },
    "Yahya Games Topup": { category: "games" },
    "Yahya System Module": { category: "system" }
  };

  function categoryLabel(key) {
    var map = { all:"filter.all", tools:"filter.tools", islamic:"filter.islamic", security:"filter.security", games:"filter.games", diagnostics:"filter.diagnostics", system:"filter.system" };
    if (map[key]) return t(map[key], key);
    return key;
  }
  var CATEGORY_LABELS = {
    get all(){return categoryLabel("all");}, get tools(){return categoryLabel("tools");}, get islamic(){return categoryLabel("islamic");},
    get security(){return categoryLabel("security");}, get games(){return categoryLabel("games");}, get diagnostics(){return categoryLabel("diagnostics");}, get system(){return categoryLabel("system");}
  };

  function appElement(tag, className, text) {
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

  function isAssetPath(path) {
    return /^assets\/[A-Za-z0-9._\/-]+$/.test(path) && path.indexOf("..") === -1;
  }

  function slugify(value) {
    return String(value).trim().replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase();
  }

  function getUploadToken() {
    try {
      var token = window.localStorage.getItem(UPLOAD_TOKEN_KEY) || "";
      return token.replace(/\s+/g, "");
    } catch (error) {
      return "";
    }
  }

  function saveUploadToken(token) {
    try {
      token = (token || "").replace(/\s+/g, "");
      if (token) window.localStorage.setItem(UPLOAD_TOKEN_KEY, token);
      else window.localStorage.removeItem(UPLOAD_TOKEN_KEY);
      return token;
    } catch (error) {
      return token || "";
    }
  }

  function repoPath(path) {
    return path.split("/").map(encodeURIComponent).join("/");
  }

  function repoHeaders(token, json) {
    var headers = {
      "Accept": "application/vnd.github+json",
      "Authorization": "Bearer " + token,
      "X-GitHub-Api-Version": "2022-11-28"
    };
    if (json) headers["Content-Type"] = "application/json";
    return headers;
  }

  function githubError(response) {
    return response.text().then(function (text) {
      var message = "HTTP " + response.status;
      try {
        var data = JSON.parse(text);
        if (data && data.message) message += ": " + data.message;
      } catch (error) {}
      throw new Error(message);
    });
  }

  function githubGet(path, token) {
    return fetch(GITHUB_API + repoPath(path) + "?ref=" + encodeURIComponent(GITHUB_BRANCH), {
      method: "GET",
      headers: repoHeaders(token, false),
      cache: "no-store"
    }).then(function (response) {
      if (response.status === 404) return null;
      if (!response.ok) return githubError(response);
      return response.json();
    });
  }

  function githubPut(path, base64, message, sha, token) {
    var body = {
      message: message,
      content: base64,
      branch: GITHUB_BRANCH
    };
    if (sha) body.sha = sha;
    return fetch(GITHUB_API + repoPath(path), {
      method: "PUT",
      headers: repoHeaders(token, true),
      body: JSON.stringify(body)
    }).then(function (response) {
      if (!response.ok) return githubError(response);
      return response.json();
    });
  }

  function readFileBase64(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        var result = String(reader.result || "");
        var comma = result.indexOf(",");
        resolve(comma >= 0 ? result.slice(comma + 1) : result);
      };
      reader.onerror = function () { reject(new Error("تعذّر قراءة الصورة")); };
      reader.readAsDataURL(file);
    });
  }

  function resizeScreenshotTo720x1648(file) {
    return new Promise(function (resolve, reject) {
      var url = "";
      try { url = URL.createObjectURL(file); } catch (e) {}
      var img = new Image();
      img.onload = function () {
        try {
          var targetW = 720;
          var targetH = 1648;
          var canvas = document.createElement("canvas");
          canvas.width = targetW;
          canvas.height = targetH;
          var ctx = canvas.getContext("2d");
          var sw = img.naturalWidth || img.width;
          var sh = img.naturalHeight || img.height;
          var scale = Math.max(targetW / sw, targetH / sh);
          var dw = sw * scale;
          var dh = sh * scale;
          var dx = (targetW - dw) / 2;
          var dy = (targetH - dh) / 2;
          ctx.fillStyle = "#000";
          ctx.fillRect(0, 0, targetW, targetH);
          ctx.drawImage(img, dx, dy, dw, dh);
          var dataUrl = canvas.toDataURL("image/jpeg", 0.92);
          var comma = dataUrl.indexOf(",");
          if (url) { try { URL.revokeObjectURL(url); } catch (e) {} }
          resolve({ base64: comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl, ext: "jpg" });
        } catch (err) {
          if (url) { try { URL.revokeObjectURL(url); } catch (e) {} }
          reject(new Error("تعذّر معالجة الصورة"));
        }
      };
      img.onerror = function () {
        if (url) { try { URL.revokeObjectURL(url); } catch (e) {} }
        reject(new Error("تعذّر فتح الصورة"));
      };
      img.src = url || "";
      if (!url) {
        // fallback
        readFileBase64(file).then(function (b64) { resolve({ base64: b64, ext: (file.name.split(".").pop() || "jpg").toLowerCase() }); }).catch(reject);
      }
    });
  }

  function decodeBase64Text(base64) {
    var binary = atob(String(base64 || "").replace(/\s/g, ""));
    var bytes = new Uint8Array(binary.length);
    for (var index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    if (window.TextDecoder) return new TextDecoder("utf-8").decode(bytes);
    return decodeURIComponent(escape(binary));
  }

  function encodeTextBase64(text) {
    if (window.TextEncoder) {
      var bytes = new TextEncoder().encode(text);
      var binary = "";
      for (var index = 0; index < bytes.length; index += 1) {
        binary += String.fromCharCode(bytes[index]);
      }
      return btoa(binary);
    }
    return btoa(unescape(encodeURIComponent(text)));
  }

  function loadRemoteManifest(token) {
    return githubGet("apps/manifest.json", token).then(function (file) {
      var apps = [];
      if (file && file.content) {
        try {
          var parsed = JSON.parse(decodeBase64Text(file.content));
          if (Array.isArray(parsed)) apps = parsed;
          else if (parsed && Array.isArray(parsed.apps)) apps = parsed.apps;
        } catch (error) {
          apps = [];
        }
      }
      return { apps: apps, sha: file ? file.sha : null };
    });
  }

  function saveRemoteManifest(apps, sha, token) {
    var text = JSON.stringify({ apps: apps }, null, 2) + "\n";
    return githubPut("apps/manifest.json", encodeTextBase64(text), "Update app screenshots", sha, token);
  }

  function addDetailsButton(card) {
    var actions = card.querySelector(".card-actions");
    if (!actions || actions.querySelector("[data-app-details]")) return;
    var button = appElement("button", "mini-link app-details", t("action.quickView","نظرة سريعة"));
    button.type = "button";
    button.setAttribute("data-app-details", "");
    button.setAttribute("data-i18n", "action.quickView");
    actions.appendChild(button);
  }

  function prepareCard(card) {
    var titleElement = card.querySelector("h3");
    var title = titleElement ? titleElement.textContent.trim() : "";
    var meta = STATIC_META[title];
    if (!card.getAttribute("data-category")) {
      card.setAttribute("data-category", meta ? meta.category : "tools");
    }
    if (!card.getAttribute("data-share-key")) {
      card.setAttribute("data-share-key", title);
    }
    var icon = card.querySelector(".app-icon img");
    if (icon) {
      icon.loading = "lazy";
      icon.decoding = "async";
    }
    addDetailsButton(card);
  }

  function getCards() {
    return appsGrid ? Array.prototype.slice.call(appsGrid.querySelectorAll(".app-card")) : [];
  }

  function applyFilters() {
    var query = searchInput ? searchInput.value.trim().toLowerCase() : "";
    var cards = getCards();
    var visible = 0;

    cards.forEach(function (card) {
      var title = card.querySelector("h3");
      var description = card.querySelector(".app-body p");
      var category = card.getAttribute("data-category") || "tools";
      var haystack = [
        title ? title.textContent : "",
        description ? description.textContent : "",
        card.getAttribute("data-package") || "",
        categoryLabel(category)
      ].join(" ").toLowerCase();
      var matches = (activeFilter === "all" || category === activeFilter) &&
        (!query || haystack.indexOf(query) !== -1);
      card.hidden = !matches;
      if (matches) {
        card.classList.add("in-view");
        visible += 1;
      }
    });

    if (emptyState) emptyState.hidden = visible !== 0;
    if (resultCount) resultCount.textContent = t("apps.showing","عرض") + " " + visible + " / " + cards.length;
  }
  document.addEventListener("yahya:langchange", function(){ try { applyFilters(); } catch(e){} });

  function cardExists(key) {
    var cards = getCards();
    for (var i = 0; i < cards.length; i += 1) {
      if (cards[i].getAttribute("data-share-key") === key || cards[i].getAttribute("data-package") === key) return true;
    }
    return false;
  }

  function makePhoneAppCard(app, index) {
    if (!app || !app.name || !app.filename) return null;
    if (!/^[A-Za-z0-9._-]+\.apk$/.test(app.filename)) return null;
    var shareKey = app.package || app.name;
    if (cardExists(shareKey)) return null;
    var colors = ["icon-cyan", "icon-gold", "icon-violet", "icon-rose", "icon-green", "icon-blue"];
    var category = CATEGORY_LABELS[app.category] ? app.category : "tools";
    var screenshots = Array.isArray(app.screenshots) ? app.screenshots.filter(isAssetPath) : [];
    var card = appElement("article", "app-card phone-app");
    card.setAttribute("data-category", category);
    card.setAttribute("data-package", app.package || "");
    card.setAttribute("data-share-key", app.package || app.name);
    card.setAttribute("data-screenshots", screenshots.join("|"));
    var icon = appElement("div", "app-icon " + colors[index % colors.length]);
    var image = document.createElement("img");
    image.src = app.icon && isAssetPath(app.icon) ? app.icon : "assets/icons/system.svg";
    image.alt = "";
    image.width = 38;
    image.height = 38;
    image.loading = "lazy";
    image.decoding = "async";
    icon.appendChild(image);
    var body = appElement("div", "app-body");
    var titleRow = appElement("div", "app-title-row");
    titleRow.appendChild(appElement("h3", "", app.name));
    titleRow.appendChild(appElement("span", "version", "v" + String(app.version || "1.0").replace(/^v/i, "")));
    body.appendChild(titleRow);
    if (app.description) body.appendChild(appElement("p", "", app.description));
    var meta = appElement("div", "meta");
    meta.appendChild(appElement("span", "", "APK"));
    meta.appendChild(appElement("span", "", formatFileSize(app.size)));
    meta.appendChild(appElement("span", "", categoryLabel(category)));
    meta.appendChild(appElement("span", "", "مضاف من الهاتف"));
    body.appendChild(meta);
    var actions = appElement("div", "card-actions");
    var download = appElement("a", "btn btn-small", "صفحة التحميل");
    download.href = "download.html?app=" + encodeURIComponent(app.package);
    actions.appendChild(download);
    var checksum = appElement("a", "mini-link", "SHA-256");
    checksum.href = "apps/SHA256SUMS.txt";
    checksum.target = "_blank";
    checksum.rel = "noopener";
    actions.appendChild(checksum);
    body.appendChild(actions);
    card.appendChild(icon);
    card.appendChild(body);
    prepareCard(card);
    return card;
  }

  function getCardData(card) {
    var title = card.querySelector("h3");
    var version = card.querySelector(".version");
    var description = card.querySelector(".app-body p");
    var icon = card.querySelector(".app-icon");
    var download = card.querySelector(".card-actions a.btn");
    var category = card.getAttribute("data-category") || "tools";
    var size = "";
    var metaSpans = card.querySelectorAll(".meta span");

    Array.prototype.forEach.call(metaSpans, function (span) {
      if (/(\d+(?:\.\d+)?)\s*(MB|KB)/i.test(span.textContent)) size = span.textContent.trim();
    });

    return {
      name: title ? title.textContent.trim() : "تطبيق",
      version: version ? version.textContent.trim() : "",
      description: description ? description.textContent.trim() : "",
      iconClass: icon ? icon.className : "app-icon icon-cyan",
      iconHTML: icon ? icon.innerHTML : "",
      downloadHref: download ? download.getAttribute("href") : "#",
      downloadLabel: download ? download.textContent.trim() : "",
      size: size,
      category: category,
      categoryLabel: categoryLabel(category),
      package: card.getAttribute("data-package") || "",
      shareKey: card.getAttribute("data-share-key") || (title ? title.textContent.trim() : ""),
      screenshots: (card.getAttribute("data-screenshots") || "").split("|").filter(isAssetPath)
    };
  }

  var modal = document.getElementById("appModal");
  var modalIcon = document.getElementById("modalIcon");
  var modalTitle = document.getElementById("appModalTitle");
  var modalMeta = document.getElementById("appModalMeta");
  var modalDescription = document.getElementById("appModalDescription");
  var modalScreenshots = document.getElementById("modalScreenshots");
  var modalDownload = document.getElementById("modalDownload");
  var modalChecksum = document.getElementById("modalChecksum");
  var modalClose = modal ? modal.querySelector(".modal-close") : null;
  var screenshotManager = document.getElementById("screenshotManager");
  var screenshotInput = document.getElementById("modalScreenshotInput");
  var screenshotStatus = document.getElementById("screenshotManagerStatus");
  var modalTokenInput = document.getElementById("modalTokenInput");
  var modalToggleToken = document.getElementById("modalToggleToken");
  var modalSaveToken = document.getElementById("modalSaveToken");
  var lastFocused = null;

  function renderScreenshots(screenshots, appName) {
    if (!modalScreenshots) return;
    modalScreenshots.innerHTML = "";
    if (!screenshots.length) {
      modalScreenshots.appendChild(appElement("p", "screenshots-empty", "لم تُضف لقطات شاشة لهذا التطبيق بعد."));
      return;
    }
    var strip = appElement("div", "screenshots-strip");
    screenshots.forEach(function (source) {
      var image = document.createElement("img");
      image.src = source + (source.indexOf("?") === -1 ? "?v=1" : "");
      image.alt = "لقطة شاشة - " + appName;
      image.width = 720;
      image.height = 1648;
      image.loading = "lazy";
      image.decoding = "async";
      image.onerror = function () {
        image.alt = "تعذّر عرض الصورة (قد تحتاج لنشر GitHub Pages أو تحديث الصفحة)";
        image.style.minHeight = "120px";
      };
      strip.appendChild(image);
    });
    modalScreenshots.appendChild(strip);
  }

  function setScreenshotStatus(message) {
    if (screenshotStatus) screenshotStatus.textContent = message;
  }

  function updateScreenshotManager(card) {
    if (!screenshotManager) return;
    var data = card ? getCardData(card) : null;
    var remaining = data ? MAX_SCREENSHOTS - data.screenshots.length : 0;
    var canAdd = !!(data && remaining > 0);
    screenshotManager.hidden = !canAdd;
    if (screenshotInput) {
      screenshotInput.disabled = !canAdd;
      screenshotInput.value = "";
    }
    if (!canAdd) {
      setScreenshotStatus(data && remaining <= 0 ? "الحد الأقصى 3 لقطات لهذا التطبيق." : "");
      return;
    }
    var hasToken = !!getUploadToken();
    if (modalTokenInput && document.activeElement !== modalTokenInput) {
      modalTokenInput.value = getUploadToken();
    }
    setScreenshotStatus(
      hasToken
        ? "✓ التوكن محفوظ على هذا الجهاز. اختر الصور لإضافتها (حتى " + remaining + "، 720×1648)."
        : "الصق GitHub Token في الحقل أعلاه (سيُحفظ تلقائيًا) ثم اختر الصور لإضافتها (720×1648)."
    );
  }

  function requestUploadToken(force) {
    var token = getUploadToken();
    if (token && !force) return token;
    if (modalTokenInput) {
      var typed = saveUploadToken(modalTokenInput.value);
      if (typed) return typed;
      try { modalTokenInput.focus(); } catch (e) {}
      setScreenshotStatus("الصق GitHub Token في الحقل أعلاه ثم اضغط «حفظ التوكن» أو اختر الصور مرة أخرى. المطلوب: Fine-grained token للمستودع ehea1973com-star.github.io بصلاحية Contents: Read and write.");
      showToast("أدخل التوكن في الحقل المخصص أولًا");
      return "";
    }
    token = window.prompt(
      "أدخل GitHub Token لرفع لقطات الشاشة (يُحفظ على هذا الجهاز فقط).\n\n" +
      "الخطوات الصحيحة:\n" +
      "1) GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token\n" +
      "2) Repository access: Only select repositories → اختر ehea1973com-star.github.io\n" +
      "3) Permissions → Repository permissions → Contents: Read and write\n" +
      "4) أنشئ التوكن وانسخه بالكامل ثم الصقه هنا\n\n" +
      "(اتركه فارغًا للإلغاء)"
    );
    if (token === null) return "";
    var saved = saveUploadToken(token);
    return saved;
  }

  function uploadScreenshots(card, fileList) {
    if (!card || !fileList || !fileList.length) return;
    var data = getCardData(card);
    var existing = data.screenshots.slice();
    var remaining = MAX_SCREENSHOTS - existing.length;
    if (remaining <= 0) {
      showToast("وصل هذا التطبيق إلى الحد الأقصى: 3 لقطات.");
      updateScreenshotManager(card);
      return;
    }

    var files = Array.prototype.slice.call(fileList);
    var selected = files.slice(0, remaining);
    if (files.length > remaining) {
      showToast("سيتم رفع " + remaining + " صور فقط للوصول إلى الحد الأقصى.");
    }
    for (var index = 0; index < selected.length; index += 1) {
      var file = selected[index];
      var extension = file.name.split(".").pop().toLowerCase();
      if (!/^(png|jpe?g|webp)$/.test(extension)) {
        showToast("الصور يجب أن تكون PNG أو JPG أو WEBP.");
        return;
      }
    }

    var token = requestUploadToken();
    if (!token) {
      setScreenshotStatus(t("status.tokenMissing","لم يتم إدخال التوكن، لم تُرفع الصور."));
      return;
    }

    var packageSlug = slugify(data.package || data.name);
    var stamp = Date.now();
    var uploaded = [];
    var chain = Promise.resolve();

    if (screenshotInput) screenshotInput.disabled = true;
    setScreenshotStatus(t("status.preparingUpload","جارٍ تجهيز الصور ورفعها..."));

    selected.forEach(function (file, index) {
      chain = chain.then(function () {
        setScreenshotStatus("جارٍ تجهيز الصورة " + (index + 1) + " من " + selected.length + " (720×1648)...");
        return resizeScreenshotTo720x1648(file).then(function (processed) {
          var path = "assets/uploads/screens/" + packageSlug + "-" + stamp + "-" + (index + 1) + "." + (processed.ext || "jpg");
          setScreenshotStatus("جارٍ رفع الصورة " + (index + 1) + " من " + selected.length + "...");
          return githubPut(path, processed.base64, "Upload screenshot for " + data.name, null, token).then(function () {
            uploaded.push(path);
            setScreenshotStatus("تم رفع " + uploaded.length + " من " + selected.length + " صور...");
          });
        });
      });
    });

    chain
      .then(function () { return loadRemoteManifest(token); })
      .then(function (manifest) {
        var entry = null;
        for (var i = 0; i < manifest.apps.length; i += 1) {
          var app = manifest.apps[i];
          if (!app) continue;
          if (data.package && app.package && app.package === data.package) { entry = app; break; }
          if (app.name && data.name && app.name === data.name) { entry = app; break; }
          if (data.shareKey && (app.package === data.shareKey || app.name === data.shareKey)) { entry = app; break; }
        }
        if (!entry) {
          var href = data.downloadHref || "";
          var filename = "";
          var match = /([^\/?#]+\.apk)(?:[?#]|$)/i.exec(href);
          if (match) filename = match[1];
          if (!filename && data.package) filename = slugify(data.package) + "-v" + String(data.version || "1.0").replace(/^v/i, "") + ".apk";
          if (!filename) filename = slugify(data.package || data.shareKey || data.name || "app") + ".apk";
          var iconSrc = "";
          var iconImg = card.querySelector(".app-icon img");
          if (iconImg) iconSrc = iconImg.getAttribute("src") || "";
          entry = {
            name: data.name || "تطبيق",
            package: data.package || data.shareKey || "",
            version: String(data.version || "1.0").replace(/^v/i, ""),
            description: data.description || "",
            category: data.category || "tools",
            filename: filename,
            size: 0,
            sha256: "",
            updatedAt: new Date().toISOString(),
            icon: isAssetPath(iconSrc) ? iconSrc : "assets/icons/system.svg",
            screenshots: []
          };
          manifest.apps.push(entry);
        }
        entry.screenshots = existing.concat(uploaded).slice(0, MAX_SCREENSHOTS);
        entry.updatedAt = new Date().toISOString();
        if (data.description && !entry.description) entry.description = data.description;
        if (data.category && !entry.category) entry.category = data.category;
        return saveRemoteManifest(manifest.apps, manifest.sha, token);
      })
      .then(function () {
        var next = existing.concat(uploaded).slice(0, MAX_SCREENSHOTS);
        card.setAttribute("data-screenshots", next.join("|"));
        renderScreenshots(next, data.name);
        updateScreenshotManager(card);
        setScreenshotStatus("تم رفع الصور وتحديث القائمة. قد تحتاج الصفحة دقائق لتظهر الصور بعد نشر GitHub Pages (حدّث الصفحة لاحقًا).");
        showToast("تمت إضافة لقطات الشاشة بنجاح");
      })
      .catch(function (error) {
        var msg = error && error.message ? error.message : String(error);
        if (/401|403|Bad credentials|Resource not accessible|not accessible by/i.test(msg)) {
          saveUploadToken("");
          setScreenshotStatus("فشل التحقق من التوكن: " + msg + " — أدخل توكن Fine-grained صحيح بصلاحية Contents: Read and write للمستودع ehea1973com-star.github.io.");
          showToast("التوكن مرفوض: تأكد أنه Fine-grained للمستودع الصحيح مع Contents: Read and write");
        } else if (/404/i.test(msg)) {
          setScreenshotStatus("لم يُعثر على الملف/المستودع (404). تأكد أن التوكن يملك الوصول للمستودع ehea1973com-star.github.io.");
          showToast("خطأ 404: تحقق من صلاحية الوصول للمستودع");
        } else {
          setScreenshotStatus("فشل رفع الصور: " + msg);
          showToast("فشل رفع الصور: " + msg);
        }
      })
      .then(function () {
        if (screenshotInput) {
          screenshotInput.disabled = false;
          screenshotInput.value = "";
        }
      });
  }

  function updateShareLinks(data) {
    var key = data.shareKey || data.package || data.name;
    currentShareUrl = window.location.origin + window.location.pathname + "?app=" + encodeURIComponent(key) + "#apps";
    var text = "تطبيق " + data.name + " من Yahya Tech";
    var encodedUrl = encodeURIComponent(currentShareUrl);
    var encodedText = encodeURIComponent(text);
    var whatsapp = document.getElementById("shareWhatsapp");
    var telegram = document.getElementById("shareTelegram");
    var facebook = document.getElementById("shareFacebook");
    var x = document.getElementById("shareX");
    if (whatsapp) whatsapp.href = "https://wa.me/?text=" + encodeURIComponent(text + " " + currentShareUrl);
    if (telegram) telegram.href = "https://t.me/share/url?url=" + encodedUrl + "&text=" + encodedText;
    if (facebook) facebook.href = "https://www.facebook.com/sharer/sharer.php?u=" + encodedUrl;
    if (x) x.href = "https://twitter.com/intent/tweet?url=" + encodedUrl + "&text=" + encodedText;
  }

  function openModal(card) {
    if (!modal || !card) return;
    var data = getCardData(card);
    lastFocused = document.activeElement;
    if (modalIcon) {
      modalIcon.className = data.iconClass;
      modalIcon.innerHTML = data.iconHTML;
    }
    if (modalTitle) modalTitle.textContent = data.name;
    if (modalMeta) {
      modalMeta.textContent = [data.version, data.size, data.categoryLabel, data.package]
        .filter(Boolean).join(" • ");
    }
    if (modalDescription) {
      modalDescription.textContent = data.description || "لا يوجد وصف لهذا التطبيق بعد.";
    }
    if (modalDownload) {
      modalDownload.href = data.downloadHref || "#";
      modalDownload.textContent = data.downloadLabel || "تحميل";
      if (/\.apk($|\?)/i.test(data.downloadHref || "")) modalDownload.setAttribute("download", "");
      else modalDownload.removeAttribute("download");
    }
    if (modalChecksum) modalChecksum.href = "apps/SHA256SUMS.txt";
    renderScreenshots(data.screenshots, data.name);
    currentModalCard = card;
    updateScreenshotManager(card);
    updateShareLinks(data);
    modal.hidden = false;
    document.body.classList.add("modal-open");
    if (modalClose) modalClose.focus();
  }

  function closeModal() {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  function openDeepLink() {
    if (deepLinkOpened || !window.URLSearchParams) return;
    var key = new URLSearchParams(window.location.search).get("app");
    if (!key) {
      deepLinkOpened = true;
      return;
    }
    var cards = getCards();
    for (var index = 0; index < cards.length; index += 1) {
      if (cards[index].getAttribute("data-share-key") === key) {
        openModal(cards[index]);
        deepLinkOpened = true;
        return;
      }
    }
  }

  if (modal) {
    Array.prototype.forEach.call(modal.querySelectorAll("[data-modal-close]"), function (element) {
      element.addEventListener("click", closeModal);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeModal();
    });
  }

  if (screenshotInput) {
    screenshotInput.addEventListener("change", function () {
      if (currentModalCard) uploadScreenshots(currentModalCard, screenshotInput.files);
    });
  }

  if (modalToggleToken && modalTokenInput) {
    modalToggleToken.addEventListener("click", function () {
      var show = modalTokenInput.type === "password";
      modalTokenInput.type = show ? "text" : "password";
      modalToggleToken.textContent = show ? "إخفاء التوكن" : "إظهار التوكن";
    });
  }
  if (modalSaveToken && modalTokenInput) {
    modalSaveToken.addEventListener("click", function () {
      var t = saveUploadToken(modalTokenInput.value);
      if (t) {
        showToast("تم حفظ التوكن على هذا الجهاز");
        setScreenshotStatus("✓ تم حفظ التوكن. اختر الصور لإضافتها (720×1648).");
      } else {
        showToast("تم حذف التوكن");
        if (currentModalCard) updateScreenshotManager(currentModalCard);
      }
    });
  }
  if (modalTokenInput) {
    modalTokenInput.addEventListener("input", function () {
      saveUploadToken(modalTokenInput.value);
    });
    modalTokenInput.addEventListener("paste", function () {
      setTimeout(function () {
        saveUploadToken(modalTokenInput.value);
        if (currentModalCard) updateScreenshotManager(currentModalCard);
      }, 0);
    });
  }

  var shareCopy = document.getElementById("shareCopy");
  if (shareCopy) {
    shareCopy.addEventListener("click", function () {
      copyText(
        currentShareUrl,
        function () { showToast("تم نسخ رابط التطبيق"); },
        function () { showToast(t("label.copyFail","تعذّر نسخ الرابط")); }
      );
    });
  }

  if (appsGrid) {
    appsGrid.addEventListener("click", function (event) {
      var card = event.target.closest ? event.target.closest(".app-card") : null;
      if (!card) return;
      var interactive = event.target.closest("a,button");
      if (interactive && !interactive.hasAttribute("data-app-details")) return;
      event.preventDefault();
      openModal(card);
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", applyFilters);
  }

  Array.prototype.forEach.call(filterButtons, function (button) {
    button.addEventListener("click", function () {
      activeFilter = button.getAttribute("data-filter") || "all";
      Array.prototype.forEach.call(filterButtons, function (other) {
        var active = other === button;
        other.classList.toggle("active", active);
        other.setAttribute("aria-pressed", active ? "true" : "false");
      });
      applyFilters();
    });
  });

  Array.prototype.forEach.call(getCards(), prepareCard);
  applyFilters();
  openDeepLink();

  if (appsGrid && window.fetch) {
    fetch("apps/manifest.json?t=" + Date.now(), { cache: "no-store" })
      .then(function (response) { return response.ok ? response.json() : null; })
      .then(function (data) {
        if (!data) return;
        var apps = Array.isArray(data) ? data : data.apps;
        if (!Array.isArray(apps)) return;
        var added = 0;
        apps.forEach(function (app, index) {
          var card = makePhoneAppCard(app, index);
          if (card) {
            appsGrid.appendChild(card);
            added += 1;
          } else {
            var key = app.package || app.name;
            var key2 = app.id || "";
            var cards = getCards();
            for (var i = 0; i < cards.length; i += 1) {
              var existingCard = cards[i];
              var sk = existingCard.getAttribute("data-share-key") || "";
              var pk = existingCard.getAttribute("data-package") || "";
              if (sk === key || pk === key || (key2 && (sk === key2 || pk === key2)) || sk === app.name || pk === app.name) {
                var shots = Array.isArray(app.screenshots) ? app.screenshots.filter(isAssetPath) : [];
                if (shots.length) existingCard.setAttribute("data-screenshots", shots.join("|"));
                if (app.description) {
                  var descEl = existingCard.querySelector(".app-body p");
                  if (descEl) descEl.textContent = app.description;
                }
                if (app.icon) {
                  var iconImg = existingCard.querySelector(".app-icon img");
                  if (iconImg) {
                    iconImg.src = app.icon;
                  } else {
                    var iconDiv = existingCard.querySelector(".app-icon");
                    if (iconDiv) {
                      iconDiv.innerHTML = "";
                      var im = document.createElement("img");
                      im.src = app.icon; im.alt = ""; im.width = 38; im.height = 38; im.loading = "lazy"; im.decoding = "async";
                      iconDiv.appendChild(im);
                    }
                  }
                }
                break;
              }
            }
          }
        });
        var counter = document.querySelector("[data-app-count]");
        if (counter && added) {
          var base = parseInt(counter.textContent, 10);
          if (isNaN(base)) base = appCountBase;
          counter.textContent = String(base + added);
        }
        applyFilters();
        openDeepLink();
      })
      .catch(function () {});
  }
})();


// Image gallery + zoom modal (any image click, with prev/next browsing)
(function initImageZoom(){
  var imageModal = document.getElementById("imageModal");
  if (!imageModal) return;
  var imageModalImg = document.getElementById("imageModalImg");
  var imageModalTitle = document.getElementById("imageModalTitle");
  var imageModalDesc = document.getElementById("imageModalDesc");
  var imageZoomWrap = document.getElementById("imageZoomWrap");
  var zoomLevelEl = document.getElementById("zoomLevel");
  var zoomInBtn = document.getElementById("zoomInBtn");
  var zoomOutBtn = document.getElementById("zoomOutBtn");
  var zoomResetBtn = document.getElementById("zoomResetBtn");
  var zoomDownloadBtn = document.getElementById("zoomDownloadBtn");
  var zoomPrevBtn = document.getElementById("zoomPrevBtn");
  var zoomNextBtn = document.getElementById("zoomNextBtn");
  var zoomCounter = document.getElementById("zoomCounter");
  var zoomNavPrompt = document.getElementById("zoomNavPrompt");
  var zoomScale = 1;
  var gallery = [];
  var currentIndex = 0;
  var currentGalleryCat = "";

  function applyZoom(){
    if (!imageModalImg) return;
    imageModalImg.style.width = (zoomScale * 100) + "%";
    if (zoomLevelEl) zoomLevelEl.textContent = Math.round(zoomScale * 100) + "%";
  }
  function getFileName(src){
    try { return (src.split("?")[0].split("#")[0].split("/").pop()) || "image"; } catch(e){ return "image"; }
  }
  function isExcludedImg(img){
    if (!img) return true;
    if (img.hasAttribute("data-no-zoom")) return true;
    if (img.closest && img.closest(".brand, .nav-toggle, .modal-close, .footer-brand, .modal-actions")) return true;
    return false;
  }
  function makeItem(src, title, desc){
    if (!src) return null;
    return { src: src, title: title || "عرض الصورة", desc: desc || "" };
  }
  function itemFromImg(img){
    return makeItem(img.currentSrc || img.src || img.getAttribute("src"), img.getAttribute("data-zoom-title") || img.getAttribute("alt"), img.getAttribute("data-zoom-desc"));
  }
  function itemFromTrigger(el){
    var src = el.getAttribute("data-zoom-src") || (el.tagName === "IMG" ? (el.currentSrc || el.src || el.getAttribute("src")) : "");
    return makeItem(src, el.getAttribute("data-zoom-title") || el.getAttribute("alt"), el.getAttribute("data-zoom-desc"));
  }
  function getScope(el){
    if (!el || !el.closest) return document;
    return el.closest("[data-gallery-cat]") || el.closest(".gallery-grid") || el.closest(".rich-grid, .schematic-grid, .icon-grid, .screenshots-strip, .modal-screenshots, .tech-grid, .problem-grid") || el.closest("section") || document;
  }
  function buildGallery(contextEl, currentItem){
    var scope = getScope(contextEl);
    var nodes = Array.prototype.slice.call(scope.querySelectorAll("img, [data-zoom-src]"));
    var seen = {};
    var items = [];
    nodes.forEach(function(node){
      if (imageModal.contains(node)) return;
      var it = null;
      if (node.tagName === "IMG") {
        if (isExcludedImg(node)) return;
        it = itemFromImg(node);
      } else if (node.hasAttribute("data-zoom-src")) {
        it = itemFromTrigger(node);
      }
      if (!it || !it.src) return;
      var key = it.src;
      if (seen[key]) return;
      seen[key] = true;
      items.push(it);
    });
    var idx = 0;
    if (currentItem && currentItem.src){
      for (var i=0;i<items.length;i++){ if (items[i].src === currentItem.src){ idx = i; break; } }
      if (!items.length || items[idx].src !== currentItem.src){ items.unshift(currentItem); idx = 0; }
    } else if (!items.length && currentItem){ items = [currentItem]; idx = 0; }
    return { items: items, index: idx };
  }
  function escHtml(s){
    s = (s == null) ? "" : String(s);
    return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }
  function buildCategoryPrompt(){
    if (!zoomNavPrompt) return;
    var cats = Array.prototype.slice.call(document.querySelectorAll("[data-gallery-cat]"));
    if (!cats.length || !currentGalleryCat){ zoomNavPrompt.hidden = true; zoomNavPrompt.innerHTML = ""; return; }
    var others = cats.filter(function(c){ return c.getAttribute("data-gallery-cat") !== currentGalleryCat; });
    if (!others.length){ zoomNavPrompt.hidden = true; zoomNavPrompt.innerHTML = ""; return; }
    var atEnd = gallery.length > 1 && currentIndex >= gallery.length - 1;
    if (!atEnd){ zoomNavPrompt.hidden = true; zoomNavPrompt.innerHTML = ""; return; }
    var links = [];
    others.forEach(function(c){
      var name = c.getAttribute("data-gallery-name") || "قسم آخر";
      var id = c.id || "";
      if (id) links.push('<a href="#' + id + '" data-jump-cat="' + id + '">' + escHtml(name) + '</a>');
    });
    if (!links.length){ zoomNavPrompt.hidden = true; zoomNavPrompt.innerHTML = ""; return; }
    zoomNavPrompt.innerHTML = '<strong>انتهت صور هذا القسم.</strong> هل تريد الانتقال إلى صور: ' + links.join(' ، ') + ' ؟';
    zoomNavPrompt.hidden = false;
    Array.prototype.forEach.call(zoomNavPrompt.querySelectorAll("[data-jump-cat]"), function(a){
      a.addEventListener("click", function(e){
        e.preventDefault();
        var id = a.getAttribute("data-jump-cat");
        closeImageModal();
        var el = id ? document.getElementById(id) : null;
        if (el && el.scrollIntoView) {
          try { el.scrollIntoView({behavior:"smooth", block:"start"}); } catch(err){ try{ el.scrollIntoView(); }catch(e2){} }
        }
      });
    });
  }
  function updateNav(){
    var multi = gallery.length > 1;
    if (zoomPrevBtn){ zoomPrevBtn.style.display = multi ? "" : "none"; }
    if (zoomNextBtn){ zoomNextBtn.style.display = multi ? "" : "none"; }
    if (zoomCounter){ zoomCounter.textContent = multi ? ((currentIndex + 1) + " / " + gallery.length) : ""; }
    buildCategoryPrompt();
  }
  function showIndex(i){
    if (!gallery.length) return;
    if (i < 0) i = gallery.length - 1;
    if (i >= gallery.length) i = 0;
    currentIndex = i;
    var it = gallery[currentIndex];
    if (imageModalImg){ imageModalImg.src = it.src; imageModalImg.alt = it.title || ""; }
    if (imageModalTitle) imageModalTitle.textContent = it.title || "عرض الصورة";
    if (imageModalDesc) imageModalDesc.textContent = it.desc || "";
    if (zoomDownloadBtn){
      zoomDownloadBtn.href = it.src;
      zoomDownloadBtn.setAttribute("download", getFileName(it.src));
      zoomDownloadBtn.setAttribute("target", "_blank");
      zoomDownloadBtn.setAttribute("rel", "noopener");
    }
    zoomScale = 1; applyZoom();
    if (imageZoomWrap){ try{ imageZoomWrap.scrollTop = 0; imageZoomWrap.scrollLeft = 0; }catch(e){} }
    updateNav();
  }
  function openFrom(contextEl, item){
    if (!item || !item.src) return;
    var scope = getScope(contextEl);
    currentGalleryCat = (scope && scope.getAttribute && scope.getAttribute("data-gallery-cat")) ? scope.getAttribute("data-gallery-cat") : "";
    var g = buildGallery(contextEl, item);
    gallery = g.items;
    currentIndex = g.index;
    imageModal.hidden = false;
    document.body.classList.add("modal-open");
    showIndex(currentIndex);
  }
  function closeImageModal(){
    imageModal.hidden = true;
    if (imageModalImg) imageModalImg.src = "";
    if (zoomNavPrompt){ zoomNavPrompt.hidden = true; zoomNavPrompt.innerHTML = ""; }
    gallery = []; currentIndex = 0; currentGalleryCat = "";
    var anyOpen = false;
    ["appModal","readerModal","installModal"].forEach(function(id){
      var el = document.getElementById(id);
      if (el && !el.hidden) anyOpen = true;
    });
    if (!anyOpen) document.body.classList.remove("modal-open");
  }
  if (zoomInBtn) zoomInBtn.addEventListener("click", function(){ zoomScale = Math.min(+(zoomScale + 0.25).toFixed(2), 8); applyZoom(); });
  if (zoomOutBtn) zoomOutBtn.addEventListener("click", function(){ zoomScale = Math.max(+(zoomScale - 0.25).toFixed(2), 0.5); applyZoom(); });
  if (zoomResetBtn) zoomResetBtn.addEventListener("click", function(){ zoomScale = 1; applyZoom(); if(imageZoomWrap){ try{imageZoomWrap.scrollTop=0; imageZoomWrap.scrollLeft=0;}catch(e){} } });
  if (zoomPrevBtn) zoomPrevBtn.addEventListener("click", function(e){ e.preventDefault(); e.stopPropagation(); showIndex(currentIndex - 1); });
  if (zoomNextBtn) zoomNextBtn.addEventListener("click", function(e){ e.preventDefault(); e.stopPropagation(); showIndex(currentIndex + 1); });
  Array.prototype.forEach.call(document.querySelectorAll("[data-image-close]"), function(btn){ btn.addEventListener("click", closeImageModal); });
  imageModal.addEventListener("click", function(ev){
    var t = ev.target;
    if (t && t.getAttribute && t.getAttribute("data-image-close") !== null) closeImageModal();
  });
  document.addEventListener("keydown", function(ev){
    if (imageModal.hidden) return;
    if (ev.key === "Escape") { closeImageModal(); return; }
    if (ev.key === "ArrowRight" || ev.key === "ArrowDown") { ev.preventDefault(); showIndex(currentIndex + 1); }
    if (ev.key === "ArrowLeft" || ev.key === "ArrowUp") { ev.preventDefault(); showIndex(currentIndex - 1); }
  });
  var touchStartX = null, touchStartY = null;
  if (imageZoomWrap){
    imageZoomWrap.addEventListener("touchstart", function(e){
      if (e.touches && e.touches.length === 1){ touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY; }
      else { touchStartX = null; touchStartY = null; }
    }, {passive:true});
    imageZoomWrap.addEventListener("touchend", function(e){
      if (touchStartX == null || gallery.length <= 1) { touchStartX = null; touchStartY = null; return; }
      var t0 = e.changedTouches && e.changedTouches[0];
      if (!t0) { touchStartX = null; touchStartY = null; return; }
      var dx = t0.clientX - touchStartX;
      var dy = t0.clientY - touchStartY;
      touchStartX = null; touchStartY = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)){
        if (dx < 0) showIndex(currentIndex + 1); else showIndex(currentIndex - 1);
      }
    }, {passive:true});
  }

  function showInlineGallery(cat, img){
    if (!cat || !img) return;
    var view = cat.querySelector(".gallery-inline-view");
    if (!view) return;
    var vimg = view.querySelector(".gallery-inline-img");
    var cap = view.querySelector(".gallery-inline-caption");
    var src = img.currentSrc || img.src || img.getAttribute("src") || "";
    if (vimg){ vimg.src = src; vimg.alt = img.getAttribute("alt") || cat.getAttribute("data-gallery-name") || ""; }
    if (cap){ cap.textContent = cat.getAttribute("data-gallery-name") || img.getAttribute("alt") || ""; }
    view.hidden = false;
    var figs = cat.querySelectorAll(".gallery-item");
    for (var i = 0; i < figs.length; i++){ figs[i].classList.remove("active"); }
    var fig = img.closest ? img.closest(".gallery-item") : null;
    if (fig) fig.classList.add("active");
    try { view.scrollIntoView({ block: "nearest", behavior: "auto" }); } catch(e){}
  }

  document.addEventListener("click", function(ev){
    var t = ev.target;
    if (!t || !t.closest) return;
    if (imageModal && !imageModal.hidden && imageModal.contains(t)) return;
    var img = (t.tagName === "IMG") ? t : t.closest("img");
    if (img && !isExcludedImg(img)){
      var cat = img.closest(".gallery-category");
      if (cat && cat.querySelector(".gallery-inline-view")){
        ev.preventDefault(); ev.stopPropagation();
        showInlineGallery(cat, img);
        return;
      }
    }
    var trigger = t.closest("[data-zoom-src]");
    if (trigger){
      ev.preventDefault(); ev.stopPropagation();
      openFrom(trigger, itemFromTrigger(trigger));
      return;
    }
    if (!img) return;
    if (isExcludedImg(img)) return;
    var item = itemFromImg(img);
    if (!item || !item.src) return;
    ev.preventDefault(); ev.stopPropagation();
    openFrom(img, item);
  }, true);
})();
