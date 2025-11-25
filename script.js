document.addEventListener("DOMContentLoaded", () => {
  // === DOM ===
  const body = document.body;
  const themeToggleBtn = document.getElementById("themeToggleBtn");

  // Auth DOM
  const authContainer = document.getElementById("authContainer");
  const mainApp = document.getElementById("mainApp");
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const loginBtn = document.getElementById("loginBtn");
  const registerBtn = document.getElementById("registerBtn");
  const showRegister = document.getElementById("showRegister");
  const showLogin = document.getElementById("showLogin");
  const logoutBtn = document.getElementById("logoutBtn");

  // Inputs
  const loginUsernameInput = document.getElementById("loginUsername");
  const loginPasswordInput = document.getElementById("loginPassword");
  const registerUsernameInput = document.getElementById("registerUsername");
  const registerPasswordInput = document.getElementById("registerPassword");

  // Todo DOM
  const taskInput = document.getElementById("taskInput");
  const categorySelect = document.getElementById("categorySelect");
  const repetitionSelect = document.getElementById("repetitionSelect");
  const prioritySelect = document.getElementById("prioritySelect");
  const emojiSelect = document.getElementById("emojiSelect");
  const dueDateInput = document.getElementById("dueDateInput");
  const dueTimeInput = document.getElementById("dueTimeInput");
  const dueAmPmInput = document.getElementById("dueAmPmInput");
  const addTaskBtn = document.getElementById("addTaskBtn");
  const taskList = document.getElementById("taskList");
  const taskSearchInput = document.getElementById("taskSearchInput");

  const currentMonthYearDisplay = document.getElementById("currentMonthYear");
  const prevMonthBtn = document.getElementById("prevMonthBtn");
  const nextMonthBtn = document.getElementById("nextMonthBtn");
  const calendarGrid = document.querySelector(".calendar-grid");

  const dailyScheduleDisplay = document.getElementById("dailyScheduleDisplay");
  const dailyTaskList = document.getElementById("dailyTaskList");

  const filterButtons = document.querySelectorAll(".filter-btn");
  const dateViewButtons = document.querySelectorAll(".date-view-btn");

  // === State ===
  let currentUser = null;
  let todos = []; // Local cache of todos from server
  let currentFilterCategory = "all";
  let currentDateView = "all";
  let searchQuery = "";
  let currentDate = new Date();
  let selectedDateStr = null;
  let editingTask = null;

  // Date -> Set(priority)
  let priorityByDate = new Map();

  // Utils
  const pad = (n) => n.toString().padStart(2, "0");
  const formatDateStr = (d) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  function getPriorityRank(p) {
    return p === "high" ? 1 : p === "medium" ? 2 : p === "low" ? 3 : 4;
  }

  // === API Helpers ===
  // === API Helpers ===
  async function apiCall(url, method = "GET", body = null) {
    // Ensure we hit the backend port 3000, even if serving frontend from 5500 (Live Server)
    const fullUrl = url.startsWith("http") ? url : `http://localhost:3000${url}`;

    const options = {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: 'include', // 쿠키 전송을 위해 필수
    };
    if (body) options.body = JSON.stringify(body);

    try {
      const res = await fetch(fullUrl, options);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.msg || "API Error");
      return data;
    } catch (err) {
      console.error(err);
      alert(err.message);
      throw err;
    }
  }

  // === Auth Logic ===
  async function checkAuth() {
    try {
      const data = await apiCall("/api/check-auth");
      if (data.isAuthenticated) {
        currentUser = data.user;
        showMainApp();
        loadTodos();
      } else {
        showAuth();
      }
    } catch (err) {
      showAuth();
    }
  }

  function showAuth() {
    authContainer.style.display = "flex";
    mainApp.style.display = "none";
  }

  function showMainApp() {
    authContainer.style.display = "none";
    mainApp.style.display = "block";
    // Initialize calendar and defaults
    renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
    if (!dueTimeInput.value) {
      const now = new Date();
      let h = now.getHours();
      const m = now.getMinutes();
      const ampm = h >= 12 ? "pm" : "am";
      h = h % 12 || 12;
      dueTimeInput.value = `${pad(h)}:${pad(m)}`;
      dueAmPmInput.value = ampm;
    }
  }

  showRegister.addEventListener("click", (e) => {
    e.preventDefault();
    loginForm.style.display = "none";
    registerForm.style.display = "block";
  });

  showLogin.addEventListener("click", (e) => {
    e.preventDefault();
    registerForm.style.display = "none";
    loginForm.style.display = "block";
  });

  loginBtn.addEventListener("click", async () => {
    const username = loginUsernameInput.value;
    const password = loginPasswordInput.value;
    try {
      const data = await apiCall("/api/login", "POST", { username, password });
      currentUser = data.user;
      loginUsernameInput.value = "";
      loginPasswordInput.value = "";
      showMainApp();
      loadTodos();
    } catch (e) { }
  });

  registerBtn.addEventListener("click", async () => {
    const username = registerUsernameInput.value;
    const password = registerPasswordInput.value;
    try {
      await apiCall("/api/register", "POST", { username, password });
      alert("Registration successful! Please login.");
      registerForm.style.display = "none";
      loginForm.style.display = "block";
      registerUsernameInput.value = "";
      registerPasswordInput.value = "";
    } catch (e) { }
  });

  logoutBtn.addEventListener("click", async () => {
    try {
      await apiCall("/api/logout", "POST");
      currentUser = null;
      todos = [];
      taskList.innerHTML = "";
      showAuth();
    } catch (e) { }
  });

  // === Todo Logic ===
  async function loadTodos() {
    try {
      todos = await apiCall("/api/tasks");
      renderTodos();
    } catch (e) { }
  }

  async function createTodo(todoData) {
    try {
      const newTodo = await apiCall("/api/tasks", "POST", todoData);
      todos.push(newTodo);
      renderTodos();
    } catch (e) { }
  }

  async function updateTodo(id, todoData) {
    try {
      const updated = await apiCall(`/api/tasks/${id}`, "PUT", todoData);
      const idx = todos.findIndex(t => t.id == id);
      if (idx !== -1) todos[idx] = updated;
      renderTodos();
    } catch (e) { }
  }

  async function deleteTodo(id) {
    try {
      await apiCall(`/api/tasks/${id}`, "DELETE");
      todos = todos.filter(t => t.id != id);
      renderTodos();
    } catch (e) { }
  }

  // === Rendering ===
  function renderTodos() {
    taskList.innerHTML = "";

    // Sort
    const sorted = [...todos].sort((a, b) => {
      const da = a.due_date || "";
      const db = b.due_date || "";
      if (da && !db) return -1;
      if (!da && db) return 1;
      if (da !== db) return da.localeCompare(db);

      const ta = a.due_time || "";
      const tb = b.due_time || "";
      if (ta && !tb) return -1;
      if (!ta && tb) return 1;
      if (ta !== tb) return ta.localeCompare(tb);

      const pa = getPriorityRank(a.priority);
      const pb = getPriorityRank(b.priority);
      if (pa !== pb) return pa - pb;

      return (a.text || "").localeCompare(b.text || "");
    });

    // Filter
    const now = new Date();
    const todayStr = formatDateStr(now);
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfWeekStr = formatDateStr(startOfWeek);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    const endOfWeekStr = formatDateStr(endOfWeek);

    sorted.forEach(todo => {
      // Filter Logic
      const matchesCategory = currentFilterCategory === "all" || todo.category === currentFilterCategory;
      const matchesSearch = !searchQuery || todo.text.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesDate = false;
      if (currentDateView === 'all') {
        matchesDate = true;
      } else if (todo.due_date) {
        const taskDate = new Date(todo.due_date);
        // Fix timezone issue for date comparison if needed, but string comparison works for YYYY-MM-DD
        // Note: DB returns date string usually.
        // Let's ensure due_date is string YYYY-MM-DD
        const dStr = typeof todo.due_date === 'string' ? todo.due_date.split('T')[0] : '';

        if (currentDateView === 'daily') {
          matchesDate = dStr === todayStr;
        } else if (currentDateView === 'weekly') {
          matchesDate = dStr >= startOfWeekStr && dStr <= endOfWeekStr;
        } else if (currentDateView === 'monthly') {
          matchesDate = taskDate.getFullYear() === currentYear && taskDate.getMonth() === currentMonth;
        }
      }

      if (matchesCategory && matchesSearch && matchesDate) {
        createTaskElement(todo);
      }
    });

    updatePriorityByDate();
  }

  function createTaskElement(todo, targetList = taskList) {
    const li = document.createElement("li");
    li.dataset.id = todo.id;
    li.dataset.category = todo.category;
    li.dataset.priority = todo.priority;
    // Handle date string format from DB (might be ISO)
    const dStr = todo.due_date ? (typeof todo.due_date === 'string' ? todo.due_date.split('T')[0] : '') : '';
    li.dataset.dueDate = dStr;
    li.dataset.dueTime = todo.due_time || "";

    if (todo.priority && todo.priority !== "none") {
      li.classList.add(`priority-bg-${todo.priority}`);
    }
    if (todo.completed) li.classList.add("completed");

    const topRow = document.createElement("div");
    topRow.classList.add("task-row-main");

    if (todo.emoji) {
      const e = document.createElement("span");
      e.classList.add("task-emoji");
      e.textContent = todo.emoji;
      topRow.appendChild(e);
    }

    const content = document.createElement("span");
    content.classList.add("task-content");
    content.textContent = todo.text;
    topRow.appendChild(content);

    const details = document.createElement("div");
    details.classList.add("task-details-display");

    const meta = document.createElement("div");
    meta.classList.add("task-meta");

    if (todo.category && todo.category !== "all") {
      const m = document.createElement("span");
      m.classList.add("task-category");
      const map = { work: "업무", personal: "개인", exercise: "운동", rest: "휴식" };
      m.textContent = map[todo.category] || todo.category;
      meta.appendChild(m);
    }

    if (todo.priority && todo.priority !== "none") {
      const m = document.createElement("span");
      m.classList.add("task-priority");
      const map = { high: "상", medium: "중", low: "하" };
      m.textContent = map[todo.priority] || todo.priority;
      meta.appendChild(m);
    }

    if (dStr || todo.due_time) {
      const m = document.createElement("span");
      m.classList.add("task-date");
      m.textContent = [dStr, todo.due_time].filter(Boolean).join(" ");
      meta.appendChild(m);
    }

    details.appendChild(meta);

    const actions = document.createElement("div");
    actions.classList.add("task-actions");

    const completeBtn = document.createElement("button");
    completeBtn.classList.add("complete-btn");
    completeBtn.textContent = "Done";
    completeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      updateTodo(todo.id, { ...todo, completed: !todo.completed });
    });
    actions.appendChild(completeBtn);

    const editBtn = document.createElement("button");
    editBtn.classList.add("edit-btn");
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      handleEdit(todo);
    });
    actions.appendChild(editBtn);

    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("delete-btn");
    deleteBtn.textContent = "Del";
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteTodo(todo.id);
    });
    actions.appendChild(deleteBtn);

    details.appendChild(actions);
    li.appendChild(topRow);
    li.appendChild(details);
    targetList.appendChild(li);
  }

  function handleEdit(todo) {
    editingTask = todo;
    taskInput.value = todo.text;
    categorySelect.value = todo.category || "all";
    repetitionSelect.value = todo.repetition || "none";
    prioritySelect.value = todo.priority || "none";
    emojiSelect.value = todo.emoji || "";
    dueDateInput.value = todo.due_date ? todo.due_date.split('T')[0] : "";

    if (todo.due_time) {
      const [hour, minute] = todo.due_time.split(":");
      const h = parseInt(hour, 10);
      const hour12 = h % 12 || 12;
      const ampm = h >= 12 ? "pm" : "am";
      dueTimeInput.value = `${pad(hour12)}:${minute}`;
      dueAmPmInput.value = ampm;
    } else {
      dueTimeInput.value = "";
      dueAmPmInput.value = "am";
    }

    addTaskBtn.textContent = "수정";
  }

  // === Add Task ===
  addTaskBtn.addEventListener("click", () => {
    const text = taskInput.value.trim();
    if (!text) {
      alert("할 일을 입력하세요.");
      return;
    }

    const category = categorySelect.value;
    const repetition = repetitionSelect.value;
    const priority = prioritySelect.value;
    const emoji = emojiSelect.value;
    const baseDueDate = dueDateInput.value;
    const dueTimeStr = dueTimeInput.value.trim();
    const dueAmPm = dueAmPmInput.value;

    let baseDueTime = "";
    if (dueTimeStr) {
      const timeRegex = /^([0-9]|0[0-9]|1[0-2]):([0-5][0-9])$/;
      const match = dueTimeStr.match(timeRegex);
      if (!match) {
        alert("시간 형식이 올바르지 않습니다. (예: 10:30)");
        return;
      }
      let hour = parseInt(match[1], 10);
      const minute = parseInt(match[2], 10);
      if (dueAmPm === "pm" && hour !== 12) hour += 12;
      else if (dueAmPm === "am" && hour === 12) hour = 0;
      baseDueTime = `${pad(hour)}:${pad(minute)}`;
    }

    const todoData = {
      text, category, repetition, priority, emoji,
      due_date: baseDueDate || null,
      due_time: baseDueTime || ""
    };

    if (editingTask) {
      updateTodo(editingTask.id, { ...editingTask, ...todoData });
      editingTask = null;
      addTaskBtn.textContent = "추가";
    } else {
      // Repetition Logic (Simplified: Create multiple tasks immediately or just one)
      // For full stack, repetition is complex. Here we'll just create one task or multiple if needed.
      // The previous logic created multiple items in local storage.
      // We can replicate that by calling createTodo multiple times.

      if (repetition !== "none" && !baseDueDate) {
        alert("반복 일정을 사용하려면 날짜를 선택하세요.");
        return;
      }

      if (!baseDueDate || repetition === "none") {
        createTodo(todoData);
      } else {
        const dateParts = baseDueDate.split('-').map(Number);
        const base = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
        const occurrences = 5;

        if (repetition === "weekdays") {
          let daysAdded = 0;
          let currentDay = new Date(base);
          while (daysAdded < occurrences) {
            const dayOfWeek = currentDay.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
              createTodo({ ...todoData, due_date: formatDateStr(currentDay) });
              daysAdded++;
            }
            currentDay.setDate(currentDay.getDate() + 1);
          }
        } else {
          for (let i = 0; i < occurrences; i++) {
            const d = new Date(base);
            if (repetition === "daily") d.setDate(base.getDate() + i);
            else if (repetition === "weekly") d.setDate(base.getDate() + i * 7);
            else if (repetition === "monthly") d.setMonth(base.getMonth() + i);
            createTodo({ ...todoData, due_date: formatDateStr(d) });
          }
        }
      }
    }

    // Reset inputs
    taskInput.value = "";
    categorySelect.value = "all";
    repetitionSelect.value = "none";
    prioritySelect.value = "none";
    emojiSelect.value = "";
  });

  // === Calendar & Filters ===
  function updatePriorityByDate() {
    priorityByDate = new Map();
    todos.forEach(todo => {
      if (!todo.due_date || !todo.priority || todo.priority === 'none') return;
      const dStr = typeof todo.due_date === 'string' ? todo.due_date.split('T')[0] : '';
      if (!priorityByDate.has(dStr)) priorityByDate.set(dStr, new Set());
      priorityByDate.get(dStr).add(todo.priority);
    });
    renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
    if (selectedDateStr) displayTasksForDate(selectedDateStr);
  }

  function renderCalendar(year, month) {
    calendarGrid.querySelectorAll(".calendar-day").forEach((d) => d.remove());
    currentMonthYearDisplay.textContent = `${year}년 ${month + 1}월`;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstWeekday = firstDay.getDay();

    for (let i = 0; i < firstWeekday; i++) {
      const empty = document.createElement("div");
      empty.classList.add("calendar-day", "empty");
      calendarGrid.appendChild(empty);
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const dateObj = new Date(year, month, day);
      const dateStr = formatDateStr(dateObj);
      const dayCell = document.createElement("div");
      dayCell.classList.add("calendar-day");
      dayCell.textContent = day;

      const dow = dateObj.getDay();
      if (dow === 0) dayCell.classList.add("sunday");
      if (dow === 6) dayCell.classList.add("saturday");

      const priorities = priorityByDate.get(dateStr);
      if (priorities && priorities.size > 0) {
        const stack = document.createElement("div");
        stack.classList.add("priority-stack");
        ["high", "medium", "low"].forEach((lv) => {
          if (priorities.has(lv)) {
            const seg = document.createElement("div");
            seg.classList.add("priority-segment", `priority-${lv}`);
            stack.appendChild(seg);
          }
        });
        dayCell.appendChild(stack);
      }

      if (selectedDateStr === dateStr) dayCell.classList.add("selected-date");

      dayCell.addEventListener("click", () => {
        selectedDateStr = dateStr;
        dueDateInput.value = dateStr;
        displayTasksForDate(dateStr);
        document.querySelectorAll(".calendar-day").forEach((d) => d.classList.remove("selected-date"));
        dayCell.classList.add("selected-date");
      });

      calendarGrid.appendChild(dayCell);
    }
  }

  function displayTasksForDate(dateStr) {
    dailyTaskList.innerHTML = "";
    const dateParts = dateStr.split('-').map(Number);
    const date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];
    dailyScheduleDisplay.querySelector("h3").textContent = `${month}월 ${day}일 (${dayOfWeek})`;

    const tasksForDate = todos.filter(t => {
      const dStr = t.due_date ? (typeof t.due_date === 'string' ? t.due_date.split('T')[0] : '') : '';
      return dStr === dateStr;
    });

    if (tasksForDate.length === 0) {
      const noTaskMsg = document.createElement("li");
      noTaskMsg.textContent = "이 날짜에 등록된 일정이 없습니다.";
      noTaskMsg.style.textAlign = "center";
      noTaskMsg.style.opacity = "0.7";
      dailyTaskList.appendChild(noTaskMsg);
      return;
    }

    tasksForDate.forEach(todo => {
      createTaskElement(todo, dailyTaskList);
    });
  }

  prevMonthBtn.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
  });

  nextMonthBtn.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
  });

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilterCategory = btn.dataset.filter || "all";
      renderTodos();
    });
  });

  dateViewButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      dateViewButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentDateView = btn.dataset.viewType || "all";
      renderTodos();
    });
  });

  taskSearchInput.addEventListener("input", () => {
    searchQuery = taskSearchInput.value;
    renderTodos();
  });

  // Theme
  function applyTheme(theme) {
    if (theme === "dark") {
      body.classList.remove("light-mode");
      body.classList.add("dark-mode");
      themeToggleBtn.textContent = "라이트 모드";
    } else {
      body.classList.remove("dark-mode");
      body.classList.add("light-mode");
      themeToggleBtn.textContent = "다크 모드";
    }
  }
  const savedTheme = localStorage.getItem("theme") || "light";
  applyTheme(savedTheme);
  themeToggleBtn.addEventListener("click", () => {
    const isDark = body.classList.contains("dark-mode");
    const next = isDark ? "light" : "dark";
    applyTheme(next);
    localStorage.setItem("theme", next);
  });

  dueTimeInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length > 2) value = value.slice(0, 2) + ':' + value.slice(2);
    e.target.value = value;
  });

  // Init
  checkAuth();
});
