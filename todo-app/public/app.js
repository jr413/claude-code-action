// DOM elements
const todoInput = document.getElementById('todoInput');
const addButton = document.getElementById('addButton');
const todoList = document.getElementById('todoList');
const todoCount = document.getElementById('todoCount');
const filterButtons = document.querySelectorAll('.filter-btn');

// State
let todos = [];
let currentFilter = 'all';

// API functions
async function fetchTodos() {
  try {
    const response = await fetch('/api/todos');
    todos = await response.json();
    renderTodos();
  } catch (error) {
    console.error('Error fetching todos:', error);
  }
}

async function addTodo(text) {
  try {
    const response = await fetch('/api/todos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    });
    
    if (response.ok) {
      const newTodo = await response.json();
      todos.push(newTodo);
      renderTodos();
    }
  } catch (error) {
    console.error('Error adding todo:', error);
  }
}

async function toggleTodo(id, completed) {
  try {
    const response = await fetch(`/api/todos/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ completed })
    });
    
    if (response.ok) {
      const updatedTodo = await response.json();
      const index = todos.findIndex(todo => todo.id === id);
      if (index !== -1) {
        todos[index] = updatedTodo;
        renderTodos();
      }
    }
  } catch (error) {
    console.error('Error updating todo:', error);
  }
}

async function deleteTodo(id) {
  try {
    const response = await fetch(`/api/todos/${id}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      todos = todos.filter(todo => todo.id !== id);
      renderTodos();
    }
  } catch (error) {
    console.error('Error deleting todo:', error);
  }
}

// UI functions
function renderTodos() {
  const filteredTodos = filterTodos(todos, currentFilter);
  
  if (filteredTodos.length === 0) {
    todoList.innerHTML = '<li class="empty-message">タスクがありません</li>';
  } else {
    todoList.innerHTML = filteredTodos
      .map(todo => `
        <li class="todo-item ${todo.completed ? 'completed' : ''}">
          <input 
            type="checkbox" 
            class="todo-checkbox" 
            ${todo.completed ? 'checked' : ''}
            onchange="handleToggle(${todo.id}, this.checked)"
          >
          <span class="todo-text">${escapeHtml(todo.text)}</span>
          <button class="delete-btn" onclick="handleDelete(${todo.id})">
            削除
          </button>
        </li>
      `)
      .join('');
  }
  
  updateTodoCount();
}

function filterTodos(todos, filter) {
  switch (filter) {
    case 'active':
      return todos.filter(todo => !todo.completed);
    case 'completed':
      return todos.filter(todo => todo.completed);
    default:
      return todos;
  }
}

function updateTodoCount() {
  const activeTodos = todos.filter(todo => !todo.completed).length;
  todoCount.textContent = `${activeTodos} 件の未完了タスク`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Event handlers
function handleAddTodo() {
  const text = todoInput.value.trim();
  if (text) {
    addTodo(text);
    todoInput.value = '';
    todoInput.focus();
  }
}

function handleToggle(id, completed) {
  toggleTodo(id, completed);
}

function handleDelete(id) {
  if (confirm('このタスクを削除しますか？')) {
    deleteTodo(id);
  }
}

function handleFilterChange(filter) {
  currentFilter = filter;
  
  filterButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
  
  renderTodos();
}

// Event listeners
addButton.addEventListener('click', handleAddTodo);

todoInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    handleAddTodo();
  }
});

filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    handleFilterChange(btn.dataset.filter);
  });
});

// Initialize
fetchTodos();