(function () {
  var KEY = "yahya_site_theme";
  var LAST_DARK_KEY = "yahya_site_last_dark_theme";
  var DEFAULT_THEME = "dark";
  var THEME_IDS = ["dark","light","ocean","emerald","royal","sunset"];
  var THEME_META = {
    dark:    { color: "#050914", dark: true },
    light:   { color: "#f3f7fc", dark: false },
    ocean:   { color: "#04121a", dark: true },
    emerald: { color: "#04140f", dark: true },
    royal:   { color: "#0d0618", dark: true },
    sunset:  { color: "#160a08", dark: true }
  };
  var THEME_FB = { dark:"ليلي", light:"نهاري", ocean:"محيطي", emerald:"زمردي", royal:"ملكي", sunset:"غروب" };
  var root = document.documentElement;
  var saved = null;

  function tr(key, fb) {
    try {
      if (window.YahyaI18n && typeof window.YahyaI18n.t === "function") {
        var v = window.YahyaI18n.t(key);
        if (v) return v;
      }
    } catch (e) {}
    return fb || "";
  }

  function themeLabel(id) { return tr("theme." + id, THEME_FB[id] || id); }
  function themeMeta(id) { return THEME_META[id] || THEME_META[DEFAULT_THEME]; }

  try { saved = window.localStorage.getItem(KEY); } catch (error) {}

  function lastDarkTheme() {
    var stored = "";
    try { stored = window.localStorage.getItem(LAST_DARK_KEY) || ""; } catch (error) {}
    var m = themeMeta(stored);
    return m && m.dark ? stored : DEFAULT_THEME;
  }

  function updatePicker(activeId) {
    Array.prototype.forEach.call(document.querySelectorAll("[data-theme-option]"), function (option) {
      var id = option.getAttribute("data-theme-option");
      var active = id === activeId;
      option.classList.toggle("active", active);
      option.setAttribute("aria-pressed", active ? "true" : "false");
      var label = option.querySelector(".theme-opt-label");
      if (label) label.textContent = themeLabel(id);
      else {
        var span = option.querySelector("span:not(.theme-swatch)");
        if (span) span.textContent = themeLabel(id);
      }
    });
  }

  function updateToggle(item, activeId) {
    var button = document.getElementById("themeToggle");
    if (!button) return;
    var isLight = !item.dark;
    var label = isLight ? tr("theme.toNight","التبديل إلى الوضع الليلي") : tr("theme.toDay","التبديل إلى الوضع النهاري");
    button.setAttribute("aria-label", label);
    button.setAttribute("title", label);
    button.setAttribute("aria-pressed", isLight ? "true" : "false");
  }

  function updatePickerToggle() {
    var button = document.getElementById("themePickerToggle");
    if (!button) return;
    var label = tr("theme.change","تغيير ثيم الموقع");
    button.setAttribute("aria-label", label);
    button.setAttribute("title", tr("theme.themes","ثيمات الموقع"));
  }

  function apply(theme, persist) {
    var id = THEME_META[theme] ? theme : DEFAULT_THEME;
    var item = THEME_META[id];
    root.setAttribute("data-theme", id);
    root.style.colorScheme = item.dark ? "dark" : "light";
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", item.color);
    updateToggle(item, id);
    updatePicker(id);
    if (item.dark) {
      try { window.localStorage.setItem(LAST_DARK_KEY, id); } catch (error) {}
    }
    if (persist) {
      try { window.localStorage.setItem(KEY, id); } catch (error) {}
    }
  }

  function paletteIcon() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M12 3a9 9 0 1 0 0 18h1.2a1.8 1.8 0 0 0 1.4-3l-.4-.5a1.8 1.8 0 0 1 1.4-3H17a4 4 0 0 0 4-4c0-4.1-4-7.5-9-7.5Z"/>' +
      '<circle cx="7.5" cy="10" r="1"/><circle cx="10" cy="6.8" r="1"/><circle cx="14" cy="6.8" r="1"/><circle cx="16.8" cy="10" r="1"/>' +
      '</svg>';
  }

  function buildPicker() {
    var actions = document.querySelector(".header-actions");
    if (!actions || document.getElementById("themePicker")) return;

    var picker = document.createElement("div");
    picker.className = "theme-picker";
    picker.id = "themePicker";

    var button = document.createElement("button");
    button.className = "theme-toggle theme-picker-toggle";
    button.type = "button";
    button.id = "themePickerToggle";
    button.setAttribute("aria-haspopup", "menu");
    button.setAttribute("aria-expanded", "false");
    button.innerHTML = paletteIcon();

    var menu = document.createElement("div");
    menu.className = "theme-picker-menu";
    menu.id = "themePickerMenu";
    menu.setAttribute("role", "menu");
    menu.hidden = true;

    THEME_IDS.forEach(function (id) {
      var item = THEME_META[id];
      var option = document.createElement("button");
      option.className = "theme-option";
      option.type = "button";
      option.setAttribute("role", "menuitem");
      option.setAttribute("data-theme-option", id);
      option.innerHTML = '<span class="theme-swatch" style="background:' + item.color + '"></span><span class="theme-opt-label">' + themeLabel(id) + '</span>';
      option.addEventListener("click", function () {
        apply(id, true);
        menu.hidden = true;
        button.setAttribute("aria-expanded", "false");
      });
      menu.appendChild(option);
    });

    button.addEventListener("click", function (event) {
      event.stopPropagation();
      menu.hidden = !menu.hidden;
      button.setAttribute("aria-expanded", menu.hidden ? "false" : "true");
    });

    document.addEventListener("click", function (event) {
      if (!picker.contains(event.target)) {
        menu.hidden = true;
        button.setAttribute("aria-expanded", "false");
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !menu.hidden) {
        menu.hidden = true;
        button.setAttribute("aria-expanded", "false");
        button.focus();
      }
    });

    picker.appendChild(button);
    picker.appendChild(menu);
    actions.insertBefore(picker, actions.firstChild);
    updatePickerToggle();
    updatePicker(root.getAttribute("data-theme") || DEFAULT_THEME);
  }

  function refreshLocaleText() {
    updatePicker(root.getAttribute("data-theme") || DEFAULT_THEME);
    updateToggle(themeMeta(root.getAttribute("data-theme") || DEFAULT_THEME), root.getAttribute("data-theme") || DEFAULT_THEME);
    updatePickerToggle();
  }

  apply(saved, false);

  document.addEventListener("DOMContentLoaded", function () {
    buildPicker();
    var button = document.getElementById("themeToggle");
    if (button) {
      button.addEventListener("click", function () {
        var current = root.getAttribute("data-theme");
        apply(current === "light" ? lastDarkTheme() : "light", true);
      });
    }
    apply(root.getAttribute("data-theme"), false);
  });

  document.addEventListener("yahya:langchange", function () { refreshLocaleText(); });
})();
