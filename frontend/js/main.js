import { api, getToken, getUsername } from "./api.js";
import { state } from "./state.js";
import { emptyPlan, dayLabel, dateToDay } from "./utils.js";
import { initAuth, showLogin, showApp } from "./auth.js";
import { initPlan, renderPlan } from "./plan.js";
import { initToday, renderToday } from "./today.js";
import { initStorico, renderStorico } from "./storico.js";
import { initTheme } from "./theme.js";
import { initProgress, renderProgress, resetProgress } from "./progress.js";

function el(id) { return document.getElementById(id); }

const TABS = ["piano", "oggi", "storico", "progressi"];

function showTab(name) {
  state.currentTab = name;
  document.querySelectorAll("nav.tabs button").forEach(b => b.classList.toggle("active", b.dataset.tab === name));
  TABS.forEach(t => el("tab-" + t).classList.toggle("hidden", t !== name));
  if (name === "oggi") renderToday();
  if (name === "storico") renderStorico();
  if (name === "progressi") renderProgress();
}

function bindTabs() {
  document.querySelectorAll("nav.tabs button").forEach(btn => {
    btn.addEventListener("click", () => showTab(btn.dataset.tab));
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
  state.currentTodayDate = new Date();
  state.currentPlanDay = dateToDay(new Date());
  await loadAllData();
  renderPlan();
  renderStorico();
  showTab("oggi");
}

function onLogout() {
  resetProgress();
  showLogin();
}

async function init() {
  initTheme();
  bindTabs();
  initPlan();
  initToday();
  initStorico();
  initProgress();
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
