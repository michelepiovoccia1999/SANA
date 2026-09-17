import { api, setSession, clearSession } from "./api.js";

function el(id) { return document.getElementById(id); }

let registerMode = false;

function translateError(msg) {
  if (/username o password errati/i.test(msg)) return "Username o password errati.";
  if (/già in uso/i.test(msg)) return "Username già in uso.";
  return msg;
}

export function initAuth({ onLogin, onLogout }) {
  el("toggle-mode").addEventListener("click", () => {
    registerMode = !registerMode;
    el("login-submit").textContent = registerMode ? "Registrati" : "Accedi";
    el("login-subtitle").textContent = registerMode ? "Crea un nuovo account" : "Accedi con username e password";
    el("toggle-mode-text").textContent = registerMode ? "Hai già un account?" : "Non hai un account?";
    el("toggle-mode").textContent = registerMode ? "Accedi" : "Registrati";
    el("login-error").classList.add("hidden");
  });

  el("login-submit").addEventListener("click", async () => {
    const username = el("login-username").value.trim();
    const password = el("login-password").value;
    const errBox = el("login-error");
    errBox.classList.add("hidden");
    if (!username || !password) {
      errBox.textContent = "Inserisci username e password.";
      errBox.classList.remove("hidden");
      return;
    }

    el("login-submit").disabled = true;
    try {
      const data = registerMode
        ? await api.register(username, password)
        : await api.login(username, password);
      setSession(data.token, data.username);
      onLogin(data.username);
    } catch (e) {
      errBox.textContent = translateError(e.message);
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
