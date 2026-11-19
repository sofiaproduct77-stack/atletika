(function () {
  const loginView = document.getElementById("login-view");
  const appView = document.getElementById("app-view");
  const loginForm = document.getElementById("login-form");
  const loginError = document.getElementById("login-error");
  const logoutBtn = document.getElementById("logout-btn");
  const settingsForm = document.getElementById("settings-form");
  const settingsMsg = document.getElementById("settings-msg");
  const leadsBody = document.querySelector("#leads-table tbody");

  async function api(path, options = {}) {
    const res = await fetch(path, {
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || "Ошибка запроса");
      err.status = res.status;
      throw err;
    }
    return data;
  }

  function showApp(loggedIn) {
    loginView.classList.toggle("hidden", loggedIn);
    appView.classList.toggle("hidden", !loggedIn);
    logoutBtn.classList.toggle("hidden", !loggedIn);
  }

  async function refreshSession() {
    try {
      const { loggedIn } = await api("/api/admin/session");
      showApp(loggedIn);
      if (loggedIn) {
        await Promise.all([loadSettings(), loadLeads()]);
      }
    } catch {
      showApp(false);
    }
  }

  async function loadSettings() {
    const s = await api("/api/admin/settings");
    for (const [key, value] of Object.entries(s)) {
      const input = settingsForm.elements.namedItem(key);
      if (input) input.value = value;
    }
  }

  function formatDate(iso) {
    if (!iso) return "—";
    const d = new Date(iso.endsWith("Z") ? iso : `${iso}Z`);
    return d.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  async function loadLeads() {
    const { leads } = await api("/api/admin/leads");
    leadsBody.replaceChildren();
    for (const lead of leads) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${lead.id}</td>
        <td>${formatDate(lead.created_at)}</td>
        <td>${escapeHtml(lead.name)}</td>
        <td>${escapeHtml(lead.contact || "—")}</td>
        <td>${escapeHtml(lead.interest_label || lead.interest)}</td>
        <td><select class="status" data-id="${lead.id}">
          <option value="new">new</option>
          <option value="done">done</option>
          <option value="spam">spam</option>
        </select></td>
      `;
      const sel = tr.querySelector("select");
      sel.value = lead.status;
      sel.addEventListener("change", async () => {
        await api(`/api/admin/leads/${lead.id}`, {
          method: "PATCH",
          body: JSON.stringify({ status: sel.value }),
        });
      });
      leadsBody.appendChild(tr);
    }
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginError.classList.add("hidden");
    const data = new FormData(loginForm);
    try {
      await api("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({
          username: data.get("username"),
          password: data.get("password"),
        }),
      });
      showApp(true);
      await Promise.all([loadSettings(), loadLeads()]);
    } catch (err) {
      loginError.textContent = err.message;
      loginError.classList.remove("hidden");
    }
  });

  logoutBtn.addEventListener("click", async () => {
    try {
      await api("/api/admin/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    showApp(false);
  });

  settingsForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    settingsMsg.classList.add("hidden");
    const data = new FormData(settingsForm);
    const body = {};
    for (const name of [
      "address",
      "phone",
      "phoneDisplay",
      "telegram",
      "hoursWeekdays",
      "hoursWeekend",
    ]) {
      body[name] = data.get(name);
    }
    await api("/api/admin/settings", { method: "PATCH", body: JSON.stringify(body) });
    settingsMsg.classList.remove("hidden");
    setTimeout(() => settingsMsg.classList.add("hidden"), 2500);
  });

  refreshSession();
})();