export const DAYS = [
  { id: "mon", label: "Lunedì" },
  { id: "tue", label: "Martedì" },
  { id: "wed", label: "Mercoledì" },
  { id: "thu", label: "Giovedì" },
  { id: "fri", label: "Venerdì" },
  { id: "sat", label: "Sabato" },
  { id: "sun", label: "Domenica" },
];
const DAY_INDEX = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 0 };

export function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }
export function dayLabel(id) { return DAYS.find(d => d.id === id)?.label || id; }
export function dateToDay(date) {
  const jsDay = date.getDay();
  return Object.keys(DAY_INDEX).find(k => DAY_INDEX[k] === jsDay);
}
export function fmtDate(date) {
  return date.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });
}
export function isoDate(date) {
  const y = date.getFullYear(), m = String(date.getMonth() + 1).padStart(2, "0"), d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
export function escapeAttr(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
export function defaultMeals() {
  return [
    { id: uid(), name: "Colazione", options: [{ id: uid(), items: [] }] },
    { id: uid(), name: "Spuntino mattutino", options: [{ id: uid(), items: [] }] },
    { id: uid(), name: "Pranzo", options: [{ id: uid(), items: [] }] },
    { id: uid(), name: "Spuntino pomeridiano", options: [{ id: uid(), items: [] }] },
    { id: uid(), name: "Cena", options: [{ id: uid(), items: [] }] },
  ];
}
export function emptyPlan() {
  const p = {};
  DAYS.forEach(d => { p[d.id] = { day: d.id, label: d.label, meals: defaultMeals() }; });
  return p;
}
