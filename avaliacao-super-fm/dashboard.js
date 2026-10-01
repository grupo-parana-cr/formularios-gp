/**
 * Dashboard da Avaliação Interna Super FM - Grupo Paraná
 *
 * O Apps Script devolve as avaliações (com CPF) só com credenciais válidas;
 * todas as médias e contagens são calculadas aqui. Perguntas e seções vêm de
 * SECOES, em script.js, para não duplicar os textos.
 */

var dadosAtuais = null;
var abaAtual = 'geral';

/** Pares de temas equivalentes entre a seção 8 (equipe) e a 9 (autoavaliação). */
var COMPARATIVO = [
  { tema: 'Preparação e pontualidade', equipe: 38, auto: 42 },
  { tema: 'Conexão com os ouvintes', equipe: 39, auto: 44 },
  { tema: 'Compromisso com anunciantes', equipe: 40, auto: 45 }
];

var NUMEROS_AUTOAVALIACAO = [42, 43, 44, 45, 46];

/* ------------------------------------------------------------------ */
/* Acesso                                                              */
/* ------------------------------------------------------------------ */

/**
 * As credenciais ficam só na aba aberta (sessionStorage) e são conferidas no
 * servidor a cada chamada. Nada de senha no código: este repositório é
 * público, e qualquer pessoa leria o arquivo.
 */
function credenciais() {
  try {
    var guardado = sessionStorage.getItem('acesso-super-fm');
    return guardado ? JSON.parse(guardado) : null;
  } catch (erro) {
    return null;
  }
}

function guardarCredenciais(usuario, senha) {
  try {
    sessionStorage.setItem('acesso-super-fm', JSON.stringify({ usuario: usuario, senha: senha }));
  } catch (erro) { /* armazenamento bloqueado: segue só em memória */ }
  credenciaisEmMemoria = { usuario: usuario, senha: senha };
}

var credenciaisEmMemoria = null;

function acessoAtual() {
  return credenciais() || credenciaisEmMemoria;
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
  try { sessionStorage.removeItem('acesso-super-fm'); } catch (erro) {}
  credenciaisEmMemoria = null;
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

      if (dados.error === 'nao-autorizado') {
        sair();
        restaurarBotaoEntrar();
        mostrarLogin('Usuário ou senha incorretos.');
        return;
      }

      if (dados.error) throw new Error(dados.error);

      restaurarBotaoEntrar();
      $('acoes').hidden = false;
      dadosAtuais = dados;
      renderizar(dados);
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

/** Notas dadas a uma pergunta, ignorando quem não respondeu. */
function notasDa(n) {
  return participantes()
    .map(function (p) { return p.respostas['p' + n]; })
    .filter(function (v) { return typeof v === 'number'; });
}

function media(valores) {
  if (!valores.length) return null;
  return valores.reduce(function (s, v) { return s + v; }, 0) / valores.length;
}

function formatarMedia(valor) {
  return valor == null ? '–' : valor.toFixed(1).replace('.', ',');
}

/** Cor da média, na mesma régua da escala do formulário. */
function corDaMedia(valor) {
  if (valor == null) return '#a3a3a3';
  return ESCALA[Math.min(4, Math.max(0, Math.round(valor) - 1))].cor;
}

function perguntasComNota(secao) {
  return secao.perguntas.filter(temNota);
}

/** Média da seção = média de todas as notas dadas às perguntas dela. */
function mediaDaSecao(secao) {
  var todas = [];
  perguntasComNota(secao).forEach(function (p) { todas = todas.concat(notasDa(p.n)); });
  return media(todas);
}

function secaoDaPergunta(n) {
  for (var i = 0; i < SECOES.length; i++) {
    for (var j = 0; j < SECOES[i].perguntas.length; j++) {
      if (SECOES[i].perguntas[j].n === n) return { secao: SECOES[i], indice: i };
    }
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Renderização                                                        */
/* ------------------------------------------------------------------ */

function renderizar(dados) {
  $('kpi-total').textContent = dados.total || 0;

  var todas = [];
  todasPerguntas().filter(temNota).forEach(function (p) { todas = todas.concat(notasDa(p.n)); });
  var mediaGeral = media(todas);
  $('kpi-media').textContent = formatarMedia(mediaGeral);
  $('kpi-media').style.color = corDaMedia(mediaGeral);

  var secoesComMedia = SECOES
    .map(function (s, i) { return { secao: s, indice: i, media: mediaDaSecao(s) }; })
    .filter(function (s) { return s.media != null; })
    .sort(function (a, b) { return b.media - a.media; });

  if (secoesComMedia.length) {
    var melhor = secoesComMedia[0];
    var pior = secoesComMedia[secoesComMedia.length - 1];
    $('kpi-melhor').textContent = melhor.secao.titulo;
    $('kpi-melhor-nota').textContent = 'Média ' + formatarMedia(melhor.media);
    $('kpi-pior').textContent = pior.secao.titulo;
    $('kpi-pior-nota').textContent = 'Média ' + formatarMedia(pior.media);
  } else {
    $('kpi-melhor').textContent = '–';
    $('kpi-melhor-nota').textContent = '';
    $('kpi-pior').textContent = '–';
    $('kpi-pior-nota').textContent = '';
  }

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

function barraMedia(rotulo, valor, detalhe) {
  var largura = valor == null ? 0 : (valor / 5 * 100);
  return '<div class="mb-4 evitar-quebra">' +
      '<div class="flex items-baseline justify-between gap-4 mb-1.5">' +
        '<span class="text-sm text-neutral-700 leading-snug">' + rotulo + '</span>' +
        '<span class="text-sm font-semibold shrink-0" style="color:' + corDaMedia(valor) + '">' +
          formatarMedia(valor) + (detalhe ? ' <span class="font-normal text-neutral-300">' + detalhe + '</span>' : '') +
        '</span>' +
      '</div>' +
      '<div class="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden">' +
        '<div class="h-full rounded-full transition-all duration-700" style="width:' + largura + '%;background-color:' + corDaMedia(valor) + '"></div>' +
      '</div>' +
    '</div>';
}

function renderizarGeral() {
  // Média por seção
  $('medias-secoes').innerHTML = SECOES.map(function (secao, i) {
    if (!perguntasComNota(secao).length) return '';
    return barraMedia('<span class="text-neutral-400 mr-1">' + (i + 1) + '.</span> ' + escapar(secao.titulo), mediaDaSecao(secao));
  }).join('');

  // Rankings
  var ranking = todasPerguntas().filter(temNota)
    .map(function (p) { return { p: p, media: media(notasDa(p.n)) }; })
    .filter(function (r) { return r.media != null; });

  var porMedia = ranking.slice().sort(function (a, b) { return b.media - a.media; });
  $('ranking-melhores').innerHTML = listaRanking(porMedia.slice(0, 5));
  $('ranking-piores').innerHTML = listaRanking(porMedia.slice().reverse().slice(0, 5));

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

  // Distribuição de todas as notas
  var contagem = [0, 0, 0, 0, 0];
  todasPerguntas().filter(temNota).forEach(function (p) {
    notasDa(p.n).forEach(function (v) { contagem[v - 1]++; });
  });
  $('distribuicao-geral').innerHTML = barraDistribuicao(contagem, true);
}

function linhaComparativo(rotulo, valor, cor) {
  var largura = valor == null ? 0 : (valor / 5 * 100);
  return '<div class="flex items-center gap-3 mb-1.5">' +
      '<span class="text-xs text-neutral-500 w-36 shrink-0">' + rotulo + '</span>' +
      '<div class="flex-1 h-2.5 bg-neutral-100 rounded-full overflow-hidden">' +
        '<div class="h-full rounded-full" style="width:' + largura + '%;background-color:' + cor + '"></div>' +
      '</div>' +
      '<span class="text-sm font-semibold w-8 text-right" style="color:' + cor + '">' + formatarMedia(valor) + '</span>' +
    '</div>';
}

function listaRanking(itens) {
  if (!itens.length) return '<p class="text-sm text-neutral-400">Sem avaliações ainda.</p>';

  return itens.map(function (item) {
    return '<div class="flex items-start gap-3 py-3 border-b border-neutral-100 last:border-b-0 evitar-quebra">' +
        '<span class="text-sm font-semibold w-10 shrink-0 pt-0.5" style="color:' + corDaMedia(item.media) + '">' + formatarMedia(item.media) + '</span>' +
        '<p class="text-sm text-neutral-600 leading-snug"><span class="text-neutral-400">P' + item.p.n + '.</span> ' + escapar(item.p.texto) + '</p>' +
      '</div>';
  }).join('');
}

/**
 * Barra empilhada com a fatia de cada nota (1 a 5). Com legenda, mostra
 * quantidade e percentual de cada uma abaixo.
 */
function barraDistribuicao(contagem, comLegenda) {
  var total = contagem.reduce(function (s, v) { return s + v; }, 0);
  if (!total) return '<p class="text-sm text-neutral-400">Sem notas ainda.</p>';

  var fatias = contagem.map(function (qtd, i) {
    if (!qtd) return '';
    var pct = qtd / total * 100;
    return '<div class="h-full flex items-center justify-center text-[11px] font-semibold text-white" ' +
        'style="width:' + pct + '%;background-color:' + ESCALA[i].cor + '" title="' + ESCALA[i].rotulo + ': ' + qtd + '">' +
        (pct >= 8 ? Math.round(pct) + '%' : '') +
      '</div>';
  }).join('');

  var legenda = comLegenda
    ? '<div class="flex flex-wrap gap-x-5 gap-y-1.5 mt-3 text-xs text-neutral-500">' +
        contagem.map(function (qtd, i) {
          return '<span class="inline-flex items-center gap-1.5">' +
              '<span class="w-2.5 h-2.5 rounded-sm" style="background-color:' + ESCALA[i].cor + '"></span>' +
              (i + 1) + ' ' + ESCALA[i].rotulo + ': <strong class="text-neutral-700">' + qtd + '</strong> (' + Math.round(qtd / total * 100) + '%)' +
            '</span>';
        }).join('') +
      '</div>'
    : '';

  return '<div class="w-full h-6 rounded-lg overflow-hidden flex bg-neutral-100">' + fatias + '</div>' + legenda;
}

function contagemDa(n) {
  var contagem = [0, 0, 0, 0, 0];
  notasDa(n).forEach(function (v) { contagem[v - 1]++; });
  return contagem;
}

/** Respostas de texto de uma chave (p5, p16c...), com o CPF de quem escreveu. */
function textosDa(chave) {
  return participantes()
    .filter(function (p) { return p.respostas[chave]; })
    .map(function (p) { return { cpf: p.cpf, texto: p.respostas[chave] }; });
}

function itemTexto(item) {
  return '<li class="border-l-2 border-gp-light pl-3 py-1 evitar-quebra">' +
      '<p class="text-sm text-neutral-700 leading-relaxed whitespace-pre-line">' + escapar(item.texto) + '</p>' +
      '<button type="button" onclick="abrirDetalhe(\'' + escapar(item.cpf) + '\')" ' +
        'class="text-xs text-gp-blue/80 hover:text-gp-blue mt-1 font-medium">' + escapar(item.cpf) + '</button>' +
    '</li>';
}

function renderizarPerguntas() {
  $('painel-perguntas').innerHTML = SECOES.map(function (secao, i) {
    var mediaSecao = mediaDaSecao(secao);

    var blocos = secao.perguntas.map(function (p) {
      if (p.tipo === 'aberta') {
        var qtd = textosDa('p' + p.n).length;
        return '<div class="py-5 border-t border-neutral-100 evitar-quebra">' +
            '<p class="text-sm font-medium text-neutral-800 leading-snug mb-1.5"><span class="text-gp-blue">P' + p.n + '.</span> ' + escapar(p.texto) + '</p>' +
            '<button type="button" onclick="verAbertas(' + p.n + ')" class="text-xs text-gp-blue font-medium hover:underline sem-pdf">' +
              'Pergunta aberta · ' + qtd + (qtd === 1 ? ' resposta' : ' respostas') + ' →</button>' +
          '</div>';
      }

      var notas = notasDa(p.n);
      var m = media(notas);
      var comentarios = p.tipo === 'comentario' ? textosDa('p' + p.n + 'c') : [];

      return '<div class="py-5 border-t border-neutral-100 evitar-quebra">' +
          '<div class="flex items-start justify-between gap-4 mb-3">' +
            '<p class="text-sm font-medium text-neutral-800 leading-snug"><span class="text-gp-blue">P' + p.n + '.</span> ' + escapar(p.texto) + '</p>' +
            '<span class="text-xl font-semibold shrink-0" style="color:' + corDaMedia(m) + '">' + formatarMedia(m) + '</span>' +
          '</div>' +
          barraDistribuicao(contagemDa(p.n), true) +
          (comentarios.length
            ? '<details class="mt-4 group">' +
                '<summary class="flex items-center gap-2 cursor-pointer text-sm font-medium text-gp-blue list-none">' +
                  '<i class="w-4 h-4 transition-transform group-open:rotate-90" data-lucide="chevron-right"></i>' +
                  'Comentários (' + comentarios.length + ')' +
                '</summary>' +
                '<ul class="space-y-2 mt-3">' + comentarios.map(itemTexto).join('') + '</ul>' +
              '</details>'
            : '') +
        '</div>';
    }).join('');

    return '<section class="bg-white rounded-2xl border border-neutral-150 p-6 md:p-8">' +
        '<div class="flex items-start justify-between gap-4 mb-2 evitar-quebra">' +
          '<div class="flex items-start gap-3">' +
            '<span class="w-8 h-8 rounded-full bg-gp-blue text-white text-sm font-semibold flex items-center justify-center shrink-0">' + (i + 1) + '</span>' +
            '<h2 class="text-lg font-semibold tracking-tight leading-snug pt-1">' + escapar(secao.titulo) + '</h2>' +
          '</div>' +
          (mediaSecao != null
            ? '<span class="text-sm text-neutral-400 shrink-0 pt-1.5">média <strong style="color:' + corDaMedia(mediaSecao) + '">' + formatarMedia(mediaSecao) + '</strong></span>'
            : '') +
        '</div>' +
        blocos +
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
        return !busca || item.texto.toLowerCase().indexOf(busca) !== -1 || item.cpf.indexOf(busca) !== -1;
      });

      if (busca && !itens.length) return;

      html += '<section id="aberta-p' + p.n + '" class="bg-white rounded-2xl border border-neutral-150 p-6 md:p-8 scroll-mt-6">' +
          '<p class="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">' + (i + 1) + '. ' + escapar(secao.titulo) + '</p>' +
          '<h3 class="text-base font-semibold leading-snug mb-5"><span class="text-gp-blue">P' + p.n + '.</span> ' + escapar(p.texto) +
            (p.tipo === 'comentario' ? ' <span class="text-neutral-400 font-normal">(comentários)</span>' : '') + '</h3>' +
          (itens.length
            ? '<ul class="space-y-3">' + itens.map(itemTexto).join('') + '</ul>'
            : '<p class="text-sm text-neutral-400">Nenhuma resposta.</p>') +
        '</section>';
    });
  });

  $('lista-abertas').innerHTML = html || '<p class="text-sm text-neutral-400 text-center py-10">Nada encontrado.</p>';
}

/* ------------------------------------------------------------------ */
/* Participantes                                                       */
/* ------------------------------------------------------------------ */

function mediaDoParticipante(p, numeros) {
  var notas = numeros
    .map(function (n) { return p.respostas['p' + n]; })
    .filter(function (v) { return typeof v === 'number'; });
  return media(notas);
}

function numerosComNota() {
  return todasPerguntas().filter(temNota).map(function (p) { return p.n; });
}

function renderizarParticipantes() {
  var busca = $('busca-cpf').value.replace(/\D/g, '');
  var lista = participantes().filter(function (p) {
    return !busca || String(p.cpf).replace(/\D/g, '').indexOf(busca) !== -1;
  });

  var todos = numerosComNota();

  $('lista-participantes').innerHTML = lista.map(function (p, i) {
    var mGeral = mediaDoParticipante(p, todos);
    var mAuto = mediaDoParticipante(p, NUMEROS_AUTOAVALIACAO);

    return '<tr class="border-b border-neutral-100 hover:bg-neutral-50 cursor-pointer evitar-quebra" onclick="abrirDetalhe(\'' + escapar(p.cpf) + '\')">' +
        '<td class="py-3 pr-4 text-neutral-400">' + (i + 1) + '</td>' +
        '<td class="py-3 pr-4 font-medium tabular-nums">' + escapar(p.cpf) + '</td>' +
        '<td class="py-3 pr-4 text-neutral-500 tabular-nums">' + escapar(p.quando) + '</td>' +
        '<td class="py-3 pr-4 font-semibold" style="color:' + corDaMedia(mGeral) + '">' + formatarMedia(mGeral) + '</td>' +
        '<td class="py-3 pr-4 font-semibold" style="color:' + corDaMedia(mAuto) + '">' + formatarMedia(mAuto) + '</td>' +
        '<td class="py-3 text-right text-gp-blue text-xs font-medium sem-pdf">Ver respostas →</td>' +
      '</tr>';
  }).join('');

  $('sem-participantes').hidden = lista.length > 0;
}

function abrirDetalhe(cpf) {
  var pessoa = participantes().filter(function (p) { return p.cpf === cpf; })[0];
  if (!pessoa) return;

  $('detalhe-cpf').textContent = pessoa.cpf;

  $('detalhe-corpo').innerHTML =
    '<p class="text-sm text-neutral-400 mb-6">Enviada em ' + escapar(pessoa.quando) +
      ' · média dada <strong style="color:' + corDaMedia(mediaDoParticipante(pessoa, numerosComNota())) + '">' +
      formatarMedia(mediaDoParticipante(pessoa, numerosComNota())) + '</strong></p>' +
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

var TITULOS_ABAS = {
  geral: 'Visão geral',
  perguntas: 'Resultados por pergunta',
  abertas: 'Respostas abertas',
  participantes: 'Participantes'
};

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
  var colunas = ['CPF', 'Data/Hora'];
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
    return [p.cpf, p.quando].concat(chaves.map(function (k) { return p.respostas[k]; })).map(celula).join(';');
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

/** Exporta a aba aberta. Comentários recolhidos são abertos para sair no PDF. */
function exportarPdf() {
  var elemento = $('relatorio');
  var detalhes = elemento.querySelectorAll('details');
  var semPdf = elemento.querySelectorAll('.sem-pdf');
  var estadoAnterior = [];
  var i;

  for (i = 0; i < detalhes.length; i++) {
    estadoAnterior.push(detalhes[i].open);
    detalhes[i].open = true;
  }
  for (i = 0; i < semPdf.length; i++) semPdf[i].style.display = 'none';

  var hoje = new Date();
  $('pdf-subtitulo').textContent = TITULOS_ABAS[abaAtual] + ' · Grupo Paraná · Confidencial';
  $('pdf-rodape').textContent = 'Emitido em ' + hoje.toLocaleDateString('pt-BR') +
    ' · ' + participantes().length + ' avaliações';
  $('cabecalho-pdf').hidden = false;

  html2pdf().set({
    margin: [12, 10, 14, 10],
    filename: 'avaliacao-super-fm-' + abaAtual + '-' + hoje.toISOString().slice(0, 10) + '.pdf',
    image: { type: 'jpeg', quality: 0.95 },
    html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['css', 'legacy'], avoid: ['.evitar-quebra'] }
  }).from(elemento).save().then(function () {
    $('cabecalho-pdf').hidden = true;
    for (var j = 0; j < detalhes.length; j++) detalhes[j].open = estadoAnterior[j];
    for (var k = 0; k < semPdf.length; k++) semPdf[k].style.display = '';
  });
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
