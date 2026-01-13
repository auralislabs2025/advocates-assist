// Utility Functions

// Generate UUID for case IDs
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Format date to Indian format (DD/MM/YYYY)
function formatDate(date) {
    if (!date) return '';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

// Format date with time
function formatDateTime(date, time) {
    const dateStr = formatDate(date);
    if (!time) return dateStr;
    return `${dateStr} at ${formatTime(time)}`;
}

// Format time (HH:MM)
function formatTime(time) {
    if (!time) return '';
    return time.substring(0, 5); // HH:MM format
}

// Get date in YYYY-MM-DD format for input fields
function getInputDate(date) {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
}

// Calculate days until a date
function daysUntil(targetDate) {
    if (!targetDate) return null;
    
    const target = new Date(targetDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
}

// Format relative date (e.g., "in 3 days", "today", "2 days ago")
function formatRelativeDate(date) {
    const days = daysUntil(date);
    
    if (days === null) return '';
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days === -1) return 'Yesterday';
    if (days > 0) return `in ${days} days`;
    if (days < 0) return `${Math.abs(days)} days ago`;
    
    return formatDate(date);
}

// Get urgency level based on days until hearing
function getUrgencyLevel(date) {
    const days = daysUntil(date);
    
    if (days === null || days < 0) return 'past';
    if (days === 0) return 'urgent';
    if (days <= 3) return 'urgent';
    if (days <= 7) return 'soon';
    return 'normal';
}

// Debounce function for search input
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// Validate email format
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Validate form fields
function validateForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return false;
    
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            isValid = false;
            field.classList.add('error');
        } else {
            field.classList.remove('error');
        }
    });
    
    return isValid;
}

// Clear form
function clearForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    form.reset();
    const errorMessages = form.querySelectorAll('.error-message');
    errorMessages.forEach(msg => {
        msg.classList.remove('show');
        msg.textContent = '';
    });
}

// Show error message
function showError(elementId, message) {
    const errorEl = document.getElementById(elementId);
    if (!errorEl) return;
    
    errorEl.textContent = message;
    errorEl.classList.add('show');
}

// Hide error message
function hideError(elementId) {
    const errorEl = document.getElementById(elementId);
    if (!errorEl) return;
    
    errorEl.classList.remove('show');
    errorEl.textContent = '';
}

// Compare dates (returns -1, 0, or 1)
function compareDates(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    if (d1 < d2) return -1;
    if (d1 > d2) return 1;
    return 0;
}

// Sort cases by next hearing date
function sortCasesByHearingDate(cases, ascending = true) {
    return [...cases].sort((a, b) => {
        if (!a.nextHearingDate && !b.nextHearingDate) return 0;
        if (!a.nextHearingDate) return 1;
        if (!b.nextHearingDate) return -1;
        
        const comparison = compareDates(a.nextHearingDate, b.nextHearingDate);
        return ascending ? comparison : -comparison;
    });
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

