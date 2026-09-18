import { api, getToken, getUsername } from "./api.js";
import { state } from "./state.js";
import { emptyPlan, dayLabel } from "./utils.js";
import { initAuth, showLogin, showApp } from "./auth.js";
import { initPlan, renderPlan } from "./plan.js";
import { initToday, renderToday } from "./today.js";
import { initStorico, renderStorico } from "./storico.js";
import { initTheme } from "./theme.js";

function el(id) { return document.getElementById(id); }

function bindTabs() {
  document.querySelectorAll("nav.tabs button").forEach(btn => {
    btn.addEventListener("click", () => {
      state.currentTab = btn.dataset.tab;
      document.querySelectorAll("nav.tabs button").forEach(b => b.classList.toggle("active", b === btn));
      ["piano", "oggi", "storico"].forEach(t => el("tab-" + t).classList.toggle("hidden", t !== state.currentTab));
      if (state.currentTab === "oggi") renderToday();
      if (state.currentTab === "storico") renderStorico();
    });
  });
}

async function loadAllData() {
  const [planRows, logRows, versionRows] = await Promise.all([
    api.getPlan(),
    api.getLogs("1970-01-01", "2999-12-31"),
    api.getVersions(),
  ]);

  state.plan = emptyPlan();
  (planRows || []).forEach(row => {
    state.plan[row.day] = {
      day: row.day,
      label: row.label || dayLabel(row.day),
      meals: row.meals && row.meals.length ? row.meals : state.plan[row.day].meals,
    };
  });

  state.logsCache = {};
  (logRows || []).forEach(row => { state.logsCache[row.date] = row.meals || {}; });

  state.versionsCache = versionRows || [];
}

async function onLogin(username) {
  showApp(username);
  await loadAllData();
  renderPlan();
  renderToday();
  renderStorico();
}

function onLogout() {
  showLogin();
}

async function init() {
  initTheme();
  bindTabs();
  initPlan();
  initToday();
  initStorico();
  initAuth({ onLogin, onLogout });

  const token = getToken();
  const username = getUsername();
  if (token && username) {
    try {
      await onLogin(username);
    } catch {
      onLogout();
    }
  } else {
    showLogin();
  }
}

init();
