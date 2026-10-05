/**
 * SUPER FM | MEU PROGRAMA EM 2027 - Grupo Parana
 *
 * Backend Apps Script vinculado a planilha de respostas (container-bound).
 *
 * IDENTIFICADO: grava nome e programa. O formulario avisa isso antes de a
 * pessoa escrever -- o objetivo e o planejamento individual para 2027.
 */

var FUSO = 'America/Campo_Grande';   // Grupo Paraná fica em MS (UTC-4)
var ABA_RESPOSTAS = 'Respostas';
var LIMITE_TEXTO = 3000;
var LIMITE_CURTO = 120;

/** Colunas da aba Respostas, na ordem. Precisa bater com PERGUNTAS em script.js. */
var COLUNAS = [
  { chave: 'quando',   titulo: 'Data/hora' },
  { chave: 'nome',     titulo: 'Nome',     limite: LIMITE_CURTO },
  { chave: 'programa', titulo: 'Programa', limite: LIMITE_CURTO },
  { chave: 'manter',   titulo: '1. O que preciso MANTER?',   limite: LIMITE_TEXTO },
  { chave: 'melhorar', titulo: '2. O que preciso MELHORAR?', limite: LIMITE_TEXTO },
  { chave: 'criar',    titulo: '3. O que preciso CRIAR?',    limite: LIMITE_TEXTO }
];

/* ------------------------------------------------------------------ */
/* Roteamento                                                          */
/* ------------------------------------------------------------------ */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    // Ping: so acorda o script. Nao toca na planilha de proposito -- serve
    // para pagar o cold start enquanto a pessoa escreve.
    if (data.action === 'ping') return json_({ ok: true });

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

function ensureSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(ABA_RESPOSTAS);

  if (!sheet) {
    sheet = ss.insertSheet(ABA_RESPOSTAS, 0);
    var cabecalho = COLUNAS.map(function (c) { return c.titulo; });
    var range = sheet.getRange(1, 1, 1, cabecalho.length);
    range.setValues([cabecalho]);
    range.setFontWeight('bold');
    range.setBackground('#004AC9');
    range.setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 130);
    sheet.setColumnWidth(2, 180);
    sheet.setColumnWidth(3, 180);
    sheet.setColumnWidths(4, 3, 380);
    sheet.getRange('D:F').setWrap(true);
  }

  // Remove a aba padrao vazia criada junto com a planilha.
  var padrao = ss.getSheetByName('Sheet1') || ss.getSheetByName('Página1') || ss.getSheetByName('Planilha1');
  if (padrao && ss.getSheets().length > 1) ss.deleteSheet(padrao);

  return sheet;
}

/** Executa no editor para autorizar o script e preparar a planilha. */
function setup() {
  ensureSheet_();
  return 'Planilha preparada.';
}

/* ------------------------------------------------------------------ */
/* Envio                                                               */
/* ------------------------------------------------------------------ */

/**
 * Texto livre vai para a planilha como texto. Um "=" no inicio seria lido
 * como formula pelo Sheets -- o apostrofo forca texto puro.
 */
function textoSeguro_(valor, limite) {
  var limpo = String(valor == null ? '' : valor).trim();
  if (limpo.length > limite) limpo = limpo.slice(0, limite);
  if (/^[=+\-@]/.test(limpo)) limpo = "'" + limpo;
  return limpo;
}

/**
 * O envioId e um codigo aleatorio gerado pelo navegador. Fica so no cache por
 * 6h, para que a repeticao automatica do cliente (quando a conexao falha
 * depois de o servidor ja ter gravado) nao duplique a resposta.
 */
function chaveEnvio_(envioId) {
  var id = String(envioId == null ? '' : envioId).replace(/[^A-Za-z0-9-]/g, '').slice(0, 64);
  return id ? 'envio_' + id : null;
}

function handleSubmit(data) {
  var respostas = data.respostas || {};
  var linha = [];

  // Validacao fora do lock: cada segundo dentro dele vira espera para a fila.
  for (var i = 0; i < COLUNAS.length; i++) {
    var col = COLUNAS[i];

    if (col.chave === 'quando') {
      linha.push(Utilities.formatDate(new Date(), FUSO, 'dd/MM/yyyy HH:mm'));
      continue;
    }

    var texto = textoSeguro_(respostas[col.chave], col.limite);
    if (!texto) {
      return json_({ success: false, message: 'Preencha o campo "' + col.titulo + '" antes de enviar.' });
    }
    linha.push(texto);
  }

  var sheet;
  try {
    sheet = ensureSheet_();
  } catch (error) {
    return json_({ success: false, message: 'Não foi possível registrar suas respostas. Tente novamente.' });
  }

  var cache = CacheService.getScriptCache();
  var chave = chaveEnvio_(data.envioId);
  var lock = LockService.getScriptLock();

  try {
    lock.waitLock(90000);

    if (chave && cache.get(chave)) {
      return json_({ success: true, repetido: true, message: 'Respostas registradas com sucesso!' });
    }

    sheet.appendRow(linha);
    SpreadsheetApp.flush();
    if (chave) cache.put(chave, '1', 21600);

    return json_({ success: true, message: 'Respostas registradas com sucesso!' });
  } catch (error) {
    return json_({ success: false, message: 'Não foi possível registrar suas respostas. Tente novamente.' });
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

/** Fail-closed: sem credenciais validas, nada sai daqui. */
function handleGetAllData(data) {
  if (!credenciaisValidas_(data)) {
    Utilities.sleep(1500);   // desestimula tentativa de senha em massa
    return json_({ error: 'nao-autorizado' });
  }

  try {
    var sheet = ensureSheet_();
    var ultimaLinha = sheet.getLastRow();
    if (ultimaLinha < 2) return json_({ total: 0, respostas: [] });

    var valores = sheet.getRange(2, 1, ultimaLinha - 1, COLUNAS.length).getDisplayValues();

    var respostas = valores.map(function (linha) {
      var registro = {};
      for (var i = 0; i < COLUNAS.length; i++) registro[COLUNAS[i].chave] = String(linha[i] == null ? '' : linha[i]);
      return registro;
    }).filter(function (r) { return r.nome; });

    return json_({ total: respostas.length, respostas: respostas });
  } catch (error) {
    return json_({ error: 'Não foi possível carregar as respostas.' });
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
 * levar 25s. Um gatilho a cada 5 minutos o mantem ativo enquanto o
 * questionario estiver no ar.
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

/** Execute quando o questionario terminar, para nao deixar o gatilho rodando a toa. */
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
