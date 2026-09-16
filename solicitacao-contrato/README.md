# ⚖️ Solicitação de Contrato - Grupo Paraná

Formulário web responsivo para solicitação de contratos com análise jurídica integrada ao N8N.

## 📁 Estrutura de Arquivos

```
solicitacao-contrato/
├── index.html              # Arquivo principal (estrutura HTML)
├── css/
│   └── style.css          # Estilos CSS completos
├── js/
│   └── script.js          # Lógica JavaScript (2643 linhas)
├── ESTRUTURA_JSON.md      # Documentação da estrutura de dados
└── README.md              # Este arquivo
```

## 🚀 Como Usar

### 1. **Fazer Upload para o Repositório**

```bash
# Copie a pasta inteira para seu repositório
solicitacao-contrato/
  ├── index.html
  ├── css/style.css
  ├── js/script.js
  └── [outros arquivos]
```

### 2. **Acessar o Formulário**

```
http://seu-dominio.com/formularios/solicitacao-contrato/
```

### 3. **Estrutura de Caminho**

O formulário espera a logo em:
```
../img/logo-grupo-parana.png
```

Se sua estrutura é:
```
formularios/
├── img/
│   └── logo-grupo-parana.png
├── solicitacao-contrato/
│   ├── index.html
│   ├── css/
│   └── js/
├── boletim-acidente/
├── vistoria-veicular/
└── [outros]
```

**Está correto!** O caminho `../../img/logo-grupo-parana.png` funcionará.

## 📋 Funcionalidades

### Seções Padrão (Todos os tipos)
- ✅ **Seção 1**: Identificação do Solicitante
- ✅ **Seção 2**: Seleção de Tipo de Contrato
- ✅ **Seção 3**: Partes Envolvidas (Empresa + Outra Parte)
- ✅ **Seção 7**: Upload de Documentos
- ✅ **Seção 8**: Confirmação e Envio

### Seções Dinâmicas (Variam por tipo)
- **Seção 4**: Objeto do Contrato
- **Seção 5**: Valores e Pagamento
- **Seção 6**: Prazos

### Tipos de Contrato Suportados
1. 📝 **Prestação de Serviços**
2. 🏷️ **Compra e Venda**
3. 🏠 **Locação/Arrendamento**
4. 🤝 **Parceria Agrícola/Pecuária**
5. 📄 **Outros Contratos**

## 🔄 Fluxo do Formulário

```
1. Preencher dados do solicitante
   ↓
2. Selecionar tipo de contrato
   ↓
3. Informar partes envolvidas
   ↓
4. Descrever objeto (dinâmico por tipo)
   ↓
5. Informar valores (dinâmico por tipo)
   ↓
6. Definir prazos (dinâmico por tipo)
   ↓
7. Anexar documentos
   ↓
8. Confirmar e enviar ao N8N
```

## 📊 Dados Enviados ao N8N

Todos os campos do formulário são enviados como **FormData** para:
```
https://app.gparana.com.br/api/n8n/webhook/solicitacao-contrato
```

**Veja `ESTRUTURA_JSON.md` para detalhes completos dos campos.**

### Exemplo de Campos Enviados:
```
nomeCompleto: "João Silva"
setorEmpresa: "Jurídico"
emailSolicitante: "joao@empresa.com"
telefoneSolicitante: "(67) 99999-9999"
dataSolicitacao: "2025-11-08"
tipoContrato: "prestacao"
empresasSelecionadas: "[{...}]"           // JSON string
outraParteEnvolvida: "{...}"              // JSON string
objetoServico: "Descrição do serviço"
valorContrato: "R$ 10.000,00"
formaPagamento: "parcelado"
dataInicio: "2025-11-15"
dataFim: "2025-12-15"
documento_0: File
documento_1: File
receberWhatsapp: true
whatsapp: "6799999999"
```

## 🔐 Validações

- ✅ **E-mail obrigatório** em Pessoa Física e Jurídica
- ✅ **CNPJ com máscara**: 12.345.678/0001-90
- ✅ **CPF com máscara**: 999.999.999-99
- ✅ **Telefone com máscara**: (67) 99999-9999
- ✅ **Data de solicitação** pré-preenchida com hoje
- ✅ **Máximo 10 arquivos** de 10MB cada
- ✅ **Tipos aceitos**: PDF, PNG, JPG, JPEG, DOC, DOCX
- ✅ **CNPJ buscável** via API externa (opcional)

## 🎨 Customização

### Cores (CSS)
Todas as cores estão definidas como variáveis CSS em `style.css`:

```css
:root {
  --primary-blue: #004AC9;
  --primary-red: #ed383b;
  --success-green: #27AE60;
  --warning-orange: #FFC107;
  /* ... outras cores ... */
}
```

Modifique conforme necessário.

### Texto
Todos os textos estão no HTML em `index.html`. Procure e edite diretamente.

## 📱 Responsividade

- ✅ Desktop (1200px+)
- ✅ Tablet (768px - 1199px)
- ✅ Mobile (375px - 767px)

## 🔧 Tecnologias

- **HTML5** - Estrutura semântica
- **CSS3** - Estilos modernos com variáveis e Flexbox
- **JavaScript Vanilla** - Sem dependências
- **FormData API** - Upload de arquivos
- **Fetch API** - Requisições ao N8N

## 📌 Notas Importantes

1. **Webhook N8N**: A URL do webhook está hardcoded em `script.js` linha 1306
   - Para mudar, edite: `https://app.gparana.com.br/api/n8n/webhook/solicitacao-contrato`

2. **Logo**: Referencia arquivo em `../../img/logo-grupo-parana.png`
   - Ajuste o caminho se sua estrutura de pastas for diferente

3. **Empresa do Grupo Paraná**: Lista de empresas vem de um JavaScript
   - Verifique a variável `empresasGrupoParana` em `script.js`

4. **Documentos Dinâmicos**: As seções 4, 5 e 6 mudam conforme tipo de contrato
   - Veja funções `buildPrestacaoServicos`, `buildCompraVenda`, `buildLocacao`, etc em `script.js`

## 🐛 Troubleshooting

### Formulário não carrega?
- Verifique se todos os arquivos (HTML, CSS, JS) estão no local correto
- Abra o console do navegador (F12) para ver erros

### Envio não funciona?
- Verifique a URL do webhook no N8N
- Confira se o N8N está ativo e respondendo
- Veja a seção "Network" do DevTools para detalhes do request

### Estilos não aparecem?
- Verifique se `css/style.css` está sendo carregado (Network tab)
- Confirme se o caminho em `<link rel="stylesheet" href="css/style.css">` está correto

## 📞 Contato

Para problemas ou sugestões sobre este formulário, consulte o time jurídico do Grupo Paraná.

---

**Última atualização**: Novembro 2025
**Versão**: 1.0
**Status**: ✅ Produção
