# Super FM | Meu Programa em 2027

Questionário **identificado** (nome e programa) com 3 perguntas abertas: o que cada locutor
precisa **manter**, **melhorar** e **criar** no seu programa em 2027. É a etapa seguinte da
Avaliação Interna da Super FM, que era anônima. Esta não é, e a
página diz isso logo no início, antes de a pessoa escrever.

- **Formulário:** https://grupo-parana-cr.github.io/formularios-gp/super-fm-programa-2027/
- **Respostas (Diretoria):** https://grupo-parana-cr.github.io/formularios-gp/super-fm-programa-2027/dashboard.html
- **Planilha:** https://docs.google.com/spreadsheets/d/1KPE1TCp7M0ZdtDFXDf883j_u_96SQ7y6lm4f7hihdLA/edit
- **Apps Script:** https://script.google.com/d/1wSITex3ckfYFTuel8aX_8N2ogciXqTcw4pKUobrWHnV0ybteWlXbjXTz/edit
- **Deployment:** `AKfycbzZvLMOTsI8atQZ0YM0Y9uxGdGFuC-coYy28tptrZuueWcfJxG82hEoZ62US-AciR1--g`

## Arquivos

| Arquivo | Papel |
|---|---|
| `index.html` | formulário numa tela só: nome, programa e as 3 perguntas |
| `script.js` | perguntas (`PERGUNTAS`), validação e envio — **fonte única dos textos** |
| `styles.css` | complementos ao Tailwind e o layout do PDF (`@media print`) |
| `dashboard.html` / `dashboard.js` | respostas por pessoa e por pergunta, busca, CSV e PDF |
| `apps-script.gs` | cópia versionada do backend (`backend/Code.js` é o que o clasp envia) |

Todos os campos são obrigatórios. O rascunho fica em `sessionStorage` (some ao fechar a aba,
para o próximo colega no computador do estúdio não ver o texto do anterior).

## Planilha

Aba `Respostas`: `Data/hora`, `Nome`, `Programa`, e uma coluna por pergunta. As colunas vivem
em `COLUNAS` (`apps-script.gs`) e `PERGUNTAS` (`script.js`) — precisam continuar iguais.

Quem enviar mais de uma vez aparece com todos os envios no dashboard, marcados como "envio
mais recente" / "envio anterior". Nada é descartado; a Diretoria decide qual vale.

## Dashboard e PDF

- **Por pessoa:** o plano de cada locutor, em ordem alfabética.
- **Por pergunta:** tudo o que a equipe respondeu em "manter", depois "melhorar", depois "criar".
- **PDF:** capa com a lista de quem respondeu e, em seguida, **uma folha por pessoa**. A leitura
  por pergunta não vai para o papel, porque repetiria os mesmos textos.

## Primeira configuração (no editor do Apps Script)

Abra o editor logado como `isaque.barbosa@gparana.com.br` e execute, nesta ordem:

1. `setup()` — autoriza o script e cria a aba. **Sem isso o formulário não funciona.**
2. `gerarAcessoDashboard()` — devolve usuário (`diretoria`) e senha. Copie: não aparece de novo.
3. `instalarAquecimento()` — evita a espera de ~25s na primeira chamada. Rode
   `removerAquecimento()` ao encerrar.

`limparDados()` apaga as respostas de teste antes de divulgar.

## Publicar uma alteração no backend

```bash
cp apps-script.gs backend/Code.js
cd backend
npx @google/clasp push
npx @google/clasp deploy --deploymentId AKfycbzZvLMOTsI8atQZ0YM0Y9uxGdGFuC-coYy28tptrZuueWcfJxG82hEoZ62US-AciR1--g
```
