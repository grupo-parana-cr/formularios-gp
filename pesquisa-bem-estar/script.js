/**
 * PESQUISA | BEM-ESTAR E FATORES DE PREOCUPAÇÃO - Grupo Paraná
 *
 * As perguntas ficam em uma única constante (PERGUNTAS), reaproveitada pelo
 * dashboard. As telas são renderizadas a partir dela.
 */

var URL_APPS_SCRIPT = 'https://script.google.com/macros/s/AKfycbxln8t_xG2jpkKyS5TGKiGJAUvFyRO7ApKwVEF2yWTyJhkKbH1gJ6V7m3_AzFMxtkfCPw/exec';

var PERGUNTAS = [
  {
    id: 'q1',
    tipo: 'multipla',
    titulo: 'Pensando na sua rotina de <strong>TRABALHO</strong>, quais situações mais têm gerado preocupação, pressão ou desgaste?',
    ajuda: 'Você pode marcar mais de uma opção.',
    opcoes: [
      'Volume elevado de atividades',
      'Muitas demandas ou prazos ao mesmo tempo',
      'Falta de clareza sobre prioridades ou responsabilidades',
      'Mudanças e imprevistos frequentes',
      'Dificuldades de comunicação',
      'Conflitos ou dificuldades de relacionamento',
      'Receio de cometer erros',
      'Dificuldade para organizar ou priorizar minhas atividades',
      'Dificuldade para me desligar do trabalho após o expediente'
    ],
    nenhuma: 'Não tenho sentido preocupação ou desgaste significativo relacionado ao trabalho'
  },
  {
    id: 'q2',
    tipo: 'multipla',
    titulo: 'Pensando na sua vida <strong>FORA DO TRABALHO</strong>, quais situações mais têm gerado preocupação ou desgaste?',
    ajuda: 'Você pode marcar mais de uma opção.',
    opcoes: [
      'Questões financeiras',
      'Responsabilidades familiares',
      'Relacionamentos',
      'Questões relacionadas à saúde ou bem-estar',
      'Falta de descanso ou sono adequado',
      'Incertezas ou preocupações com o futuro',
      'Excesso de compromissos e responsabilidades',
      'Dificuldade em conciliar as diferentes áreas da vida',
      'Excesso de celular, redes sociais ou informações'
    ],
    nenhuma: 'Não tenho sentido preocupação ou desgaste significativo'
  },
  {
    id: 'q3',
    tipo: 'escala',
    titulo: 'De modo geral, quanto essas preocupações têm interferido na sua rotina, concentração, bem-estar ou desempenho?',
    ajuda: '0 = não interferem &nbsp;|&nbsp; 10 = interferem muito'
  },
  {
    id: 'q4',
    tipo: 'multipla',
    titulo: 'Quando você passa por períodos de maior preocupação, pressão ou desgaste, como isso costuma se manifestar em você?',
    ajuda: 'Você pode marcar mais de uma opção.',
    opcoes: [
      'Medo ou sensação de que algo ruim pode acontecer',
      'Sintomas físicos, como tensão muscular, dor de cabeça, palpitação, falta de ar ou desconforto no estômago',
      'Pensamentos repetitivos ou dificuldade de parar de pensar em determinadas situações',
      'Necessidade de conferir, organizar ou repetir determinadas ações para se sentir mais tranquilo',
      'Tristeza, desânimo ou perda de interesse nas atividades',
      'Agitação ou dificuldade para relaxar',
      'Irritação ou impaciência',
      'Dificuldade para dormir ou sono prejudicado',
      'Dificuldade de concentração',
      'Sensação de cansaço ou esgotamento'
    ],
    nenhuma: 'Não percebo nenhuma dessas manifestações'
  }
];

/** Cores da escala 0-10: verde (não interfere) ao vermelho (interfere muito). */
var CORES_ESCALA = [
  '#27ae60', '#2ecc71', '#7cc46a', '#a8ca4f', '#d4c73f',
  '#f1c40f', '#f3a712', '#ef8a1f', '#e8692c', '#e04f38', '#d63d3d'
];

var estado = {
  cpf: '',
  indice: 0,
  respostas: { q1: [], q2: [], q3: null, q4: [] },
  outros: { q1: '', q2: '', q4: '' },
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
  div.textContent = texto;
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
  timerAviso = setTimeout(function () { $('aviso').hidden = true; }, 4000);
}

/**
 * Volta ao topo a cada troca de tela. O segundo scrollTo é necessário porque
 * o hero encolhe com transição de 500ms: a altura da página muda depois da
 * primeira rolagem e, no celular, a tela acabava parando no meio.
 */
function rolarAoTopo() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  setTimeout(function () { window.scrollTo({ top: 0, behavior: 'auto' }); }, 550);
}

function mostrarEtapa(id) {
  var etapas = document.querySelectorAll('.etapa');
  for (var i = 0; i < etapas.length; i++) etapas[i].hidden = true;
  $(id).hidden = false;
  rolarAoTopo();
}

/**
 * Envia ao Apps Script sem header Content-Type: o navegador aplica
 * text/plain, o que evita o preflight OPTIONS que o Apps Script não responde.
 */
function enviarAoServidor(dados) {
  return fetch(URL_APPS_SCRIPT, {
    method: 'POST',
    body: JSON.stringify(dados)
  }).then(function (resposta) {
    if (!resposta.ok) throw new Error('HTTP ' + resposta.status);
    return resposta.json();
  });
}

/* ------------------------------------------------------------------ */
/* CPF                                                                 */
/* ------------------------------------------------------------------ */

function formatarCpf(valor) {
  var d = valor.replace(/\D/g, '').slice(0, 11);
  if (d.length > 9) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
  if (d.length > 6) return d.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
  if (d.length > 3) return d.replace(/(\d{3})(\d{1,3})/, '$1.$2');
  return d;
}

/** Valida os dígitos verificadores do CPF. */
function cpfValido(cpf) {
  var d = String(cpf).replace(/\D/g, '');
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;

  var soma = 0;
  var i;

  for (i = 0; i < 9; i++) soma += parseInt(d.charAt(i), 10) * (10 - i);
  var dv1 = (soma * 10) % 11;
  if (dv1 === 10) dv1 = 0;
  if (dv1 !== parseInt(d.charAt(9), 10)) return false;

  soma = 0;
  for (i = 0; i < 10; i++) soma += parseInt(d.charAt(i), 10) * (11 - i);
  var dv2 = (soma * 10) % 11;
  if (dv2 === 10) dv2 = 0;

  return dv2 === parseInt(d.charAt(10), 10);
}

/** A partir da segunda tela o hero encolhe, para o conteúdo caber sem rolagem. */
function compactarHero() {
  var hero = $('hero');
  if (hero) hero.classList.add('hero-compacto');
}

function irParaCpf() {
  compactarHero();
  // Em versões anteriores o cartão já vinha visível; o if evita quebrar o
  // fluxo se um HTML em cache antigo carregar este script.
  var cartao = $('cartao');
  if (cartao) cartao.hidden = false;
  mostrarEtapa('etapa-cpf');
  setTimeout(function () { $('cpf').focus(); }, 300);
}

function validarCpf() {
  var campo = $('cpf');
  var erro = $('cpf-erro');
  var botao = $('btn-cpf');
  var valor = campo.value;

  if (!cpfValido(valor)) {
    erro.textContent = 'Informe um CPF válido.';
    erro.hidden = false;
    campo.classList.add('border-red-400');
    return;
  }

  erro.hidden = true;
  campo.classList.remove('border-red-400');
  botao.disabled = true;
  botao.innerHTML = 'Validando...';

  var cpfLimpo = valor.replace(/\D/g, '');

  enviarAoServidor({ action: 'checkCPF', cpf: cpfLimpo })
    .then(function (resultado) {
      if (resultado.exists) {
        erro.textContent = 'Esta pesquisa já foi respondida com este CPF. Obrigado por participar!';
        erro.hidden = false;
        botao.disabled = false;
        botao.innerHTML = 'Continuar';
        return;
      }

      estado.cpf = cpfLimpo;
      renderizarPerguntas();
      estado.indice = 0;
      irParaPergunta(0);
    })
    .catch(function () {
      erro.textContent = 'Não foi possível validar agora. Verifique sua conexão e tente novamente.';
      erro.hidden = false;
      botao.disabled = false;
      botao.innerHTML = 'Continuar';
    });
}

/* ------------------------------------------------------------------ */
/* Renderização das perguntas                                          */
/* ------------------------------------------------------------------ */

function renderizarPerguntas() {
  var container = $('etapa-perguntas');
  container.innerHTML = PERGUNTAS.map(function (pergunta, indice) {
    return '<div class="pergunta" data-indice="' + indice + '" hidden>' +
             '<h2 class="text-xl md:text-2xl font-semibold tracking-tight leading-snug mb-2">' + pergunta.titulo + '</h2>' +
             '<p class="text-sm text-neutral-400 mb-7">' + pergunta.ajuda + '</p>' +
             (pergunta.tipo === 'escala' ? montarEscala(pergunta) : montarMultipla(pergunta)) +
           '</div>';
  }).join('');

  desenharIcones();
}

function montarMultipla(pergunta) {
  var itens = pergunta.opcoes.map(function (opcao) {
    return montarChip(pergunta.id, opcao, false);
  }).join('');

  // A opção "nenhuma" é exclusiva: marcá-la desmarca as demais.
  itens += montarChip(pergunta.id, pergunta.nenhuma, true);

  return '<div class="space-y-2.5">' + itens +
    '<div class="pt-1">' +
      montarChip(pergunta.id, 'Outro', false, true) +
      '<input type="text" id="outro-' + pergunta.id + '" maxlength="500" hidden ' +
        'placeholder="Conte com suas palavras..." ' +
        'oninput="registrarOutro(\'' + pergunta.id + '\', this.value)" ' +
        'class="w-full mt-2.5 px-4 py-3 rounded-xl border border-neutral-200 focus:border-gp-blue focus:ring-0 outline-none transition-colors">' +
    '</div>' +
  '</div>';
}

function montarChip(idPergunta, texto, exclusiva, ehOutro) {
  var valor = escapar(texto);
  var atributos = 'data-pergunta="' + idPergunta + '" data-valor="' + valor + '"' +
    (exclusiva ? ' data-exclusiva="1"' : '') +
    (ehOutro ? ' data-outro="1"' : '');

  return '<label class="opcao block cursor-pointer">' +
      '<input type="checkbox" class="peer sr-only" ' + atributos + ' onchange="alternarOpcao(this)">' +
      '<div class="flex items-start gap-3 border-2 border-neutral-200 rounded-2xl px-4 py-3.5 transition-all ' +
           'hover:border-neutral-300 peer-checked:border-gp-blue peer-checked:bg-gp-light/50">' +
        '<div class="w-5 h-5 rounded-md border-2 border-neutral-300 shrink-0 mt-0.5 flex items-center justify-center transition-all marca">' +
          '<svg class="w-3 h-3 text-white opacity-0 transition-opacity" viewBox="0 0 12 12" fill="none">' +
            '<path d="M2 6.5L4.5 9L10 3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
          '</svg>' +
        '</div>' +
        '<span class="text-[15px] leading-snug text-neutral-700">' + valor + '</span>' +
      '</div>' +
    '</label>';
}

function montarEscala(pergunta) {
  var botoes = '';
  for (var i = 0; i <= 10; i++) {
    botoes += '<button type="button" data-nota="' + i + '" onclick="selecionarNota(' + i + ')" ' +
      'class="nota w-full rounded-lg sm:rounded-2xl border-2 font-semibold transition-all hover:scale-105" ' +
      'style="border-color:' + CORES_ESCALA[i] + ';color:' + CORES_ESCALA[i] + ';background-color:' + CORES_ESCALA[i] + '14;">' +
      i + '</button>';
  }

  // Sempre 11 colunas: a escala precisa ser lida como uma régua contínua,
  // e quebrada em fileiras ela perde esse sentido.
  return '<div class="grid grid-cols-11 gap-[3px] sm:gap-1.5">' + botoes + '</div>' +
    '<div class="flex justify-between mt-4 text-xs text-neutral-400 font-medium">' +
      '<span>Não interferem</span><span>Interferem muito</span>' +
    '</div>';
}

/* ------------------------------------------------------------------ */
/* Interação                                                           */
/* ------------------------------------------------------------------ */

function alternarOpcao(input) {
  var idPergunta = input.dataset.pergunta;
  var container = $('etapa-perguntas');
  var chips = container.querySelectorAll('input[data-pergunta="' + idPergunta + '"]');
  var i;

  if (input.checked && input.dataset.exclusiva) {
    // "Não tenho sentido..." limpa todo o resto.
    for (i = 0; i < chips.length; i++) {
      if (chips[i] !== input) chips[i].checked = false;
    }
    limparOutro(idPergunta);
  } else if (input.checked) {
    for (i = 0; i < chips.length; i++) {
      if (chips[i].dataset.exclusiva) chips[i].checked = false;
    }
  }

  if (input.dataset.outro) {
    var campo = $('outro-' + idPergunta);
    campo.hidden = !input.checked;
    if (input.checked) {
      campo.focus();
    } else {
      campo.value = '';
      estado.outros[idPergunta] = '';
    }
  }

  sincronizarRespostas(idPergunta);
  atualizarBotaoAvancar();
}

function limparOutro(idPergunta) {
  var campo = $('outro-' + idPergunta);
  if (campo) {
    campo.hidden = true;
    campo.value = '';
  }
  estado.outros[idPergunta] = '';
}

function registrarOutro(idPergunta, valor) {
  estado.outros[idPergunta] = valor.trim();
  atualizarBotaoAvancar();
}

function sincronizarRespostas(idPergunta) {
  var container = $('etapa-perguntas');
  var chips = container.querySelectorAll('input[data-pergunta="' + idPergunta + '"]');
  var marcadas = [];

  for (var i = 0; i < chips.length; i++) {
    if (chips[i].checked && !chips[i].dataset.outro) marcadas.push(chips[i].dataset.valor);
  }

  estado.respostas[idPergunta] = marcadas;
}

function selecionarNota(nota) {
  estado.respostas.q3 = nota;

  var botoes = $('etapa-perguntas').querySelectorAll('.nota');
  for (var i = 0; i < botoes.length; i++) {
    var valor = parseInt(botoes[i].dataset.nota, 10);
    var cor = CORES_ESCALA[valor];

    if (valor === nota) {
      botoes[i].style.backgroundColor = cor;
      botoes[i].style.color = '#ffffff';
      botoes[i].classList.add('scale-105', 'shadow-md');
    } else {
      botoes[i].style.backgroundColor = cor + '14';
      botoes[i].style.color = cor;
      botoes[i].classList.remove('scale-105', 'shadow-md');
    }
  }

  atualizarBotaoAvancar();
}

/* ------------------------------------------------------------------ */
/* Navegação                                                           */
/* ------------------------------------------------------------------ */

function irParaPergunta(indice) {
  estado.indice = indice;
  mostrarEtapa('etapa-perguntas');

  var blocos = $('etapa-perguntas').querySelectorAll('.pergunta');
  for (var i = 0; i < blocos.length; i++) {
    blocos[i].hidden = (i !== indice);
  }

  $('progresso').hidden = false;
  $('navegacao').hidden = false;
  $('progresso-rotulo').textContent = 'Pergunta ' + (indice + 1);
  $('progresso-contagem').textContent = (indice + 1) + ' de ' + PERGUNTAS.length;
  $('progresso-barra').style.width = ((indice + 1) / PERGUNTAS.length * 100) + '%';

  $('btn-voltar').style.visibility = indice === 0 ? 'hidden' : 'visible';
  $('btn-avancar-texto').textContent = (indice === PERGUNTAS.length - 1) ? 'Enviar resposta' : 'Próxima';

  atualizarBotaoAvancar();
  desenharIcones();
}

/** Uma pergunta está respondida se há marcação, nota, ou "Outro" preenchido. */
function perguntaRespondida(indice) {
  var pergunta = PERGUNTAS[indice];

  if (pergunta.tipo === 'escala') return estado.respostas.q3 !== null;

  var temOpcao = estado.respostas[pergunta.id].length > 0;
  var chipOutro = $('etapa-perguntas').querySelector('input[data-pergunta="' + pergunta.id + '"][data-outro]');
  var outroMarcado = chipOutro && chipOutro.checked;

  // Se marcou "Outro", o texto passa a ser obrigatório.
  if (outroMarcado) return estado.outros[pergunta.id].length > 0;

  return temOpcao;
}

function atualizarBotaoAvancar() {
  $('btn-avancar').disabled = !perguntaRespondida(estado.indice);
}

function voltarEtapa() {
  if (estado.indice > 0) irParaPergunta(estado.indice - 1);
}

function avancarEtapa() {
  if (!perguntaRespondida(estado.indice)) return;

  if (estado.indice < PERGUNTAS.length - 1) {
    irParaPergunta(estado.indice + 1);
    return;
  }

  enviarPesquisa();
}

/* ------------------------------------------------------------------ */
/* Envio                                                               */
/* ------------------------------------------------------------------ */

function enviarPesquisa() {
  if (estado.enviando) return;
  estado.enviando = true;

  var botao = $('btn-avancar');
  botao.disabled = true;
  $('btn-avancar-texto').textContent = 'Enviando...';

  enviarAoServidor({
    action: 'submit',
    cpf: estado.cpf,
    q1: estado.respostas.q1, q1Outro: estado.outros.q1,
    q2: estado.respostas.q2, q2Outro: estado.outros.q2,
    q3: estado.respostas.q3,
    q4: estado.respostas.q4, q4Outro: estado.outros.q4
  })
    .then(function (resultado) {
      if (!resultado.success) {
        avisar(resultado.message || 'Não foi possível enviar.', 'erro');
        estado.enviando = false;
        botao.disabled = false;
        $('btn-avancar-texto').textContent = 'Enviar resposta';
        return;
      }

      $('progresso').hidden = true;
      $('navegacao').hidden = true;
      mostrarEtapa('etapa-fim');
      desenharIcones();
    })
    .catch(function () {
      avisar('Falha de conexão. Verifique sua internet e tente novamente.', 'erro');
      estado.enviando = false;
      botao.disabled = false;
      $('btn-avancar-texto').textContent = 'Enviar resposta';
    });
}

/* ------------------------------------------------------------------ */
/* Inicialização                                                       */
/* ------------------------------------------------------------------ */

document.addEventListener('DOMContentLoaded', function () {
  desenharIcones();

  // O dashboard reaproveita este arquivo (PERGUNTAS e URL_APPS_SCRIPT),
  // mas não tem o campo de CPF.
  var campoCpf = $('cpf');
  if (!campoCpf) return;

  campoCpf.addEventListener('input', function () {
    this.value = formatarCpf(this.value);
    $('cpf-erro').hidden = true;
    this.classList.remove('border-red-400');
  });

  campoCpf.addEventListener('keydown', function (evento) {
    if (evento.key === 'Enter') validarCpf();
  });
});
