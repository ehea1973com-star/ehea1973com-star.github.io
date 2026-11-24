(function () {
  var OWNER = "ehea1973com-star";
  var REPO = "ehea1973com-star.github.io";
  var BRANCH = "main";
  var GITHUB_API = "https://api.github.com/repos/" + OWNER + "/" + REPO + "/contents/";
  var TOKEN_KEY = "yahya_site_upload_token";
  var ADS_FILE = "data/ads.json";
  var LOCAL_KEY = "yahya_ads_v1";
  var SEEN_ADS_KEY = "yahya_ad_seen_v1";
  var SESSION_KEY = "yahya_firebase_session_v1";
  var config = window.YAHYA_FIREBASE_CONFIG || {};
  var form = document.getElementById("adForm");
  var formStatus = document.getElementById("adFormStatus");
  var adminList = document.getElementById("adAdminList");
  var refreshBtn = document.getElementById("adRefreshBtn");
  var allAds = [];
  var sourceSha = "";
  var sourceRemote = false;

  function getSession() {
    try {
      return JSON.parse(window.localStorage.getItem(SESSION_KEY) || "null");
    } catch (error) {
      return null;
    }
  }

  function getGithubToken() {
    var input = document.getElementById("token");
    var value = input && input.value ? String(input.value).trim() : "";
    if (!value) {
      try { value = String(window.localStorage.getItem(TOKEN_KEY) || "").trim(); } catch (error) {}
    }
    return value;
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

  function setFormStatus(message) {
    if (formStatus) formStatus.textContent = message || "";
  }

  function safeUrl(value) {
    var text = String(value || "").trim();
    if (!text) return "";
    try {
      var url = new URL(text, window.location.href);
      if (url.protocol === "http:" || url.protocol === "https:") return url.href;
    } catch (error) {}
    return "";
  }

  function decodeBase64Text(base64) {
    var binary = atob(String(base64 || "").replace(/\s/g, ""));
    var bytes = new Uint8Array(binary.length);
    for (var index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    if (window.TextDecoder) return new TextDecoder("utf-8").decode(bytes);
    return decodeURIComponent(escape(binary));
  }

  function encodeTextBase64(text) {
    if (window.TextEncoder) {
      var bytes = new TextEncoder().encode(text);
      var binary = "";
      for (var index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index]);
      return btoa(binary);
    }
    return btoa(unescape(encodeURIComponent(text)));
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

  function githubGetAds() {
    var token = getGithubToken();
    if (!token || !window.fetch) return Promise.reject(new Error("unavailable"));
    return window.fetch(GITHUB_API + ADS_FILE + "?ref=" + encodeURIComponent(BRANCH) + "&t=" + Date.now(), {
      method: "GET",
      headers: repoHeaders(token, false),
      cache: "no-store"
    }).then(function (response) {
      if (response.status === 404) return null;
      if (!response.ok) return githubError(response);
      return response.json();
    });
  }

  function githubPutAds(ads, sha, message) {
    var token = getGithubToken();
    if (!token || !window.fetch) return Promise.reject(new Error("unavailable"));
    var body = {
      message: message,
      content: encodeTextBase64(JSON.stringify(ads, null, 2)),
      branch: BRANCH
    };
    if (sha) body.sha = sha;
    return window.fetch(GITHUB_API + ADS_FILE, {
      method: "PUT",
      headers: repoHeaders(token, true),
      body: JSON.stringify(body)
    }).then(function (response) {
      if (!response.ok) return githubError(response);
      return response.json();
    }).then(function (result) {
      if (result && result.content && result.content.sha) sourceSha = result.content.sha;
      return result;
    });
  }

  function normalizeAd(value) {
    var ad = value || {};
    var size = String(ad.size || "medium");
    if (size !== "small" && size !== "medium" && size !== "large" && size !== "wide") size = "medium";
    var type = String(ad.type || "link");
    if (type !== "image" && type !== "video" && type !== "link") type = "link";
    return {
      id: String(ad.id || "ad-" + Date.now() + "-" + Math.floor(Math.random() * 100000)),
      title: String(ad.title || "").slice(0, 120),
      description: String(ad.description || "").slice(0, 300),
      type: type,
      mediaUrl: String(ad.mediaUrl || ""),
      linkUrl: String(ad.linkUrl || ""),
      active: !!ad.active,
      size: size,
      startAt: String(ad.startAt || ""),
      endAt: String(ad.endAt || ""),
      durationSeconds: Math.max(0, Number(ad.durationSeconds) || 0),
      createdAt: String(ad.createdAt || new Date().toISOString())
    };
  }

  function readLocalAds() {
    try {
      var data = JSON.parse(window.localStorage.getItem(LOCAL_KEY) || "[]");
      if (data && data.length) return data.map(normalizeAd);
    } catch (error) {}
    return [];
  }

  function writeLocalAds(ads) {
    try {
      window.localStorage.setItem(LOCAL_KEY, JSON.stringify(ads));
    } catch (error) {}
  }

  function readSeenAds() {
    try {
      return JSON.parse(window.localStorage.getItem(SEEN_ADS_KEY) || "{}") || {};
    } catch (error) {
      return {};
    }
  }

  function writeSeenAds(value) {
    try {
      window.localStorage.setItem(SEEN_ADS_KEY, JSON.stringify(value));
    } catch (error) {}
  }

  function activeNow(ad) {
    var now = Date.now();
    if (ad.startAt) {
      var start = new Date(ad.startAt).getTime();
      if (!isNaN(start) && now < start) return false;
    }
    if (ad.endAt) {
      var end = new Date(ad.endAt).getTime();
      if (!isNaN(end) && now > end) return false;
    }
    return true;
  }

  function visibleAds(ads) {
    var seen = readSeenAds();
    var now = Date.now();
    var result = ads.filter(function (ad) {
      if (!ad.id || !ad.title || !ad.active || !activeNow(ad)) return false;
      if (!ad.durationSeconds) return true;
      var shownAt = Number(seen[ad.id]) || 0;
      return !shownAt || now - shownAt > ad.durationSeconds * 1000;
    });
    result.forEach(function (ad) {
      if (ad.durationSeconds) seen[ad.id] = now;
    });
    writeSeenAds(seen);
    return result;
  }

  function loadAds() {
    var local = readLocalAds();
    var canUseGithub = !!getGithubToken() && !!form;
    if (canUseGithub) {
      return githubGetAds().then(function (file) {
        sourceRemote = true;
        sourceSha = file && file.sha ? file.sha : "";
        allAds = file ? JSON.parse(decodeBase64Text(file.content)).map(normalizeAd) : [];
        writeLocalAds(allAds);
        renderFloatingAds(visibleAds(allAds));
        if (adminList) renderAdminAds(allAds);
        return allAds;
      }).catch(function () {
        sourceRemote = false;
        allAds = local;
        renderFloatingAds(visibleAds(allAds));
        if (adminList) renderAdminAds(allAds);
        if (formStatus && isOwner()) setFormStatus("تعذّر تحميل الإعلانات من GitHub؛ استخدمت النسخة المحلية.");
        return allAds;
      });
    }
    return new Promise(function (resolve) {
      if (!window.fetch) {
        allAds = local;
        renderFloatingAds(visibleAds(allAds));
        if (adminList) renderAdminAds(allAds);
        resolve(allAds);
        return;
      }
      window.fetch("/data/ads.json?v=" + Date.now(), { method: "GET", cache: "no-store" }).then(function (response) {
        if (!response.ok) throw new Error("unavailable");
        return response.json();
      }).then(function (data) {
        allAds = (data && data.length ? data : local).map(normalizeAd);
      }).catch(function () {
        allAds = local;
      }).then(function () {
        writeLocalAds(allAds);
        renderFloatingAds(visibleAds(allAds));
        if (adminList) renderAdminAds(allAds);
        resolve(allAds);
      });
    });
  }

  function saveAds(ads, message) {
    writeLocalAds(ads);
    allAds = ads.map(normalizeAd);
    if (!getGithubToken()) {
      setFormStatus(message + " على هذا الجهاز فقط. أدخل GitHub Token في لوحة المالك ليظهر للزوار.");
      renderFloatingAds(visibleAds(allAds));
      if (adminList) renderAdminAds(allAds);
      return Promise.resolve(false);
    }
    return githubPutAds(allAds, sourceSha, message).then(function () {
      setFormStatus(message + " وظهر لكل الزوار بعد تحديث الصفحة.");
      return loadAds();
    }).catch(function (error) {
      setFormStatus("تم الحفظ محليًا فقط: " + (error && error.message ? error.message : "تعذّر الكتابة إلى GitHub"));
      renderFloatingAds(visibleAds(allAds));
      if (adminList) renderAdminAds(allAds);
      return false;
    });
  }

  function addText(target, tag, className, value) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    node.textContent = value || "";
    target.appendChild(node);
    return node;
  }

  function createAdCard(ad, compact) {
    var target = safeUrl(ad.linkUrl) || safeUrl(ad.mediaUrl) || window.location.href;
    var card = document.createElement("a");
    card.className = "site-ad-card site-ad-" + ad.size + (compact ? " compact" : "");
    card.href = target;
    card.target = "_blank";
    card.rel = "noopener noreferrer";
    if (ad.type === "image" && safeUrl(ad.mediaUrl)) {
      var image = document.createElement("img");
      image.className = "site-ad-image";
      image.src = safeUrl(ad.mediaUrl);
      image.alt = ad.title;
      image.loading = "lazy";
      card.appendChild(image);
    } else if (ad.type === "video") {
      var play = document.createElement("span");
      play.className = "site-ad-play";
      play.textContent = "▶";
      card.appendChild(play);
    }
    var copy = document.createElement("span");
    copy.className = "site-ad-copy";
    addText(copy, "strong", "", ad.title);
    if (!compact && ad.description) addText(copy, "span", "", ad.description);
    card.appendChild(copy);
    return card;
  }

  function renderFloatingAds(ads) {
    var floating = document.getElementById("siteAdFloating");
    if (!floating) {
      floating = document.createElement("div");
      floating.id = "siteAdFloating";
      floating.className = "site-ad-floating";
      document.body.appendChild(floating);
    }
    floating.innerHTML = "";
    if (!ads.length) {
      floating.hidden = true;
      return;
    }
    floating.hidden = false;
    var label = document.createElement("span");
    label.className = "site-ad-label";
    label.textContent = "إعلانات";
    floating.appendChild(label);
    var strip = document.createElement("div");
    strip.className = "site-ad-strip";
    ads.slice(0, 3).forEach(function (ad) {
      strip.appendChild(createAdCard(ad, true));
    });
    floating.appendChild(strip);
  }

  function renderAdminAds(ads) {
    if (!adminList) return;
    adminList.innerHTML = "";
    if (!ads.length) {
      var empty = document.createElement("p");
      empty.className = "notification-empty";
      empty.textContent = "لا توجد إعلانات بعد.";
      adminList.appendChild(empty);
      return;
    }
    ads.forEach(function (ad) {
      var card = document.createElement("article");
      card.className = "ad-admin-item";
      if (!ad.active) card.classList.add("inactive");
      var info = document.createElement("div");
      info.className = "ad-admin-info";
      addText(info, "strong", "", ad.title);
      var control = ad.size + " — " + (ad.durationSeconds ? ad.durationSeconds + " ثانية" : "دائم") + (ad.endAt ? " — حتى " + ad.endAt : "");
      addText(info, "small", "", ad.type + " — " + (ad.active ? "مفعّل" : "متوقف") + " — " + control);
      if (ad.description) addText(info, "span", "", ad.description);
      var controls = document.createElement("div");
      controls.className = "ad-admin-controls";
      var sizeSelect = document.createElement("select");
      ["small", "medium", "large", "wide"].forEach(function (value) {
        var option = document.createElement("option");
        option.value = value;
        option.textContent = value === "small" ? "صغير" : value === "medium" ? "متوسط" : value === "large" ? "كبير" : "عريض";
        sizeSelect.appendChild(option);
      });
      sizeSelect.value = ad.size;
      sizeSelect.addEventListener("change", function () { updateAd(ad.id, { size: sizeSelect.value }, "تم تحديث حجم الإعلان"); });
      var durationInput = document.createElement("input");
      durationInput.type = "number";
      durationInput.min = "0";
      durationInput.value = String(ad.durationSeconds);
      durationInput.title = "مدة الظهور بالثوانٍ، صفر يعني دائم";
      durationInput.addEventListener("change", function () { updateAd(ad.id, { durationSeconds: durationInput.value }, "تم تحديث مدة الإعلان"); });
      var endInput = document.createElement("input");
      endInput.type = "datetime-local";
      if (ad.endAt) {
        var endDate = new Date(ad.endAt);
        if (!isNaN(endDate.getTime())) endInput.value = endDate.toISOString().slice(0, 16);
      }
      endInput.title = "تاريخ ووقت انتهاء الإعلان";
      endInput.addEventListener("change", function () { updateAd(ad.id, { endAt: endInput.value }, "تم تحديث موعد انتهاء الإعلان"); });
      controls.appendChild(sizeSelect);
      controls.appendChild(durationInput);
      controls.appendChild(endInput);
      var actions = document.createElement("div");
      actions.className = "ad-admin-actions";
      var toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "btn btn-ghost btn-small";
      toggle.textContent = ad.active ? "إيقاف" : "تفعيل";
      toggle.addEventListener("click", function () { updateAd(ad.id, { active: !ad.active }, ad.active ? "تم إيقاف الإعلان" : "تم تفعيل الإعلان"); });
      var remove = document.createElement("button");
      remove.type = "button";
      remove.className = "btn btn-ghost btn-small";
      remove.textContent = "حذف";
      remove.addEventListener("click", function () { deleteAd(ad.id); });
      actions.appendChild(toggle);
      actions.appendChild(remove);
      card.appendChild(info);
      card.appendChild(controls);
      card.appendChild(actions);
      adminList.appendChild(card);
    });
  }

  function updateAd(id, fields, message) {
    if (!isOwner()) return;
    var next = allAds.map(function (ad) {
      if (ad.id !== id) return ad;
      var updated = {};
      Object.keys(ad).forEach(function (key) { updated[key] = ad[key]; });
      Object.keys(fields).forEach(function (key) { updated[key] = fields[key]; });
      return normalizeAd(updated);
    });
    saveAds(next, message);
  }

  function deleteAd(id) {
    if (!isOwner()) return;
    var next = allAds.filter(function (ad) { return ad.id !== id; });
    saveAds(next, "تم حذف الإعلان");
  }

  function submitAd(event) {
    if (event) event.preventDefault();
    if (!isOwner()) {
      setFormStatus("سجّل الدخول بحساب المالك لإضافة الإعلانات.");
      return;
    }
    var title = document.getElementById("adTitle");
    var description = document.getElementById("adDescription");
    var type = document.getElementById("adType");
    var mediaUrl = document.getElementById("adMediaUrl");
    var linkUrl = document.getElementById("adLinkUrl");
    var active = document.getElementById("adActive");
    var name = String(title && title.value || "").trim();
    var media = safeUrl(mediaUrl && mediaUrl.value);
    var link = safeUrl(linkUrl && linkUrl.value);
    var selectedType = String(type && type.value || "link");
    if (!name || ((selectedType === "image" || selectedType === "video") && !media) || (!media && !link)) {
      setFormStatus("أدخل عنوانًا ورابطًا صحيحًا للإعلان.");
      return;
    }
    setFormStatus("جارٍ حفظ الإعلان...");
    var ad = normalizeAd({
      title: name,
      description: String(description && description.value || ""),
      type: selectedType,
      mediaUrl: media,
      linkUrl: link || media,
      active: !!(active && active.checked),
      size: String(document.getElementById("adSize") && document.getElementById("adSize").value || "medium"),
      startAt: String(document.getElementById("adStart") && document.getElementById("adStart").value || ""),
      endAt: String(document.getElementById("adEnd") && document.getElementById("adEnd").value || ""),
      durationSeconds: Number(document.getElementById("adDuration") && document.getElementById("adDuration").value || 0),
      createdAt: new Date().toISOString()
    });
    saveAds([ad].concat(allAds), "تمت إضافة إعلان").then(function () {
      if (title) title.value = "";
      if (description) description.value = "";
      if (mediaUrl) mediaUrl.value = "";
      if (linkUrl) linkUrl.value = "";
    });
  }

  if (form) form.addEventListener("submit", submitAd);
  if (refreshBtn) refreshBtn.addEventListener("click", function () { loadAds(); });
  window.addEventListener("yahya-auth-change", function () { loadAds(); });

  loadAds();
})();
