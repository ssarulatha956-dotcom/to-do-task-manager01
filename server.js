
const express = require("express");
const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "tasks.json");

app.use(express.json({ limit: "10kb" }));
function readTasks() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

function saveTasks(tasks) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2));
}

app.get("/api/tasks", (req, res) => {
  try {
    res.json(readTasks());
  } catch (error) {
    res.status(500).json({ error: "Could not load tasks." });
  }
});

app.post("/api/tasks", (req, res) => {
  const title = typeof req.body.title === "string"
    ? req.body.title.trim()
    : "";

  if (!title || title.length > 200) {
    return res.status(400).json({
      error: "Enter a task between 1 and 200 characters."
    });
  }

  try {
    const tasks = readTasks();
    const task = {
      id: randomUUID(),
      title,
      completed: false,
      createdAt: new Date().toISOString()
    };

    tasks.unshift(task);
    saveTasks(tasks);
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: "Could not save task." });
  }
});

app.patch("/api/tasks/:id", (req, res) => {
  if (typeof req.body.completed !== "boolean") {
    return res.status(400).json({
      error: "A valid completed status is required."
    });
  }

  try {
    const tasks = readTasks();
    const task = tasks.find(t => t.id === req.params.id);

    if (!task) {
      return res.status(404).json({ error: "Task not found." });
    }

    task.completed = req.body.completed;
    saveTasks(tasks);
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: "Could not update task." });
  }
});

app.delete("/api/tasks/:id", (req, res) => {
  try {
    const tasks = readTasks();
    const remaining = tasks.filter(t => t.id !== req.params.id);

    if (remaining.length === tasks.length) {
      return res.status(404).json({ error: "Task not found." });
    }

    saveTasks(remaining);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Could not delete task." });
  }
});

app.use(express.static(__dirname));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Task Manager running on port ${PORT}`);
});
