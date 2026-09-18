import { api, setSession, clearSession } from "./api.js";

function el(id) { return document.getElementById(id); }

export function initAuth({ onLogin, onLogout }) {
  const errBox = () => el("login-error");
  const registerBtn = () => el("login-register");

  function showError(msg) {
    errBox().textContent = msg;
    errBox().classList.remove("hidden");
  }
  function hideError() {
    errBox().classList.add("hidden");
    registerBtn().classList.add("hidden");
  }

  el("login-username").addEventListener("input", hideError);

  el("login-submit").addEventListener("click", async () => {
    const username = el("login-username").value.trim();
    hideError();
    if (!username) { showError("Inserisci uno username."); return; }

    el("login-submit").disabled = true;
    try {
      const data = await api.login(username);
      setSession(data.token, data.username);
      onLogin(data.username);
    } catch (e) {
      if (e.status === 404) {
        showError("Username non trovato.");
        registerBtn().classList.remove("hidden");
      } else {
        showError(e.message);
      }
    } finally {
      el("login-submit").disabled = false;
    }
  });

  registerBtn().addEventListener("click", async () => {
    const username = el("login-username").value.trim();
    if (!username) return;

    registerBtn().disabled = true;
    try {
      const data = await api.register(username);
      setSession(data.token, data.username);
      hideError();
      onLogin(data.username);
    } catch (e) {
      showError(e.message);
    } finally {
      registerBtn().disabled = false;
    }
  });

  el("logout-btn").addEventListener("click", () => {
    clearSession();
    onLogout();
  });

  window.addEventListener("sana:unauthorized", onLogout);
}

export function showLogin() {
  el("login-screen").classList.remove("hidden");
  el("app").classList.add("hidden");
}

export function showApp(username) {
  el("login-screen").classList.add("hidden");
  el("app").classList.remove("hidden");
  el("whoami").textContent = username;
}
