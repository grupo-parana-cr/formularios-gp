/**
 * AVALIAÇÃO INTERNA | RÁDIO SUPER FM - Grupo Paraná
 *
 * As perguntas ficam em uma única constante (SECOES), reaproveitada pelo
 * dashboard. Cada seção do questionário é uma etapa do formulário.
 *
 * Tipos de pergunta:
 *   escala     -> nota de 1 a 5, obrigatória
 *   aberta     -> texto livre, opcional
 *   comentario -> nota de 1 a 5 obrigatória + comentário opcional
 */

var URL_APPS_SCRIPT = 'https://script.google.com/macros/s/AKfycbywlJQii8zIU-E0N4xyjMD5cmSVG_d2WAEd_xDkHGc8BrfTs9wTkA27YhqU7F6siXY3/exec';

var SECOES = [
  {
    titulo: 'Visão geral da rádio',
    perguntas: [
      { n: 1, tipo: 'escala', texto: 'Como você avalia atualmente a Rádio Super FM de maneira geral?' },
      { n: 2, tipo: 'escala', texto: 'Como você avalia a qualidade geral da programação da rádio?' },
      { n: 3, tipo: 'escala', texto: 'Como você avalia a grade atual de programas e horários considerando o perfil dos nossos ouvintes?' },
      { n: 4, tipo: 'escala', texto: 'Existe equilíbrio adequado entre música, informação, entretenimento, participação dos ouvintes e publicidade?' },
      { n: 5, tipo: 'aberta', texto: 'Existem programas ou horários que deveriam ser revistos? Que tipo de programa, quadro ou conteúdo está faltando?' }
    ]
  },
  {
    titulo: 'Ouvintes e posicionamento',
    perguntas: [
      { n: 6, tipo: 'escala', texto: 'Como você avalia a conexão e a participação dos ouvintes durante a programação?' },
      { n: 7, tipo: 'escala', texto: 'A rádio conhece suficientemente o perfil e os interesses do seu público?' },
      { n: 8, tipo: 'aberta', texto: 'Na sua percepção, o que faz uma pessoa escolher ouvir a Super FM?' },
      { n: 9, tipo: 'aberta', texto: 'O que pode estar fazendo um ouvinte deixar de ouvir a Super FM ou procurar outra rádio/plataforma?' },
      { n: 10, tipo: 'aberta', texto: 'O que poderíamos fazer para aumentar nossa audiência e aproximar ainda mais os ouvintes da rádio?' }
    ]
  },
  {
    titulo: 'Qualidade técnica e produção',
    perguntas: [
      { n: 11, tipo: 'escala', texto: 'Como você avalia a qualidade técnica do áudio transmitido pela rádio?' },
      { n: 12, tipo: 'escala', texto: 'Como você avalia os equipamentos e recursos disponíveis para o trabalho dos locutores?' },
      { n: 13, tipo: 'escala', texto: 'Como você avalia a organização da produção da programação?' },
      { n: 14, tipo: 'escala', texto: 'Como você avalia a antecedência com que os conteúdos e informações necessários para entrar no ar são recebidos?' },
      { n: 15, tipo: 'escala', texto: 'Como você avalia a qualidade das vinhetas, chamadas, aberturas, passagens, trilhas e demais elementos sonoros?' },
      { n: 16, tipo: 'comentario', texto: 'A identidade sonora atual transmite uma imagem profissional e atual da Super FM? O que deveria ser melhorado?' }
    ]
  },
  {
    titulo: 'Publicidade e anunciantes',
    perguntas: [
      { n: 17, tipo: 'escala', texto: 'Como você avalia a quantidade de anunciantes atualmente presentes na programação?' },
      { n: 18, tipo: 'escala', texto: 'Como você avalia a organização da veiculação dos anúncios?' },
      { n: 19, tipo: 'escala', texto: 'Os materiais comerciais chegam aos locutores de maneira clara, organizada e com antecedência adequada?' },
      { n: 20, tipo: 'escala', texto: 'Na sua percepção, os anúncios e ações contratados são entregues corretamente, conforme horários e condições comercializados?' },
      { n: 21, tipo: 'aberta', texto: 'O que poderia ser feito para melhorar a entrega e gerar mais valor para os anunciantes?' }
    ]
  },
  {
    titulo: 'Comercial e vendas',
    perguntas: [
      { n: 22, tipo: 'escala', texto: 'Como você avalia atualmente o desempenho comercial da rádio?' },
      { n: 23, tipo: 'escala', texto: 'Você percebe integração adequada entre Comercial, Produção e Locução?' },
      { n: 24, tipo: 'escala', texto: 'A equipe de vendas conhece suficientemente a programação e os produtos que comercializa?' },
      { n: 25, tipo: 'aberta', texto: 'Na sua percepção, quais são hoje os principais obstáculos para a rádio vender mais?' },
      { n: 26, tipo: 'aberta', texto: 'Que produtos, formatos comerciais, ações ou oportunidades a Super FM poderia oferecer aos anunciantes e ainda não oferece ou explora pouco?' }
    ]
  },
  {
    titulo: 'Credibilidade e imagem da Super FM',
    perguntas: [
      { n: 27, tipo: 'escala', texto: 'Como você avalia a credibilidade da Super FM perante os ouvintes?' },
      { n: 28, tipo: 'escala', texto: 'Como você avalia a credibilidade da Super FM perante os anunciantes?' },
      { n: 29, tipo: 'escala', texto: 'A rádio transmite profissionalismo e cumpre aquilo que anuncia e promete ao público e aos anunciantes?' },
      { n: 30, tipo: 'aberta', texto: 'Na sua opinião, qual é hoje a imagem da Super FM na cidade e região?' }
    ]
  },
  {
    titulo: 'Equipe, organização e gestão',
    perguntas: [
      { n: 31, tipo: 'escala', texto: 'Como você avalia a comunicação interna da rádio?' },
      { n: 32, tipo: 'escala', texto: 'Como você avalia a organização dos processos internos (ex.: regras e procedimentos, comunicados internos, contratos, fluxo de informações e definição de responsabilidades)?' },
      { n: 33, tipo: 'escala', texto: 'Como você avalia a integração entre locutores, produção, comercial e gestão?' },
      { n: 34, tipo: 'escala', texto: 'As responsabilidades de cada pessoa estão suficientemente claras?' },
      { n: 35, tipo: 'escala', texto: 'Os problemas identificados no dia a dia são tratados e solucionados adequadamente?' },
      { n: 36, tipo: 'aberta', texto: 'Existe algum problema recorrente ou algo que a Diretoria/gestão deveria fazer diferente e talvez ainda não esteja percebendo?' }
    ]
  },
  {
    titulo: 'Avaliação da equipe de locução',
    intro: 'Nesta parte, considere a equipe de locução como um todo, e não uma pessoa específica.',
    perguntas: [
      { n: 37, tipo: 'escala', texto: 'Como você avalia o nível profissional da equipe de locutores?' },
      { n: 38, tipo: 'escala', texto: 'Como você avalia preparação, pontualidade e comprometimento da equipe com a programação?' },
      { n: 39, tipo: 'escala', texto: 'Como você avalia a capacidade da equipe de criar conexão com os ouvintes?' },
      { n: 40, tipo: 'escala', texto: 'Como você avalia o comprometimento dos locutores com os anunciantes, ações comerciais e imagem institucional da rádio?' },
      { n: 41, tipo: 'aberta', texto: 'Em quais aspectos a equipe de locução precisa evoluir?' }
    ]
  },
  {
    titulo: 'Autoavaliação',
    intro: 'Agora, avalie sua própria atuação com a mesma sinceridade.',
    perguntas: [
      { n: 42, tipo: 'escala', texto: 'Como você avalia sua preparação, pontualidade e cumprimento dos horários?' },
      { n: 43, tipo: 'escala', texto: 'Como você avalia seu conhecimento sobre a programação e sobre aquilo que anuncia ou divulga?' },
      { n: 44, tipo: 'escala', texto: 'Como você avalia sua comunicação, desenvoltura e capacidade de gerar proximidade e interação com os ouvintes?' },
      { n: 45, tipo: 'escala', texto: 'Como você avalia seu comprometimento com os anunciantes e o cuidado em cumprir textos, horários, ações e entregas comerciais?' },
      { n: 46, tipo: 'escala', texto: 'Como você avalia sua contribuição para o crescimento da Super FM além das atividades básicas da sua função?' },
      { n: 47, tipo: 'aberta', texto: 'Em quais aspectos você reconhece que precisa melhorar e que treinamento, recurso ou suporte ajudaria você a melhorar seu desempenho?' }
    ]
  },
  {
    titulo: 'Diagnóstico final',
    perguntas: [
      { n: 48, tipo: 'aberta', texto: 'Qual é hoje o maior ponto forte da Super FM?' },
      { n: 49, tipo: 'aberta', texto: 'Qual é hoje a maior fragilidade da Super FM?' },
      { n: 50, tipo: 'aberta', texto: 'Qual é a principal oportunidade de crescimento que a rádio ainda não está aproveitando?' },
      { n: 51, tipo: 'aberta', texto: 'Se você pudesse definir uma mudança prioritária para a Super FM neste momento, qual seria?' }
    ]
  }
];

/** Escala 1-5: vermelho (muito ruim) ao verde (excelente). */
var ESCALA = [
  { valor: 1, rotulo: 'Muito ruim', cor: '#d63d3d' },
  { valor: 2, rotulo: 'Ruim',       cor: '#ef8a1f' },
  { valor: 3, rotulo: 'Regular',    cor: '#d4a017' },
  { valor: 4, rotulo: 'Bom',        cor: '#5aa83c' },
  { valor: 5, rotulo: 'Excelente',  cor: '#1e9e57' }
];

var LIMITE_TEXTO = 2000;
var CHAVE_RASCUNHO = 'rascunho-avaliacao-super-fm';

var estado = {
  envioId: '',
  indice: 0,
  respostas: {},   // p1: 4, p5: 'texto', p16: 3, p16c: 'comentário'
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

/** Todas as perguntas, na ordem, sem a divisão por seção. */
function todasPerguntas() {
  var lista = [];
  SECOES.forEach(function (secao) {
    secao.perguntas.forEach(function (p) { lista.push(p); });
  });
  return lista;
}

function temNota(pergunta) {
  return pergunta.tipo === 'escala' || pergunta.tipo === 'comentario';
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
 * São 51 perguntas e uns 15 minutos de preenchimento: se a página recarregar,
 * perder tudo faz a pessoa desistir. O rascunho fica em sessionStorage, e não
 * em localStorage, de propósito: some quando a aba fecha. No computador
 * compartilhado do estúdio, o próximo colega não vê o que o anterior deixou
 * pela metade.
 */
function salvarRascunho() {
  try {
    sessionStorage.setItem(CHAVE_RASCUNHO, JSON.stringify({
      envioId: estado.envioId, indice: estado.indice, respostas: estado.respostas
    }));
  } catch (erro) { /* armazenamento bloqueado: segue sem rascunho */ }
}

function lerRascunho() {
  try {
    return JSON.parse(sessionStorage.getItem(CHAVE_RASCUNHO) || 'null');
  } catch (erro) {
    return null;
  }
}

function apagarRascunho() {
  try { sessionStorage.removeItem(CHAVE_RASCUNHO); } catch (erro) {}
}

/**
 * Código aleatório do envio. Não identifica ninguém: serve só para o servidor
 * reconhecer uma repetição automática (quando a conexão falha depois de já ter
 * gravado) e não registrar a mesma avaliação duas vezes.
 */
function novoEnvioId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/* ------------------------------------------------------------------ */
/* Início                                                              */
/* ------------------------------------------------------------------ */

/** A partir da segunda tela o hero encolhe, para o conteúdo caber sem rolagem. */
function compactarHero() {
  var hero = $('hero');
  if (hero) hero.classList.add('hero-compacto');
}

function iniciarAvaliacao() {
  compactarHero();
  $('cartao').hidden = false;
  renderizarSecoes();

  var rascunho = lerRascunho();
  if (rascunho && rascunho.respostas && Object.keys(rascunho.respostas).length) {
    estado.envioId = rascunho.envioId || novoEnvioId();
    estado.respostas = rascunho.respostas;
    restaurarRespostasNaTela();
    irParaSecao(Math.min(rascunho.indice || 0, SECOES.length - 1));
    avisar('Recuperamos as respostas que você já tinha preenchido.', 'ok');
    return;
  }

  estado.envioId = novoEnvioId();
  irParaSecao(0);
}

/* ------------------------------------------------------------------ */
/* Renderização                                                        */
/* ------------------------------------------------------------------ */

function renderizarSecoes() {
  $('etapa-perguntas').innerHTML = SECOES.map(function (secao, indice) {
    return '<div class="secao" data-indice="' + indice + '" hidden>' +
        '<p class="text-xs font-semibold tracking-wide uppercase text-gp-blue mb-2">Seção ' + (indice + 1) + ' de ' + SECOES.length + '</p>' +
        '<h2 class="text-2xl md:text-3xl font-semibold tracking-tight leading-snug mb-2">' + escapar(secao.titulo) + '</h2>' +
        (secao.intro
          ? '<p class="text-[15px] text-neutral-600 bg-gp-light/60 rounded-xl px-4 py-3 mt-4 flex gap-2.5">' +
              '<i class="w-4 h-4 text-gp-blue shrink-0 mt-0.5" data-lucide="info"></i>' + escapar(secao.intro) + '</p>'
          : '') +
        '<div class="mt-6">' + secao.perguntas.map(montarPergunta).join('') + '</div>' +
      '</div>';
  }).join('');

  desenharIcones();
}

function montarPergunta(pergunta) {
  var corpo = '';

  if (temNota(pergunta)) corpo += montarEscala(pergunta.n);

  if (pergunta.tipo === 'aberta') {
    corpo += montarTexto('p' + pergunta.n, 'Escreva sua resposta (opcional)', 4);
  }

  if (pergunta.tipo === 'comentario') {
    corpo += '<div class="mt-4">' + montarTexto('p' + pergunta.n + 'c', 'O que deveria ser melhorado? (opcional)', 3) + '</div>';
  }

  return '<div class="bloco-pergunta py-7 border-t border-neutral-100 first:border-t-0 first:pt-2" id="bloco-p' + pergunta.n + '">' +
      '<p class="text-[17px] font-medium leading-snug text-neutral-800 mb-4">' +
        '<span class="text-gp-blue font-semibold">' + pergunta.n + '.</span> ' + escapar(pergunta.texto) +
      '</p>' +
      corpo +
      '<p class="erro-pergunta text-sm text-red-600 mt-2.5" hidden>Escolha uma nota de 1 a 5.</p>' +
    '</div>';
}

function montarEscala(n) {
  var botoes = ESCALA.map(function (item) {
    return '<button type="button" class="nota rounded-xl sm:rounded-2xl border-2 font-semibold transition-all hover:scale-[1.03]" ' +
        'data-pergunta="' + n + '" data-nota="' + item.valor + '" onclick="selecionarNota(' + n + ',' + item.valor + ')" ' +
        'aria-label="' + item.valor + ' - ' + item.rotulo + '" ' +
        'style="border-color:' + item.cor + ';color:' + item.cor + ';background-color:' + item.cor + '14;">' +
        '<span class="block text-xl leading-none">' + item.valor + '</span>' +
        '<span class="nota-rotulo block mt-1.5 font-medium">' + item.rotulo + '</span>' +
      '</button>';
  }).join('');

  return '<div class="grid grid-cols-5 gap-1.5 sm:gap-2.5">' + botoes + '</div>';
}

function montarTexto(chave, placeholder, linhas) {
  return '<textarea id="campo-' + chave + '" rows="' + linhas + '" maxlength="' + LIMITE_TEXTO + '" ' +
      'placeholder="' + placeholder + '" oninput="registrarTexto(\'' + chave + '\', this.value)" ' +
      'class="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-gp-blue focus:ring-0 outline-none transition-colors resize-y text-[15px] leading-relaxed"></textarea>';
}

/** Repõe na tela as respostas vindas do rascunho. */
function restaurarRespostasNaTela() {
  Object.keys(estado.respostas).forEach(function (chave) {
    var valor = estado.respostas[chave];
    if (typeof valor === 'number') {
      pintarNotas(parseInt(chave.slice(1), 10), valor);
    } else {
      var campo = $('campo-' + chave);
      if (campo) campo.value = valor;
    }
  });
}

/* ------------------------------------------------------------------ */
/* Interação                                                           */
/* ------------------------------------------------------------------ */

function pintarNotas(n, nota) {
  var botoes = document.querySelectorAll('.nota[data-pergunta="' + n + '"]');

  for (var i = 0; i < botoes.length; i++) {
    var valor = parseInt(botoes[i].dataset.nota, 10);
    var cor = ESCALA[valor - 1].cor;

    if (valor === nota) {
      botoes[i].style.backgroundColor = cor;
      botoes[i].style.color = '#ffffff';
      botoes[i].classList.add('shadow-md', 'selecionada');
    } else {
      botoes[i].style.backgroundColor = cor + '14';
      botoes[i].style.color = cor;
      botoes[i].classList.remove('shadow-md', 'selecionada');
    }
  }
}

function selecionarNota(n, nota) {
  estado.respostas['p' + n] = nota;
  pintarNotas(n, nota);

  var bloco = $('bloco-p' + n);
  bloco.classList.remove('pendente');
  bloco.querySelector('.erro-pergunta').hidden = true;

  salvarRascunho();
}

var timerRascunho = null;

function registrarTexto(chave, valor) {
  var limpo = valor.trim();
  if (limpo) {
    estado.respostas[chave] = limpo;
  } else {
    delete estado.respostas[chave];
  }

  // Digitação gera muitos eventos; grava o rascunho só quando a pessoa pausa.
  clearTimeout(timerRascunho);
  timerRascunho = setTimeout(salvarRascunho, 600);
}

/* ------------------------------------------------------------------ */
/* Navegação                                                           */
/* ------------------------------------------------------------------ */

function irParaSecao(indice) {
  estado.indice = indice;
  mostrarEtapa('etapa-perguntas');

  var blocos = $('etapa-perguntas').querySelectorAll('.secao');
  for (var i = 0; i < blocos.length; i++) {
    blocos[i].hidden = (i !== indice);
  }

  $('progresso').hidden = false;
  $('navegacao').hidden = false;
  $('progresso-rotulo').textContent = SECOES[indice].titulo;
  $('progresso-contagem').textContent = (indice + 1) + ' de ' + SECOES.length;
  $('progresso-barra').style.width = ((indice + 1) / SECOES.length * 100) + '%';

  $('btn-voltar').style.visibility = indice === 0 ? 'hidden' : 'visible';
  $('btn-avancar-texto').textContent = (indice === SECOES.length - 1) ? 'Enviar avaliação' : 'Próxima seção';

  salvarRascunho();
  desenharIcones();
}

/** Notas que ainda faltam na seção. Respostas abertas são opcionais. */
function notasFaltando(indice) {
  return SECOES[indice].perguntas.filter(function (p) {
    return temNota(p) && !estado.respostas['p' + p.n];
  });
}

/**
 * O botão fica sempre ativo: com várias perguntas por tela, um botão
 * desabilitado não diz o que falta. Ao clicar, marca as pendentes e leva
 * até a primeira.
 */
function avancarEtapa() {
  var faltando = notasFaltando(estado.indice);

  if (faltando.length) {
    faltando.forEach(function (p) {
      var bloco = $('bloco-p' + p.n);
      bloco.classList.add('pendente');
      bloco.querySelector('.erro-pergunta').hidden = false;
    });

    $('bloco-p' + faltando[0].n).scrollIntoView({ behavior: 'smooth', block: 'center' });
    avisar(faltando.length === 1
      ? 'Falta dar nota para a pergunta ' + faltando[0].n + '.'
      : 'Faltam notas em ' + faltando.length + ' perguntas desta seção.', 'erro');
    return;
  }

  if (estado.indice < SECOES.length - 1) {
    irParaSecao(estado.indice + 1);
    return;
  }

  enviarAvaliacao();
}

function voltarEtapa() {
  if (estado.indice > 0) irParaSecao(estado.indice - 1);
}

/* ------------------------------------------------------------------ */
/* Envio                                                               */
/* ------------------------------------------------------------------ */

function enviarAvaliacao() {
  if (estado.enviando) return;
  estado.enviando = true;

  var botao = $('btn-avancar');
  botao.disabled = true;
  $('btn-avancar-texto').textContent = 'Enviando...';

  // Se o servidor estiver frio a resposta pode demorar. Sem este aviso a
  // pessoa acha que travou, fecha a página e perde o que preencheu.
  var avisoDemora = setTimeout(function () {
    avisar('Ainda enviando... não feche esta página.', 'info');
  }, 6000);

  function liberarBotao() {
    estado.enviando = false;
    botao.disabled = false;
    $('btn-avancar-texto').textContent = 'Enviar avaliação';
  }

  enviarAoServidor({ action: 'submit', envioId: estado.envioId, respostas: estado.respostas })
    .then(function (resultado) {
      clearTimeout(avisoDemora);

      if (!resultado.success) {
        avisar(resultado.message || 'Não foi possível enviar.', 'erro');
        liberarBotao();
        return;
      }

      apagarRascunho();
      $('aviso').hidden = true;
      $('progresso').hidden = true;
      $('navegacao').hidden = true;
      mostrarEtapa('etapa-fim');
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

  // O dashboard reaproveita este arquivo (SECOES e URL_APPS_SCRIPT) e faz
  // o próprio ping.
  if (!$('etapa-perguntas')) return;

  // Acorda o Apps Script enquanto a pessoa lê a capa. Sem isso, a primeira
  // chamada real paga o cold start (~23s) e a pessoa acha que travou.
  enviarAoServidor({ action: 'ping' }).catch(function () {});
});
