const KEY = "health_habits_v1";

export const storage = {
  load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },
  save(tasks) {
    localStorage.setItem(KEY, JSON.stringify(tasks));
  },
};