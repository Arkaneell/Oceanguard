// ============================================
// OCEANIC CONTACT FORM - JAVASCRIPT
// ============================================

class OceanicContactForm {
    constructor() {
        this.form = document.getElementById('contactForm');
        this.fields = {
            name: document.getElementById('name'),
            email: document.getElementById('email'),
            subject: document.getElementById('subject'),
            message: document.getElementById('message')
        };
        this.submitBtn = document.querySelector('.submit-btn');
        this.successMessage = document.getElementById('successMessage');
        this.charCount = document.getElementById('charCount');
        
        this.init();
    }

    init() {
        this.attachEventListeners();
        this.addInputAnimations();
    }

    // ============================================
    // EVENT LISTENERS
    // ============================================

    attachEventListeners() {
        // Form submission
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Field validations
        this.fields.name.addEventListener('blur', () => this.validateName());
        this.fields.email.addEventListener('blur', () => this.validateEmail());
        this.fields.subject.addEventListener('blur', () => this.validateSubject());
        this.fields.message.addEventListener('blur', () => this.validateMessage());
        this.fields.message.addEventListener('input', () => this.updateCharCount());

        // Real-time validation feedback
        this.fields.name.addEventListener('input', () => this.clearError('name'));
        this.fields.email.addEventListener('input', () => this.clearError('email'));
        this.fields.subject.addEventListener('input', () => this.clearError('subject'));
        this.fields.message.addEventListener('input', () => this.clearError('message'));
    }

    // ============================================
    // VALIDATION METHODS
    // ============================================

    validateName() {
        const name = this.fields.name.value.trim();
        const nameRegex = /^[a-zA-Z\s]{2,}$/;

        if (!name) {
            this.showError('name', 'Name is required');
            return false;
        }

        if (!nameRegex.test(name)) {
            this.showError('name', 'Please enter a valid name (letters and spaces only)');
            return false;
        }

        this.clearError('name');
        return true;
    }

    validateEmail() {
        const email = this.fields.email.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email) {
            this.showError('email', 'Email is required');
            return false;
        }

        if (!emailRegex.test(email)) {
            this.showError('email', 'Please enter a valid email address');
            return false;
        }

        this.clearError('email');
        return true;
    }

    validateSubject() {
        const subject = this.fields.subject.value.trim();

        if (!subject) {
            this.showError('subject', 'Subject is required');
            return false;
        }

        if (subject.length < 3) {
            this.showError('subject', 'Subject must be at least 3 characters long');
            return false;
        }

        if (subject.length > 100) {
            this.showError('subject', 'Subject must not exceed 100 characters');
            return false;
        }

        this.clearError('subject');
        return true;
    }

    validateMessage() {
        const message = this.fields.message.value.trim();

        if (!message) {
            this.showError('message', 'Message is required');
            return false;
        }

        if (message.length < 10) {
            this.showError('message', 'Message must be at least 10 characters long');
            return false;
        }

        if (message.length > 500) {
            this.showError('message', 'Message must not exceed 500 characters');
            return false;
        }

        this.clearError('message');
        return true;
    }

    validateAllFields() {
        return (
            this.validateName() &&
            this.validateEmail() &&
            this.validateSubject() &&
            this.validateMessage()
        );
    }

    // ============================================
    // ERROR HANDLING
    // ============================================

    showError(fieldName, message) {
        const errorElement = document.getElementById(`${fieldName}Error`);
        const field = this.fields[fieldName];

        errorElement.textContent = message;
        field.classList.add('error');
        this.animateErrorMessage(errorElement);
    }

    clearError(fieldName) {
        const errorElement = document.getElementById(`${fieldName}Error`);
        const field = this.fields[fieldName];

        errorElement.textContent = '';
        field.classList.remove('error');
    }

    animateErrorMessage(element) {
        element.style.animation = 'none';
        setTimeout(() => {
            element.style.animation = 'slideInDown 0.3s ease-out';
        }, 10);
    }

    // ============================================
    // CHARACTER COUNT
    // ============================================

    updateCharCount() {
        const count = this.fields.message.value.length;
        this.charCount.textContent = Math.min(count, 500);

        if (count > 500) {
            this.fields.message.value = this.fields.message.value.substring(0, 500);
            this.charCount.textContent = '500';
        }
    }

    // ============================================
    // FORM SUBMISSION
    // ============================================

    handleSubmit(e) {
        e.preventDefault();

        // Validate all fields
        if (!this.validateAllFields()) {
            this.shakeForm();
            return;
        }

        // Disable button and show loading state
        this.submitBtn.disabled = true;
        const originalText = this.submitBtn.querySelector('.btn-text').textContent;
        this.submitBtn.querySelector('.btn-text').textContent = 'Sending...';

        // Simulate form submission (replace with actual API call)
        setTimeout(() => {
            this.submitSuccess(originalText);
        }, 1500);
    }

    submitSuccess(originalText) {
        // Show success message
        this.successMessage.classList.add('show');

        // Re-enable button
        this.submitBtn.disabled = false;
        this.submitBtn.querySelector('.btn-text').textContent = originalText;

        // Reset form
        this.form.reset();
        this.charCount.textContent = '0';

        // Clear all error states
        Object.keys(this.fields).forEach(key => {
            this.clearError(key);
        });

        // Hide success message after 5 seconds
        setTimeout(() => {
            this.successMessage.classList.remove('show');
        }, 5000);

        // Scroll to success message
        this.successMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    shakeForm() {
        this.form.style.animation = 'none';
        setTimeout(() => {
            this.form.style.animation = 'shake 0.4s ease-in-out';
        }, 10);

        setTimeout(() => {
            this.form.style.animation = 'none';
        }, 400);
    }

    // ============================================
    // INPUT ANIMATIONS
    // ============================================

    addInputAnimations() {
        Object.values(this.fields).forEach((field) => {
            // Focus animation
            field.addEventListener('focus', () => {
                this.animateInputFocus(field);
            });

            // Blur animation
            field.addEventListener('blur', () => {
                this.animateInputBlur(field);
            });
        });
    }

    animateInputFocus(field) {
        const label = field.previousElementSibling;
        if (label && label.classList.contains('form-label')) {
            label.style.color = 'var(--ocean-light)';
        }
    }

    animateInputBlur(field) {
        const label = field.previousElementSibling;
        if (label && label.classList.contains('form-label')) {
            label.style.color = 'var(--ocean-dark)';
        }
    }
}

// ============================================
// INITIALIZE ON DOM LOAD
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    new OceanicContactForm();
    addPageAnimations();
});

// ============================================
// PAGE ANIMATIONS
// ============================================

function addPageAnimations() {
    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe form groups
    document.querySelectorAll('.form-group').forEach((group, index) => {
        group.style.opacity = '0';
        group.style.transform = 'translateY(20px)';
        group.style.transition = `all 0.6s ease-out ${index * 0.1}s`;
        observer.observe(group);
    });
}

// ============================================
// SHAKE ANIMATION (CSS-in-JS)
// ============================================

const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% {
            transform: translateX(0);
        }
        10%, 30%, 50%, 70%, 90% {
            transform: translateX(-10px);
        }
        20%, 40%, 60%, 80% {
            transform: translateX(10px);
        }
    }
`;
document.head.appendChild(style);

// ============================================
// UTILITY: SMOOTH SCROLL FOR ANCHOR LINKS
// ============================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#') {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });
});

// ============================================
// OPTIONAL: API SUBMISSION EXAMPLE
// ============================================

/*
// Replace the setTimeout in submitSuccess() with actual API call:
async submitForm(formData) {
    try {
        const response = await fetch('https://your-api.com/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: formData.name,
                email: formData.email,
                subject: formData.subject,
                message: formData.message
            })
        });

        if (!response.ok) {
            throw new Error('Failed to send message');
        }

        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}
*/