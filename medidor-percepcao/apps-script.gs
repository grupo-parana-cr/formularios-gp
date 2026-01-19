function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    if (data.action === 'checkCPF') {
      return handleCheckCPF(data, spreadsheet);
    }
    
    if (data.action === 'getAllData') {
      return handleGetAllData(data, spreadsheet);
    }
    
    return handleSubmitForm(data, spreadsheet);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: "Erro ao processar"
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function handleGetAllData(data, spreadsheet) {
  try {
    const resultado = {};
    
    data.setores.forEach(setorName => {
      const sheet = spreadsheet.getSheetByName(setorName);
      if (!sheet) return;
      
      const lastRow = sheet.getLastRow();
      resultado[setorName] = {
        setor: setorName,
        perguntas: [],
        respostas: {},
        comentarios: [],
        totalRespostas: lastRow - 1
      };
      
      if (lastRow < 2) return;
      
      const header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      const values = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
      
      values.forEach(row => {
        const respostas = row.slice(2, row.length - 1).map(v => {
          const val = parseInt(v);
          return isNaN(val) ? 0 : val;
        });
        
        respostas.forEach((resp, idx) => {
          if (!resultado[setorName].respostas[idx]) {
            resultado[setorName].respostas[idx] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
          }
          resultado[setorName].respostas[idx][resp]++;
        });
        
        // Capturar comentário (última coluna)
        const comentario = row[row.length - 1];
        if (comentario && comentario.trim()) {
          resultado[setorName].comentarios.push(comentario.trim());
        }
      });
    });
    
    return ContentService.createTextOutput(JSON.stringify(resultado))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function handleCheckCPF(data, spreadsheet) {
  try {
    const sheetName = data.setor;
    const sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        exists: false,
        message: "Setor não encontrado"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const lastRow = sheet.getLastRow();
    
    if (lastRow < 2) {
      return ContentService.createTextOutput(JSON.stringify({
        exists: false
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const cpfColumn = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    const cpfInput = String(data.cpf).replace(/\D/g, '').trim();
    
    const cpfExists = cpfColumn.some(row => {
      const cpfSheet = String(row[0])
        .replace(/'/g, '')
        .replace(/\D/g, '')
        .trim();
      return cpfSheet === cpfInput;
    });
    
    return ContentService.createTextOutput(JSON.stringify({
      exists: cpfExists
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      exists: false
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function handleSubmitForm(data, spreadsheet) {
  try {
    const sheetName = data.setor;
    const sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: "Setor não encontrado"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const lastRow = sheet.getLastRow();
    
    if (lastRow === 0) {
      const header = [
        'CPF',
        'Data/Hora',
        ...data.respostas.map((_, index) => `Pergunta ${index + 1}`),
        'Comentário Final'
      ];
      sheet.getRange(1, 1, 1, header.length).setValues([header]);
      sheet.getRange(1, 1, 1, header.length).setFontWeight('bold');
      sheet.getRange(1, 1, 1, header.length).setBackground('#3b82f6');
      sheet.getRange(1, 1, 1, header.length).setFontColor('#ffffff');
    }
    
    const cpfInput = String(data.cpf).replace(/\D/g, '').trim();
    let cpfExists = false;
    
    if (lastRow >= 2) {
      const cpfColumn = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      cpfExists = cpfColumn.some(row => {
        const cpfSheet = String(row[0])
          .replace(/'/g, '')
          .replace(/\D/g, '')
          .trim();
        return cpfSheet === cpfInput;
      });
    }
    
    if (cpfExists) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: "Este CPF já respondeu"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const timestamp = new Date().toLocaleString('pt-BR');
    const cpfSemFormatacao = String(data.cpf).replace(/\D/g, '');
    const cpfComApostrofo = "'" + cpfSemFormatacao;
    
    const newRow = [
      cpfComApostrofo,
      timestamp,
      ...data.respostas,
      data.texto
    ];
    
    sheet.appendRow(newRow);
    SpreadsheetApp.flush();
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "Resposta registrada com sucesso!"
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: "Erro ao processar"
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
