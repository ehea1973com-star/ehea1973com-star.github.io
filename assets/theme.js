(function () {
  var KEY = "yahya_site_theme";
  var LAST_DARK_KEY = "yahya_site_last_dark_theme";
  var DEFAULT_THEME = "dark";
  var THEMES = [
    { id: "dark", label: "ليلي", color: "#050914", dark: true },
    { id: "light", label: "نهاري", color: "#f3f7fc", dark: false },
    { id: "ocean", label: "محيطي", color: "#04121a", dark: true },
    { id: "emerald", label: "زمردي", color: "#04140f", dark: true },
    { id: "royal", label: "ملكي", color: "#0d0618", dark: true },
    { id: "sunset", label: "غروب", color: "#160a08", dark: true }
  ];
  var root = document.documentElement;
  var saved = null;

  try {
    saved = window.localStorage.getItem(KEY);
  } catch (error) {}

  function getTheme(id) {
    for (var index = 0; index < THEMES.length; index += 1) {
      if (THEMES[index].id === id) return THEMES[index];
    }
    return null;
  }

  function lastDarkTheme() {
    var stored = "";
    try {
      stored = window.localStorage.getItem(LAST_DARK_KEY) || "";
    } catch (error) {}
    return getTheme(stored) && getTheme(stored).dark ? stored : DEFAULT_THEME;
  }

  function updatePicker(activeId) {
    Array.prototype.forEach.call(document.querySelectorAll("[data-theme-option]"), function (option) {
      var active = option.getAttribute("data-theme-option") === activeId;
      option.classList.toggle("active", active);
      option.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function updateToggle(item) {
    var button = document.getElementById("themeToggle");
    if (!button) return;
    var isLight = !item.dark;
    button.setAttribute("aria-label", isLight ? "التبديل إلى الوضع الليلي" : "التبديل إلى الوضع النهاري");
    button.setAttribute("title", isLight ? "الوضع الليلي" : "الوضع النهاري");
    button.setAttribute("aria-pressed", isLight ? "true" : "false");
  }

  function apply(theme, persist) {
    var item = getTheme(theme) || getTheme(DEFAULT_THEME);
    root.setAttribute("data-theme", item.id);
    root.style.colorScheme = item.dark ? "dark" : "light";
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", item.color);
    updateToggle(item);
    updatePicker(item.id);
    if (item.dark) {
      try {
        window.localStorage.setItem(LAST_DARK_KEY, item.id);
      } catch (error) {}
    }
    if (persist) {
      try {
        window.localStorage.setItem(KEY, item.id);
      } catch (error) {}
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
    button.setAttribute("aria-label", "تغيير ثيم الموقع");
    button.setAttribute("title", "ثيمات الموقع");
    button.setAttribute("aria-haspopup", "menu");
    button.setAttribute("aria-expanded", "false");
    button.innerHTML = paletteIcon();

    var menu = document.createElement("div");
    menu.className = "theme-picker-menu";
    menu.id = "themePickerMenu";
    menu.setAttribute("role", "menu");
    menu.hidden = true;

    THEMES.forEach(function (item) {
      var option = document.createElement("button");
      option.className = "theme-option";
      option.type = "button";
      option.setAttribute("role", "menuitem");
      option.setAttribute("data-theme-option", item.id);
      option.innerHTML = '<span class="theme-swatch" style="background:' + item.color + '"></span><span>' + item.label + '</span>';
      option.addEventListener("click", function () {
        apply(item.id, true);
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
    updatePicker(root.getAttribute("data-theme") || DEFAULT_THEME);
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
})();
