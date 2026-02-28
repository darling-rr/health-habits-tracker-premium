let timeoutId = null;

export function showToast(msg, type = "info") {
  const el = document.getElementById("toast");
  if (!el) return;
  el.dataset.type = type;
  el.textContent = msg;
  el.classList.add("show");

  if (timeoutId) clearTimeout(timeoutId);
  timeoutId = setTimeout(() => el.classList.remove("show"), 2200);
}