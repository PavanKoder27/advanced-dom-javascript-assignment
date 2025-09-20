class ContactForm {
    constructor() {
        this.form = document.getElementById('contactForm');
        this.nameField = document.getElementById('name');
        this.emailField = document.getElementById('email');
        this.messageField = document.getElementById('message');
        this.submitBtn = document.getElementById('submitBtn');
        this.successMessage = document.getElementById('successMessage');
        this.messageHistory = document.getElementById('messageHistory');
        this.historyTitle = document.getElementById('historyTitle');
        
        this.debounceTimers = {};
        this.validationState = {
            name: false,
            email: false,
            message: false
        };
        
        this.initializeEventListeners();
        this.loadMessageHistory();
    }
    
    initializeEventListeners() {
        // Form submission
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Real-time validation with debouncing
        this.nameField.addEventListener('input', () => this.debouncedValidate('name', 300));
        this.emailField.addEventListener('input', () => this.debouncedValidate('email', 300));
        this.messageField.addEventListener('input', () => this.debouncedValidate('message', 300));
        
        // Event delegation for delete buttons
        this.messageHistory.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-btn')) {
                const messageId = e.target.dataset.messageId;
                this.deleteMessage(messageId);
            }
        });
    }
    
    debouncedValidate(fieldName, delay) {
        // Clear existing timer for this field
        if (this.debounceTimers[fieldName]) {
            clearTimeout(this.debounceTimers[fieldName]);
        }
        
        // Set new timer
        this.debounceTimers[fieldName] = setTimeout(() => {
            this.validateField(fieldName);
            this.updateSubmitButton();
        }, delay);
    }
    
    validateField(fieldName) {
        const field = document.getElementById(fieldName);
        const errorElement = document.getElementById(`${fieldName}Error`);
        let isValid = false;
        let errorMessage = '';
        
        switch (fieldName) {
            case 'name':
                const name = field.value.trim();
                if (!name) {
                    errorMessage = 'Name is required';
                } else if (name.length < 2) {
                    errorMessage = 'Name must be at least 2 characters long';
                } else {
                    isValid = true;
                }
                break;
                
            case 'email':
                const email = field.value.trim();
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!email) {
                    errorMessage = 'Email is required';
                } else if (!emailRegex.test(email)) {
                    errorMessage = 'Please enter a valid email address';
                } else {
                    isValid = true;
                }
                break;
                
            case 'message':
                const message = field.value.trim();
                if (!message) {
                    errorMessage = 'Message is required';
                } else if (message.length < 10) {
                    errorMessage = 'Message must be at least 10 characters long';
                } else {
                    isValid = true;
                }
                break;
        }
        
        // Update validation state
        this.validationState[fieldName] = isValid;
        
        // Update UI
        if (isValid) {
            field.classList.remove('invalid');
            field.classList.add('valid');
            errorElement.textContent = '';
            errorElement.classList.remove('show');
        } else {
            field.classList.remove('valid');
            field.classList.add('invalid');
            errorElement.textContent = errorMessage;
            errorElement.classList.add('show');
        }
    }
    
    updateSubmitButton() {
        const allValid = Object.values(this.validationState).every(state => state);
        this.submitBtn.disabled = !allValid;
    }
    
    handleSubmit(e) {
        e.preventDefault();
        
        // Validate all fields
        this.validateField('name');
        this.validateField('email');
        this.validateField('message');
        
        // Check if all fields are valid
        if (!Object.values(this.validationState).every(state => state)) {
            return;
        }
        
        // Create message object
        const message = {
            id: Date.now(),
            name: this.nameField.value.trim(),
            email: this.emailField.value.trim(),
            message: this.messageField.value.trim(),
            timestamp: new Date().toISOString()
        };
        
        // Save to localStorage
        this.saveMessage(message);
        
        // Show success message
        this.showSuccessMessage();
        
        // Reset form
        this.resetForm();
        
        // Reload message history
        this.loadMessageHistory();
    }
    
    saveMessage(message) {
        try {
            let messages = this.getMessagesFromStorage();
            messages.unshift(message); // Add to beginning of array
            localStorage.setItem('contactMessages', JSON.stringify(messages));
        } catch (error) {
            console.error('Error saving message to localStorage:', error);
            alert('Failed to save message. Please try again.');
        }
    }
    
    getMessagesFromStorage() {
        try {
            const messages = localStorage.getItem('contactMessages');
            return messages ? JSON.parse(messages) : [];
        } catch (error) {
            console.error('Error reading messages from localStorage:', error);
            return [];
        }
    }
    
    deleteMessage(messageId) {
        try {
            let messages = this.getMessagesFromStorage();
            messages = messages.filter(msg => msg.id.toString() !== messageId);
            localStorage.setItem('contactMessages', JSON.stringify(messages));
            this.loadMessageHistory();
        } catch (error) {
            console.error('Error deleting message:', error);
            alert('Failed to delete message. Please try again.');
        }
    }
    
    loadMessageHistory() {
        const messages = this.getMessagesFromStorage();
        
        // Update history title
        this.historyTitle.textContent = `📋 Message History (${messages.length} messages)`;
        
        // Clear current history
        this.messageHistory.innerHTML = '';
        
        if (messages.length === 0) {
            this.showEmptyState();
        } else {
            messages.forEach(message => this.renderMessage(message));
        }
    }
    
    renderMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message-item';
        messageElement.innerHTML = `
            <div class="message-header">
                <div>
                    <span class="message-sender">From: ${this.escapeHtml(message.name)}</span>
                    <span class="message-email">(${this.escapeHtml(message.email)})</span>
                </div>
                <span class="message-date">${this.formatDate(message.timestamp)}</span>
            </div>
            <div class="message-text">${this.escapeHtml(message.message)}</div>
            <button class="delete-btn" data-message-id="${message.id}">Delete</button>
        `;
        
        this.messageHistory.appendChild(messageElement);
    }
    
    showEmptyState() {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.textContent = 'No messages yet. Send your first message above!';
        this.messageHistory.appendChild(emptyState);
    }
    
    showSuccessMessage() {
        this.successMessage.classList.remove('hidden');
        setTimeout(() => {
            this.successMessage.classList.add('hidden');
        }, 3000);
    }
    
    resetForm() {
        this.form.reset();
        
        // Reset validation states
        this.validationState = {
            name: false,
            email: false,
            message: false
        };
        
        // Reset field styles
        [this.nameField, this.emailField, this.messageField].forEach(field => {
            field.classList.remove('valid', 'invalid');
        });
        
        // Clear error messages
        ['nameError', 'emailError', 'messageError'].forEach(errorId => {
            const errorElement = document.getElementById(errorId);
            errorElement.textContent = '';
            errorElement.classList.remove('show');
        });
        
        // Disable submit button
        this.updateSubmitButton();
    }
    
    formatDate(timestamp) {
        const date = new Date(timestamp);
        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return date.toLocaleDateString('en-US', options);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the contact form when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ContactForm();
});