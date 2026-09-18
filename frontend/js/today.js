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
    const entry = log[meal.id] || { optionId: meal.options[0]?.id };
    log[meal.id] = entry;

    const block = document.createElement("div");
    block.className = "meal-block";
    block.innerHTML = `
      <div class="head"><strong>${escapeAttr(meal.name)}</strong></div>
      <div class="pill-row" data-role="pills"></div>
      <div class="items"></div>
    `;

    const pillsEl = block.querySelector("[data-role=pills]");
    meal.options.forEach((opt, oi) => {
      const pill = document.createElement("button");
      pill.type = "button";
      pill.className = "pill" + (opt.id === entry.optionId ? " active" : "");
      pill.textContent = String(oi + 1);
      pill.addEventListener("click", () => {
        entry.optionId = opt.id;
        scheduleSaveLog(dateStr);
        renderToday();
      });
      pillsEl.appendChild(pill);
    });

    const selectedOption = meal.options.find(o => o.id === entry.optionId) || meal.options[0];
    const itemsEl = block.querySelector(".items");
    if (selectedOption && selectedOption.items.length) {
      selectedOption.items.forEach(it => {
        const line = document.createElement("div");
        line.className = "item-line";
        line.textContent = `• ${it.name}${it.qty ? " — " + it.qty : ""}`;
        itemsEl.appendChild(line);
      });
    } else {
      itemsEl.innerHTML = `<div class="item-line muted">Nessun alimento specificato</div>`;
    }

    container.appendChild(block);
  });
}
