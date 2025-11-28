# 🚀 GUIA OBJETIVO - SISTEMA DE METAS 2025

## 📦 ARQUIVOS QUE VOCÊ TEM:

1. **index.html** - Página home com 14 cards
2. **style.css** - Estilos e design responsivo
3. **script.js** - Lógica, auto-save e sincronização
4. **google-apps-script.js** - Backend para Google Sheets

---

## ⚙️ CONFIGURAÇÃO OBRIGATÓRIA:

### 1️⃣ Google Sheets (criar planilha)

1. Acesse: https://sheets.google.com
2. Crie planilha: "Metas 2025 - Grupo Paraná"
3. Copie o ID da URL: `https://docs.google.com/spreadsheets/d/**SEU_ID_AQUI**/edit`
4. Guarde esse ID

### 2️⃣ Google Apps Script (backend)

1. Acesse: https://script.google.com
2. Novo projeto
3. **Cole TODO o conteúdo de `google-apps-script.js`**
4. Na linha 8, substitua:
   ```javascript
   const SPREADSHEET_ID = 'SEU_ID_AQUI'; // Cole aqui o ID da sua planilha
   ```
5. Salve (Ctrl+S)
6. Execute a função `testSave()` para validar
7. Autorize quando pedir permissões
8. Verifique se uma linha apareceu em sua planilha do Google Sheets

### 3️⃣ Publicar Google Apps Script como Web App

1. Clique em **"Implantar"** → **"Nova implantação"** → **"Aplicativo da Web"**
2. Configurações:
   - Execute como: **Sua conta**
   - Quem tem acesso: **Qualquer pessoa**
3. Clique **"Implantar"**
4. Copie a URL gerada (algo como: `https://script.google.com/macros/s/...`)
5. Guarde essa URL

### 4️⃣ Configurar script.js

1. Abra `script.js` (arquivo local)
2. Na linha 8, substitua:
   ```javascript
   const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/SEU_ID_AQUI/exec';
   ```
   **Cole a URL que você copiou no passo anterior**
3. Salve

---

## 📤 COMO SUBIR NO GITHUB:

### 1️⃣ Preparar arquivos

Você tem:
- ✅ `index.html`
- ✅ `style.css`
- ✅ `script.js`
- ✅ `google-apps-script.js` (para referência, opcional subir)

Você PRECISA de:
- ✅ Seus 14 arquivos HTML originais (metas-agricultura-2025.html, etc)

**Em cada um dos 14 HTMLs, adicione:**

```html
<!-- Logo após <body> -->
<button onclick="goBackToHome()" style="position: fixed; top: 20px; left: 20px; 
padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
color: white; border: none; border-radius: 8px; cursor: pointer; z-index: 9999; 
font-weight: 600; font-size: 1em; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
← Voltar para Home
</button>
```

**Use Find & Replace para remover valores:**
- Find: `value="0"` → Replace: (vazio)
- Find: `selected` → Replace: (vazio)
- Find: `value="2025-` → Replace: (vazio)
- Find: `onclick="exportToCSV()` → Replace: (vazio)

### 2️⃣ Criar repositório no GitHub

1. Acesse: https://github.com/new
2. Nome: `metas-2025`
3. Descrição: "Sistema de Metas 2025 - Grupo Paraná"
4. ☑ Public
5. Create repository

### 3️⃣ Subir arquivos

No repositório vazio:
1. Clique **"Add file"** → **"Upload files"**
2. Selecione/arraste:
   - ✅ index.html
   - ✅ style.css
   - ✅ script.js
   - ✅ metas-agricultura-2025.html (modificado)
   - ✅ metas-autopecas-2025.html (modificado)
   - ... (todos os 14 HTMLs, modificados)
3. Mensagem: "Sistema de metas 2025"
4. Commit changes

### 4️⃣ Ativar GitHub Pages

1. No repositório, vá em **Settings**
2. No menu esquerdo, clique **Pages**
3. Source: **Deploy from a branch**
4. Branch: **main** / **(root)**
5. Aguarde 2-3 minutos

Sua URL será: `https://seu-usuario.github.io/metas-2025/`

---

## ✅ TESTAR

1. Abra: `https://seu-usuario.github.io/metas-2025/`
2. Vê 14 cards? ✅
3. Clica em departamento, abre formulário? ✅
4. Botão "← Voltar para Home" aparece? ✅
5. Preenche campo, auto-save funciona? ✅
6. Fecha e reabre, dados ainda estão lá? ✅

---

## 📋 ESTRUTURA FINAL

```
metas-2025/ (seu repositório GitHub)
├── index.html                    ← Home page
├── style.css                     ← Estilos
├── script.js                     ← Lógica
├── metas-agricultura-2025.html   ← Modificado
├── metas-autopecas-2025.html     ← Modificado
├── ... (14 HTMLs, todos modificados)
└── metas-ti-2025.html            ← Modificado
```

---

## 🔑 CHAVES IMPORTANTES

**Guarde:**
- ID da planilha Google Sheets
- URL do Google Apps Script publicado
- URL do repositório GitHub

**Configure:**
- `script.js` → linha 8 com URL do Google Apps Script
- `google-apps-script.js` → linha 8 com ID da planilha

---

## 🆘 SE NÃO FUNCIONAR

**Erro 404 ao clicar em meta?**
→ Verifique se `script.js` está no mesmo diretório

**Dados não salvam em Google Sheets?**
→ Verifique se `GOOGLE_SCRIPT_URL` em `script.js` está correto
→ Execute `testSave()` no Google Apps Script

**Botão "Voltar" não aparece?**
→ Verifique se foi adicionado logo após `<body>` nos 14 HTMLs

---

## ⏱️ TEMPO ESTIMADO

Configurar Google: 10 minutos
Modificar 14 HTMLs: 15 minutos (com Find & Replace)
Subir GitHub: 5 minutos
Ativar Pages: 2 minutos
Teste: 5 minutos

**TOTAL: 37 minutos**

---

Desenvolvido para Grupo Paraná - Inova GP 2025
