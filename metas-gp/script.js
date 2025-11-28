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
    
    // Extrair nome do departamento do URL do arquivo
    // Exemplo: metas-agricultura-2025.html → Agricultura
    const filename = window.location.pathname.split('/').pop();
    const match = filename.match(/metas-(.+?)-2025\.html/i);
    if (match && match[1]) {
        // Converte: agricultura → Agricultura
        const deptName = match[1];
        departmentName = deptName.charAt(0).toUpperCase() + deptName.slice(1);
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
        
        // Usar POST com no-cors
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        console.log('✅ Enviado via POST');
        updateSyncStatus('✅ Salvo com sucesso');
        saveLocalBackup(data);
        
    } catch (error) {
        console.error('❌ Erro ao salvar:', error);
        updateSyncStatus('⚠️ Erro ao salvar');
        saveLocalBackup(collectFormData());
    }
}

// ============================================
// CARREGAR DADOS DO GOOGLE SHEETS (JSONP)
// ============================================
function loadDataFromSheets() {
    try {
        if (!departmentName) {
            console.warn('⚠️ Nome do departamento não identificado');
            loadLocalBackup();
            return;
        }
        
        console.log('📥 Carregando dados de:', departmentName);
        
        // Criar função global de callback para JSONP
        window.sheetCallback = function(result) {
            if (result.result === 'success' && result.data) {
                console.log('✅ Dados carregados do Sheets:', result.data);
                populateFormWithData(result.data);
                updateSyncStatus('✅ Carregado do Sheets (sincronizado!)');
            } else {
                console.log('ℹ️ Nenhum dado anterior encontrado');
                loadLocalBackup();
            }
        };
        
        // Criar script tag dinamicamente (JSONP)
        const url = `${GOOGLE_SCRIPT_URL}?callback=sheetCallback&department=${encodeURIComponent(departmentName)}`;
        const script = document.createElement('script');
        script.src = url;
        script.onerror = function() {
            console.error('⚠️ Erro ao carregar via JSONP');
            loadLocalBackup();
        };
        document.head.appendChild(script);
        
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
    // Remover elementos antigos
    const oldStatus = document.querySelectorAll('#syncStatus');
    oldStatus.forEach(el => el.remove());
    
    const statusEl = document.createElement('div');
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
        animation: slideIn 0.3s ease;
    `;
    
    // Adicionar CSS de animação
    if (!document.querySelector('style[data-sync-animation]')) {
        const style = document.createElement('style');
        style.setAttribute('data-sync-animation', 'true');
        style.textContent = `
            @keyframes slideIn {
                from { opacity: 0; transform: translateX(20px); }
                to { opacity: 1; transform: translateX(0); }
            }
        `;
        document.head.appendChild(style);
    }
    
    statusEl.textContent = message;
    
    // Cores conforme o tipo de mensagem
    if (message.includes('sucesso') || message.includes('Carregado')) {
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
    
    document.body.appendChild(statusEl);
    
    // Auto-remover após 3 segundos
    setTimeout(() => {
        if (statusEl && statusEl.parentNode) {
            statusEl.remove();
        }
    }, 3000);
}

// ============================================
// AUXILIAR: Simples wrapper para compatibilidade HTML
// ============================================
function saveData() {
    triggerAutoSave();
}

console.log('✅ Script carregado - Sistema de Metas 2025 v2.0');
