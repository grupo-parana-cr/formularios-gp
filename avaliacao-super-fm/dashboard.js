/**
 * Dashboard da Avaliação Interna Super FM - Grupo Paraná
 *
 * O Apps Script devolve as avaliações (anônimas) só com credenciais válidas;
 * todas as médias e contagens são calculadas aqui. Perguntas e seções vêm de
 * SECOES, em script.js, para não duplicar os textos.
 *
 * A autoavaliação (seção 9) fica FORA dos indicadores da rádio: é cada
 * pessoa dando nota a si mesma, e misturada às demais ela inflava a média e
 * tomava o ranking de pontos fortes.
 */

var dadosAtuais = null;
var abaAtual = 'geral';

var INDICE_AUTOAVALIACAO = 8;
var NUMEROS_AUTOAVALIACAO = [42, 43, 44, 45, 46];

/** Abaixo disso, médias mudam muito a cada nova resposta. */
var MINIMO_CONFIAVEL = 5;

/** Pares de temas equivalentes entre a seção 8 (equipe) e a 9 (autoavaliação). */
var COMPARATIVO = [
  { tema: 'Preparação e pontualidade', equipe: 38, auto: 42 },
  { tema: 'Conexão com os ouvintes', equipe: 39, auto: 44 },
  { tema: 'Compromisso com anunciantes', equipe: 40, auto: 45 }
];

/* ------------------------------------------------------------------ */
/* Acesso                                                              */
/* ------------------------------------------------------------------ */

/**
 * As credenciais ficam só na aba aberta (sessionStorage) e são conferidas no
 * servidor a cada chamada. Nada de senha no código: este repositório é
 * público, e qualquer pessoa leria o arquivo.
 */
var credenciaisEmMemoria = null;

function acessoAtual() {
  try {
    var guardado = sessionStorage.getItem('acesso-super-fm');
    if (guardado) return JSON.parse(guardado);
  } catch (erro) { /* armazenamento bloqueado */ }
  return credenciaisEmMemoria;
}

function guardarCredenciais(usuario, senha) {
  credenciaisEmMemoria = { usuario: usuario, senha: senha };
  try {
    sessionStorage.setItem('acesso-super-fm', JSON.stringify(credenciaisEmMemoria));
  } catch (erro) { /* segue só em memória */ }
}

function esquecerCredenciais() {
  credenciaisEmMemoria = null;
  try { sessionStorage.removeItem('acesso-super-fm'); } catch (erro) {}
}

function mostrarLogin(mensagem) {
  $('login').hidden = false;
  $('carregando').hidden = true;
  $('conteudo').hidden = true;
  $('erro').hidden = true;
  $('acoes').hidden = true;

  var erro = $('login-erro');
  erro.textContent = mensagem || '';
  erro.hidden = !mensagem;

  desenharIcones();
}

function entrar() {
  var usuario = $('usuario').value.trim();
  var senha = $('senha').value;

  if (!usuario || !senha) {
    mostrarLogin('Informe usuário e senha.');
    return;
  }

  var botao = $('btn-entrar');
  botao.disabled = true;
  botao.textContent = 'Entrando...';

  guardarCredenciais(usuario, senha);
  carregarDados(true);
}

function sair() {
  esquecerCredenciais();
  $('senha').value = '';
  dadosAtuais = null;
  mostrarLogin();
}

function restaurarBotaoEntrar() {
  var botao = $('btn-entrar');
  botao.disabled = false;
  botao.innerHTML = 'Entrar <i class="w-4 h-4" data-lucide="arrow-right"></i>';
  desenharIcones();
}

function mostrarAvisoCarregamento(texto) {
  var aviso = $('carregando-demora');
  aviso.textContent = texto;
  aviso.hidden = false;
}

function carregarDados(vindoDoLogin) {
  var acesso = acessoAtual();
  if (!acesso) { mostrarLogin(); return; }

  $('login').hidden = true;
  $('carregando').hidden = false;
  $('conteudo').hidden = true;
  $('erro').hidden = true;

  var textoDemora = 'Ainda carregando. O servidor do Google está lento agora — seguimos tentando.';
  var avisoDemora = setTimeout(function () { mostrarAvisoCarregamento(textoDemora); }, 6000);

  buscarComHedge(
    { action: 'getAllData', usuario: acesso.usuario, senha: acesso.senha },
    function () { mostrarAvisoCarregamento(textoDemora); }
  )
    .then(function (dados) {
      clearTimeout(avisoDemora);
      $('carregando-demora').hidden = true;
      restaurarBotaoEntrar();

      if (dados.error === 'nao-autorizado') {
        esquecerCredenciais();
        mostrarLogin('Usuário ou senha incorretos.');
        return;
      }

      if (dados.error) throw new Error(dados.error);

      $('acoes').hidden = false;
      dadosAtuais = dados;
      renderizar();
    })
    .catch(function (falha) {
      clearTimeout(avisoDemora);
      $('carregando-demora').hidden = true;
      restaurarBotaoEntrar();

      if (vindoDoLogin) {
        mostrarLogin('Não foi possível conectar. Tente novamente.');
        return;
      }

      $('carregando').hidden = true;
      $('erro').hidden = false;
      $('erro-detalhe').textContent = 'Verifique sua conexão e tente novamente. (' + falha.message + ')';
      desenharIcones();
    });
}

/* ------------------------------------------------------------------ */
/* Cálculos                                                            */
/* ------------------------------------------------------------------ */

function participantes() {
  return (dadosAtuais && dadosAtuais.participantes) || [];
}

function ehAutoavaliacao(n) {
  return NUMEROS_AUTOAVALIACAO.indexOf(n) !== -1;
}

/** Perguntas com nota que dizem respeito à rádio (tudo menos a autoavaliação). */
function perguntasDaRadio() {
  return todasPerguntas().filter(function (p) { return temNota(p) && !ehAutoavaliacao(p.n); });
}

function secoesDaRadio() {
  return SECOES
    .map(function (secao, indice) { return { secao: secao, indice: indice }; })
    .filter(function (s) { return s.indice !== INDICE_AUTOAVALIACAO && s.secao.perguntas.some(temNota); });
}

/** Notas dadas a uma pergunta, ignorando quem não respondeu. */
function notasDa(n) {
  return participantes()
    .map(function (p) { return p.respostas['p' + n]; })
    .filter(function (v) { return typeof v === 'number'; });
}

function notasDe(perguntas) {
  var todas = [];
  perguntas.forEach(function (p) { todas = todas.concat(notasDa(p.n)); });
  return todas;
}

/**
 * Resumo de um conjunto de notas. "Positivo" = 4 ou 5; "negativo" = 1 ou 2.
 * O percentual favorável costuma dizer mais que a média: 3,0 pode ser todo
 * mundo no "Regular" ou metade no 1 e metade no 5.
 */
function resumo(notas) {
  var n = notas.length;
  if (!n) return { n: 0, media: null, positivo: 0, negativo: 0, desvio: 0 };

  var soma = 0, positivo = 0, negativo = 0;
  notas.forEach(function (v) {
    soma += v;
    if (v >= 4) positivo++;
    if (v <= 2) negativo++;
  });

  var media = soma / n;
  var variancia = notas.reduce(function (s, v) { return s + (v - media) * (v - media); }, 0) / n;

  return {
    n: n,
    media: media,
    positivo: Math.round(positivo / n * 100),
    negativo: Math.round(negativo / n * 100),
    desvio: Math.sqrt(variancia)
  };
}

function media(valores) {
  return resumo(valores).media;
}

function formatarMedia(valor) {
  return valor == null ? '–' : valor.toFixed(1).replace('.', ',');
}

/** Cor da média, na mesma régua da escala do formulário. */
function corDaMedia(valor) {
  if (valor == null) return '#a3a3a3';
  return ESCALA[Math.min(4, Math.max(0, Math.round(valor) - 1))].cor;
}

function contagemDa(n) {
  var contagem = [0, 0, 0, 0, 0];
  notasDa(n).forEach(function (v) { contagem[v - 1]++; });
  return contagem;
}

function secaoDaPergunta(n) {
  for (var i = 0; i < SECOES.length; i++) {
    for (var j = 0; j < SECOES[i].perguntas.length; j++) {
      if (SECOES[i].perguntas[j].n === n) return { secao: SECOES[i], indice: i };
    }
  }
  return null;
}

/** Respostas de texto de uma chave (p5, p16c...), com o número da avaliação. */
function textosDa(chave) {
  return participantes()
    .filter(function (p) { return p.respostas[chave]; })
    .map(function (p) { return { numero: p.numero, texto: p.respostas[chave] }; });
}

/* ------------------------------------------------------------------ */
/* Renderização                                                        */
/* ------------------------------------------------------------------ */

function renderizar() {
  // Número só para referência na tela: a planilha já guarda as linhas em
  // ordem aleatória, então ele não diz quem respondeu primeiro.
  participantes().forEach(function (p, i) { p.numero = i + 1; });

  var total = participantes().length;
  var radio = resumo(notasDe(perguntasDaRadio()));

  $('kpi-total').textContent = total;
  $('kpi-media').textContent = formatarMedia(radio.media);
  $('kpi-media').style.color = corDaMedia(radio.media);
  $('kpi-positivo').textContent = radio.n ? radio.positivo + '% das notas são 4 ou 5' : '';

  var secoes = secoesDaRadio()
    .map(function (s) { s.resumo = resumo(notasDe(s.secao.perguntas.filter(temNota))); return s; })
    .filter(function (s) { return s.resumo.n; })
    .sort(function (a, b) { return b.resumo.media - a.resumo.media; });

  if (secoes.length) {
    var melhor = secoes[0];
    var pior = secoes[secoes.length - 1];
    $('kpi-melhor').textContent = melhor.secao.titulo;
    $('kpi-melhor-nota').textContent = 'Média ' + formatarMedia(melhor.resumo.media) + ' · ' + melhor.resumo.positivo + '% positivo';
    $('kpi-pior').textContent = pior.secao.titulo;
    $('kpi-pior-nota').textContent = 'Média ' + formatarMedia(pior.resumo.media) + ' · ' + pior.resumo.negativo + '% negativo';
  } else {
    ['kpi-melhor', 'kpi-pior'].forEach(function (id) { $(id).textContent = '–'; });
    ['kpi-melhor-nota', 'kpi-pior-nota'].forEach(function (id) { $(id).textContent = ''; });
  }

  var poucas = total > 0 && total < MINIMO_CONFIAVEL;
  $('aviso-amostra').hidden = !poucas;
  $('aviso-amostra-texto').textContent = 'Apenas ' + total + (total === 1 ? ' avaliação' : ' avaliações') +
    ' até agora. Com tão poucas respostas, cada nova avaliação muda bastante as médias.';

  renderizarGeral();
  renderizarPerguntas();
  montarFiltroSecoes();
  renderizarAbertas();
  renderizarParticipantes();

  $('carregando').hidden = true;
  $('conteudo').hidden = false;
  abrirAba(abaAtual);
  desenharIcones();
}

/** Linha com rótulo, média, % positivo e barra de distribuição das notas. */
function linhaResumo(rotulo, notas, contagem) {
  var r = resumo(notas);
  return '<div class="mb-5 last:mb-0 evitar-quebra">' +
      '<div class="flex items-baseline justify-between gap-4 mb-1.5">' +
        '<span class="text-sm text-neutral-700 leading-snug">' + rotulo + '</span>' +
        '<span class="text-sm shrink-0 text-right">' +
          '<strong style="color:' + corDaMedia(r.media) + '">' + formatarMedia(r.media) + '</strong>' +
          (r.n ? ' <span class="text-neutral-400 text-xs ml-1">' + r.positivo + '% positivo</span>' : '') +
        '</span>' +
      '</div>' +
      barraDistribuicao(contagem, false) +
    '</div>';
}

function contagemDeNotas(notas) {
  var c = [0, 0, 0, 0, 0];
  notas.forEach(function (v) { c[v - 1]++; });
  return c;
}

function renderizarGeral() {
  // Média por seção (só a rádio) e, à parte, a autoavaliação.
  var linhas = secoesDaRadio().map(function (s) {
    var notas = notasDe(s.secao.perguntas.filter(temNota));
    return linhaResumo('<span class="text-neutral-400 mr-1">' + (s.indice + 1) + '.</span> ' + escapar(s.secao.titulo),
      notas, contagemDeNotas(notas));
  }).join('');

  var notasAuto = notasDe(SECOES[INDICE_AUTOAVALIACAO].perguntas.filter(temNota));
  $('medias-secoes').innerHTML = linhas +
    '<div class="mt-6 pt-5 border-t border-dashed border-neutral-200">' +
      '<p class="text-xs text-neutral-400 mb-3">Não entra na média da rádio — cada pessoa avaliando a si mesma:</p>' +
      linhaResumo('<span class="text-neutral-400 mr-1">9.</span> Autoavaliação', notasAuto, contagemDeNotas(notasAuto)) +
    '</div>' +
    legendaEscala();

  // Rankings: só perguntas sobre a rádio, e uma pergunta nunca aparece nas duas listas.
  var ranking = perguntasDaRadio()
    .map(function (p) { return { p: p, r: resumo(notasDa(p.n)) }; })
    .filter(function (item) { return item.r.n; });

  var porMedia = ranking.slice().sort(function (a, b) { return b.r.media - a.r.media || b.r.positivo - a.r.positivo; });
  var metade = Math.floor(porMedia.length / 2);
  var melhores = porMedia.slice(0, Math.min(5, metade));
  var piores = porMedia.slice().reverse().slice(0, Math.min(5, metade));

  $('ranking-melhores').innerHTML = listaRanking(melhores, 'positivo');
  $('ranking-piores').innerHTML = listaRanking(piores, 'negativo');

  // Opinião dividida: maior desvio padrão. Só faz sentido com algumas respostas.
  var divididas = ranking
    .filter(function (item) { return item.r.n >= 3 && item.r.desvio >= 1; })
    .sort(function (a, b) { return b.r.desvio - a.r.desvio; })
    .slice(0, 5);

  $('divididas').innerHTML = divididas.length
    ? divididas.map(function (item) {
        return '<div class="py-3 border-b border-neutral-100 last:border-b-0 evitar-quebra">' +
            '<p class="text-sm text-neutral-600 leading-snug mb-2"><span class="text-neutral-400">P' + item.p.n + '.</span> ' + escapar(item.p.texto) + '</p>' +
            barraDistribuicao(contagemDa(item.p.n), false) +
          '</div>';
      }).join('')
    : '<p class="text-sm text-neutral-400">Nenhuma pergunta com opinião muito dividida' +
        (participantes().length < 3 ? ' (precisa de pelo menos 3 avaliações).' : '.') + '</p>';

  // Comparativo equipe × autoavaliação
  $('comparativo').innerHTML = COMPARATIVO.map(function (par) {
    var mEquipe = media(notasDa(par.equipe));
    var mAuto = media(notasDa(par.auto));
    var diferenca = (mEquipe != null && mAuto != null) ? mAuto - mEquipe : null;
    var textoDif = diferenca == null ? '' :
      (Math.abs(diferenca) < 0.05 ? 'mesma média' :
        (diferenca > 0 ? '+' : '−') + Math.abs(diferenca).toFixed(1).replace('.', ',') + ' na autoavaliação');

    return '<div class="mb-6 last:mb-0 evitar-quebra">' +
        '<div class="flex items-baseline justify-between gap-4 mb-2.5">' +
          '<p class="text-sm font-semibold text-neutral-800">' + escapar(par.tema) + '</p>' +
          '<p class="text-xs text-neutral-400 shrink-0">' + textoDif + '</p>' +
        '</div>' +
        linhaComparativo('Equipe (P' + par.equipe + ')', mEquipe, '#7EA6E8') +
        linhaComparativo('Autoavaliação (P' + par.auto + ')', mAuto, '#004AC9') +
      '</div>';
  }).join('');
}

function legendaEscala() {
  return '<div class="flex flex-wrap gap-x-4 gap-y-1 mt-6 text-xs text-neutral-400">' +
      ESCALA.map(function (item) {
        return '<span class="inline-flex items-center gap-1.5">' +
            '<span class="w-2.5 h-2.5 rounded-sm" style="background-color:' + item.cor + '"></span>' +
            item.valor + ' ' + item.rotulo +
          '</span>';
      }).join('') +
    '</div>';
}

function linhaComparativo(rotulo, valor, cor) {
  var largura = valor == null ? 0 : (valor / 5 * 100);
  return '<div class="flex items-center gap-3 mb-1.5">' +
      '<span class="text-xs text-neutral-500 w-32 sm:w-36 shrink-0">' + rotulo + '</span>' +
      '<div class="flex-1 h-2.5 bg-neutral-100 rounded-full overflow-hidden">' +
        '<div class="h-full rounded-full" style="width:' + largura + '%;background-color:' + cor + '"></div>' +
      '</div>' +
      '<span class="text-sm font-semibold w-8 text-right" style="color:' + cor + '">' + formatarMedia(valor) + '</span>' +
    '</div>';
}

function listaRanking(itens, destaque) {
  if (!itens.length) return '<p class="text-sm text-neutral-400">Sem avaliações suficientes ainda.</p>';

  return itens.map(function (item) {
    var pct = destaque === 'positivo'
      ? item.r.positivo + '% deram 4 ou 5'
      : item.r.negativo + '% deram 1 ou 2';

    return '<div class="flex items-start gap-3 py-3 border-b border-neutral-100 last:border-b-0 evitar-quebra">' +
        '<span class="text-base font-semibold w-9 shrink-0" style="color:' + corDaMedia(item.r.media) + '">' + formatarMedia(item.r.media) + '</span>' +
        '<div>' +
          '<p class="text-sm text-neutral-600 leading-snug"><span class="text-neutral-400">P' + item.p.n + '.</span> ' + escapar(item.p.texto) + '</p>' +
          '<p class="text-xs text-neutral-400 mt-1">' + pct + '</p>' +
        '</div>' +
      '</div>';
  }).join('');
}

/**
 * Barra empilhada com a fatia de cada nota (1 a 5). Com legenda, mostra
 * quantidade e percentual de cada uma abaixo.
 */
function barraDistribuicao(contagem, comLegenda) {
  var total = contagem.reduce(function (s, v) { return s + v; }, 0);
  if (!total) return '<div class="w-full h-2.5 rounded-full bg-neutral-100"></div>';

  var fatias = contagem.map(function (qtd, i) {
    if (!qtd) return '';
    var pct = qtd / total * 100;
    return '<div class="h-full flex items-center justify-center text-[10px] font-semibold text-white" ' +
        'style="width:' + pct + '%;background-color:' + ESCALA[i].cor + '" title="' + ESCALA[i].rotulo + ': ' + qtd + '">' +
        (comLegenda && pct >= 9 ? Math.round(pct) + '%' : '') +
      '</div>';
  }).join('');

  var legenda = comLegenda
    ? '<div class="flex flex-wrap gap-x-4 gap-y-1 mt-2.5 text-xs text-neutral-500">' +
        contagem.map(function (qtd, i) {
          return '<span class="inline-flex items-center gap-1.5">' +
              '<span class="w-2.5 h-2.5 rounded-sm" style="background-color:' + ESCALA[i].cor + '"></span>' +
              ESCALA[i].rotulo + ': <strong class="text-neutral-700">' + qtd + '</strong>' +
            '</span>';
        }).join('') +
      '</div>'
    : '';

  return '<div class="w-full ' + (comLegenda ? 'h-5' : 'h-2.5') + ' rounded-full overflow-hidden flex bg-neutral-100">' + fatias + '</div>' + legenda;
}

function itemTexto(item) {
  return '<li class="border-l-2 border-gp-light pl-3 py-1 evitar-quebra">' +
      '<p class="text-sm text-neutral-700 leading-relaxed whitespace-pre-line">' + escapar(item.texto) + '</p>' +
      '<button type="button" onclick="abrirDetalhe(' + item.numero + ')" ' +
        'class="text-xs text-gp-blue/80 hover:text-gp-blue mt-1 font-medium">Avaliação #' + item.numero + '</button>' +
    '</li>';
}

function renderizarPerguntas() {
  $('lista-perguntas').innerHTML = SECOES.map(function (secao, i) {
    var resumoSecao = resumo(notasDe(secao.perguntas.filter(temNota)));

    var blocos = secao.perguntas.map(function (p) {
      if (p.tipo === 'aberta') {
        var qtd = textosDa('p' + p.n).length;
        return '<div class="py-5 border-t border-neutral-100 evitar-quebra">' +
            '<p class="text-sm font-medium text-neutral-800 leading-snug mb-1.5"><span class="text-gp-blue">P' + p.n + '.</span> ' + escapar(p.texto) + '</p>' +
            '<button type="button" onclick="verAbertas(' + p.n + ')" class="text-xs text-gp-blue font-medium hover:underline">' +
              'Pergunta aberta · ' + qtd + (qtd === 1 ? ' resposta' : ' respostas') + ' <span class="sem-pdf">→</span></button>' +
          '</div>';
      }

      var r = resumo(notasDa(p.n));
      var comentarios = p.tipo === 'comentario' ? textosDa('p' + p.n + 'c') : [];

      return '<div class="py-5 border-t border-neutral-100 evitar-quebra">' +
          '<div class="flex items-start justify-between gap-4 mb-3">' +
            '<p class="text-sm font-medium text-neutral-800 leading-snug"><span class="text-gp-blue">P' + p.n + '.</span> ' + escapar(p.texto) + '</p>' +
            '<div class="text-right shrink-0">' +
              '<p class="text-xl font-semibold leading-none" style="color:' + corDaMedia(r.media) + '">' + formatarMedia(r.media) + '</p>' +
              (r.n ? '<p class="text-[11px] text-neutral-400 mt-1">' + r.positivo + '% positivo</p>' : '') +
            '</div>' +
          '</div>' +
          barraDistribuicao(contagemDa(p.n), true) +
          (comentarios.length
            ? '<details class="mt-4 group">' +
                '<summary class="flex items-center gap-2 cursor-pointer text-sm font-medium text-gp-blue list-none">' +
                  '<i class="w-4 h-4 transition-transform group-open:rotate-90 sem-pdf" data-lucide="chevron-right"></i>' +
                  'Comentários (' + comentarios.length + ')' +
                '</summary>' +
                '<ul class="space-y-2 mt-3">' + comentarios.map(itemTexto).join('') + '</ul>' +
              '</details>'
            : '') +
        '</div>';
    });

    // O cabeçalho da seção vai junto com a primeira pergunta, para não
    // ficar sozinho no pé da página do PDF.
    return '<section class="bg-white rounded-2xl border border-neutral-150 p-6 md:p-8">' +
      '<div class="evitar-quebra">' +
        '<div class="flex items-start justify-between gap-4 mb-2">' +
          '<div class="flex items-start gap-3">' +
            '<span class="w-8 h-8 rounded-full bg-gp-blue text-white text-sm font-semibold flex items-center justify-center shrink-0">' + (i + 1) + '</span>' +
            '<h2 class="text-lg font-semibold tracking-tight leading-snug pt-1">' + escapar(secao.titulo) + '</h2>' +
          '</div>' +
          (resumoSecao.n
            ? '<span class="text-sm text-neutral-400 shrink-0 pt-1.5">média <strong style="color:' + corDaMedia(resumoSecao.media) + '">' + formatarMedia(resumoSecao.media) + '</strong></span>'
            : '') +
        '</div>' +
        blocos[0] +
      '</div>' +
      blocos.slice(1).join('') +
      '</section>';
  }).join('');
}

/* ------------------------------------------------------------------ */
/* Respostas abertas                                                   */
/* ------------------------------------------------------------------ */

function montarFiltroSecoes() {
  var filtro = $('filtro-secao');
  var atual = filtro.value;

  filtro.innerHTML = '<option value="">Todas as seções</option>' + SECOES.map(function (s, i) {
    var temTexto = s.perguntas.some(function (p) { return p.tipo !== 'escala'; });
    return temTexto ? '<option value="' + i + '">' + (i + 1) + '. ' + escapar(s.titulo) + '</option>' : '';
  }).join('');

  filtro.value = atual;
}

function verAbertas(n) {
  var local = secaoDaPergunta(n);
  $('filtro-secao').value = String(local.indice);
  $('busca-abertas').value = '';
  renderizarAbertas();
  abrirAba('abertas');

  var alvo = $('aberta-p' + n);
  if (alvo) setTimeout(function () { alvo.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50);
}

function renderizarAbertas() {
  var busca = $('busca-abertas').value.trim().toLowerCase();
  var filtroSecao = $('filtro-secao').value;
  var html = '';

  SECOES.forEach(function (secao, i) {
    if (filtroSecao !== '' && String(i) !== filtroSecao) return;

    secao.perguntas.forEach(function (p) {
      if (p.tipo === 'escala') return;

      var chave = p.tipo === 'comentario' ? 'p' + p.n + 'c' : 'p' + p.n;
      var itens = textosDa(chave).filter(function (item) {
        return !busca || item.texto.toLowerCase().indexOf(busca) !== -1;
      });

      if (busca && !itens.length) return;

      // No PDF, o título fica preso à primeira resposta: sozinho, ele podia
      // sobrar no pé da página com as respostas começando na seguinte.
      html += '<section id="aberta-p' + p.n + '" class="bg-white rounded-2xl border border-neutral-150 p-6 md:p-8 scroll-mt-6">' +
          '<div class="evitar-quebra">' +
            '<p class="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">' + (i + 1) + '. ' + escapar(secao.titulo) + '</p>' +
            '<h3 class="text-base font-semibold leading-snug mb-5"><span class="text-gp-blue">P' + p.n + '.</span> ' + escapar(p.texto) +
              (p.tipo === 'comentario' ? ' <span class="text-neutral-400 font-normal">(comentários)</span>' : '') + '</h3>' +
            (itens.length
              ? '<ul>' + itemTexto(itens[0]) + '</ul>'
              : '<p class="text-sm text-neutral-400">Nenhuma resposta.</p>') +
          '</div>' +
          (itens.length > 1
            ? '<ul class="space-y-3 mt-3">' + itens.slice(1).map(itemTexto).join('') + '</ul>'
            : '') +
        '</section>';
    });
  });

  $('lista-abertas').innerHTML = html || '<p class="text-sm text-neutral-400 text-center py-10">Nada encontrado.</p>';
}

/* ------------------------------------------------------------------ */
/* Participantes: mapa de calor                                        */
/* ------------------------------------------------------------------ */

function mediaDoParticipante(pessoa, perguntas) {
  return media(perguntas
    .map(function (p) { return pessoa.respostas['p' + p.n]; })
    .filter(function (v) { return typeof v === 'number'; }));
}

/** Célula colorida pela nota: a cor mostra de longe quem está crítico com o quê. */
function celulaCalor(valor) {
  if (valor == null) return '<td class="celula-calor py-2 px-1 text-center text-neutral-300">–</td>';
  var cor = corDaMedia(valor);
  return '<td class="celula-calor py-1.5 px-1 text-center">' +
      '<span class="inline-block w-11 py-1.5 rounded-md text-xs font-semibold" style="background-color:' + cor + '22;color:' + cor + '">' +
        formatarMedia(valor) +
      '</span>' +
    '</td>';
}

function renderizarParticipantes() {
  var ordem = $('ordem-participantes').value;
  var secoes = secoesDaRadio();
  var daRadio = perguntasDaRadio();
  var auto = SECOES[INDICE_AUTOAVALIACAO].perguntas.filter(temNota);

  $('cabecalho-calor').innerHTML =
    '<th class="pb-3 pr-3 font-medium text-left">Avaliação</th>' +
    secoes.map(function (s) {
      return '<th class="pb-3 px-1 font-medium text-center" title="' + escapar(s.secao.titulo) + '">' + (s.indice + 1) + '</th>';
    }).join('') +
    '<th class="pb-3 px-1 font-semibold text-center text-neutral-600">Rádio</th>' +
    '<th class="pb-3 px-1 font-medium text-center">Auto</th>' +
    '<th class="pb-3 pl-3 font-medium text-left sem-pdf">Enviada em</th>';

  var lista = participantes()
    .map(function (p) { return { pessoa: p, radio: mediaDoParticipante(p, daRadio) }; });

  if (ordem === 'critico') lista.sort(function (a, b) { return (a.radio || 0) - (b.radio || 0); });
  if (ordem === 'positivo') lista.sort(function (a, b) { return (b.radio || 0) - (a.radio || 0); });

  $('lista-participantes').innerHTML = lista.map(function (item) {
    var p = item.pessoa;
    return '<tr class="border-b border-neutral-100 hover:bg-neutral-50 cursor-pointer evitar-quebra" onclick="abrirDetalhe(' + p.numero + ')">' +
        '<td class="py-2 pr-3 font-medium tabular-nums whitespace-nowrap text-gp-blue">#' + p.numero + '</td>' +
        secoes.map(function (s) { return celulaCalor(mediaDoParticipante(p, s.secao.perguntas.filter(temNota))); }).join('') +
        celulaCalor(item.radio) +
        celulaCalor(mediaDoParticipante(p, auto)) +
        '<td class="py-2 pl-3 text-neutral-400 tabular-nums whitespace-nowrap text-xs sem-pdf">' + escapar(p.quando) + '</td>' +
      '</tr>';
  }).join('');

  $('legenda-calor').innerHTML = secoes.map(function (s) {
    return '<span><strong class="text-neutral-600">' + (s.indice + 1) + '</strong> ' + escapar(s.secao.titulo) + '</span>';
  }).join('') +
    '<span><strong class="text-neutral-600">Rádio</strong> média das seções 1 a 8</span>' +
    '<span><strong class="text-neutral-600">Auto</strong> autoavaliação</span>';

  $('sem-participantes').hidden = lista.length > 0;
}

function abrirDetalhe(numero) {
  var pessoa = participantes().filter(function (p) { return p.numero === numero; })[0];
  if (!pessoa) return;

  var mRadio = mediaDoParticipante(pessoa, perguntasDaRadio());
  var mAuto = mediaDoParticipante(pessoa, SECOES[INDICE_AUTOAVALIACAO].perguntas.filter(temNota));

  $('detalhe-titulo').textContent = 'Avaliação #' + pessoa.numero;
  $('detalhe-corpo').innerHTML =
    '<p class="text-sm text-neutral-400 mb-6">Enviada em ' + escapar(pessoa.quando) +
      ' · média dada à rádio <strong style="color:' + corDaMedia(mRadio) + '">' + formatarMedia(mRadio) + '</strong>' +
      ' · autoavaliação <strong style="color:' + corDaMedia(mAuto) + '">' + formatarMedia(mAuto) + '</strong></p>' +
    SECOES.map(function (secao, i) {
      return '<div class="mb-8">' +
          '<h3 class="text-xs font-semibold uppercase tracking-wide text-gp-blue mb-3">' + (i + 1) + '. ' + escapar(secao.titulo) + '</h3>' +
          secao.perguntas.map(function (p) { return respostaDetalhe(pessoa, p); }).join('') +
        '</div>';
    }).join('');

  $('detalhe').hidden = false;
  document.body.style.overflow = 'hidden';
  desenharIcones();
}

function respostaDetalhe(pessoa, p) {
  var resposta = '';

  if (temNota(p)) {
    var nota = pessoa.respostas['p' + p.n];
    resposta = typeof nota === 'number'
      ? '<span class="inline-flex items-center gap-2 text-sm font-semibold" style="color:' + ESCALA[nota - 1].cor + '">' +
          '<span class="w-7 h-7 rounded-lg text-white flex items-center justify-center" style="background-color:' + ESCALA[nota - 1].cor + '">' + nota + '</span>' +
          ESCALA[nota - 1].rotulo +
        '</span>'
      : '<span class="text-sm text-neutral-300">sem nota</span>';
  }

  var chaveTexto = p.tipo === 'aberta' ? 'p' + p.n : (p.tipo === 'comentario' ? 'p' + p.n + 'c' : null);
  if (chaveTexto) {
    var texto = pessoa.respostas[chaveTexto];
    resposta += texto
      ? '<p class="text-sm text-neutral-700 leading-relaxed whitespace-pre-line bg-neutral-50 rounded-xl px-4 py-3 mt-2">' + escapar(texto) + '</p>'
      : (p.tipo === 'aberta' ? '<p class="text-sm text-neutral-300">não respondeu</p>' : '');
  }

  return '<div class="py-3 border-b border-neutral-100 last:border-b-0">' +
      '<p class="text-sm text-neutral-500 leading-snug mb-2"><span class="font-semibold text-neutral-400">P' + p.n + '.</span> ' + escapar(p.texto) + '</p>' +
      resposta +
    '</div>';
}

function fecharDetalhe() {
  $('detalhe').hidden = true;
  document.body.style.overflow = '';
}

/* ------------------------------------------------------------------ */
/* Abas e exportação                                                   */
/* ------------------------------------------------------------------ */

function abrirAba(qual) {
  abaAtual = qual;

  var paineis = document.querySelectorAll('.painel');
  for (var i = 0; i < paineis.length; i++) {
    paineis[i].hidden = paineis[i].id !== 'painel-' + qual;
  }

  var botoes = document.querySelectorAll('.aba');
  for (var j = 0; j < botoes.length; j++) {
    var ativa = botoes[j].dataset.aba === qual;
    botoes[j].className = 'aba whitespace-nowrap text-sm font-medium px-5 py-2.5 rounded-full transition-colors ' +
      (ativa ? 'bg-gp-blue text-white' : 'bg-white text-neutral-500 border border-neutral-150 hover:text-gp-blue');
  }
}

/** CSV com uma linha por participante: abre direto no Excel (separador ;). */
function exportarCsv() {
  var colunas = ['Avaliação', 'Data'];
  var chaves = [];

  todasPerguntas().forEach(function (p) {
    colunas.push('P' + p.n + '. ' + p.texto);
    chaves.push('p' + p.n);
    if (p.tipo === 'comentario') {
      colunas.push('P' + p.n + ' - Comentário');
      chaves.push('p' + p.n + 'c');
    }
  });

  function celula(valor) {
    var texto = valor == null ? '' : String(valor);
    return '"' + texto.replace(/"/g, '""') + '"';
  }

  var linhas = [colunas.map(celula).join(';')].concat(participantes().map(function (p) {
    return [p.numero, p.quando].concat(chaves.map(function (k) { return p.respostas[k]; })).map(celula).join(';');
  }));

  // BOM para o Excel reconhecer UTF-8 e não estragar os acentos.
  var blob = new Blob(['﻿' + linhas.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  var link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'avaliacao-super-fm-' + new Date().toISOString().slice(0, 10) + '.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(function () { URL.revokeObjectURL(link.href); }, 1000);
}

/**
 * Relatório completo em PDF pela impressão do navegador ("Salvar como PDF").
 *
 * Antes era html2pdf, que fotografa a página e fatia a imagem: cortava
 * cartões ao meio e, dentro das grades, os espaçadores que ele insere para
 * evitar o corte ocupavam uma célula e desalinhavam tudo. A impressão nativa
 * pagina de verdade, respeita break-inside e mantém o texto nítido.
 * O layout de impressão fica no @media print de styles.css.
 */
function exportarPdf() {
  var busca = $('busca-abertas').value;
  var filtro = $('filtro-secao').value;
  var detalhes = document.querySelectorAll('#relatorio details');
  var abertos = [];
  var i;

  // O relatório sai completo, sem os filtros que estiverem aplicados na tela.
  $('busca-abertas').value = '';
  $('filtro-secao').value = '';
  renderizarAbertas();
  renderizarParticipantes();

  for (i = 0; i < detalhes.length; i++) {
    abertos.push(detalhes[i].open);
    detalhes[i].open = true;
  }

  var hoje = new Date();
  $('pdf-rodape').textContent = 'Emitido em ' + hoje.toLocaleDateString('pt-BR') +
    ' · ' + participantes().length + ' avaliações · Confidencial — uso exclusivo da Diretoria';

  // O título vira o nome sugerido do arquivo no "Salvar como PDF".
  var tituloOriginal = document.title;
  document.title = 'avaliacao-super-fm-' + hoje.toISOString().slice(0, 10);

  var restaurado = false;
  function restaurar() {
    if (restaurado) return;
    restaurado = true;
    document.title = tituloOriginal;
    for (var j = 0; j < detalhes.length; j++) detalhes[j].open = abertos[j];
    $('busca-abertas').value = busca;
    $('filtro-secao').value = filtro;
    renderizarAbertas();
    renderizarParticipantes();
  }

  window.addEventListener('afterprint', restaurar, { once: true });
  window.print();
  // Alguns navegadores não disparam afterprint; print() bloqueia até fechar.
  setTimeout(restaurar, 1000);
}

/* ------------------------------------------------------------------ */
/* Inicialização                                                       */
/* ------------------------------------------------------------------ */

document.addEventListener('DOMContentLoaded', function () {
  desenharIcones();

  // Acorda o Apps Script enquanto a pessoa digita a senha.
  enviarAoServidor({ action: 'ping' }).catch(function () {});

  if (acessoAtual()) {
    carregarDados();
  } else {
    mostrarLogin();
  }

  $('senha').addEventListener('keydown', function (evento) {
    if (evento.key === 'Enter') entrar();
  });

  document.addEventListener('keydown', function (evento) {
    if (evento.key === 'Escape') fecharDetalhe();
  });
});
