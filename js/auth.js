// Authentication System

// Check if user is logged in and redirect if not
function checkAuth() {
    const currentUser = getCurrentUser();
    const currentPage = window.location.pathname.split('/').pop();
    
    // Pages that don't require auth
    const publicPages = ['index.html', ''];
    
    if (!currentUser && !publicPages.includes(currentPage)) {
        window.location.href = 'index.html';
        return false;
    }
    
    // If user is logged in and on login page, redirect to dashboard
    if (currentUser && currentPage === 'index.html') {
        window.location.href = 'dashboard.html';
        return false;
    }
    
    return true;
}

// Login function
function login(username, password) {
    const users = getUsers();
    
    // Find user by username or email
    const user = users.find(u => 
        (u.username === username || u.email === username) && 
        u.password === password
    );
    
    if (user) {
        // Don't store password in current user session
        const { password: _, ...userWithoutPassword } = user;
        setCurrentUser(userWithoutPassword);
        return true;
    }
    
    return false;
}

// Register new user
function register(username, email, password) {
    // Validate inputs
    if (!username || username.length < 3) {
        return { success: false, error: 'Username must be at least 3 characters' };
    }
    
    if (!validateEmail(email)) {
        return { success: false, error: 'Invalid email format' };
    }
    
    if (!password || password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters' };
    }
    
    const users = getUsers();
    
    // Check if username already exists
    if (users.find(u => u.username === username)) {
        return { success: false, error: 'Username already exists' };
    }
    
    // Check if email already exists
    if (users.find(u => u.email === email)) {
        return { success: false, error: 'Email already exists' };
    }
    
    // Create new user
    const newUser = {
        id: generateUUID(),
        username: username,
        email: email,
        password: password, // In production, this should be hashed
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    
    if (saveUsers(users)) {
        // Auto-login after registration
        const { password: _, ...userWithoutPassword } = newUser;
        setCurrentUser(userWithoutPassword);
        return { success: true };
    }
    
    return { success: false, error: 'Failed to save user' };
}

// Logout function
function logout() {
    setCurrentUser(null);
    window.location.href = 'index.html';
}

// Initialize auth on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
} else {
    initAuth();
}

function initAuth() {
    // Handle login page
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const showRegisterLink = document.getElementById('showRegister');
    const showLoginLink = document.getElementById('showLogin');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginForm.classList.add('hidden');
            registerForm.classList.remove('hidden');
            hideError('loginError');
        });
    }
    
    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            registerForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
            hideError('registerError');
            hideError('registerSuccess');
        });
    }
    
    // Handle logout button (if exists in header - legacy support)
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                logout();
            }
        });
    }
    
    // Display current user info
    displayUserInfo();
    
    // Check authentication for protected pages
    if (window.location.pathname.includes('dashboard') || 
        window.location.pathname.includes('case-detail') ||
        window.location.pathname.includes('cases.html') ||
        window.location.pathname.includes('ai-chat.html')) {
        checkAuth();
    }
}

function handleLogin(e) {
    e.preventDefault();
    hideError('loginError');
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        showError('loginError', 'Please enter both username and password');
        return;
    }
    
    if (login(username, password)) {
        showToast('Login successful!', 'success');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 500);
    } else {
        showError('loginError', 'Invalid username or password');
    }
}

function handleRegister(e) {
    e.preventDefault();
    hideError('registerError');
    hideError('registerSuccess');
    
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    
    // Validate passwords match
    if (password !== confirmPassword) {
        showError('registerError', 'Passwords do not match');
        return;
    }
    
    const result = register(username, email, password);
    
    if (result.success) {
        const successMsg = document.getElementById('registerSuccess');
        successMsg.textContent = 'Registration successful! Redirecting...';
        successMsg.classList.add('show');
        
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
    } else {
        showError('registerError', result.error);
    }
}

function displayUserInfo() {
    const userInfoEl = document.getElementById('userInfo');
    if (userInfoEl) {
        const currentUser = getCurrentUser();
        if (currentUser) {
            // Show just username in sidebar
            userInfoEl.textContent = currentUser.username || currentUser.email || 'User';
        }
    }
}

