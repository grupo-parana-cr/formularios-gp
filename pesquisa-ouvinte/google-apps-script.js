// ============================================
// GOOGLE APPS SCRIPT - INTEGRAÇÃO COM SHEETS
// ============================================
// 
// INSTRUÇÕES DE CONFIGURAÇÃO:
// 
// 1. Acesse: https://script.google.com
// 2. Clique em "Novo projeto"
// 3. Cole este código inteiro no editor
// 4. Clique em "Implantar" > "Nova implantação"
// 5. Escolha "Aplicativo da Web"
// 6. Configure:
//    - Executar como: Você mesmo
//    - Quem tem acesso: Qualquer pessoa
// 7. Clique em "Implantar"
// 8. Copie a URL gerada
// 9. Cole a URL no arquivo script.js na variável GOOGLE_SCRIPT_URL
//
// ============================================

// ID da sua planilha (você pode pegar na URL da planilha)
// Exemplo: https://docs.google.com/spreadsheets/d/SEU_ID_AQUI/edit
const SPREADSHEET_ID = 'https://docs.google.com/spreadsheets/d/1vHpV68fmwP2hlvw9hwfva9G7_p6l_WEa5WRtkvyUZDM/edit';

// Nome da aba onde os dados serão salvos
const SHEET_NAME = 'Respostas';

// ============================================
// FUNÇÃO PRINCIPAL - RECEBE OS DADOS
// ============================================
function doPost(e) {
  try {
    // Parse dos dados recebidos
    const data = JSON.parse(e.postData.contents);
    
    // Salvar na planilha
    saveToSheet(data);
    
    // Retornar sucesso
    return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'success', 'data': data }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Retornar erro
    return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'error', 'error': error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================
// SALVAR NA PLANILHA
// ============================================
function saveToSheet(data) {
  // Abrir a planilha
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  // Se a aba não existir, criar
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    
    // Criar cabeçalhos
    const headers = [
      'Data/Hora',
      'Horário',
      'Estilo Musical',
      'Locutor',
      'Programa',
      'Muda de Rádio',
      'Usa como Companhia',
      'Motivos',
      'Plataforma',
      'Novo Conteúdo',
      'Anúncios',
      'Nome',
      'Telefone',
      'Sexo',
      'Idade'
    ];
    
    sheet.appendRow(headers);
    
    // Formatar cabeçalhos
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#2B5BA8');
    headerRange.setFontColor('#FFFFFF');
    headerRange.setFontWeight('bold');
    headerRange.setHorizontalAlignment('center');
  }
  
  // Preparar linha de dados
  const row = [
    new Date(data.timestamp),
    data.horario,
    data.estilo,
    data.locutor,
    data.programa,
    data.mudarRadio,
    data.companhia,
    data.motivos,
    data.plataforma,
    data.novoConteudo,
    data.anuncio,
    data.nome,
    data.telefone,
    data.sexo,
    data.idade
  ];
  
  // Adicionar dados à planilha
  sheet.appendRow(row);
  
  // Auto-ajustar colunas
  sheet.autoResizeColumns(1, row.length);
}

// ============================================
// FUNÇÃO PARA OBTER DADOS (PARA O DASHBOARD)
// ============================================
function doGet(e) {
  try {
    // Verificar senha
    const password = e.parameter.password;
    
    if (password !== 'superfm2025') {
      return ContentService
        .createTextOutput(JSON.stringify({ 'result': 'error', 'message': 'Senha incorreta' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Obter dados da planilha
    const data = getSheetData();
    
    // Retornar dados
    return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'success', 'data': data }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'error', 'error': error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================
// OBTER DADOS DA PLANILHA
// ============================================
function getSheetData() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    return [];
  }
  
  const data = sheet.getDataRange().getValues();
  
  // Converter para array de objetos
  const headers = data[0];
  const rows = data.slice(1);
  
  return rows.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
}

// ============================================
// TESTE MANUAL
// ============================================
function testSave() {
  const testData = {
    timestamp: new Date().toISOString(),
    horario: 'Manhã',
    estilo: 'Sertanejo',
    locutor: 'Edmar Goiano',
    programa: 'Porteira 98',
    mudarRadio: 'Não',
    companhia: 'Sim, o dia todo',
    motivos: 'Seleção musical, Locutores',
    plataforma: 'Rádio',
    novoConteudo: 'Não',
    anuncio: 'Sim, uma vez',
    nome: 'Teste',
    telefone: '(67) 99999-9999',
    sexo: 'Masculino',
    idade: '25 a 34 anos'
  };
  
  saveToSheet(testData);
  Logger.log('Teste executado com sucesso!');
}