// Hearing Date Alert System

// Check cases for upcoming hearings and update UI alerts
function checkUpcomingHearings() {
    const cases = getCases();
    const activeCases = cases.filter(c => c.status !== 'closed' && c.nextHearingDate);
    
    const upcomingCases = [];
    const urgentCases = [];
    const soonCases = [];
    
    activeCases.forEach(caseData => {
        const days = daysUntil(caseData.nextHearingDate);
        
        if (days === null || days < 0) return;
        
        if (days <= 7) {
            upcomingCases.push({
                ...caseData,
                daysUntil: days
            });
            
            if (days <= 1) {
                urgentCases.push(caseData);
            } else if (days <= 3) {
                soonCases.push(caseData);
            }
        }
    });
    
    // Sort by hearing date
    upcomingCases.sort((a, b) => {
        return compareDates(a.nextHearingDate, b.nextHearingDate);
    });
    
    return {
        upcoming: upcomingCases.slice(0, 10), // Limit to 10 most urgent
        urgent: urgentCases,
        soon: soonCases,
        nearest: upcomingCases[0] || null
    };
}

// Update upcoming hearings panel
function updateUpcomingHearingsPanel() {
    const panel = document.getElementById('upcomingHearings');
    const nearestEl = document.getElementById('nearestHearing');
    
    if (!panel) return;
    
    const alerts = checkUpcomingHearings();
    
    // Update hearings list
    if (alerts.upcoming.length === 0) {
        panel.innerHTML = '<p class="no-data">No upcoming hearings</p>';
    } else {
        panel.innerHTML = alerts.upcoming.map(caseData => {
            const days = daysUntil(caseData.nextHearingDate);
            const urgencyClass = days <= 1 ? 'urgent' : days <= 3 ? 'soon' : '';
            
            return `
                <div class="hearing-item ${urgencyClass}" onclick="window.location.href='case-detail.html?id=${caseData.id}'">
                    <div class="hearing-date">${formatDate(caseData.nextHearingDate)}</div>
                    <div class="hearing-case">${escapeHtml(caseData.caseNumber)} - ${escapeHtml(caseData.caseTitle)}</div>
                    <div class="hearing-days">${days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days} days`}</div>
                </div>
            `;
        }).join('');
    }
    
    // Update nearest hearing
    if (nearestEl) {
        if (alerts.nearest) {
            const days = daysUntil(alerts.nearest.nextHearingDate);
            const countdownText = days === 0 ? 'Today' : 
                                days === 1 ? 'Tomorrow' : 
                                `${days} days`;
            
            nearestEl.innerHTML = `
                <div class="countdown">${countdownText}</div>
                <div class="countdown-label">Next Hearing: ${escapeHtml(alerts.nearest.caseNumber)}</div>
            `;
        } else {
            nearestEl.innerHTML = '';
        }
    }
    
    return alerts;
}

// Update alert banner
function updateAlertBanner() {
    const banner = document.getElementById('alertBanner');
    if (!banner) return;
    
    const alerts = checkUpcomingHearings();
    
    if (alerts.urgent.length > 0) {
        const count = alerts.urgent.length;
        banner.textContent = `⚠️ You have ${count} ${count === 1 ? 'hearing' : 'hearings'} today or tomorrow!`;
        banner.className = 'alert-banner';
        banner.classList.remove('hidden');
    } else if (alerts.soon.length > 0) {
        const count = alerts.soon.length;
        banner.textContent = `⚠️ You have ${count} ${count === 1 ? 'hearing' : 'hearings'} in the next 3 days`;
        banner.className = 'alert-banner warning';
        banner.classList.remove('hidden');
    } else {
        banner.classList.add('hidden');
    }
}

// Get urgency class for case card
function getCaseUrgencyClass(caseData) {
    if (!caseData.nextHearingDate || caseData.status === 'closed') {
        return '';
    }
    
    const days = daysUntil(caseData.nextHearingDate);
    
    if (days === null || days < 0) return '';
    if (days <= 1) return 'urgent';
    if (days <= 3) return 'soon';
    if (days <= 7) return 'warning';
    
    return '';
}

// Initialize alerts
function initAlerts() {
    // Only on dashboard
    if (window.location.pathname.includes('dashboard')) {
        updateUpcomingHearingsPanel();
        updateAlertBanner();
        
        // Update every minute
        setInterval(() => {
            updateUpcomingHearingsPanel();
            updateAlertBanner();
        }, 60000);
    }
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAlerts);
} else {
    initAlerts();
}

