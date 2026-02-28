import { openEditModal } from "./modal.js";
import { showToast } from "./toast.js";

export function renderApp(store) {
  const list = document.getElementById("taskList");
  const stats = document.getElementById("stats");

  const today = new Date().toISOString().slice(0, 10);

  const visible = store.getVisible();
  const total = visible.length;
  const done = visible.filter(h => (h.history || []).includes(today)).length;
  const pending = total - done;

  if (stats) {
    stats.textContent = `Hábitos: ${total} · Hoy: ${done} hechos · ${pending} pendientes`;
  }

  // Progreso (del filtro actual)
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const progressBar = document.getElementById("progressBar");
  const progressPct = document.getElementById("progressPct");
  const progressLabel = document.getElementById("progressLabel");

  if (progressBar) progressBar.style.width = `${pct}%`;
  if (progressPct) progressPct.textContent = `${pct}%`;
  if (progressLabel) progressLabel.textContent = `Hoy: ${done}/${total}`;

  list.innerHTML = "";

  visible.forEach(h => {
    const doneToday = (h.history || []).includes(today);
    const streak = calcStreak(h.history || [], today);

    const li = document.createElement("li");
    li.className = `card ${doneToday ? "done" : "pending"}`;
    li.draggable = true;
    li.dataset.id = h.id;

    // ✅ si hay dueTime, guardamos para countdown
    if (h.dueTime) li.dataset.duetime = h.dueTime;

    li.innerHTML = `
      <div class="top">
        <div class="title">
          <input type="checkbox" ${doneToday ? "checked" : ""} />
          <span>${escapeHtml(h.title)}</span>
        </div>
        <div class="badge pr-${escapeHtml(h.priority || "medium")}">${escapeHtml(h.priority || "medium")}</div>
      </div>

      <div class="meta">
        <span>🏷 ${escapeHtml(h.category || "general")}</span>
        <span>🔥 Racha: ${streak} día${streak === 1 ? "" : "s"}</span>
        ${h.dueTime ? `<span>⏰ ${escapeHtml(h.dueTime)} · <b data-countdown>--:--:--</b></span>` : ""}
        ${h.schedule === "weekly"
          ? `<span>📅 Meta: ${Number(h.goalPerWeek || 3)}/sem</span>`
          : `<span>📅 Diario</span>`}
        <span class="hint" hidden>Tip: marca el checkbox para registrar HOY ✅</span>
      </div>

      ${h.description ? `<p class="desc">${escapeHtml(h.description)}</p>` : ""}

      <div class="tags">
        ${(h.tags || []).map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
      </div>

      <div class="actions">
        <button data-action="edit">Editar</button>
        <button data-action="delete" class="danger">Eliminar</button>
      </div>
    `;

    // Enter animation
    li.classList.add("enter");
    requestAnimationFrame(() => li.classList.add("enter-active"));
    setTimeout(() => li.classList.remove("enter", "enter-active"), 220);

    // ✅ mouseover/mouseenter (cumple pauta)
    const hint = li.querySelector(".hint");
    li.addEventListener("mouseenter", () => {
      li.classList.add("hovered");
      if (hint) hint.hidden = false;
    });
    li.addEventListener("mouseleave", () => {
      li.classList.remove("hovered");
      if (hint) hint.hidden = true;
    });

    // Toggle "cumplido hoy"
    li.querySelector('input[type="checkbox"]').addEventListener("change", () => {
      store.toggleToday(h.id);
      showToast(doneToday ? "Check-in removido ↩️" : "Check-in de hoy ✅", "ok");

      li.style.transform = "scale(0.995)";
      setTimeout(() => (li.style.transform = ""), 120);

      renderApp(store);
    });

    // Delete (exit animation)
    li.querySelector('[data-action="delete"]').addEventListener("click", () => {
      if (!confirm("¿Eliminar este hábito?")) return;

      li.classList.add("exit");
      setTimeout(() => {
        store.remove(h.id);
        showToast("Hábito eliminado 🗑️", "warn");
        renderApp(store);
      }, 200);
    });

    // Edit
    li.querySelector('[data-action="edit"]').addEventListener("click", () => {
      openEditModal(h, (patch) => {
        const next = {
          ...patch,
          goalPerWeek: patch.goalPerWeek !== undefined ? Number(patch.goalPerWeek || 3) : undefined,
        };

        store.update(h.id, next);
        showToast("Hábito actualizado ✨", "ok");
        renderApp(store);
      });
    });

    // Drag & drop
    li.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", h.id);
      li.classList.add("dragging");
    });
    li.addEventListener("dragend", () => li.classList.remove("dragging"));

    list.appendChild(li);
  });

  // drop handler (en el UL)
  list.ondragover = (e) => {
    e.preventDefault();
    const dragging = list.querySelector(".dragging");
    const after = getDragAfterElement(list, e.clientY);
    if (!dragging) return;
    if (after == null) list.appendChild(dragging);
    else list.insertBefore(dragging, after);
  };

  list.ondrop = () => {
    const ids = [...list.querySelectorAll("li.card")].map(li => li.dataset.id);
    store.reorder(ids);
    showToast("Orden guardado 📌", "info");
  };

  // ✅ Countdown (cumple pauta)
  startCountdownTicker(list);
}

function getDragAfterElement(container, y) {
  const els = [...container.querySelectorAll("li.card:not(.dragging)")];
  return els.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) return { offset, element: child };
    return closest;
  }, { offset: Number.NEGATIVE_INFINITY, element: null }).element;
}

// Racha: días consecutivos hacia atrás desde "today"
function calcStreak(history, todayStr) {
  const set = new Set(history);
  let streak = 0;

  for (let i = 0; i < 3650; i++) {
    const d = new Date(todayStr);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (set.has(key)) streak++;
    else break;
  }
  return streak;
}

// ✅ Actualiza todos los countdowns cada 1s sin re-render completo
function startCountdownTicker(listEl) {
  if (!listEl) return;

  // evita duplicar intervals cada render
  if (window.__habitCountdownInterval) clearInterval(window.__habitCountdownInterval);

  const tick = () => {
    const cards = listEl.querySelectorAll("li.card[data-duetime]");
    const now = new Date();

    cards.forEach((card) => {
      const dueTime = card.dataset.duetime; // "HH:MM"
      const out = card.querySelector("[data-countdown]");
      if (!out || !dueTime) return;

      const [hh, mm] = dueTime.split(":").map(Number);
      if (Number.isNaN(hh) || Number.isNaN(mm)) {
        out.textContent = "--:--:--";
        return;
      }

      // target = hoy a la hora dueTime (si ya pasó, apunta a mañana)
      const target = new Date();
      target.setHours(hh, mm, 0, 0);
      if (target <= now) target.setDate(target.getDate() + 1);

      const diff = target - now;
      out.textContent = formatMs(diff);
    });
  };

  tick();
  window.__habitCountdownInterval = setInterval(tick, 1000);
}

function formatMs(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (s) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[s])
  );
}