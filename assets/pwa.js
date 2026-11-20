(function () {
  var deferredPrompt = null;
  var installButton = null;
  var installModal = null;

  function isStandalone() {
    try {
      if (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) return true;
      if (window.navigator && window.navigator.standalone === true) return true;
    } catch (e) {}
    return false;
  }

  function isIos() {
    try {
      var ua = String((navigator && navigator.userAgent) || "");
      var iosUA = /iPad|iPhone|iPod/.test(ua);
      var iosIpad = (navigator && navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      return iosUA || iosIpad;
    } catch (e) { return false; }
  }

  function createInstallButton() {
    if (installButton || !document.body) return;
    var actions = document.querySelector(".header-actions");
    if (!actions) return;

    installButton = document.createElement("button");
    installButton.className = "btn btn-ghost btn-small pwa-install-button";
    installButton.type = "button";
    installButton.id = "pwaInstall";
    installButton.textContent = "تنزيل وتثبيت الموقع";
    installButton.hidden = isStandalone();
    installButton.addEventListener("click", function () {
      if (deferredPrompt) {
        try { deferredPrompt.prompt(); } catch (error) {}
        var p = deferredPrompt;
        deferredPrompt = null;
        if (p && p.userChoice && typeof p.userChoice.then === "function") {
          p.userChoice.then(function () {
            if (installButton) installButton.hidden = isStandalone();
          }).catch(function () {});
        } else {
          if (installButton) installButton.hidden = isStandalone();
        }
      } else {
        openInstallModal();
      }
    });
    actions.insertBefore(installButton, actions.firstChild);
  }

  function closeInstallModal() {
    if (!installModal) return;
    installModal.hidden = true;
    document.body.classList.remove("modal-open");
  }

  function openInstallModal() {
    if (!installModal || !document.body) return;
    var hint = installModal.querySelector("#installHint");
    if (hint) {
      if (isIos()) {
        hint.textContent = "على iPhone/iPad (آيفون): افتح الموقع في Safari ثم اضغط زر المشاركة ⎋ ثم اختر «إضافة إلى الشاشة الرئيسية» (Add to Home Screen).";
      } else if (deferredPrompt) {
        hint.textContent = "اضغط «تثبيت الآن» لتثبيت الموقع كتطبيق على جهازك.";
      } else {
        hint.textContent = "من قائمة المتصفح اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية» لتثبيت الموقع.";
      }
    }
    var go = installModal.querySelector("#installGoBtn");
    if (go) go.hidden = !deferredPrompt;
    installModal.hidden = false;
    document.body.classList.add("modal-open");
  }

  function buildInstallModal() {
    if (installModal || !document.body) return;
    installModal = document.createElement("div");
    installModal.className = "app-modal install-modal";
    installModal.id = "installModal";
    installModal.hidden = true;
    installModal.innerHTML =
      '<div class="app-modal-backdrop" data-install-close></div>' +
      '<div class="app-modal-panel" role="dialog" aria-modal="true" aria-labelledby="installTitle">' +
        '<button class="modal-close" type="button" data-install-close aria-label="إغلاق">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>' +
        '</button>' +
        '<span class="eyebrow">تثبيت الموقع</span>' +
        '<h2 id="installTitle" style="margin:6px 0 10px">نزّل الموقع وثبّته</h2>' +
        '<p style="margin:0 0 10px;line-height:1.8">هذا موقع <strong>يحيى الحمزة</strong> — <strong>سوريا، الرقة</strong>. ادعم صاحب الموقع وثبّت الموقع كتطبيق على هاتفك لتصله بسرعة في أي وقت.</p>' +
        '<div id="installHint" style="margin:10px 0;padding:10px 12px;border:1px solid var(--line,rgba(255,255,255,.12));border-radius:12px;background:var(--surface-2,rgba(255,255,255,.04));line-height:1.7"></div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px">' +
          '<button class="btn" type="button" id="installGoBtn">تثبيت الآن</button>' +
          '<button class="btn btn-ghost" type="button" data-install-close>لاحقًا</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(installModal);
    Array.prototype.forEach.call(installModal.querySelectorAll("[data-install-close]"), function (b) {
      b.addEventListener("click", function () {
        try { sessionStorage.setItem("yahya_install_prompt_seen", "1"); } catch (e) {}
        closeInstallModal();
      });
    });
    var go = installModal.querySelector("#installGoBtn");
    if (go) {
      go.addEventListener("click", function () {
        if (!deferredPrompt) { closeInstallModal(); return; }
        try { deferredPrompt.prompt(); } catch (error) {}
        var p = deferredPrompt;
        deferredPrompt = null;
        closeInstallModal();
        if (p && p.userChoice) { try { p.userChoice.then(function(){ if (installButton) installButton.hidden = true; }); } catch(e){} }
      });
    }
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && installModal && !installModal.hidden) closeInstallModal();
    });
  }

  function scheduleInstallPrompt() {
    if (isStandalone()) return;
    try { if (sessionStorage.getItem("yahya_install_prompt_seen") === "1") return; } catch (e) {}
    buildInstallModal();
    window.setTimeout(function () {
      if (isStandalone()) return;
      openInstallModal();
    }, 5000);
  }

  window.addEventListener("beforeinstallprompt", function (event) {
    event.preventDefault();
    deferredPrompt = event;
    createInstallButton();
    if (installButton) installButton.hidden = false;
    if (installModal && !installModal.hidden) {
      var go = installModal.querySelector("#installGoBtn");
      if (go) go.hidden = false;
      var hint = installModal.querySelector("#installHint");
      if (hint) hint.textContent = "اضغط «تثبيت الآن» لتثبيت الموقع كتطبيق على جهازك.";
    }
  });

  window.addEventListener("appinstalled", function () {
    deferredPrompt = null;
    if (installButton) installButton.hidden = true;
    closeInstallModal();
  });

  function init() {
    createInstallButton();
    scheduleInstallPrompt();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    });
  }
})();

// Exit confirmation on back (mobile bottom bar / browser back)
(function () {
  if (window.__yahyaExitGuardInit) return;
  window.__yahyaExitGuardInit = true;
  var allowExit = false;

  function hasOpenUi() {
    try {
      if (document.body && document.body.classList && document.body.classList.contains("modal-open")) return true;
      var sels = [".app-modal", "#readerModal", "#imageModal", "#appModal", "#installModal", "#exitConfirmModal"];
      for (var i = 0; i < sels.length; i++) {
        var nodes = document.querySelectorAll(sels[i]);
        for (var j = 0; j < nodes.length; j++) {
          var n = nodes[j];
          if (n && n.hidden === false) return true;
          if (n && n.getAttribute && n.getAttribute("aria-hidden") === "false") return true;
        }
      }
    } catch (e) {}
    return false;
  }

  function closeExitModal(modal) {
    if (!modal) return;
    modal.hidden = true;
    if (document.body && document.body.classList) document.body.classList.remove("modal-open");
  }

  function showExitConfirm() {
    var modal = document.getElementById("exitConfirmModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "exitConfirmModal";
      modal.className = "app-modal";
      modal.hidden = true;
      modal.innerHTML =
        '<div class="app-modal-backdrop" data-exit-no></div>' +
        '<div class="app-modal-panel" role="dialog" aria-modal="true" aria-labelledby="exitConfirmTitle">' +
          '<h2 id="exitConfirmTitle" style="margin:0 0 10px">تأكيد الخروج</h2>' +
          '<p style="margin:0 0 16px;line-height:1.8">هل تريد الخروج من موقع يحيى؟</p>' +
          '<div style="display:flex;flex-wrap:wrap;gap:8px">' +
            '<button class="btn" type="button" id="exitConfirmYes">نعم</button>' +
            '<button class="btn btn-ghost" type="button" data-exit-no>لا</button>' +
          '</div>' +
        '</div>';
      if (document.body) document.body.appendChild(modal);
      Array.prototype.forEach.call(modal.querySelectorAll("[data-exit-no]"), function (btn) {
        btn.addEventListener("click", function () {
          closeExitModal(modal);
          try { history.pushState({ yahyaExitGuard: 1 }, "", location.href); } catch (e) {}
        });
      });
      var yes = modal.querySelector("#exitConfirmYes");
      if (yes) {
        yes.addEventListener("click", function () {
          closeExitModal(modal);
          allowExit = true;
          try { history.back(); } catch (e) { try { window.close(); } catch (e2) {} }
          window.setTimeout(function () {
            allowExit = false;
            try { history.pushState({ yahyaExitGuard: 1 }, "", location.href); } catch (e) {}
          }, 800);
        });
      }
    }
    modal.hidden = false;
    if (document.body && document.body.classList) document.body.classList.add("modal-open");
  }

  function initExitGuard() {
    try {
      if (!(window.history && history.pushState)) return;
      history.pushState({ yahyaExitGuard: 1 }, "", location.href);
      window.addEventListener("popstate", function () {
        if (allowExit) return;
        // If another modal/overlay is open, don't trap (best-effort).
        var exitModal = document.getElementById("exitConfirmModal");
        var exitOpen = exitModal && !exitModal.hidden;
        if (hasOpenUi() && !exitOpen) {
          try { history.pushState({ yahyaExitGuard: 1 }, "", location.href); } catch (e) {}
          return;
        }
        showExitConfirm();
      });
    } catch (e) {}
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initExitGuard);
  } else {
    initExitGuard();
  }
})();
