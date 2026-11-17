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

  var copyButtons = document.querySelectorAll("[data-copy]");
  Array.prototype.forEach.call(copyButtons, function (button) {
    button.addEventListener("click", function () {
      var value = button.getAttribute("data-copy") || "";
      function done() { showToast("تم نسخ رابط الموقع"); }
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
          if (copied) done();
          else showToast("تعذّر نسخ الرابط");
        } catch (error) {
          showToast("تعذّر نسخ الرابط");
        }
        document.body.removeChild(input);
      }

      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(value).then(done).catch(fallback);
      } else {
        fallback();
      }
    });
  });

  var header = document.getElementById("header");
  function onScroll() {
    if (header) header.classList.toggle("scrolled", window.scrollY > 16);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  var reveals = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    Array.prototype.forEach.call(reveals, function (element) {
      element.classList.add("will-reveal", "in-view");
    });
    return;
  }

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

  function makePhoneAppCard(app, index) {
    if (!app || !app.name || !app.filename) return null;
    if (!/^[A-Za-z0-9._-]+\.apk$/.test(app.filename)) return null;
    var colors = ["icon-cyan", "icon-gold", "icon-violet", "icon-rose", "icon-green", "icon-blue"];
    var card = appElement("article", "app-card phone-app");
    var icon = appElement("div", "app-icon " + colors[index % colors.length]);
    var image = document.createElement("img");
    image.src = app.icon && /^assets\//.test(app.icon) ? app.icon : "assets/icons/system.svg";
    image.alt = "";
    image.width = 38;
    image.height = 38;
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
    return card;
  }

  var appsGrid = document.getElementById("apps-grid");
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
        if (counter && added) counter.textContent = String(7 + added);
      })
      .catch(function () {});
  }
})();
