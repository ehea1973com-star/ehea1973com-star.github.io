(function () {
  var OWNER = "ehea1973com-star";
  var REPO = "ehea1973com-star.github.io";
  var BRANCH = "main";
  var API = "https://api.github.com/repos/" + OWNER + "/" + REPO + "/contents/";
  var TOKEN_KEY = "yahya_site_upload_token";
  var MAX_SIZE = 25 * 1024 * 1024;
  var MAX_SCREENSHOTS = 3;
  var MAX_SCREENSHOT_SIZE = 1024 * 1024;
  var CATEGORY_NAMES = {
    tools: "أدوات",
    islamic: "أذكار",
    security: "حماية",
    games: "شحن ألعاب",
    diagnostics: "تشخيص",
    system: "نظامي"
  };


  function tr(key, fb) {
    try { if (window.YahyaI18n && typeof window.YahyaI18n.t === "function") { var v = window.YahyaI18n.t(key); if (v) return v; } } catch (e) {}
    return fb || "";
  }

  var form = document.getElementById("uploadForm");
  var tokenInput = document.getElementById("token");
  var toggleToken = document.getElementById("toggleToken");
  var saveToken = document.getElementById("saveToken");
  var clearToken = document.getElementById("clearToken");
  var uploadButton = document.getElementById("uploadButton");
  var statusBox = document.getElementById("status");
  var categoryInput = document.getElementById("category");
  var screenshotInput = document.getElementById("screenshotFiles");
  var adminGate = document.getElementById("adminGate");
  var adminContent = document.getElementById("adminContent");
  var adminLogin = document.getElementById("adminLogin");
  var adminLogout = document.getElementById("adminLogout");
  var adminGateMessage = document.getElementById("adminGateMessage");

  function showAdminGate(message, showLogout) {
    if (adminGate) adminGate.hidden = false;
    if (adminContent) adminContent.hidden = true;
    if (adminGateMessage) {
      adminGateMessage.textContent = message || "";
      adminGateMessage.hidden = !message;
    }
    if (adminLogout) adminLogout.hidden = !showLogout;
  }

  function showAdminContent() {
    if (adminGate) adminGate.hidden = true;
    if (adminContent) adminContent.hidden = false;
  }

  function checkAdminAccess() {
    var auth = window.YahyaAuth;
    var user = auth && auth.getUser ? auth.getUser() : null;
    if (!user) {
      showAdminGate("", false);
      return;
    }
    if (!auth.isOwner()) {
      showAdminGate("هذا الحساب ليس مالك الموقع. سجّل الخروج ثم ادخل بحساب المالك.", true);
      return;
    }
    showAdminContent();
  }

  if (adminLogin) {
    adminLogin.addEventListener("click", function () {
      if (window.YahyaAuth) window.YahyaAuth.open("login");
    });
  }

  if (adminLogout) {
    adminLogout.addEventListener("click", function () {
      if (window.YahyaAuth) window.YahyaAuth.logout();
    });
  }

  window.addEventListener("yahya-auth-change", checkAdminAccess);
  checkAdminAccess();

  if (!form || !tokenInput || !statusBox) return;

  var savedToken = window.localStorage.getItem(TOKEN_KEY);
  if (savedToken) {
    tokenInput.value = savedToken;
    if (saveToken) saveToken.checked = true;
  }

  function persistToken(value) {
    var token = (value || "").replace(/\s+/g, "");
    if (tokenInput && tokenInput.value !== token) tokenInput.value = token;
    try {
      if (token) window.localStorage.setItem(TOKEN_KEY, token);
      else window.localStorage.removeItem(TOKEN_KEY);
    } catch (error) {}
    if (saveToken) saveToken.checked = !!token;
    var hint = document.getElementById("tokenSavedHint");
    if (hint) {
      hint.textContent = token
        ? "✓ التوكن محفوظ على هذا الجهاز (يُستخدم تلقائيًا). يمكنك إظهاره أو مسحه."
        : "يُحفظ تلقائيًا على هذا الجهاز بعد اللصق. أنشئ Fine-grained token للمستودع ehea1973com-star.github.io بصلاحية Contents: Read and write.";
    }
    return token;
  }

  tokenInput.addEventListener("input", function () {
    persistToken(tokenInput.value);
  });
  tokenInput.addEventListener("change", function () {
    persistToken(tokenInput.value);
  });
  tokenInput.addEventListener("paste", function () {
    setTimeout(function () { persistToken(tokenInput.value); }, 0);
  });

  // reflect saved state on load
  persistToken(tokenInput.value || "");

  if (toggleToken) {
    toggleToken.addEventListener("click", function () {
      var show = tokenInput.type === "password";
      tokenInput.type = show ? "text" : "password";
      toggleToken.textContent = show ? "إخفاء التوكن" : "إظهار التوكن";
    });
  }

  function setStatus(message, type) {
    statusBox.textContent = message;
    statusBox.className = "admin-status show" + (type ? " " + type : "");
  }

  function clearStatus() {
    statusBox.textContent = "";
    statusBox.className = "admin-status";
  }

  function encodePath(path) {
    return path.split("/").map(encodeURIComponent).join("/");
  }

  function fileUrl(path) {
    return API + encodePath(path) + "?ref=" + encodeURIComponent(BRANCH);
  }

  function headers(token, json) {
    var result = {
      "Accept": "application/vnd.github+json",
      "Authorization": "Bearer " + token,
      "X-GitHub-Api-Version": "2022-11-28"
    };
    if (json) result["Content-Type"] = "application/json";
    return result;
  }

  async function apiError(response) {
    var message = "HTTP " + response.status;
    try {
      var data = await response.json();
      if (data && data.message) message += ": " + data.message;
    } catch (error) {
      try {
        var text = await response.text();
        if (text) message += ": " + text.slice(0, 180);
      } catch (ignored) {}
    }
    return new Error(message);
  }

  async function getFile(path, token) {
    var response = await fetch(fileUrl(path), {
      method: "GET",
      headers: headers(token, false),
      cache: "no-store"
    });
    if (response.status === 404) return null;
    if (!response.ok) throw await apiError(response);
    return response.json();
  }

  async function putFile(path, base64, message, sha, token) {
    var body = {
      message: message,
      content: base64,
      branch: BRANCH
    };
    if (sha) body.sha = sha;
    var response = await fetch(API + encodePath(path), {
      method: "PUT",
      headers: headers(token, true),
      body: JSON.stringify(body)
    });
    if (!response.ok) throw await apiError(response);
    return response.json();
  }

  function bytesToBase64(bytes) {
    var binary = "";
    var chunk = 0x8000;
    for (var index = 0; index < bytes.length; index += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(index, index + chunk));
    }
    return btoa(binary);
  }

  function base64ToBytes(base64) {
    var clean = String(base64).replace(/\s/g, "");
    var binary = atob(clean);
    var bytes = new Uint8Array(binary.length);
    for (var index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  }

  function decodeContent(file) {
    if (!file || !file.content) return "";
    var bytes = base64ToBytes(file.content);
    if (window.TextDecoder) return new TextDecoder("utf-8").decode(bytes);
    return decodeURIComponent(escape(atob(String(file.content).replace(/\s/g, ""))));
  }

  function encodeText(text) {
    if (window.TextEncoder) return bytesToBase64(new TextEncoder().encode(text));
    return btoa(unescape(encodeURIComponent(text)));
  }

  function readFile(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = function () { reject(new Error("تعذر قراءة الملف.")); };
      reader.readAsArrayBuffer(file);
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
          var base64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
          var binary = atob(base64);
          var bytes = new Uint8Array(binary.length);
          for (var i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
          if (url) { try { URL.revokeObjectURL(url); } catch (e) {} }
          resolve({ base64: base64, bytes: bytes, ext: "jpg" });
        } catch (err) {
          if (url) { try { URL.revokeObjectURL(url); } catch (e) {} }
          reject(new Error("تعذر معالجة لقطة الشاشة."));
        }
      };
      img.onerror = function () {
        if (url) { try { URL.revokeObjectURL(url); } catch (e) {} }
        reject(new Error("تعذر فتح لقطة الشاشة."));
      };
      img.src = url || "";
      if (!url) {
        readFile(file).then(function (buf) {
          var bytes = new Uint8Array(buf);
          resolve({ base64: bytesToBase64(bytes), bytes: bytes, ext: (file.name.split(".").pop() || "jpg").toLowerCase() });
        }).catch(reject);
      }
    });
  }

  async function sha256(buffer) {
    if (!window.crypto || !window.crypto.subtle) {
      throw new Error("المتصفح لا يدعم حساب SHA-256. استخدم Chrome حديثًا.");
    }
    var digest = await window.crypto.subtle.digest("SHA-256", buffer);
    return Array.prototype.map.call(new Uint8Array(digest), function (byte) {
      return byte.toString(16).padStart(2, "0");
    }).join("");
  }

  function slug(value) {
    return String(value).trim().replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase();
  }

  function formatSize(bytes) {
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    return Math.max(1, Math.round(bytes / 1024)) + " KB";
  }

  async function loadManifest(token) {
    var file = await getFile("apps/manifest.json", token);
    var apps = [];
    if (file && file.content) {
      try {
        var parsed = JSON.parse(decodeContent(file));
        if (Array.isArray(parsed)) apps = parsed;
        else if (parsed && Array.isArray(parsed.apps)) apps = parsed.apps;
      } catch (error) {
        apps = [];
      }
    }
    return { file: file, apps: apps };
  }

  async function updateChecksums(filename, hash, token) {
    var file = await getFile("apps/SHA256SUMS.txt", token);
    var lines = [];
    if (file && file.content) {
      lines = decodeContent(file).split(/\r?\n/).filter(function (line) {
        return line.trim() && line.indexOf(filename) === -1;
      });
    }
    lines.push(hash + "  " + filename);
    lines.sort();
    await putFile(
      "apps/SHA256SUMS.txt",
      encodeText(lines.join("\n") + "\n"),
      "Update SHA-256 checksums",
      file ? file.sha : null,
      token
    );
  }

  if (clearToken) {
    clearToken.addEventListener("click", function () {
      persistToken("");
      clearStatus();
      setStatus(tr("token.cleared","تم مسح التوكن من هذا الجهاز."), "ok");
    });
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    clearStatus();

    var token = persistToken(tokenInput.value);
    var name = document.getElementById("appName").value.trim();
    var packageName = document.getElementById("packageName").value.trim();
    var version = document.getElementById("version").value.trim();
    var description = document.getElementById("description").value.trim();
    var category = categoryInput ? categoryInput.value : "tools";
    var apkInput = document.getElementById("apkFile");
    var file = apkInput.files && apkInput.files[0];
    var iconInput = document.getElementById("iconFile");
    var iconFile = iconInput && iconInput.files ? iconInput.files[0] : null;
    var screenshotFiles = screenshotInput && screenshotInput.files
      ? Array.prototype.slice.call(screenshotInput.files)
      : [];

    if (!token) return setStatus("أدخل GitHub Token أولًا.", "error");
    if (!name) return setStatus("أدخل اسم التطبيق.", "error");
    if (!packageName) return setStatus("أدخل اسم الحزمة.", "error");
    if (!slug(packageName)) return setStatus("اسم الحزمة يحتوي رموزًا غير صالحة.", "error");
    if (!version) return setStatus("أدخل إصدار التطبيق.", "error");
    if (!slug(version)) return setStatus("الإصدار يحتوي رموزًا غير صالحة.", "error");
    if (!file) return setStatus("اختر ملف APK.", "error");
    if (!/\.apk$/i.test(file.name)) return setStatus("الملف يجب أن يكون بصيغة APK.", "error");
    if (file.size > MAX_SIZE) {
      return setStatus("حجم الملف أكبر من 25 MB. استخدم GitHub Releases لهذا الملف.", "error");
    }
    if (iconFile) {
      var iconExtension = iconFile.name.split(".").pop().toLowerCase();
      if (!/^(png|jpe?g|webp|svg)$/.test(iconExtension)) {
        return setStatus("الأيقونة يجب أن تكون PNG أو JPG أو WEBP أو SVG.", "error");
      }
      if (iconFile.size > 1024 * 1024) {
        return setStatus("حجم الأيقونة أكبر من 1 MB.", "error");
      }
    }
    if (screenshotFiles.length > MAX_SCREENSHOTS) {
      return setStatus("يمكن رفع " + MAX_SCREENSHOTS + " لقطات شاشة كحد أقصى.", "error");
    }
    for (var shotIndex = 0; shotIndex < screenshotFiles.length; shotIndex += 1) {
      var shot = screenshotFiles[shotIndex];
      var shotExtension = shot.name.split(".").pop().toLowerCase();
      if (!/^(png|jpe?g|webp)$/.test(shotExtension)) {
        return setStatus("لقطات الشاشة يجب أن تكون PNG أو JPG أو WEBP.", "error");
      }
    }

    uploadButton.disabled = true;
    uploadButton.textContent = "جارٍ الرفع...";

    try {
      var filename = slug(packageName) + "-v" + slug(version) + ".apk";
      setStatus("جارٍ قراءة الملف وحساب SHA-256...");
      var buffer = await readFile(file);
      var hash = await sha256(buffer);
      var base64 = bytesToBase64(new Uint8Array(buffer));

      setStatus("جارٍ رفع APK إلى GitHub...");
      var existingApk = await getFile("apps/" + filename, token);
      await putFile(
        "apps/" + filename,
        base64,
        "Upload " + filename,
        existingApk ? existingApk.sha : null,
        token
      );

      setStatus("جارٍ قراءة قائمة التطبيقات الحالية...");
      var manifest = await loadManifest(token);
      var existingEntry = manifest.apps.filter(function (app) {
        return app && (app.package === packageName || app.filename === filename);
      })[0] || null;

      var iconPath = existingEntry && /^assets\/[A-Za-z0-9._\/-]+$/.test(existingEntry.icon || "") &&
        (existingEntry.icon || "").indexOf("..") === -1
        ? existingEntry.icon
        : "assets/icons/system.svg";
      if (iconFile) {
        setStatus("جارٍ رفع أيقونة التطبيق...");
        var iconExtension = iconFile.name.split(".").pop().toLowerCase();
        var iconName = slug(packageName) + "." + iconExtension;
        iconPath = "assets/uploads/" + iconName;
        var iconBuffer = await readFile(iconFile);
        var iconBase64 = bytesToBase64(new Uint8Array(iconBuffer));
        var existingIcon = await getFile(iconPath, token);
        await putFile(
          iconPath,
          iconBase64,
          "Upload icon for " + name,
          existingIcon ? existingIcon.sha : null,
          token
        );
      }

      var screenshots = existingEntry && Array.isArray(existingEntry.screenshots)
        ? existingEntry.screenshots.filter(function (path) {
          return /^assets\/[A-Za-z0-9._\/-]+$/.test(path) && path.indexOf("..") === -1;
        })
        : [];
      if (screenshotFiles.length) {
        screenshots = [];
        for (var shotFileIndex = 0; shotFileIndex < screenshotFiles.length; shotFileIndex += 1) {
          var shotFile = screenshotFiles[shotFileIndex];
          setStatus("جارٍ تجهيز لقطة الشاشة " + (shotFileIndex + 1) + " (720×1648)...");
          var processedShot = await resizeScreenshotTo720x1648(shotFile);
          var shotName = slug(packageName) + "-" + (shotFileIndex + 1) + "." + (processedShot.ext || "jpg");
          var shotPath = "assets/uploads/screens/" + shotName;
          setStatus("جارٍ رفع لقطة الشاشة " + (shotFileIndex + 1) + " من " + screenshotFiles.length + "...");
          var existingShot = await getFile(shotPath, token);
          await putFile(
            shotPath,
            processedShot.base64,
            "Upload screenshot " + (shotFileIndex + 1) + " for " + name,
            existingShot ? existingShot.sha : null,
            token
          );
          screenshots.push(shotPath);
        }
      }

      setStatus("جارٍ تحديث قائمة التطبيقات...");
      var entry = {
        name: name,
        package: packageName,
        version: version,
        description: description,
        category: category,
        filename: filename,
        size: file.size,
        sha256: hash,
        updatedAt: new Date().toISOString(),
        icon: iconPath,
        screenshots: screenshots
      };
      manifest.apps = manifest.apps.filter(function (app) {
        return app && app.package !== packageName && app.filename !== filename;
      });
      manifest.apps.unshift(entry);
      var manifestText = JSON.stringify({ apps: manifest.apps }, null, 2) + "\n";
      await putFile(
        "apps/manifest.json",
        encodeText(manifestText),
        "Add " + name + " v" + version,
        manifest.file ? manifest.file.sha : null,
        token
      );

      setStatus("جارٍ تحديث بصمات SHA-256...");
      await updateChecksums(filename, hash, token);

      if (saveToken && saveToken.checked) window.localStorage.setItem(TOKEN_KEY, token);
      else window.localStorage.removeItem(TOKEN_KEY);

      setStatus(
        "تم رفع " + name + " " + version + " بنجاح.\n" +
        "القسم: " + (CATEGORY_NAMES[category] || category) + "\n" +
        "الحجم: " + formatSize(file.size) + "\n" +
        "لقطات الشاشة: " + screenshots.length + "\n" +
        "SHA-256: " + hash + "\n" +
        "انتظر دقيقة تقريبًا ثم افتح الصفحة الرئيسية.",
        "ok"
      );
      form.reset();
      tokenInput.value = token;
      if (saveToken) saveToken.checked = !!window.localStorage.getItem(TOKEN_KEY);
    } catch (error) {
      setStatus("فشل الرفع: " + (error && error.message ? error.message : String(error)), "error");
    } finally {
      uploadButton.disabled = false;
      uploadButton.textContent = "رفع التطبيق إلى الموقع";
    }
  });

  // ---- Edit published app (icon/description) ----
  var editAppSelect = document.getElementById("editAppSelect");
  var editIconPreview = document.getElementById("editIconPreview");
  var editIconFile = document.getElementById("editIconFile");
  var editDescription = document.getElementById("editDescription");
  var editSaveBtn = document.getElementById("editSaveBtn");
  var editReloadBtn = document.getElementById("editReloadBtn");
  var editStatus = document.getElementById("editStatus");
  var editAppMeta = document.getElementById("editAppMeta");
  var editApps = [];
  var editLoaded = false;

  function setEditStatus(message, type) {
    if (!editStatus) return;
    editStatus.textContent = message || "";
    editStatus.className = "admin-status show" + (type ? " " + type : "");
    if (!message) editStatus.className = "admin-status";
  }

  function appKey(app) {
    if (!app) return "";
    return String(app.package || app.id || app.name || "").trim();
  }

  async function loadEditApps() {
    if (!editAppSelect) return;
    setEditStatus("جارٍ تحميل قائمة التطبيقات...", "");
    try {
      var manifestApps = [];
      try {
        var res = await fetch("apps/manifest.json?t=" + Date.now(), { cache: "no-store" });
        if (res && res.ok) {
          var data = await res.json();
          manifestApps = Array.isArray(data) ? data : (data && Array.isArray(data.apps) ? data.apps : []);
        }
      } catch (e) {}
      var catalogApps = (window.YAHYA_APP_CATALOG || []).slice();
      var map = {};
      var list = [];
      function add(app, source) {
        var k = appKey(app);
        if (!k) return;
        if (!map[k]) {
          var item = {};
          for (var p in app) { if (Object.prototype.hasOwnProperty.call(app, p)) item[p] = app[p]; }
          item._key = k;
          item._source = source;
          map[k] = item;
          list.push(item);
        } else {
          var m = map[k];
          if (source === "manifest") {
            if (app.description) m.description = app.description;
            if (app.icon) m.icon = app.icon;
            if (app.name) m.name = app.name;
            if (app.package) m.package = app.package;
            if (app.category) m.category = app.category;
            if (app.version) m.version = app.version;
            if (app.filename) m.filename = app.filename;
          } else {
            if (!m.download && app.download) m.download = app.download;
            if (!m.id && app.id) m.id = app.id;
          }
        }
      }
      catalogApps.forEach(function (a) { add(a, "catalog"); });
      manifestApps.forEach(function (a) { add(a, "manifest"); });
      list.sort(function (a, b) { return String(a.name || a._key).localeCompare(String(b.name || b._key), "ar"); });
      editApps = list;
      editAppSelect.innerHTML = '<option value="">— اختر تطبيقًا —</option>';
      list.forEach(function (a, i) {
        var opt = document.createElement("option");
        opt.value = String(i);
        opt.textContent = (a.name || a._key) + (a.package ? " (" + a.package + ")" : "");
        editAppSelect.appendChild(opt);
      });
      editLoaded = true;
      setEditStatus("تم تحميل " + list.length + " تطبيقًا. اختر تطبيقًا للتعديل.", "ok");
      if (list.length) { editAppSelect.value = "0"; onEditSelect(); }
    } catch (err) {
      setEditStatus("تعذر تحميل القائمة: " + (err && err.message ? err.message : String(err)), "error");
    }
  }

  function onEditSelect() {
    if (!editAppSelect) return;
    var idx = editAppSelect.value;
    var app = (idx !== "" && editApps[Number(idx)]) ? editApps[Number(idx)] : null;
    if (!app) {
      if (editDescription) editDescription.value = "";
      if (editIconPreview) editIconPreview.src = "assets/icons/system.svg";
      if (editAppMeta) editAppMeta.textContent = "";
      if (editIconFile) editIconFile.value = "";
      return;
    }
    if (editDescription) editDescription.value = app.description || "";
    if (editIconPreview) editIconPreview.src = (app.icon && typeof app.icon === "string") ? app.icon : "assets/icons/system.svg";
    if (editAppMeta) editAppMeta.textContent = [app.package || app.id || "", app.version || "", app.category || ""].filter(Boolean).join(" • ");
    if (editIconFile) editIconFile.value = "";
  }

  async function saveEditApp() {
    if (!editAppSelect) return;
    var idx = editAppSelect.value;
    var app = (idx !== "" && editApps[Number(idx)]) ? editApps[Number(idx)] : null;
    if (!app) return setEditStatus("اختر تطبيقًا أولًا.", "error");
    var token = persistToken(tokenInput ? tokenInput.value : "");
    if (!token) return setEditStatus("أدخل GitHub Token أولًا (في حقل التوكن بالأعلى) بصلاحية Contents: Read and write.", "error");
    var newDesc = editDescription ? String(editDescription.value || "").trim() : (app.description || "");
    var iconFile = editIconFile && editIconFile.files ? editIconFile.files[0] : null;
    if (editSaveBtn) { editSaveBtn.disabled = true; editSaveBtn.textContent = "جارٍ الحفظ..."; }
    try {
      var iconPath = (app.icon && /^assets\/[A-Za-z0-9._\/-]+$/.test(app.icon) && app.icon.indexOf("..") === -1) ? app.icon : "assets/icons/system.svg";
      if (iconFile) {
        var ext = String(iconFile.name.split(".").pop() || "png").toLowerCase();
        if (!/^(png|jpe?g|webp|svg)$/.test(ext)) throw new Error("الأيقونة يجب أن تكون PNG أو JPG أو WEBP أو SVG.");
        if (iconFile.size > 1024 * 1024) throw new Error("حجم الأيقونة أكبر من 1 MB.");
        var slugKey = slug(app.package || app.id || app.name || "app") || "app";
        iconPath = "assets/uploads/" + slugKey + "." + ext;
        setEditStatus("جارٍ رفع الأيقونة...", "");
        var buf = await readFile(iconFile);
        var b64 = bytesToBase64(new Uint8Array(buf));
        var existingIcon = await getFile(iconPath, token);
        await putFile(iconPath, b64, "Update icon for " + (app.name || slugKey), existingIcon ? existingIcon.sha : null, token);
      }

      setEditStatus("جارٍ تحديث قائمة التطبيقات...", "");
      var manifest = await loadManifest(token);
      var key = app._key || appKey(app);
      var entry = null;
      for (var i = 0; i < manifest.apps.length; i++) {
        var a = manifest.apps[i];
        if (!a) continue;
        var ak = String(a.package || a.name || "");
        if ((app.package && a.package === app.package) || (app.name && a.name === app.name) || ak === key) { entry = a; break; }
      }
      if (!entry) {
        var dl = String(app.download || "");
        var filename = (app.filename || "");
        if (!filename) {
          var m1 = /([^\/?#]+\.apk)(?:[?#]|$)/i.exec(dl);
          var m2 = /([^\/?#]+\.zip)(?:[?#]|$)/i.exec(dl);
          if (m1) filename = m1[1];
          else if (m2) filename = m2[1];
        }
        var ver = String(app.version || "1.0").replace(/^v/i, "");
        var pkg = app.package || "";
        if (!pkg && app.id && String(app.id).indexOf(".") >= 0) pkg = app.id;
        entry = {
          name: app.name || key,
          package: pkg || key,
          version: ver,
          description: newDesc,
          category: app.category || "tools",
          filename: filename || "",
          size: (typeof app.size === "number" ? app.size : 0),
          sha256: app.sha256 || "",
          updatedAt: new Date().toISOString(),
          icon: iconPath,
          screenshots: Array.isArray(app.screenshots) ? app.screenshots : []
        };
        manifest.apps.push(entry);
      } else {
        entry.description = newDesc;
        entry.icon = iconPath;
        entry.updatedAt = new Date().toISOString();
        if (!entry.category && app.category) entry.category = app.category;
      }
      var manifestText = JSON.stringify({ apps: manifest.apps }, null, 2) + "\n";
      await putFile("apps/manifest.json", encodeText(manifestText), "Update app details: " + (app.name || key), manifest.file ? manifest.file.sha : null, token);
      app.description = newDesc; app.icon = iconPath;
      if (editIconPreview) editIconPreview.src = iconPath;
      setEditStatus("تم حفظ التعديلات لـ " + (app.name || key) + ". قد تحتاج الصفحة الرئيسية دقيقة أو اثنتين لتظهر التغييرات بعد نشر GitHub Pages.", "ok");
      editLoaded = false;
    } catch (err) {
      setEditStatus("فشل الحفظ: " + (err && err.message ? err.message : String(err)), "error");
    } finally {
      if (editSaveBtn) { editSaveBtn.disabled = false; editSaveBtn.textContent = "حفظ التعديلات"; }
    }
  }

  if (editAppSelect) editAppSelect.addEventListener("change", onEditSelect);
  if (editSaveBtn) editSaveBtn.addEventListener("click", function(){ saveEditApp(); });
  if (editReloadBtn) editReloadBtn.addEventListener("click", function(){ editLoaded = false; loadEditApps(); });
  if (editIconFile) editIconFile.addEventListener("change", function(){
    var f = editIconFile.files && editIconFile.files[0];
    if (f && editIconPreview) {
      try { editIconPreview.src = URL.createObjectURL(f); } catch(e){}
    }
  });
  function maybeLoadEdit() {
    if (adminContent && !adminContent.hidden && !editLoaded && editAppSelect) loadEditApps();
  }
  window.addEventListener("yahya-auth-change", maybeLoadEdit);
  setTimeout(maybeLoadEdit, 300);

  document.addEventListener("yahya:langchange", function () {
    if (toggleToken && tokenInput) {
      var show = tokenInput.type === "text";
      toggleToken.textContent = show ? tr("token.hide","إخفاء التوكن") : tr("token.show","إظهار التوكن");
    }
  });

})();
