/**
 * Inscrição nos Encontros de Cuidado - Grupo Paraná
 *
 * Mesmo Apps Script e mesma planilha da pesquisa de bem-estar, mas em aba
 * separada: a inscrição é identificada (tem nome), a pesquisa é anônima.
 */

var URL_APPS_SCRIPT = 'https://script.google.com/macros/s/AKfycbxln8t_xG2jpkKyS5TGKiGJAUvFyRO7ApKwVEF2yWTyJhkKbH1gJ6V7m3_AzFMxtkfCPw/exec';

var enviando = false;
var timerDemora = null;

function $(id) { return document.getElementById(id); }

function desenharIcones() {
  if (window.lucide && typeof lucide.createIcons === 'function') lucide.createIcons();
}

function mostrarErro(mensagem) {
  var erro = $('ficha-erro');
  erro.textContent = mensagem;
  erro.hidden = false;
}

/**
 * Sem header Content-Type de propósito: o navegador aplica text/plain e evita
 * o preflight OPTIONS, que o Apps Script não responde.
 */
function enviarAoServidor(dados, tempoLimite) {
  var controle = new AbortController();
  var relogio = setTimeout(function () { controle.abort(); }, tempoLimite || 60000);

  return fetch(URL_APPS_SCRIPT, {
    method: 'POST',
    body: JSON.stringify(dados),
    signal: controle.signal
  }).then(function (resposta) {
    clearTimeout(relogio);
    if (!resposta.ok) throw new Error('HTTP ' + resposta.status);
    return resposta.json();
  }).catch(function (falha) {
    clearTimeout(relogio);
    throw falha;
  });
}

function inscrever() {
  if (enviando) return;

  var nome = $('nome').value.trim().replace(/\s+/g, ' ');
  var nascimento = $('nascimento').value;
  var departamento = $('departamento').value.trim();

  $('ficha-erro').hidden = true;

  if (nome.length < 3 || nome.indexOf(' ') === -1) {
    mostrarErro('Informe seu nome completo.');
    $('nome').focus();
    return;
  }

  if (!nascimento) {
    mostrarErro('Informe sua data de nascimento.');
    $('nascimento').focus();
    return;
  }

  var ano = parseInt(nascimento.slice(0, 4), 10);
  if (ano < 1920 || ano > new Date().getFullYear()) {
    mostrarErro('Verifique a data de nascimento.');
    $('nascimento').focus();
    return;
  }

  if (!departamento) {
    mostrarErro('Informe seu departamento.');
    $('departamento').focus();
    return;
  }

  enviando = true;
  var botao = $('btn-inscrever');
  botao.disabled = true;
  $('btn-inscrever-texto').textContent = 'Enviando...';

  // O Apps Script pode demorar quando está ocioso; avisa em vez de parecer travado.
  timerDemora = setTimeout(function () { $('demora').hidden = false; }, 6000);

  enviarAoServidor({
    action: 'inscricao',
    nome: nome,
    nascimento: nascimento,
    departamento: departamento
  })
    .then(function (resultado) {
      clearTimeout(timerDemora);
      $('demora').hidden = true;

      if (!resultado.success) {
        mostrarErro(resultado.message || 'Não foi possível registrar sua inscrição.');
        restaurarBotao();
        return;
      }

      $('etapa-ficha').hidden = true;
      $('etapa-fim').hidden = false;
      desenharIcones();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    })
    .catch(function () {
      clearTimeout(timerDemora);
      $('demora').hidden = true;
      mostrarErro('Falha de conexão. Verifique sua internet e tente novamente.');
      restaurarBotao();
    });
}

function restaurarBotao() {
  enviando = false;
  $('btn-inscrever').disabled = false;
  $('btn-inscrever-texto').textContent = 'Confirmar inscrição';
}

document.addEventListener('DOMContentLoaded', function () {
  desenharIcones();

  // Não faz sentido nascer no futuro.
  $('nascimento').max = new Date().toISOString().slice(0, 10);

  // Acorda o Apps Script enquanto a pessoa lê o convite, para o envio não
  // pegar o script "frio".
  enviarAoServidor({ action: 'ping' }, 15000).catch(function () {});

  ['nome', 'nascimento', 'departamento'].forEach(function (id) {
    $(id).addEventListener('input', function () { $('ficha-erro').hidden = true; });
  });

  $('departamento').addEventListener('keydown', function (evento) {
    if (evento.key === 'Enter') inscrever();
  });
});
