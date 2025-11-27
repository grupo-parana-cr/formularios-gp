// ============================================
// METAS APP - SISTEMA UNIFICADO
// ============================================
// Este script gerencia:
// 1. Auto-save de dados (a cada mudança)
// 2. Sincronização com Google Sheets
// 3. Carregamento automático de dados salvos
// 4. Geração automática de IDs para identificar usuários

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/SEU_ID_AQUI/exec';
const AUTO_SAVE_DELAY = 500; // Aguarda 500ms após última mudança para salvar
let autoSaveTimeout;
let dataChanged = false;

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Metas App iniciado');
    
    // Gerar ID único para o usuário se não existir
    generateUserIdIfNotExists();
    
    // Carregar dados salvos do Google Sheets
    loadDataFromSheets();
    
    // Configurar listeners para auto-save em todos os inputs
    setupAutoSaveListeners();
    
    // Mostrar status de sincronização
    updateSyncStatus('Carregado');
});

// ============================================
// GERAR ID ÚNICO DO USUÁRIO
// ============================================
function generateUserIdIfNotExists() {
    const existingId = localStorage.getItem('metas_user_id');
    
    if (!existingId) {
        const newId = 'USER_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('metas_user_id', newId);
        console.log('📝 ID do usuário gerado:', newId);
    } else {
        console.log('🆔 ID do usuário:', existingId);
    }
}

function getUserId() {
    return localStorage.getItem('metas_user_id');
}

// ============================================
// CONFIGURAR AUTO-SAVE
// ============================================
function setupAutoSaveListeners() {
    // Inputs
    const inputs = document.querySelectorAll('input[type="text"], input[type="number"], input[type="date"], textarea, select');
    
    inputs.forEach(input => {
        // Se já tem listener, não adiciona novamente
        const originalOnChange = input.onchange;
        
        input.addEventListener('change', function() {
            triggerAutoSave();
            if (originalOnChange) originalOnChange.call(this);
        });
        
        input.addEventListener('input', function() {
            triggerAutoSave();
        });
    });
    
    console.log('🔄 Auto-save configurado para', inputs.length, 'campos');
}

function triggerAutoSave() {
    dataChanged = true;
    updateSyncStatus('Alterações não salvas...');
    
    // Limpar timeout anterior
    if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
    }
    
    // Agendar novo save
    autoSaveTimeout = setTimeout(() => {
        if (dataChanged) {
            saveDataToSheets();
            dataChanged = false;
        }
    }, AUTO_SAVE_DELAY);
}

// ============================================
// SALVAR DADOS NO GOOGLE SHEETS
// ============================================
async function saveDataToSheets() {
    try {
        const data = collectFormData();
        data.userId = getUserId();
        data.timestamp = new Date().toISOString();
        
        // Adicionar departamento
        const deptName = document.querySelector('.header h1, .header p');
        if (deptName) {
            data.department = deptName.textContent || 'Desconhecido';
        }
        
        console.log('💾 Salvando dados:', data);
        
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        updateSyncStatus('✅ Salvo com sucesso');
        
        // Salvar também no localStorage como backup
        saveLocalBackup(data);
        
        // Limpar mensagem após 3 segundos
        setTimeout(() => {
            const statusEl = document.getElementById('syncStatus');
            if (statusEl && statusEl.textContent.includes('Salvo')) {
                updateSyncStatus('Sincronizado');
            }
        }, 3000);
        
    } catch (error) {
        console.error('❌ Erro ao salvar:', error);
        updateSyncStatus('⚠️ Erro ao salvar - usando backup local');
        
        // Salvar como backup
        const data = collectFormData();
        saveLocalBackup(data);
    }
}

// ============================================
// CARREGAR DADOS DO GOOGLE SHEETS
// ============================================
async function loadDataFromSheets() {
    try {
        const userId = getUserId();
        const url = `${GOOGLE_SCRIPT_URL}?action=getData&userId=${userId}`;
        
        // Tentar carregar do Google Sheets
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.success && result.data) {
            console.log('✅ Dados carregados do Google Sheets');
            populateFormWithData(result.data);
        } else {
            // Carregar do localStorage se disponível
            loadLocalBackup();
        }
    } catch (error) {
        console.error('⚠️ Erro ao carregar do Google Sheets:', error);
        // Fallback para localStorage
        loadLocalBackup();
    }
}

// ============================================
// BACKUP LOCAL (FALLBACK)
// ============================================
function saveLocalBackup(data) {
    try {
        const allData = {
            userId: getUserId(),
            timestamp: new Date().toISOString(),
            fields: data
        };
        
        localStorage.setItem('metas_backup_' + getUserId(), JSON.stringify(allData));
        console.log('💾 Backup local salvo');
    } catch (error) {
        console.error('Erro ao salvar backup local:', error);
    }
}

function loadLocalBackup() {
    try {
        const backup = localStorage.getItem('metas_backup_' + getUserId());
        
        if (backup) {
            const data = JSON.parse(backup);
            console.log('📂 Dados carregados do backup local');
            populateFormWithData(data.fields);
            updateSyncStatus('Carregado do backup local');
        }
    } catch (error) {
        console.error('Erro ao carregar backup:', error);
    }
}

// ============================================
// COLETAR DADOS DO FORMULÁRIO
// ============================================
function collectFormData() {
    const data = {};
    
    // Inputs de texto
    const textInputs = document.querySelectorAll('input[type="text"]');
    textInputs.forEach(input => {
        if (input.id) {
            data[input.id] = input.value;
        }
    });
    
    // Inputs numéricos
    const numberInputs = document.querySelectorAll('input[type="number"]');
    numberInputs.forEach(input => {
        if (input.id) {
            data[input.id] = parseFloat(input.value) || 0;
        }
    });
    
    // Inputs de data
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        if (input.id) {
            data[input.id] = input.value;
        }
    });
    
    // Textareas
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(textarea => {
        if (textarea.id) {
            data[textarea.id] = textarea.value;
        }
    });
    
    // Selects
    const selects = document.querySelectorAll('select');
    selects.forEach(select => {
        if (select.id) {
            data[select.id] = select.value;
        }
    });
    
    return data;
}

// ============================================
// POPULAR FORMULÁRIO COM DADOS
// ============================================
function populateFormWithData(data) {
    if (!data || typeof data !== 'object') {
        console.warn('⚠️ Dados inválidos para popular formulário');
        return;
    }
    
    Object.keys(data).forEach(fieldId => {
        const element = document.getElementById(fieldId);
        
        if (element) {
            if (element.type === 'checkbox' || element.type === 'radio') {
                element.checked = data[fieldId] === true || data[fieldId] === 'true';
            } else {
                element.value = data[fieldId] || '';
            }
            
            // Disparar eventos para atualizar estado visual
            element.dispatchEvent(new Event('change', { bubbles: true }));
            element.dispatchEvent(new Event('input', { bubbles: true }));
        }
    });
    
    console.log('✅ Formulário populado com', Object.keys(data).length, 'campos');
}

// ============================================
// STATUS DE SINCRONIZAÇÃO
// ============================================
function updateSyncStatus(message) {
    let statusEl = document.getElementById('syncStatus');
    
    if (!statusEl) {
        // Criar elemento se não existir
        statusEl = document.createElement('div');
        statusEl.id = 'syncStatus';
        statusEl.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 12px 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            font-size: 0.9em;
            z-index: 100;
            font-weight: 600;
        `;
        document.body.appendChild(statusEl);
    }
    
    statusEl.textContent = message;
    
    // Cor baseada no status
    if (message.includes('Salvo')) {
        statusEl.style.background = '#e8f5e9';
        statusEl.style.color = '#2e7d32';
        statusEl.style.borderLeft = '4px solid #4caf50';
    } else if (message.includes('Erro')) {
        statusEl.style.background = '#ffebee';
        statusEl.style.color = '#c62828';
        statusEl.style.borderLeft = '4px solid #f44336';
    } else if (message.includes('Alterações')) {
        statusEl.style.background = '#fff3e0';
        statusEl.style.color = '#e65100';
        statusEl.style.borderLeft = '4px solid #ff9800';
    } else {
        statusEl.style.background = '#e3f2fd';
        statusEl.style.color = '#1565c0';
        statusEl.style.borderLeft = '4px solid #2196f3';
    }
}

// ============================================
// FUNÇÕES AUXILIARES PARA OS FORMULÁRIOS
// ============================================

// Salvar dados manualmente (chamado pelos onchange existentes)
function saveData() {
    triggerAutoSave();
}

// Atualizar progresso (função comum)
function updateProgress(metaNum) {
    triggerAutoSave();
    
    // Executar lógica específica se existir
    if (window['updateProgress' + metaNum]) {
        window['updateProgress' + metaNum]();
    }
}

// Atualizar status (função comum)
function updateStatus(metaNum) {
    triggerAutoSave();
    
    // Executar lógica específica se existir
    if (window['updateStatus' + metaNum]) {
        window['updateStatus' + metaNum]();
    }
}

// Alternar meta (abrir/fechar)
function toggleMeta(metaId) {
    const metaContent = document.getElementById(metaId);
    
    if (metaContent) {
        metaContent.classList.toggle('active');
    }
}

// ============================================
// FUNÇÃO PARA VOLTA PARA HOME
// ============================================
function goBackToHome() {
    if (confirm('Deseja voltar para a página inicial? Seus dados foram salvos automaticamente.')) {
        window.location.href = 'index.html';
    }
}

// ============================================
// EXPORTAR PARA EXCEL (OPCIONAL)
// ============================================
function exportToCSV() {
    const data = collectFormData();
    const csv = Object.keys(data)
        .map(key => `${key},${data[key]}`)
        .join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `metas-${getUserId()}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

console.log('✅ Metas App v1.0 - Script carregado');
