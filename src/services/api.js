// src/services/api.js
export async function fetchDemoTasks(limit = 8) {
  // Simula asincronía real
  await new Promise((r) => setTimeout(r, 500));

  const demo = [
    {
      title: "Tomar 2L de agua",
      description: "Hidratación durante el día",
      category: "nutricion",
      priority: "medium",
      schedule: "daily",
      goalPerWeek: 3,
      dueTime: "12:00",
      tags: ["agua", "salud"],
    },
    {
      title: "Caminar 30 minutos",
      description: "Actividad suave diaria",
      category: "actividad",
      priority: "medium",
      schedule: "daily",
      goalPerWeek: 3,
      dueTime: "18:00",
      tags: ["caminar", "cardio"],
    },
    {
      title: "Entrenar fuerza",
      description: "Rutina de 45 min (pierna/espalda)",
      category: "actividad",
      priority: "high",
      schedule: "weekly",
      goalPerWeek: 3,
      dueTime: "19:00",
      tags: ["gym", "fuerza"],
    },
    {
      title: "Dormir 7–8 horas",
      description: "Apagar pantallas 45 min antes",
      category: "sueno",
      priority: "high",
      schedule: "daily",
      goalPerWeek: 3,
      dueTime: "23:00",
      tags: ["sueño", "descanso"],
    },
    {
      title: "Meditar 10 minutos",
      description: "Respiración/atención plena",
      category: "mente",
      priority: "medium",
      schedule: "daily",
      goalPerWeek: 3,
      dueTime: "09:00",
      tags: ["mindfulness", "estrés"],
    },
    {
      title: "Proteína en desayuno",
      description: "Yogurt/griego, huevos, etc.",
      category: "nutricion",
      priority: "low",
      schedule: "weekly",
      goalPerWeek: 5,
      dueTime: "09:00",
      tags: ["proteína", "nutrición"],
    },
    {
      title: "Tomar medicación",
      description: "Según indicación médica",
      category: "medicacion",
      priority: "high",
      schedule: "daily",
      goalPerWeek: 3,
      dueTime: "08:00",
      tags: ["medicación"],
    },
    {
      title: "Pausa activa 5 min",
      description: "Cada 2–3 horas de trabajo",
      category: "actividad",
      priority: "low",
      schedule: "daily",
      goalPerWeek: 3,
      dueTime: "15:00",
      tags: ["postura", "trabajo"],
    },
  ];

  return demo.slice(0, limit);
}