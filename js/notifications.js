// Browser Notification System

let notificationPermission = Notification.permission;
let notificationCheckInterval = null;

// Request notification permission
async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.warn('This browser does not support notifications');
        return false;
    }
    
    if (notificationPermission === 'default') {
        notificationPermission = await Notification.requestPermission();
    }
    
    return notificationPermission === 'granted';
}

// Show browser notification
function showBrowserNotification(title, options) {
    if (notificationPermission !== 'granted') {
        return null;
    }
    
    const notification = new Notification(title, {
        icon: '/favicon.ico', // You can add a favicon later
        badge: '/favicon.ico',
        ...options
    });
    
    // Handle notification click
    notification.onclick = function(event) {
        event.preventDefault();
        window.focus();
        
        // Navigate to case if caseId is provided
        if (options.data && options.data.caseId) {
            window.location.href = `case-detail.html?id=${options.data.caseId}`;
        }
        
        notification.close();
    };
    
    // Auto close after 5 seconds
    setTimeout(() => {
        notification.close();
    }, 5000);
    
    return notification;
}

// Notify about upcoming hearing
function notifyUpcomingHearing(caseData, daysUntil) {
    const caseTitle = caseData.caseTitle || caseData.caseNumber;
    const hearingDate = formatDate(caseData.nextHearingDate);
    const time = caseData.nextHearingTime ? ` at ${formatTime(caseData.nextHearingTime)}` : '';
    
    let title = '';
    let body = '';
    
    if (daysUntil === 0) {
        title = 'Hearing Today!';
        body = `Case: ${caseTitle}\nHearing: ${hearingDate}${time}`;
    } else if (daysUntil === 1) {
        title = 'Hearing Tomorrow!';
        body = `Case: ${caseTitle}\nHearing: ${hearingDate}${time}`;
    } else {
        title = `Hearing in ${daysUntil} days`;
        body = `Case: ${caseTitle}\nHearing: ${hearingDate}${time}`;
    }
    
    showBrowserNotification(title, {
        body: body,
        tag: `hearing-${caseData.id}-${daysUntil}`, // Prevent duplicate notifications
        requireInteraction: daysUntil <= 1, // Keep notification visible if urgent
        data: {
            caseId: caseData.id,
            type: 'hearing_reminder'
        }
    });
}

// Start notification checking interval
function startNotificationCheck() {
    // Request permission first
    requestNotificationPermission();
    
    // Check immediately
    checkAndNotifyUpcomingHearings();
    
    // Then check every hour (or based on settings)
    const settings = getNotificationSettings();
    const interval = settings.checkInterval || 3600000; // Default 1 hour
    
    if (notificationCheckInterval) {
        clearInterval(notificationCheckInterval);
    }
    
    notificationCheckInterval = setInterval(() => {
        checkAndNotifyUpcomingHearings();
    }, interval);
}

// Stop notification checking
function stopNotificationCheck() {
    if (notificationCheckInterval) {
        clearInterval(notificationCheckInterval);
        notificationCheckInterval = null;
    }
}

// Check for upcoming hearings and notify
function checkAndNotifyUpcomingHearings() {
    if (notificationPermission !== 'granted') {
        return;
    }
    
    const settings = getNotificationSettings();
    if (!settings.enabled) {
        return;
    }
    
    const cases = getCases();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const alertDays = settings.alertDays || [7, 3, 1];
    const notifiedCases = JSON.parse(localStorage.getItem('legal_manager_notified_cases') || '{}');
    
    cases.forEach(caseData => {
        if (!caseData.nextHearingDate || caseData.status === 'closed') {
            return;
        }
        
        const hearingDate = new Date(caseData.nextHearingDate);
        hearingDate.setHours(0, 0, 0, 0);
        
        if (hearingDate < today) {
            return; // Past hearing
        }
        
        const daysUntilHearing = daysUntil(caseData.nextHearingDate);
        
        if (alertDays.includes(daysUntilHearing)) {
            const notificationKey = `${caseData.id}-${daysUntilHearing}`;
            
            // Check if we already notified for this case and day
            const lastNotification = notifiedCases[notificationKey];
            const now = Date.now();
            
            // Only notify if we haven't notified in the last 12 hours
            if (!lastNotification || (now - lastNotification) > 43200000) {
                notifyUpcomingHearing(caseData, daysUntilHearing);
                notifiedCases[notificationKey] = now;
            }
        }
    });
    
    // Save notified cases
    localStorage.setItem('legal_manager_notified_cases', JSON.stringify(notifiedCases));
}

// Clear old notification records (older than 7 days)
function clearOldNotificationRecords() {
    const notifiedCases = JSON.parse(localStorage.getItem('legal_manager_notified_cases') || '{}');
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    Object.keys(notifiedCases).forEach(key => {
        if (notifiedCases[key] < sevenDaysAgo) {
            delete notifiedCases[key];
        }
    });
    
    localStorage.setItem('legal_manager_notified_cases', JSON.stringify(notifiedCases));
}

// Initialize notifications on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNotifications);
} else {
    initNotifications();
}

function initNotifications() {
    // Only initialize on dashboard page
    if (window.location.pathname.includes('dashboard') || 
        window.location.pathname.includes('case-detail')) {
        startNotificationCheck();
        clearOldNotificationRecords();
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    // Keep notifications running in background
    // Don't stop the interval
});

