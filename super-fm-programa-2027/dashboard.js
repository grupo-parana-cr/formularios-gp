/**
 * Dashboard do "Meu programa em 2027" - Super FM, Grupo Paraná
 *
 * O Apps Script devolve as respostas só com credenciais válidas. Duas
 * leituras: por pessoa (o plano de cada locutor) e por pergunta (o que a
 * equipe toda disse sobre manter, melhorar e criar). As perguntas vêm de
 * PERGUNTAS, em script.js, para não duplicar os textos.
 */

var dadosAtuais = null;

/* ------------------------------------------------------------------ */
/* Acesso                                                              */
/* ------------------------------------------------------------------ */

/**
 * As credenciais ficam só na aba aberta (sessionStorage) e são conferidas no
 * servidor a cada chamada. Nada de senha no código: este repositório é
 * público, e qualquer pessoa leria o arquivo.
 */
var CHAVE_ACESSO = 'acesso-super-fm-2027';
var credenciaisEmMemoria = null;

function acessoAtual() {
  try {
    var guardado = sessionStorage.getItem(CHAVE_ACESSO);
    if (guardado) return JSON.parse(guardado);
  } catch (erro) { /* armazenamento bloqueado */ }
  return credenciaisEmMemoria;
}

function guardarCredenciais(usuario, senha) {
  credenciaisEmMemoria = { usuario: usuario, senha: senha };
  try {
    sessionStorage.setItem(CHAVE_ACESSO, JSON.stringify(credenciaisEmMemoria));
  } catch (erro) { /* segue só em memória */ }
}

function esquecerCredenciais() {
  credenciaisEmMemoria = null;
  try { sessionStorage.removeItem(CHAVE_ACESSO); } catch (erro) {}
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
/* Dados                                                               */
/* ------------------------------------------------------------------ */

/** "dd/MM/yyyy HH:mm" -> número comparável. */
function instante(quando) {
  var m = /^(\d{2})\/(\d{2})\/(\d{4})(?: (\d{2}):(\d{2}))?/.exec(quando || '');
  if (!m) return 0;
  return new Date(+m[3], +m[2] - 1, +m[1], +(m[4] || 0), +(m[5] || 0)).getTime();
}

function normalizar(texto) {
  return String(texto || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Respostas em ordem alfabética de nome. Quem enviou mais de uma vez aparece
 * com todos os envios (do mais recente ao mais antigo), marcados como tal:
 * a Diretoria decide qual vale, nada é descartado em silêncio.
 */
function respostas() {
  var lista = ((dadosAtuais && dadosAtuais.respostas) || []).slice();

  var envios = {};
  lista.forEach(function (r) {
    var chave = normalizar(r.nome);
    envios[chave] = (envios[chave] || 0) + 1;
  });

  lista.sort(function (a, b) {
    var porNome = a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' });
    return porNome || instante(b.quando) - instante(a.quando);
  });

  var vistos = {};
  return lista.map(function (r, i) {
    var chave = normalizar(r.nome);
    vistos[chave] = (vistos[chave] || 0) + 1;
    return {
      id: i,
      nome: r.nome,
      programa: r.programa,
      quando: r.quando,
      manter: r.manter,
      melhorar: r.melhorar,
      criar: r.criar,
      totalEnvios: envios[chave],
      maisRecente: vistos[chave] === 1
    };
  });
}

function filtradas() {
  var busca = normalizar($('busca').value);
  return respostas().filter(function (r) {
    if (!busca) return true;
    return normalizar(r.nome + ' ' + r.programa + ' ' + r.manter + ' ' + r.melhorar + ' ' + r.criar).indexOf(busca) !== -1;
  });
}

/* ------------------------------------------------------------------ */
/* Renderização                                                        */
/* ------------------------------------------------------------------ */

function renderizar() {
  $('carregando').hidden = true;
  $('conteudo').hidden = false;

  var lista = respostas();
  var pessoas = {};
  var programas = {};
  lista.forEach(function (r) {
    pessoas[normalizar(r.nome)] = true;
    programas[normalizar(r.programa)] = true;
  });

  $('kpi-pessoas').textContent = Object.keys(pessoas).length;
  $('kpi-programas').textContent = Object.keys(programas).length;
  var ultima = lista.reduce(function (maior, r) { return instante(r.quando) > instante(maior) ? r.quando : maior; }, '');
  $('kpi-ultima').textContent = ultima || '–';

  renderizarPessoas();
  renderizarPerguntas();
  renderizarIndice();
  desenharIcones();
}

function blocoTexto(texto) {
  return '<p class="text-[15px] text-neutral-700 leading-relaxed whitespace-pre-line">' + escapar(texto) + '</p>';
}

function seloRepetido(r) {
  if (r.totalEnvios < 2) return '';
  return '<span class="inline-block text-[11px] font-medium px-2 py-0.5 rounded-full ' +
    (r.maisRecente ? 'bg-gp-light text-gp-dark' : 'bg-neutral-100 text-neutral-500') + ' whitespace-nowrap">' +
    (r.maisRecente ? 'envio mais recente' : 'envio anterior') + ' · respondeu ' + r.totalEnvios + ' vezes</span>';
}

/** O plano de uma pessoa. No PDF, cada um ocupa sua própria folha. */
function cartaoPessoa(r) {
  return '<article class="folha-pessoa bg-white rounded-2xl border border-neutral-150 p-6 md:p-8">' +
      '<div class="evitar-quebra">' +
        '<div class="flex items-start justify-between gap-4 flex-wrap pb-4 mb-1 border-b border-neutral-100">' +
          '<div>' +
            '<h2 class="text-xl font-semibold tracking-tight leading-snug">' + escapar(r.nome) + '</h2>' +
            '<p class="text-sm text-gp-blue font-medium mt-0.5">' + escapar(r.programa) + '</p>' +
          '</div>' +
          '<div class="text-right">' +
            '<p class="text-xs text-neutral-400">Enviado em ' + escapar(r.quando) + '</p>' +
            (r.totalEnvios > 1 ? '<div class="mt-1">' + seloRepetido(r) + '</div>' : '') +
          '</div>' +
        '</div>' +
      '</div>' +
      PERGUNTAS.map(function (p, i) {
        return '<div class="pt-5">' +
            '<div class="evitar-quebra">' +
              '<h3 class="text-sm font-semibold text-gp-blue mb-2">' + (i + 1) + '. ' + escapar(p.titulo) + '</h3>' +
            '</div>' +
            blocoTexto(r[p.chave]) +
          '</div>';
      }).join('') +
    '</article>';
}

function renderizarPessoas() {
  var lista = filtradas();
  $('lista-pessoas').innerHTML = lista.length
    ? lista.map(cartaoPessoa).join('')
    : '<p class="text-sm text-neutral-400 text-center py-10">' + (respostas().length ? 'Nada encontrado.' : 'Ninguém respondeu ainda.') + '</p>';
}

/** O que a equipe toda respondeu em cada pergunta, com o nome de quem escreveu. */
function renderizarPerguntas() {
  var lista = filtradas();

  $('lista-perguntas').innerHTML = PERGUNTAS.map(function (p, i) {
    return '<section class="bg-white rounded-2xl border border-neutral-150 p-6 md:p-8">' +
        '<div class="mb-2">' +
          '<h2 class="text-lg font-semibold tracking-tight leading-snug"><span class="text-gp-blue">' + (i + 1) + '.</span> ' + escapar(p.titulo) + '</h2>' +
          '<p class="text-sm text-neutral-400 mt-1">' + escapar(p.texto) + '</p>' +
        '</div>' +
        (lista.length
          ? '<ul>' + lista.map(function (r) {
              return '<li class="py-4 border-b border-neutral-100 last:border-b-0">' +
                  '<p class="text-xs font-semibold text-neutral-500 mb-1.5">' + escapar(r.nome) +
                    ' <span class="font-normal text-neutral-400">· ' + escapar(r.programa) + '</span></p>' +
                  blocoTexto(r[p.chave]) +
                '</li>';
            }).join('') + '</ul>'
          : '<p class="text-sm text-neutral-400 py-4">Nada encontrado.</p>') +
      '</section>';
  }).join('');
}

/** Sumário da primeira folha do PDF: quem respondeu e qual programa. */
function renderizarIndice() {
  var lista = respostas();
  $('pdf-indice').innerHTML = lista.length
    ? '<table class="w-full text-sm">' +
        '<thead><tr class="text-left text-xs text-neutral-400 border-b border-neutral-200">' +
          '<th class="py-2 pr-3 font-medium">Nome</th><th class="py-2 pr-3 font-medium">Programa</th><th class="py-2 font-medium text-right">Enviado em</th>' +
        '</tr></thead>' +
        '<tbody>' + lista.map(function (r) {
          return '<tr class="border-b border-neutral-100">' +
              '<td class="py-2 pr-3 font-medium">' + escapar(r.nome) + (r.totalEnvios > 1 && !r.maisRecente ? ' <span class="text-neutral-400 font-normal">(envio anterior)</span>' : '') + '</td>' +
              '<td class="py-2 pr-3 text-neutral-600">' + escapar(r.programa) + '</td>' +
              '<td class="py-2 text-right text-neutral-400 tabular-nums">' + escapar(r.quando) + '</td>' +
            '</tr>';
        }).join('') + '</tbody>' +
      '</table>'
    : '<p class="text-sm text-neutral-400">Ninguém respondeu ainda.</p>';
}

/* ------------------------------------------------------------------ */
/* Abas e exportação                                                   */
/* ------------------------------------------------------------------ */

function abrirAba(qual) {
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

/** CSV com uma linha por resposta: abre direto no Excel (separador ;). */
function exportarCsv() {
  var colunas = ['Nome', 'Programa', 'Enviado em'].concat(PERGUNTAS.map(function (p) { return p.titulo; }));

  function celula(valor) {
    return '"' + String(valor == null ? '' : valor).replace(/"/g, '""') + '"';
  }

  var linhas = [colunas.map(celula).join(';')].concat(respostas().map(function (r) {
    return [r.nome, r.programa, r.quando].concat(PERGUNTAS.map(function (p) { return r[p.chave]; })).map(celula).join(';');
  }));

  // BOM para o Excel reconhecer UTF-8 e não estragar os acentos.
  var blob = new Blob(['﻿' + linhas.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  var link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'super-fm-meu-programa-2027-' + new Date().toISOString().slice(0, 10) + '.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(function () { URL.revokeObjectURL(link.href); }, 1000);
}

/**
 * Relatório em PDF pela impressão do navegador ("Salvar como PDF"): capa com
 * a lista de quem respondeu e, depois, o plano de cada pessoa numa folha.
 * A leitura "por pergunta" não vai para o papel -- repetiria o mesmo texto.
 * O layout de impressão fica no @media print de styles.css.
 */
function exportarPdf() {
  var busca = $('busca').value;

  // O relatório sai completo, sem a busca que estiver aplicada na tela.
  $('busca').value = '';
  renderizarPessoas();

  var hoje = new Date();
  $('pdf-rodape').textContent = 'Emitido em ' + hoje.toLocaleDateString('pt-BR') +
    ' · ' + respostas().length + (respostas().length === 1 ? ' resposta' : ' respostas') + ' · Uso interno da Diretoria';

  // O título vira o nome sugerido do arquivo no "Salvar como PDF".
  var tituloOriginal = document.title;
  document.title = 'super-fm-meu-programa-2027-' + hoje.toISOString().slice(0, 10);

  var restaurado = false;
  function restaurar() {
    if (restaurado) return;
    restaurado = true;
    document.title = tituloOriginal;
    $('busca').value = busca;
    renderizarPessoas();
  }

  window.addEventListener('afterprint', restaurar, { once: true });
  window.print();
  // Alguns navegadores não disparam afterprint; print() bloqueia até fechar.
  setTimeout(restaurar, 1000);
}

function aoBuscar() {
  renderizarPessoas();
  renderizarPerguntas();
}

/* ------------------------------------------------------------------ */
/* Inicialização                                                       */
/* ------------------------------------------------------------------ */

document.addEventListener('DOMContentLoaded', function () {
  desenharIcones();
  abrirAba('pessoas');

  // Acorda o Apps Script enquanto a pessoa digita a senha.
  enviarAoServidor({ action: 'ping' }).catch(function () {});

  if (acessoAtual()) {
    carregarDados();
  } else {
    mostrarLogin();
  }

  $('senha').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') entrar();
  });
});
