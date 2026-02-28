export function openEditModal(habit, onSave) {
  const modal = document.getElementById("editModal");
  const form = document.getElementById("editForm");
  const closeBtn = document.getElementById("closeModal");

  // Si tu HTML actual no tiene estos campos, los creamos dinámicamente
  ensureHabitFields(form);

  // Cargar valores
  form.title.value = habit.title || "";
  form.description.value = habit.description || "";
  form.category.value = habit.category || "general";
  form.priority.value = habit.priority || "medium";
  form.schedule.value = habit.schedule || "daily";
  form.goalPerWeek.value = Number(habit.goalPerWeek || 3);
  form.dueTime.value = habit.dueTime || "";
  form.tags.value = (habit.tags || []).join(", ");

  // Mostrar/ocultar goalPerWeek según schedule
  syncScheduleUI(form);

  const close = () => modal.classList.remove("open");
  modal.classList.add("open");

  const onScheduleChange = () => syncScheduleUI(form);
  form.schedule.addEventListener("change", onScheduleChange);

  const handler = (e) => {
    e.preventDefault();

    onSave({
      title: form.title.value,
      description: form.description.value,
      category: form.category.value,
      priority: form.priority.value,
      schedule: form.schedule.value,
      goalPerWeek: Number(form.goalPerWeek.value || 3),
      dueTime: form.dueTime.value || null,
      tags: form.tags.value.split(",").map(s => s.trim()).filter(Boolean),
    });

    cleanup();
    close();
  };

  const cleanup = () => {
    form.removeEventListener("submit", handler);
    form.schedule.removeEventListener("change", onScheduleChange);
  };

  form.addEventListener("submit", handler);

  closeBtn.onclick = () => {
    cleanup();
    close();
  };

  // Cerrar clickeando afuera
  modal.onclick = (ev) => {
    if (ev.target === modal) {
      cleanup();
      close();
    }
  };
}

function syncScheduleUI(form) {
  const wrap = form.querySelector('[data-field="goalWrap"]');
  const isWeekly = form.schedule.value === "weekly";
  if (wrap) wrap.style.display = isWeekly ? "block" : "none";
}

function ensureHabitFields(form) {
  // Si ya existe (porque lo pusiste en HTML), no hacemos nada
  if (form.querySelector('[data-habit-fields="1"]')) return;

  // Construye campos extra debajo de los existentes
  const marker = document.createElement("div");
  marker.dataset.habitFields = "1";

  marker.innerHTML = `
    <div class="grid-2">
      <label class="field">
        <span>Categoría</span>
        <select name="category">
          <option value="general">General</option>
          <option value="sueno">Sueño</option>
          <option value="nutricion">Nutrición</option>
          <option value="actividad">Actividad</option>
          <option value="mente">Mente</option>
          <option value="medicacion">Medicación</option>
        </select>
      </label>

      <label class="field">
        <span>Frecuencia</span>
        <select name="schedule">
          <option value="daily">Diario</option>
          <option value="weekly">Semanal</option>
        </select>
      </label>
    </div>

    <div class="grid-2" data-field="goalWrap" style="display:none;">
      <label class="field">
        <span>Meta semanal (1-7)</span>
        <input name="goalPerWeek" type="number" min="1" max="7" value="3" />
      </label>
      <div></div>
    </div>

    <div class="grid-2">
      <label class="field">
        <span>Hora sugerida</span>
        <input name="dueTime" type="time" />
      </label>

      <label class="field">
        <span>Tags</span>
        <input name="tags" placeholder="agua, gym, sueño..." />
      </label>
    </div>
  `;

  // Inserta antes del botón submit si existe, si no al final
  const submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn) form.insertBefore(marker, submitBtn);
  else form.appendChild(marker);

  // Asegura que existan los inputs base (por si tu modal anterior era mínimo)
  ensureBaseField(form, "title", "Título", "text", true);
  ensureBaseField(form, "description", "Descripción", "text", false);
  ensurePriority(form);
}

function ensureBaseField(form, name, label, type, required) {
  if (form[name]) return;

  const wrap = document.createElement("label");
  wrap.className = "field";
  wrap.innerHTML = `
    <span>${label}</span>
    <input name="${name}" type="${type}" ${required ? "required" : ""} />
  `;
  form.prepend(wrap);
}

function ensurePriority(form) {
  if (form.priority) return;

  const wrap = document.createElement("label");
  wrap.className = "field";
  wrap.innerHTML = `
    <span>Prioridad</span>
    <select name="priority">
      <option value="low">low</option>
      <option value="medium">medium</option>
      <option value="high">high</option>
    </select>
  `;
  form.insertBefore(wrap, form.children[1] || null);
}