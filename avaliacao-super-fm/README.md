# Avaliação Interna | Rádio Super FM

Avaliação interna da equipe sobre a Rádio Super FM: 51 perguntas em 10 seções.

- **Formulário:** https://grupo-parana-cr.github.io/formularios-gp/avaliacao-super-fm/
- **Resultados:** https://grupo-parana-cr.github.io/formularios-gp/avaliacao-super-fm/dashboard.html

**Avaliação anônima.** Não pede nome nem CPF e não grava nada que identifique quem
respondeu. Qualquer alteração precisa preservar isso — o formulário promete anonimato:

- a planilha guarda só a **data** (sem horário: com ele, daria para cruzar com quem estava
  no computador naquele momento);
- cada resposta entra numa **linha aleatória** da aba, para a ordem não revelar quem enviou
  primeiro;
- o rascunho fica em `sessionStorage` (some ao fechar a aba), para o próximo colega no
  computador compartilhado do estúdio não ver respostas alheias;
- no dashboard as avaliações aparecem como "Avaliação #1, #2…", números só de tela.

Sem identificação, **não há como impedir que a mesma pessoa responda duas vezes**. O que
existe é proteção contra envio duplicado por falha de conexão: o navegador manda um
`envioId` aleatório, que o servidor guarda só no cache por 6h (não vai para a planilha).

## Arquivos

| Arquivo | Papel |
|---|---|
| `index.html` | formulário: capa e uma etapa por seção |
| `script.js` | perguntas (`SECOES`), validação e envio — **fonte única dos textos** |
| `styles.css` | complementos ao Tailwind |
| `dashboard.html` / `dashboard.js` | resultados: visão geral, por pergunta, respostas abertas e mapa por participante; exporta CSV e PDF (pela impressão do navegador — o layout do papel está no `@media print` de `styles.css`) |
| `apps-script.gs` | cópia versionada do backend que roda no Apps Script |

Sem build step: HTML/CSS/JS estático, servido pelo GitHub Pages. Tailwind, Lucide,
Plus Jakarta Sans e html2pdf vêm de CDN.

## Perguntas

- **Escala 1 a 5** (1 Muito ruim · 2 Ruim · 3 Regular · 4 Bom · 5 Excelente): obrigatórias.
- **Abertas**: opcionais.
- **P16**: nota obrigatória + comentário opcional.

O formulário guarda um rascunho na aba (`sessionStorage`) enquanto a pessoa responde e apaga
ao enviar — são ~15 minutos, e perder tudo num recarregamento faria desistir.

## Planilha

Aba `Respostas`: `Data`, uma coluna por pergunta (`P1 (1-5)`, `P5 (aberta)`…) e
`P16 - Comentario`. 53 colunas. Se o script encontrar uma aba `Respostas` com outro
cabeçalho (a versão de teste que tinha CPF), ele a renomeia para
`Teste antigo (com CPF) - apagar` e cria uma nova.

Os tipos das perguntas vivem em **dois** lugares que precisam continuar iguais:

1. `SECOES`, em `script.js`;
2. `TIPOS`, no topo de `apps-script.gs` (uma letra por pergunta: `e` escala, `a` aberta,
   `c` escala + comentário).

⚠️ Alterar ou reordenar perguntas depois de já haver respostas quebra a leitura das colunas.
Nesse caso, arquive a planilha e comece uma nova.

## Backend (Apps Script)

Script *container-bound* na planilha. Só `doPost`, com roteamento por `action`:

```jsonc
{ "action": "ping" }                                  → { "ok": true }
{ "action": "submit", "envioId": "...", "respostas": { "p1": 4, "p5": "...", "p16c": "..." } }
                                                      → { "success": bool, "message": "..." }
{ "action": "getAllData", "usuario": "...", "senha": "..." }
                                                      → { "total": n, "participantes": [...] }
```

- **CORS:** o `fetch` vai **sem** header `Content-Type` (vira `text/plain` e evita o
  preflight `OPTIONS`, que o Apps Script não responde).
- **Envio idempotente:** reenviar o mesmo `envioId` devolve sucesso em vez de duplicar —
  cobre o caso em que o Apps Script grava mas a resposta se perde no caminho.
- Texto que começa com `=`, `+`, `-` ou `@` é gravado com apóstrofo, para o Sheets não
  interpretar como fórmula.

### Primeira configuração (no editor do Apps Script)

Execute, nesta ordem, e aceite a autorização do Google:

1. `setup()` — cria a aba e autoriza o script. **Sem isso o formulário não funciona.**
2. `gerarAcessoDashboard()` — devolve usuário (`diretoria`) e senha do dashboard. Copie:
   a senha não é exibida de novo. Rodar de novo troca a senha.
3. `instalarAquecimento()` — gatilho a cada 5 min para o script não "esfriar" (sem ele a
   primeira chamada leva ~25s). Rode `removerAquecimento()` ao encerrar a avaliação.

`limparDados()` apaga as respostas de teste antes de divulgar. Fica só no editor de
propósito: como endpoint, qualquer um apagaria tudo.

### Publicar uma alteração no backend

```bash
cd backend
npx @google/clasp push
npx @google/clasp deploy --deploymentId <ID_ATUAL>   # mantém a mesma URL /exec
```

Sem `--deploymentId`, a URL `/exec` muda e precisa ser trocada em `script.js`.

## Acesso ao dashboard

A validação é **no servidor**: sem usuário e senha válidos o `getAllData` não devolve nada.
A senha fica em `PropertiesService`, nunca no código — o repositório é público. Enquanto
ninguém rodar `gerarAcessoDashboard()`, o dashboard fica fechado. `revogarAcessoDashboard()`
fecha para todos.

## Leitura dos resultados

A **autoavaliação (seção 9) fica fora da "média da rádio"**, dos rankings e da seção mais
bem avaliada: é cada pessoa dando nota a si mesma, e misturada às demais tomava o topo dos
pontos fortes. Ela aparece à parte e no comparativo com a seção 8.

Cada pergunta é classificada por **critério fixo** (`CRITERIO` em `dashboard.js`), não em
comparação com as outras — um ranking relativo chamava de "atenção" perguntas com média 4,4:

- **ponto forte:** média 4 ou mais;
- **ponto de atenção:** média abaixo de 3, ou 25% ou mais das notas sendo 1 ou 2;
- **intermediária:** o resto.

Sem nada em atenção, o dashboard diz isso em vez de montar uma lista. A seção de menor
média só é chamada de "mais crítica" quando ela mesma cai nesses critérios.

"Positivo" = notas 4 e 5; "negativo" = 1 e 2. "Opinião dividida" lista as perguntas com
maior desvio padrão (a partir de 3 avaliações). Com menos de 5 avaliações o dashboard avisa
que as médias ainda são instáveis.
