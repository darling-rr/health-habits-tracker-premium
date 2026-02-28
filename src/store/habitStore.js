import { Habit } from "../models/Habit.js";
import { storage } from "../services/storage.js";

function sortByOrder(a, b) {
  return (a.order ?? 0) - (b.order ?? 0);
}

const todayStr = () => new Date().toISOString().slice(0, 10);

export function createHabitStore() {
  let habits = storage.load().map((h) => new Habit(h)).sort(sortByOrder);
  let ui = { filter: "all", q: "", sort: "order", view: "today" }; // view: today | week

  const persist = () => storage.save(habits);

  const getVisible = () => {
    const q = (ui.q || "").toLowerCase().trim();
    let list = [...habits];

    // Filtro: all | doneToday | notDoneToday
    const t = todayStr();

    // ✅ Soporta filtros nuevos
    if (ui.filter === "doneToday") list = list.filter((h) => h.isDoneOn(t));
    if (ui.filter === "notDoneToday") list = list.filter((h) => !h.isDoneOn(t));

    // ✅ Soporta filtros antiguos si quedaron en tu HTML (opcional pero útil)
    if (ui.filter === "done") list = list.filter((h) => h.isDoneOn(t));
    if (ui.filter === "pending") list = list.filter((h) => !h.isDoneOn(t));

    if (q) {
      list = list.filter((h) => {
        const text = `${h.title || ""} ${h.description || ""} ${(h.tags || []).join(" ")} ${h.category || ""}`.toLowerCase();
        return text.includes(q);
      });
    }

    if (ui.sort === "created") {
      list.sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
    }

    if (ui.sort === "priority") {
      const rank = { high: 0, medium: 1, low: 2 };
      list.sort((a, b) => (rank[a.priority] ?? 9) - (rank[b.priority] ?? 9));
    }

    if (ui.sort === "order") list.sort(sortByOrder);

    return list;
  };

  const toggleOnDate = (id, dateStr) => {
    habits = habits.map((h) => {
      if (h.id !== id) return h;
      const next = new Habit(h);
      next.toggleOn(dateStr);
      return next;
    });
    persist();
  };

  const toggleToday = (id) => {
    toggleOnDate(id, todayStr());
  };

  return {
    get habits() {
      return habits;
    },
    get ui() {
      return ui;
    },

    // ✅ para vista semana
    get view() {
      return ui.view;
    },
    setView(view) {
      ui = { ...ui, view };
    },

    getVisible,

    setFilter(filter) {
      ui = { ...ui, filter };
    },
    setQuery(q) {
      ui = { ...ui, q };
    },
    setSort(sort) {
      ui = { ...ui, sort };
    },

    add(payload) {
      const order = habits.length ? Math.max(...habits.map((h) => h.order ?? 0)) + 1 : 0;
      habits = [new Habit({ ...payload, order }), ...habits];
      persist();
    },

    update(id, patch) {
      habits = habits.map((h) => (h.id === id ? new Habit({ ...h, ...patch }) : h));
      persist();
    },

    remove(id) {
      habits = habits.filter((h) => h.id !== id);
      persist();
    },

    // ✅ toggles
    toggleToday,
    toggleOnDate,

    reorder(idsInOrder) {
      const map = new Map(idsInOrder.map((id, idx) => [id, idx]));
      habits = habits.map((h) =>
        new Habit({ ...h, order: map.has(h.id) ? map.get(h.id) : h.order })
      );
      habits.sort(sortByOrder);
      persist();
    },

    clearAll() {
      habits = [];
      persist();
    },
  };
}