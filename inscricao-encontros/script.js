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
function enviarAoServidor(dados, tempoLimite, tentativa) {
  var controle = new AbortController();
  // 90s: o cold start do Apps Script chegou a 43s nas medições. Desistir antes
  // faz a pessoa reenviar uma inscrição que já foi gravada.
  // 40s: acima disso a resposta praticamente sempre vem como página de erro.
  // Desistir cedo e repetir é melhor -- e seguro, porque o servidor reconhece
  // a mesma pessoa e confirma em vez de gravar de novo.
  var relogio = setTimeout(function () { controle.abort(); }, tempoLimite || 40000);
  var numero = tentativa || 1;

  return fetch(URL_APPS_SCRIPT, {
    method: 'POST',
    body: JSON.stringify(dados),
    signal: controle.signal
  }).then(function (resposta) {
    clearTimeout(relogio);
    return resposta.text();
  }).then(function (texto) {
    // O Apps Script às vezes devolve uma página de erro do Google em vez de
    // JSON ("Erro", "Página não encontrada"), sempre depois de ~33s.
    try {
      return JSON.parse(texto);
    } catch (erro) {
      throw new Error('resposta-invalida');
    }
  }).catch(function (falha) {
    clearTimeout(relogio);

    // Repetir é seguro: o servidor reconhece a mesma pessoa e confirma em vez
    // de gravar de novo. Foi a falta disso que gerou inscrições repetidas.
    if (numero < 3) {
      return new Promise(function (resolve) {
        setTimeout(resolve, 1500 * numero);
      }).then(function () {
        return enviarAoServidor(dados, tempoLimite, numero + 1);
      });
    }

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

  var nascimentoISO = converterNascimento(nascimento);
  if (!nascimentoISO) {
    mostrarErro('Informe a data no formato dia/mês/ano. Exemplo: 25/08/1990.');
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
  timerDemora = setTimeout(function () { $('demora').hidden = false; }, 5000);

  enviarAoServidor({
    action: 'inscricao',
    nome: nome,
    nascimento: nascimentoISO,
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

      if (resultado.jaInscrito) {
        $('titulo-fim').textContent = 'Você já estava inscrito!';
        $('texto-fim').textContent =
          'Encontramos sua inscrição registrada anteriormente. Não é preciso enviar de novo.';
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

/** Vai escrevendo dd/mm/aaaa conforme a pessoa digita os números. */
function formatarData(valor) {
  var d = valor.replace(/\D/g, '').slice(0, 8);
  if (d.length > 4) return d.slice(0, 2) + '/' + d.slice(2, 4) + '/' + d.slice(4);
  if (d.length > 2) return d.slice(0, 2) + '/' + d.slice(2);
  return d;
}

/**
 * Converte dd/mm/aaaa para aaaa-mm-dd, que é o formato esperado pelo servidor.
 * Devolve null se a data não existir de fato (31/02, por exemplo) ou se a
 * idade for implausível para um colaborador.
 */
function converterNascimento(texto) {
  var partes = String(texto).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!partes) return null;

  var dia = parseInt(partes[1], 10);
  var mes = parseInt(partes[2], 10);
  var ano = parseInt(partes[3], 10);

  var data = new Date(ano, mes - 1, dia);
  var existe = data.getFullYear() === ano && data.getMonth() === mes - 1 && data.getDate() === dia;
  if (!existe) return null;

  var idade = (new Date() - data) / (365.25 * 24 * 60 * 60 * 1000);
  if (idade < 14 || idade > 100) return null;

  return partes[3] + '-' + partes[2] + '-' + partes[1];
}

function restaurarBotao() {
  enviando = false;
  $('btn-inscrever').disabled = false;
  $('btn-inscrever-texto').textContent = 'Confirmar inscrição';
}

document.addEventListener('DOMContentLoaded', function () {
  desenharIcones();

  $('nascimento').addEventListener('input', function () {
    this.value = formatarData(this.value);
  });

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
