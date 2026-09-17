import { state } from "./state.js";
import { DAYS, dateToDay, isoDate, escapeAttr } from "./utils.js";

function el(id) { return document.getElementById(id); }

export function initStorico() {
  document.querySelectorAll(".storico-tabs button").forEach(btn => {
    btn.addEventListener("click", () => {
      state.currentStorico = btn.dataset.storico;
      document.querySelectorAll(".storico-tabs button").forEach(b => b.classList.toggle("active", b === btn));
      el("storico-andamento").classList.toggle("hidden", state.currentStorico !== "andamento");
      el("storico-versioni").classList.toggle("hidden", state.currentStorico !== "versioni");
      renderStorico();
    });
  });
}

export function renderStorico() {
  if (state.currentStorico === "andamento") renderAndamento();
  else renderVersions();
}

function renderAndamento() {
  const list = el("andamento-list");
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = isoDate(d);
    const dayId = dateToDay(d);
    const dayPlan = state.plan[dayId];
    const log = state.logsCache[dateStr] || {};
    const planned = dayPlan.meals.length;
    const done = dayPlan.meals.filter(m => log[m.id]?.done).length;
    days.push({ dateStr, d, planned, done });
  }
  list.innerHTML = days.map(({ d, planned, done }) => {
    const pct = planned ? Math.round((done / planned) * 100) : 0;
    return `
      <div class="history-day">
        <div>
          <div>${d.toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" })}</div>
          <div class="bar-bg" style="width:140px;margin-top:4px"><div class="bar-fill" style="width:${pct}%"></div></div>
        </div>
        <span class="muted">${done}/${planned}</span>
      </div>
    `;
  }).join("");
}

function renderVersions() {
  const list = el("versions-list");
  if (!state.versionsCache.length) {
    list.innerHTML = `<p class="muted">Nessuna versione salvata. Usa "Archivia piano" nella tab Piano.</p>`;
    el("version-detail").innerHTML = "";
    return;
  }
  list.innerHTML = state.versionsCache.map(v => `
    <div class="version-item">
      <div>
        <div>${escapeAttr(v.label || "Senza nome")}</div>
        <div class="muted">${new Date(v.saved_at).toLocaleString("it-IT")}</div>
      </div>
      <button class="secondary" data-role="view-version" data-id="${v.id}" style="padding:6px 10px;font-size:.85rem">Apri</button>
    </div>
  `).join("");
  list.querySelectorAll("[data-role=view-version]").forEach(btn => {
    btn.addEventListener("click", () => renderVersionDetail(btn.dataset.id));
  });
}

let versionDetailDay = "mon";
function renderVersionDetail(versionId) {
  const v = state.versionsCache.find(x => x.id === versionId);
  if (!v) return;
  versionDetailDay = "mon";
  const detail = el("version-detail");

  function draw() {
    const days = v.days || {};
    const dayPlan = days[versionDetailDay] || { meals: [] };
    detail.innerHTML = `
      <div class="card">
        <div class="row between">
          <h2>${escapeAttr(v.label || "Senza nome")}</h2>
          <span class="muted">${new Date(v.saved_at).toLocaleDateString("it-IT")}</span>
        </div>
        <div class="day-tabs" id="vd-day-tabs"></div>
        <div id="vd-meals"></div>
      </div>
    `;
    detail.querySelector("#vd-day-tabs").innerHTML = DAYS.map(d => `<button data-day="${d.id}" class="${d.id === versionDetailDay ? "active" : ""}">${d.label.slice(0, 3)}</button>`).join("");
    detail.querySelector("#vd-day-tabs").addEventListener("click", e => {
      const btn = e.target.closest("button[data-day]");
      if (!btn) return;
      versionDetailDay = btn.dataset.day;
      draw();
    });
    detail.querySelector("#vd-meals").innerHTML = (dayPlan.meals || []).map(meal => `
      <div class="meal">
        <div class="meal-title"><strong>${escapeAttr(meal.name)}</strong></div>
        ${meal.options.map((opt, oi) => `
          <div class="option">
            <span class="badge">Opzione ${oi + 1}</span>
            <div class="items" style="margin-top:6px">${escapeAttr(opt.items.map(it => `${it.name} ${it.qty ? "(" + it.qty + ")" : ""}`.trim()).join(", ") || "Nessun alimento")}</div>
          </div>
        `).join("")}
      </div>
    `).join("") || '<p class="muted">Nessun pasto per questo giorno.</p>';
  }
  draw();
}
