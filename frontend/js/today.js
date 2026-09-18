import { api } from "./api.js";
import { state } from "./state.js";
import { dayLabel, dateToDay, fmtDate, isoDate, escapeAttr } from "./utils.js";

function el(id) { return document.getElementById(id); }

function scheduleSaveLog(date) {
  clearTimeout(state.saveTimers["log_" + date]);
  state.saveTimers["log_" + date] = setTimeout(() => persistLog(date), 300);
}
async function persistLog(date) {
  const day = dateToDay(new Date(date + "T00:00:00"));
  try {
    await api.saveLog(date, day, state.logsCache[date] || {});
  } catch (e) {
    console.error("Errore salvataggio log:", e.message);
  }
}

function shortSummary(opt) {
  const names = opt.items.map(it => it.name).filter(Boolean);
  if (!names.length) return "Nessun alimento";
  if (names.length === 1) return names[0];
  return `${names[0]} +${names.length - 1}`;
}

export function initToday() {
  el("prev-day").addEventListener("click", () => { state.currentTodayDate.setDate(state.currentTodayDate.getDate() - 1); renderToday(); });
  el("next-day").addEventListener("click", () => { state.currentTodayDate.setDate(state.currentTodayDate.getDate() + 1); renderToday(); });
}

export function renderToday() {
  const date = state.currentTodayDate;
  const dateStr = isoDate(date);
  const day = dateToDay(date);
  const dayPlan = state.plan[day];

  el("today-label").textContent = dayLabel(day);
  el("today-date").textContent = fmtDate(date);

  if (!state.logsCache[dateStr]) state.logsCache[dateStr] = {};
  const log = state.logsCache[dateStr];

  const container = el("today-meals");
  container.innerHTML = "";
  dayPlan.meals.forEach(meal => {
    const entry = log[meal.id] || { optionId: meal.options[0]?.id, done: false, doneAt: null };
    log[meal.id] = entry;

    const block = document.createElement("div");
    block.className = "meal-block";
    block.innerHTML = `
      <div class="head">
        <strong>${escapeAttr(meal.name)}</strong>
        <label class="row" style="gap:6px;cursor:pointer">
          <div class="check ${entry.done ? "done" : ""}" data-role="toggle-done">${entry.done ? "✓" : ""}</div>
          <span class="muted">Fatto</span>
        </label>
      </div>
      <div class="choices"></div>
    `;
    block.querySelector("[data-role=toggle-done]").addEventListener("click", () => {
      entry.done = !entry.done;
      entry.doneAt = entry.done ? new Date().toISOString() : null;
      scheduleSaveLog(dateStr);
      renderToday();
    });

    const choicesEl = block.querySelector(".choices");
    meal.options.forEach((opt, oi) => {
      const isSelected = entry.optionId === opt.id;
      const choice = document.createElement("div");
      choice.className = "option-choice" + (isSelected ? " selected" : "");
      const itemsText = opt.items.map(it => `${it.name} ${it.qty ? "(" + it.qty + ")" : ""}`.trim()).join(", ") || "Nessun alimento specificato";
      choice.innerHTML = `
        <div class="check ${isSelected ? "done" : ""}">${isSelected ? "●" : ""}</div>
        <div style="flex:1">
          <div>Opzione ${oi + 1}${isSelected ? "" : ` <span class="muted">— ${escapeAttr(shortSummary(opt))}</span>`}</div>
          ${isSelected ? `<div class="items">${escapeAttr(itemsText)}</div>` : ""}
        </div>
      `;
      choice.addEventListener("click", () => {
        entry.optionId = opt.id;
        scheduleSaveLog(dateStr);
        renderToday();
      });
      choicesEl.appendChild(choice);
    });

    container.appendChild(block);
  });
}
