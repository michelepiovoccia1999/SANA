import { api, setSession, clearSession } from "./api.js";

function el(id) { return document.getElementById(id); }

export function initAuth({ onLogin, onLogout }) {
  el("login-submit").addEventListener("click", async () => {
    const username = el("login-username").value.trim();
    const errBox = el("login-error");
    errBox.classList.add("hidden");
    if (!username) {
      errBox.textContent = "Inserisci uno username.";
      errBox.classList.remove("hidden");
      return;
    }

    el("login-submit").disabled = true;
    try {
      const data = await api.login(username);
      setSession(data.token, data.username);
      onLogin(data.username);
    } catch (e) {
      errBox.textContent = e.message;
      errBox.classList.remove("hidden");
    } finally {
      el("login-submit").disabled = false;
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
