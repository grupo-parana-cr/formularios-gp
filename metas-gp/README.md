# 📊 Sistema de Metas 2025 - Grupo Paraná

## ⚡ Início Rápido

Este é um sistema completo de atualização de metas com **auto-save automático** e **sincronização em tempo real** com Google Sheets.

### **3 Passos para Começar:**

#### **1️⃣ Criar Ambiente no Google**

```bash
→ Acesse Google Sheets
→ Crie uma planilha "Metas 2025 - Grupo Paraná"
→ Copie o ID: https://docs.google.com/spreadsheets/d/SEU_ID_AQUI/edit

→ Acesse Google Apps Script: https://script.google.com
→ Novo projeto
→ Cole o conteúdo de: google-apps-script.js
→ Linha 17: Substitua SEU_ID_DA_PLANILHA_AQUI pelo ID copiado
→ Salve e execute função testSave()
→ Implantar > Nova implantação > Aplicativo da Web
→ Configure: Executar como: Você | Quem tem acesso: Qualquer pessoa
→ Copie a URL gerada
```

#### **2️⃣ Configurar Arquivos**

```bash
→ Abra metas-app.js
→ Linha 12: Cole a URL do Google Apps Script
→ Salve
```

#### **3️⃣ Integrar Arquivos HTML**

Adicione em **CADA** arquivo metas-*.html:

```html
<!-- No <head>, antes de </head>: -->
<script src="metas-app.js"></script>

<!-- No <body>, logo após <body>: -->
<button onclick="goBackToHome()" style="position: fixed; top: 20px; left: 20px; 
    padding: 12px 24px; background: #667eea; color: white; border: none; 
    border-radius: 8px; cursor: pointer; z-index: 9999; font-weight: 600;">
    ← Voltar para Home
</button>
```

✅ **Pronto!** Sistema funcionando.

---

## 📂 Arquivos do Projeto

### **Essenciais**

| Arquivo | Descrição |
|---------|-----------|
| `index.html` | Página inicial (seleção de departamentos) |
| `metas-app.js` | **CRÍTICO**: Script unificado de auto-save |
| `google-apps-script.js` | Backend (Deploy no Google Apps Script) |

### **Departamentos (14 arquivos)**

Todos originais, apenas 2 adições cada:

```
metas-agricultura-2025.html
metas-autopecas-2025.html
metas-compras-2025.html
metas-contabil-fiscal-2025.html
metas-csc-2025.html
metas-dp-2025.html
metas-frigorifico-2025.html
metas-imobiliaria-2025.html
metas-marketing-2025.html
metas-pecuaria-2025.html
metas-pedreira-2025.html
metas-radio-2025.html
metas-rh-2025.html
metas-ti-2025.html
```

### **Documentação**

```
GUIA-CONFIGURACAO.md    ← Configuração detalhada
INTEGRACAO-HTML.md      ← Como integrar HTML
MAPEAMENTO.md          ← Visão geral completa
README.md              ← Este arquivo
```

---

## 🎯 Como Funciona

### **Usuário Final (Líder de Departamento)**

```
1. Acessa: https://seu-usuario.github.io/metas-2025/
2. Clica em seu departamento
3. Preenche os formulários
4. ✅ Dados salvam automaticamente
5. Pode voltar depois - dados estão lá
```

### **Sistema (Nos Bastidores)**

```
Usuário digita algo
    ↓
Sistema detecta mudança
    ↓
Aguarda 500ms (para não sobrecarregar)
    ↓
Envia para Google Sheets automaticamente
    ↓
Google Sheets salva
    ↓
Mostra confirmação "✅ Salvo"
    ↓
Se falhar, usa backup local
```

---

## 🔑 Características Principais

✅ **Auto-Save Automático**
- Salva a cada mudança
- Sem clicar botão
- Confirmação visual

✅ **Sincronização em Tempo Real**
- Google Sheets sempre atualizado
- Dados acessíveis para relatórios
- Histórico completo

✅ **Carregamento Automático**
- Abre e dados já estão lá
- Sem perder informações
- Continua de onde parou

✅ **Backup Local**
- Se Google Sheets cair, não perde dados
- Sincroniza automaticamente quando voltar
- Sem ação do usuário

✅ **Identificação Automática**
- Cada líder tem ID único
- Não precisa fazer login
- Fácil gerenciar múltiplos usuários

---

## 📊 Fluxo de Dados

```
Navegador (HTML)
    ↓
metas-app.js (Auto-save)
    ↓
Google Apps Script (API)
    ↓
Google Sheets (Banco de dados)
    ↓
localStorage (Backup local)
```

---

## 🧪 Teste Básico

1. Abra `index.html`
2. Clique em "Agricultura"
3. Preencha um campo (ex: "0" em um número)
4. Aguarde 1 segundo
5. Veja "✅ Salvo com sucesso" aparecer
6. Recarregue a página (F5)
7. Dado deve estar lá ✓

Se isso funcionar, **tudo está correto** ✅

---

## 🐛 Problemas Comuns

| Problema | Solução |
|----------|---------|
| "Arquivo não encontrado" | metas-app.js está no mesmo diretório? |
| "Erro ao salvar" | URL do Google Apps Script está correta? |
| Dados não carregam | Google Sheets foi criada? ID está correto? |
| Botão "Voltar" não aparece | Adicionou o `<button>` no `<body>`? |

---

## 📈 Próximos Passos

1. **Configurar** (Semana 1)
   - [ ] Google Sheets + Apps Script
   - [ ] URL configurada em metas-app.js

2. **Integrar** (Semana 2)
   - [ ] Modificar 14 arquivos HTML
   - [ ] Upload em GitHub Pages

3. **Testar** (Semana 3)
   - [ ] Teste cada departamento
   - [ ] Verifique Google Sheets
   - [ ] Teste múltiplos usuários

4. **Lançar** (Semana 4)
   - [ ] Comunicar aos líderes
   - [ ] Fornecer URL
   - [ ] Suporte inicial

---

## 📞 Suporte

### **Verifique Primeiro:**

1. Console do Navegador (F12)
   - Procure por erros em vermelho
   - Copie o erro

2. Verifique:
   - [ ] Google Apps Script publicado?
   - [ ] URL está em metas-app.js?
   - [ ] Todos os 14 arquivos foram modificados?

### **Se Encontrar Erro:**

1. Tome print do erro
2. Note qual navegador usou
3. Qual departamento estava testando
4. Se é primeira vez ou segunda

---

## 💡 Dicas Importantes

- **NÃO** mude layout ou estilos originais
- **MANTENHA** a estrutura HTML intacta
- **SÓ ADICIONE** o script e botão
- **TESTE** localmente antes de subir
- **TODOS** os inputs funcionam automaticamente

---

## 🚀 Deploy Final

### **GitHub Pages**

```bash
1. Crie repositório "metas-2025"
2. Faça upload de TODOS os arquivos
3. Settings > Pages > Select main branch
4. Acesse: https://seu-usuario.github.io/metas-2025/
```

### **Compartilhar com Líderes**

Envie a URL:
```
https://seu-usuario.github.io/metas-2025/
```

Instrua-os:
1. Clique em seu departamento
2. Preencha os formulários
3. Dados salvam automaticamente
4. Se sair e voltar depois, dados estarão lá

---

## 📚 Documentação Completa

Para informações detalhadas, consulte:

- **GUIA-CONFIGURACAO.md** - Passo a passo completo
- **INTEGRACAO-HTML.md** - Como modificar HTML
- **MAPEAMENTO.md** - Visão geral técnica completa

---

## ✅ Checklist de Implementação

- [ ] Google Sheets criada
- [ ] Google Apps Script publicado
- [ ] metas-app.js com URL correta
- [ ] Todos os 14 HTML modificados
- [ ] index.html testado
- [ ] Auto-save testado
- [ ] Carregamento de dados testado
- [ ] GitHub Pages ativada
- [ ] URL pública funciona
- [ ] Líderes notificados
- [ ] Suporte disponível

---

## 🎉 Status

- ✅ index.html - Pronto
- ✅ metas-app.js - Pronto
- ✅ google-apps-script.js - Pronto
- ✅ Documentação - Pronta
- ⏳ Integração HTML - Sua responsabilidade (simples!)
- ⏳ Deploy GitHub - Sua responsabilidade
- ⏳ Treinamento líderes - Sua responsabilidade

---

## 📧 Resumo para Apresentar

> "Criei um sistema onde cada líder acessa uma página central, seleciona seu departamento e preenche as metas. Tudo é salvo automaticamente no Google Sheets em tempo real. Se um líder volta depois, seus dados já estão carregados. Se falhar a internet, salva no navegador. Zero botões de salvar, zero emails pedindo planilha. Tudo centralizado, tudo rastreado."

---

**Desenvolvido para Grupo Paraná - Inova GP 2025**

Qualquer dúvida, consulte os guias detalhados ou revise o console do navegador (F12).
