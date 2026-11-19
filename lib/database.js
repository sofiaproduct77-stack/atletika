const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

const DEFAULT_SETTINGS = {
  phone: "+79000000000",
  phoneDisplay: "+7 (900) 000-00-00",
  telegram: "",
  address: "ул. Замятина, 4",
  hoursWeekdays: "9:00 – 22:00",
  hoursWeekend: "9:00 – 21:00",
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function defaultStore() {
  return {
    settings: { ...DEFAULT_SETTINGS },
    leads: [],
    nextLeadId: 1,
  };
}

function loadStore() {
  ensureDataDir();
  if (!fs.existsSync(STORE_PATH)) {
    const store = defaultStore();
    saveStore(store);
    return store;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(STORE_PATH, "utf8"));
    return {
      ...defaultStore(),
      ...parsed,
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
      leads: Array.isArray(parsed.leads) ? parsed.leads : [],
      nextLeadId: Number(parsed.nextLeadId) || 1,
    };
  } catch {
    const store = defaultStore();
    saveStore(store);
    return store;
  }
}

function saveStore(store) {
  ensureDataDir();
  const tmp = `${STORE_PATH}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(store, null, 2), "utf8");
  fs.renameSync(tmp, STORE_PATH);
}

function openDatabase() {
  return {
    read() {
      return loadStore();
    },
    write(mutator) {
      const store = loadStore();
      mutator(store);
      saveStore(store);
      return store;
    },
  };
}

function getSettings(db) {
  const store = db.read();
  return { ...DEFAULT_SETTINGS, ...store.settings };
}

function setSettings(db, patch) {
  const allowed = new Set(Object.keys(DEFAULT_SETTINGS));
  return db.write((store) => {
    for (const [key, value] of Object.entries(patch)) {
      if (!allowed.has(key) || value === undefined || value === null) continue;
      store.settings[key] = String(value).trim();
    }
  }).settings;
}

function insertLead(db, { name, contact, interest, interestLabel }) {
  let id;
  db.write((store) => {
    id = store.nextLeadId;
    store.nextLeadId += 1;
    store.leads.push({
      id,
      name: name.trim(),
      contact: (contact || "").trim(),
      interest,
      interest_label: interestLabel || interest,
      created_at: new Date().toISOString(),
      status: "new",
    });
  });
  return id;
}

function listLeads(db, limit = 200) {
  const store = db.read();
  return [...store.leads].sort((a, b) => b.id - a.id).slice(0, limit);
}

function updateLeadStatus(db, id, status) {
  const allowed = new Set(["new", "done", "spam"]);
  if (!allowed.has(status)) return false;
  let ok = false;
  db.write((store) => {
    const lead = store.leads.find((l) => l.id === id);
    if (!lead) return;
    lead.status = status;
    ok = true;
  });
  return ok;
}

module.exports = {
  openDatabase,
  getSettings,
  setSettings,
  insertLead,
  listLeads,
  updateLeadStatus,
  DEFAULT_SETTINGS,
};