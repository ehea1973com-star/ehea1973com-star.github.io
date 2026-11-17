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
        function () { showToast("تم نسخ رابط الموقع"); },
        function () { showToast("تعذّر نسخ الرابط"); }
      );
    });
  });

  var shareSite = document.getElementById("shareSite");
  if (shareSite) {
    shareSite.addEventListener("click", function () {
      var url = window.location.origin + window.location.pathname;
      function fallbackShare() {
        copyText(
          url,
          function () { showToast("تم نسخ رابط الموقع للمشاركة"); },
          function () { showToast("تعذّر نسخ الرابط"); }
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
  function onScroll() {
    if (header) header.classList.toggle("scrolled", window.scrollY > 16);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    Array.prototype.forEach.call(reveals, function (element) {
      element.classList.add("will-reveal");
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

    Array.prototype.forEach.call(reveals, function (element) {
      observer.observe(element);
    });
  } else {
    Array.prototype.forEach.call(reveals, function (element) {
      element.classList.add("will-reveal", "in-view");
    });
  }

  var liveIframe = document.getElementById("liveIframe");
  var liveNote = document.getElementById("liveNote");
  var liveTabs = document.querySelectorAll("[data-live-tab]");
  var LIVE_SOURCES = {
    videos: "https://www.youtube.com/embed/videoseries?list=UUmChpVHGV74adiqncSyocg",
    live: "https://www.youtube.com/embed/live_stream?channel=UCmChpVHGV74adiqncSyocg"
  };
  var LIVE_NOTES = {
    videos: "يعرض هذا القسم آخر فيديوهات القناة. عند بدء بث مباشر اختر «البث المباشر» أو افتح القناة على يوتيوب.",
    live: "إذا ظهر «غير متوفر» فهذا يعني أن القناة لا تبث الآن. افتح القناة على يوتيوب لمعرفة موعد البث القادم."
  };

  function setLiveTab(name) {
    if (!LIVE_SOURCES[name]) name = "videos";
    if (liveIframe && liveIframe.getAttribute("src") !== LIVE_SOURCES[name]) {
      liveIframe.setAttribute("src", LIVE_SOURCES[name]);
      liveIframe.setAttribute("title", name === "live" ? "البث المباشر لقناة يحيى التقنية" : "فيديوهات قناة يحيى التقنية");
    }
    if (liveNote) liveNote.textContent = LIVE_NOTES[name];
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

  var CATEGORY_LABELS = {
    all: "الكل",
    tools: "أدوات",
    islamic: "أذكار",
    security: "حماية",
    games: "شحن ألعاب",
    diagnostics: "تشخيص",
    system: "نظامي"
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
      return window.localStorage.getItem(UPLOAD_TOKEN_KEY) || "";
    } catch (error) {
      return "";
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

  function categoryLabel(category) {
    return CATEGORY_LABELS[category] || CATEGORY_LABELS.tools;
  }

  function addDetailsButton(card) {
    var actions = card.querySelector(".card-actions");
    if (!actions || actions.querySelector("[data-app-details]")) return;
    var button = appElement("button", "mini-link app-details", "نظرة سريعة");
    button.type = "button";
    button.setAttribute("data-app-details", "");
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
    if (resultCount) resultCount.textContent = "عرض " + visible + " من " + cards.length;
  }

  function makePhoneAppCard(app, index) {
    if (!app || !app.name || !app.filename) return null;
    if (!/^[A-Za-z0-9._-]+\.apk$/.test(app.filename)) return null;
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
    var download = appElement("a", "btn btn-small", "تحميل APK");
    download.href = "apps/" + app.filename;
    download.setAttribute("download", "");
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
      image.src = source;
      image.alt = "لقطة من تطبيق " + appName;
      image.loading = "lazy";
      image.decoding = "async";
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
    var packageName = card ? card.getAttribute("data-package") : "";
    var remaining = data ? MAX_SCREENSHOTS - data.screenshots.length : 0;
    var canAdd = !!(packageName && data && remaining > 0);
    screenshotManager.hidden = !canAdd;
    if (!canAdd) return;
    setScreenshotStatus(
      getUploadToken()
        ? "يمكنك إضافة " + remaining + " صور، كل صورة 1 MB."
        : "سيُطلب منك GitHub Token مرة واحدة عند أول رفع."
    );
  }

  function requestUploadToken() {
    var token = getUploadToken();
    if (token) return token;
    token = window.prompt("أدخل GitHub Token بصلاحية Contents: Read and write لإضافة الصور. سيُحفظ على هذا الجهاز فقط.");
    token = token ? token.trim() : "";
    if (token) {
      try {
        window.localStorage.setItem(UPLOAD_TOKEN_KEY, token);
      } catch (error) {}
    }
    return token;
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
      if (file.size > MAX_SCREENSHOT_BYTES) {
        showToast("حجم كل صورة يجب أن يكون 1 MB أو أقل.");
        return;
      }
    }

    var token = requestUploadToken();
    if (!token) {
      setScreenshotStatus("لم يتم إدخال التوكن، لم تُرفع الصور.");
      return;
    }

    var packageSlug = slugify(data.package || data.name);
    var stamp = Date.now();
    var uploaded = [];
    var chain = Promise.resolve();

    if (screenshotInput) screenshotInput.disabled = true;
    setScreenshotStatus("جارٍ رفع الصور إلى GitHub...");

    selected.forEach(function (file, index) {
      chain = chain.then(function () {
        return readFileBase64(file).then(function (base64) {
          var extension = file.name.split(".").pop().toLowerCase();
          var path = "assets/uploads/screens/" + packageSlug + "-" + stamp + "-" + (index + 1) + "." + extension;
          return githubPut(path, base64, "Upload screenshot for " + data.name, null, token).then(function () {
            uploaded.push(path);
            setScreenshotStatus("تم رفع " + uploaded.length + " من " + selected.length + " صور...");
          });
        });
      });
    });

    chain
      .then(function () { return loadRemoteManifest(token); })
      .then(function (manifest) {
        var entry = manifest.apps.filter(function (app) {
          return app && (app.package === data.package || app.name === data.name);
        })[0];
        if (!entry) {
          throw new Error("هذا التطبيق غير موجود في apps/manifest.json، أضفه من لوحة الإدارة أولًا.");
        }
        entry.screenshots = existing.concat(uploaded).slice(0, MAX_SCREENSHOTS);
        entry.updatedAt = new Date().toISOString();
        return saveRemoteManifest(manifest.apps, manifest.sha, token);
      })
      .then(function () {
        var next = existing.concat(uploaded).slice(0, MAX_SCREENSHOTS);
        card.setAttribute("data-screenshots", next.join("|"));
        renderScreenshots(next, data.name);
        updateScreenshotManager(card);
        showToast("تمت إضافة لقطات الشاشة بنجاح");
      })
      .catch(function (error) {
        setScreenshotStatus("فشل رفع الصور");
        showToast("فشل رفع الصور: " + (error && error.message ? error.message : String(error)));
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

  var shareCopy = document.getElementById("shareCopy");
  if (shareCopy) {
    shareCopy.addEventListener("click", function () {
      copyText(
        currentShareUrl,
        function () { showToast("تم نسخ رابط التطبيق"); },
        function () { showToast("تعذّر نسخ الرابط"); }
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
          }
        });
        var counter = document.querySelector("[data-app-count]");
        if (counter && added) counter.textContent = String(appCountBase + added);
        applyFilters();
        openDeepLink();
      })
      .catch(function () {});
  }
})();
