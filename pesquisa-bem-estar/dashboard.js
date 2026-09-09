/**
 * Dashboard da Pesquisa de Bem-Estar - Grupo Paraná
 *
 * Consome apenas dados agregados do Apps Script. As perguntas e opções vêm
 * da constante PERGUNTAS de script.js, para não duplicar os textos.
 */

var dadosAtuais = null;

function carregarDados() {
  document.getElementById('carregando').hidden = false;
  document.getElementById('conteudo').hidden = true;
  document.getElementById('erro').hidden = true;

  enviarAoServidor({ action: 'getAllData' })
    .then(function (dados) {
      if (dados.error) throw new Error(dados.error);
      dadosAtuais = dados;
      renderizar(dados);
    })
    .catch(function (falha) {
      document.getElementById('carregando').hidden = true;
      document.getElementById('erro').hidden = false;
      document.getElementById('erro-detalhe').textContent =
        'Verifique sua conexão e tente novamente. (' + falha.message + ')';
      desenharIcones();
    });
}

function renderizar(dados) {
  var total = dados.total || 0;

  document.getElementById('kpi-total').textContent = total;
  document.getElementById('kpi-media').textContent = String(dados.q3.media).replace('.', ',');

  var histograma = dados.q3.histograma || [];
  var respondentesEscala = histograma.reduce(function (soma, n) { return soma + n; }, 0);
  var altos = histograma.slice(7).reduce(function (soma, n) { return soma + n; }, 0);
  document.getElementById('kpi-alta').textContent =
    respondentesEscala ? Math.round(altos / respondentesEscala * 100) : 0;

  var secoes = document.getElementById('secoes');
  secoes.innerHTML = PERGUNTAS.map(function (pergunta, indice) {
    return pergunta.tipo === 'escala'
      ? secaoEscala(pergunta, indice, dados)
      : secaoMultipla(pergunta, indice, dados, total);
  }).join('');

  document.getElementById('carregando').hidden = true;
  document.getElementById('conteudo').hidden = false;
  desenharIcones();
}

function cabecalhoSecao(pergunta, indice) {
  // O título tem <strong>; no dashboard queremos o texto simples.
  var titulo = pergunta.titulo.replace(/<[^>]+>/g, '');

  return '<div class="flex items-start gap-3 mb-6">' +
      '<span class="w-8 h-8 rounded-full bg-gp-blue text-white text-sm font-semibold flex items-center justify-center shrink-0">' +
        (indice + 1) +
      '</span>' +
      '<h2 class="text-lg font-semibold tracking-tight leading-snug pt-1">' + titulo + '</h2>' +
    '</div>';
}

function secaoMultipla(pergunta, indice, dados, total) {
  var contagens = dados[pergunta.id] || {};

  // Ordena da opção mais marcada para a menos.
  var linhas = Object.keys(contagens).map(function (opcao) {
    return { opcao: opcao, quantidade: contagens[opcao] };
  }).sort(function (a, b) { return b.quantidade - a.quantidade; });

  var maximo = linhas.length ? Math.max.apply(null, linhas.map(function (l) { return l.quantidade; })) : 0;

  var barras = linhas.map(function (linha) {
    var percentual = total ? Math.round(linha.quantidade / total * 100) : 0;
    var largura = maximo ? (linha.quantidade / maximo * 100) : 0;
    var destaque = linha.quantidade === maximo && maximo > 0;

    return '<div class="mb-4">' +
        '<div class="flex items-baseline justify-between gap-4 mb-1.5">' +
          '<span class="text-sm text-neutral-700 leading-snug">' + escapar(linha.opcao) + '</span>' +
          '<span class="text-sm font-semibold shrink-0 ' + (destaque ? 'text-gp-blue' : 'text-neutral-400') + '">' +
            linha.quantidade + ' <span class="font-normal text-neutral-300">(' + percentual + '%)</span>' +
          '</span>' +
        '</div>' +
        '<div class="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">' +
          '<div class="h-full rounded-full transition-all duration-700" ' +
               'style="width:' + largura + '%;background-color:' + (destaque ? '#004AC9' : '#7EA6E8') + '"></div>' +
        '</div>' +
      '</div>';
  }).join('');

  return '<section class="bg-white rounded-2xl border border-neutral-150 p-6 md:p-8">' +
      cabecalhoSecao(pergunta, indice) +
      (linhas.length ? barras : '<p class="text-sm text-neutral-400">Sem respostas ainda.</p>') +
      blocoOutros(dados[pergunta.id + 'Outros'] || []) +
    '</section>';
}

function secaoEscala(pergunta, indice, dados) {
  var histograma = dados.q3.histograma || [];
  var maximo = Math.max.apply(null, histograma.concat([1]));
  var totalEscala = histograma.reduce(function (soma, n) { return soma + n; }, 0);

  var colunas = histograma.map(function (quantidade, nota) {
    var altura = Math.round(quantidade / maximo * 100);
    var percentual = totalEscala ? Math.round(quantidade / totalEscala * 100) : 0;

    return '<div class="flex flex-col items-center gap-2 flex-1">' +
        '<span class="text-xs font-semibold text-neutral-400">' + quantidade + '</span>' +
        '<div class="w-full bg-neutral-100 rounded-lg relative" style="height:140px">' +
          '<div class="absolute bottom-0 w-full rounded-lg transition-all duration-700" ' +
               'style="height:' + altura + '%;background-color:' + CORES_ESCALA[nota] + '" ' +
               'title="' + percentual + '% das respostas"></div>' +
        '</div>' +
        '<span class="text-sm font-semibold" style="color:' + CORES_ESCALA[nota] + '">' + nota + '</span>' +
      '</div>';
  }).join('');

  return '<section class="bg-white rounded-2xl border border-neutral-150 p-6 md:p-8">' +
      cabecalhoSecao(pergunta, indice) +
      '<div class="flex items-end gap-1.5 md:gap-2.5">' + colunas + '</div>' +
      '<div class="flex justify-between mt-3 text-xs text-neutral-400 font-medium">' +
        '<span>Não interferem</span><span>Interferem muito</span>' +
      '</div>' +
      '<div class="mt-6 pt-5 border-t border-neutral-100 flex items-center gap-2.5">' +
        '<i class="w-4 h-4 text-gp-blue" data-lucide="trending-up"></i>' +
        '<span class="text-sm text-neutral-500">Média geral: ' +
          '<strong class="text-gp-blue">' + String(dados.q3.media).replace('.', ',') + '</strong> de 10</span>' +
      '</div>' +
    '</section>';
}

function blocoOutros(outros) {
  if (!outros.length) return '';

  var itens = outros.map(function (texto) {
    return '<li class="text-sm text-neutral-600 leading-relaxed border-l-2 border-gp-light pl-3 py-1">' +
      escapar(texto) + '</li>';
  }).join('');

  return '<details class="mt-6 pt-5 border-t border-neutral-100 group">' +
      '<summary class="flex items-center gap-2 cursor-pointer text-sm font-medium text-gp-blue list-none">' +
        '<i class="w-4 h-4 transition-transform group-open:rotate-90" data-lucide="chevron-right"></i>' +
        'Respostas em "Outro" (' + outros.length + ')' +
      '</summary>' +
      '<ul class="space-y-2 mt-4">' + itens + '</ul>' +
    '</details>';
}

function exportarPdf() {
  var elemento = document.getElementById('relatorio');
  var detalhes = elemento.querySelectorAll('details');
  var estadoAnterior = [];
  var i;

  // Abre os blocos "Outro" para que apareçam no PDF.
  for (i = 0; i < detalhes.length; i++) {
    estadoAnterior.push(detalhes[i].open);
    detalhes[i].open = true;
  }

  html2pdf().set({
    margin: 10,
    filename: 'pesquisa-bem-estar-' + new Date().toISOString().slice(0, 10) + '.pdf',
    image: { type: 'jpeg', quality: 0.95 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  }).from(elemento).save().then(function () {
    for (var j = 0; j < detalhes.length; j++) detalhes[j].open = estadoAnterior[j];
  });
}

document.addEventListener('DOMContentLoaded', carregarDados);
