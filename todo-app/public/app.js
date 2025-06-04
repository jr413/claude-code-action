const API_URL = '/api/todos';
let todos = [];
let currentFilter = 'all';

const todoInput = document.getElementById('todoInput');
const addButton = document.getElementById('addButton');
const todoList = document.getElementById('todoList');
const activeCount = document.getElementById('activeCount');
const filterButtons = document.querySelectorAll('.filter-btn');

async function fetchTodos() {
  try {
    const response = await fetch(API_URL);
    todos = await response.json();
    renderTodos();
  } catch (error) {
    console.error('Todoの取得に失敗しました:', error);
  }
}

async function addTodo() {
  const text = todoInput.value.trim();
  if (!text) return;
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    
    if (response.ok) {
      const newTodo = await response.json();
      todos.push(newTodo);
      todoInput.value = '';
      renderTodos();
    }
  } catch (error) {
    console.error('Todoの追加に失敗しました:', error);
  }
}

async function toggleTodo(id) {
  const todo = todos.find(t => t.id === id);
  if (!todo) return;
  
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !todo.completed })
    });
    
    if (response.ok) {
      todo.completed = !todo.completed;
      renderTodos();
    }
  } catch (error) {
    console.error('Todoの更新に失敗しました:', error);
  }
}

async function deleteTodo(id) {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      todos = todos.filter(t => t.id !== id);
      renderTodos();
    }
  } catch (error) {
    console.error('Todoの削除に失敗しました:', error);
  }
}

function renderTodos() {
  const filteredTodos = todos.filter(todo => {
    if (currentFilter === 'active') return !todo.completed;
    if (currentFilter === 'completed') return todo.completed;
    return true;
  });
  
  todoList.innerHTML = filteredTodos.map(todo => `
    <li class="todo-item ${todo.completed ? 'completed' : ''}">
      <input 
        type="checkbox" 
        class="todo-checkbox" 
        ${todo.completed ? 'checked' : ''}
        onchange="toggleTodo(${todo.id})"
      />
      <span class="todo-text" onclick="toggleTodo(${todo.id})">${escapeHtml(todo.text)}</span>
      <button class="delete-btn" onclick="deleteTodo(${todo.id})">削除</button>
    </li>
  `).join('');
  
  updateActiveCount();
}

function updateActiveCount() {
  const count = todos.filter(todo => !todo.completed).length;
  activeCount.textContent = count;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

addButton.addEventListener('click', addTodo);
todoInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addTodo();
});

filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    filterButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderTodos();
  });
});

fetchTodos();