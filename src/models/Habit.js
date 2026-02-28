export class Habit {
  constructor({
    id = crypto.randomUUID(),
    title,
    description = "",
    category = "general",
    priority = "medium",
    schedule = "daily",
    goalPerWeek = 3,
    dueTime = null,
    tags = [],
    createdAt = new Date().toISOString(),
    order = 0,
    history = [],
  }) {
    this.id = id;
    this.title = (title || "").trim();          // ← evita error si viene undefined
    this.description = (description || "").trim();
    this.category = category;
    this.priority = priority;
    this.schedule = schedule;
    this.goalPerWeek = Number(goalPerWeek) || 0;
    this.dueTime = dueTime || null;
    this.tags = Array.isArray(tags) ? tags : [];
    this.createdAt = createdAt;
    this.order = order;

    // asegura array limpio y sin duplicados
    this.history = Array.isArray(history)
      ? [...new Set(history)].sort().reverse()   // más reciente primero
      : [];
  }

  isDoneOn(dateStr) {
    return this.history.includes(dateStr);
  }

  toggleOn(dateStr) {
    if (!dateStr) return;

    if (this.isDoneOn(dateStr)) {
      this.history = this.history.filter(d => d !== dateStr);
    } else {
      this.history = [...this.history, dateStr];
    }

    // Limpia duplicados y ordena
    this.history = [...new Set(this.history)].sort().reverse();
  }
}