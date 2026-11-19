require("dotenv").config();
const path = require("path");
const express = require("express");
const session = require("express-session");
const {
  openDatabase,
  getSettings,
  setSettings,
  insertLead,
  listLeads,
  updateLeadStatus,
} = require("./lib/database");
const { listServices } = require("./lib/catalog");

const PORT = Number(process.env.PORT) || 3001;
const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "atletika123";
const SESSION_SECRET = process.env.SESSION_SECRET || "dev-only-change-me";

const db = openDatabase();
const app = express();

app.use(express.json({ limit: "32kb" }));
app.use(
  session({
    name: "atletika.sid",
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  })
);

function requireAdmin(req, res, next) {
  if (req.session?.admin) return next();
  res.status(401).json({ error: "Требуется вход" });
}

const INTEREST_LABELS = {
  standard: "Обычный абонемент 1 500 ₽",
  year: "Абонемент на год 10 200 ₽",
  vip: "VIP-абонемент 3 500 ₽",
  solarium: "Солярий",
  pt: "Персональная тренировка",
};

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "atletika" });
});

app.get("/api/site", (_req, res) => {
  res.json({
    ...getSettings(db),
    services: listServices(),
  });
});

app.get("/api/catalog", (_req, res) => {
  res.json({ services: listServices() });
});

app.post("/api/leads", (req, res) => {
  const name = String(req.body?.name || "").trim();
  const contact = String(req.body?.phone || req.body?.contact || "").trim();
  const interest = String(req.body?.interest || "standard").trim();

  if (!name || name.length > 120) {
    res.status(400).json({ error: "Укажите имя" });
    return;
  }
  if (contact.length > 200) {
    res.status(400).json({ error: "Слишком длинный контакт" });
    return;
  }
  if (!INTEREST_LABELS[interest]) {
    res.status(400).json({ error: "Некорректный тип заявки" });
    return;
  }

  const id = insertLead(db, {
    name,
    contact,
    interest,
    interestLabel: INTEREST_LABELS[interest],
  });

  res.status(201).json({ ok: true, id });
});

app.post("/api/admin/login", (req, res) => {
  const username = String(req.body?.username || "").trim();
  const password = String(req.body?.password || "");
  if (username !== ADMIN_USER || password !== ADMIN_PASSWORD) {
    res.status(401).json({ error: "Неверный логин или пароль" });
    return;
  }
  req.session.admin = { user: ADMIN_USER };
  res.json({ ok: true });
});

app.post("/api/admin/logout", requireAdmin, (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get("/api/admin/session", (req, res) => {
  res.json({ loggedIn: Boolean(req.session?.admin) });
});

app.get("/api/admin/settings", requireAdmin, (_req, res) => {
  res.json(getSettings(db));
});

app.patch("/api/admin/settings", requireAdmin, (req, res) => {
  setSettings(db, req.body || {});
  res.json(getSettings(db));
});

app.get("/api/admin/leads", requireAdmin, (_req, res) => {
  res.json({ leads: listLeads(db) });
});

app.patch("/api/admin/leads/:id", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const status = String(req.body?.status || "");
  if (!Number.isFinite(id) || !updateLeadStatus(db, id, status)) {
    res.status(400).json({ error: "Не удалось обновить заявку" });
    return;
  }
  res.json({ ok: true });
});

app.use("/admin", express.static(path.join(__dirname, "admin")));

app.use(
  express.static(__dirname, {
    index: "index.html",
    dotfiles: "ignore",
  })
);

app.listen(PORT, () => {
  console.log(`АТЛЕТИКА: http://localhost:${PORT}`);
  console.log(`Админка: http://localhost:${PORT}/admin/`);
  if (SESSION_SECRET === "dev-only-change-me" || ADMIN_PASSWORD === "atletika123") {
    console.warn("Смените SESSION_SECRET и ADMIN_PASSWORD в .env перед продакшеном.");
  }
});