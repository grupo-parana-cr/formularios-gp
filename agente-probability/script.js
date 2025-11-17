const WEBHOOK_URL = 'https://grupoparana-n8n.qkcade.easypanel.host/webhook-test/agente-probability';
const chatArea = document.getElementById('chatArea');
const inputField = document.getElementById('inputField');
const sendBtn = document.getElementById('sendBtn');
const conversationsList = document.getElementById('conversationsList');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

let currentConversationId = null;
let conversations = {};
let currentMessages = [];
let isLoading = false;

// Inicializar tema
const savedTheme = localStorage.getItem('theme') || 'light';
if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
}

// Carregar dados
loadConversationsFromStorage();
startNewConversation();

// Event listeners
inputField.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !isLoading) {
        sendMessage();
    }
});

// Auto-resize textarea
inputField.addEventListener('input', () => {
    inputField.style.height = 'auto';
    inputField.style.height = Math.min(inputField.scrollHeight, 100) + 'px';
});

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function loadConversationsFromStorage() {
    const saved = localStorage.getItem('conversations');
    if (saved) {
        conversations = JSON.parse(saved);
    }
}

function saveConversationsToStorage() {
    localStorage.setItem('conversations', JSON.stringify(conversations));
}

function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeIcon();
}

function updateThemeIcon() {
    const isDark = document.body.classList.contains('dark-theme');
    const icon = document.querySelector('.theme-icon');
    if (icon) icon.textContent = isDark ? '☀️' : '🌙';
}

function toggleSidebar() {
    sidebar.classList.toggle('open');
    sidebarOverlay.classList.toggle('open');
}

function closeSidebar() {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('open');
}

function startNewConversation() {
    currentConversationId = generateId();
    currentMessages = [];
    conversations[currentConversationId] = {
        id: currentConversationId,
        title: 'Nova conversa',
        messages: [],
        timestamp: new Date().toISOString()
    };
    
    chatArea.innerHTML = `
        <div class="empty-state">
            <div class="robot-icon">🤖</div>
            <h2>Bem-vindo ao Agente de Análise</h2>
            <p>Faça uma pergunta para começar a análise com distribuição de probabilidades</p>
        </div>
    `;
    
    inputField.value = '';
    inputField.style.height = 'auto';
    inputField.disabled = false;
    sendBtn.disabled = false;
    isLoading = false;
    
    saveConversationsToStorage();
    renderConversationsList();
    closeSidebar();
}

function loadConversation(id) {
    if (!conversations[id]) return;
    
    currentConversationId = id;
    const conv = conversations[id];
    currentMessages = [...conv.messages];
    
    renderChatMessages();
    renderConversationsList();
    closeSidebar();
}

function renderConversationsList() {
    conversationsList.innerHTML = '';
    
    Object.values(conversations)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .forEach(conv => {
            const item = document.createElement('div');
            item.className = `conversation-item ${conv.id === currentConversationId ? 'active' : ''}`;
            
            const title = document.createElement('span');
            title.className = 'conversation-title';
            title.textContent = conv.title;
            title.onclick = () => loadConversation(conv.id);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'conversation-delete';
            deleteBtn.textContent = '🗑️';
            deleteBtn.onclick = (e) => deleteConversation(conv.id, e);
            
            item.appendChild(title);
            item.appendChild(deleteBtn);
            conversationsList.appendChild(item);
        });
    
    updateThemeIcon();
}

function deleteConversation(id, event) {
    event.stopPropagation();
    delete conversations[id];
    saveConversationsToStorage();
    
    if (currentConversationId === id) {
        startNewConversation();
    } else {
        renderConversationsList();
    }
}

function sendMessage() {
    const message = inputField.value.trim();
    if (!message || isLoading) return;

    if (chatArea.innerHTML.includes('empty-state')) {
        chatArea.innerHTML = '';
    }

    addMessage(message, 'user');
    inputField.value = '';
    inputField.style.height = 'auto';
    inputField.disabled = true;
    sendBtn.disabled = true;
    isLoading = true;

    // Salvar mensagem do usuário
    currentMessages.push({
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
    });

    // Preparar histórico para o n8n
    const historyContext = currentMessages
        .map((msg) => `${msg.role === 'user' ? 'Usuário' : 'Agente'}: ${msg.content}`)
        .join('\n\n');

    addLoading();

    fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            question: message,
            num_respostas: 5,
            historico: historyContext,
            conversation_id: currentConversationId
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        removeLoadingIfExists();
        displayResponse(data, message);
    })
    .catch(error => {
        console.error('Erro:', error);
        removeLoadingIfExists();
        addMessage(`❌ Erro ao conectar: ${error.message}`, 'error');
    })
    .finally(() => {
        inputField.disabled = false;
        sendBtn.disabled = false;
        isLoading = false;
        inputField.focus();
    });
}

function addMessage(text, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    
    if (type === 'error') {
        messageDiv.innerHTML = `<div class="message-content"><div class="error-message">${escapeHtml(text)}</div></div>`;
    } else {
        messageDiv.innerHTML = `<div class="message-content">${escapeHtml(text)}</div>`;
    }
    
    chatArea.appendChild(messageDiv);
    chatArea.scrollTop = chatArea.scrollHeight;
}

function addLoading() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message assistant-message';
    messageDiv.id = 'loading-message';
    messageDiv.innerHTML = `
        <div class="message-content">
            <div class="loading">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
            </div>
        </div>
    `;
    chatArea.appendChild(messageDiv);
    chatArea.scrollTop = chatArea.scrollHeight;
}

function removeLoadingIfExists() {
    const loadingMsg = document.getElementById('loading-message');
    if (loadingMsg) loadingMsg.remove();
}

function displayResponse(data, originalQuestion) {
    let responseText = '';
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message assistant-message';
    let html = '';

    if (data.respostas && data.respostas.length > 0) {
        data.respostas.forEach((resposta, index) => {
            const prob = typeof resposta.probabilidade === 'number' 
                ? resposta.probabilidade.toFixed(2)
                : parseFloat(resposta.probabilidade).toFixed(2);
            
            html += `
                <div class="response-item">
                    <div class="response-number">Resposta ${index + 1}: ${escapeHtml(resposta.titulo || 'Resposta')}</div>
                    <div class="response-text">${escapeHtml(resposta.texto)}</div>
                    <div class="probability-badge">Probabilidade: ${prob}</div>
                </div>
            `;
            
            responseText += `Resposta ${index + 1}: ${resposta.titulo || 'Resposta'} - ${prob}\n`;
        });
    }

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.innerHTML = html;
    messageDiv.appendChild(messageContent);
    
    chatArea.appendChild(messageDiv);
    chatArea.scrollTop = chatArea.scrollHeight;

    // Salvar mensagem do agente
    currentMessages.push({
        role: 'assistant',
        content: responseText.trim(),
        timestamp: new Date().toISOString()
    });

    // Atualizar título da conversa baseado na primeira pergunta
    if (conversations[currentConversationId].messages.length === 0) {
        const title = originalQuestion.substring(0, 40) + (originalQuestion.length > 40 ? '...' : '');
        conversations[currentConversationId].title = title;
    }

    conversations[currentConversationId].messages = [...currentMessages];
    conversations[currentConversationId].timestamp = new Date().toISOString();
    
    saveConversationsToStorage();
    renderConversationsList();
}

function renderChatMessages() {
    chatArea.innerHTML = '';
    
    if (currentMessages.length === 0) {
        chatArea.innerHTML = `
            <div class="empty-state">
                <div class="robot-icon">🤖</div>
                <h2>Bem-vindo ao Agente de Análise</h2>
                <p>Faça uma pergunta para começar a análise com distribuição de probabilidades</p>
            </div>
        `;
        return;
    }

    currentMessages.forEach(msg => {
        if (msg.role === 'user') {
            addMessage(msg.content, 'user');
        } else {
            const div = document.createElement('div');
            div.className = 'message assistant-message';
            
            const lines = msg.content.split('\n').filter(l => l.trim());
            let html = '';
            
            lines.forEach((line) => {
                if (line.startsWith('Resposta')) {
                    const parts = line.match(/Resposta (\d+): (.*) - ([\d.]+)/);
                    if (parts) {
                        html += `
                            <div class="response-item">
                                <div class="response-number">Resposta ${parts[1]}: ${escapeHtml(parts[2])}</div>
                                <div class="probability-badge">Probabilidade: ${parts[3]}</div>
                            </div>
                        `;
                    }
                }
            });
            
            const messageContent = document.createElement('div');
            messageContent.className = 'message-content';
            messageContent.innerHTML = html || escapeHtml(msg.content);
            div.appendChild(messageContent);
            chatArea.appendChild(div);
        }
    });

    chatArea.scrollTop = chatArea.scrollHeight;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
