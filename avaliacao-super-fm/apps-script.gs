/**
 * AVALIACAO INTERNA | RADIO SUPER FM - Grupo Parana
 *
 * Backend Apps Script vinculado a planilha de respostas (container-bound).
 *
 * Avaliacao IDENTIFICADA: o participante e avisado, antes de comecar, de que
 * o CPF fica registrado junto as respostas e que o acesso e restrito a
 * Diretoria. O CPF tambem impede resposta duplicada.
 */

var FUSO = 'America/Campo_Grande';   // Grupo Paraná fica em MS (UTC-4)
var ABA_RESPOSTAS = 'Respostas';
var LIMITE_TEXTO = 2000;

/**
 * Tipos das 51 perguntas, na ordem. Precisa bater com SECOES em script.js.
 *   e = escala 1-5 (obrigatoria)
 *   a = aberta (opcional)
 *   c = escala 1-5 + comentario opcional
 */
var TIPOS = 'eeee' + 'a' + 'ee' + 'aaa' + 'eeeee' + 'c' + 'eeee' + 'a' + 'eee' + 'aa' +
            'eee' + 'a' + 'eeeee' + 'a' + 'eeee' + 'a' + 'eeeee' + 'aaaaa';

/** Colunas da aba Respostas: chave usada no JSON e titulo do cabecalho. */
function colunas_() {
  var lista = [
    { chave: 'quando', titulo: 'Data/Hora' },
    { chave: 'cpf', titulo: 'CPF' }
  ];

  for (var i = 0; i < TIPOS.length; i++) {
    var n = i + 1;
    var tipo = TIPOS.charAt(i);

    if (tipo === 'a') {
      lista.push({ chave: 'p' + n, titulo: 'P' + n + ' (aberta)' });
    } else {
      lista.push({ chave: 'p' + n, titulo: 'P' + n + ' (1-5)' });
      if (tipo === 'c') lista.push({ chave: 'p' + n + 'c', titulo: 'P' + n + ' - Comentario' });
    }
  }

  return lista;
}

/* ------------------------------------------------------------------ */
/* Roteamento                                                          */
/* ------------------------------------------------------------------ */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    // Ping: so acorda o script. Nao toca na planilha de proposito -- serve
    // para pagar o cold start enquanto a pessoa le a capa.
    if (data.action === 'ping') return json_({ ok: true });

    if (data.action === 'checkCPF') return handleCheckCPF(data);
    if (data.action === 'submit') return handleSubmit(data);
    if (data.action === 'getAllData') return handleGetAllData(data);

    return json_({ success: false, message: 'Ação desconhecida.' });
  } catch (error) {
    return json_({ success: false, message: 'Erro ao processar a requisição.' });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ------------------------------------------------------------------ */
/* Planilha                                                            */
/* ------------------------------------------------------------------ */

/** Cria a aba e o cabecalho se ainda nao existirem. Idempotente. */
function ensureSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(ABA_RESPOSTAS);

  if (!sheet) {
    sheet = ss.insertSheet(ABA_RESPOSTAS);
    var cabecalho = colunas_().map(function (c) { return c.titulo; });
    var range = sheet.getRange(1, 1, 1, cabecalho.length);
    range.setValues([cabecalho]);
    range.setFontWeight('bold');
    range.setBackground('#004AC9');
    range.setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
    sheet.setFrozenColumns(2);
    sheet.setColumnWidth(1, 140);
    sheet.setColumnWidth(2, 130);

    // CPF como texto: sem isso o Sheets transforma em numero e come o zero
    // da esquerda.
    sheet.getRange('B:B').setNumberFormat('@');
  }

  // Remove a aba padrao vazia criada junto com a planilha.
  var padrao = ss.getSheetByName('Sheet1') || ss.getSheetByName('Página1') || ss.getSheetByName('Planilha1');
  if (padrao && ss.getSheets().length > 1) ss.deleteSheet(padrao);

  return sheet;
}

/** Executa uma vez no editor para autorizar o script e preparar a planilha. */
function setup() {
  ensureSheet_();
  return 'Planilha preparada.';
}

/* ------------------------------------------------------------------ */
/* CPF                                                                 */
/* ------------------------------------------------------------------ */

function cpfValido_(cpf) {
  var d = String(cpf == null ? '' : cpf).replace(/\D/g, '');
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;

  var soma = 0, i, dv;
  for (i = 0; i < 9; i++) soma += parseInt(d.charAt(i), 10) * (10 - i);
  dv = (soma * 10) % 11;
  if (dv === 10) dv = 0;
  if (dv !== parseInt(d.charAt(9), 10)) return false;

  soma = 0;
  for (i = 0; i < 10; i++) soma += parseInt(d.charAt(i), 10) * (11 - i);
  dv = (soma * 10) % 11;
  if (dv === 10) dv = 0;
  return dv === parseInt(d.charAt(10), 10);
}

function formatarCpf_(cpf) {
  var d = String(cpf).replace(/\D/g, '');
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function cpfJaRespondeu_(sheet, cpf) {
  var ultimaLinha = sheet.getLastRow();
  if (ultimaLinha < 2) return false;

  var alvo = String(cpf).replace(/\D/g, '');
  var valores = sheet.getRange(2, 2, ultimaLinha - 1, 1).getDisplayValues();
  for (var i = 0; i < valores.length; i++) {
    if (String(valores[i][0]).replace(/\D/g, '') === alvo) return true;
  }
  return false;
}

/* ------------------------------------------------------------------ */
/* Acoes                                                               */
/* ------------------------------------------------------------------ */

function handleCheckCPF(data) {
  try {
    if (!cpfValido_(data.cpf)) return json_({ exists: false, valid: false, message: 'CPF inválido.' });
    return json_({ exists: cpfJaRespondeu_(ensureSheet_(), data.cpf), valid: true });
  } catch (error) {
    return json_({ exists: false, valid: true });
  }
}

/**
 * Texto livre vai para a planilha como texto. Um "=" no inicio seria lido
 * como formula pelo Sheets -- o apostrofo forca texto puro.
 */
function textoSeguro_(valor) {
  var limpo = String(valor == null ? '' : valor).trim();
  if (limpo.length > LIMITE_TEXTO) limpo = limpo.slice(0, LIMITE_TEXTO);
  if (/^[=+\-@]/.test(limpo)) limpo = "'" + limpo;
  return limpo;
}

function handleSubmit(data) {
  if (!cpfValido_(data.cpf)) return json_({ success: false, message: 'CPF inválido.' });

  var respostas = data.respostas || {};
  var linha = [];
  var cols = colunas_();

  // Validacao fora do lock: cada segundo dentro dele vira espera para a fila.
  for (var i = 0; i < cols.length; i++) {
    var chave = cols[i].chave;

    if (chave === 'quando') {
      linha.push(Utilities.formatDate(new Date(), FUSO, 'dd/MM/yyyy HH:mm:ss'));
    } else if (chave === 'cpf') {
      linha.push(formatarCpf_(data.cpf));
    } else if (/\(1-5\)$/.test(cols[i].titulo)) {
      var nota = parseInt(respostas[chave], 10);
      if (isNaN(nota) || nota < 1 || nota > 5) {
        return json_({ success: false, message: 'Responda a pergunta ' + chave.slice(1) + ' antes de enviar.' });
      }
      linha.push(nota);
    } else {
      linha.push(textoSeguro_(respostas[chave]));
    }
  }

  var sheet;
  try {
    sheet = ensureSheet_();
  } catch (error) {
    return json_({ success: false, message: 'Não foi possível registrar sua avaliação. Tente novamente.' });
  }

  var lock = LockService.getScriptLock();

  try {
    lock.waitLock(90000);

    // Idempotente: se o primeiro envio gravou mas a resposta se perdeu no
    // caminho, o reenvio automatico do cliente confirma em vez de falhar.
    if (cpfJaRespondeu_(sheet, data.cpf)) {
      return json_({ success: true, jaRespondido: true, message: 'Avaliação já registrada. Obrigado!' });
    }

    sheet.appendRow(linha);
    SpreadsheetApp.flush();
    return json_({ success: true, message: 'Avaliação registrada com sucesso!' });
  } catch (error) {
    return json_({ success: false, message: 'Não foi possível registrar sua avaliação. Tente novamente.' });
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

/**
 * Devolve todas as respostas, com CPF. O dashboard agrega no navegador.
 * Fail-closed: sem credenciais validas, nada sai daqui.
 */
function handleGetAllData(data) {
  if (!credenciaisValidas_(data)) {
    Utilities.sleep(1500);   // desestimula tentativa de senha em massa
    return json_({ error: 'nao-autorizado' });
  }

  try {
    var sheet = ensureSheet_();
    var cols = colunas_();
    var ultimaLinha = sheet.getLastRow();
    if (ultimaLinha < 2) return json_({ total: 0, participantes: [] });

    var valores = sheet.getRange(2, 1, ultimaLinha - 1, cols.length).getDisplayValues();

    var participantes = valores.map(function (linha) {
      var registro = { respostas: {} };

      for (var i = 0; i < cols.length; i++) {
        var chave = cols[i].chave;
        var valor = String(linha[i] == null ? '' : linha[i]);

        if (chave === 'quando' || chave === 'cpf') {
          registro[chave] = valor;
        } else if (/\(1-5\)$/.test(cols[i].titulo)) {
          var nota = parseInt(valor, 10);
          if (!isNaN(nota)) registro.respostas[chave] = nota;
        } else if (valor) {
          registro.respostas[chave] = valor;
        }
      }

      return registro;
    });

    return json_({ total: participantes.length, participantes: participantes });
  } catch (error) {
    return json_({ error: 'Não foi possível carregar os resultados.' });
  }
}

/**
 * Apaga todas as respostas, mantendo o cabecalho. Use para limpar os testes
 * antes de divulgar. So pelo editor: como endpoint, qualquer um apagaria.
 */
function limparDados() {
  var sheet = ensureSheet_();
  var ultimaLinha = sheet.getLastRow();
  if (ultimaLinha > 1) sheet.deleteRows(2, ultimaLinha - 1);
  SpreadsheetApp.flush();
  return 'Dados apagados.';
}

/* ------------------------------------------------------------------ */
/* Aquecimento                                                         */
/* ------------------------------------------------------------------ */

/**
 * O Apps Script "esfria" quando fica ocioso e a chamada seguinte chega a
 * levar 25s. Um gatilho a cada 5 minutos o mantem ativo enquanto a
 * avaliacao estiver no ar.
 */
function manterAquecido() {
  PropertiesService.getScriptProperties().getProperty(PROP_USUARIO);
}

/** Execute UMA VEZ para ligar o aquecimento. Idempotente. */
function instalarAquecimento() {
  removerAquecimento();

  ScriptApp.newTrigger('manterAquecido')
    .timeBased()
    .everyMinutes(5)
    .create();

  return 'Aquecimento ligado: o script sera acordado a cada 5 minutos.';
}

/** Execute quando a avaliacao terminar, para nao deixar o gatilho rodando a toa. */
function removerAquecimento() {
  var gatilhos = ScriptApp.getProjectTriggers();
  var removidos = 0;

  for (var i = 0; i < gatilhos.length; i++) {
    if (gatilhos[i].getHandlerFunction() === 'manterAquecido') {
      ScriptApp.deleteTrigger(gatilhos[i]);
      removidos++;
    }
  }

  return 'Gatilhos removidos: ' + removidos;
}

/* ------------------------------------------------------------------ */
/* Acesso ao dashboard                                                 */
/* ------------------------------------------------------------------ */

var PROP_USUARIO = 'DASHBOARD_USUARIO';
var PROP_SENHA = 'DASHBOARD_SENHA';

/**
 * A senha vive nas propriedades do script, NUNCA no codigo: este projeto
 * esta em repositorio publico, e uma senha no JavaScript seria lida por
 * qualquer pessoa que abrisse o arquivo.
 */
function credenciaisValidas_(data) {
  var props = PropertiesService.getScriptProperties();
  var usuario = props.getProperty(PROP_USUARIO);
  var senha = props.getProperty(PROP_SENHA);

  if (!usuario || !senha) return false;

  return String(data.usuario == null ? '' : data.usuario).trim().toLowerCase() === usuario.toLowerCase() &&
         String(data.senha == null ? '' : data.senha) === senha;
}

/**
 * Execute UMA VEZ para liberar o dashboard. A senha aparece no resultado da
 * execucao -- copie e guarde, porque ela nao e exibida de novo.
 * Rodar de novo gera uma senha nova e invalida a anterior.
 */
function gerarAcessoDashboard() {
  var senha = Utilities.getUuid().replace(/-/g, '').slice(0, 14);
  var props = PropertiesService.getScriptProperties();

  props.setProperty(PROP_USUARIO, 'diretoria');
  props.setProperty(PROP_SENHA, senha);

  var recado = 'Usuario: diretoria   |   Senha: ' + senha;
  Logger.log(recado);
  return recado;
}

/** Fecha o dashboard para todo mundo, ate gerar um acesso novo. */
function revogarAcessoDashboard() {
  var props = PropertiesService.getScriptProperties();
  props.deleteProperty(PROP_USUARIO);
  props.deleteProperty(PROP_SENHA);
  return 'Acesso ao dashboard revogado.';
}
