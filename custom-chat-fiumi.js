// custom-chat.js

const chatWidget = document.getElementById('n8n-chatbot-widget');
const toggleButton = document.getElementById('n8n-chatbot-toggle-button');
const closeButton = document.getElementById('n8n-close-chatbot');
const chatMessages = document.getElementById('n8n-chat-messages');
const userInput = document.getElementById('n8n-user-input');
const sendButton = document.getElementById('n8n-send-button');

const N8N_CHATBOT_ENDPOINT = 'https://levitze.app.n8n.cloud/webhook/a4257301-3fb9-4b9d-a965-1fa66f314696/chat';

let userIp = null;
let sessionId = null;

async function getUserIpAndSessionId() {
    try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        userIp = data.ip;
        // Session ID: IP + timestamp
        sessionId = `${userIp}-${Date.now()}`;
    } catch (e) {
        // Si falla, solo usa timestamp
        sessionId = `unknown-${Date.now()}`;
    }
}

// Abrir/cerrar el chatbot
toggleButton.addEventListener('click', async () => {
    chatWidget.classList.toggle('open');
    toggleButton.style.display = chatWidget.classList.contains('open') ? 'none' : 'flex';
    if (chatWidget.classList.contains('open')) {
        userInput.focus();
        if (!sessionId) {
            await getUserIpAndSessionId();
        }
    }
});

closeButton.addEventListener('click', () => {
    chatWidget.classList.remove('open');
    toggleButton.style.display = 'flex';
});

// Envío de mensajes
sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    // Añadir mensaje del usuario
    addMessage(message, 'user');
    userInput.value = '';

    // Mostrar indicador de escritura
    showTypingIndicator();

    // Si no hay sessionId, obtenerlo
    if (!sessionId) {
        await getUserIpAndSessionId();
    }

    try {
        const response = await fetch(N8N_CHATBOT_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, sessionId })
        });

        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

        const data = await response.json();

        // Eliminar el indicador de escritura
        removeTypingIndicator();

        // Añadir respuesta del bot con un pequeño delay para mejor UX
        setTimeout(() => {
            addMessage(data.output, 'bot');
        }, 300);

    } catch (error) {
        removeTypingIndicator();
        console.error('Error al comunicarse con el chatbot:', error);
        addMessage('Lo siento, no pude procesar tu solicitud en este momento. Intenta de nuevo más tarde.', 'bot');
    }
}

// Agregar "Disponible ahora" y "Emilia" en cada mensaje del bot
function addMessage(text, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('n8n-message', sender);

    if (sender === 'bot') {
        const botHeader = document.createElement('div');
        botHeader.classList.add('bot-header');
        botHeader.innerHTML = '<span class="bot-name">Emilia</span> <span class="bot-status">Disponible ahora</span>';
        messageElement.appendChild(botHeader);
    }

    // Formato Markdown simple: negrita y saltos de línea
    let formatted = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // negrita
        .replace(/\*(.*?)\*/g, '<em>$1</em>') // cursiva
        .replace(/\n/g, '<br>'); // saltos de línea

    const messageContent = document.createElement('div');
    messageContent.classList.add('message-content');
    messageContent.innerHTML = formatted;
    messageElement.appendChild(messageContent);

    chatMessages.appendChild(messageElement);

    // Scroll suave al final
    setTimeout(() => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 100);
}

// Mostrar botón "X" para cerrar el chat
closeButton.style.display = 'block';
closeButton.innerHTML = '✖';
closeButton.classList.add('close-button');

// Cerrar el chat al hacer clic fuera
function closeChatOnOutsideClick() {
    document.addEventListener('click', function(e) {
        if (!chatWidget.contains(e.target) && !toggleButton.contains(e.target)) {
            chatWidget.classList.remove('open');
            toggleButton.style.display = 'flex';
        }
    });
}
closeChatOnOutsideClick();

// Ajustar posición de los mensajes
chatMessages.style.padding = '10px';
chatMessages.style.margin = '0 auto';
chatMessages.style.maxWidth = '90%';

// Mensaje de bienvenida inicial del bot
function initializeChat() {
    if (chatMessages.children.length === 0) {
        setTimeout(() => {
            addMessage('👋 ¡Hola, gracias por contactarte con Fiumi Connect, soy Emilia, cuéntame ¿En que te podemos apoyar hoy?', 'bot');        }, 500);
    }
}

// Inicializar el chat cuando se carga la página
document.addEventListener('DOMContentLoaded', initializeChat);

// Mejorar la experiencia de usuario
userInput.addEventListener('input', function() {
    // Auto-resize del input si es necesario
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 100) + 'px';
});

// Prevenir que se cierre el chat al hacer clic dentro
chatWidget.addEventListener('click', function(e) {
    e.stopPropagation();
});

// Cerrar el chat al hacer clic fuera (opcional)
document.addEventListener('click', function(e) {
    if (!chatWidget.contains(e.target) && !toggleButton.contains(e.target)) {
        // Opcional: descomentar para cerrar al hacer clic fuera
        // chatWidget.classList.remove('open');
        // toggleButton.style.display = 'flex';
    }
});

// Abrir el chat automáticamente al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    chatWidget.classList.add('open');
    if (toggleButton) toggleButton.style.display = 'none';
});