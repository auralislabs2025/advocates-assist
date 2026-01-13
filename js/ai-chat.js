// AI Chat functionality

document.addEventListener('DOMContentLoaded', function() {
    const chatForm = document.getElementById('aiChatForm');
    const chatInput = document.getElementById('aiChatInput');
    const chatMessages = document.getElementById('aiChatMessages');
    const chatSendBtn = document.getElementById('aiChatSendBtn');
    
    // Auto-resize textarea
    if (chatInput) {
        chatInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 150) + 'px';
        });
    }
    
    // Handle form submission
    if (chatForm) {
        chatForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const message = chatInput.value.trim();
            if (!message) return;
            
            // Add user message
            addMessage(message, 'user');
            
            // Clear input
            chatInput.value = '';
            chatInput.style.height = 'auto';
            
            // Disable send button
            if (chatSendBtn) {
                chatSendBtn.disabled = true;
            }
            
            // Show typing indicator
            const typingIndicator = showTypingIndicator();
            
            // Simulate AI response (replace with actual API call later)
            setTimeout(() => {
                removeTypingIndicator(typingIndicator);
                
                // Generate response
                const response = generateAIResponse(message);
                addMessage(response, 'assistant');
                
                // Re-enable send button
                if (chatSendBtn) {
                    chatSendBtn.disabled = false;
                }
            }, 1000 + Math.random() * 1000);
        });
    }
});

function addMessage(text, type) {
    const chatMessages = document.getElementById('aiChatMessages');
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `ai-message ai-message-${type}`;
    
    if (type === 'user') {
        messageDiv.innerHTML = `
            <div class="ai-message-content">
                <p>${escapeHtml(text)}</p>
            </div>
            <div class="ai-message-avatar">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
            </div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="ai-message-avatar">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                    <path d="M2 17l10 5 10-5"></path>
                    <path d="M2 12l10 5 10-5"></path>
                </svg>
            </div>
            <div class="ai-message-content">
                <p>${formatMessage(text)}</p>
            </div>
        `;
    }
    
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

function showTypingIndicator() {
    const chatMessages = document.getElementById('aiChatMessages');
    if (!chatMessages) return null;
    
    const indicator = document.createElement('div');
    indicator.className = 'ai-message ai-message-assistant ai-typing-indicator';
    indicator.id = 'typingIndicator';
    indicator.innerHTML = `
        <div class="ai-message-avatar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                <path d="M2 17l10 5 10-5"></path>
                <path d="M2 12l10 5 10-5"></path>
            </svg>
        </div>
        <div class="ai-message-content">
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    
    chatMessages.appendChild(indicator);
    scrollToBottom();
    return indicator;
}

function removeTypingIndicator(indicator) {
    if (indicator && indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
    }
}

function generateAIResponse(userMessage) {
    // Placeholder response - replace with actual AI API integration
    const message = userMessage.toLowerCase();
    
    if (message.includes('bns') || message.includes('bharatiya nyaya sanhita')) {
        return "BNS (Bharatiya Nyaya Sanhita) is the new criminal code that replaced the IPC in India. It was enacted in 2023 and came into effect on July 1, 2024. Key changes include updated sections, modernized language, and new provisions. Would you like to know about a specific BNS section?";
    } else if (message.includes('ipc')) {
        return "IPC (Indian Penal Code) was the previous criminal code of India. It has been largely replaced by BNS (Bharatiya Nyaya Sanhita) as of July 1, 2024. However, many cases still reference IPC sections. What specific IPC section are you asking about?";
    } else if (message.includes('case') || message.includes('precedent')) {
        return "I can help you find relevant case law and precedents. To provide the most accurate information, please specify:\n1. The area of law (criminal, civil, family, etc.)\n2. The specific legal issue\n3. Any relevant sections (BNS/IPC/CrPC)\n\nThis will help me provide more targeted case law references.";
    } else if (message.includes('procedure') || message.includes('process')) {
        return "Legal procedures vary depending on the type of case and court. Common procedures include filing, service of notice, hearings, evidence submission, and judgment. Could you specify which procedure you need help with?";
    } else {
        return "Thank you for your question. I'm here to assist with legal queries related to BNS, IPC, case law, legal procedures, and case analysis. Could you provide more details about what you'd like to know? This will help me give you a more specific and useful answer.";
    }
}

function formatMessage(text) {
    // Convert newlines to <br> and escape HTML
    return escapeHtml(text).replace(/\n/g, '<br>');
}

function scrollToBottom() {
    const chatMessages = document.getElementById('aiChatMessages');
    if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

