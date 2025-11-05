# 📻 Sistema de Pesquisa Super FM 98.9

Sistema completo de pesquisa de opinião para ouvintes da Rádio Super FM, com formulário interativo e dashboard de análise com gráficos.

## 📋 Arquivos do Sistema

### **Formulário de Pesquisa**
- `index.html` - Formulário principal (navegação por seções)
- `styles.css` - Estilos do formulário
- `script.js` - Lógica do formulário
- `Super_FM.png` - Logo da rádio

### **Dashboard de Análise**
- `dashboard.html` - Painel administrativo
- `dashboard-styles.css` - Estilos do dashboard
- `dashboard-script.js` - Lógica do dashboard

### **Integração Google Sheets**
- `google-apps-script.js` - Código para Google Apps Script

---

## 🚀 CONFIGURAÇÃO PASSO A PASSO

### **PASSO 1: Criar a Planilha no Google Sheets**

1. Acesse [Google Sheets](https://sheets.google.com)
2. Crie uma nova planilha
3. Nomeie como "Pesquisa Super FM"
4. Copie o **ID da planilha** da URL:
   ```
   https://docs.google.com/spreadsheets/d/SEU_ID_AQUI/edit
   ```

### **PASSO 2: Configurar o Google Apps Script**

1. Na planilha, vá em **Extensões** > **Apps Script**
2. Apague o código padrão
3. Cole o conteúdo do arquivo `google-apps-script.js`
4. Na linha 19, substitua `SEU_ID_DA_PLANILHA_AQUI` pelo ID copiado no Passo 1:
   ```javascript
   const SPREADSHEET_ID = 'cole_seu_id_aqui';
   ```
5. Clique em **Salvar** (ícone de disquete)
6. Clique em **Executar** > selecione `testSave` para testar
7. Autorize o script (primeira vez):
   - Clique em "Revisar permissões"
   - Escolha sua conta Google
   - Clique em "Avançado"
   - Clique em "Ir para [nome do projeto]"
   - Clique em "Permitir"

### **PASSO 3: Publicar como Web App**

1. No Apps Script, clique em **Implantar** > **Nova implantação**
2. Clique no ícone de engrenagem ⚙️ ao lado de "Selecionar tipo"
3. Escolha **Aplicativo da Web**
4. Configure:
   - **Descrição**: "API Pesquisa Super FM"
   - **Executar como**: Eu (seu@email.com)
   - **Quem tem acesso**: Qualquer pessoa
5. Clique em **Implantar**
6. **IMPORTANTE**: Copie a **URL do aplicativo da Web** que aparece
   - Formato: `https://script.google.com/macros/s/XXXXX/exec`

### **PASSO 4: Configurar os Arquivos HTML/JS**

#### **No arquivo `script.js`** (linha 12):
```javascript
const GOOGLE_SCRIPT_URL = 'cole_a_url_copiada_aqui';
```

#### **No arquivo `dashboard-script.js`** (linha 5):
```javascript
const GOOGLE_SCRIPT_URL = 'cole_a_url_copiada_aqui';
```

### **PASSO 5: Upload no GitHub Pages**

#### **Opção A: Usando a interface do GitHub**
1. Acesse seu GitHub e crie um novo repositório
2. Nomeie como "pesquisa-superfm"
3. Marque como "Public"
4. Faça upload de todos os arquivos:
   - index.html
   - styles.css
   - script.js
   - dashboard.html
   - dashboard-styles.css
   - dashboard-script.js
   - Super_FM.png
5. Vá em **Settings** > **Pages**
6. Em "Branch", selecione `main` e pasta `/ (root)`
7. Clique em **Save**
8. Aguarde alguns minutos e acesse:
   ```
   https://seu-usuario.github.io/pesquisa-superfm/
   ```

#### **Opção B: Usando Git (linha de comando)**
```bash
git init
git add .
git commit -m "Sistema de Pesquisa Super FM"
git branch -M main
git remote add origin https://github.com/seu-usuario/pesquisa-superfm.git
git push -u origin main
```

---

## 🎯 COMO USAR

### **Para os Ouvintes**

1. Acesse: `https://seu-usuario.github.io/pesquisa-superfm/`
2. A música ambiente começa automaticamente
3. Responda cada pergunta e clique em "Próxima"
4. Ao final, clique em "Enviar Pesquisa"
5. Os dados são salvos automaticamente na planilha!

### **Para a Elizandra (Dashboard)**

1. Acesse: `https://seu-usuario.github.io/pesquisa-superfm/dashboard.html`
2. **Login**:
   - Usuário: `elizandra`
   - Senha: `superfm2025`
3. Clique em "Entrar"
4. Visualize:
   - Total de respostas
   - Estatísticas rápidas
   - Gráficos interativos
   - Tabela detalhada
5. Clique em "🔄 Atualizar Dados" para ver novas respostas

#### **Outros usuários válidos:**
- Usuário: `admin` / Senha: `superfm2025`
- Usuário: `super` / Senha: `fm2025`

---

## 🎨 RECURSOS DO SISTEMA

### **Formulário**
✅ Design com cores da Super FM (azul royal e amarelo)
✅ Navegação por seções (uma pergunta por vez)
✅ Música ambiente automática (volume baixo)
✅ Barra de progresso
✅ Validação de campos obrigatórios
✅ Máscara automática de telefone
✅ Limite de 2 opções na pergunta sobre motivos
✅ Animações suaves
✅ 100% responsivo (funciona em celular)

### **Dashboard**
✅ Login seguro com senha
✅ Estatísticas rápidas (total, favoritos, etc)
✅ 7 gráficos interativos:
   - Horários de audiência
   - Estilos musicais
   - Locutores favoritos
   - Programas favoritos
   - Plataformas de acesso
   - Faixa etária
   - Motivos para ouvir
✅ Tabela com todas as respostas detalhadas
✅ Botão de atualizar dados
✅ Design profissional

### **Integração**
✅ Salva dados no Google Sheets automaticamente
✅ Backup local em caso de falha
✅ Atualização em tempo real no dashboard

---

## 🔧 PERSONALIZAÇÕES

### **Mudar senha do dashboard**
Edite o arquivo `dashboard-script.js` (linhas 8-13):
```javascript
const USUARIOS_VALIDOS = {
    'elizandra': 'nova_senha',
    'admin': 'outra_senha',
    // Adicione mais usuários aqui
};
```

### **Mudar cores**
Edite `styles.css` e `dashboard-styles.css` (linhas 3-10):
```css
:root {
    --super-blue: #2B5BA8;  /* Azul principal */
    --super-dark-blue: #1B3A6B;  /* Azul escuro */
    --super-yellow: #FFD700;  /* Amarelo */
    /* ... */
}
```

### **Mudar música de fundo**
Edite `index.html` (linha 12):
```html
<source src="URL_DA_SUA_MUSICA.mp3" type="audio/mpeg">
```

---

## 📊 VISUALIZANDO AS RESPOSTAS

### **No Google Sheets:**
1. Abra sua planilha
2. Vá na aba "Respostas"
3. Todas as respostas aparecem automaticamente em tempo real
4. Você pode exportar para Excel se quiser

### **No Dashboard:**
1. Acesse com login e senha
2. Visualize gráficos bonitos e coloridos
3. Clique em "🔄 Atualizar Dados" para ver novas respostas
4. Use os gráficos para apresentações!

---

## 🆘 SOLUÇÃO DE PROBLEMAS

### **Música não toca automaticamente**
- Alguns navegadores bloqueiam autoplay
- O usuário precisa interagir com a página primeiro
- Isso é normal e não afeta o funcionamento

### **Dados não salvam no Google Sheets**
1. Verifique se copiou a URL correta do Apps Script
2. Verifique se publicou como "Qualquer pessoa"
3. Os dados ficam salvos localmente como backup

### **Dashboard não carrega dados**
1. Verifique se a URL do Google Apps Script está correta
2. Verifique se a senha está correta
3. Se não funcionar, o dashboard mostra dados do backup local

### **Erro de permissão no Apps Script**
1. Vá em Apps Script > Executar > testSave
2. Autorize todas as permissões solicitadas
3. Tente novamente

---

## 📱 COMPARTILHANDO O FORMULÁRIO

Depois de publicado, compartilhe o link:
```
https://seu-usuario.github.io/pesquisa-superfm/
```

Formas de divulgar:
- 📻 Mencione na programação da rádio
- 📱 Poste nas redes sociais
- 💬 Envie no WhatsApp para os ouvintes
- 📧 Envie por email
- 🖼️ Crie um QR Code com o link

---

## 👨‍💻 SUPORTE TÉCNICO

Se tiver dúvidas ou problemas:
1. Revise este README cuidadosamente
2. Verifique o console do navegador (F12)
3. Teste primeiro no computador antes do celular
4. Certifique-se de que todos os arquivos estão no mesmo diretório

---

## ✨ MELHORIAS FUTURAS

Possíveis adições:
- [ ] Exportar relatório em PDF
- [ ] Enviar email com os resultados
- [ ] Filtrar respostas por período
- [ ] Comparar períodos diferentes
- [ ] Adicionar mais perguntas
- [ ] Sistema de sorteio de brindes

---

**Desenvolvido para Super FM 98.9 - Mais alegria no ar! 🎵**