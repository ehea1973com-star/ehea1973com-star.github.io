(function () {
  var KEY = "yahya_site_theme";
  var root = document.documentElement;
  var saved = null;

  try {
    saved = window.localStorage.getItem(KEY);
  } catch (error) {}

  function apply(theme, persist) {
    var next = theme === "light" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    root.style.colorScheme = next;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", next === "light" ? "#f3f7fc" : "#050914");
    var button = document.getElementById("themeToggle");
    if (button) {
      button.setAttribute("aria-label", next === "light" ? "التبديل إلى الوضع الليلي" : "التبديل إلى الوضع النهاري");
      button.setAttribute("title", next === "light" ? "الوضع الليلي" : "الوضع النهاري");
      button.setAttribute("aria-pressed", next === "light" ? "true" : "false");
    }
    if (persist) {
      try {
        window.localStorage.setItem(KEY, next);
      } catch (error) {}
    }
  }

  apply(saved, false);

  document.addEventListener("DOMContentLoaded", function () {
    var button = document.getElementById("themeToggle");
    if (!button) return;
    button.addEventListener("click", function () {
      apply(root.getAttribute("data-theme") === "light" ? "dark" : "light", true);
    });
    apply(root.getAttribute("data-theme"), false);
  });
})();
