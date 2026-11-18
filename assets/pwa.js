(function () {
  var deferredPrompt = null;
  var installButton = null;

  function createInstallButton() {
    if (installButton || !document.body) return;
    var actions = document.querySelector(".header-actions");
    if (!actions) return;

    installButton = document.createElement("button");
    installButton.className = "btn btn-ghost btn-small pwa-install-button";
    installButton.type = "button";
    installButton.id = "pwaInstall";
    installButton.textContent = "تثبيت الموقع";
    installButton.hidden = !deferredPrompt;
    installButton.addEventListener("click", function () {
      if (!deferredPrompt) return;
      try {
        deferredPrompt.prompt();
      } catch (error) {
        deferredPrompt = null;
        installButton.hidden = true;
        return;
      }
      deferredPrompt.userChoice.then(function () {
        deferredPrompt = null;
        if (installButton) installButton.hidden = true;
      });
    });
    actions.insertBefore(installButton, actions.firstChild);
  }

  window.addEventListener("beforeinstallprompt", function (event) {
    event.preventDefault();
    deferredPrompt = event;
    createInstallButton();
    if (installButton) installButton.hidden = false;
  });

  window.addEventListener("appinstalled", function () {
    deferredPrompt = null;
    if (installButton) installButton.hidden = true;
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createInstallButton);
  } else {
    createInstallButton();
  }

  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", function () {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  });
})();
