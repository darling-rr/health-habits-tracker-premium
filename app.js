class Tarea {
  constructor(id, descripcion, fechaLimite = null) {
    this.id = id;
    this.descripcion = descripcion;
    this.estado = "pendiente";
    this.fechaCreacion = new Date();
    this.fechaLimite = fechaLimite;
  }

  cambiarEstado() {
    this.estado = this.estado === "pendiente" ? "completada" : "pendiente";
  }
}

class GestorTareas {
  constructor() {
    this.tareas = [];
  }

  agregarTarea(tarea) {
    this.tareas.push(tarea);
    this.guardarEnLocalStorage();
  }

  eliminarTarea(id) {
    this.tareas = this.tareas.filter(t => t.id !== id);
    this.guardarEnLocalStorage();
  }

  guardarEnLocalStorage() {
    localStorage.setItem("tareas", JSON.stringify(this.tareas));
  }

  cargarDesdeLocalStorage() {
    const datos = JSON.parse(localStorage.getItem("tareas")) || [];
    this.tareas = datos.map(t => new Tarea(t.id, t.descripcion, t.fechaLimite));
  }
}

const gestor = new GestorTareas();
gestor.cargarDesdeLocalStorage();

const form = document.getElementById("taskForm");
const taskList = document.getElementById("taskList");
const notification = document.getElementById("notification");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const descripcion = document.getElementById("description").value;
  const fechaLimite = document.getElementById("dueDate").value;

  // Simular retardo (ASINCRONÍA)
  setTimeout(() => {
    const nuevaTarea = new Tarea(Date.now(), descripcion, fechaLimite);
    gestor.agregarTarea(nuevaTarea);
    mostrarTareas();
    mostrarNotificacion("Tarea agregada con éxito ✅");
  }, 1000);

  form.reset();
});

function mostrarTareas() {
  taskList.innerHTML = "";

  gestor.tareas.forEach(tarea => {
    const li = document.createElement("li");
    li.textContent = tarea.descripcion;

    if (tarea.estado === "completada") {
      li.classList.add("completed");
    }

    li.addEventListener("click", () => {
      tarea.cambiarEstado();
      gestor.guardarEnLocalStorage();
      mostrarTareas();
    });

    const btnEliminar = document.createElement("button");
    btnEliminar.textContent = "Eliminar";
    btnEliminar.addEventListener("click", () => {
      gestor.eliminarTarea(tarea.id);
      mostrarTareas();
    });

    li.appendChild(btnEliminar);

    // Contador regresivo
    if (tarea.fechaLimite) {
      const contador = document.createElement("span");
      setInterval(() => {
        const hoy = new Date();
        const limite = new Date(tarea.fechaLimite);
        const diff = Math.floor((limite - hoy) / (1000 * 60 * 60 * 24));
        contador.textContent = ` - ${diff} días restantes`;
      }, 1000);
      li.appendChild(contador);
    }

    taskList.appendChild(li);
  });
}

mostrarTareas();

function mostrarNotificacion(mensaje) {
  notification.textContent = mensaje;

  setTimeout(() => {
    notification.textContent = "";
  }, 2000);
}

async function obtenerTareasAPI() {
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/todos?_limit=5");
    const data = await response.json();

    data.forEach(item => {
      const tarea = new Tarea(item.id, item.title);
      gestor.agregarTarea(tarea);
    });

    mostrarTareas();
  } catch (error) {
    console.error("Error al obtener tareas:", error);
  }
}

// Llamar solo una vez si quieres precargar tareas
// obtenerTareasAPI();