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

  var form = document.getElementById("uploadForm");
  var tokenInput = document.getElementById("token");
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
      reader.onerror = function () { reject(new Error("تعذّر قراءة الملف")); };
      reader.readAsArrayBuffer(file);
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
      setStatus("تم مسح التوكن من هذا الجهاز.", "ok");
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
      if (shot.size > MAX_SCREENSHOT_SIZE) {
        return setStatus("حجم كل لقطة شاشة يجب أن يكون 1 MB أو أقل.", "error");
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
          var shotExtension = shotFile.name.split(".").pop().toLowerCase();
          var shotName = slug(packageName) + "-" + (shotFileIndex + 1) + "." + shotExtension;
          var shotPath = "assets/uploads/screens/" + shotName;
          setStatus("جارٍ رفع لقطة الشاشة " + (shotFileIndex + 1) + " من " + screenshotFiles.length + "...");
          var shotBuffer = await readFile(shotFile);
          var shotBase64 = bytesToBase64(new Uint8Array(shotBuffer));
          var existingShot = await getFile(shotPath, token);
          await putFile(
            shotPath,
            shotBase64,
            "Upload screenshot for " + name,
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
})();
