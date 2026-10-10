
const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");
const message = document.getElementById("message");

let tasks = [];

async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options
  });

  if (!response.ok) {
    throw new Error("Request failed. Please try again.");
  }

  return response.json();
}

function showMessage(text) {
  message.textContent = text;
}

function updateSummary() {
  document.getElementById("totalTasks").textContent = tasks.length;
  document.getElementById("completedTasks").textContent =
    tasks.filter(task => task.completed).length;
  document.getElementById("pendingTasks").textContent =
    tasks.filter(task => !task.completed).length;
}

function renderTasks() {
  taskList.replaceChildren();

  if (tasks.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = "No tasks yet. Add your first task!";
    taskList.appendChild(empty);
  }

  tasks.forEach(task => {
    const item = document.createElement("li");
    item.className = "task-item";

    if (task.completed) {
      item.classList.add("completed");
    }

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", "Mark task completed");

    checkbox.addEventListener("change", async () => {
      try {
        const updated = await request(`/api/tasks/${task.id}`, {
          method: "PATCH",
          body: JSON.stringify({ completed: checkbox.checked })
        });

        tasks = tasks.map(t => t.id === updated.id ? updated : t);
        renderTasks();
        showMessage("");
      } catch (error) {
        checkbox.checked = !checkbox.checked;
        showMessage(error.message);
      }
    });

    const text = document.createElement("span");
    text.className = "task-text";
    text.textContent = task.title;

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-btn";
    deleteButton.textContent = "Delete";

    deleteButton.addEventListener("click", async () => {
      try {
        await request(`/api/tasks/${task.id}`, {
          method: "DELETE"
        });

        tasks = tasks.filter(t => t.id !== task.id);
        renderTasks();
        showMessage("");
      } catch (error) {
        showMessage(error.message);
      }
    });

    item.append(checkbox, text, deleteButton);
    taskList.appendChild(item);
  });

  updateSummary();
}

taskForm.addEventListener("submit", async event => {
  event.preventDefault();

  const title = taskInput.value.trim();

  if (!title) {
    showMessage("Please enter a task.");
    return;
  }

  try {
    const task = await request("/api/tasks", {
      method: "POST",
      body: JSON.stringify({ title })
    });

    tasks.unshift(task);
    taskInput.value = "";
    renderTasks();
    showMessage("");
    taskInput.focus();
  } catch (error) {
    showMessage(error.message);
  }
});

async function loadTasks() {
  try {
    tasks = await request("/api/tasks");
    renderTasks();
    showMessage("");
  } catch (error) {
    showMessage("Cannot connect to the server. Start server.js first.");
  }
}

loadTasks();
