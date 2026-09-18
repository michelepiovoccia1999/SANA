function buildOverlay() {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  const box = document.createElement("div");
  box.className = "modal-box card";
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  return { overlay, box };
}

function closeOverlay(overlay) {
  overlay.remove();
}

export function confirmDialog(message, { confirmText = "Conferma", cancelText = "Annulla", danger = false } = {}) {
  return new Promise(resolve => {
    const { overlay, box } = buildOverlay();
    box.innerHTML = `
      <p style="margin:0 0 18px">${message}</p>
      <div class="row" style="justify-content:flex-end">
        <button class="secondary" data-role="cancel">${cancelText}</button>
        <button class="${danger ? "danger" : ""}" data-role="confirm">${confirmText}</button>
      </div>
    `;
    box.querySelector("[data-role=cancel]").addEventListener("click", () => { closeOverlay(overlay); resolve(false); });
    box.querySelector("[data-role=confirm]").addEventListener("click", () => { closeOverlay(overlay); resolve(true); });
    overlay.addEventListener("click", e => { if (e.target === overlay) { closeOverlay(overlay); resolve(false); } });
  });
}

export function alertDialog(message, { okText = "Ok" } = {}) {
  return new Promise(resolve => {
    const { overlay, box } = buildOverlay();
    box.innerHTML = `
      <p style="margin:0 0 18px">${message}</p>
      <div class="row" style="justify-content:flex-end">
        <button data-role="ok">${okText}</button>
      </div>
    `;
    const close = () => { closeOverlay(overlay); resolve(); };
    box.querySelector("[data-role=ok]").addEventListener("click", close);
    overlay.addEventListener("click", e => { if (e.target === overlay) close(); });
  });
}

export function promptDialog(message, defaultValue = "", { confirmText = "Conferma", cancelText = "Annulla" } = {}) {
  return new Promise(resolve => {
    const { overlay, box } = buildOverlay();
    box.innerHTML = `
      <p style="margin:0 0 10px">${message}</p>
      <input type="text" data-role="value" style="margin-bottom:18px">
      <div class="row" style="justify-content:flex-end">
        <button class="secondary" data-role="cancel">${cancelText}</button>
        <button data-role="confirm">${confirmText}</button>
      </div>
    `;
    const input = box.querySelector("[data-role=value]");
    input.value = defaultValue;
    input.addEventListener("keydown", e => { if (e.key === "Enter") confirmBtn.click(); });

    const confirmBtn = box.querySelector("[data-role=confirm]");
    confirmBtn.addEventListener("click", () => { const v = input.value; closeOverlay(overlay); resolve(v); });
    box.querySelector("[data-role=cancel]").addEventListener("click", () => { closeOverlay(overlay); resolve(null); });
    overlay.addEventListener("click", e => { if (e.target === overlay) { closeOverlay(overlay); resolve(null); } });

    input.focus();
  });
}
