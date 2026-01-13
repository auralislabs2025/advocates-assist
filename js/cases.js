// Case Management System

let currentEditingCaseId = null;

// Initialize cases on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCases);
} else {
    initCases();
}

function initCases() {
    // Dashboard page
    if (window.location.pathname.includes('dashboard.html')) {
        initDashboard();
    }
    
    // Cases page
    if (window.location.pathname.includes('cases.html')) {
        initCasesPage();
    }
    
    // Case detail page
    if (window.location.pathname.includes('case-detail.html')) {
        initCaseDetail();
    }
}

// Dashboard initialization (overview)
function initDashboard() {
    // Update stats
    updateStats();
    
    // Update alerts
    if (typeof updateUpcomingHearingsPanel === 'function') {
        updateUpcomingHearingsPanel();
    }
    if (typeof updateAlertBanner === 'function') {
        updateAlertBanner();
    }
    
    // Update recent activity
    updateRecentActivity();
}

// Cases page initialization (listing)
function initCasesPage() {
    // Load and display cases
    renderCases();
    
    // Setup event listeners
    setupDashboardListeners();
    
    // Update stats (for sidebar if needed)
    updateStats();
    
    // Update alerts
    if (typeof updateUpcomingHearingsPanel === 'function') {
        updateUpcomingHearingsPanel();
    }
    if (typeof updateAlertBanner === 'function') {
        updateAlertBanner();
    }
}

function setupDashboardListeners() {
    // Add case button
    const addCaseBtn = document.getElementById('addCaseBtn');
    if (addCaseBtn) {
        addCaseBtn.addEventListener('click', () => {
            openCaseModal();
        });
    }
    
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        const debouncedSearch = debounce(renderCases, 300);
        searchInput.addEventListener('input', () => {
            debouncedSearch();
        });
    }
    
    // Status filter
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', renderCases);
    }
    
    // Date filter
    const dateFilter = document.getElementById('dateFilter');
    if (dateFilter) {
        dateFilter.addEventListener('change', renderCases);
    }
    
    // Modal close
    const closeModal = document.getElementById('closeModal');
    if (closeModal) {
        closeModal.addEventListener('click', closeCaseModal);
    }
    
    const cancelBtn = document.getElementById('cancelCaseBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeCaseModal);
    }
    
    // Case form submit
    const caseForm = document.getElementById('caseForm');
    if (caseForm) {
        caseForm.addEventListener('submit', handleCaseSubmit);
    }
    
    // Click outside modal to close
    const modal = document.getElementById('caseModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeCaseModal();
            }
        });
    }
}

function renderCases() {
    const cases = getCases();
    const filteredCases = filterCases(cases);
    const sortedCases = sortCasesByHearingDate(filteredCases);
    
    const casesGrid = document.getElementById('casesGrid');
    if (!casesGrid) return;
    
    if (sortedCases.length === 0) {
        casesGrid.innerHTML = `
            <div class="no-cases">
                <p>No cases found. Click "Add New Case" to get started.</p>
            </div>
        `;
        return;
    }
    
    casesGrid.innerHTML = sortedCases.map(caseData => {
        const urgencyClass = getCaseUrgencyClass(caseData);
        const statusClass = caseData.status || 'active';
        
        return `
            <div class="case-card ${urgencyClass} ${statusClass}" onclick="window.viewCase('${caseData.id}')">
                <div class="case-card-header">
                    <div class="case-number">${escapeHtml(caseData.caseNumber)}</div>
                    <span class="status-badge ${statusClass}">${escapeHtml(caseData.status || 'active')}</span>
                </div>
                <div class="case-title">${escapeHtml(caseData.caseTitle)}</div>
                <div class="case-client">Client: ${escapeHtml(caseData.clientName)}</div>
                <div class="case-info">
                    <div class="case-info-item">
                        <span>Court:</span>
                        <span>${escapeHtml(caseData.courtName)}</span>
                    </div>
                    ${caseData.caseType ? `
                    <div class="case-info-item">
                        <span>Type:</span>
                        <span>${escapeHtml(caseData.caseType)}</span>
                    </div>
                    ` : ''}
                </div>
                ${caseData.nextHearingDate ? `
                <div class="case-hearing">
                    <div class="case-hearing-label">Next Hearing</div>
                    <div class="case-hearing-date">${formatDate(caseData.nextHearingDate)}</div>
                    ${caseData.nextHearingTime ? `
                    <div class="case-hearing-time">${formatTime(caseData.nextHearingTime)}</div>
                    ` : ''}
                </div>
                ` : ''}
                <div class="case-actions" onclick="event.stopPropagation()">
                    <button class="btn btn-secondary" onclick="editCase('${caseData.id}')" style="flex: 1; padding: 0.5rem; font-size: 0.85rem;">Edit</button>
                    <button class="btn btn-danger" onclick="deleteCaseConfirm('${caseData.id}')" style="flex: 1; padding: 0.5rem; font-size: 0.85rem;">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

function filterCases(cases) {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';
    const dateFilter = document.getElementById('dateFilter')?.value || 'all';
    
    let filtered = cases;
    
    // Search filter
    if (searchTerm) {
        filtered = filtered.filter(c => 
            c.caseNumber.toLowerCase().includes(searchTerm) ||
            c.caseTitle.toLowerCase().includes(searchTerm) ||
            c.clientName.toLowerCase().includes(searchTerm) ||
            c.courtName.toLowerCase().includes(searchTerm)
        );
    }
    
    // Status filter
    if (statusFilter !== 'all') {
        filtered = filtered.filter(c => c.status === statusFilter);
    }
    
    // Date filter
    if (dateFilter !== 'all' && dateFilter !== 'none') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        filtered = filtered.filter(c => {
            if (!c.nextHearingDate) return false;
            
            const hearingDate = new Date(c.nextHearingDate);
            hearingDate.setHours(0, 0, 0, 0);
            
            if (dateFilter === 'today') {
                return hearingDate.getTime() === today.getTime();
            } else if (dateFilter === 'week') {
                const weekLater = new Date(today);
                weekLater.setDate(weekLater.getDate() + 7);
                return hearingDate >= today && hearingDate <= weekLater;
            } else if (dateFilter === 'month') {
                const monthLater = new Date(today);
                monthLater.setDate(monthLater.getDate() + 30);
                return hearingDate >= today && hearingDate <= monthLater;
            }
            
            return true;
        });
    }
    
    return filtered;
}

function updateStats() {
    const cases = getCases();
    const total = cases.length;
    const active = cases.filter(c => c.status === 'active').length;
    const postponed = cases.filter(c => c.status === 'postponed').length;
    const closed = cases.filter(c => c.status === 'closed').length;
    
    const totalEl = document.getElementById('totalCases');
    const activeEl = document.getElementById('activeCases');
    const postponedEl = document.getElementById('postponedCases');
    const closedEl = document.getElementById('closedCases');
    
    if (totalEl) totalEl.textContent = total;
    if (activeEl) activeEl.textContent = active;
    if (postponedEl) postponedEl.textContent = postponed;
    if (closedEl) closedEl.textContent = closed;
}

function updateRecentActivity() {
    const cases = getCases();
    const activityList = document.getElementById('recentActivity');
    if (!activityList) return;
    
    // Get cases sorted by updated date
    const sortedCases = [...cases].sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt);
        const dateB = new Date(b.updatedAt || b.createdAt);
        return dateB - dateA;
    }).slice(0, 5);
    
    if (sortedCases.length === 0) {
        activityList.innerHTML = '<p class="no-data">No recent activity</p>';
        return;
    }
    
    activityList.innerHTML = sortedCases.map(caseData => {
        const date = formatDate(caseData.updatedAt || caseData.createdAt);
        return `
            <div class="activity-item" onclick="window.viewCase('${caseData.id}')">
                <div class="activity-case">${escapeHtml(caseData.caseNumber)} - ${escapeHtml(caseData.caseTitle)}</div>
                <div class="activity-date">${date}</div>
            </div>
        `;
    }).join('');
}

function openCaseModal(caseId = null) {
    const modal = document.getElementById('caseModal');
    const modalTitle = document.getElementById('modalTitle');
    const caseForm = document.getElementById('caseForm');
    
    if (!modal) return;
    
    currentEditingCaseId = caseId;
    
    if (caseId) {
        // Edit mode
        const caseData = getCaseById(caseId);
        if (!caseData) return;
        
        if (modalTitle) modalTitle.textContent = 'Edit Case';
        populateCaseForm(caseData);
    } else {
        // Add mode
        if (modalTitle) modalTitle.textContent = 'Add New Case';
        clearForm('caseForm');
        // Set default hearing date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateInput = document.getElementById('nextHearingDate');
        if (dateInput) {
            dateInput.value = getInputDate(tomorrow);
        }
        
        // Setup file input listener
        const fileInput = document.getElementById('caseFiles');
        if (fileInput) {
            fileInput.onchange = function() {
                displaySelectedFiles(this.files, 'caseFilesList');
            };
        }
        
        // Clear file list
        const fileList = document.getElementById('caseFilesList');
        if (fileList) fileList.innerHTML = '';
    }
    
    modal.classList.remove('hidden');
    caseForm?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function openCaseModalDetailPage(caseId = null) {
    const modal = document.getElementById('caseModal');
    const modalTitle = document.getElementById('modalTitle');
    const caseForm = document.getElementById('caseForm');
    
    if (!modal) return;
    
    currentEditingCaseId = caseId;
    
    if (caseId) {
        const caseData = getCaseById(caseId);
        if (!caseData) return;
        
        if (modalTitle) modalTitle.textContent = 'Edit Case';
        populateCaseForm(caseData);
    } else {
        // Add mode - setup file input
        clearForm('caseForm');
        const fileInput = document.getElementById('caseFilesDetail');
        if (fileInput) {
            fileInput.onchange = function() {
                displaySelectedFiles(this.files, 'caseFilesListDetail');
            };
        }
        const fileList = document.getElementById('caseFilesListDetail');
        if (fileList) fileList.innerHTML = '';
    }
    
    modal.classList.remove('hidden');
    caseForm?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function closeCaseModal() {
    const modal = document.getElementById('caseModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    currentEditingCaseId = null;
    clearForm('caseForm');
    // Clear error on both pages
    hideError('caseFormError');
    hideError('caseFormErrorDetail');
}

function populateCaseForm(caseData) {
    // Check if we're on dashboard or case detail page
    const isDetailPage = document.getElementById('caseIdDetail') !== null;
    
    if (isDetailPage) {
        // Case detail page IDs
        document.getElementById('caseIdDetail').value = caseData.id || '';
        document.getElementById('caseNumberDetail').value = caseData.caseNumber || '';
        document.getElementById('caseTitleDetail').value = caseData.caseTitle || '';
        document.getElementById('clientNameDetail').value = caseData.clientName || '';
        document.getElementById('courtNameDetail').value = caseData.courtName || '';
        document.getElementById('judgeNameDetail').value = caseData.judgeName || '';
        document.getElementById('caseTypeDetail').value = caseData.caseType || '';
        document.getElementById('ipcSectionDetail').value = caseData.ipcSection || '';
        document.getElementById('bnsSectionDetail').value = caseData.bnsSection || '';
        document.getElementById('statusDetail').value = caseData.status || 'active';
        document.getElementById('nextHearingDateDetail').value = getInputDate(caseData.nextHearingDate) || '';
        document.getElementById('nextHearingTimeDetail').value = caseData.nextHearingTime || '';
        document.getElementById('descriptionDetail').value = caseData.description || '';
    } else {
        // Dashboard page IDs
        document.getElementById('caseId').value = caseData.id || '';
        document.getElementById('caseNumber').value = caseData.caseNumber || '';
        document.getElementById('caseTitle').value = caseData.caseTitle || '';
        document.getElementById('clientName').value = caseData.clientName || '';
        document.getElementById('courtName').value = caseData.courtName || '';
        document.getElementById('judgeName').value = caseData.judgeName || '';
        document.getElementById('caseType').value = caseData.caseType || '';
        document.getElementById('ipcSection').value = caseData.ipcSection || '';
        document.getElementById('bnsSection').value = caseData.bnsSection || '';
        document.getElementById('status').value = caseData.status || 'active';
        document.getElementById('nextHearingDate').value = getInputDate(caseData.nextHearingDate) || '';
        document.getElementById('nextHearingTime').value = caseData.nextHearingTime || '';
        document.getElementById('description').value = caseData.description || '';
    }
}

async function handleCaseSubmit(e) {
    e.preventDefault();
    
    // Check if we're on detail page or dashboard
    const isDetailPage = document.getElementById('caseIdDetail') !== null;
    const errorElementId = isDetailPage ? 'caseFormErrorDetail' : 'caseFormError';
    const formId = 'caseForm';
    
    hideError(errorElementId);
    
    if (!validateForm(formId)) {
        showError(errorElementId, 'Please fill in all required fields');
        return;
    }
    
    // Handle file uploads for new cases only
    let caseFiles = [];
    if (!currentEditingCaseId) {
        const fileInputId = isDetailPage ? 'caseFilesDetail' : 'caseFiles';
        const fileInput = document.getElementById(fileInputId);
        const files = fileInput ? Array.from(fileInput.files) : [];
        
        if (files.length > 0) {
            const maxSize = 10 * 1024 * 1024; // 10MB
            for (const file of files) {
                if (file.size > maxSize) {
                    showError(errorElementId, `File "${file.name}" exceeds 10MB limit`);
                    return;
                }
            }
            
            try {
                for (const file of files) {
                    const base64 = await fileToBase64(file);
                    caseFiles.push({
                        id: generateUUID(),
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        data: base64,
                        uploadedAt: new Date().toISOString()
                    });
                }
            } catch (error) {
                showError(errorElementId, 'Error uploading files. Please try again.');
                return;
            }
        }
    }
    
    let formData;
    if (isDetailPage) {
        formData = {
            caseNumber: document.getElementById('caseNumberDetail').value.trim(),
            caseTitle: document.getElementById('caseTitleDetail').value.trim(),
            clientName: document.getElementById('clientNameDetail').value.trim(),
            courtName: document.getElementById('courtNameDetail').value.trim(),
            judgeName: document.getElementById('judgeNameDetail').value.trim(),
            caseType: document.getElementById('caseTypeDetail').value,
            ipcSection: document.getElementById('ipcSectionDetail').value.trim(),
            bnsSection: document.getElementById('bnsSectionDetail').value.trim(),
            status: document.getElementById('statusDetail').value,
            nextHearingDate: document.getElementById('nextHearingDateDetail').value,
            nextHearingTime: document.getElementById('nextHearingTimeDetail').value,
            description: document.getElementById('descriptionDetail').value.trim()
        };
    } else {
        formData = {
            caseNumber: document.getElementById('caseNumber').value.trim(),
            caseTitle: document.getElementById('caseTitle').value.trim(),
            clientName: document.getElementById('clientName').value.trim(),
            courtName: document.getElementById('courtName').value.trim(),
            judgeName: document.getElementById('judgeName').value.trim(),
            caseType: document.getElementById('caseType').value,
            ipcSection: document.getElementById('ipcSection').value.trim(),
            bnsSection: document.getElementById('bnsSection').value.trim(),
            status: document.getElementById('status').value,
            nextHearingDate: document.getElementById('nextHearingDate').value,
            nextHearingTime: document.getElementById('nextHearingTime').value,
            description: document.getElementById('description').value.trim()
        };
    }
    
    let result;
    if (currentEditingCaseId) {
        // Update existing case
        result = updateCase(currentEditingCaseId, formData);
        if (result) {
            showToast('Case updated successfully!', 'success');
        } else {
            showError(errorElementId, 'Failed to update case');
            return;
        }
    } else {
        // Add new case
        formData.files = caseFiles;
        formData.history = [{
            date: new Date().toISOString(),
            event: 'Case Created',
            description: 'Case was created in the system',
            status: formData.status
        }];
        
        result = addCase(formData);
        if (result) {
            showToast('Case added successfully!', 'success');
        } else {
            showError(errorElementId, 'Failed to add case');
            return;
        }
    }
    
    closeCaseModal();
    
    // If on detail page, reload it; otherwise refresh dashboard
    if (isDetailPage) {
        const urlParams = new URLSearchParams(window.location.search);
        const caseId = urlParams.get('id');
        if (caseId) {
            loadCaseDetail(caseId);
        }
    } else {
        renderCases();
        updateStats();
        
        if (typeof updateUpcomingHearingsPanel === 'function') {
            updateUpcomingHearingsPanel();
        }
        if (typeof updateAlertBanner === 'function') {
            updateAlertBanner();
        }
    }
}

// Global function to navigate to case detail and close sidebar
window.viewCase = function(caseId) {
    // Close sidebar if open on mobile/tablet
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    if (sidebar && window.innerWidth <= 1024) {
        sidebar.classList.remove('open');
        if (sidebarOverlay) {
            sidebarOverlay.classList.remove('show');
        }
    }
    // Navigate to case detail
    window.location.href = `case-detail.html?id=${caseId}`;
};

// Global functions for inline event handlers
window.editCase = function(caseId) {
    // Check if we're on detail page
    if (window.location.pathname.includes('case-detail')) {
        openCaseModalDetailPage(caseId);
    } else {
        openCaseModal(caseId);
    }
};

window.deleteCaseConfirm = function(caseId) {
    const caseData = getCaseById(caseId);
    if (!caseData) return;
    
    if (confirm(`Are you sure you want to delete case "${caseData.caseNumber} - ${caseData.caseTitle}"?`)) {
        if (deleteCase(caseId)) {
            showToast('Case deleted successfully!', 'success');
            renderCases();
            updateStats();
            
            if (typeof updateUpcomingHearingsPanel === 'function') {
                updateUpcomingHearingsPanel();
            }
            if (typeof updateAlertBanner === 'function') {
                updateAlertBanner();
            }
        } else {
            showToast('Failed to delete case', 'error');
        }
    }
};

// Case Detail Page
function initCaseDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const caseId = urlParams.get('id');
    
    if (!caseId) {
        window.location.href = 'cases.html';
        return;
    }
    
    loadCaseDetail(caseId);
    setupCaseDetailListeners(caseId);
}

function loadCaseDetail(caseId) {
    const caseData = getCaseById(caseId);
    const content = document.getElementById('caseDetailContent');
    
    if (!content) return;
    
    if (!caseData) {
        content.innerHTML = `
            <div class="no-data">
                <p>Case not found.</p>
                <a href="dashboard.html" class="btn btn-primary">Back to Dashboard</a>
            </div>
        `;
        return;
    }
    
    const urgencyClass = getCaseUrgencyClass(caseData);
    
    content.innerHTML = `
        <div class="case-detail-header">
            <div>
                <h2>${escapeHtml(caseData.caseNumber)} - ${escapeHtml(caseData.caseTitle)}</h2>
                <span class="status-badge ${caseData.status}">${escapeHtml(caseData.status)}</span>
            </div>
            <div class="case-detail-actions">
                <button class="btn btn-primary" onclick="editCase('${caseData.id}')">Edit Case</button>
                <button class="btn btn-danger" onclick="deleteCaseConfirm('${caseData.id}')">Delete Case</button>
            </div>
        </div>
        
        <div class="quick-actions-bar">
            <div class="quick-actions-left">
                <button class="btn btn-secondary" id="completeHearingBtnTop" ${!caseData.nextHearingDate ? 'style="display:none;"' : ''}>
                    ✓ Complete Current Hearing
                </button>
                <button class="btn btn-primary" id="addHistoryBtnTop">
                    + Add History Entry
                </button>
            </div>
        </div>
        
        <div class="case-detail-info">
            <div class="info-group">
                <div class="info-label">Client Name</div>
                <div class="info-value">${escapeHtml(caseData.clientName)}</div>
            </div>
            <div class="info-group">
                <div class="info-label">Court Name</div>
                <div class="info-value">${escapeHtml(caseData.courtName)}</div>
            </div>
            <div class="info-group">
                <div class="info-label">Judge Name</div>
                <div class="info-value">${escapeHtml(caseData.judgeName || 'N/A')}</div>
            </div>
            <div class="info-group">
                <div class="info-label">Case Type</div>
                <div class="info-value">${escapeHtml(caseData.caseType || 'N/A')}</div>
            </div>
            <div class="info-group">
                <div class="info-label">IPC Section</div>
                <div class="info-value">${escapeHtml(caseData.ipcSection || 'N/A')}</div>
            </div>
            <div class="info-group">
                <div class="info-label">BNS Section</div>
                <div class="info-value">${escapeHtml(caseData.bnsSection || 'N/A')}</div>
            </div>
            <div class="info-group">
                <div class="info-label">Next Hearing Date</div>
                <div class="info-value ${urgencyClass ? 'text-' + urgencyClass : ''}">
                    ${caseData.nextHearingDate ? formatDateTime(caseData.nextHearingDate, caseData.nextHearingTime) : 'Not set'}
                    ${caseData.nextHearingDate ? `<br><button class="btn btn-secondary" onclick="openUpdateHearingModal('${caseId}')" style="margin-top: 0.5rem; font-size: 0.85rem; padding: 0.5rem 1rem;">Update Hearing</button>` : `<button class="btn btn-primary" onclick="openUpdateHearingModal('${caseId}')" style="margin-top: 0.5rem; font-size: 0.85rem; padding: 0.5rem 1rem;">Set Hearing Date</button>`}
                </div>
            </div>
            <div class="info-group">
                <div class="info-label">Status</div>
                <div class="info-value">${escapeHtml(caseData.status || 'active')}</div>
            </div>
        </div>
        
        ${caseData.description ? `
        <div class="case-description">
            <h3>Case Description</h3>
            <p>${escapeHtml(caseData.description)}</p>
        </div>
        ` : ''}
        
        <div class="case-milestones">
            <h3>Case Milestones</h3>
            <div class="milestones-summary" id="milestonesSummary">
                ${renderMilestonesSummary(caseId)}
            </div>
        </div>
        
        <div class="case-history">
            <div class="case-history-header">
                <h3>Complete Case Timeline</h3>
            </div>
            <div class="timeline" id="caseTimeline">
                ${renderCaseHistory(caseData.history || [], caseId)}
            </div>
        </div>
    `;
}

function renderCaseHistory(history, caseId) {
    if (!history || history.length === 0) {
        return '<p class="no-data">No history entries yet.</p>';
    }
    
    // Sort history chronologically (newest to oldest) for timeline - latest at top
    const sortedHistory = [...history].sort((a, b) => {
        const dateA = a.hearingDate ? new Date(a.hearingDate) : new Date(a.date);
        const dateB = b.hearingDate ? new Date(b.hearingDate) : new Date(b.date);
        return dateB - dateA; // Descending order (newest first)
    });
    
    return sortedHistory.map(entry => {
        const entryDate = entry.hearingDate ? new Date(entry.hearingDate) : new Date(entry.date);
        const isPast = entryDate < new Date();
        const isHearing = entry.event === 'Hearing';
        
        return `
            <div class="timeline-item ${isHearing ? 'timeline-hearing' : ''} ${isPast ? 'timeline-past' : 'timeline-upcoming'}" data-entry-id="${entry.id}">
                <div class="timeline-item-content">
                    <div class="timeline-item-header">
                        <div class="timeline-event">
                            ${isHearing ? '⚖️ ' : ''}${escapeHtml(entry.event || 'Event')}
                            ${!isPast && isHearing ? '<span class="badge-upcoming">Upcoming</span>' : ''}
                            ${isPast && isHearing ? '<span class="badge-completed">Completed</span>' : ''}
                        </div>
                        <div class="timeline-date-action">
                            <div class="timeline-date">${formatDate(entry.date)}</div>
                            <button class="btn btn-secondary" onclick="editHistoryEntry('${caseId}', '${entry.id}')" style="font-size: 0.75rem; padding: 0.4rem 0.875rem;">Edit</button>
                        </div>
                    </div>
                    ${entry.hearingDate ? `
                    <div class="timeline-meta">
                        <strong>Hearing Date:</strong> ${formatDateTime(entry.hearingDate, entry.hearingTime)}
                    </div>
                    ` : ''}
                    ${entry.outcome ? `
                    <div class="timeline-outcome">
                        <strong>Outcome:</strong> ${escapeHtml(entry.outcome)}
                    </div>
                    ` : ''}
                    <div class="timeline-description">${escapeHtml(entry.description || '')}</div>
                    ${entry.files && entry.files.length > 0 ? `
                    <div class="attached-files">
                        <h4>Attached Documents (${entry.files.length}):</h4>
                        ${entry.files.map(file => `
                            <div class="file-attachment">
                                <a href="${file.data}" download="${escapeHtml(file.name)}" target="_blank">
                                    <span class="file-icon">📄</span>
                                    <span>${escapeHtml(file.name)}</span>
                                    <span style="font-size: 0.75rem; color: var(--text-secondary);">(${formatFileSize(file.size)})</span>
                                </a>
                            </div>
                        `).join('')}
                    </div>
                    ` : ''}
                    ${entry.nextHearingDate && isPast && isHearing ? `
                    <div class="timeline-meta">
                        <strong>Next Hearing Scheduled:</strong> ${formatDateTime(entry.nextHearingDate, entry.nextHearingTime)}
                    </div>
                    ` : ''}
                    ${entry.status ? `
                    <div class="timeline-meta">Status: <span class="status-badge ${entry.status}">${escapeHtml(entry.status)}</span></div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Get milestones/highlights from case history
function getCaseMilestones(caseId) {
    const caseData = getCaseById(caseId);
    if (!caseData || !caseData.history) return [];
    
    const milestones = [];
    
    caseData.history.forEach(entry => {
        if (entry.event === 'Hearing' || entry.event === 'Judgment' || entry.event === 'Order') {
            milestones.push({
                ...entry,
                type: entry.event.toLowerCase(),
                date: entry.hearingDate ? new Date(entry.hearingDate) : new Date(entry.date)
            });
        }
    });
    
    // Sort chronologically
    milestones.sort((a, b) => a.date - b.date);
    
    return milestones;
}

function renderMilestonesSummary(caseId) {
    const hearings = getAllHearings(caseId);
    const milestones = getCaseMilestones(caseId);
    
    const completedHearings = hearings.filter(h => h.isCompleted).length;
    const totalHearings = hearings.length;
    const upcomingHearings = hearings.filter(h => !h.isCompleted && !h.isPast).length;
    
    return `
        <div class="milestones-unified">
            <div class="milestone-stats-compact">
                <div class="milestone-stat-compact">
                    <span class="stat-value">${totalHearings}</span>
                    <span class="stat-label">Total</span>
                </div>
                <div class="milestone-stat-compact">
                    <span class="stat-value">${completedHearings}</span>
                    <span class="stat-label">Completed</span>
                </div>
                <div class="milestone-stat-compact">
                    <span class="stat-value">${upcomingHearings}</span>
                    <span class="stat-label">Upcoming</span>
                </div>
                <div class="milestone-stat-compact">
                    <span class="stat-value">${milestones.length}</span>
                    <span class="stat-label">Milestones</span>
                </div>
            </div>
            ${hearings.length > 0 ? `
            <div class="hearings-grid">
                ${hearings.map((hearing, idx) => `
                    <div class="hearing-milestone ${hearing.isCompleted ? 'completed' : 'upcoming'}">
                        <div class="hearing-header-row">
                            <div class="hearing-number">Hearing #${idx + 1}</div>
                            ${hearing.id && hearing.id !== 'current' ? `<button class="btn btn-secondary" onclick="editHistoryEntry('${caseId}', '${hearing.id}')" style="font-size: 0.75rem; padding: 0.35rem 0.75rem;">Edit</button>` : ''}
                        </div>
                        <div class="hearing-date">${formatDateTime(hearing.hearingDate, hearing.hearingTime)}</div>
                        ${hearing.outcome ? `<div class="hearing-outcome">${escapeHtml(hearing.outcome)}</div>` : ''}
                        ${hearing.description ? `<div class="hearing-description">${escapeHtml(hearing.description)}</div>` : ''}
                        ${!hearing.isCompleted && hearing.nextHearingDate ? `
                        <div class="hearing-next">Next: ${formatDateTime(hearing.nextHearingDate, hearing.nextHearingTime)}</div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
            ` : '<p class="no-data">No hearings recorded yet.</p>'}
        </div>
    `;
}

function setupCaseDetailListeners(caseId) {
    // Top action buttons
    const addHistoryBtnTop = document.getElementById('addHistoryBtnTop');
    if (addHistoryBtnTop) {
        addHistoryBtnTop.addEventListener('click', () => {
            openHistoryModal(caseId);
        });
    }
    
    const completeHearingBtnTop = document.getElementById('completeHearingBtnTop');
    if (completeHearingBtnTop) {
        completeHearingBtnTop.addEventListener('click', () => {
            openCompleteHearingModal(caseId);
        });
    }
    
    // Legacy buttons (if they exist, also connect them)
    const addHistoryBtn = document.getElementById('addHistoryBtn');
    if (addHistoryBtn) {
        addHistoryBtn.addEventListener('click', () => {
            openHistoryModal(caseId);
        });
    }
    
    const completeHearingBtn = document.getElementById('completeHearingBtn');
    if (completeHearingBtn) {
        completeHearingBtn.addEventListener('click', () => {
            openCompleteHearingModal(caseId);
        });
    }
    
    // History modal
    const historyModal = document.getElementById('historyModal');
    const closeHistoryModal = document.getElementById('closeHistoryModal');
    const cancelHistoryBtn = document.getElementById('cancelHistoryBtn');
    const historyForm = document.getElementById('historyForm');
    
    if (closeHistoryModal) {
        closeHistoryModal.addEventListener('click', () => {
            if (historyModal) historyModal.classList.add('hidden');
        });
    }
    
    if (cancelHistoryBtn) {
        cancelHistoryBtn.addEventListener('click', () => {
            if (historyModal) historyModal.classList.add('hidden');
        });
    }
    
    if (historyModal) {
        historyModal.addEventListener('click', (e) => {
            if (e.target === historyModal) {
                historyModal.classList.add('hidden');
            }
        });
    }
    
    if (historyForm) {
        historyForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleHistorySubmit(caseId);
        });
    }
    
    // Complete hearing modal
    const completeHearingModal = document.getElementById('completeHearingModal');
    const closeCompleteHearingModal = document.getElementById('closeCompleteHearingModal');
    const cancelCompleteHearingBtn = document.getElementById('cancelCompleteHearingBtn');
    const completeHearingForm = document.getElementById('completeHearingForm');
    
    if (closeCompleteHearingModal) {
        closeCompleteHearingModal.addEventListener('click', () => {
            if (completeHearingModal) completeHearingModal.classList.add('hidden');
        });
    }
    
    if (cancelCompleteHearingBtn) {
        cancelCompleteHearingBtn.addEventListener('click', () => {
            if (completeHearingModal) completeHearingModal.classList.add('hidden');
        });
    }
    
    if (completeHearingModal) {
        completeHearingModal.addEventListener('click', (e) => {
            if (e.target === completeHearingModal) {
                completeHearingModal.classList.add('hidden');
            }
        });
    }
    
    if (completeHearingForm) {
        completeHearingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleCompleteHearing(caseId);
        });
    }
    
    // Edit history modal
    const editHistoryModal = document.getElementById('editHistoryModal');
    const closeEditHistoryModal = document.getElementById('closeEditHistoryModal');
    const cancelEditHistoryBtn = document.getElementById('cancelEditHistoryBtn');
    const editHistoryForm = document.getElementById('editHistoryForm');
    
    if (closeEditHistoryModal) {
        closeEditHistoryModal.addEventListener('click', () => {
            if (editHistoryModal) editHistoryModal.classList.add('hidden');
        });
    }
    
    if (cancelEditHistoryBtn) {
        cancelEditHistoryBtn.addEventListener('click', () => {
            if (editHistoryModal) editHistoryModal.classList.add('hidden');
        });
    }
    
    if (editHistoryModal) {
        editHistoryModal.addEventListener('click', (e) => {
            if (e.target === editHistoryModal) {
                editHistoryModal.classList.add('hidden');
            }
        });
    }
    
    if (editHistoryForm) {
        editHistoryForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const caseIdField = document.getElementById('editHistoryCaseId');
            const entryIdField = document.getElementById('editHistoryEntryId');
            if (caseIdField && entryIdField) {
                handleEditHistorySubmit(caseIdField.value, entryIdField.value);
            }
        });
    }
    
    // Edit case modal (on detail page)
    const caseModal = document.getElementById('caseModal');
    const closeModal = document.getElementById('closeModal');
    const cancelCaseBtnDetail = document.getElementById('cancelCaseBtnDetail');
    const caseForm = document.getElementById('caseForm');
    
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            if (caseModal) caseModal.classList.add('hidden');
        });
    }
    
    if (cancelCaseBtnDetail) {
        cancelCaseBtnDetail.addEventListener('click', () => {
            if (caseModal) caseModal.classList.add('hidden');
        });
    }
    
    if (caseModal) {
        caseModal.addEventListener('click', (e) => {
            if (e.target === caseModal) {
                caseModal.classList.add('hidden');
            }
        });
    }
    
    if (caseForm) {
        caseForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleCaseSubmit(e);
        });
    }
    
    // Update hearing modal
    const updateHearingModal = document.getElementById('updateHearingModal');
    const closeUpdateHearingModal = document.getElementById('closeUpdateHearingModal');
    const cancelUpdateHearingBtn = document.getElementById('cancelUpdateHearingBtn');
    const updateHearingForm = document.getElementById('updateHearingForm');
    
    if (closeUpdateHearingModal) {
        closeUpdateHearingModal.addEventListener('click', () => {
            if (updateHearingModal) updateHearingModal.classList.add('hidden');
        });
    }
    
    if (cancelUpdateHearingBtn) {
        cancelUpdateHearingBtn.addEventListener('click', () => {
            if (updateHearingModal) updateHearingModal.classList.add('hidden');
        });
    }
    
    if (updateHearingModal) {
        updateHearingModal.addEventListener('click', (e) => {
            if (e.target === updateHearingModal) {
                updateHearingModal.classList.add('hidden');
            }
        });
    }
    
    if (updateHearingForm) {
        updateHearingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleUpdateHearing(caseId);
        });
    }
}

function openUpdateHearingModal(caseId) {
    const modal = document.getElementById('updateHearingModal');
    const caseData = getCaseById(caseId);
    
    if (!modal || !caseData) return;
    
    modal.classList.remove('hidden');
    hideError('updateHearingError');
    
    // Pre-fill current hearing date if exists (AFTER clearing form)
    const dateInput = document.getElementById('updateHearingDate');
    if (dateInput && caseData.nextHearingDate) {
        dateInput.value = getInputDate(caseData.nextHearingDate);
    } else if (dateInput) {
        dateInput.value = '';
    }
    
    const timeInput = document.getElementById('updateHearingTime');
    if (timeInput && caseData.nextHearingTime) {
        timeInput.value = caseData.nextHearingTime;
    } else if (timeInput) {
        timeInput.value = '';
    }
    
    // Clear notes and purpose
    const notesInput = document.getElementById('updateHearingNotes');
    if (notesInput) notesInput.value = '';
    const purposeInput = document.getElementById('updateHearingPurpose');
    if (purposeInput) purposeInput.value = '';
}

function handleUpdateHearing(caseId) {
    hideError('updateHearingError');
    
    if (!validateForm('updateHearingForm')) {
        showError('updateHearingError', 'Please fill in all required fields');
        return;
    }
    
    const caseData = getCaseById(caseId);
    if (!caseData) return;
    
    const hearingDate = document.getElementById('updateHearingDate').value;
    const hearingTime = document.getElementById('updateHearingTime').value;
    const notes = document.getElementById('updateHearingNotes').value.trim();
    const purpose = document.getElementById('updateHearingPurpose').value;
    
    // Update the case with new hearing date
    const updateData = {
        nextHearingDate: hearingDate,
        nextHearingTime: hearingTime || null
    };
    
    const updatedCase = updateCase(caseId, updateData);
    
    if (updatedCase) {
        // Add history entry with hearing notes
        const historyEntry = {
            event: 'Hearing Scheduled',
            date: new Date().toISOString(),
            hearingDate: hearingDate,
            hearingTime: hearingTime || null,
            description: notes,
            purpose: purpose || null
        };
        
        addCaseHistory(caseId, historyEntry);
        
        showToast('Hearing date updated successfully!', 'success');
        const modal = document.getElementById('updateHearingModal');
        if (modal) modal.classList.add('hidden');
        
        // Reload case detail
        loadCaseDetail(caseId);
    } else {
        showError('updateHearingError', 'Failed to update hearing date');
    }
}


function openEditHistoryModal(caseId, entryId) {
    const modal = document.getElementById('editHistoryModal');
    const caseData = getCaseById(caseId);
    
    if (!modal || !caseData || !caseData.history) return;
    
    const entry = caseData.history.find(e => e.id === entryId);
    if (!entry) return;
    
    // Populate form
    document.getElementById('editHistoryEntryId').value = entryId;
    document.getElementById('editHistoryCaseId').value = caseId;
    document.getElementById('editHistoryDate').value = getInputDate(entry.date);
    document.getElementById('editHistoryEvent').value = entry.event || '';
    document.getElementById('editHistoryHearingDate').value = getInputDate(entry.hearingDate) || '';
    document.getElementById('editHistoryHearingTime').value = entry.hearingTime || '';
    document.getElementById('editHistoryOutcome').value = entry.outcome || '';
    document.getElementById('editHistoryDescription').value = entry.description || '';
    document.getElementById('editHistoryStatus').value = entry.status || '';
    
    modal.classList.remove('hidden');
    hideError('editHistoryFormError');
}

async function handleEditHistorySubmit(caseId, entryId) {
    hideError('editHistoryFormError');
    
    if (!validateForm('editHistoryForm')) {
        showError('editHistoryFormError', 'Please fill in all required fields');
        return;
    }
    
    const cases = getCases();
    const caseIndex = cases.findIndex(c => c.id === caseId);
    if (caseIndex === -1) return;
    
    const entryIndex = cases[caseIndex].history.findIndex(e => e.id === entryId);
    if (entryIndex === -1) return;
    
    // Handle new file uploads
    const fileInput = document.getElementById('editHistoryFiles');
    const newFiles = fileInput ? Array.from(fileInput.files) : [];
    const uploadedFiles = [];
    
    if (newFiles.length > 0) {
        const maxSize = 10 * 1024 * 1024; // 10MB
        for (const file of newFiles) {
            if (file.size > maxSize) {
                showError('editHistoryFormError', `File "${file.name}" exceeds 10MB limit`);
                return;
            }
        }
        
        try {
            for (const file of newFiles) {
                const base64 = await fileToBase64(file);
                uploadedFiles.push({
                    id: generateUUID(),
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: base64,
                    uploadedAt: new Date().toISOString()
                });
            }
        } catch (error) {
            showError('editHistoryFormError', 'Error uploading files. Please try again.');
            return;
        }
    }
    
    // Get existing files (they may have been removed)
    const existingFiles = cases[caseIndex].history[entryIndex].files || [];
    
    // Update history entry
    cases[caseIndex].history[entryIndex] = {
        ...cases[caseIndex].history[entryIndex],
        date: new Date(document.getElementById('editHistoryDate').value).toISOString(),
        event: document.getElementById('editHistoryEvent').value,
        hearingDate: document.getElementById('editHistoryHearingDate').value ? new Date(document.getElementById('editHistoryHearingDate').value).toISOString() : null,
        hearingTime: document.getElementById('editHistoryHearingTime').value || null,
        outcome: document.getElementById('editHistoryOutcome').value || null,
        description: document.getElementById('editHistoryDescription').value.trim(),
        nextHearingDate: document.getElementById('editHistoryNextHearingDate').value ? new Date(document.getElementById('editHistoryNextHearingDate').value).toISOString() : null,
        nextHearingTime: document.getElementById('editHistoryNextHearingTime').value || null,
        files: [...existingFiles, ...uploadedFiles], // Keep existing files and add new ones
        status: document.getElementById('editHistoryStatus').value || cases[caseIndex].history[entryIndex].status
    };
    
    // Update case status if changed
    if (document.getElementById('editHistoryStatus').value) {
        cases[caseIndex].status = document.getElementById('editHistoryStatus').value;
    }
    
    cases[caseIndex].updatedAt = new Date().toISOString();
    
    if (saveCases(cases)) {
        showToast('History entry updated successfully!', 'success');
        const modal = document.getElementById('editHistoryModal');
        if (modal) modal.classList.add('hidden');
        
        // Reload case detail
        loadCaseDetail(caseId);
    } else {
        showError('editHistoryFormError', 'Failed to update history entry');
    }
}

function openHistoryModal(caseId) {
    const modal = document.getElementById('historyModal');
    if (modal) {
        modal.classList.remove('hidden');
        clearForm('historyForm');
        hideError('historyFormError');
        
        // Set default date to today
        const dateInput = document.getElementById('historyDate');
        if (dateInput) {
            dateInput.value = getInputDate(new Date());
        }
        
        // Setup file input listener
        const fileInput = document.getElementById('historyFiles');
        if (fileInput) {
            fileInput.onchange = function() {
                displaySelectedFiles(this.files, 'historyFilesList');
            };
        }
        
        // Clear file list
        const fileList = document.getElementById('historyFilesList');
        if (fileList) fileList.innerHTML = '';
    }
}

async function handleHistorySubmit(caseId) {
    hideError('historyFormError');
    
    if (!validateForm('historyForm')) {
        showError('historyFormError', 'Please fill in all required fields');
        return;
    }
    
    // Handle file uploads
    const fileInput = document.getElementById('historyFiles');
    const files = fileInput ? Array.from(fileInput.files) : [];
    const uploadedFiles = [];
    
    if (files.length > 0) {
        const maxSize = 10 * 1024 * 1024; // 10MB
        for (const file of files) {
            if (file.size > maxSize) {
                showError('historyFormError', `File "${file.name}" exceeds 10MB limit`);
                return;
            }
        }
        
        try {
            for (const file of files) {
                const base64 = await fileToBase64(file);
                uploadedFiles.push({
                    id: generateUUID(),
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: base64,
                    uploadedAt: new Date().toISOString()
                });
            }
        } catch (error) {
            showError('historyFormError', 'Error uploading files. Please try again.');
            return;
        }
    }
    
    const historyEntry = {
        event: document.getElementById('historyEvent').value,
        description: document.getElementById('historyDescription').value.trim(),
        date: document.getElementById('historyDate').value,
        hearingDate: document.getElementById('historyHearingDate').value || null,
        hearingTime: document.getElementById('historyHearingTime')?.value || null,
        outcome: document.getElementById('historyOutcome')?.value || null,
        status: document.getElementById('historyStatus').value || null,
        nextHearingDate: document.getElementById('historyNextHearingDate')?.value || null,
        nextHearingTime: document.getElementById('historyNextHearingTime')?.value || null,
        files: uploadedFiles
    };
    
    const updatedCase = addCaseHistory(caseId, historyEntry);
    
    if (updatedCase) {
        showToast('History entry added successfully!', 'success');
        const modal = document.getElementById('historyModal');
        if (modal) modal.classList.add('hidden');
        
        // Reload case detail
        loadCaseDetail(caseId);
    } else {
        showError('historyFormError', 'Failed to add history entry');
    }
}

function openCompleteHearingModal(caseId) {
    const modal = document.getElementById('completeHearingModal');
    const caseData = getCaseById(caseId);
    
    if (!modal || !caseData || !caseData.nextHearingDate) return;
    
    // Populate current hearing date
    const currentDateDisplay = document.getElementById('currentHearingDateDisplay');
    if (currentDateDisplay) {
        currentDateDisplay.value = formatDateTime(caseData.nextHearingDate, caseData.nextHearingTime);
    }
    
    // Clear file list
    const fileList = document.getElementById('completeHearingFilesList');
    if (fileList) fileList.innerHTML = '';
    
    // Set default next hearing date (optional - can be left empty)
    const nextDateInput = document.getElementById('nextHearingDateAfter');
    if (nextDateInput) {
        // Pre-fill with a date 30 days from current hearing (user can change)
        const currentHearingDate = new Date(caseData.nextHearingDate);
        const suggestedDate = new Date(currentHearingDate);
        suggestedDate.setDate(suggestedDate.getDate() + 30);
        nextDateInput.value = getInputDate(suggestedDate);
    }
    
    // Setup file input listener
    const fileInput = document.getElementById('completeHearingFiles');
    if (fileInput) {
        fileInput.onchange = function() {
            displaySelectedFiles(this.files, 'completeHearingFilesList');
        };
    }
    
    modal.classList.remove('hidden');
    hideError('completeHearingError');
    
    // Clear form but preserve the current hearing date display
    const currentDateValue = currentDateDisplay ? currentDateDisplay.value : '';
    clearForm('completeHearingForm');
    if (currentDateDisplay && currentDateValue) {
        currentDateDisplay.value = currentDateValue;
    }
}

function displaySelectedFiles(files, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (files.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    container.innerHTML = Array.from(files).map((file, index) => `
        <div class="file-item" data-index="${index}">
            <span class="file-name">${escapeHtml(file.name)}</span>
            <span class="file-size">(${formatFileSize(file.size)})</span>
            <button type="button" class="file-remove" onclick="removeFileFromList(${index}, '${containerId}')">&times;</button>
        </div>
    `).join('');
}

window.removeFileFromList = function(index, containerId) {
    const fileInput = document.getElementById('completeHearingFiles');
    if (!fileInput) return;
    
    const dt = new DataTransfer();
    const files = Array.from(fileInput.files);
    files.forEach((file, i) => {
        if (i !== index) dt.items.add(file);
    });
    fileInput.files = dt.files;
    
    displaySelectedFiles(fileInput.files, containerId);
};

async function handleCompleteHearing(caseId) {
    hideError('completeHearingError');
    
    if (!validateForm('completeHearingForm')) {
        showError('completeHearingError', 'Please fill in all required fields');
        return;
    }
    
    // Handle file uploads
    const fileInput = document.getElementById('completeHearingFiles');
    const files = fileInput ? Array.from(fileInput.files) : [];
    const uploadedFiles = [];
    
    if (files.length > 0) {
        // Validate file sizes (10MB max per file)
        const maxSize = 10 * 1024 * 1024; // 10MB
        for (const file of files) {
            if (file.size > maxSize) {
                showError('completeHearingError', `File "${file.name}" exceeds 10MB limit`);
                return;
            }
        }
        
        // Convert files to base64
        try {
            for (const file of files) {
                const base64 = await fileToBase64(file);
                uploadedFiles.push({
                    id: generateUUID(),
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: base64,
                    uploadedAt: new Date().toISOString()
                });
            }
        } catch (error) {
            showError('completeHearingError', 'Error uploading files. Please try again.');
            return;
        }
    }
    
    const hearingData = {
        outcome: document.getElementById('hearingOutcome').value,
        description: document.getElementById('completeHearingDescription').value.trim(),
        nextHearingDate: document.getElementById('nextHearingDateAfter').value || null,
        nextHearingTime: document.getElementById('nextHearingTimeAfter').value || null,
        status: document.getElementById('completeHearingStatus').value || null,
        files: uploadedFiles
    };
    
    const updatedCase = completeHearing(caseId, hearingData);
    
    if (updatedCase) {
        showToast('Hearing marked as completed!', 'success');
        const modal = document.getElementById('completeHearingModal');
        if (modal) modal.classList.add('hidden');
        
        // Reload case detail
        loadCaseDetail(caseId);
    } else {
        showError('completeHearingError', 'Failed to complete hearing');
    }
}

// Global functions for inline onclick handlers - inlined to avoid circular references
window.openUpdateHearingModal = function(caseId) {
    const modal = document.getElementById('updateHearingModal');
    const caseData = getCaseById(caseId);
    
    if (!modal || !caseData) return;
    
    modal.classList.remove('hidden');
    hideError('updateHearingError');
    
    // Pre-fill current hearing date if exists
    const dateInput = document.getElementById('updateHearingDate');
    if (dateInput && caseData.nextHearingDate) {
        dateInput.value = getInputDate(caseData.nextHearingDate);
    } else if (dateInput) {
        dateInput.value = '';
    }
    
    const timeInput = document.getElementById('updateHearingTime');
    if (timeInput && caseData.nextHearingTime) {
        timeInput.value = caseData.nextHearingTime;
    } else if (timeInput) {
        timeInput.value = '';
    }
    
    // Clear notes and purpose
    const notesInput = document.getElementById('updateHearingNotes');
    if (notesInput) notesInput.value = '';
    const purposeInput = document.getElementById('updateHearingPurpose');
    if (purposeInput) purposeInput.value = '';
};

window.editHistoryEntry = function(caseId, entryId) {
    const modal = document.getElementById('editHistoryModal');
    const caseData = getCaseById(caseId);
    
    if (!modal || !caseData || !caseData.history) return;
    
    const entry = caseData.history.find(e => e.id === entryId);
    if (!entry) return;
    
    const isHearing = entry.event === 'Hearing';
    
    // Show/hide hearing-specific fields
    const nextHearingGroup = document.getElementById('editHistoryNextHearingGroup');
    const nextHearingTimeGroup = document.getElementById('editHistoryNextHearingTimeGroup');
    if (nextHearingGroup) nextHearingGroup.style.display = isHearing ? 'block' : 'none';
    if (nextHearingTimeGroup) nextHearingTimeGroup.style.display = isHearing ? 'block' : 'none';
    
    // Populate form
    document.getElementById('editHistoryEntryId').value = entryId;
    document.getElementById('editHistoryCaseId').value = caseId;
    document.getElementById('editHistoryDate').value = getInputDate(entry.date);
    document.getElementById('editHistoryEvent').value = entry.event || '';
    document.getElementById('editHistoryHearingDate').value = getInputDate(entry.hearingDate) || '';
    document.getElementById('editHistoryHearingTime').value = entry.hearingTime || '';
    document.getElementById('editHistoryOutcome').value = entry.outcome || '';
    document.getElementById('editHistoryDescription').value = entry.description || '';
    document.getElementById('editHistoryNextHearingDate').value = getInputDate(entry.nextHearingDate) || '';
    document.getElementById('editHistoryNextHearingTime').value = entry.nextHearingTime || '';
    document.getElementById('editHistoryStatus').value = entry.status || '';
    
    // Display existing files
    const existingFilesContainer = document.getElementById('editHistoryExistingFiles');
    const filesGroup = document.getElementById('editHistoryFilesGroup');
    if (existingFilesContainer && entry.files && entry.files.length > 0) {
        filesGroup.style.display = 'block';
        existingFilesContainer.innerHTML = entry.files.map((file, index) => `
            <div class="file-item" data-file-id="${file.id}">
                <span class="file-name">${escapeHtml(file.name)}</span>
                <span class="file-size">(${formatFileSize(file.size)})</span>
                <button type="button" class="file-remove" onclick="removeExistingFile('${caseId}', '${entryId}', '${file.id}')">&times;</button>
            </div>
        `).join('');
    } else {
        if (filesGroup) filesGroup.style.display = isHearing ? 'block' : 'none';
        if (existingFilesContainer) existingFilesContainer.innerHTML = '';
    }
    
    // Setup file input listener
    const fileInput = document.getElementById('editHistoryFiles');
    if (fileInput) {
        fileInput.onchange = function() {
            displaySelectedFiles(this.files, 'editHistoryFilesList');
        };
    }
    
    // Clear new files list
    const newFilesList = document.getElementById('editHistoryFilesList');
    if (newFilesList) newFilesList.innerHTML = '';
    
    modal.classList.remove('hidden');
    hideError('editHistoryFormError');
};

window.removeExistingFile = function(caseId, entryId, fileId) {
    if (!confirm('Are you sure you want to remove this file?')) return;
    
    const cases = getCases();
    const caseIndex = cases.findIndex(c => c.id === caseId);
    if (caseIndex === -1) return;
    
    const entryIndex = cases[caseIndex].history.findIndex(e => e.id === entryId);
    if (entryIndex === -1) return;
    
    // Remove file from entry
    if (cases[caseIndex].history[entryIndex].files) {
        cases[caseIndex].history[entryIndex].files = cases[caseIndex].history[entryIndex].files.filter(f => f.id !== fileId);
        cases[caseIndex].updatedAt = new Date().toISOString();
        saveCases(cases);
        
        // Reload case detail
        loadCaseDetail(caseId);
    }
};

