// ============================================
// SISTEMA DE METAS 2025 - SCRIPT PRINCIPAL
// ============================================

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/SEU_ID_AQUI/exec';
const AUTO_SAVE_DELAY = 500;
let autoSaveTimeout;
let dataChanged = false;

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Sistema iniciado');
    
    // Se está na página de home, não faz nada
    if (document.querySelector('.departments-grid')) {
        return;
    }
    
    // Se está em página de metas
    generateUserIdIfNotExists();
    
    // Limpar valores default na primeira carga
    if (!isReturningUser()) {
        clearDefaultValues();
        markAsFirstLoad();
    }
    
    // Carregar dados salvos
    loadDataFromSheets();
    
    // Configurar auto-save
    setupAutoSaveListeners();
    
    updateSyncStatus('Carregado');
});

// ============================================
// REDIRECIONAMENTO PARA DEPARTAMENTO
// ============================================
function redirectToDept(dept) {
    window.location.href = 'metas-' + dept + '-2025.html';
}

// ============================================
// VOLTAR PARA HOME
// ============================================
function goBackToHome() {
    if (confirm('Deseja voltar? Seus dados foram salvos automaticamente.')) {
        window.location.href = 'index.html';
    }
}

// ============================================
// VERIFICAÇÃO DE PRIMEIRA CARGA
// ============================================
function isReturningUser() {
    return localStorage.getItem('metas_first_load_done') === 'true';
}

function markAsFirstLoad() {
    localStorage.setItem('metas_first_load_done', 'true');
}

// ============================================
// LIMPEZA DE VALORES DEFAULT
// ============================================
function clearDefaultValues() {
    document.querySelectorAll('input[type="number"]').forEach(el => {
        if (el.value) el.value = '';
    });
    
    document.querySelectorAll('input[type="text"]').forEach(el => {
        if (el.value && /^\d+$/.test(el.value)) el.value = '';
    });
    
    document.querySelectorAll('input[type="date"]').forEach(el => {
        if (el.value && el.value.match(/2025-|2024-|2026-/)) el.value = '';
    });
    
    document.querySelectorAll('select').forEach(select => {
        select.querySelectorAll('option[selected]').forEach(opt => {
            opt.removeAttribute('selected');
        });
        select.selectedIndex = 0;
    });
    
    console.log('🧹 Valores default limpos');
}

// ============================================
// GERAÇÃO DE ID DO USUÁRIO
// ============================================
function generateUserIdIfNotExists() {
    const existingId = localStorage.getItem('metas_user_id');
    
    if (!existingId) {
        const newId = 'USER_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('metas_user_id', newId);
        console.log('📝 ID gerado:', newId);
    }
}

function getUserId() {
    return localStorage.getItem('metas_user_id');
}

// ============================================
// AUTO-SAVE
// ============================================
function setupAutoSaveListeners() {
    const inputs = document.querySelectorAll('input[type="text"], input[type="number"], input[type="date"], textarea, select');
    
    inputs.forEach(input => {
        input.addEventListener('change', triggerAutoSave);
        input.addEventListener('input', triggerAutoSave);
    });
    
    console.log('🔄 Auto-save configurado');
}

function triggerAutoSave() {
    dataChanged = true;
    updateSyncStatus('Alterações não salvas...');
    
    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
    
    autoSaveTimeout = setTimeout(() => {
        if (dataChanged) {
            saveDataToSheets();
            dataChanged = false;
        }
    }, AUTO_SAVE_DELAY);
}

// ============================================
// SALVAR DADOS
// ============================================
async function saveDataToSheets() {
    try {
        const data = collectFormData();
        data.userId = getUserId();
        data.timestamp = new Date().toISOString();
        
        const deptName = document.querySelector('h1');
        if (deptName) data.department = deptName.textContent;
        
        await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        updateSyncStatus('✅ Salvo com sucesso');
        saveLocalBackup(data);
        
        setTimeout(() => {
            const status = document.getElementById('syncStatus');
            if (status && status.textContent.includes('Salvo')) {
                updateSyncStatus('Sincronizado');
            }
        }, 3000);
        
    } catch (error) {
        console.error('❌ Erro ao salvar:', error);
        updateSyncStatus('⚠️ Erro - usando backup local');
        saveLocalBackup(collectFormData());
    }
}

// ============================================
// CARREGAR DADOS
// ============================================
async function loadDataFromSheets() {
    try {
        const userId = getUserId();
        const url = `${GOOGLE_SCRIPT_URL}?action=getData&userId=${userId}`;
        
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.success && result.data) {
            populateFormWithData(result.data);
        } else {
            loadLocalBackup();
        }
    } catch (error) {
        console.error('⚠️ Erro ao carregar:', error);
        loadLocalBackup();
    }
}

// ============================================
// BACKUP LOCAL
// ============================================
function saveLocalBackup(data) {
    try {
        const backup = {
            userId: getUserId(),
            timestamp: new Date().toISOString(),
            fields: data
        };
        localStorage.setItem('metas_backup_' + getUserId(), JSON.stringify(backup));
    } catch (error) {
        console.error('Erro ao salvar backup:', error);
    }
}

function loadLocalBackup() {
    try {
        const backup = localStorage.getItem('metas_backup_' + getUserId());
        if (backup) {
            const data = JSON.parse(backup);
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
    
    document.querySelectorAll('input[type="text"]').forEach(el => {
        if (el.id) data[el.id] = el.value;
    });
    
    document.querySelectorAll('input[type="number"]').forEach(el => {
        if (el.id) data[el.id] = parseFloat(el.value) || 0;
    });
    
    document.querySelectorAll('input[type="date"]').forEach(el => {
        if (el.id) data[el.id] = el.value;
    });
    
    document.querySelectorAll('textarea').forEach(el => {
        if (el.id) data[el.id] = el.value;
    });
    
    document.querySelectorAll('select').forEach(el => {
        if (el.id) data[el.id] = el.value;
    });
    
    return data;
}

// ============================================
// POPULAR FORMULÁRIO
// ============================================
function populateFormWithData(data) {
    if (!data || typeof data !== 'object') return;
    
    Object.keys(data).forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element) {
            element.value = data[fieldId] || '';
            element.dispatchEvent(new Event('change', { bubbles: true }));
            element.dispatchEvent(new Event('input', { bubbles: true }));
        }
    });
    
    console.log('✅ Formulário populado');
}

// ============================================
// STATUS DE SINCRONIZAÇÃO
// ============================================
function updateSyncStatus(message) {
    let statusEl = document.getElementById('syncStatus');
    
    if (!statusEl) {
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
// FUNÇÕES AUXILIARES
// ============================================
function saveData() {
    triggerAutoSave();
}

function updateProgress(metaNum) {
    triggerAutoSave();
}

function updateStatus(metaNum) {
    triggerAutoSave();
}

function toggleMeta(metaId) {
    const element = document.getElementById(metaId);
    if (element) element.classList.toggle('active');
}

console.log('✅ Script carregado');
