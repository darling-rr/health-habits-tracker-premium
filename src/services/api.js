export async function fetchDemoTasks(limit = 5) {
  const url = `https://jsonplaceholder.typicode.com/todos?_limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("No se pudo cargar la API demo");
  const data = await res.json();
  return data.map(t => ({
    title: t.title,
    description: "Importada desde API demo",
    status: t.completed ? "done" : "pending",
    priority: "low",
    tags: ["demo"],
  }));
}