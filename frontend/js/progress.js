import { api } from "./api.js";
import { confirmDialog, alertDialog, promptDialog } from "./dialog.js";
import { escapeAttr } from "./utils.js";

const view = {
  folders: [],
  loaded: false,
  folder: null,
  media: [],
  uploadStatus: "",
};

const FOLDER_ICON = `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>`;

function root() { return document.getElementById("progress-root"); }

function fmtDay(iso) {
  return new Date(iso).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });
}

function countLabel(n) {
  return n === 1 ? "1 elemento" : `${n} elementi`;
}

export function initProgress() {}

export function resetProgress() {
  view.folders = [];
  view.loaded = false;
  view.folder = null;
  view.media = [];
  view.uploadStatus = "";
  const r = root();
  if (r) r.innerHTML = "";
}

export async function renderProgress() {
  if (view.folder) return renderFolder();
  if (!view.loaded) root().innerHTML = `<p class="muted">Caricamento…</p>`;
  try {
    view.folders = await api.listFolders();
    view.loaded = true;
  } catch (e) {
    root().innerHTML = `<p class="error">${escapeAttr(e.message)}</p>`;
    return;
  }
  renderFolderList();
}

function renderFolderList() {
  const r = root();
  r.innerHTML = `
    <button class="secondary" id="new-folder-btn" style="width:100%">+ Nuova cartella</button>
    <div class="folder-grid" id="folder-grid"></div>
  `;
  r.querySelector("#new-folder-btn").addEventListener("click", createFolder);

  const grid = r.querySelector("#folder-grid");
  if (!view.folders.length) {
    grid.outerHTML = `<p class="muted" style="margin-top:14px">Nessuna cartella. Creane una (es. "Settembre 2026") e aggiungi le tue foto e i tuoi video.</p>`;
    return;
  }
  view.folders.forEach(f => {
    const card = document.createElement("div");
    card.className = "folder-card";
    card.innerHTML = `${FOLDER_ICON}<div class="folder-name">${escapeAttr(f.name)}</div><div class="muted">${countLabel(f.count)}</div>`;
    card.addEventListener("click", () => openFolder(f));
    grid.appendChild(card);
  });
}

async function createFolder() {
  const name = await promptDialog("Nome della nuova cartella:", "");
  if (name === null) return;
  if (!name.trim()) { await alertDialog("Il nome non può essere vuoto."); return; }
  try {
    const folder = await api.createFolder(name.trim());
    view.folders.push(folder);
    await openFolder(folder);
  } catch (e) {
    await alertDialog("Errore nella creazione: " + e.message);
  }
}

async function openFolder(folder) {
  view.folder = folder;
  view.media = [];
  root().innerHTML = `<p class="muted">Caricamento…</p>`;
  try {
    view.media = await api.listMedia(folder.id);
  } catch (e) {
    await alertDialog("Errore nel caricamento: " + e.message);
  }
  renderFolder();
}

function renderFolder() {
  const folder = view.folder;
  const r = root();
  r.innerHTML = `
    <div class="folder-head">
      <button class="ghost" id="back-btn">‹ Cartelle</button>
      <div class="folder-head-actions">
        <button class="ghost" id="rename-btn">Rinomina</button>
        <button class="ghost" id="delete-folder-btn" style="color:var(--danger)">Elimina</button>
      </div>
    </div>
    <h2>${escapeAttr(folder.name)}</h2>
    <button id="upload-btn" style="width:100%">+ Aggiungi foto o video</button>
    <input type="file" id="file-input" accept="image/*,video/*" multiple hidden>
    <div class="muted" id="upload-status" style="margin-top:8px">${escapeAttr(view.uploadStatus)}</div>
    <div class="media-grid" id="media-grid"></div>
  `;

  r.querySelector("#back-btn").addEventListener("click", closeFolder);
  r.querySelector("#rename-btn").addEventListener("click", renameFolder);
  r.querySelector("#delete-folder-btn").addEventListener("click", deleteFolder);
  const input = r.querySelector("#file-input");
  r.querySelector("#upload-btn").addEventListener("click", () => input.click());
  input.addEventListener("change", () => {
    const files = Array.from(input.files);
    input.value = "";
    if (files.length) uploadFiles(files);
  });

  const grid = r.querySelector("#media-grid");
  if (!view.media.length) {
    grid.outerHTML = `<p class="muted" style="margin-top:14px">Cartella vuota.</p>`;
    return;
  }
  view.media.forEach((m, i) => {
    const tile = document.createElement("div");
    tile.className = "media-tile";
    tile.innerHTML = m.type === "video"
      ? `<video src="${escapeAttr(m.url)}#t=0.1" preload="metadata" muted playsinline></video><span class="play">▶</span>`
      : `<img src="${escapeAttr(m.url)}" alt="" loading="lazy">`;
    tile.innerHTML += `<span class="media-date">${fmtDay(m.created_at)}</span>`;
    tile.addEventListener("click", () => openLightbox(i));
    grid.appendChild(tile);
  });
}

async function closeFolder() {
  view.folder = null;
  view.uploadStatus = "";
  await renderProgress();
}

async function renameFolder() {
  const name = await promptDialog("Nuovo nome della cartella:", view.folder.name);
  if (name === null || !name.trim() || name.trim() === view.folder.name) return;
  try {
    const updated = await api.renameFolder(view.folder.id, name.trim());
    view.folder.name = updated.name;
    const inList = view.folders.find(f => f.id === updated.id);
    if (inList) inList.name = updated.name;
    renderFolder();
  } catch (e) {
    await alertDialog("Errore nel rinominare: " + e.message);
  }
}

async function deleteFolder() {
  const ok = await confirmDialog(
    `Eliminare la cartella "${escapeAttr(view.folder.name)}" e tutti i suoi file (${view.media.length})? L'operazione non è reversibile.`,
    { confirmText: "Elimina", danger: true }
  );
  if (!ok) return;
  try {
    await api.deleteFolder(view.folder.id);
    view.folders = view.folders.filter(f => f.id !== view.folder.id);
    view.folder = null;
    await renderProgress();
  } catch (e) {
    await alertDialog("Errore nell'eliminazione: " + e.message);
  }
}

function putFile(url, file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress(e.loaded / e.total); };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(xhr.status === 413 ? "file troppo grande" : `errore ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error("errore di rete"));
    xhr.send(file);
  });
}

function setStatus(text) {
  view.uploadStatus = text;
  const el = document.getElementById("upload-status");
  if (el) el.textContent = text;
}

async function uploadFiles(files) {
  const folder = view.folder;
  const failed = [];
  document.getElementById("upload-btn").disabled = true;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const prefix = `Caricamento ${i + 1}/${files.length}`;
    try {
      if (!/^(image|video)\//.test(file.type)) throw new Error("formato non supportato");
      setStatus(`${prefix}…`);
      const { path, signedUrl } = await api.getUploadUrl(folder.id, file.name, file.type);
      await putFile(signedUrl, file, p => setStatus(`${prefix}: ${Math.round(p * 100)}%`));
      const item = await api.registerMedia(folder.id, { path, filename: file.name, contentType: file.type, size: file.size });
      if (view.folder && view.folder.id === folder.id) view.media.push(item);
    } catch (e) {
      failed.push(`${file.name} (${e.message})`);
    }
  }

  folder.count = view.media.length;
  const inList = view.folders.find(f => f.id === folder.id);
  if (inList) inList.count = view.media.length;

  setStatus("");
  if (view.folder && view.folder.id === folder.id) renderFolder();
  if (failed.length) await alertDialog("Non caricati:<br>" + failed.map(escapeAttr).join("<br>"));
}

function openLightbox(startIndex) {
  let index = startIndex;
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay lightbox";
  document.body.appendChild(overlay);

  const close = () => {
    document.removeEventListener("keydown", onKey);
    overlay.remove();
  };
  const onKey = e => {
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") go(-1);
    if (e.key === "ArrowRight") go(1);
  };
  document.addEventListener("keydown", onKey);

  function go(delta) {
    const next = index + delta;
    if (next < 0 || next >= view.media.length) return;
    index = next;
    draw();
  }

  function draw() {
    const m = view.media[index];
    overlay.innerHTML = `
      <div class="lightbox-box">
        <div class="lightbox-media">
          ${m.type === "video"
            ? `<video src="${escapeAttr(m.url)}" controls playsinline autoplay></video>`
            : `<img src="${escapeAttr(m.url)}" alt="">`}
        </div>
        <div class="lightbox-bar">
          <button class="ghost" data-role="prev" ${index === 0 ? "disabled" : ""}>‹</button>
          <div class="muted" style="text-align:center;flex:1">${fmtDay(m.created_at)} · ${index + 1}/${view.media.length}</div>
          <button class="ghost" data-role="next" ${index === view.media.length - 1 ? "disabled" : ""}>›</button>
        </div>
        <div class="row" style="justify-content:space-between;margin-top:10px">
          <button class="danger" data-role="delete">Elimina</button>
          <button class="secondary" data-role="close">Chiudi</button>
        </div>
      </div>
    `;
    overlay.querySelector("[data-role=prev]").addEventListener("click", () => go(-1));
    overlay.querySelector("[data-role=next]").addEventListener("click", () => go(1));
    overlay.querySelector("[data-role=close]").addEventListener("click", close);
    overlay.querySelector("[data-role=delete]").addEventListener("click", async () => {
      const ok = await confirmDialog("Eliminare questo file? L'operazione non è reversibile.", { confirmText: "Elimina", danger: true });
      if (!ok) return;
      try {
        await api.deleteMedia(m.id);
      } catch (e) {
        await alertDialog("Errore nell'eliminazione: " + e.message);
        return;
      }
      view.media.splice(index, 1);
      view.folder.count = view.media.length;
      const inList = view.folders.find(f => f.id === view.folder.id);
      if (inList) inList.count = view.media.length;
      renderFolder();
      if (!view.media.length) { close(); return; }
      index = Math.min(index, view.media.length - 1);
      draw();
    });
  }

  overlay.addEventListener("click", e => { if (e.target === overlay) close(); });
  draw();
}
