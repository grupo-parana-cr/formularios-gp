/**
 * AVALIACAO INTERNA | RADIO SUPER FM - Grupo Parana
 *
 * Backend Apps Script vinculado a planilha de respostas (container-bound).
 *
 * ANONIMA: nao recebe nem grava nada que identifique quem respondeu -- sem
 * nome, sem CPF, sem horario (so a data). Cada resposta entra numa linha
 * aleatoria da aba, para que a ordem nao revele quem enviou primeiro.
 * Qualquer alteracao precisa preservar isso: o formulario promete anonimato.
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
  var lista = [{ chave: 'quando', titulo: 'Data' }];

  for (var i = 0; i < TIPOS.length; i++) {
    var n = i + 1;
    var tipo = TIPOS.charAt(i);

    if (tipo === 'a') {
      lista.push({ chave: 'p' + n, titulo: 'P' + n + ' (aberta)', nota: false });
    } else {
      lista.push({ chave: 'p' + n, titulo: 'P' + n + ' (1-5)', nota: true });
      if (tipo === 'c') lista.push({ chave: 'p' + n + 'c', titulo: 'P' + n + ' - Comentario', nota: false });
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

/**
 * Cria a aba e o cabecalho se ainda nao existirem. Se encontrar uma aba
 * Respostas com outro cabecalho (a versao de teste que tinha CPF), ela e
 * renomeada e deixada de lado: nao se mistura com as respostas anonimas.
 */
function ensureSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var cabecalho = colunas_().map(function (c) { return c.titulo; });
  var sheet = ss.getSheetByName(ABA_RESPOSTAS);

  if (sheet) {
    var atual = sheet.getRange(1, 1, 1, cabecalho.length).getDisplayValues()[0];
    if (atual.join('|') !== cabecalho.join('|')) {
      sheet.setName('Teste antigo (com CPF) - apagar');
      sheet = null;
    }
  }

  if (!sheet) {
    sheet = ss.insertSheet(ABA_RESPOSTAS, 0);
    var range = sheet.getRange(1, 1, 1, cabecalho.length);
    range.setValues([cabecalho]);
    range.setFontWeight('bold');
    range.setBackground('#004AC9');
    range.setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
    sheet.setFrozenColumns(1);
    sheet.setColumnWidth(1, 100);
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
function textoSeguro_(valor) {
  var limpo = String(valor == null ? '' : valor).trim();
  if (limpo.length > LIMITE_TEXTO) limpo = limpo.slice(0, LIMITE_TEXTO);
  if (/^[=+\-@]/.test(limpo)) limpo = "'" + limpo;
  return limpo;
}

/**
 * O envioId e um codigo aleatorio gerado pelo navegador a cada avaliacao.
 * Nao identifica ninguem e NAO vai para a planilha: fica so no cache por 6h,
 * para que a repeticao automatica do cliente (quando a conexao falha depois
 * de o servidor ja ter gravado) nao duplique a avaliacao.
 */
function chaveEnvio_(envioId) {
  var id = String(envioId == null ? '' : envioId).replace(/[^A-Za-z0-9-]/g, '').slice(0, 64);
  return id ? 'envio_' + id : null;
}

function handleSubmit(data) {
  var respostas = data.respostas || {};
  var cols = colunas_();
  var linha = [];

  // Validacao fora do lock: cada segundo dentro dele vira espera para a fila.
  for (var i = 0; i < cols.length; i++) {
    var col = cols[i];

    if (col.chave === 'quando') {
      // So a data. Com o horario, daria para cruzar com quem estava no
      // computador naquele momento.
      linha.push(Utilities.formatDate(new Date(), FUSO, 'dd/MM/yyyy'));
    } else if (col.nota) {
      var nota = parseInt(respostas[col.chave], 10);
      if (isNaN(nota) || nota < 1 || nota > 5) {
        return json_({ success: false, message: 'Responda a pergunta ' + col.chave.slice(1) + ' antes de enviar.' });
      }
      linha.push(nota);
    } else {
      linha.push(textoSeguro_(respostas[col.chave]));
    }
  }

  var sheet;
  try {
    sheet = ensureSheet_();
  } catch (error) {
    return json_({ success: false, message: 'Não foi possível registrar sua avaliação. Tente novamente.' });
  }

  var cache = CacheService.getScriptCache();
  var chave = chaveEnvio_(data.envioId);
  var lock = LockService.getScriptLock();

  try {
    lock.waitLock(90000);

    if (chave && cache.get(chave)) {
      return json_({ success: true, repetido: true, message: 'Avaliação registrada com sucesso!' });
    }

    inserirEmLinhaAleatoria_(sheet, linha);
    SpreadsheetApp.flush();
    if (chave) cache.put(chave, '1', 21600);

    return json_({ success: true, message: 'Avaliação registrada com sucesso!' });
  } catch (error) {
    return json_({ success: false, message: 'Não foi possível registrar sua avaliação. Tente novamente.' });
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

/**
 * Grava a resposta numa posicao aleatoria em vez do fim da aba, para que a
 * ordem das linhas nao revele quem enviou primeiro. A nova resposta ocupa o
 * lugar de uma linha sorteada, e a que estava ali vai para o fim -- mesmo
 * efeito de inserir no meio, sem reestruturar a planilha.
 */
function inserirEmLinhaAleatoria_(sheet, linha) {
  var ultimaLinha = sheet.getLastRow();

  if (ultimaLinha < 2) {
    sheet.appendRow(linha);
    return;
  }

  var alvo = 2 + Math.floor(Math.random() * (ultimaLinha - 1));
  var faixa = sheet.getRange(alvo, 1, 1, linha.length);
  var deslocada = faixa.getValues()[0];

  faixa.setValues([linha]);
  sheet.appendRow(deslocada);
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

/**
 * Devolve todas as avaliacoes (anonimas). O dashboard agrega no navegador.
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
      var registro = { quando: '', respostas: {} };

      for (var i = 0; i < cols.length; i++) {
        var col = cols[i];
        var valor = String(linha[i] == null ? '' : linha[i]);

        if (col.chave === 'quando') {
          registro.quando = valor;
        } else if (col.nota) {
          var nota = parseInt(valor, 10);
          if (!isNaN(nota)) registro.respostas[col.chave] = nota;
        } else if (valor) {
          registro.respostas[col.chave] = valor;
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
