/** Цены для API / будущего бота */
const SERVICES = {
  standard: {
    id: "standard",
    title: "Обычный абонемент",
    price: 1500,
    note: "Тренажёрный и аэробный зал",
  },
  year: {
    id: "year",
    title: "Абонемент на год",
    price: 10200,
    note: "Год посещений в клубе",
  },
  vip: {
    id: "vip",
    title: "VIP-абонемент",
    price: 3500,
    note: "Ежедневно · без лимита времени · аэробика + зал · солярий 10 мин · 1 ПТ",
  },
  solarium_1: { id: "solarium_1", title: "Солярий 1 мин", price: 15, category: "solarium", kind: "single" },
  solarium_50: {
    id: "solarium_50",
    title: "Абонемент солярий 50 мин",
    price: 600,
    category: "solarium",
    kind: "subscription",
  },
  solarium_100: {
    id: "solarium_100",
    title: "Абонемент солярий 100 мин",
    price: 1000,
    category: "solarium",
    kind: "subscription",
  },
  solarium_kit: { id: "solarium_kit", title: "Набор для солярия", price: 20, category: "solarium" },
};

function listServices() {
  return Object.values(SERVICES);
}

module.exports = { SERVICES, listServices };