class TodoApp {
    constructor() {
        this.todos = [];
        this.currentFilter = 'all';
        this.searchTerm = '';
        this.debounceTimer = null;
        
        // DOM elements
        this.todoInput = document.getElementById('todoInput');
        this.addBtn = document.getElementById('addBtn');
        this.searchInput = document.getElementById('searchInput');
        this.todoList = document.getElementById('todoList');
        this.todoStats = document.getElementById('todoStats');
        this.filterBtns = document.querySelectorAll('.filter-btn');
        
        this.initializeEventListeners();
        this.loadTodos();
        this.renderTodos();
    }
    
    initializeEventListeners() {
        // Add todo
        this.addBtn.addEventListener('click', () => this.addTodo());
        this.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });
        
        // Input validation
        this.todoInput.addEventListener('input', () => this.validateInput());
        
        // Debounced search
        this.searchInput.addEventListener('input', () => this.debouncedSearch());
        
        // Filter buttons
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter));
        });
        
        // Event delegation for todo interactions
        this.todoList.addEventListener('click', (e) => this.handleTodoInteraction(e));
        
        // Prevent form submission on Enter in search
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') e.preventDefault();
        });
    }
    
    validateInput() {
        const value = this.todoInput.value.trim();
        this.addBtn.disabled = value.length === 0;
    }
    
    debouncedSearch() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        
        this.debounceTimer = setTimeout(() => {
            this.searchTerm = this.searchInput.value.trim().toLowerCase();
            this.renderTodos();
        }, 400);
    }
    
    addTodo() {
        const text = this.todoInput.value.trim();
        
        if (!text) {
            this.showNotification('Please enter a todo item', 'error');
            return;
        }
        
        if (text.length > 200) {
            this.showNotification('Todo text is too long (max 200 characters)', 'error');
            return;
        }
        
        const todo = {
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        this.todos.unshift(todo); // Add to beginning of array
        this.saveTodos();
        this.renderTodos();
        this.clearInput();
        this.showNotification('Todo added successfully!', 'success');
    }
    
    deleteTodo(id) {
        const todoIndex = this.todos.findIndex(todo => todo.id === parseInt(id));
        if (todoIndex === -1) return;
        
        const todo = this.todos[todoIndex];
        this.todos.splice(todoIndex, 1);
        this.saveTodos();
        this.renderTodos();
        this.showNotification(`Deleted: "${todo.text}"`, 'info');
    }
    
    toggleTodo(id) {
        const todo = this.todos.find(todo => todo.id === parseInt(id));
        if (!todo) return;
        
        todo.completed = !todo.completed;
        this.saveTodos();
        this.renderTodos();
        
        const status = todo.completed ? 'completed' : 'active';
        this.showNotification(`Todo marked as ${status}`, 'success');
    }
    
    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active filter button
        this.filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        this.renderTodos();
    }
    
    handleTodoInteraction(e) {
        const todoItem = e.target.closest('.todo-item');
        if (!todoItem) return;
        
        const todoId = todoItem.dataset.todoId;
        
        if (e.target.classList.contains('delete-btn')) {
            this.deleteTodo(todoId);
        } else if (e.target.classList.contains('todo-checkbox') || e.target.classList.contains('todo-text')) {
            this.toggleTodo(todoId);
        }
    }
    
    getFilteredTodos() {
        let filtered = this.todos;
        
        // Apply search filter
        if (this.searchTerm) {
            filtered = filtered.filter(todo => 
                todo.text.toLowerCase().includes(this.searchTerm)
            );
        }
        
        // Apply status filter
        switch (this.currentFilter) {
            case 'active':
                filtered = filtered.filter(todo => !todo.completed);
                break;
            case 'completed':
                filtered = filtered.filter(todo => todo.completed);
                break;
            // 'all' shows everything
        }
        
        return filtered;
    }
    
    renderTodos() {
        const filteredTodos = this.getFilteredTodos();
        
        // Update stats
        this.updateStats();
        
        // Clear todo list
        this.todoList.innerHTML = '';
        
        // Handle empty states
        if (this.todos.length === 0) {
            this.showEmptyState('no-todos');
            return;
        }
        
        if (filteredTodos.length === 0) {
            if (this.searchTerm) {
                this.showEmptyState('no-search-results');
            } else {
                this.showEmptyState('no-filter-results');
            }
            return;
        }
        
        // Render todos
        filteredTodos.forEach(todo => this.renderTodoItem(todo));
    }
    
    renderTodoItem(todo) {
        const todoElement = document.createElement('div');
        todoElement.className = 'todo-item';
        todoElement.dataset.todoId = todo.id;
        
        todoElement.innerHTML = `
            <div class="todo-checkbox ${todo.completed ? 'checked' : ''}""></div>
            <span class="todo-text ${todo.completed ? 'completed' : ''}">${this.escapeHtml(todo.text)}</span>
            <span class="todo-date">${this.formatDate(todo.createdAt)}</span>
            <button class="delete-btn">Delete</button>
        `;
        
        this.todoList.appendChild(todoElement);
    }
    
    showEmptyState(type) {
        const emptyState = document.createElement('div');
        emptyState.className = `empty-state ${type}`;
        
        let content = '';
        switch (type) {
            case 'no-todos':
                content = `
                    <h3>📝 No todos yet!</h3>
                    <p>Add your first todo above to get started.</p>
                `;
                break;
            case 'no-search-results':
                content = `
                    <h3>🔍 No search results</h3>
                    <p>No todos match "${this.escapeHtml(this.searchTerm)}". Try a different search term.</p>
                `;
                break;
            case 'no-filter-results':
                content = `
                    <h3>📋 No ${this.currentFilter} todos</h3>
                    <p>No todos match the current filter. Try switching filters above.</p>
                `;
                break;
        }
        
        emptyState.innerHTML = content;
        this.todoList.appendChild(emptyState);
    }
    
    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(todo => todo.completed).length;
        this.todoStats.textContent = `📝 Todo List (${total} total, ${completed} completed)`;
    }
    
    clearInput() {
        this.todoInput.value = '';
        this.validateInput();
        this.todoInput.focus();
    }
    
    saveTodos() {
        try {
            localStorage.setItem('todos', JSON.stringify(this.todos));
        } catch (error) {
            console.error('Error saving todos to localStorage:', error);
            this.showNotification('Failed to save todos. Please try again.', 'error');
        }
    }
    
    loadTodos() {
        try {
            const savedTodos = localStorage.getItem('todos');
            if (savedTodos) {
                this.todos = JSON.parse(savedTodos);
                
                // Validate and clean up invalid todos
                this.todos = this.todos.filter(todo => {
                    return todo && 
                           typeof todo.id === 'number' && 
                           typeof todo.text === 'string' && 
                           typeof todo.completed === 'boolean' &&
                           todo.createdAt;
                });
                
                // Sort by creation date (newest first)
                this.todos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            }
        } catch (error) {
            console.error('Error loading todos from localStorage:', error);
            this.todos = [];
            this.showNotification('Failed to load saved todos.', 'error');
        }
    }
    
    formatDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInMs = now - date;
        const diffInHours = diffInMs / (1000 * 60 * 60);
        const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
        
        if (diffInHours < 1) {
            const minutes = Math.floor(diffInMs / (1000 * 60));
            return minutes <= 1 ? 'Just now' : `${minutes}m ago`;
        } else if (diffInHours < 24) {
            return `${Math.floor(diffInHours)}h ago`;
        } else if (diffInDays < 7) {
            return `${Math.floor(diffInDays)}d ago`;
        } else {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
            });
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            zIndex: '1000',
            transform: 'translateX(400px)',
            transition: 'transform 0.3s ease',
            maxWidth: '300px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        });
        
        // Set background color based on type
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            info: '#17a2b8'
        };
        notification.style.background = colors[type] || colors.info;
        
        // Add to DOM
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Remove after delay
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize the todo app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});