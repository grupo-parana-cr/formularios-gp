/**
 * PESQUISA | BEM-ESTAR E FATORES DE PREOCUPACAO - Grupo Parana
 *
 * Backend Apps Script vinculado a planilha de respostas (container-bound).
 *
 * PRIVACIDADE: o CPF chega ate aqui apenas para impedir resposta duplicada.
 * Ele NUNCA e gravado. Guardamos somente um hash SHA-256 com salt secreto,
 * em uma aba separada das respostas, para que nao seja possivel ligar uma
 * pessoa ao que ela respondeu.
 */

var ABA_RESPOSTAS = 'Respostas';
var ABA_CONTROLE = 'Controle';
var LIMITE_TEXTO_OUTRO = 500;

var CABECALHO_RESPOSTAS = [
  'Data',
  'Q1 - Trabalho',
  'Q1 - Outro',
  'Q2 - Fora do trabalho',
  'Q2 - Outro',
  'Q3 - Interferencia (0-10)',
  'Q4 - Manifestacoes',
  'Q4 - Outro'
];

var CABECALHO_CONTROLE = ['Hash', 'Data/Hora'];

/** Opcoes validas de cada pergunta. Server-side: o que nao estiver aqui e descartado. */
var OPCOES = {
  q1: [
    'Volume elevado de atividades',
    'Muitas demandas ou prazos ao mesmo tempo',
    'Falta de clareza sobre prioridades ou responsabilidades',
    'Mudanças e imprevistos frequentes',
    'Dificuldades de comunicação',
    'Conflitos ou dificuldades de relacionamento',
    'Receio de cometer erros',
    'Dificuldade para organizar ou priorizar minhas atividades',
    'Dificuldade para me desligar do trabalho após o expediente',
    'Não tenho sentido preocupação ou desgaste significativo relacionado ao trabalho'
  ],
  q2: [
    'Questões financeiras',
    'Responsabilidades familiares',
    'Relacionamentos',
    'Questões relacionadas à saúde ou bem-estar',
    'Falta de descanso ou sono adequado',
    'Incertezas ou preocupações com o futuro',
    'Excesso de compromissos e responsabilidades',
    'Dificuldade em conciliar as diferentes áreas da vida',
    'Excesso de celular, redes sociais ou informações',
    'Não tenho sentido preocupação ou desgaste significativo'
  ],
  q4: [
    'Medo ou sensação de que algo ruim pode acontecer',
    'Sintomas físicos, como tensão muscular, dor de cabeça, palpitação, falta de ar ou desconforto no estômago',
    'Pensamentos repetitivos ou dificuldade de parar de pensar em determinadas situações',
    'Necessidade de conferir, organizar ou repetir determinadas ações para se sentir mais tranquilo',
    'Tristeza, desânimo ou perda de interesse nas atividades',
    'Agitação ou dificuldade para relaxar',
    'Irritação ou impaciência',
    'Dificuldade para dormir ou sono prejudicado',
    'Dificuldade de concentração',
    'Sensação de cansaço ou esgotamento',
    'Não percebo nenhuma dessas manifestações'
  ]
};

/* ------------------------------------------------------------------ */
/* Roteamento                                                          */
/* ------------------------------------------------------------------ */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    // Ping: só acorda o script. Não toca na planilha de propósito -- serve
    // para pagar o cold start (que chega a 25s) enquanto a pessoa lê a capa,
    // em vez de na hora de enviar a resposta.
    if (data.action === 'ping') return json_({ ok: true });

    if (data.action === 'checkCPF') return handleCheckCPF(data);
    if (data.action === 'getAllData') return handleGetAllData();
    if (data.action === 'submit') return handleSubmit(data);

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

/** Cria as abas e cabecalhos se ainda nao existirem. Idempotente. */
function ensureSheets_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var respostas = ss.getSheetByName(ABA_RESPOSTAS);
  if (!respostas) {
    respostas = ss.insertSheet(ABA_RESPOSTAS);
    escreverCabecalho_(respostas, CABECALHO_RESPOSTAS);
    respostas.setColumnWidth(2, 320);
    respostas.setColumnWidth(4, 320);
    respostas.setColumnWidth(7, 320);
  }

  var controle = ss.getSheetByName(ABA_CONTROLE);
  if (!controle) {
    controle = ss.insertSheet(ABA_CONTROLE);
    escreverCabecalho_(controle, CABECALHO_CONTROLE);
    controle.setColumnWidth(1, 460);
  }

  // Remove a aba padrao vazia criada junto com a planilha.
  var padrao = ss.getSheetByName('Sheet1') || ss.getSheetByName('Página1');
  if (padrao && ss.getSheets().length > 2) ss.deleteSheet(padrao);

  return { ss: ss, respostas: respostas, controle: controle };
}

function escreverCabecalho_(sheet, cabecalho) {
  var range = sheet.getRange(1, 1, 1, cabecalho.length);
  range.setValues([cabecalho]);
  range.setFontWeight('bold');
  range.setBackground('#004AC9');
  range.setFontColor('#FFFFFF');
  sheet.setFrozenRows(1);
}

/** Executa uma vez para preparar a planilha sem esperar a primeira resposta. */
function setup() {
  ensureSheets_();
  obterSalt_();
  return 'Planilha preparada.';
}

/* ------------------------------------------------------------------ */
/* Hash do CPF                                                         */
/* ------------------------------------------------------------------ */

/**
 * Salt secreto, gerado sozinho na primeira execucao e guardado nas
 * propriedades do script. Nunca vai para o repositorio. Sem ele, um hash
 * de CPF seria reversivel por forca bruta.
 */
function obterSalt_() {
  var props = PropertiesService.getScriptProperties();
  var salt = props.getProperty('CPF_SALT');
  if (!salt) {
    salt = Utilities.getUuid() + Utilities.getUuid();
    props.setProperty('CPF_SALT', salt);
  }
  return salt;
}

function normalizarCpf_(cpf) {
  return String(cpf == null ? '' : cpf).replace(/\D/g, '').trim();
}

function hashCpf_(cpf) {
  var limpo = normalizarCpf_(cpf);
  if (limpo.length !== 11) return null;

  var bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    obterSalt_() + limpo,
    Utilities.Charset.UTF_8
  );

  return bytes.map(function (b) {
    return ('0' + (b & 0xff).toString(16)).slice(-2);
  }).join('');
}

function hashJaRespondeu_(controle, hash) {
  var ultimaLinha = controle.getLastRow();
  if (ultimaLinha < 2) return false;

  var hashes = controle.getRange(2, 1, ultimaLinha - 1, 1).getValues();
  for (var i = 0; i < hashes.length; i++) {
    if (String(hashes[i][0]).trim() === hash) return true;
  }
  return false;
}

/* ------------------------------------------------------------------ */
/* Acoes                                                               */
/* ------------------------------------------------------------------ */

function handleCheckCPF(data) {
  try {
    var hash = hashCpf_(data.cpf);
    if (!hash) return json_({ exists: false, valid: false, message: 'CPF inválido.' });

    var sheets = ensureSheets_();
    return json_({ exists: hashJaRespondeu_(sheets.controle, hash), valid: true });
  } catch (error) {
    return json_({ exists: false, valid: true });
  }
}

/** Mantem apenas as opcoes que constam da lista canonica da pergunta. */
function filtrarOpcoes_(recebidas, validas) {
  if (!Array.isArray(recebidas)) return [];

  var resultado = [];
  for (var i = 0; i < recebidas.length; i++) {
    var item = String(recebidas[i]).trim();
    if (validas.indexOf(item) !== -1 && resultado.indexOf(item) === -1) {
      resultado.push(item);
    }
  }
  return resultado;
}

function limparTextoOutro_(texto) {
  var limpo = String(texto == null ? '' : texto).trim();
  return limpo.length > LIMITE_TEXTO_OUTRO ? limpo.slice(0, LIMITE_TEXTO_OUTRO) : limpo;
}

function handleSubmit(data) {
  var lock = LockService.getScriptLock();

  try {
    lock.waitLock(30000);

    var hash = hashCpf_(data.cpf);
    if (!hash) return json_({ success: false, message: 'CPF inválido.' });

    var sheets = ensureSheets_();

    if (hashJaRespondeu_(sheets.controle, hash)) {
      return json_({ success: false, message: 'Esta pesquisa já foi respondida com este CPF. Obrigado por participar!' });
    }

    var q3 = parseInt(data.q3, 10);
    if (isNaN(q3) || q3 < 0 || q3 > 10) {
      return json_({ success: false, message: 'Responda a pergunta 3 antes de enviar.' });
    }

    var q1 = filtrarOpcoes_(data.q1, OPCOES.q1);
    var q2 = filtrarOpcoes_(data.q2, OPCOES.q2);
    var q4 = filtrarOpcoes_(data.q4, OPCOES.q4);
    var q1Outro = limparTextoOutro_(data.q1Outro);
    var q2Outro = limparTextoOutro_(data.q2Outro);
    var q4Outro = limparTextoOutro_(data.q4Outro);

    if (!q1.length && !q1Outro) return json_({ success: false, message: 'Responda a pergunta 1 antes de enviar.' });
    if (!q2.length && !q2Outro) return json_({ success: false, message: 'Responda a pergunta 2 antes de enviar.' });
    if (!q4.length && !q4Outro) return json_({ success: false, message: 'Responda a pergunta 4 antes de enviar.' });

    var hoje = Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy');
    var linha = [
      hoje,
      q1.join('; '),
      q1Outro,
      q2.join('; '),
      q2Outro,
      q3,
      q4.join('; '),
      q4Outro
    ];

    inserirEmLinhaAleatoria_(sheets.respostas, linha);

    // O controle guarda so o hash: nada aqui identifica a resposta acima.
    sheets.controle.appendRow([
      hash,
      Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm:ss')
    ]);

    SpreadsheetApp.flush();

    return json_({ success: true, message: 'Resposta registrada com sucesso!' });
  } catch (error) {
    return json_({ success: false, message: 'Não foi possível registrar sua resposta. Tente novamente.' });
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

/**
 * Grava a resposta em uma posicao aleatoria em vez do fim da aba. Assim a
 * ordem das linhas nao corresponde a ordem dos hashes na aba Controle, e
 * nao da para correlacionar quem respondeu o que pela sequencia de envio.
 */
function inserirEmLinhaAleatoria_(sheet, linha) {
  var ultimaLinha = sheet.getLastRow();

  if (ultimaLinha < 2) {
    sheet.appendRow(linha);
    return;
  }

  var alvo = 2 + Math.floor(Math.random() * ultimaLinha);

  if (alvo > ultimaLinha) {
    sheet.appendRow(linha);
    return;
  }

  sheet.insertRowBefore(alvo);
  sheet.getRange(alvo, 1, 1, linha.length).setValues([linha]);
}

/* ------------------------------------------------------------------ */
/* Dashboard - devolve apenas dados agregados                          */
/* ------------------------------------------------------------------ */

function handleGetAllData() {
  try {
    var sheets = ensureSheets_();
    var sheet = sheets.respostas;

    var resultado = {
      total: 0,
      q1: contadorZerado_(OPCOES.q1), q1Outros: [],
      q2: contadorZerado_(OPCOES.q2), q2Outros: [],
      q3: { histograma: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], media: 0 },
      q4: contadorZerado_(OPCOES.q4), q4Outros: []
    };

    var ultimaLinha = sheet.getLastRow();
    if (ultimaLinha < 2) return json_(resultado);

    var valores = sheet.getRange(2, 1, ultimaLinha - 1, CABECALHO_RESPOSTAS.length).getValues();
    var somaQ3 = 0;
    var totalQ3 = 0;

    for (var i = 0; i < valores.length; i++) {
      var linha = valores[i];
      resultado.total++;

      acumular_(resultado.q1, linha[1]);
      adicionarOutro_(resultado.q1Outros, linha[2]);
      acumular_(resultado.q2, linha[3]);
      adicionarOutro_(resultado.q2Outros, linha[4]);

      var nota = parseInt(linha[5], 10);
      if (!isNaN(nota) && nota >= 0 && nota <= 10) {
        resultado.q3.histograma[nota]++;
        somaQ3 += nota;
        totalQ3++;
      }

      acumular_(resultado.q4, linha[6]);
      adicionarOutro_(resultado.q4Outros, linha[7]);
    }

    resultado.q3.media = totalQ3 ? Math.round((somaQ3 / totalQ3) * 10) / 10 : 0;

    return json_(resultado);
  } catch (error) {
    return json_({ error: 'Não foi possível carregar os resultados.' });
  }
}

function contadorZerado_(opcoes) {
  var contador = {};
  for (var i = 0; i < opcoes.length; i++) contador[opcoes[i]] = 0;
  return contador;
}

function acumular_(contador, celula) {
  var texto = String(celula == null ? '' : celula).trim();
  if (!texto) return;

  var itens = texto.split(';');
  for (var i = 0; i < itens.length; i++) {
    var item = itens[i].trim();
    if (item && contador.hasOwnProperty(item)) contador[item]++;
  }
}

function adicionarOutro_(lista, celula) {
  var texto = String(celula == null ? '' : celula).trim();
  if (texto) lista.push(texto);
}

/**
 * Apaga todas as respostas e hashes, mantendo os cabeçalhos.
 * Use para limpar os dados de teste antes de divulgar a pesquisa.
 */
function limparDados() {
  var sheets = ensureSheets_();

  [sheets.respostas, sheets.controle].forEach(function (sheet) {
    var ultimaLinha = sheet.getLastRow();
    if (ultimaLinha > 1) sheet.deleteRows(2, ultimaLinha - 1);
  });

  SpreadsheetApp.flush();
  return 'Dados apagados.';
}

/* ------------------------------------------------------------------ */
/* Aquecimento                                                         */
/* ------------------------------------------------------------------ */

/**
 * O Apps Script "esfria" quando fica ocioso e a chamada seguinte chega a
 * levar 25s -- tempo em que quem responde acha que a pesquisa travou.
 * Um gatilho a cada 5 minutos mantem o script ativo enquanto a pesquisa
 * estiver no ar. O custo e irrisorio: ~1s por execucao.
 */
function manterAquecido() {
  PropertiesService.getScriptProperties().getProperty('CPF_SALT');
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

/** Execute quando a pesquisa terminar, para nao deixar o gatilho rodando a toa. */
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
