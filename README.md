Health Habits Tracker Premium

Aplicación web desarrollada en JavaScript Vanilla para el seguimiento de hábitos de salud.

🔗 Demo

https://health-habits-tracker-premium.vercel.app/

💻 Repositorio

https://github.com/darling-rr/health-habits-tracker-premium

🎯 Objetivo

Desarrollar una aplicación web interactiva utilizando JavaScript moderno, aplicando:

Programación Orientada a Objetos

Manipulación dinámica del DOM

Manejo de eventos

JavaScript asíncrono

Consumo de APIs

🧠 Arquitectura
src/
  models/      Habit.js
  store/       habitStore.js
  ui/          render.js, modal.js, toast.js
  services/    storage.js, api.js
  main.js

Separación clara de responsabilidades:

Modelo

Estado

UI

Servicios

✅ Funcionalidades implementadas
📦 POO

Clase Habit

Métodos como toggleOn(), isDoneOn()

Gestor centralizado (habitStore)

🖱 Eventos

submit

click

keyup

drag & drop

mouseenter / mouseleave

⏱ Asincronía

Simulación de guardado con setTimeout

Countdown dinámico para hábitos con hora límite

async/await + fetch para importar datos demo

🌐 API

Importación de hábitos demo usando fetch

Manejo de errores con try/catch

💾 Persistencia

LocalStorage

📊 Métricas

Progreso diario

Progreso semanal

Racha (streak)

Barra de progreso animada

🎨 UX

Animaciones suaves

Microinteracciones

Modo oscuro

Drag & Drop

Vista semanal editable

🚀 Tecnologías

JavaScript ES6+

HTML5

CSS3

Vercel (deploy)
