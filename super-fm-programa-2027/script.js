/**
 * SUPER FM | MEU PROGRAMA EM 2027 - Grupo Paraná
 *
 * Questionário IDENTIFICADO (nome e programa): o objetivo é transformar a
 * avaliação interna em responsabilidade individual e planejamento para 2027.
 * O texto da página diz isso com clareza, antes de a pessoa escrever.
 *
 * As perguntas ficam em PERGUNTAS, reaproveitada pelo dashboard.
 */

var URL_APPS_SCRIPT = 'https://script.google.com/macros/s/AKfycbzZvLMOTsI8atQZ0YM0Y9uxGdGFuC-coYy28tptrZuueWcfJxG82hEoZ62US-AciR1--g/exec';

var PERGUNTAS = [
  {
    chave: 'manter',
    titulo: 'O que preciso MANTER?',
    texto: 'O que faço bem hoje, no meu programa e na minha atuação, e que considero importante preservar e fortalecer?'
  },
  {
    chave: 'melhorar',
    titulo: 'O que preciso MELHORAR?',
    texto: 'O que reconheço que precisa evoluir no meu programa ou na minha própria performance? O que posso fazer melhor?'
  },
  {
    chave: 'criar',
    titulo: 'O que preciso CRIAR?',
    texto: 'O que posso fazer de novo no meu programa para inovar, gerar mais interesse, aproximar os ouvintes, valorizar os anunciantes e contribuir para o crescimento da Super FM?'
  }
];

var LIMITE_TEXTO = 3000;
var LIMITE_CURTO = 120;
var CHAVE_RASCUNHO = 'rascunho-super-fm-programa-2027';

var estado = {
  envioId: '',
  enviando: false
};

/* ------------------------------------------------------------------ */
/* Utilitários                                                         */
/* ------------------------------------------------------------------ */

function $(id) { return document.getElementById(id); }

function desenharIcones() {
  if (window.lucide && typeof lucide.createIcons === 'function') lucide.createIcons();
}

function escapar(texto) {
  var div = document.createElement('div');
  div.textContent = texto == null ? '' : String(texto);
  return div.innerHTML;
}

var timerAviso = null;

function avisar(mensagem, tipo) {
  var caixa = $('aviso-caixa');
  caixa.className = 'text-white text-sm px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 max-w-md ' +
    (tipo === 'erro' ? 'bg-red-600' : tipo === 'ok' ? 'bg-emerald-600' : 'bg-neutral-900');

  $('aviso-texto').textContent = mensagem;
  $('aviso-icone').setAttribute('data-lucide', tipo === 'erro' ? 'alert-circle' : tipo === 'ok' ? 'check-circle' : 'info');
  $('aviso').hidden = false;
  desenharIcones();

  clearTimeout(timerAviso);
  timerAviso = setTimeout(function () { $('aviso').hidden = true; }, tipo === 'info' ? 15000 : 4000);
}

/**
 * Envia ao Apps Script sem header Content-Type: o navegador aplica
 * text/plain, o que evita o preflight OPTIONS que o Apps Script não responde.
 */
function enviarAoServidor(dados, tentativa) {
  var controle = new AbortController();
  // 90s = o mesmo tempo que o servidor espera na fila. Desistir antes disso
  // descartaria uma resposta que ainda seria gravada.
  var expirou = setTimeout(function () { controle.abort(); }, 90000);

  return fetch(URL_APPS_SCRIPT, {
    method: 'POST',
    body: JSON.stringify(dados),
    signal: controle.signal
  }).then(function (resposta) {
    clearTimeout(expirou);
    return resposta.text();
  }).then(function (texto) {
    // O Apps Script às vezes devolve uma página de erro do Google em vez de
    // JSON. Tratar como falha para que a repetição cubra.
    try {
      return JSON.parse(texto);
    } catch (erro) {
      throw new Error('resposta-invalida');
    }
  }).catch(function (falha) {
    clearTimeout(expirou);

    var numero = tentativa || 1;
    if (numero < 3) {
      return new Promise(function (resolve) {
        setTimeout(resolve, 1500 * numero);
      }).then(function () {
        return enviarAoServidor(dados, numero + 1);
      });
    }

    throw falha;
  });
}

/**
 * Só para LEITURA. As falhas do Apps Script são aleatórias e independentes:
 * dispara tentativas escalonadas e usa a primeira que voltar com JSON válido.
 */
function buscarComHedge(dados, aoDemorar) {
  var ATRASOS = [0, 8000, 20000];
  var pendentes = ATRASOS.length;

  return new Promise(function (resolve, reject) {
    var resolvido = false;

    function tentar(indice) {
      if (resolvido) return;

      if (indice > 0 && typeof aoDemorar === 'function') aoDemorar(indice);

      var controle = new AbortController();
      var expirou = setTimeout(function () { controle.abort(); }, 40000);

      fetch(URL_APPS_SCRIPT, {
        method: 'POST',
        body: JSON.stringify(dados),
        signal: controle.signal
      })
        .then(function (r) { clearTimeout(expirou); return r.text(); })
        .then(function (texto) {
          var json = JSON.parse(texto);   // página de erro do Google cai no catch
          if (!resolvido) { resolvido = true; resolve(json); }
        })
        .catch(function (falha) {
          clearTimeout(expirou);
          pendentes--;
          if (!resolvido && pendentes === 0) reject(falha);
        });
    }

    ATRASOS.forEach(function (atraso, i) {
      setTimeout(function () { tentar(i); }, atraso);
    });
  });
}

/* ------------------------------------------------------------------ */
/* Rascunho                                                            */
/* ------------------------------------------------------------------ */

/**
 * São respostas longas, escritas com calma: perder tudo num recarregamento
 * faria a pessoa desistir. O rascunho fica em sessionStorage, e não em
 * localStorage, de propósito: some quando a aba fecha. No computador
 * compartilhado do estúdio, o próximo colega não vê o texto do anterior.
 */
function campos() {
  return ['nome', 'programa'].concat(PERGUNTAS.map(function (p) { return p.chave; }));
}

function lerFormulario() {
  var respostas = {};
  campos().forEach(function (chave) {
    respostas[chave] = $('campo-' + chave).value.trim();
  });
  return respostas;
}

var timerRascunho = null;

function salvarRascunhoDepois() {
  clearTimeout(timerRascunho);
  timerRascunho = setTimeout(function () {
    try {
      sessionStorage.setItem(CHAVE_RASCUNHO, JSON.stringify({
        envioId: estado.envioId, respostas: lerFormulario()
      }));
    } catch (erro) { /* armazenamento bloqueado: segue sem rascunho */ }
  }, 600);
}

function restaurarRascunho() {
  var rascunho = null;
  try {
    rascunho = JSON.parse(sessionStorage.getItem(CHAVE_RASCUNHO) || 'null');
  } catch (erro) { /* ignora */ }

  if (!rascunho || !rascunho.respostas) return false;

  var algum = false;
  campos().forEach(function (chave) {
    var valor = rascunho.respostas[chave];
    if (valor) {
      $('campo-' + chave).value = valor;
      algum = true;
    }
  });

  if (algum && rascunho.envioId) estado.envioId = rascunho.envioId;
  return algum;
}

function apagarRascunho() {
  try { sessionStorage.removeItem(CHAVE_RASCUNHO); } catch (erro) {}
}

/**
 * Código aleatório do envio: serve só para o servidor reconhecer uma
 * repetição automática (quando a conexão falha depois de já ter gravado) e
 * não registrar a mesma resposta duas vezes.
 */
function novoEnvioId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/* ------------------------------------------------------------------ */
/* Formulário                                                          */
/* ------------------------------------------------------------------ */

function renderizarPerguntas() {
  $('lista-perguntas').innerHTML = PERGUNTAS.map(function (p, i) {
    return '<div class="bloco-pergunta py-7 border-t border-neutral-100" id="bloco-' + p.chave + '">' +
        '<p class="text-xs font-semibold tracking-wide uppercase text-gp-blue mb-1.5">Pergunta ' + (i + 1) + ' de ' + PERGUNTAS.length + '</p>' +
        '<label for="campo-' + p.chave + '" class="block">' +
          '<span class="block text-xl md:text-2xl font-semibold tracking-tight leading-snug mb-2">' + escapar(p.titulo) + '</span>' +
          '<span class="block text-[15px] text-neutral-500 leading-relaxed mb-4">' + escapar(p.texto) + '</span>' +
        '</label>' +
        '<textarea id="campo-' + p.chave + '" rows="6" maxlength="' + LIMITE_TEXTO + '" ' +
          'placeholder="Escreva sua resposta" oninput="aoDigitar(\'' + p.chave + '\')" ' +
          'class="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-gp-blue focus:ring-0 outline-none transition-colors resize-y text-[15px] leading-relaxed"></textarea>' +
        '<p class="erro-campo text-sm text-red-600 mt-2" hidden>Responda esta pergunta antes de enviar.</p>' +
      '</div>';
  }).join('');
}

function aoDigitar(chave) {
  var bloco = $('bloco-' + chave);
  if ($('campo-' + chave).value.trim()) {
    bloco.classList.remove('pendente');
    bloco.querySelector('.erro-campo').hidden = true;
  }
  salvarRascunhoDepois();
}

/** Todos os campos são obrigatórios: é um plano individual, não uma enquete. */
function camposFaltando(respostas) {
  return campos().filter(function (chave) { return !respostas[chave]; });
}

function enviar() {
  if (estado.enviando) return;

  var respostas = lerFormulario();
  var faltando = camposFaltando(respostas);

  if (faltando.length) {
    faltando.forEach(function (chave) {
      var bloco = $('bloco-' + chave);
      bloco.classList.add('pendente');
      bloco.querySelector('.erro-campo').hidden = false;
    });

    $('bloco-' + faltando[0]).scrollIntoView({ behavior: 'smooth', block: 'center' });
    avisar(faltando.length === 1 ? 'Falta preencher um campo.' : 'Faltam ' + faltando.length + ' campos.', 'erro');
    return;
  }

  estado.enviando = true;
  var botao = $('btn-enviar');
  botao.disabled = true;
  $('btn-enviar-texto').textContent = 'Enviando...';

  // Se o servidor estiver frio a resposta pode demorar. Sem este aviso a
  // pessoa acha que travou, fecha a página e perde o que escreveu.
  var avisoDemora = setTimeout(function () {
    avisar('Ainda enviando... não feche esta página.', 'info');
  }, 6000);

  function liberarBotao() {
    estado.enviando = false;
    botao.disabled = false;
    $('btn-enviar-texto').textContent = 'Enviar respostas';
  }

  enviarAoServidor({ action: 'submit', envioId: estado.envioId, respostas: respostas })
    .then(function (resultado) {
      clearTimeout(avisoDemora);

      if (!resultado.success) {
        avisar(resultado.message || 'Não foi possível enviar.', 'erro');
        liberarBotao();
        return;
      }

      apagarRascunho();
      $('aviso').hidden = true;
      $('formulario').hidden = true;
      $('fim-nome').textContent = respostas.nome.split(/\s+/)[0];
      $('fim').hidden = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      desenharIcones();
    })
    .catch(function () {
      clearTimeout(avisoDemora);
      avisar('Falha de conexão. Suas respostas continuam aqui — tente enviar de novo.', 'erro');
      liberarBotao();
    });
}

/* ------------------------------------------------------------------ */
/* Inicialização                                                       */
/* ------------------------------------------------------------------ */

document.addEventListener('DOMContentLoaded', function () {
  desenharIcones();

  // O dashboard reaproveita este arquivo (PERGUNTAS e URL_APPS_SCRIPT) e faz
  // o próprio ping.
  if (!$('formulario')) return;

  renderizarPerguntas();
  $('campo-nome').maxLength = LIMITE_CURTO;
  $('campo-programa').maxLength = LIMITE_CURTO;

  estado.envioId = novoEnvioId();
  if (restaurarRascunho()) avisar('Recuperamos o que você já tinha escrito.', 'ok');

  // Acorda o Apps Script enquanto a pessoa lê e escreve. Sem isso, o envio
  // paga o cold start (~23s) e a pessoa acha que travou.
  enviarAoServidor({ action: 'ping' }).catch(function () {});
});
