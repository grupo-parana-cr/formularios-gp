// ============================================
// GOOGLE APPS SCRIPT - BACKEND
// ============================================
// Cole este código em: https://script.google.com
// Substitua SPREADSHEET_ID pela sua planilha

const SPREADSHEET_ID = 'SEU_ID_AQUI'; // Cole o ID da sua planilha aqui
const SHEET_NAME = 'Respostas';

// ============================================
// REQUISIÇÃO POST - SALVAR DADOS
// ============================================
function doPost(e) {
    try {
        const data = JSON.parse(e.postData.contents);
        
        const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
        let sheet = spreadsheet.getSheetByName(SHEET_NAME);
        
        if (!sheet) {
            sheet = spreadsheet.insertSheet(SHEET_NAME);
            createHeaderRow(sheet, Object.keys(data));
        }
        
        saveToSheet(sheet, data);
        
        return ContentService
            .createTextOutput(JSON.stringify({ success: true }))
            .setMimeType(ContentService.MimeType.JSON);
    } catch (error) {
        return ContentService
            .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

// ============================================
// REQUISIÇÃO GET - CARREGAR DADOS
// ============================================
function doGet(e) {
    try {
        const action = e.parameter.action;
        const userId = e.parameter.userId;
        
        const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
        const sheet = spreadsheet.getSheetByName(SHEET_NAME);
        
        if (!sheet) {
            return ContentService
                .createTextOutput(JSON.stringify({ success: false, data: null }))
                .setMimeType(ContentService.MimeType.JSON);
        }
        
        if (action === 'getData') {
            const data = getUserData(sheet, userId);
            return ContentService
                .createTextOutput(JSON.stringify({ success: true, data: data }))
                .setMimeType(ContentService.MimeType.JSON);
        } else if (action === 'getAllData') {
            const allData = getAllData(sheet);
            return ContentService
                .createTextOutput(JSON.stringify({ success: true, data: allData }))
                .setMimeType(ContentService.MimeType.JSON);
        }
        
        return ContentService
            .createTextOutput(JSON.stringify({ success: false }))
            .setMimeType(ContentService.MimeType.JSON);
    } catch (error) {
        return ContentService
            .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

// ============================================
// SALVAR DADOS NA PLANILHA
// ============================================
function saveToSheet(sheet, data) {
    const userRow = findUserRow(sheet, data.userId);
    
    if (userRow > 0) {
        updateRow(sheet, userRow, data);
    } else {
        appendRow(sheet, data);
    }
}

// ============================================
// ENCONTRAR LINHA DO USUÁRIO
// ============================================
function findUserRow(sheet, userId) {
    const values = sheet.getRange(1, 1, sheet.getLastRow()).getValues();
    
    for (let i = 1; i < values.length; i++) {
        if (values[i][0] === userId) {
            return i + 1;
        }
    }
    
    return -1;
}

// ============================================
// ATUALIZAR LINHA EXISTENTE
// ============================================
function updateRow(sheet, row, data) {
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    for (let col = 0; col < headers.length; col++) {
        const header = headers[col];
        if (data[header] !== undefined) {
            sheet.getRange(row, col + 1).setValue(data[header]);
        }
    }
    
    sheet.getRange(row, headers.indexOf('lastUpdated') + 1).setValue(new Date().toISOString());
}

// ============================================
// ADICIONAR NOVA LINHA
// ============================================
function appendRow(sheet, data) {
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const newRow = [];
    
    for (let col = 0; col < headers.length; col++) {
        const header = headers[col];
        newRow.push(data[header] || '');
    }
    
    newRow[headers.indexOf('lastUpdated')] = new Date().toISOString();
    
    sheet.appendRow(newRow);
}

// ============================================
// CRIAR LINHA DE CABEÇALHO
// ============================================
function createHeaderRow(sheet, dataKeys) {
    const headers = ['userId', 'timestamp', 'department', 'lastUpdated', ...dataKeys];
    sheet.appendRow(headers);
    
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#1e3c72');
    headerRange.setFontColor('white');
    headerRange.setFontWeight('bold');
    headerRange.setHorizontalAlignment('center');
    
    sheet.autoResizeColumns(1, headers.length);
}

// ============================================
// OBTER DADOS DO USUÁRIO
// ============================================
function getUserData(sheet, userId) {
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    const range = sheet.getRange(1, 1, lastRow, lastCol);
    const values = range.getValues();
    
    const headers = values[0];
    
    for (let row = 1; row < values.length; row++) {
        if (values[row][0] === userId) {
            const userData = {};
            for (let col = 0; col < headers.length; col++) {
                userData[headers[col]] = values[row][col];
            }
            return userData;
        }
    }
    
    return null;
}

// ============================================
// OBTER TODOS OS DADOS (ADMIN)
// ============================================
function getAllData(sheet) {
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    return sheet.getRange(1, 1, lastRow, lastCol).getValues();
}

// ============================================
// FUNÇÃO DE TESTE
// ============================================
function testSave() {
    const testData = {
        userId: 'TEST_USER_' + Date.now(),
        timestamp: new Date().toISOString(),
        department: 'Teste',
        lastUpdated: new Date().toISOString(),
        testField: 'Dados de teste'
    };
    
    try {
        const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
        let sheet = spreadsheet.getSheetByName(SHEET_NAME);
        
        if (!sheet) {
            sheet = spreadsheet.insertSheet(SHEET_NAME);
            createHeaderRow(sheet, Object.keys(testData));
        }
        
        saveToSheet(sheet, testData);
        
        Logger.log('✅ Teste salvo com sucesso! Verifique a planilha.');
    } catch (error) {
        Logger.log('❌ Erro ao testar: ' + error.toString());
    }
}
