const WEBHOOK_URL = 'https://grupoparana-n8n.qkcade.easypanel.host/webhook-test/agente-probability';
const chatArea = document.getElementById('chatArea');
const inputField = document.getElementById('inputField');
const sendBtn = document.getElementById('sendBtn');
const conversationsList = document.getElementById('conversationsList');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');

let currentChatId = null;
let allChats = {};
let isLoading = false;

const theme = localStorage.getItem('theme') || 'light';
if (theme === 'dark') document.body.classList.add('dark-theme');

init();

function init() {
    const saved = localStorage.getItem('allChats');
    allChats = saved ? JSON.parse(saved) : {};
    renderChatList();
    renderChatArea();
}

function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    document.querySelector('.theme-icon').textContent = isDark ? '☀️' : '🌙';
}

function toggleSidebar() {
    sidebar.classList.toggle('collapsed');
}

function closeSidebar() {
    // Não precisa mais
}

function startNewChat() {
    currentChatId = null;
    renderChatArea();
    renderChatList();
    updateHeaderTitle();
    closeSidebar();
}

function selectChat(id) {
    currentChatId = id;
    renderChatArea();
    renderChatList();
    updateHeaderTitle();
    closeSidebar();
}

function deleteChat(id) {
    delete allChats[id];
    saveChats();
    if (currentChatId === id) {
        currentChatId = null;
    }
    renderChatList();
    renderChatArea();
}

function saveChats() {
    localStorage.setItem('allChats', JSON.stringify(allChats));
}

function updateHeaderTitle() {
    const titleEl = document.getElementById('currentChatTitle');
    if (currentChatId && allChats[currentChatId]) {
        titleEl.textContent = allChats[currentChatId].title;
    } else {
        titleEl.textContent = '';
    }
}

function renderChatList() {
    conversationsList.innerHTML = '';
    const sorted = Object.values(allChats)
        .sort((a, b) => new Date(b.created) - new Date(a.created));
    
    sorted.forEach(chat => {
        const item = document.createElement('div');
        item.className = `conversation-item ${chat.id === currentChatId ? 'active' : ''}`;
        
        const title = document.createElement('span');
        title.className = 'conversation-title';
        title.textContent = chat.title;
        title.onclick = () => selectChat(chat.id);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'conversation-delete';
        deleteBtn.textContent = '🗑️';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deleteChat(chat.id);
        };
        
        item.appendChild(title);
        item.appendChild(deleteBtn);
        conversationsList.appendChild(item);
    });
    
    updateHeaderTitle();
}

function renderChatArea() {
    chatArea.innerHTML = '';
    
    if (!currentChatId) {
        chatArea.innerHTML = `
            <div class="empty-state">
                <div class="robot-icon">🤖</div>
                <h1>Agente de Análise</h1>
                <p>No que você está pensando hoje?</p>
            </div>
        `;
        return;
    }
    
    const chat = allChats[currentChatId];
    if (!chat || !chat.messages || chat.messages.length === 0) {
        chatArea.innerHTML = `
            <div class="empty-state">
                <div class="robot-icon">🤖</div>
                <h1>Agente de Análise</h1>
                <p>No que você está pensando hoje?</p>
            </div>
        `;
        return;
    }
    
    chat.messages.forEach(msg => {
        if (msg.role === 'user') {
            const div = document.createElement('div');
            div.className = 'message user-message';
            div.innerHTML = `<div class="message-content">${escapeHtml(msg.content)}</div>`;
            chatArea.appendChild(div);
        } else {
            const div = document.createElement('div');
            div.className = 'message assistant-message';
            const lines = msg.content.split('\n').filter(l => l.trim());
            let html = '';
            
            lines.forEach(line => {
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
            
            const content = document.createElement('div');
            content.className = 'message-content';
            content.innerHTML = html;
            div.appendChild(content);
            chatArea.appendChild(div);
        }
    });
    
    chatArea.scrollTop = chatArea.scrollHeight;
}

inputField.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !isLoading) sendMessage();
});

inputField.addEventListener('paste', (e) => {
    const items = e.clipboardData.items;
    for (let item of items) {
        if (item.type.indexOf('image') !== -1) {
            e.preventDefault();
            const blob = item.getAsFile();
            handleFileAttachBlob(blob);
            break;
        }
    }
});

const inputWrapper = document.getElementById('inputWrapper');
const dropHint = document.getElementById('dropHint');

inputWrapper.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    inputWrapper.style.borderColor = '#004AC9';
    dropHint.style.display = 'block';
});

inputWrapper.addEventListener('dragleave', () => {
    inputWrapper.style.borderColor = 'var(--light-border)';
    dropHint.style.display = 'none';
});

inputWrapper.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    inputWrapper.style.borderColor = 'var(--light-border)';
    dropHint.style.display = 'none';
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileAttachBlob(files[0]);
    }
});

function sendMessage() {
    const msg = inputField.value.trim();
    if (!msg || isLoading) return;
    
    if (chatArea.innerHTML.includes('empty-state')) {
        chatArea.innerHTML = '';
    }
    
    if (!currentChatId) {
        createNewChatFromMessage(msg);
    }
    
    const chat = allChats[currentChatId];
    
    addMessage(msg, 'user');
    inputField.value = '';
    inputField.disabled = true;
    sendBtn.disabled = true;
    isLoading = true;
    
    chat.messages.push({ role: 'user', content: msg });
    
    const history = chat.messages
        .map(m => `${m.role === 'user' ? 'Usuário' : 'Agente'}: ${m.content}`)
        .join('\n\n');
    
    addLoading();
    
    fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            question: msg,
            num_respostas: 5,
            historico: history,
            conversation_id: currentChatId
        })
    })
    .then(r => r.json())
    .then(data => {
        removeLoading();
        if (data.respostas) {
            let responseText = '';
            const div = document.createElement('div');
            div.className = 'message assistant-message';
            let html = '';
            
            data.respostas.forEach((r, i) => {
                const prob = typeof r.probabilidade === 'number' ? r.probabilidade.toFixed(2) : parseFloat(r.probabilidade).toFixed(2);
                html += `
                    <div class="response-item">
                        <div class="response-number">Resposta ${i + 1}: ${escapeHtml(r.titulo)}</div>
                        <div class="response-text">${escapeHtml(r.texto)}</div>
                        <div class="probability-badge">Probabilidade: ${prob}</div>
                    </div>
                `;
                responseText += `Resposta ${i + 1}: ${r.titulo} - ${prob}\n`;
            });
            
            const content = document.createElement('div');
            content.className = 'message-content';
            content.innerHTML = html;
            div.appendChild(content);
            chatArea.appendChild(div);
            
            chat.messages.push({ role: 'assistant', content: responseText.trim() });
        }
    })
    .catch(e => addMessage(`❌ Erro: ${e.message}`, 'error'))
    .finally(() => {
        saveChats();
        renderChatList();
        updateHeaderTitle();
        inputField.disabled = false;
        sendBtn.disabled = false;
        isLoading = false;
        inputField.focus();
    });
}

function createNewChatFromMessage(firstMsg) {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    allChats[id] = {
        id: id,
        title: firstMsg.substring(0, 40) + (firstMsg.length > 40 ? '...' : ''),
        messages: [],
        created: new Date().toISOString()
    };
    currentChatId = id;
}

function addMessage(text, type) {
    const div = document.createElement('div');
    div.className = `message ${type}-message`;
    div.innerHTML = `<div class="message-content">${escapeHtml(text)}</div>`;
    chatArea.appendChild(div);
    chatArea.scrollTop = chatArea.scrollHeight;
}

function addLoading() {
    const div = document.createElement('div');
    div.className = 'message assistant-message';
    div.id = 'loading';
    div.innerHTML = `<div class="loading"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>`;
    chatArea.appendChild(div);
}

function removeLoading() {
    const el = document.getElementById('loading');
    if (el) el.remove();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function handleFileAttach(event) {
    const file = event.target.files[0];
    if (file) {
        handleFileAttachBlob(file);
    }
}

function handleFileAttachBlob(file) {
    const fileName = file.name;
    const fileSize = (file.size / 1024).toFixed(2);
    inputField.value = `[Arquivo anexado: ${fileName} (${fileSize}KB)]`;
    inputField.focus();
}
