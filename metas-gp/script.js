// ============================================
// SISTEMA DE METAS 2025 - SCRIPT PRINCIPAL
// INTEGRAÇÃO GOOGLE SHEETS COM JSON
// ============================================

// ⚠️ IMPORTANTE: Substitua estes valores
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyVQouGlsrBIH1A4_2vzJO6g_F3kSAmMl2llsnngj3YvSXlEbwMRuXhZEybjwEqMdiE/exec';
const AUTO_SAVE_DELAY = 500;
let autoSaveTimeout;
let dataChanged = false;
let departmentName = '';

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Sistema iniciado');
    
    // Se está na página de home, não faz nada
    if (document.querySelector('.departments-grid')) {
        return;
    }
    
    // Extrair nome do departamento do título
    const h1 = document.querySelector('h1');
    if (h1) {
        // Extrai "Agricultura" de "Dashboard Metas Agricultura 2025..."
        const parts = h1.textContent.split('Metas ');
        if (parts[1]) {
            departmentName = parts[1].split(' 20')[0].trim();
        }
    }
    
    console.log('📋 Departamento:', departmentName);
    
    // Carregar dados salvos do Google Sheets
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
// AUTO-SAVE
// ============================================
function setupAutoSaveListeners() {
    const inputs = document.querySelectorAll(
        'input[type="text"], input[type="number"], input[type="date"], textarea, select'
    );
    
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
// SALVAR DADOS NO GOOGLE SHEETS (POST)
// ============================================
async function saveDataToSheets() {
    try {
        const data = collectFormData();
        data.department = departmentName;
        data.timestamp = new Date().toISOString();
        
        console.log('💾 Salvando:', data);
        
        // Usar Query Parameters (funciona com no-cors)
        const params = new URLSearchParams();
        params.append('action', 'save');
        params.append('department', departmentName);
        params.append('data', JSON.stringify(data));
        
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?${params.toString()}`, {
            method: 'GET',
            mode: 'no-cors'
        });
        
        console.log('✅ Dados enviados');
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
    }
}

// ============================================
// CARREGAR DADOS DO GOOGLE SHEETS (GET)
// ============================================
async function loadDataFromSheets() {
    try {
        if (!departmentName) {
            console.warn('⚠️ Nome do departamento não identificado');
            loadLocalBackup();
            return;
        }
        
        console.log('📥 Carregando dados de:', departmentName);
        
        // Usar Query Parameters (funciona com no-cors)
        const params = new URLSearchParams();
        params.append('action', 'load');
        params.append('department', departmentName);
        
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?${params.toString()}`, {
            method: 'GET',
            mode: 'no-cors'
        });
        
        // Com no-cors não conseguimos ler a resposta
        // Então carregamos do backup local
        console.log('ℹ️ Usando backup local (no-cors não permite ler resposta)');
        loadLocalBackup();
        
    } catch (error) {
        console.error('⚠️ Erro ao carregar:', error);
        loadLocalBackup();
    }
}

// ============================================
// BACKUP LOCAL (localStorage)
// ============================================
function saveLocalBackup(data) {
    try {
        const backup = {
            department: departmentName,
            timestamp: new Date().toISOString(),
            fields: data
        };
        localStorage.setItem(`metas_backup_${departmentName}`, JSON.stringify(backup));
        console.log('💾 Backup local salvo');
    } catch (error) {
        console.error('Erro ao salvar backup local:', error);
    }
}

function loadLocalBackup() {
    try {
        const backup = localStorage.getItem(`metas_backup_${departmentName}`);
        if (backup) {
            const data = JSON.parse(backup);
            populateFormWithData(data.fields);
            updateSyncStatus('📦 Carregado do backup local');
            console.log('✅ Backup local carregado');
        }
    } catch (error) {
        console.error('Erro ao carregar backup local:', error);
    }
}

// ============================================
// COLETAR DADOS DO FORMULÁRIO
// ============================================
function collectFormData() {
    const data = {};
    
    // Inputs de texto
    document.querySelectorAll('input[type="text"]').forEach(el => {
        if (el.id) data[el.id] = el.value;
    });
    
    // Inputs numéricos
    document.querySelectorAll('input[type="number"]').forEach(el => {
        if (el.id) data[el.id] = el.value ? parseFloat(el.value) : 0;
    });
    
    // Inputs de data
    document.querySelectorAll('input[type="date"]').forEach(el => {
        if (el.id) data[el.id] = el.value;
    });
    
    // Textareas
    document.querySelectorAll('textarea').forEach(el => {
        if (el.id) data[el.id] = el.value;
    });
    
    // Selects
    document.querySelectorAll('select').forEach(el => {
        if (el.id) data[el.id] = el.value;
    });
    
    return data;
}

// ============================================
// POPULAR FORMULÁRIO COM DADOS
// ============================================
function populateFormWithData(data) {
    if (!data || typeof data !== 'object') return;
    
    Object.keys(data).forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element) {
            element.value = data[fieldId] || '';
            
            // Dispara eventos para atualizar gráficos e cálculos
            element.dispatchEvent(new Event('change', { bubbles: true }));
            element.dispatchEvent(new Event('input', { bubbles: true }));
        }
    });
    
    console.log('✅ Formulário populado com sucesso');
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
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
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
    } else if (message.includes('backup')) {
        statusEl.style.background = '#f3e5f5';
        statusEl.style.color = '#6a1b9a';
        statusEl.style.borderLeft = '4px solid #9c27b0';
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

function updateAcidentes() {
    triggerAutoSave();
}

function toggleMeta(metaId) {
    const element = document.getElementById(metaId);
    if (element) element.classList.toggle('active');
}

console.log('✅ Script carregado - Sistema de Metas 2025 v2.0');
