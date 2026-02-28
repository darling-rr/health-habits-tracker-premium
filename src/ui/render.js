import { openEditModal } from "./modal.js";
import { showToast } from "./toast.js";

export function renderApp(store) {
  const list = document.getElementById("taskList");
  const stats = document.getElementById("stats");
  if (!list) return;

  const today = new Date().toISOString().slice(0, 10);
  const week = getWeekDatesMondayToSunday(today); // semana actual (lun->dom)

  const visible = store.getVisible();

  // ---- Progreso HOY (del filtro actual) ----
  const total = visible.length;
  const doneTodayCount = visible.filter(h => (h.history || []).includes(today)).length;
  const pendingTodayCount = total - doneTodayCount;

  // ---- Progreso SEMANAL GLOBAL (semana actual) ----
  const weekDone = visible.reduce((acc, h) => acc + countInRange(h.history || [], week), 0);
  const weekTotal = visible.reduce((acc, h) => {
    if (h.schedule === "weekly") return acc + Number(h.goalPerWeek || 3);
    return acc + 7;
  }, 0);
  const weekPct = weekTotal === 0 ? 0 : Math.round((weekDone / weekTotal) * 100);

  if (stats) {
    stats.textContent =
      `Hábitos: ${total} · Hoy: ${doneTodayCount} hechos · ${pendingTodayCount} pendientes · Semana: ${weekDone}/${weekTotal} checks`;
  }

  // Barra HOY (la tuya existente)
  const progressBar = document.getElementById("progressBar");
  const progressPct = document.getElementById("progressPct");
  const progressLabel = document.getElementById("progressLabel");
  const pctToday = total === 0 ? 0 : Math.round((doneTodayCount / total) * 100);
  if (progressBar) progressBar.style.width = `${pctToday}%`;
  if (progressPct) progressPct.textContent = `${pctToday}%`;
  if (progressLabel) progressLabel.textContent = `Hoy: ${doneTodayCount}/${total}`;

  // Barra SEMANAL global (nueva)
  const weekBar = document.getElementById("weekProgressBar");
  const weekPctEl = document.getElementById("weekProgressPct");
  const weekLabelEl = document.getElementById("weekProgressLabel");
  if (weekBar) weekBar.style.width = `${weekPct}%`;
  if (weekPctEl) weekPctEl.textContent = `${weekPct}%`;
  if (weekLabelEl) weekLabelEl.textContent = `Semana (L-D): ${weekDone}/${weekTotal}`;

  // Render según vista
  list.innerHTML = "";

  if (store.ui.view === "week") {
    renderWeekTable(list, visible, week, store);
    return;
  }

  // ---- Vista HOY (cards) ----
  visible.forEach(h => {
    const history = h.history || [];
    const doneToday = history.includes(today);
    const streak = calcStreak(history, today);

    const priority = h.priority || "medium";
    const category = h.category || "general";

    // Cumplimiento semana actual
    const weekCount = countInRange(history, week);
    const weekGoal = h.schedule === "weekly" ? Number(h.goalPerWeek || 3) : 7;
    const weekLabel = `${Math.min(weekCount, weekGoal)}/${weekGoal}`;

    const li = document.createElement("li");
    li.className = `card ${doneToday ? "done" : "pending"}`;
    li.draggable = true;
    li.dataset.id = h.id;

    li.innerHTML = `
      <div class="top">
        <div class="title">
          <input type="checkbox" ${doneToday ? "checked" : ""} />
          <span>${escapeHtml(h.title)}</span>
        </div>

        <div style="display:flex; gap:8px; align-items:center;">
          <div class="badge ${getWeekBadgeClass(weekCount, weekGoal)}">✅ ${escapeHtml(weekLabel)}</div>
          <div class="badge pr-${escapeHtml(priority)}">${escapeHtml(priority)}</div>
        </div>
      </div>

      <div class="meta">
        <span>🏷 ${escapeHtml(category)}</span>
        <span>🔥 Racha: ${streak} día${streak === 1 ? "" : "s"}</span>
        ${h.dueTime ? `<span>⏰ ${escapeHtml(h.dueTime)}</span>` : ""}
        ${h.schedule === "weekly"
          ? `<span>📅 Semanal (${Number(h.goalPerWeek || 3)}/sem)</span>`
          : `<span>📅 Diario</span>`}
      </div>

      ${h.description ? `<p class="desc">${escapeHtml(h.description)}</p>` : ""}

      <div class="tags">
        ${(h.tags || []).map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
      </div>

      <div class="habit-week">
        ${renderWeekDots(history, week)}
        <span class="week-label">semana actual</span>
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

    // Toggle HOY
    li.querySelector('input[type="checkbox"]').addEventListener("change", () => {
      store.toggleToday(h.id);
      showToast(doneToday ? "Check-in removido ↩️" : "Check-in de hoy ✅", "ok");

      // pop weekly badge
      const wb = li.querySelector(".badge-week-low, .badge-week-mid, .badge-week-high");
      if (wb) { wb.style.transform = "scale(1.03)"; setTimeout(() => (wb.style.transform = ""), 140); }

      renderApp(store);
    });

    // Click dots (histórico semana actual)
    const weekWrap = li.querySelector(".habit-week");
    if (weekWrap) {
      weekWrap.addEventListener("click", (ev) => {
        const dot = ev.target.closest(".day-dot");
        if (!dot) return;

        const dateStr = dot.dataset.date;
        if (!dateStr) return;

        store.toggleOnDate(h.id, dateStr);
        dot.style.transform = "scale(1.15)";
        setTimeout(() => (dot.style.transform = ""), 140);

        showToast(`Actualizado: ${dateStr}`, "info");
        renderApp(store);
      });
    }

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

  // drop handler
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
}

// ---------- Week view table ----------
function renderWeekTable(container, habits, weekDates, store) {
  const header = weekDates.map(d => d.slice(5)).map(x => `<th>${x}</th>`).join("");

  const rows = habits.map(h => {
    const history = h.history || [];
    const tds = weekDates.map(d => {
      const on = history.includes(d);
      return `
        <td class="week-cell">
          <span class="week-toggle ${on ? "on" : ""}" data-id="${h.id}" data-date="${d}" title="${d}"></span>
        </td>
      `;
    }).join("");

    return `
      <tr>
        <td>
          <div class="week-habit">
            <span class="name">${escapeHtml(h.title)}</span>
            <span class="badge">${escapeHtml(h.category || "general")}</span>
          </div>
        </td>
        ${tds}
      </tr>
    `;
  }).join("");

  container.innerHTML = `
    <div class="week-view">
      <table class="week-table">
        <thead>
          <tr>
            <th>Hábito</th>
            ${header}
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      <div class="week-legend">Tip: clic en un cuadrito para marcar/desmarcar ese día.</div>
    </div>
  `;

  container.querySelector(".week-view").addEventListener("click", (ev) => {
    const cell = ev.target.closest(".week-toggle");
    if (!cell) return;

    const id = cell.dataset.id;
    const dateStr = cell.dataset.date;
    if (!id || !dateStr) return;

    store.toggleOnDate(id, dateStr);

    cell.style.transform = "scale(1.15)";
    setTimeout(() => (cell.style.transform = ""), 140);

    showToast(`Actualizado: ${dateStr}`, "info");
    renderApp(store);
  });
}

// ---------- Drag helper ----------
function getDragAfterElement(container, y) {
  const els = [...container.querySelectorAll("li.card:not(.dragging)")];
  return els.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) return { offset, element: child };
    return closest;
  }, { offset: Number.NEGATIVE_INFINITY, element: null }).element;
}

// ---------- Week dots ----------
function renderWeekDots(history, weekDates) {
  const set = new Set(history);
  return weekDates
    .map((d) => {
      const on = set.has(d);
      const label = d.slice(5);
      return `<span class="day-dot ${on ? "on" : ""}" data-date="${d}" title="${label}"></span>`;
    })
    .join("");
}

// ---------- Utils ----------
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

function getWeekDatesMondayToSunday(todayStr) {
  const base = new Date(todayStr);
  const day = base.getDay(); // 0 dom, 1 lun...
  const diffToMon = (day + 6) % 7; // lunes = 0
  base.setDate(base.getDate() - diffToMon);

  const out = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

function countInRange(history, allowedDates) {
  const set = new Set(allowedDates);
  let c = 0;
  for (const d of history) if (set.has(d)) c++;
  return c;
}

function getWeekBadgeClass(count, goal) {
  const ratio = goal === 0 ? 0 : count / goal;
  if (ratio >= 1) return "badge-week-high";
  if (ratio >= 0.5) return "badge-week-mid";
  return "badge-week-low";
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (s) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[s])
  );
}