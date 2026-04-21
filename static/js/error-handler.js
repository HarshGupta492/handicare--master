class ErrorHandler {
    constructor() {
        this.createErrorBox();
    }

    createErrorBox() {
        const errorBox = document.createElement('div');
        errorBox.className = 'error-box';
        errorBox.innerHTML = `
            <div class="error-icon">
                <i class="fas fa-exclamation-circle"></i>
            </div>
            <div class="error-content">
                <h4 class="error-title">Authentication Error</h4>
                <p class="error-message">Invalid username or password. Please try again.</p>
            </div>
            <button class="error-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        document.body.appendChild(errorBox);
        this.errorBox = errorBox;
        this.setupEventListeners();
    }

    setupEventListeners() {
        const closeBtn = this.errorBox.querySelector('.error-close');
        closeBtn.addEventListener('click', () => this.hideError());
    }

    showError(message = 'Invalid username or password. Please try again.') {
        const errorMessage = this.errorBox.querySelector('.error-message');
        errorMessage.textContent = message;
        
        this.errorBox.classList.add('show');
        this.errorBox.classList.add('shake');
        
        // Remove shake animation after it completes
        setTimeout(() => {
            this.errorBox.classList.remove('shake');
        }, 500);

        // Auto hide after 5 seconds
        setTimeout(() => {
            this.hideError();
        }, 5000);
    }

    hideError() {
        this.errorBox.classList.remove('show');
    }
}

// Create global error handler instance
window.errorHandler = new ErrorHandler();

// Example usage in login form:
/*
document.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        // Your login logic here
        const response = await login(username, password);
        if (!response.success) {
            window.errorHandler.showError(response.message || 'Invalid credentials');
        }
    } catch (error) {
        window.errorHandler.showError('An error occurred. Please try again.');
    }
});
*/ 