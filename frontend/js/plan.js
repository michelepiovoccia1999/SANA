import { api } from "./api.js";
import { state } from "./state.js";
import { DAYS, uid, dayLabel, escapeAttr } from "./utils.js";
import { confirmDialog, alertDialog, promptDialog } from "./dialog.js";

function el(id) { return document.getElementById(id); }

const activeOptionByMeal = new Map();

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
      await alertDialog(`Piano copiato su ${dayLabel(target)}`);
    } catch (e) {
      await alertDialog("Errore nella copia: " + e.message);
    }
  });

  el("archive-plan-btn").addEventListener("click", async () => {
    const label = await promptDialog('Nome per questa versione del piano (es. "Dieta settembre"):', new Date().toLocaleDateString("it-IT"));
    if (label === null) return;
    try {
      const version = await api.saveVersion(label, JSON.parse(JSON.stringify(state.plan)));
      state.versionsCache.unshift(version);
      await alertDialog("Piano archiviato.");
    } catch (e) {
      await alertDialog("Errore nell'archiviazione: " + e.message);
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
      <div class="pill-row" data-role="pills"></div>
      <div class="option-panel" data-role="panel"></div>
    `;
    mealEl.querySelector("[data-role=meal-name]").addEventListener("input", e => {
      meal.name = e.target.value; schedulePersistPlanDay(state.currentPlanDay);
    });
    mealEl.querySelector("[data-role=del-meal]").addEventListener("click", async () => {
      const ok = await confirmDialog("Eliminare questo pasto?", { confirmText: "Elimina", danger: true });
      if (!ok) return;
      meals.splice(mi, 1); schedulePersistPlanDay(state.currentPlanDay); renderPlan();
    });

    if (!activeOptionByMeal.has(meal.id)) activeOptionByMeal.set(meal.id, 0);
    let activeIdx = Math.min(activeOptionByMeal.get(meal.id), meal.options.length - 1);
    activeOptionByMeal.set(meal.id, activeIdx);

    const pillsEl = mealEl.querySelector("[data-role=pills]");
    meal.options.forEach((opt, oi) => {
      const pill = document.createElement("button");
      pill.type = "button";
      pill.className = "pill" + (oi === activeIdx ? " active" : "");
      pill.textContent = String(oi + 1);
      pill.addEventListener("click", () => {
        activeOptionByMeal.set(meal.id, oi);
        renderPlan();
      });
      pillsEl.appendChild(pill);
    });
    const addPill = document.createElement("button");
    addPill.type = "button";
    addPill.className = "pill-add";
    addPill.textContent = "+";
    addPill.title = "Aggiungi alternativa";
    addPill.addEventListener("click", () => {
      const newOpt = { id: uid(), items: [] };
      meal.options.push(newOpt);
      activeOptionByMeal.set(meal.id, meal.options.length - 1);
      schedulePersistPlanDay(state.currentPlanDay);
      renderPlan();
    });
    pillsEl.appendChild(addPill);

    const activeOpt = meal.options[activeIdx];
    const panelEl = mealEl.querySelector("[data-role=panel]");
    panelEl.innerHTML = `<div class="items"></div><button class="ghost" data-role="add-item" style="padding:4px 10px;font-size:.8rem;margin-top:4px">+ Alimento</button>`;
    panelEl.querySelector("[data-role=add-item]").addEventListener("click", () => {
      activeOpt.items.push({ id: uid(), name: "", qty: "" });
      schedulePersistPlanDay(state.currentPlanDay);
      renderPlan();
    });

    const itemsEl = panelEl.querySelector(".items");
    activeOpt.items.forEach((item, ii) => {
      const row = document.createElement("div");
      row.className = "item-row";
      row.innerHTML = `
        <input type="text" placeholder="Alimento" value="${escapeAttr(item.name)}" data-role="item-name">
        <input type="text" placeholder="Inserisci" value="${escapeAttr(item.qty)}" data-role="item-qty">
        <button class="ghost" data-role="del-item" style="padding:0 10px">✕</button>
      `;
      row.querySelector("[data-role=item-name]").addEventListener("input", e => { item.name = e.target.value; schedulePersistPlanDay(state.currentPlanDay); });
      row.querySelector("[data-role=item-qty]").addEventListener("input", e => { item.qty = e.target.value; schedulePersistPlanDay(state.currentPlanDay); });
      row.querySelector("[data-role=del-item]").addEventListener("click", () => { activeOpt.items.splice(ii, 1); schedulePersistPlanDay(state.currentPlanDay); renderPlan(); });
      itemsEl.appendChild(row);
    });

    if (meal.options.length > 1) {
      const delOptLink = document.createElement("div");
      delOptLink.className = "muted";
      delOptLink.style.cssText = "margin-top:8px;cursor:pointer;color:var(--danger);font-size:.8rem";
      delOptLink.textContent = "Elimina questa opzione";
      delOptLink.addEventListener("click", async () => {
        const ok = await confirmDialog(`Eliminare l'opzione ${activeIdx + 1}?`, { confirmText: "Elimina", danger: true });
        if (!ok) return;
        meal.options.splice(activeIdx, 1);
        activeOptionByMeal.set(meal.id, Math.max(0, activeIdx - 1));
        schedulePersistPlanDay(state.currentPlanDay);
        renderPlan();
      });
      panelEl.appendChild(delOptLink);
    }

    container.appendChild(mealEl);
  });
}
