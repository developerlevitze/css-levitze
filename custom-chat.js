// custom-chat.js

const chatWidget = document.getElementById('n8n-chatbot-widget');
const toggleButton = document.getElementById('n8n-chatbot-toggle-button');
const closeButton = document.getElementById('n8n-close-chatbot');
const chatMessages = document.getElementById('n8n-chat-messages');
const userInput = document.getElementById('n8n-user-input');
const sendButton = document.getElementById('n8n-send-button');

const N8N_CHATBOT_ENDPOINT = 'https://levitze-n8n.zlrp4i.easypanel.host/webhook/09717355-cf53-47ac-85d4-400eb3be23b7/chat';

let userIp = null;
let sessionId = null;

// NUEVAS VARIABLES PARA POLLING DE AGENTES
let lastAgentMessageId = null;
let isPolling = false;
let pollingInterval = null;
const agentCheckUrl = 'https://levitze-n8n.zlrp4i.easypanel.host/webhook-test/check-agent-messages';

// Función para cargar un script externo
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve(script);
    script.onerror = () => reject(new Error(`Script load error for ${src}`));
    document.head.appendChild(script);
  });
}

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

// NUEVA FUNCIÓN: Polling para mensajes del agente
function startAgentPolling() {
    // Solo hace polling cuando hay una sesión activa y el chat está abierto
    pollingInterval = setInterval(() => {
        if (sessionId && !isPolling && chatWidget.classList.contains('open')) {
            checkAgentMessages();
        }
    }, 3000); // Cada 3 segundos - muy ligero
}

// NUEVA FUNCIÓN: Verificar mensajes del agente
async function checkAgentMessages() {
    if (!sessionId) return;
    
    isPolling = true;
    try {
        const response = await fetch(`${agentCheckUrl}?sessionId=${sessionId}&lastMessageId=${lastAgentMessageId || 0}`);
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.hasNewMessages && data.messages) {
                data.messages.forEach(message => {
                    addMessage(message.content, 'agent', message.agentName);
                    lastAgentMessageId = message.id;
                });
            }
        }
    } catch (error) {
        console.error('Error checking agent messages:', error);
    } finally {
        isPolling = false;
    }
}

// NUEVA FUNCIÓN: Limpiar polling
function stopAgentPolling() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
    }
}

// Función para ocultar completamente el botón
function hideToggleButton() {
    if (!toggleButton) return;
    
    // SOLO neutralizar elementos de TranslatePress cuando el chat esté abierto
    const trpElements = document.querySelectorAll('#trp-floater-ls, [id*="trp-"], [class*="trp-"]');
    trpElements.forEach(element => {
        // Solo ocultar temporalmente, no cambiar position
        element.style.display = 'none !important';
        element.style.visibility = 'hidden !important';
        element.style.opacity = '0';
        element.style.zIndex = '-1';
    });
    
    // Remover todas las clases que puedan estar interfiriendo
    toggleButton.className = '';
    toggleButton.classList.add('hidden');
    
    // Aplicar estilos inline con máxima prioridad
    toggleButton.setAttribute('style', `
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
        transform: scale(0) !important;
        position: absolute !important;
        left: -99999px !important;
        top: -99999px !important;
        width: 0px !important;
        height: 0px !important;
        z-index: -1 !important;
        isolation: isolate !important;
    `);
    
    // Método nuclear: eliminar completamente del flujo del documento
    toggleButton.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important; position: absolute !important; left: -999999px !important; top: -999999px !important; width: 0px !important; height: 0px !important; z-index: -9999 !important; pointer-events: none !important; transform: scale(0) !important; isolation: isolate !important; contain: layout style paint !important;';
    
    // Forzar reflow para asegurar que se apliquen los cambios
    toggleButton.offsetHeight;
}

// Función para mostrar el botón
function showToggleButton() {
    if (!toggleButton) return;
    
    // RESTAURAR elementos de TranslatePress cuando se cierra el chat
    const trpElements = document.querySelectorAll('#trp-floater-ls, [id*="trp-"], [class*="trp-"]');
    trpElements.forEach(element => {
        // Restaurar a su estado original (NO cambiar position)
        element.style.display = '';
        element.style.visibility = '';
        element.style.opacity = '';
        element.style.zIndex = '';
    });
    
    toggleButton.classList.remove('hidden');
    toggleButton.setAttribute('style', `
        display: flex !important;
        visibility: visible !important;
        opacity: 1 !important;
        pointer-events: auto !important;
        transform: scale(1) !important;
        position: fixed !important;
        bottom: 25px !important;
        right: 25px !important;
        width: 64px !important;
        height: 64px !important;
        z-index: 9999999 !important;
        isolation: isolate !important;
    `);
}

// Función que se ejecuta periódicamente para mantener el botón oculto cuando el chat está abierto
function enforceButtonVisibility() {
    if (chatWidget && chatWidget.classList.contains('open')) {
        hideToggleButton();
    }
}

// Ejecutar la función cada 50ms para una respuesta más rápida contra interferencias
setInterval(enforceButtonVisibility, 50);

// Abrir/cerrar el chatbot
toggleButton.addEventListener('click', async () => {
    chatWidget.classList.toggle('open');
    
    if (chatWidget.classList.contains('open')) {
        hideToggleButton();
        userInput.focus();
        if (!sessionId) {
            await getUserIpAndSessionId();
        }
        // INICIAR POLLING CUANDO SE ABRE EL CHAT
        startAgentPolling();
    } else {
        showToggleButton();
        // DETENER POLLING CUANDO SE CIERRA EL CHAT
        stopAgentPolling();
    }
});

closeButton.addEventListener('click', () => {
    chatWidget.classList.remove('open');
    showToggleButton();
    // DETENER POLLING CUANDO SE CIERRA EL CHAT
    stopAgentPolling();
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

// FUNCIÓN MODIFICADA: addMessage ahora maneja diferentes tipos de mensajes
function addMessage(text, sender, agentName = null) {
    const messageElement = document.createElement('div');
    
    if (sender === 'agent') {
        messageElement.classList.add('n8n-message', 'agent');
        
        // Formato Markdown simple: negrita y saltos de línea
        let formatted = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // negrita
            .replace(/\*(.*?)\*/g, '<em>$1</em>') // cursiva
            .replace(/\n/g, '<br>'); // saltos de línea

        messageElement.innerHTML = `
            <div class="agent-info">
                <span class="agent-name">${agentName || 'Agente'}</span>
                <span class="agent-badge">👤</span>
            </div>
            <div class="message-content">${formatted}</div>
        `;
    } else {
        messageElement.classList.add('n8n-message', sender);

        // Formato Markdown simple: negrita y saltos de línea
        let formatted = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // negrita
            .replace(/\*(.*?)\*/g, '<em>$1</em>') // cursiva
            .replace(/\n/g, '<br>'); // saltos de línea

        messageElement.innerHTML = formatted;
    }
    
    chatMessages.appendChild(messageElement);
    
    // Scroll suave al final
    setTimeout(() => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 100);
}

function showTypingIndicator() {
    removeTypingIndicator(); // Por si acaso hay uno previo
    const typingElement = document.createElement('div');
    typingElement.classList.add('n8n-message', 'bot');
    typingElement.id = 'typing-indicator';
    typingElement.innerHTML = `
      <span class="typing-dots">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </span>
    `;
    chatMessages.appendChild(typingElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Mensaje de bienvenida inicial del bot
// Asegúrate de que esta función sea `async`
async function initializeChat() {
    // Si el chat no tiene mensajes, agrega el mensaje de bienvenida
    if (chatMessages.children.length === 0) {
        setTimeout(() => {
            addMessage('¡Hola! Bienvenido a Levitze, donde creamos Chatbots para prospectar y atender tus cliente 24/7. Dime, ¿qué ideas tienes en mente para maximizar cada visita a tu sitio web?', 'bot');
        }, 500);
    }
    
    try {
        // Carga el SDK de Pusher de forma dinámica
        await loadScript('https://js.pusher.com/8.4.0/pusher.min.js');
        
        // Configura Pusher y el listener del canal
        const pusher = new Pusher('03e724d8990b117971d1', {
            cluster: 'us2'
        });
        
        // Obtenemos el sessionId antes de suscribirnos al canal
        if (!sessionId) {
            await getUserIpAndSessionId();
        }
        
        const channel = pusher.subscribe(`chat-session-${sessionId}`);
        
        // Bindea la función para recibir nuevos mensajes
        channel.bind('new-message', function(data) {
            addMessage(data.message, 'bot');
        });

    } catch (error) {
        console.error('Error al iniciar el chat:', error);
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

// Abrir el chat automáticamente al cargar la página (solo en escritorio)
document.addEventListener('DOMContentLoaded', function() {
    // Solo abrir automáticamente en pantallas grandes (escritorio)
    if (window.innerWidth > 480) {
        setTimeout(() => {
            chatWidget.classList.add('open');
            hideToggleButton();
            // INICIAR POLLING AL ABRIR AUTOMÁTICAMENTE
            startAgentPolling();
        }, 0);
    }
});

// LIMPIEZA AL SALIR DE LA PÁGINA
window.addEventListener('beforeunload', () => {
    stopAgentPolling();
});