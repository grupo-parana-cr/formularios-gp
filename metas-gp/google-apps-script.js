// ============================================
// GOOGLE APPS SCRIPT - METAS 2025
// ============================================
// INSTRUÇÕES DE CONFIGURAÇÃO:
// 
// 1. Acesse: https://script.google.com
// 2. Crie um novo projeto
// 3. Cole este código inteiro
// 4. Clique em "Implantar" > "Nova implantação"
// 5. Escolha "Aplicativo da Web"
// 6. Configure:
//    - Executar como: Você mesmo
//    - Quem tem acesso: Qualquer pessoa
// 7. Copie a URL gerada e cole em metas-app.js na variável GOOGLE_SCRIPT_URL
//
// A estrutura será:
// - Aba "Respostas" com todas as submissões
// - Colunas: userId, timestamp, department, e todos os campos dinâmicos
// ============================================

// ID da planilha (CONFIGURE AQUI)
const SPREADSHEET_ID = 'SEU_ID_DA_PLANILHA_AQUI';

// Nome da aba principal
const MAIN_SHEET_NAME = 'Respostas';

// ============================================
// DO POST - RECEBER DADOS
// ============================================
function doPost(e) {
    try {
        const data = JSON.parse(e.postData.contents);
        
        console.log('📥 Dados recebidos:', data);
        
        // Salvar na planilha
        const result = saveToSheet(data);
        
        return ContentService
            .createTextOutput(JSON.stringify({
                success: true,
                message: 'Dados salvos com sucesso',
                dataId: result
            }))
            .setMimeType(ContentService.MimeType.JSON);
            
    } catch (error) {
        console.error('❌ Erro ao processar POST:', error);
        
        return ContentService
            .createTextOutput(JSON.stringify({
                success: false,
                error: error.toString()
            }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

// ============================================
// DO GET - RECUPERAR DADOS
// ============================================
function doGet(e) {
    try {
        const action = e.parameter.action;
        const userId = e.parameter.userId;
        
        if (action === 'getData') {
            // Recuperar dados do usuário
            const data = getUserData(userId);
            
            return ContentService
                .createTextOutput(JSON.stringify({
                    success: true,
                    data: data
                }))
                .setMimeType(ContentService.MimeType.JSON);
                
        } else if (action === 'getAllData') {
            // Recuperar TODOS os dados (admin)
            const allData = getAllData();
            
            return ContentService
                .createTextOutput(JSON.stringify({
                    success: true,
                    data: allData
                }))
                .setMimeType(ContentService.MimeType.JSON);
        }
        
        return ContentService
            .createTextOutput(JSON.stringify({
                success: false,
                error: 'Ação não reconhecida'
            }))
            .setMimeType(ContentService.MimeType.JSON);
            
    } catch (error) {
        console.error('❌ Erro ao processar GET:', error);
        
        return ContentService
            .createTextOutput(JSON.stringify({
                success: false,
                error: error.toString()
            }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

// ============================================
// SALVAR NA PLANILHA
// ============================================
function saveToSheet(data) {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(MAIN_SHEET_NAME);
    
    // Se a aba não existir, criar
    if (!sheet) {
        sheet = ss.insertSheet(MAIN_SHEET_NAME);
        createHeaderRow(sheet, data);
    }
    
    // Verificar se o usuário já tem linha (para atualizar)
    const userId = data.userId;
    const rowIndex = findUserRow(sheet, userId);
    
    if (rowIndex > 0) {
        // Atualizar linha existente
        updateRow(sheet, rowIndex, data);
        console.log('✏️ Linha', rowIndex, 'atualizada');
    } else {
        // Adicionar nova linha
        appendRow(sheet, data);
        console.log('➕ Nova linha adicionada');
    }
    
    return userId;
}

// ============================================
// CRIAR CABEÇALHO
// ============================================
function createHeaderRow(sheet, sampleData) {
    const baseHeaders = ['userId', 'timestamp', 'department', 'lastUpdated'];
    
    // Adicionar headers dos campos dinâmicos
    const dynamicHeaders = Object.keys(sampleData)
        .filter(key => !baseHeaders.includes(key));
    
    const allHeaders = [...baseHeaders, ...dynamicHeaders];
    
    sheet.appendRow(allHeaders);
    
    // Formatar cabeçalho
    const headerRange = sheet.getRange(1, 1, 1, allHeaders.length);
    headerRange.setBackground('#1e3c72');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    headerRange.setHorizontalAlignment('center');
    
    console.log('📋 Cabeçalho criado com', allHeaders.length, 'colunas');
}

// ============================================
// ENCONTRAR LINHA DO USUÁRIO
// ============================================
function findUserRow(sheet, userId) {
    const data = sheet.getDataRange().getValues();
    
    for (let i = 0; i < data.length; i++) {
        if (data[i][0] === userId) {
            return i + 1; // Retorna número da linha (1-indexed)
        }
    }
    
    return -1; // Não encontrado
}

// ============================================
// ATUALIZAR LINHA
// ============================================
function updateRow(sheet, rowIndex, data) {
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    for (let col = 0; col < headers.length; col++) {
        const header = headers[col];
        
        if (data.hasOwnProperty(header)) {
            const value = data[header];
            sheet.getRange(rowIndex, col + 1).setValue(value);
        }
    }
    
    // Atualizar timestamp de última modificação
    const lastUpdatedCol = headers.indexOf('lastUpdated') + 1;
    if (lastUpdatedCol > 0) {
        sheet.getRange(rowIndex, lastUpdatedCol).setValue(new Date().toISOString());
    }
}

// ============================================
// ADICIONAR NOVA LINHA
// ============================================
function appendRow(sheet, data) {
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const row = [];
    
    for (let col = 0; col < headers.length; col++) {
        const header = headers[col];
        
        if (header === 'lastUpdated') {
            row.push(new Date().toISOString());
        } else if (data.hasOwnProperty(header)) {
            row.push(data[header] || '');
        } else {
            row.push('');
        }
    }
    
    sheet.appendRow(row);
    
    // Auto-ajustar colunas
    sheet.autoResizeColumns(1, row.length);
}

// ============================================
// RECUPERAR DADOS DO USUÁRIO
// ============================================
function getUserData(userId) {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(MAIN_SHEET_NAME);
    
    if (!sheet) {
        return null;
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // Procurar o usuário
    for (let i = 1; i < data.length; i++) {
        if (data[i][0] === userId) {
            // Montar objeto com os dados
            const userData = {};
            
            for (let col = 0; col < headers.length; col++) {
                const header = headers[col];
                const value = data[i][col];
                
                // Não retornar metadata
                if (header !== 'userId' && header !== 'timestamp' && header !== 'department' && header !== 'lastUpdated') {
                    userData[header] = value;
                }
            }
            
            return userData;
        }
    }
    
    return null;
}

// ============================================
// RECUPERAR TODOS OS DADOS (ADMIN)
// ============================================
function getAllData() {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(MAIN_SHEET_NAME);
    
    if (!sheet) {
        return [];
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    const result = [];
    
    // Pular cabeçalho e processar linhas
    for (let i = 1; i < data.length; i++) {
        const row = {};
        
        for (let col = 0; col < headers.length; col++) {
            row[headers[col]] = data[i][col];
        }
        
        result.push(row);
    }
    
    return result;
}

// ============================================
// TESTE MANUAL
// ============================================
function testSave() {
    const testData = {
        userId: 'TEST_USER_' + Date.now(),
        timestamp: new Date().toISOString(),
        department: 'Agricultura',
        acidentesOcup1: 0,
        acidentesVeic1: 1,
        totalAcidentes1: 1,
        percent1: 25,
        diasSemAcidentes1: 15,
        acoes1: 'Treinamento de segurança implementado',
        responsavel1: 'João Silva'
    };
    
    saveToSheet(testData);
    Logger.log('✅ Teste executado com sucesso!');
}

// ============================================
// FUNÇÃO DE SUPORTE - LISTAR TUDO
// ============================================
function listAllData() {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(MAIN_SHEET_NAME);
    
    if (!sheet) {
        Logger.log('❌ Planilha não encontrada');
        return;
    }
    
    const data = sheet.getDataRange().getValues();
    Logger.log('📊 Total de registros:', data.length - 1);
    Logger.log('📋 Colunas:', data[0]);
}

console.log('✅ Google Apps Script v1.0 - Carregado');
