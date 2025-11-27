# 📊 MAPEAMENTO COMPLETO - SISTEMA DE METAS 2025

## 🎯 Visão Geral do Projeto

**Objetivo:** Sistema centralizado onde 14 líderes de departamento atualizam suas metas 2025 com auto-save e sincronização automática com Google Sheets.

**Status:** ✅ Pronto para Implementação

---

## 📁 ARQUITETURA DO SISTEMA

```
┌─────────────────────────────────────────────────────────────┐
│                     PÁGINA CENTRAL                          │
│                    index.html                               │
│         (Seleção de 14 Departamentos)                      │
└────────────┬──────────────────────────────────────────────┘
             │
    ┌────────┴───────────────────────────┬─────────────────┐
    │                                    │                 │
    ▼                                    ▼                 ▼
┌────────────────┐  ┌────────────────┐  ... ┌────────────────┐
│  Agricultura   │  │  Autopecas     │      │      TI        │
│  metas-*.html  │  │  metas-*.html  │      │  metas-*.html  │
└────────────────┘  └────────────────┘      └────────────────┘
    │                    │                        │
    └────────┬───────────┴────────────────────────┘
             │
             ▼
    ┌─────────────────────┐
    │  metas-app.js       │
    │  - Auto-save        │
    │  - Sincronização    │
    │  - Carregamento     │
    └──────────┬──────────┘
               │
               ▼
    ┌──────────────────────────┐
    │  Google Sheets API       │
    │  (Google Apps Script)    │
    │  - Receber dados         │
    │  - Salvar em Sheets      │
    │  - Recuperar dados       │
    └──────────┬───────────────┘
               │
               ▼
    ┌──────────────────────────┐
    │  GOOGLE SHEETS           │
    │  Aba: "Respostas"        │
    │  - 14 departamentos      │
    │  - Histórico completo    │
    └──────────────────────────┘
```

---

## 📋 ARQUIVOS DO PROJETO

### **ARQUIVOS PRINCIPAIS (Obrigatórios)**

| Arquivo | Descrição | Criador |
|---------|-----------|---------|
| `index.html` | Página central de seleção | ✅ Claude |
| `metas-app.js` | Script unificado (auto-save) | ✅ Claude |
| `google-apps-script.js` | Backend (Google Apps Script) | ✅ Claude |
| `GUIA-CONFIGURACAO.md` | Guia completo de setup | ✅ Claude |
| `INTEGRACAO-HTML.md` | Como integrar HTML original | ✅ Claude |
| `MAPEAMENTO.md` | Este arquivo | ✅ Claude |

### **ARQUIVOS DE DEPARTAMENTOS (14 no Total)**

Todos originais, apenas 2 adições em cada:

```
1. metas-agricultura-2025.html      → Líder: Kleber
2. metas-autopecas-2025.html        → Líder: Fernando
3. metas-compras-2025.html          → Líder: Patricia
4. metas-contabil-fiscal-2025.html  → Líder: Elizane
5. metas-csc-2025.html              → Líder: Anderson
6. metas-dp-2025.html               → Líder: Solange
7. metas-frigorifico-2025.html      → Líder: Helton
8. metas-imobiliaria-2025.html      → Líder: Luciano
9. metas-marketing-2025.html        → Líder: Elizandra
10. metas-pecuaria-2025.html        → Líder: João
11. metas-pedreira-2025.html        → Líder: Douglas
12. metas-radio-2025.html           → Líder: Elizandra
13. metas-rh-2025.html              → Líder: Ana
14. metas-ti-2025.html              → Líder: Isaque
```

---

## 🔄 FLUXO DE DADOS

### **Fluxo 1: Preencher Formulário**

```
Usuário Abre index.html
    ↓
Seleciona "Agricultura"
    ↓
Carrega metas-agricultura-2025.html
    ↓
Sistema carrega dados ANTERIORES (auto)
    ↓
Usuário preenche/edita campos
    ↓
metas-app.js detecta mudança
    ↓
Aguarda 500ms (debounce)
    ↓
Envia para Google Apps Script (POST)
    ↓
Google Apps Script salva em Google Sheets
    ↓
Volta confirmar ✅ Salvo com sucesso
    ↓
Também salva no localStorage (backup)
```

### **Fluxo 2: Recarregar Dados**

```
Usuário abre metas-agricultura-2025.html
    ↓
metas-app.js gera/recupera userId
    ↓
Solicita dados ao Google Apps Script (GET)
    ↓
Se conseguir resposta: popula formulário com dados
    ↓
Se falhar: tenta localStorage
    ↓
Se localStorage: usa backup local
    ↓
Formulário pronto para edição
```

---

## 🔧 FUNÇÕES COMPARTILHADAS

Todas disponíveis em `metas-app.js`:

### **Salvamento Automático**
```javascript
triggerAutoSave()      // Dispara save automático
saveDataToSheets()     // Envia para Google Sheets
saveLocalBackup()      // Salva no navegador
```

### **Carregamento de Dados**
```javascript
loadDataFromSheets()   // Tenta carregador do Sheets
loadLocalBackup()      // Carrega do navegador
populateFormWithData() // Preenche formulário
```

### **Utilidades**
```javascript
generateUserIdIfNotExists()  // Cria ID único
getUserId()                  // Recupera ID do usuário
collectFormData()           // Coleta dados do form
updateSyncStatus()          // Mostra status
toggleMeta()               // Abre/fecha meta
goBackToHome()             // Volta para index.html
```

---

## 📊 ESTRUTURA GOOGLE SHEETS

### **Planilha: "Metas 2025 - Grupo Paraná"**

#### **Aba 1: "Respostas"**

| userId | timestamp | department | lastUpdated | ... campos dinâmicos ... |
|--------|-----------|-----------|-------------|-----|
| USER_123... | 2025-01-15T10:30:00Z | Agricultura | 2025-01-20T14:25:00Z | ... |
| USER_456... | 2025-01-16T09:15:00Z | TI | 2025-01-18T11:45:00Z | ... |

**Explicação das Colunas:**
- **userId**: ID único gerado automaticamente no navegador
- **timestamp**: Data/hora da PRIMEIRA submissão
- **department**: Nome do departamento
- **lastUpdated**: Data/hora da ÚLTIMA edição
- **Colunas dinâmicas**: Todos os campos do formulário HTML (acidentesOcup1, reducao2, etc.)

---

## 👥 MATRIZ DE RESPONSABILIDADES

### **Líderes de Departamento**

| Líder | Departamento | Responsabilidade |
|-------|-------------|-----------------|
| Kleber | Agricultura | Preenchimento e atualização de metas de agricultura |
| Fernando | Autopecas | Preenchimento e atualização de metas de autopecas |
| Patricia | Compras | Preenchimento e atualização de metas de compras |
| Elizane | Contabil/Fiscal | Preenchimento e atualização de metas contábil/fiscal |
| Anderson | CSC | Preenchimento e atualização de metas CSC |
| Solange | DP | Preenchimento e atualização de metas de desenvolvimento de pessoas |
| Helton | Frigorífico | Preenchimento e atualização de metas de frigorífico |
| Luciano | Imobiliária | Preenchimento e atualização de metas imobiliária |
| Elizandra | Marketing | Preenchimento e atualização de metas de marketing |
| João | Pecuária | Preenchimento e atualização de metas de pecuária |
| Douglas | Pedreira | Preenchimento e atualização de metas de pedreira |
| Elizandra | Rádio | Preenchimento e atualização de metas de rádio |
| Ana | RH | Preenchimento e atualização de metas de RH |
| Isaque | TI | Preenchimento e atualização de metas de TI |

### **Responsáveis por Implementação**

| Pessoa | Tarefa |
|--------|--------|
| Você (Isaque) | Configurar Google Sheets + Apps Script + GitHub Pages |
| Diretora | Validar layout e layout permanece igual ✓ |
| Líderes | Usar o sistema quando disponibilizar |

---

## 🎯 COMO O SISTEMA FUNCIONA NA PRÁTICA

### **Cenário 1: Primeira Vez - Kleber (Agricultura)**

```
1. Kleber acessa index.html
   └─ Vê 14 departamentos listados

2. Clica em "Agricultura"
   └─ Abre metas-agricultura-2025.html
   └─ Sistema gera userId = "USER_1234567890_abc123xyz"
   └─ Tenta carregar dados anteriores (primeira vez = vazio)

3. Kleber preenche a Meta 1:
   - Campo: acidentesOcup1 = 0
   └─ metas-app.js detecta mudança
   └─ Aguarda 500ms
   └─ Envia para Google Apps Script
   └─ Google Apps Script salva em Sheets
   └─ Mostra "✅ Salvo com sucesso"

4. Kleber preenche Meta 2:
   - Campo: reducao2 = 5.3
   └─ Mesmo processo (auto-save)

5. Kleber clica "Voltar" ou fecha a página
   └─ Dados já estão salvos em Google Sheets
   └─ Dados também no navegador (backup local)
```

### **Cenário 2: Segunda Vez - Kleber Volta**

```
1. Kleber acessa index.html
   └─ Vê 14 departamentos

2. Clica em "Agricultura" NOVAMENTE
   └─ Abre metas-agricultura-2025.html
   └─ Sistema recupera userId = "USER_1234567890_abc123xyz" (do localStorage)
   └─ Solicita dados do Google Apps Script
   └─ Google Apps Script busca na Sheets
   └─ Encontra linha com userId = "USER_1234567890_abc123xyz"
   └─ Retorna: acidentesOcup1 = 0, reducao2 = 5.3, ...
   └─ Popula AUTOMÁTICO todos os campos com valores anteriores

3. Kleber vê seus dados já preenchidos ✓
   └─ Edita o que precisa
   └─ Auto-save funciona normalmente
```

### **Cenário 3: Isaque (TI) Verifica Progresso**

```
1. Isaque acessa Google Sheets
   └─ Abre aba "Respostas"
   └─ Vê linha do Kleber (userId, timestamp, department, lastUpdated, dados...)
   └─ Vê linha de Fernando (Autopecas)
   └─ Vê linha de Patricia (Compras)
   └─ ... todas as 14 submissões

2. Isaque pode:
   ✓ Ver quando cada um atualizou (lastUpdated)
   ✓ Clonar dados para análise
   ✓ Criar gráficos
   ✓ Exportar relatórios
```

---

## 🔐 SEGURANÇA E DADOS

### **Geração de ID**

```javascript
// Na primeira visita:
const newId = 'USER_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
// Resultado: USER_1234567890123_abc123xyz

// Salvo em localStorage:
localStorage.setItem('metas_user_id', newId);

// Recuperado em visitas futuras:
const existingId = localStorage.getItem('metas_user_id');
```

**Implicações:**
- ✅ Cada líder tem ID único
- ✅ ID é persistente (mesmo navegador = mesmo ID)
- ✅ Fácil identificar quem atualizou
- ⚠️ Se limpar localStorage, novo ID será gerado

### **Backup Local**

```javascript
// Além de salvar em Sheets, também salva no navegador:
localStorage.setItem('metas_backup_USER_123...', JSON.stringify(data));

// Se Google Sheets cair:
// Sistema usa dados do localStorage
// Não perde nada
```

---

## 📈 FLUXO DE IMPLEMENTAÇÃO

### **Semana 1: Preparação**

- [ ] Criar Google Sheets "Metas 2025 - Grupo Paraná"
- [ ] Copiar ID da planilha
- [ ] Criar Google Apps Script
- [ ] Configurar google-apps-script.js
- [ ] Publicar como Web App
- [ ] Copiar URL da API

### **Semana 2: Integração**

- [ ] Configurar metas-app.js com URL da API
- [ ] Modificar todos os 14 arquivos HTML
- [ ] Testar cada arquivo localmente
- [ ] Criar repositório GitHub "metas-2025"
- [ ] Fazer upload de todos os arquivos

### **Semana 3: Deploy**

- [ ] Ativar GitHub Pages
- [ ] Testar acesso pela URL pública
- [ ] Testar auto-save com Google Sheets
- [ ] Testar carregamento de dados salvos
- [ ] Documentar bugs encontrados

### **Semana 4: Treinamento**

- [ ] Reunião com líderes
- [ ] Demonstração do sistema
- [ ] Entregar URL do GitHub Pages
- [ ] Acompanhar primeiras atualizações
- [ ] Suporte técnico

---

## 🧪 TESTE DE ACEITAÇÃO

### **Testes Básicos**

- [ ] Abrir index.html - mostra 14 departamentos
- [ ] Clicar em Agricultura - abre formulário
- [ ] Preencher campo - mostra "Salvando..."
- [ ] Aguardar - mostra "✅ Salvo com sucesso"
- [ ] Voltar para Home - botão funciona
- [ ] Reabrir Agricultura - dados estão lá
- [ ] Verificar Google Sheets - dados aparecem

### **Testes Avançados**

- [ ] Fechar navegador e reabrir - dados persistem
- [ ] Limpar cache - ID é recuperado do localStorage
- [ ] Desconectar internet - backup local salva
- [ ] Reconectar internet - sincroniza com Sheets
- [ ] Editar mesmo campo 3x - salva corretamente
- [ ] Múltiplos departamentos - dados não se misturam
- [ ] Múltiplos usuários (incógnito) - IDs diferentes

---

## 📞 CONTATOS E SUPORTE

### **Em Caso de Problemas:**

1. **Verifique Console** (F12 > Console)
2. **Procure por erros** em vermelho
3. **Teste localmente** antes de GitHub
4. **Verifique se:**
   - [ ] Google Apps Script foi publicado
   - [ ] URL está correta em metas-app.js
   - [ ] Todos os 14 HTML foram modificados
   - [ ] metas-app.js está no mesmo diretório

---

## ✅ CHECKLIST FINAL

Antes de liberar para os líderes:

- [ ] Google Sheets criada e funcionando
- [ ] Google Apps Script publicado
- [ ] metas-app.js configurado com URL correta
- [ ] Todos os 14 arquivos HTML modificados
- [ ] index.html funcionando
- [ ] Auto-save testado e funcionando
- [ ] Carregamento de dados testado
- [ ] GitHub Pages ativada
- [ ] URL funciona publicamente
- [ ] Documentação completa
- [ ] Líderes recebem instruções
- [ ] Suporte disponível

---

## 🎉 RESULTADO FINAL

### **O Que os Líderes Verão:**

1. **Acesso Fácil:**
   ```
   https://seu-usuario.github.io/metas-2025/
   ```

2. **Página Inicial Clara:**
   - 14 cards com seus departamentos
   - Cores diferentes para cada um
   - Nomes de líderes
   - Status da atualização

3. **Preenchimento Automático:**
   - Abrem formulário
   - Dados anteriores já lá
   - Apenas editam o que mudou

4. **Auto-Save Invisível:**
   - Não veem complexidade
   - Apenas veem "Salvo"
   - Paz de espírito

5. **Edição Fácil:**
   - Volta sempre que precisa
   - Dados estão lá
   - Continua de onde parou

---

## 📚 DOCUMENTAÇÃO FORNECIDA

1. **GUIA-CONFIGURACAO.md** ← Para configuração inicial
2. **INTEGRACAO-HTML.md** ← Para modificar HTML
3. **MAPEAMENTO.md** ← Este arquivo (visão geral)

---

**Projeto Status: ✅ Pronto para Produção**

**Desenvolvido para Grupo Paraná - Inova GP 2025**

*Última atualização: Janeiro 2025*
