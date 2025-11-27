# 🔧 INTEGRAÇÃO DOS ARQUIVOS HTML

## Como Integrar Cada Arquivo HTML Original ao Sistema

Os arquivos HTML originais (`metas-*.html`) já têm toda a estrutura visual e lógica. Você precisa apenas fazer pequenas modificações para integrar com o sistema unificado de auto-save.

---

## 📝 INSTRUÇÕES - APLIQUE EM TODOS OS 14 ARQUIVOS

### **PASSO 1: Adicionar Script Unificado no `<head>`**

Encontre `</head>` no arquivo e **ANTES** dele, adicione:

```html
    </style>
    <!-- ⬇️ ADICIONE ESTA LINHA ⬇️ -->
    <script src="metas-app.js"></script>
</head>
```

**Exemplo:** Se o arquivo tem:
```html
        }
    </style>
</head>
```

Fica:
```html
        }
    </style>
    <script src="metas-app.js"></script>
</head>
```

### **PASSO 2: Adicionar Botão "Voltar" no `<body>`**

Encontre a abertura `<body>` e **LOGO APÓS** ela, adicione:

```html
<body>
    <!-- ⬇️ ADICIONE ESTE BOTÃO ⬇️ -->
    <button onclick="goBackToHome()" style="
        position: fixed;
        top: 20px;
        left: 20px;
        padding: 12px 24px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        z-index: 9999;
        font-weight: 600;
        font-size: 1em;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        transition: all 0.3s ease;
    " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
        ← Voltar para Home
    </button>
    
    <!-- Resto do conteúdo original -->
    <div class="container">
        ...
```

### **PASSO 3: Remover Scripts Duplicados (OPCIONAL)**

Se o arquivo original tem este script (já está em `metas-app.js`):

```html
<script>
    function saveData() {
        // código antigo
    }
</script>
```

Você pode remover, pois `metas-app.js` já oferece estas funções:
- `saveData()`
- `updateProgress()`
- `updateStatus()`
- `toggleMeta()`

---

## ✅ VERIFICAÇÃO - O Arquivo Está Correto?

Depois de modificar, verifique:

1. ✓ Tem `<script src="metas-app.js"></script>` no `<head>`
2. ✓ Tem botão "Voltar para Home" visível no canto superior esquerdo
3. ✓ Ao clicar, volta para `index.html`
4. ✓ Ao preencher um campo e esperar, mostra "✅ Salvo com sucesso"
5. ✓ Ao fechar e reabrir, dados ainda estão lá

---

## 📋 LISTA DE VERIFICAÇÃO POR ARQUIVO

Marque conforme modifica cada um:

- [ ] metas-agricultura-2025.html
- [ ] metas-autopecas-2025.html
- [ ] metas-compras-2025.html
- [ ] metas-contabil-fiscal-2025.html
- [ ] metas-csc-2025.html
- [ ] metas-dp-2025.html
- [ ] metas-frigorifico-2025.html
- [ ] metas-imobiliaria-2025.html
- [ ] metas-marketing-2025.html
- [ ] metas-pecuaria-2025.html
- [ ] metas-pedreira-2025.html
- [ ] metas-radio-2025.html
- [ ] metas-rh-2025.html
- [ ] metas-ti-2025.html

---

## 🎯 ESTRUTURA FINAL DOS ARQUIVOS

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard Metas 2025 - ...</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        /* ... ESTILOS ORIGINAIS ... */
    </style>
    <!-- ✅ ADICIONADO -->
    <script src="metas-app.js"></script>
</head>
<body>
    <!-- ✅ ADICIONADO -->
    <button onclick="goBackToHome()" style="...">
        ← Voltar para Home
    </button>

    <!-- ... CONTEÚDO ORIGINAL INTACTO ... -->
    <div class="container">
        <!-- TUDO AQUI PERMANECE IGUAL -->
    </div>
</body>
</html>
```

---

## 🚀 TESTE APÓS INTEGRAÇÃO

Para cada arquivo modificado:

1. **Abra em navegador:**
   ```
   file:///caminho/para/metas-agricultura-2025.html
   ```

2. **Verifique:**
   - Botão "Voltar" está visível ✓
   - Formulários abrem corretamente ✓
   - Ao preencher campo, mostra status de sincronização ✓

3. **Teste Auto-Save:**
   - Preencha um campo
   - Aguarde 1 segundo
   - Verifique status "✅ Salvo com sucesso" no canto inferior direito

4. **Teste Persistência:**
   - Feche a página completamente
   - Reabra no navegador
   - Dados devem estar lá

---

## 🐛 PROBLEMAS COMUNS

### **Problema: Botão não aparece**

**Causa:** Script não foi adicionado no lugar certo

**Solução:**
```html
<!-- ❌ ERRADO: Muito perto de </head> -->
<style>...</style></head>

<!-- ✅ CERTO: Antes de </head> -->
<style>...</style>
<script src="metas-app.js"></script>
</head>
```

### **Problema: "metas-app.js not found"**

**Causa:** Arquivo não está no mesmo diretório

**Solução:**
- Coloque `metas-app.js` no **mesmo diretório** que `metas-*.html`
- Ou use caminho completo: `<script src="/caminho/para/metas-app.js"></script>`

### **Problema: Functions não funcionam**

**Causa:** Script `metas-app.js` não foi carregado

**Solução:**
1. Verifique console (F12 > Console)
2. Procure por erros em vermelho
3. Copie o erro e compartilhe

---

## 💡 DICAS IMPORTANTES

1. **NÃO MUDE** o layout ou estilos originais
2. **MANTENHA TUDO IGUAL** exceto pelas 2 adições
3. **TODOS OS INPUTS** funcionam automaticamente
4. **NENHUMA MODIFICAÇÃO** necessária no JavaScript original
5. Se há conflitos de função, `metas-app.js` sobrescreve

---

## 🔍 VALIDAÇÃO FINAL

Depois que modificar todos os 14 arquivos, teste assim:

```
1. Abra index.html
2. Clique em "Agricultura"
3. Preencha 1-2 campos
4. Aguarde mensagem "Salvo com sucesso"
5. Volte para Home
6. Clique em outro departamento
7. Verifique que dados não se misturaram
8. Volte para Agricultura
9. Dados anteriores devem estar lá
```

Se tudo passou, está **100% funcional**! ✅

---

## 📦 ARQUIVOS NECESSÁRIOS

Para funcionar completamente, você precisa ter:

```
📁 projeto/
├── index.html                    ← Page central
├── metas-app.js                  ← Script unificado (OBRIGATÓRIO)
├── metas-agricultura-2025.html   ← Modificado
├── metas-autopecas-2025.html     ← Modificado
├── metas-compras-2025.html       ← Modificado
├── ... (todos os 14)
└── GUIA-CONFIGURACAO.md          ← Este guia
```

**O arquivo `google-apps-script.js` é para o Google Apps Script, NÃO vai em GitHub Pages**

---

## ✨ RESUMO

**3 LINHAS DE CÓDIGO EM 14 ARQUIVOS = SISTEMA COMPLETO DE AUTO-SAVE**

```html
<!-- Adicionar no <head> -->
<script src="metas-app.js"></script>

<!-- Adicionar no <body> -->
<button onclick="goBackToHome()">← Voltar para Home</button>
```

Pronto! Todos os departamentos sincronizam automaticamente com Google Sheets! 🎉

---

**Desenvolvido para Grupo Paraná - Inova GP 2025**
