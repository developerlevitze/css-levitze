// Fiumi Chatbot Widget JavaScript
(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        n8nWebhookUrl: 'https://levitze.app.n8n.cloud/webhook/a4257301-3fb9-4b9d-a965-1fa66f314696/chat', // Set to 'DEMO_MODE' for demo or replace with your actual n8n webhook URL
        botName: 'Emilia',
        welcomeMessage: 'Hola, gracias por contactarte con Fiumi Connect, tu aliado en contacto efectivo con clientes y usuarios.',
        placeholderText: 'Escribe un mensaje...',
        sendButtonText: '➤',
        toggleButtonText: 'Chat de ventas'
    };

    let isOpen = false;
    let isMinimized = false;
    let messageHistory = [];

    // Initialize the chatbot
    function initializeChatbot() {
        createToggleButton();
        setupChatWidget();
        setupEventListeners();
        addWelcomeMessage();
    }

    // Create toggle button
    function createToggleButton() {
        const toggleButton = document.getElementById('n8n-chatbot-toggle-button');
        if (toggleButton) {
            toggleButton.innerHTML = CONFIG.toggleButtonText;
            toggleButton.style.display = 'flex';
        }
    }

    // Setup chat widget structure
    function setupChatWidget() {
        const widget = document.getElementById('n8n-chatbot-widget');
        const header = document.getElementById('n8n-chat-header');
        
        if (header) {
            header.innerHTML = `
                <div class="header-content">
                    <div class="header-title">${CONFIG.botName}</div>
                    <div class="header-status">
                        <div class="status-dot"></div>
                        <span>Disponible ahora</span>
                    </div>
                </div>
                <div class="header-controls">
                    <button class="header-button close-button" id="n8n-close-chatbot"></button>
                </div>
            `;
        }

        const inputArea = document.getElementById('n8n-chat-input-area');
        if (inputArea) {
            inputArea.innerHTML = `
                <div class="input-row">
                    <input type="text" id="n8n-user-input" placeholder="${CONFIG.placeholderText}">
                    <button id="n8n-send-button"></button>
                </div>
                <div class="chat-footer">By Fiumi</div>
            `;
        }
    }

    // Add welcome message
    function addWelcomeMessage() {
        const messagesContainer = document.getElementById('n8n-chat-messages');
        if (messagesContainer && messagesContainer.children.length === 0) {
            const welcomeMsg = document.createElement('div');
            welcomeMsg.className = 'welcome-message';
            welcomeMsg.textContent = CONFIG.welcomeMessage;
            messagesContainer.appendChild(welcomeMsg);
        }
    }

    // Setup event listeners
    function setupEventListeners() {
        // Toggle button
        const toggleButton = document.getElementById('n8n-chatbot-toggle-button');
        if (toggleButton) {
            toggleButton.addEventListener('click', toggleChat);
        }

        // Close button
        const closeButton = document.getElementById('n8n-close-chatbot');
        if (closeButton) {
            closeButton.addEventListener('click', closeChat);
        }

        // Send button
        const sendButton = document.getElementById('n8n-send-button');
        if (sendButton) {
            sendButton.addEventListener('click', sendMessage);
        }

        // Input field
        const inputField = document.getElementById('n8n-user-input');
        if (inputField) {
            inputField.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    sendMessage();
                }
            });
        }

        // Outside click to close
        document.addEventListener('click', function(e) {
            const widget = document.getElementById('n8n-chatbot-widget');
            const toggleButton = document.getElementById('n8n-chatbot-toggle-button');
            
            if (isOpen && !widget.contains(e.target) && !toggleButton.contains(e.target)) {
                // Don't close on outside click - user needs to explicitly close
            }
        });
    }

    // Toggle chat visibility
    function toggleChat() {
        if (isOpen) {
            closeChat();
        } else {
            openChat();
        }
    }

    // Open chat
    function openChat() {
        const widget = document.getElementById('n8n-chatbot-widget');
        const toggleButton = document.getElementById('n8n-chatbot-toggle-button');
        
        if (widget && toggleButton) {
            widget.style.display = 'flex';
            widget.classList.add('slide-in');
            toggleButton.style.display = 'none';
            isOpen = true;
            isMinimized = false;
            
            // Focus input
            setTimeout(() => {
                const input = document.getElementById('n8n-user-input');
                if (input) input.focus();
            }, 300);
        }
    }

    // Close chat
    function closeChat() {
        const widget = document.getElementById('n8n-chatbot-widget');
        const toggleButton = document.getElementById('n8n-chatbot-toggle-button');
        
        if (widget && toggleButton) {
            widget.classList.add('slide-out');
            setTimeout(() => {
                widget.style.display = 'none';
                widget.classList.remove('slide-in', 'slide-out');
                toggleButton.style.display = 'flex';
                isOpen = false;
                isMinimized = false;
            }, 300);
        }
    }

    // Minimize chat
    function minimizeChat() {
        closeChat();
    }

    // Send message
    async function sendMessage() {
        const input = document.getElementById('n8n-user-input');
        const message = input.value.trim();

        if (!message) return;

        // Añadir mensaje del usuario al chat
        addMessageToChat(message, 'user');

        // Limpiar el input
        input.value = '';

        // Mostrar indicador de escritura
        showTypingIndicator();

        // Simular un retraso realista de escritura (1-3 segundos)
        const typingDelay = Math.random() * 2000 + 1000;

        try {
            // Esperar el retraso mínimo de escritura antes de mostrar la respuesta
            const [response] = await Promise.all([
                sendToN8N(message),
                new Promise(resolve => setTimeout(resolve, typingDelay))
            ]);

            hideTypingIndicator();

            if (response && response.output) {
                addMessageToChat(response.output, 'bot');
            } else {
                addMessageToChat('Lo siento, hubo un problema con mi respuesta. ¿Podrías intentar de nuevo?', 'bot');
            }
        } catch (error) {
            console.error('Error al enviar el mensaje:', error);

            // Esperar el retraso de escritura incluso en caso de error para una experiencia realista
            setTimeout(() => {
                hideTypingIndicator();
                addMessageToChat('Lo siento, no puedo responder en este momento. Por favor, intenta más tarde.', 'bot');
            }, typingDelay);
        }
    }

    // Add message to chat
    function addMessageToChat(message, sender) {
        const messagesContainer = document.getElementById('n8n-chat-messages');
        if (!messagesContainer) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        // Add sender label for bot messages
        if (sender === 'bot') {
            const senderLabel = document.createElement('div');
            senderLabel.className = 'message-sender';
            senderLabel.textContent = 'Emilia';
            messageDiv.appendChild(senderLabel);
        }
        
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'message-bubble';
        bubbleDiv.textContent = message;
        
        messageDiv.appendChild(bubbleDiv);
        messagesContainer.appendChild(messageDiv);
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Store in history
        messageHistory.push({ message, sender, timestamp: new Date() });
    }

    // Show typing indicator
    function showTypingIndicator() {
        const messagesContainer = document.getElementById('n8n-chat-messages');
        if (!messagesContainer) return;

        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator';
        typingDiv.id = 'typing-indicator';
        
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('div');
            dot.className = 'typing-dot';
            typingDiv.appendChild(dot);
        }
        
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Hide typing indicator
    function hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    // Send message to n8n webhook
    async function sendToN8N(message) {
        const response = await fetch(CONFIG.n8nWebhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                timestamp: new Date().toISOString(),
                sessionId: getSessionId()
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Validar que la respuesta contiene el campo "output"
        if (!data.output) {
            throw new Error('La respuesta del webhook no contiene el campo "output"');
        }

        return data;
    }

    // Get or create session ID
    function getSessionId() {
        let sessionId = localStorage.getItem('fiumi-chat-session');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('fiumi-chat-session', sessionId);
        }
        return sessionId;
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeChatbot);
    } else {
        initializeChatbot();
    }

    // Auto-open chat when page loads
    setTimeout(() => {
        openChat();
    }, 1000); // Wait 1 second after page load for better UX
    // Expose global functions if needed
    window.FiumiChatbot = {
        open: openChat,
        close: closeChat,
        sendMessage: function(message) {
            const input = document.getElementById('n8n-user-input');
            if (input) {
                input.value = message;
                sendMessage();
            }
        },
        getHistory: function() {
            return messageHistory;
        },
        clearHistory: function() {
            messageHistory = [];
            const messagesContainer = document.getElementById('n8n-chat-messages');
            if (messagesContainer) {
                messagesContainer.innerHTML = '';
                addWelcomeMessage();
            }
        }
    };

})();