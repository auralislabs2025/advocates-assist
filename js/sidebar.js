// Sidebar functionality
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarClose = document.getElementById('sidebarClose');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    // Toggle sidebar (works on all screen sizes)
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            if (window.innerWidth <= 1024) {
                // On mobile/tablet, toggle overlay sidebar
                sidebar.classList.toggle('open');
                if (sidebarOverlay) {
                    sidebarOverlay.classList.toggle('show');
                }
            } else {
                // On desktop, toggle collapsed state
                const isCollapsed = sidebar.classList.toggle('collapsed');
                document.body.classList.toggle('sidebar-collapsed', isCollapsed);
                // Save preference
                localStorage.setItem('sidebarCollapsed', isCollapsed);
            }
        });
    }
    
    // Close/collapse sidebar (works on all screen sizes)
    if (sidebarClose) {
        sidebarClose.addEventListener('click', function() {
            // On mobile/tablet, close the overlay sidebar
            if (window.innerWidth <= 1024) {
                sidebar.classList.remove('open');
                if (sidebarOverlay) {
                    sidebarOverlay.classList.remove('show');
                }
            } else {
                // On desktop, collapse the sidebar
                sidebar.classList.add('collapsed');
                document.body.classList.add('sidebar-collapsed');
                // Save preference
                localStorage.setItem('sidebarCollapsed', 'true');
            }
        });
    }
    
    // Restore sidebar state on load
    if (sidebar && window.innerWidth > 1024) {
        const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (isCollapsed) {
            sidebar.classList.add('collapsed');
            document.body.classList.add('sidebar-collapsed');
        }
    }
    
    // Handle window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth <= 1024) {
            // On mobile/tablet, remove collapsed state
            sidebar.classList.remove('collapsed');
            document.body.classList.remove('sidebar-collapsed');
        } else {
            // On desktop, restore collapsed state if it was saved
            const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
            if (isCollapsed) {
                sidebar.classList.add('collapsed');
                document.body.classList.add('sidebar-collapsed');
            }
        }
    });
    
    // Close sidebar when overlay is clicked
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', function() {
            sidebar.classList.remove('open');
            sidebarOverlay.classList.remove('show');
        });
    }
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(event) {
        if (window.innerWidth <= 1024) {
            if (sidebar && sidebar.classList.contains('open')) {
                if (!sidebar.contains(event.target) && !menuToggle.contains(event.target)) {
                    sidebar.classList.remove('open');
                    if (sidebarOverlay) {
                        sidebarOverlay.classList.remove('show');
                    }
                }
            }
        }
    });
    
    // Update user info in mobile sidebar
    const userInfoMobile = document.getElementById('userInfoMobile');
    if (userInfoMobile) {
        const currentUser = getCurrentUser();
        if (currentUser) {
            userInfoMobile.textContent = currentUser.username || currentUser.email || 'User';
        }
    }
    
    // Profile dropdown
    const profileBtn = document.getElementById('profileBtn');
    const profileDropdown = document.getElementById('profileDropdown');
    const logoutBtnDropdown = document.getElementById('logoutBtnDropdown');
    
    if (profileBtn && profileDropdown) {
        profileBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            profileDropdown.parentElement.classList.toggle('active');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!profileBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
                profileDropdown.parentElement.classList.remove('active');
            }
        });
    }
    
    if (logoutBtnDropdown) {
        logoutBtnDropdown.addEventListener('click', function() {
            if (confirm('Are you sure you want to logout?')) {
                if (typeof logout === 'function') {
                    logout();
                } else if (typeof window.logout === 'function') {
                    window.logout();
                }
            }
        });
    }
    
    // Settings link (placeholder)
    const settingsLink = document.getElementById('settingsLink');
    if (settingsLink) {
        settingsLink.addEventListener('click', function(e) {
            e.preventDefault();
            alert('Settings feature coming soon!');
        });
    }
    
    // Notifications dropdown
    const notificationsBtn = document.getElementById('notificationsBtn');
    const notificationsDropdown = document.getElementById('notificationsDropdown');
    
    if (notificationsBtn && notificationsDropdown) {
        notificationsBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            notificationsDropdown.classList.toggle('active');
            // Close profile dropdown if open
            if (profileDropdown) {
                profileDropdown.parentElement.classList.remove('active');
            }
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!notificationsBtn.contains(e.target) && !notificationsDropdown.contains(e.target)) {
                notificationsDropdown.classList.remove('active');
            }
        });
    }
    
    // Update notifications badge and list
    updateNotificationBadge();
    updateNotificationsList();
    
    // Update notifications periodically
    setInterval(() => {
        updateNotificationBadge();
        updateNotificationsList();
    }, 60000);
});

function updateNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    if (!badge) return;
    
    // Count upcoming hearings
    const cases = getCases();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcomingCount = cases.filter(c => {
        if (!c.nextHearingDate || c.status === 'closed') return false;
        const hearingDate = new Date(c.nextHearingDate);
        hearingDate.setHours(0, 0, 0, 0);
        const diffTime = hearingDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 7;
    }).length;
    
    badge.textContent = upcomingCount;
    badge.style.display = upcomingCount > 0 ? 'block' : 'none';
}

function updateNotificationsList() {
    const notificationsList = document.getElementById('notificationsList');
    if (!notificationsList) return;
    
    const cases = getCases();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const notifications = [];
    
    cases.forEach(c => {
        if (!c.nextHearingDate || c.status === 'closed') return;
        const hearingDate = new Date(c.nextHearingDate);
        hearingDate.setHours(0, 0, 0, 0);
        const diffTime = hearingDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays >= 0 && diffDays <= 7) {
            let urgency = 'normal';
            if (diffDays <= 1) urgency = 'urgent';
            else if (diffDays <= 3) urgency = 'soon';
            
            notifications.push({
                case: c,
                days: diffDays,
                urgency: urgency
            });
        }
    });
    
    notifications.sort((a, b) => a.days - b.days);
    
    if (notifications.length === 0) {
        notificationsList.innerHTML = '<p class="no-data">No notifications</p>';
        return;
    }
    
    notificationsList.innerHTML = notifications.map(notif => {
        const daysText = notif.days === 0 ? 'Today' : 
                        notif.days === 1 ? 'Tomorrow' : 
                        `${notif.days} days`;
        
        return `
            <div class="notification-item ${notif.urgency}" onclick="window.location.href='case-detail.html?id=${notif.case.id}'">
                <div class="notification-title">Upcoming Hearing: ${escapeHtml(notif.case.caseNumber)}</div>
                <div class="notification-text">${escapeHtml(notif.case.caseTitle)}</div>
                <div class="notification-time">${daysText}</div>
            </div>
        `;
    }).join('');
}

