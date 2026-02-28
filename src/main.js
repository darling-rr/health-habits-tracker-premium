import { createHabitStore } from "./store/habitStore.js";
import { renderApp } from "./ui/render.js";
import { showToast } from "./ui/toast.js";
import { fetchDemoTasks } from "./services/api.js";

const store = createHabitStore();
renderApp(store);

// ✅ Animación suave: mostrar/ocultar goalPerWeek según schedule
const scheduleSelect = document.querySelector('select[name="schedule"]');
const goalInput = document.querySelector('input[name="goalPerWeek"]');

if (goalInput) {
  goalInput.classList.add("goal-animated");
}

function updateGoalVisibility() {
  if (!scheduleSelect || !goalInput) return;

  if (scheduleSelect.value === "weekly") {
    goalInput.classList.remove("hidden");
  } else {
    goalInput.classList.add("hidden");
  }
}

// Inicial
updateGoalVisibility();

// Cuando cambie el schedule
if (scheduleSelect) {
  scheduleSelect.addEventListener("change", updateGoalVisibility);
}

// Form add (crear hábito)
const form = document.getElementById("taskForm");
if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const title = fd.get("title");
    if (!title?.trim()) return;

    showToast("Guardando hábito…", "info");
    setTimeout(() => {
      store.add({
        title,
        description: fd.get("description") || "",
        category: fd.get("category") || "general",
        priority: fd.get("priority") || "medium",
        schedule: fd.get("schedule") || "daily",
        goalPerWeek: Number(fd.get("goalPerWeek") || 3),
        dueTime: fd.get("dueTime") || null,
        tags: (fd.get("tags") || "").split(",").map((s) => s.trim()).filter(Boolean),
      });

      showToast("Hábito creado ✅", "ok");
      e.currentTarget.reset();

      // ✅ reset vuelve a daily, así que re-evaluamos la visibilidad animada
      updateGoalVisibility();

      renderApp(store);
    }, 700);
  });
}

// Search / filter / sort
const q = document.getElementById("q");
if (q) {
  q.addEventListener("keyup", (e) => {
    store.setQuery(e.target.value);
    renderApp(store);
  });
}

const filter = document.getElementById("filter");
if (filter) {
  filter.addEventListener("change", (e) => {
    store.setFilter(e.target.value);
    renderApp(store);
  });
}

const sort = document.getElementById("sort");
if (sort) {
  sort.addEventListener("change", (e) => {
    store.setSort(e.target.value);
    renderApp(store);
  });
}

// Import demo (API)
const importBtn = document.getElementById("importDemo");
if (importBtn) {
  importBtn.addEventListener("click", async () => {
    try {
      showToast("Importando hábitos desde API…", "info");
      const demo = await fetchDemoTasks(5);

      demo.forEach((h) =>
        store.add({
          title: h.title,
          description: h.description || "Importado desde API demo",
          category: h.category || "general",
          priority: h.priority || "low",
          schedule: h.schedule || "daily",
          goalPerWeek: Number(h.goalPerWeek || 3),
          dueTime: h.dueTime || null,
          tags: Array.isArray(h.tags) ? h.tags : ["demo"],
        })
      );

      showToast("Importadas ✅", "ok");
      renderApp(store);
    } catch (err) {
      showToast(err?.message || "Error al importar", "warn");
    }
  });
}

// ✅ Toggle vista (hoy <-> semana)
const viewToggle = document.getElementById("viewToggle");
if (viewToggle) {
  viewToggle.textContent = store.ui.view === "week" ? "✅ Ver hoy" : "📅 Ver semana";

  viewToggle.addEventListener("click", () => {
    const next = store.ui.view === "today" ? "week" : "today";
    store.setView(next);
    viewToggle.textContent = next === "week" ? "✅ Ver hoy" : "📅 Ver semana";
    renderApp(store);
  });
}

// Dark mode
const themeBtn = document.getElementById("theme");
const THEME_KEY = "health_habits_theme";
document.documentElement.dataset.theme = localStorage.getItem(THEME_KEY) || "light";

if (themeBtn) {
  themeBtn.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    localStorage.setItem(THEME_KEY, next);
  });
}