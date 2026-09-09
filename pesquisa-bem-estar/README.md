# Pesquisa | Bem-Estar e Fatores de Preocupação

Pesquisa interna e **anônima** do Grupo Paraná sobre situações que têm gerado preocupação,
pressão ou desgaste na rotina dos colaboradores.

- **Formulário:** https://grupo-parana-cr.github.io/formularios-gp/pesquisa-bem-estar/
- **Resultados:** https://grupo-parana-cr.github.io/formularios-gp/pesquisa-bem-estar/dashboard.html

A pesquisa não tem finalidade de diagnóstico. Serve para identificar oportunidades de
cuidado e orientação.

## Arquivos

| Arquivo | Papel |
|---|---|
| `index.html` | formulário, em etapas |
| `script.js` | perguntas, validação e envio — **fonte única dos textos das perguntas** |
| `styles.css` | complementos ao Tailwind |
| `dashboard.html` / `dashboard.js` | resultados agregados |
| `apps-script.gs` | cópia versionada do backend que roda no Apps Script |

Sem build step: HTML/CSS/JS estático, servido direto pelo GitHub Pages. Tailwind, Lucide,
Plus Jakarta Sans e html2pdf vêm de CDN.

## Como as respostas são guardadas

Planilha do Google com duas abas **separadas de propósito**:

- **`Respostas`** — `Data`, as opções marcadas de cada pergunta e os textos de "Outro".
  Nada aqui identifica quem respondeu.
- **`Controle`** — apenas `Hash` do CPF e `Data/Hora`. Serve só para impedir que a mesma
  pessoa responda duas vezes.

### Anonimato

O CPF é digitado pelo colaborador, viaja até o Apps Script e é usado **apenas** para gerar um
hash SHA-256 com um salt secreto. **O CPF nunca é gravado.**

Três cuidados sustentam isso:

1. O salt fica em `PropertiesService` (propriedades do script), **nunca no código** — este
   repositório é público, e um hash de CPF sem salt seria quebrado por força bruta em minutos.
   Ele é gerado sozinho na primeira execução.
2. Hash e respostas ficam em **abas diferentes**, sem chave ligando uma à outra.
3. Cada resposta é gravada em uma **linha aleatória** da aba `Respostas`, e não no fim — assim
   a ordem das respostas não corresponde à ordem dos hashes na aba `Controle`.

O dashboard recebe **somente números agregados**; linhas individuais nunca saem do servidor.

## Backend (Apps Script)

Script *container-bound* na planilha. Só `doPost`, com roteamento por `action`:

```jsonc
{ "action": "checkCPF", "cpf": "..." }        → { "exists": bool, "valid": bool }
{ "action": "submit", "cpf": "...", "q1": [...], "q1Outro": "", ... }
                                              → { "success": bool, "message": "..." }
{ "action": "getAllData" }                    → contagens por opção, histograma e média
```

Detalhes que importam:

- **CORS:** o `fetch` é enviado **sem** header `Content-Type`. O navegador aplica
  `text/plain`, o que evita o preflight `OPTIONS` — que o Apps Script não sabe responder.
  Não use `mode: 'no-cors'`: a resposta JSON precisa ser lida.
- **Validação no servidor:** cada opção recebida precisa constar da lista canônica no topo do
  `.gs`; o que não constar é descartado. Sem isso, um POST manual injetaria categorias falsas
  no dashboard.
- `LockService` serializa as escritas concorrentes.

### Publicar uma alteração no backend

```bash
cd backend
npx @google/clasp push
npx @google/clasp deploy --deploymentId <ID_ATUAL>   # mantém a mesma URL /exec
```

Reimplantar **sem** `--deploymentId` gera uma URL nova, que precisaria ser atualizada em
`script.js` e `dashboard.js`.

## Alterar as perguntas

Os textos vivem em **dois** lugares que precisam continuar iguais:

1. `PERGUNTAS`, no topo de `script.js` (front-end e dashboard leem daqui);
2. `OPCOES`, no topo de `apps-script.gs` (validação no servidor).

Se uma opção existir só no front, o servidor a descarta silenciosamente.

⚠️ Alterar ou reordenar perguntas **depois** de já haver respostas quebra a leitura das
colunas na aba `Respostas`. Nesse caso, arquive a planilha e comece uma nova.
