// custom-chat.js

const chatWidget = document.getElementById('n8n-chatbot-widget');
const toggleButton = document.getElementById('n8n-chatbot-toggle-button');
const closeButton = document.getElementById('n8n-close-chatbot');
const chatMessages = document.getElementById('n8n-chat-messages');
const userInput = document.getElementById('n8n-user-input');
const sendButton = document.getElementById('n8n-send-button');

const N8N_CHATBOT_ENDPOINT = 'https://levitze.app.n8n.cloud/webhook/a4257301-3fb9-4b9d-a965-1fa66f314696/chat';

// Abrir/cerrar el chatbot
toggleButton.addEventListener('click', () => {
    chatWidget.classList.toggle('open');
    toggleButton.style.display = chatWidget.classList.contains('open') ? 'none' : 'flex';
    if (chatWidget.classList.contains('open')) userInput.focus();
});

closeButton.addEventListener('click', () => {
    chatWidget.classList.remove('open');
    toggleButton.style.display = 'flex';
});

// Envío de mensajes
sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') sendMessage();
});

async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    addMessage(message, 'user');
    userInput.value = '';

    // Mostrar "escribiendo..." como mensaje del bot
    showTypingIndicator();

    try {
        const response = await fetch(N8N_CHATBOT_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });

        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

        const data = await response.json();

        // Eliminar el mensaje "escribiendo..." antes de mostrar la respuesta
        removeTypingIndicator();

        addMessage(data.output, 'bot');
    } catch (error) {
        removeTypingIndicator();
        console.error('Error al comunicarse con el chatbot:', error);
        addMessage('Lo siento, no pude procesar tu solicitud en este momento. Intenta de nuevo más tarde.', 'bot');
    }
}

function addMessage(text, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('n8n-message', sender);

    // Formato Markdown simple: negrita y saltos de línea
    let formatted = text
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') // negrita
        .replace(/\n/g, '<br>'); // saltos de línea

    messageElement.innerHTML = formatted;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTypingIndicator() {
    removeTypingIndicator(); // Por si acaso hay uno previo
    const typingElement = document.createElement('div');
    typingElement.classList.add('n8n-message', 'bot');
    typingElement.id = 'typing-indicator';
    typingElement.innerHTML = '<i>Escribiendo...</i>';
    chatMessages.appendChild(typingElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) typingIndicator.remove();
}

// Mensaje de bienvenida inicial del bot
if (chatMessages.children.length === 0) {
    addMessage('¡Hola! Soy un asistente especializado de Levitze. ¿Cómo puedo ayudarte hoy?', 'bot');
}