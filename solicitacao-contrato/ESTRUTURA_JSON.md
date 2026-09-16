# 📊 ESTRUTURA JSON - SOLICITAÇÃO DE CONTRATO

## 🎯 Visão Geral

O formulário envia dados estruturados em **FormData** ao N8N com a seguinte organização:

```
├── SEÇÃO PADRÃO 1-3 (idêntica para todos)
│   ├── Solicitante
│   ├── Tipo de Contrato
│   ├── Partes Envolvidas
│   └── Documentos & Confirmação
│
└── SEÇÃO DINÂMICA 4-6 (muda por tipo)
    ├── Objeto do Contrato
    ├── Valores e Pagamento
    └── Prazos
```

---

## 📝 CAMPOS DO FORMULÁRIO

### SEÇÃO 1: Solicitante
```
nomeCompleto: string
setorEmpresa: string
emailSolicitante: email
telefoneSolicitante: tel
dataSolicitacao: date
```

### SEÇÃO 2: Tipo de Contrato
```
tipoContrato: enum {
  "prestacao",
  "compraVenda",
  "locacao",
  "parceria",
  "outros"
}
```

### SEÇÃO 3: Partes Envolvidas
```
empresasSelecionadas: JSON string com array de empresas
[
  {
    "id": "...",
    "nome": "...",
    "cnpj": "..."
  }
]

outraParteEnvolvida: JSON string com dados da outra parte
{
  "tipo": "pf" ou "pj",
  
  // Se PF (Pessoa Física):
  "nome": string,
  "nacionalidade": string,
  "estadoCivil": string,
  "rg": string,
  "cpf": string,
  "profissao": string,
  "endereco": string,
  "telefone": string,
  "email": string,
  
  // Se PJ (Pessoa Jurídica):
  "razao": string,
  "cnpj": string,
  "endereco": string,
  "telefone": string,
  "email": string,
  "repNome": string,
  "repNacionalidade": string,
  "repEstadoCivil": string,
  "repProfissao": string,
  "repRg": string,
  "repCpf": string
}

outrasPessoas: textarea (opcional)
```

---

## 📦 SEÇÃO 4: OBJETO DO CONTRATO (Dinâmico)

### Para Prestação de Serviços:
```
objetoServico: textarea
localExecucao: string
```

### Para Compra e Venda:
```
objetoBem: textarea
descricaoDetalhadaBem: textarea
```

### Para Locação:
```
enderecoImovel: string
finalidade: enum { "residencial", "comercial", "rural" }
objetoLocacao: textarea
```

### Para Parceria:
```
objetoParceria: textarea
responsabilidades: textarea
obrigacoesAmbientais: textarea
```

### Para Outros:
```
objetoOutros: textarea
informacoesComplementares: textarea
```

---

## 💰 SEÇÃO 5: VALORES E PAGAMENTO (Dinâmico)

### Para Prestação de Serviços:
```
valorContrato: currency
formaPagamento: enum { "vista", "parcelado", "mensalidade", "etapas" }
detalheFormaPagamento: textarea
bankAccountOwner: string (opcional)
bankName: string (opcional)
bankAgency: string (opcional)
bankAccount: string (opcional)
bankAccountType: enum { "corrente", "poupanca" } (opcional)
```

### Para Compra e Venda:
```
valorTotal: currency
formaPagamentoCV: enum { "vista", "parcelado", "financiamento" }
detalheFormaPagamentoCV: textarea
parcelas: number (se parcelado)
bankAccountOwnerCV: string (opcional)
bankNameCV: string (opcional)
bankAgencyCV: string (opcional)
bankAccountCV: string (opcional)
bankAccountTypeCV: enum { "corrente", "poupanca" } (opcional)
```

### Para Locação:
```
valorAluguel: currency
formaPagamentoLoc: enum { "boleto", "deposito", "pix", "transferencia" }
detalheFormaPagamentoLoc: textarea
diaVencimento: number (1-31)
reajuste: string (ex: "IGPM anual")
garantia: enum { "caucao", "fiador", "seguro", "sem" }
bankAccountOwnerLoc: string (opcional)
bankNameLoc: string (opcional)
bankAgencyLoc: string (opcional)
bankAccountLoc: string (opcional)
bankAccountTypeLoc: enum { "corrente", "poupanca" } (opcional)
```

### Para Parceria:
```
divisaoCustos: textarea
```

### Para Outros:
```
valorOutros: currency (opcional)
formaPagamentoOutros: string (opcional)
```

---

## ⏰ SEÇÃO 6: PRAZOS (Dinâmico)

### Para Prestação de Serviços:
```
dataInicio: date
dataFim: date
```

### Para Compra e Venda:
```
prazoEntrega: string
```

### Para Locação:
```
inicioLocacao: date
terminoLocacao: date
```

### Para Parceria:
```
prazoInicioParceria: date
prazoTerminoParceria: date
```

### Para Outros:
```
prazoOutros: string
```

---

## 📎 SEÇÃO 7: DOCUMENTOS

```
documento_0: File
documento_1: File
documento_2: File
...
(máximo 10 arquivos de 10MB cada)
```

---

## 📱 SEÇÃO 8: CONFIRMAÇÃO

```
receberWhatsapp: boolean
whatsapp: string (formato: 99999999999 - apenas números)
```

---

## 🔗 EXEMPLO DE REQUEST AO N8N

```javascript
// FormData enviado como multipart/form-data
POST https://app.gparana.com.br/api/n8n/webhook/solicitacao-contrato

{
  // Seção 1
  "nomeCompleto": "João Silva",
  "setorEmpresa": "Jurídico",
  "emailSolicitante": "joao@empresa.com",
  "telefoneSolicitante": "(67) 99999-9999",
  "dataSolicitacao": "2025-11-08",
  
  // Seção 2
  "tipoContrato": "prestacao",
  
  // Seção 3
  "empresasSelecionadas": "[{\"id\": \"1\", \"nome\": \"Empresa A\"}]",
  "outraParteEnvolvida": "{\"tipo\":\"pj\",\"razao\":\"Tech Solutions\",\"cnpj\":\"12.345.678/0001-90\",\"email\":\"contato@tech.com\"}",
  "outrasPessoas": "",
  
  // Seção 4 (dinâmica - prestação)
  "objetoServico": "Desenvolvimento de aplicativo web...",
  "localExecucao": "Home office",
  
  // Seção 5 (dinâmica - prestação)
  "valorContrato": "R$ 10.000,00",
  "formaPagamento": "parcelado",
  "detalheFormaPagamento": "3 parcelas",
  
  // Seção 6 (dinâmica - prestação)
  "dataInicio": "2025-11-15",
  "dataFim": "2025-12-15",
  
  // Seção 7
  "documento_0": File,
  "documento_1": File,
  
  // Seção 8
  "receberWhatsapp": true,
  "whatsapp": "6799999999",
  
  // Adicional
  "empresasSelecionadas": "[...]"  (JSON string)
}
```

---

## 🎯 FLUXO NO N8N

1. **Receber** dados do webhook
2. **Validar** se todas seções obrigatórias estão preenchidas
3. **Processar** outraParteEnvolvida (parse JSON)
4. **Processar** empresasSelecionadas (parse JSON)
5. **Armazenar** documentos
6. **Enviar** notificação (email + WhatsApp se selecionado)
7. **Registrar** no banco de dados
8. **Gerar** protocolo único

---

## ⚙️ ESTRUTURA DE PASTAS

```
solicitacao-contrato/
├── index.html          (13K - HTML estrutura)
├── css/
│   └── style.css       (16K - Estilos)
└── js/
    └── script.js       (107K - Lógica & API)
```

---

## 🔐 SEGURANÇA & VALIDAÇÕES

- ✅ E-mail obrigatório em PF e PJ
- ✅ Validação de CNPJ com máscara
- ✅ Validação de CPF com máscara
- ✅ Telefone com máscara (67) 99999-9999
- ✅ Máximo 10 arquivos de 10MB cada
- ✅ Tipos aceitos: PDF, PNG, JPG, JPEG, DOC, DOCX
- ✅ Data de solicitação pré-preenchida com hoje
- ✅ CNPJ buscável via API externa

---

## 📌 NOTAS IMPORTANTES

1. **Estrutura é flexível**: N8N receberá todos os campos possíveis e pode ignorar os que não usa
2. **JSON dentro de FormData**: outraParteEnvolvida e empresasSelecionadas vêm como strings JSON
3. **Arquivos separados**: Cada documento é um campo separado (documento_0, documento_1, etc)
4. **Tipo dinâmico**: Seções 4-6 mudam conforme tipoContrato
5. **Sempre padrão**: Seções 1-3 e 7-8 são idênticas para todos os tipos

