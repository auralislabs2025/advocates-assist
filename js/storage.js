// Storage Utilities - localStorage wrapper

const STORAGE_KEYS = {
    USERS: 'legal_manager_users',
    CURRENT_USER: 'legal_manager_current_user',
    CASES: 'legal_manager_cases',
    NOTIFICATION_SETTINGS: 'legal_manager_notification_settings'
};

// Initialize storage with default data if needed
function initializeStorage() {
    // Initialize users if not exists
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
        // Create default demo user
        const defaultUsers = [{
            id: generateUUID(),
            username: 'admin',
            email: 'admin@legalmanger.com',
            password: 'password123', // In production, this should be hashed
            createdAt: new Date().toISOString()
        }];
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
    }
    
    // Initialize cases if not exists
    if (!localStorage.getItem(STORAGE_KEYS.CASES)) {
        localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify([]));
    }
    
    // Initialize notification settings if not exists
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATION_SETTINGS)) {
        const defaultSettings = {
            enabled: true,
            checkInterval: 3600000, // 1 hour in milliseconds
            alertDays: [7, 3, 1] // Alert 7, 3, and 1 day before
        };
        localStorage.setItem(STORAGE_KEYS.NOTIFICATION_SETTINGS, JSON.stringify(defaultSettings));
    }
}

// Get all users
function getUsers() {
    try {
        const usersJson = localStorage.getItem(STORAGE_KEYS.USERS);
        return usersJson ? JSON.parse(usersJson) : [];
    } catch (error) {
        console.error('Error getting users:', error);
        return [];
    }
}

// Save users
function saveUsers(users) {
    try {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        return true;
    } catch (error) {
        console.error('Error saving users:', error);
        if (error.name === 'QuotaExceededError') {
            alert('Storage quota exceeded. Please delete some data.');
        }
        return false;
    }
}

// Get current user
function getCurrentUser() {
    try {
        const userJson = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
}

// Set current user
function setCurrentUser(user) {
    try {
        if (user) {
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
        } else {
            localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        }
        return true;
    } catch (error) {
        console.error('Error setting current user:', error);
        return false;
    }
}

// Get all cases for current user
function getCases() {
    try {
        const currentUser = getCurrentUser();
        if (!currentUser) return [];
        
        const casesJson = localStorage.getItem(STORAGE_KEYS.CASES);
        const allCases = casesJson ? JSON.parse(casesJson) : [];
        
        // Filter cases by user ID
        return allCases.filter(c => c.userId === currentUser.id);
    } catch (error) {
        console.error('Error getting cases:', error);
        return [];
    }
}

// Get case by ID
function getCaseById(caseId) {
    const cases = getCases();
    return cases.find(c => c.id === caseId) || null;
}

// Save cases
function saveCases(cases) {
    try {
        const currentUser = getCurrentUser();
        if (!currentUser) return false;
        
        // Get all cases from storage
        const casesJson = localStorage.getItem(STORAGE_KEYS.CASES);
        const allCases = casesJson ? JSON.parse(casesJson) : [];
        
        // Remove current user's cases
        const otherCases = allCases.filter(c => c.userId !== currentUser.id);
        
        // Add current user's cases with userId
        const userCases = cases.map(c => ({
            ...c,
            userId: currentUser.id
        }));
        
        // Save combined cases
        localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify([...otherCases, ...userCases]));
        return true;
    } catch (error) {
        console.error('Error saving cases:', error);
        if (error.name === 'QuotaExceededError') {
            alert('Storage quota exceeded. Please delete some cases.');
        }
        return false;
    }
}

// Add a new case
function addCase(caseData) {
    const cases = getCases();
    const newCase = {
        ...caseData,
        id: generateUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        history: caseData.history || []
    };
    
    cases.push(newCase);
    if (saveCases(cases)) {
        return newCase;
    }
    return null;
}

// Update a case
function updateCase(caseId, updates) {
    const cases = getCases();
    const index = cases.findIndex(c => c.id === caseId);
    
    if (index === -1) return null;
    
    cases[index] = {
        ...cases[index],
        ...updates,
        id: caseId,
        updatedAt: new Date().toISOString()
    };
    
    if (saveCases(cases)) {
        return cases[index];
    }
    return null;
}

// Delete a case
function deleteCase(caseId) {
    const cases = getCases();
    const filteredCases = cases.filter(c => c.id !== caseId);
    return saveCases(filteredCases);
}

// Add history entry to a case
function addCaseHistory(caseId, historyEntry) {
    const cases = getCases();
    const index = cases.findIndex(c => c.id === caseId);
    
    if (index === -1) return null;
    
    if (!cases[index].history) {
        cases[index].history = [];
    }
    
    const newEntry = {
        id: generateUUID(),
        ...historyEntry,
        date: new Date(historyEntry.date).toISOString(),
        hearingDate: historyEntry.hearingDate ? new Date(historyEntry.hearingDate).toISOString() : null,
        hearingTime: historyEntry.hearingTime || null,
        outcome: historyEntry.outcome || null,
        nextHearingDate: historyEntry.nextHearingDate ? new Date(historyEntry.nextHearingDate).toISOString() : null,
        nextHearingTime: historyEntry.nextHearingTime || null,
        files: historyEntry.files || []
    };
    
    cases[index].history.push(newEntry);
    
    // Update case status if provided
    if (historyEntry.status) {
        cases[index].status = historyEntry.status;
    }
    
    // Update next hearing date if provided in history entry
    if (historyEntry.nextHearingDate) {
        cases[index].nextHearingDate = new Date(historyEntry.nextHearingDate).toISOString();
        cases[index].nextHearingTime = historyEntry.nextHearingTime || cases[index].nextHearingTime;
    }
    
    cases[index].updatedAt = new Date().toISOString();
    
    if (saveCases(cases)) {
        return cases[index];
    }
    return null;
}

// Mark hearing as completed and add to history
function completeHearing(caseId, hearingData) {
    const cases = getCases();
    const index = cases.findIndex(c => c.id === caseId);
    
    if (index === -1) return null;
    
    const caseData = cases[index];
    
    if (!caseData.nextHearingDate) {
        return null; // No hearing to complete
    }
    
    // Create history entry for completed hearing
    const historyEntry = {
        event: 'Hearing',
        date: new Date(caseData.nextHearingDate).toISOString(),
        hearingDate: caseData.nextHearingDate,
        hearingTime: caseData.nextHearingTime || null,
        description: hearingData.description || 'Hearing completed',
        outcome: hearingData.outcome || null,
        status: hearingData.status || caseData.status,
        nextHearingDate: hearingData.nextHearingDate || null,
        nextHearingTime: hearingData.nextHearingTime || null,
        files: hearingData.files || []
    };
    
    // Add to history
    if (!caseData.history) {
        caseData.history = [];
    }
    historyEntry.id = generateUUID();
    caseData.history.push(historyEntry);
    
    // Update case with new next hearing date (if provided)
    if (hearingData.nextHearingDate) {
        caseData.nextHearingDate = new Date(hearingData.nextHearingDate).toISOString();
        caseData.nextHearingTime = hearingData.nextHearingTime || null;
    } else {
        caseData.nextHearingDate = null;
        caseData.nextHearingTime = null;
    }
    
    // Update status if provided
    if (hearingData.status) {
        caseData.status = hearingData.status;
    }
    
    caseData.updatedAt = new Date().toISOString();
    
    if (saveCases(cases)) {
        return caseData;
    }
    return null;
}

// Get all hearings for a case (from history and current)
function getAllHearings(caseId) {
    const caseData = getCaseById(caseId);
    if (!caseData) return [];
    
    const hearings = [];
    
    // Get hearings from history
    if (caseData.history) {
        caseData.history.forEach(entry => {
            if (entry.event === 'Hearing' && entry.hearingDate) {
                hearings.push({
                    ...entry,
                    isPast: new Date(entry.hearingDate) < new Date(),
                    isCompleted: true
                });
            }
        });
    }
    
    // Add current/upcoming hearing if exists
    if (caseData.nextHearingDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const hearingDate = new Date(caseData.nextHearingDate);
        hearingDate.setHours(0, 0, 0, 0);
        
        hearings.push({
            id: 'current',
            event: 'Hearing',
            date: caseData.nextHearingDate,
            hearingDate: caseData.nextHearingDate,
            hearingTime: caseData.nextHearingTime,
            description: 'Upcoming hearing',
            isPast: hearingDate < today,
            isCompleted: false,
            isCurrent: true
        });
    }
    
    // Sort by date (oldest to newest for timeline)
    hearings.sort((a, b) => compareDates(a.hearingDate, b.hearingDate));
    
    return hearings;
}

// Get notification settings
function getNotificationSettings() {
    try {
        const settingsJson = localStorage.getItem(STORAGE_KEYS.NOTIFICATION_SETTINGS);
        return settingsJson ? JSON.parse(settingsJson) : {
            enabled: true,
            checkInterval: 3600000,
            alertDays: [7, 3, 1]
        };
    } catch (error) {
        console.error('Error getting notification settings:', error);
        return {
            enabled: true,
            checkInterval: 3600000,
            alertDays: [7, 3, 1]
        };
    }
}

// Save notification settings
function saveNotificationSettings(settings) {
    try {
        localStorage.setItem(STORAGE_KEYS.NOTIFICATION_SETTINGS, JSON.stringify(settings));
        return true;
    } catch (error) {
        console.error('Error saving notification settings:', error);
        return false;
    }
}

// Export data to JSON (for backup)
function exportData() {
    const currentUser = getCurrentUser();
    const cases = getCases();
    
    const exportData = {
        user: currentUser,
        cases: cases,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `legal_manager_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

// Import data from JSON (for restore)
function importData(jsonData) {
    try {
        const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
        const currentUser = getCurrentUser();
        
        if (data.cases && Array.isArray(data.cases)) {
            // Filter to only import cases for current user
            const userCases = data.cases.filter(c => c.userId === currentUser?.id || !c.userId);
            if (saveCases(userCases)) {
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error('Error importing data:', error);
        return false;
    }
}

// Initialize storage on load
initializeStorage();

