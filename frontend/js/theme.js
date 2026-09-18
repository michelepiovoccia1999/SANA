const THEME_KEY = "sana_theme";

function currentTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved) return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

export function initTheme() {
  const theme = currentTheme();
  applyTheme(theme);

  const toggle = document.getElementById("theme-toggle");
  toggle.checked = theme === "dark";
  toggle.addEventListener("change", () => {
    const next = toggle.checked ? "dark" : "light";
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  });
}
