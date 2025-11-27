# 📊 Sistema de Metas 2025 - Grupo Paraná

## 🎯 Resumo do Projeto

Sistema completo de atualização de metas 2025 com:
- **Página central** de seleção de departamentos
- **Auto-save automático** a cada mudança
- **Sincronização em tempo real** com Google Sheets
- **Carregamento automático** de dados anteriores
- **Identificação única** por usuário/líder
- **Backup local** em caso de falha de conexão

---

## 📂 Estrutura de Arquivos

```
metas-2025/
├── index.html                          # Página central (seleção de departamentos)
├── metas-app.js                        # Script unificado (auto-save + sincronização)
├── google-apps-script.js               # Backend Google Apps Script
├── metas-agricultura-2025.html         # ✅ Página Agricultura
├── metas-autopecas-2025.html          # ✅ Página Autopecas
├── metas-compras-2025.html            # ✅ Página Compras
├── metas-contabil-fiscal-2025.html    # ✅ Página Contabil/Fiscal
├── metas-csc-2025.html                # ✅ Página CSC
├── metas-dp-2025.html                 # ✅ Página DP
├── metas-frigorifico-2025.html        # ✅ Página Frigorífico
├── metas-imobiliaria-2025.html        # ✅ Página Imobiliária
├── metas-marketing-2025.html          # ✅ Página Marketing
├── metas-pecuaria-2025.html           # ✅ Página Pecuária
├── metas-pedreira-2025.html           # ✅ Página Pedreira
├── metas-radio-2025.html              # ✅ Página Rádio
├── metas-rh-2025.html                 # ✅ Página RH
└── metas-ti-2025.html                 # ✅ Página TI
```

---

## 🚀 CONFIGURAÇÃO - PASSO A PASSO

### **PASSO 1: Criar Planilha Google Sheets**

1. Acesse [Google Sheets](https://sheets.google.com)
2. Crie uma nova planilha
3. Nomeie como "Metas 2025 - Grupo Paraná"
4. **Copie o ID** da URL:
   ```
   https://docs.google.com/spreadsheets/d/SEU_ID_AQUI/edit
   ```

### **PASSO 2: Configurar Google Apps Script**

1. Acesse [Google Apps Script](https://script.google.com)
2. Crie um novo projeto
3. Cole o conteúdo de `google-apps-script.js`
4. **Linha 17**, substitua:
   ```javascript
   const SPREADSHEET_ID = 'SEU_ID_DA_PLANILHA_AQUI';
   ```
   Pelo ID copiado no Passo 1

5. Clique em **Salvar** (ícone de disquete)
6. Execute **testSave** para testar:
   - Clique em "Executar"
   - Selecione a função "testSave"
   - Autorize as permissões na primeira vez
7. Verifique a planilha do Google Sheets - deve haver uma linha de teste

### **PASSO 3: Publicar como Web App**

1. No Apps Script, clique em **Implantar** > **Nova implantação**
2. Clique no ícone ⚙️ (Tipo de implantação)
3. Selecione **Aplicativo da Web**
4. Configure:
   - **Descrição**: "API Metas 2025"
   - **Executar como**: Sua conta Google
   - **Quem tem acesso**: Qualquer pessoa
5. Clique em **Implantar**
6. **COPIE a URL** que aparece (muito importante!)
   - Formato: `https://script.google.com/macros/s/XXXXX/exec`

### **PASSO 4: Configurar Arquivos HTML**

1. Abra `metas-app.js`
2. **Linha 12**, cole a URL:
   ```javascript
   const GOOGLE_SCRIPT_URL = 'COLE_A_URL_AQUI';
   ```

3. Salve o arquivo

### **PASSO 5: Upload no GitHub**

1. Crie um repositório "metas-2025"
2. Faça upload de **TODOS** os arquivos:
   - index.html
   - metas-app.js
   - google-apps-script.js
   - Todos os metas-*.html
3. Vá em **Settings** > **Pages**
4. Selecione `main` branch e `/ (root)`
5. Clique **Save**

Seu sistema estará em:
```
https://seu-usuario.github.io/metas-2025/
```

---

## 📖 COMO USAR

### **Para o Líder de Departamento:**

1. Acesse a URL do GitHub Pages
2. Clique no seu departamento
3. **Preencha as metas** (os dados são salvos automaticamente)
4. Se voltar depois, **seus dados estarão lá** (carregamento automático)
5. Faça as alterações necessárias - elas se salvam sozinhas

### **Como Funciona o Auto-Save:**

- ✅ **Cada vez que você muda** um campo (input, select, textarea)
- ⏳ **Aguarda 500ms** sem mudanças
- 💾 **Salva automaticamente** no Google Sheets
- 💻 **Se falhar**, salva no **navegador como backup**
- 🔄 **Ao voltar**, carrega seus dados anteriores automaticamente

---

## 🔍 ESTRUTURA DE DADOS NO GOOGLE SHEETS

A planilha terá as seguintes **colunas base**:

| userId | timestamp | department | lastUpdated | campo1 | campo2 | campo3 | ... |
|--------|-----------|-----------|-------------|--------|--------|--------|-----|
| USER_xxx | 2025-01-15T... | Agricultura | 2025-01-20T... | valor | valor | valor | ... |
| USER_yyy | 2025-01-16T... | Tecnologia | 2025-01-18T... | valor | valor | valor | ... |

**Explicação:**
- **userId**: ID único do líder (gerado automaticamente)
- **timestamp**: Data/hora da primeira resposta
- **department**: Nome do departamento
- **lastUpdated**: Data/hora da última atualização
- **campo1, campo2, etc**: Todos os campos do formulário (dinâmicos)

---

## 🔑 FUNCIONALIDADES PRINCIPAIS

### **1. Identificação Automática de Usuário**

```javascript
// Gerado na primeira vez e salvo no localStorage
const userId = 'USER_1234567890_abc123xyz'
```

Cada líder tem um ID único, permitindo que:
- Seus dados sejam recuperados automaticamente
- Seja fácil identificar quem atualizou as metas
- Seja possível editar dados anteriores

### **2. Auto-Save com Debounce**

```javascript
triggerAutoSave()  // Dispara após qualquer mudança
// Aguarda 500ms de inatividade
// Depois salva automaticamente
```

Benefícios:
- ✅ Não perde dados se fechar acidentalmente
- ✅ Não sobrecarrega o servidor com muitas requisições
- ✅ Salva no navegador como backup

### **3. Sincronização Bidirecional**

```
Google Sheets ←→ Navegador (localStorage)
```

Se Google Sheets cair:
- Sistema usa backup local
- Dados não são perdidos
- Sincroniza novamente quando Google Sheets voltar

---

## 📋 MAPEAMENTO DE DEPARTAMENTOS

| Departamento | Líder | Arquivo HTML |
|-------------|-------|--------------|
| 🌾 Agricultura | Kleber | metas-agricultura-2025.html |
| 🔧 Autopecas | Fernando | metas-autopecas-2025.html |
| 📦 Compras | Patricia | metas-compras-2025.html |
| 💰 Contabil/Fiscal | Elizane | metas-contabil-fiscal-2025.html |
| 🏭 CSC | Anderson | metas-csc-2025.html |
| 👥 DP | Solange | metas-dp-2025.html |
| 🥩 Frigorífico | Helton | metas-frigorifico-2025.html |
| 🏢 Imobiliária | Luciano | metas-imobiliaria-2025.html |
| 📢 Marketing | Elizandra | metas-marketing-2025.html |
| 🐄 Pecuária | João | metas-pecuaria-2025.html |
| ⛏️ Pedreira | Douglas | metas-pedreira-2025.html |
| 📻 Rádio | Elizandra | metas-radio-2025.html |
| 💼 RH | Ana | metas-rh-2025.html |
| 💻 TI | Isaque | metas-ti-2025.html |

---

## 🔧 MODIFICAÇÕES NOS ARQUIVOS HTML ORIGINAIS

Para integrar cada arquivo HTML original com o sistema:

### **Adicionar no `<head>`:**

```html
<script src="metas-app.js"></script>
```

### **Adicionar no `<body>` (antes de </body>):**

```html
<button onclick="goBackToHome()" style="position: fixed; top: 20px; left: 20px; 
    padding: 10px 20px; background: #667eea; color: white; border: none; 
    border-radius: 5px; cursor: pointer; z-index: 1000;">
    ← Voltar para Home
</button>
```

**Pronto!** O arquivo agora terá:
- ✅ Auto-save automático
- ✅ Sincronização com Google Sheets
- ✅ Carregamento automático de dados
- ✅ Botão para voltar à página inicial

---

## 🐛 SOLUÇÃO DE PROBLEMAS

### **Problema: Dados não salvam**

**Solução:**
1. Verifique se a URL do Google Apps Script está correta em `metas-app.js`
2. Verifique o Console (F12) para mensagens de erro
3. Dados estão sendo salvos no navegador (localStorage) como backup

### **Problema: "Erro ao salvar"**

**Solução:**
1. Verifique se Google Apps Script foi publicado corretamente
2. Verifique permissões: deve ser "Qualquer pessoa"
3. Tente novamente - sistema usa backup automático

### **Problema: Dados não carregam ao voltar**

**Solução:**
1. Verifique localStorage:
   - Abra DevTools (F12)
   - Vá em "Application" > "Local Storage"
   - Procure por chaves começando com "metas_"

2. Se não houver dados:
   - Primeira vez que acessa
   - Google Sheets ainda não foi populada
   - Preencha um campo e salve

### **Problema: "SEU_ID_AQUI" ainda está no código**

**Solução:**
Você provavelmente não completou o Passo 3 ou 4 de configuração.

---

## 📊 RELATÓRIOS E ANÁLISE

### **Como Acessar os Dados**

1. Abra a planilha do Google Sheets
2. Todos os dados estarão na aba "Respostas"
3. Crie gráficos e relatórios conforme necessário

### **Exemplos de Análise**

```javascript
// Obter todos os dados (para admin)
// URL: GOOGLE_SCRIPT_URL?action=getAllData

// Obter dados de um usuário específico
// URL: GOOGLE_SCRIPT_URL?action=getData&userId=USER_123
```

---

## 🚨 CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Criar planilha Google Sheets
- [ ] Copiar ID da planilha
- [ ] Criar Google Apps Script
- [ ] Colar ID da planilha em google-apps-script.js
- [ ] Publicar como Web App
- [ ] Copiar URL da Web App
- [ ] Colar URL em metas-app.js
- [ ] Testar função testSave()
- [ ] Verificar planilha (deve ter linha de teste)
- [ ] Fazer upload em GitHub
- [ ] Testar acesso via GitHub Pages
- [ ] Testar preenchimento de formulário
- [ ] Verificar auto-save
- [ ] Fechar e reabrir para verificar carregamento automático

---

## 📞 SUPORTE

Se encontrar problemas:

1. **Console do Navegador** (F12):
   - Verifique mensagens de erro
   - Copie o erro completo

2. **Envie:**
   - Print do erro
   - Qual navegador está usando
   - Qual departamento testou
   - URL do GitHub Pages que está usando

3. **Dados de Teste:**
   - Google Apps Script tem função `testSave()`
   - Use para testar antes de abrir para os líderes

---

## ✅ SUCESSO!

Seu sistema está pronto quando:

✓ Acessa a home (index.html)
✓ Clica num departamento
✓ Abre o formulário da meta
✓ Preenche alguns campos
✓ Vê "Salvo com sucesso" no canto da tela
✓ Fecha a página
✓ Volta e dados estão lá
✓ Google Sheets mostra os dados na aba "Respostas"

---

**Desenvolvido com ❤️ para Grupo Paraná - Inova GP**
