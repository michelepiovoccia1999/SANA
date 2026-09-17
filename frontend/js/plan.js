import { api } from "./api.js";
import { state } from "./state.js";
import { DAYS, uid, dayLabel, escapeAttr } from "./utils.js";

function el(id) { return document.getElementById(id); }

function schedulePersistPlanDay(day) {
  clearTimeout(state.saveTimers["plan_" + day]);
  state.saveTimers["plan_" + day] = setTimeout(() => persistPlanDay(day), 500);
}
async function persistPlanDay(day) {
  const p = state.plan[day];
  try {
    await api.savePlanDay(day, p.label, p.meals);
  } catch (e) {
    console.error("Errore salvataggio piano:", e.message);
  }
}

export function initPlan() {
  el("plan-day-tabs").innerHTML = DAYS.map(d => `<button data-day="${d.id}">${d.label.slice(0, 3)}</button>`).join("");
  el("plan-day-tabs").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-day]");
    if (!btn) return;
    state.currentPlanDay = btn.dataset.day;
    renderPlan();
  });

  el("copy-target").innerHTML = DAYS.map(d => `<option value="${d.id}">${d.label}</option>`).join("");

  el("add-meal-btn").addEventListener("click", () => {
    state.plan[state.currentPlanDay].meals.push({ id: uid(), name: "Nuovo pasto", options: [{ id: uid(), items: [] }] });
    schedulePersistPlanDay(state.currentPlanDay);
    renderPlan();
  });

  el("copy-day-btn").addEventListener("click", async () => {
    const target = el("copy-target").value;
    if (!target || target === state.currentPlanDay) return;
    try {
      await api.copyPlanDay(state.currentPlanDay, target);
      state.plan[target] = {
        day: target,
        label: dayLabel(target),
        meals: JSON.parse(JSON.stringify(state.plan[state.currentPlanDay].meals)),
      };
      alert(`Piano copiato su ${dayLabel(target)}`);
    } catch (e) {
      alert("Errore nella copia: " + e.message);
    }
  });

  el("archive-plan-btn").addEventListener("click", async () => {
    const label = prompt('Nome per questa versione del piano (es. "Dieta settembre"):', new Date().toLocaleDateString("it-IT"));
    if (label === null) return;
    try {
      const version = await api.saveVersion(label, JSON.parse(JSON.stringify(state.plan)));
      state.versionsCache.unshift(version);
      alert("Piano archiviato.");
    } catch (e) {
      alert("Errore nell'archiviazione: " + e.message);
    }
  });
}

export function renderPlan() {
  document.querySelectorAll("#plan-day-tabs button").forEach(b => b.classList.toggle("active", b.dataset.day === state.currentPlanDay));
  const container = el("plan-meals");
  const meals = state.plan[state.currentPlanDay].meals;
  container.innerHTML = "";

  meals.forEach((meal, mi) => {
    const mealEl = document.createElement("div");
    mealEl.className = "meal";
    mealEl.innerHTML = `
      <div class="meal-title">
        <input type="text" value="${escapeAttr(meal.name)}" data-role="meal-name">
        <button class="ghost" data-role="del-meal">✕</button>
      </div>
      <div class="options"></div>
      <button class="secondary" data-role="add-option" style="padding:6px 10px;font-size:.85rem">+ Alternativa</button>
    `;
    mealEl.querySelector("[data-role=meal-name]").addEventListener("input", e => {
      meal.name = e.target.value; schedulePersistPlanDay(state.currentPlanDay);
    });
    mealEl.querySelector("[data-role=del-meal]").addEventListener("click", () => {
      if (!confirm("Eliminare questo pasto?")) return;
      meals.splice(mi, 1); schedulePersistPlanDay(state.currentPlanDay); renderPlan();
    });
    mealEl.querySelector("[data-role=add-option]").addEventListener("click", () => {
      meal.options.push({ id: uid(), items: [] }); schedulePersistPlanDay(state.currentPlanDay); renderPlan();
    });

    const optionsEl = mealEl.querySelector(".options");
    meal.options.forEach((opt, oi) => {
      const optEl = document.createElement("div");
      optEl.className = "option";
      optEl.innerHTML = `
        <div class="option-header">
          <span class="badge">Opzione ${oi + 1}</span>
          <button class="ghost" data-role="del-option" style="padding:2px 8px">✕</button>
        </div>
        <div class="items"></div>
        <button class="ghost" data-role="add-item" style="padding:4px 10px;font-size:.8rem">+ Alimento</button>
      `;
      optEl.querySelector("[data-role=del-option]").addEventListener("click", () => {
        if (meal.options.length === 1) { alert("Ogni pasto deve avere almeno un'opzione."); return; }
        meal.options.splice(oi, 1); schedulePersistPlanDay(state.currentPlanDay); renderPlan();
      });
      optEl.querySelector("[data-role=add-item]").addEventListener("click", () => {
        opt.items.push({ id: uid(), name: "", qty: "" }); schedulePersistPlanDay(state.currentPlanDay); renderPlan();
      });

      const itemsEl = optEl.querySelector(".items");
      opt.items.forEach((item, ii) => {
        const row = document.createElement("div");
        row.className = "item-row";
        row.innerHTML = `
          <input type="text" placeholder="Alimento" value="${escapeAttr(item.name)}" data-role="item-name">
          <input type="text" placeholder="Grammi" value="${escapeAttr(item.qty)}" data-role="item-qty">
          <button class="ghost" data-role="del-item" style="padding:0 10px">✕</button>
        `;
        row.querySelector("[data-role=item-name]").addEventListener("input", e => { item.name = e.target.value; schedulePersistPlanDay(state.currentPlanDay); });
        row.querySelector("[data-role=item-qty]").addEventListener("input", e => { item.qty = e.target.value; schedulePersistPlanDay(state.currentPlanDay); });
        row.querySelector("[data-role=del-item]").addEventListener("click", () => { opt.items.splice(ii, 1); schedulePersistPlanDay(state.currentPlanDay); renderPlan(); });
        itemsEl.appendChild(row);
      });

      optionsEl.appendChild(optEl);
    });

    container.appendChild(mealEl);
  });
}
