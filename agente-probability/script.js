const WEBHOOK_URL = 'https://grupoparana-n8n.qkcade.easypanel.host/webhook-test/agente-probability';
const chatArea = document.getElementById('chatArea');
const inputField = document.getElementById('inputField');
const sendBtn = document.getElementById('sendBtn');
const conversationsList = document.getElementById('conversationsList');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');

let currentConversationId = null;
let conversations = {};
let currentMessages = [];
let isLoading = false;

// Init
const savedTheme = localStorage.getItem('theme') || 'light';
if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
}

loadConversationsFromStorage();
loadLastConversation();

inputField.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !isLoading) sendMessage();
});

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function loadConversationsFromStorage() {
    const saved = localStorage.getItem('conversations');
    if (saved) {
        try {
            conversations = JSON.parse(saved);
        } catch (e) {
            conversations = {};
        }
    }
}

function saveConversationsToStorage() {
    localStorage.setItem('conversations', JSON.stringify(conversations));
}

function loadLastConversation() {
    const lastConvId = localStorage.getItem('lastConversationId');
    
    if (lastConvId && conversations[lastConvId]) {
        currentConversationId = lastConvId;
        currentMessages = conversations[lastConvId].messages ? [...conversations[lastConvId].messages] : [];
    } else {
        currentConversationId = generateId();
        currentMessages = [];
        conversations[currentConversationId] = {
            id: currentConversationId,
            title: 'Nova conversa',
            messages: [],
            timestamp: new Date().toISOString()
        };
        saveConversationsToStorage();
        localStorage.setItem('lastConversationId', currentConversationId);
    }
    
    renderChatMessages();
    renderConversationsList();
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
    overlay.classList.toggle('open');
}

function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
}

function startNewConversation() {
    // Salvar conversa atual ANTES de criar nova
    if (currentConversationId && conversations[currentConversationId]) {
        conversations[currentConversationId].messages = currentMessages;
        conversations[currentConversationId].timestamp = new Date().toISOString();
        saveConversationsToStorage();
    }

    // Criar nova conversa
    const newId = generateId();
    currentConversationId = newId;
    currentMessages = [];
    conversations[newId] = {
        id: newId,
        title: 'Nova conversa',
        messages: [],
        timestamp: new Date().toISOString()
    };
    
    saveConversationsToStorage();
    localStorage.setItem('lastConversationId', newId);
    
    renderChatMessages();
    renderConversationsList();
    closeSidebar();
}

function loadConversation(id) {
    // Não fazer nada se já é a conversa atual
    if (id === currentConversationId) {
        renderConversationsList();
        return;
    }
    
    // Salvar conversa ATUAL antes de trocar
    if (conversations[currentConversationId]) {
        conversations[currentConversationId].messages = currentMessages;
        conversations[currentConversationId].timestamp = new Date().toISOString();
        saveConversationsToStorage();
    }

    // Carregar NOVA conversa
    if (conversations[id]) {
        currentConversationId = id;
        currentMessages = conversations[id].messages ? [...conversations[id].messages] : [];
        localStorage.setItem('lastConversationId', id);
        
        renderChatMessages();
        renderConversationsList();
        closeSidebar();
    }
}

function renderConversationsList() {
    conversationsList.innerHTML = '';
    
    const sorted = Object.values(conversations).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    sorted.forEach(conv => {
        const item = document.createElement('div');
        const isActive = conv.id === currentConversationId;
        item.className = `conversation-item ${isActive ? 'active' : ''}`;
        
        const title = document.createElement('span');
        title.className = 'conversation-title';
        title.textContent = conv.title;
        title.style.cursor = 'pointer';
        title.onclick = (e) => {
            e.stopPropagation();
            loadConversation(conv.id);
        };
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'conversation-delete';
        deleteBtn.textContent = '🗑️';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deleteConversation(conv.id);
        };
        
        item.appendChild(title);
        item.appendChild(deleteBtn);
        conversationsList.appendChild(item);
    });
    
    updateThemeIcon();
}

function deleteConversation(id) {
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
    inputField.disabled = true;
    sendBtn.disabled = true;
    isLoading = true;

    currentMessages.push({
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
    });

    const historyContext = currentMessages
        .map((msg) => `${msg.role === 'user' ? 'Usuário' : 'Agente'}: ${msg.content}`)
        .join('\n\n');

    addLoading();

    fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            question: message,
            num_respostas: 5,
            historico: historyContext,
            conversation_id: currentConversationId
        })
    })
    .then(r => r.json())
    .then(data => {
        removeLoadingIfExists();
        displayResponse(data, message);
    })
    .catch(error => {
        removeLoadingIfExists();
        addMessage(`❌ Erro: ${error.message}`, 'error');
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
    messageDiv.innerHTML = `<div class="message-content">${escapeHtml(text)}</div>`;
    chatArea.appendChild(messageDiv);
    chatArea.scrollTop = chatArea.scrollHeight;
}

function addLoading() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message assistant-message';
    messageDiv.id = 'loading-message';
    messageDiv.innerHTML = `<div class="loading"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>`;
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
                    <div class="response-number">Resposta ${index + 1}: ${escapeHtml(resposta.titulo)}</div>
                    <div class="response-text">${escapeHtml(resposta.texto)}</div>
                    <div class="probability-badge">Probabilidade: ${prob}</div>
                </div>
            `;
            
            responseText += `Resposta ${index + 1}: ${resposta.titulo} - ${prob}\n`;
        });
    }

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.innerHTML = html;
    messageDiv.appendChild(messageContent);
    
    chatArea.appendChild(messageDiv);
    chatArea.scrollTop = chatArea.scrollHeight;

    currentMessages.push({
        role: 'assistant',
        content: responseText.trim(),
        timestamp: new Date().toISOString()
    });

    // Atualizar título se primeira resposta
    if (conversations[currentConversationId].messages.length === 0) {
        const title = originalQuestion.substring(0, 40) + (originalQuestion.length > 40 ? '...' : '');
        conversations[currentConversationId].title = title;
    }

    // Salvar
    conversations[currentConversationId].messages = currentMessages;
    conversations[currentConversationId].timestamp = new Date().toISOString();
    saveConversationsToStorage();
    
    // Atualizar lista
    renderConversationsList();
}

function renderChatMessages() {
    chatArea.innerHTML = '';
    
    if (!currentMessages || currentMessages.length === 0) {
        chatArea.innerHTML = `
            <div class="empty-state">
                <div class="robot-icon">🤖</div>
                <h1>Agente de Análise</h1>
                <p>Faça uma pergunta para começar</p>
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
            messageContent.innerHTML = html;
            div.appendChild(messageContent);
            chatArea.appendChild(div);
        }
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
