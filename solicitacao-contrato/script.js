          formatted += `) ${digits.slice(2, 6)}`;
          if (digits.length >= 7) formatted += `-${digits.slice(6, 10)}`;
        }
      }
      
      return formatted;
    }

    // 🔥 FUNÇÃO ESPECIAL: Normalizar telefone recebido da API
    // ✅ VERSÃO CORRIGIDA: Detecta quando falta 9 no móvel e adiciona dinamicamente
    function normalizeTelefoneAPI(v) {
      let digits = v.replace(/\D/g, '');
      
      if (!digits) return '';
      
      // Se começa com 0, remover
      if (digits.startsWith('0')) {
        digits = digits.substring(1);
      }
      
      // Padrão brasileiro:
      // Fixo: (XX) XXXX-XXXX = 10 dígitos totais
      // Celular: (XX) 9XXXX-XXXX = 11 dígitos totais
      
      if (digits.length === 8) {
        // Só número sem DDD - formato 4x4 (fixo sem DDD)
        return digits.replace(/(\d{4})(\d{4})/, '$1-$2');
      } else if (digits.length === 9) {
        // IMPORTANTE: 9 dígitos pode ser:
        // A) Celular sem DDD (9XXXX-XXXX) - ADICIONAR 9 na frente
        // B) Fixo sem DDD (XXXX-XXXX) - formatado como 4x4 com um dígito extra
        
        // Se começa com 9, é celular sem DDD
        if (digits.startsWith('9')) {
          return digits.replace(/(\d)(\d{4})(\d{4})/, '9$1$2-$3');
        } else {
          // É fixo com um dígito extra, formatar como celular com 9 adicionado
          return digits.replace(/(\d)(\d{4})(\d{4})/, '9$1$2-$3');
        }
      } else if (digits.length === 10) {
        // 10 dígitos: XX + XXXXXXXX
        let ddd = digits.substring(0, 2);
        let numero = digits.substring(2);
        
        // Se começa com 9, é celular incompleto (faltando um 9)
        // Exemplo: 1123851939 = DDD 11 + 23851939 (só 8 dígitos, faltando 9)
        // Deve ficar: (11) 92385-1939
        if (numero.startsWith('2') || numero.startsWith('3') || numero.startsWith('4') || 
            numero.startsWith('5') || numero.startsWith('6') || numero.startsWith('7') || 
            numero.startsWith('8')) {
          // É fixo: (XX) XXXX-XXXX
          return `(${ddd}) ${numero.substring(0, 4)}-${numero.substring(4)}`;
        } else if (numero.startsWith('9')) {
          // Começa com 9 mas só tem 8 dígitos - é celular incompleto
          // Adicionar 9 no início: (XX) 9XXXX-XXXX
          return `(${ddd}) 9${numero.substring(0, 4)}-${numero.substring(4)}`;
        }
      } else if (digits.length === 11) {
        // 11 dígitos: celular completo (XX) 9XXXX-XXXX
        let ddd = digits.substring(0, 2);
        let numero = digits.substring(2);
        
        if (numero.startsWith('9')) {
          return `(${ddd}) ${numero.substring(0, 5)}-${numero.substring(5)}`;
        } else {
          // 11 dígitos mas não começa com 9 - adicionar 9
          return `(${ddd}) 9${numero.substring(0, 4)}-${numero.substring(4)}`;
        }
      } else if (digits.length === 12) {
        // 12 dígitos - provavelmente DDD + 10 dígitos
        let ddd = digits.substring(0, 2);
        let numero = digits.substring(2);
        return `(${ddd}) ${numero.substring(0, 5)}-${numero.substring(5)}`;
      } else {
        // Tamanho inesperado - tentar formatar genérico
        if (digits.length > 10) {
          let ddd = digits.substring(0, 2);
          let numero = digits.substring(2);
          return `(${ddd}) ${numero.substring(0, 5)}-${numero.substring(5)}`;
        } else if (digits.length > 4) {
          return digits.replace(/(\d{4})(\d+)$/, '$1-$2');
        }
        return digits;
      }
    }

    function maskMoney(v) {
      // Remove tudo que não é número
      v = v.replace(/\D/g, '');
      
      // Se vazio, retorna vazio
      if (!v) return '';
      
      // Garante sempre 2 casas decimais
      // Ex: 1 → 001 → 0,01
      // Ex: 12 → 012 → 0,12
      // Ex: 123 → 123 → 1,23
      // Ex: 1234 → 1234 → 12,34
      v = v.padStart(3, '0'); // Adiciona zeros à esquerda até ter no mínimo 3 dígitos
      
      // Coloca a vírgula 2 dígitos do final
      v = v.slice(0, -2) + ',' + v.slice(-2);
      
      // Remove zeros à esquerda (mas mantém pelo menos um dígito antes da vírgula)
      v = v.replace(/^0+(?=\d)/, '');
      
      return v;
    }

    // 🔥 NOVO: Função para mostrar/esconder campo de detalhe de pagamento
    function togglePaymentDetail(type) {
      const detailField = $(`#paymentDetail_${type}`);
      const selectField = $(`#formaPagamento${type === 'compravenda' ? '' : type === 'imovel' ? 'CV' : type === 'locacao' ? 'Loc' : ''}`);
      
      if (!detailField) return;
      
      const hasValue = selectField && selectField.value && selectField.value !== '';
      
      if (hasValue) {
        detailField.classList.add('show');
      } else {
        detailField.classList.remove('show');
      }
    }

    // 🔥 NOVO: Validação de CPF
    function isValidCPF(cpf) {
      cpf = cpf.replace(/\D/g, '');
      if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
      
      let sum = 0;
      for (let i = 0; i < 9; i++) sum += parseInt(cpf.charAt(i)) * (10 - i);
      let digit = 11 - (sum % 11);
      if (digit >= 10) digit = 0;
      if (digit !== parseInt(cpf.charAt(9))) return false;
      
      sum = 0;
      for (let i = 0; i < 10; i++) sum += parseInt(cpf.charAt(i)) * (11 - i);
      digit = 11 - (sum % 11);
      if (digit >= 10) digit = 0;
      if (digit !== parseInt(cpf.charAt(10))) return false;
      
      return true;
    }

    // 🔥 NOVO: Validação de CNPJ
    function isValidCNPJ(cnpj) {
      cnpj = cnpj.replace(/\D/g, '');
      if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
      
      let size = cnpj.length - 2;
      let numbers = cnpj.substring(0, size);
      const digits = cnpj.substring(size);
      let sum = 0;
      let pos = size - 7;
      
      for (let i = size; i >= 1; i--) {
        sum += numbers.charAt(size - i) * pos--;
        if (pos < 2) pos = 9;
      }
      
      let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
      if (result != digits.charAt(0)) return false;
      
      size = size + 1;
      numbers = cnpj.substring(0, size);
      sum = 0;
      pos = size - 7;
      
      for (let i = size; i >= 1; i--) {
        sum += numbers.charAt(size - i) * pos--;
        if (pos < 2) pos = 9;
      }
      
      result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
      if (result != digits.charAt(1)) return false;
      
      return true;
    }

    // ====== NAVEGAÇÃO ======
    // 🔥 MODO PRODUÇÃO - Alterar para true em produção e false em testes
    const PRODUCTION_MODE = false; // true = valida campos obrigatórios | false = permite avançar sem validar
    
    let currentSection = 1;
    const totalSections = 8;
    let selectedContractType = null;

    function updateSection() {
      $$('.form-section').forEach(s => s.classList.remove('active'));
      $(`[data-section="${currentSection}"]`)?.classList.add('active');

      const prevBtn = $('#prevBtn');
      const nextBtn = $('#nextBtn');
      const submitBtn = $('#submitBtn');
      const navContainer = $('.navigation-buttons');

      if (currentSection === 1) {
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'block';
        submitBtn.style.display = 'none';
        navContainer.classList.add('first-section');
      } else if (currentSection === totalSections) {
        prevBtn.style.display = 'block';
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'block';
        navContainer.classList.remove('first-section');
      } else {
        prevBtn.style.display = 'block';
        nextBtn.style.display = 'block';
        submitBtn.style.display = 'none';
        navContainer.classList.remove('first-section');
      }

      const percentage = (currentSection / totalSections) * 100;
      $('#progressText').textContent = `Seção ${currentSection} de ${totalSections}`;
      $('#progressFill').style.width = `${percentage}%`;

      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function validateCurrentSection() {
      // 🔥 EM MODO TESTE, IGNORAR VALIDAÇÃO
      if (!PRODUCTION_MODE) {
        console.log('✅ Modo teste: validação desativada');
        return true;
      }

      const activeSection = $('[data-section="' + currentSection + '"].active');
      if (!activeSection) return true;

      let isValid = true;
      const requiredFields = activeSection.querySelectorAll('input[required], select[required], textarea[required]');

      requiredFields.forEach(field => {
        // 🔥 CORREÇÃO: Verificar se o campo está visível antes de validar
        const parent = field.closest('.form-group, .pfpj-grid, .subsection');
        const isVisible = parent && !parent.classList.contains('hidden') && 
                         window.getComputedStyle(parent).display !== 'none';
        
        if (!isVisible) return; // Pular campos ocultos
        
        const errorMsg = field.closest('.form-group')?.querySelector('.error-message');
        const value = (field.value || '').trim();
        const dataField = (field.dataset.field || '').toLowerCase();
        
        // 🔥 VALIDAÇÃO DE CPF
        if ((dataField.includes('_cpf') || field.id.toLowerCase().includes('cpf')) && value) {
          if (!isValidCPF(value)) {
            field.classList.add('error');
            if (errorMsg) {
              errorMsg.textContent = 'CPF inválido';
              errorMsg.style.display = 'block';
            }
            isValid = false;
            return;
          }
        }
        
        // 🔥 VALIDAÇÃO DE CNPJ
        if ((dataField.includes('_cnpj') || field.id.toLowerCase().includes('cnpj')) && value) {
          if (!isValidCNPJ(value)) {
            field.classList.add('error');
            if (errorMsg) {
              errorMsg.textContent = 'CNPJ inválido';
              errorMsg.style.display = 'block';
            }
            isValid = false;
            return;
          }
        }

        if (field.type === 'radio') {
          const radioGroup = field.closest('.form-group');
          const checked = radioGroup?.querySelector('input[type="radio"]:checked');
          if (!checked) {
            if (errorMsg) errorMsg.style.display = 'block';
            isValid = false;
          } else {
            if (errorMsg) errorMsg.style.display = 'none';
          }
        } else if (field.type === 'email') {
          if (!field.value.trim() || !field.value.includes('@')) {
            field.classList.add('error');
            if (errorMsg) errorMsg.style.display = 'block';
            isValid = false;
          } else {
            field.classList.remove('error');
            if (errorMsg) errorMsg.style.display = 'none';
          }
        } else {
          if (!field.value.trim()) {
            field.classList.add('error');
            if (errorMsg) errorMsg.style.display = 'block';
            isValid = false;
          } else {
            field.classList.remove('error');
            if (errorMsg) errorMsg.style.display = 'none';
          }
        }
      });

      
      // 🔥 Validação de empresas selecionadas (seção 3)
      if (currentSection === 3) {
        const empresasError = $('#empresasError');
        if (selectedEmpresas && selectedEmpresas.length === 0) {
          empresasError.style.display = 'block';
          isValid = false;
        } else if (empresasError) {
          empresasError.style.display = 'none';
        }
      }

      return isValid;
    }

    $('#nextBtn').addEventListener('click', () => {
      if (validateCurrentSection()) {
        if (currentSection < totalSections) {
          currentSection++;
          updateSection();
        }
      } else {
        alert('Por favor, preencha todos os campos obrigatórios desta seção.');
      }
    });

    $('#prevBtn').addEventListener('click', () => {
      if (currentSection > 1) {
        currentSection--;
        updateSection();
      }
    });

    // ====== TIPO DE CONTRATO ======
    $$('input[name="tipoContrato"]').forEach(radio => {
      radio.addEventListener('change', function() {
        selectedContractType = this.value;
        
        // 🔥 NOVO: Atualizar badge de tipo de contrato abaixo da barra com emojis corretos
        const typeLabelMap = {
          'prestacao': { label: 'Prestação de Serviços', emoji: '📝' },
          'compraVenda': { label: 'Compra e Venda', emoji: '🏷️' },
          'locacao': { label: 'Locação/Arrendamento', emoji: '🏠' },
          'parceria': { label: 'Parceria Agrícola/Pecuária', emoji: '🤝' },
          'outros': { label: 'Outros Contratos', emoji: '📄' }
        };
        
        const badge = document.getElementById('contractTypeBadge');
        const typeText = document.getElementById('contractTypeText');
        const typeEmoji = document.getElementById('contractTypeEmoji');
        
        if (badge && typeText && typeEmoji) {
          const contractInfo = typeLabelMap[this.value];
          typeEmoji.textContent = contractInfo.emoji;
          typeText.textContent = contractInfo.label;
          badge.classList.add('show');
        }
        
        // 🔥 NOVO: Limpar empresas selecionadas ao mudar de contrato
        const empresasCheckboxes = $$('[name="empresas"]');
        empresasCheckboxes.forEach(checkbox => {
          checkbox.checked = false;
        });
        console.log('✅ Empresas limpas ao mudar de contrato');
        
        // Atualiza seleção visual
        $$('.radio-item[data-type]').forEach(item => item.classList.remove('selected'));
        this.closest('.radio-item').classList.add('selected');
        
        // Limpa e reconstrói seções dinâmicas
        buildDynamicSections(selectedContractType);
      });
    });

    function buildDynamicSections(type) {
      const partesContainer = $('#partesContainer');
      const objetoContainer = $('#objetoContainer');
      const valoresContainer = $('#valoresContainer');
      const prazosContainer = $('#prazosContainer');

      // Limpa containers
      partesContainer.innerHTML = '';
      objetoContainer.innerHTML = '';
      valoresContainer.innerHTML = '';
      prazosContainer.innerHTML = '';

      if (type === 'prestacao') {
        buildPrestacaoServicos(partesContainer, objetoContainer, valoresContainer, prazosContainer);
      } else if (type === 'compraVenda') {
        buildCompraVenda(partesContainer, objetoContainer, valoresContainer, prazosContainer);
      } else if (type === 'locacao') {
        buildLocacao(partesContainer, objetoContainer, valoresContainer, prazosContainer);
      } else if (type === 'parceria') {
        buildParceria(partesContainer, objetoContainer, valoresContainer, prazosContainer);
      } else if (type === 'outros') {
        buildOutros(partesContainer, objetoContainer, valoresContainer, prazosContainer);
      }
    }

    // ====== BUILDERS POR TIPO DE CONTRATO ======

    function buildPrestacaoServicos(partesC, objetoC, valoresC, prazosC) {
      // Restaurar título padrão da seção 6
      $('#prazosTitle').textContent = '6. Prazos';
      $('#prazosDescription').textContent = 'Defina os prazos do contrato.';
      
      // Partes
      partesC.innerHTML = `
        <div class="pfpj-mount" data-role="👤 Outra Parte Envolvida" data-target="outraParteEnvolvida"></div>
      `;
      
      // Objeto
      objetoC.innerHTML = `
        <div class="form-group">
          <label for="objetoServico" class="required">Descrição detalhada do serviço</label>
          <textarea id="objetoServico" name="objetoServico" placeholder="Descreva detalhadamente o serviço a ser prestado..." required></textarea>
          <div class="error-message">Campo obrigatório</div>
        </div>
        <div class="form-group">
          <label for="localExecucao" class="required">Local da execução do serviço</label>
          <input type="text" id="localExecucao" name="localExecucao" placeholder="Endereço onde o serviço será executado" required>
          <div class="error-message">Campo obrigatório</div>
        </div>
      `;
      
      // Valores
      valoresC.innerHTML = `
        <div class="form-group">
          <label for="valorContrato" class="required">Valor total da negociação</label>
          <input type="text" id="valorContrato" name="valorContrato" placeholder="R$ 0,00" required>
          <div class="error-message">Campo obrigatório</div>
        </div>
        <div class="form-group">
          <label for="formaPagamento" class="required">Forma de pagamento</label>
          <select id="formaPagamento" name="formaPagamento" required onchange="togglePaymentDetail('compravenda')">
            <option value="">Selecione...</option>
            <option value="vista">À vista</option>
            <option value="parcelado">Parcelado</option>
            <option value="mensalidade">Mensalidade</option>
            <option value="etapas">Por etapas</option>
          </select>
          <div class="error-message">Campo obrigatório</div>
        </div>
        <div id="paymentDetail_compravenda" class="payment-detail-field form-group" style="grid-column: 1 / -1;">
          <label for="detalheFormaPagamento">Detalhe da forma de pagamento</label>
          <textarea id="detalheFormaPagamento" name="detalheFormaPagamento" placeholder="Insira informações e detalhes da forma de pagamento"></textarea>
        </div>
        <div class="form-group" style="grid-column: 1 / -1;">
          <label>Dados bancários para recebimento (opcional)</label>
          <div style="background: var(--light-gray); padding: 16px; border-radius: 10px; border-left: 3px solid var(--primary-blue);">
            <div class="form-group">
              <label for="bankAccountOwner">Titular da conta</label>
              <input type="text" id="bankAccountOwner" name="bankAccountOwner" placeholder="Nome completo">
            </div>
            <div class="form-group">
              <label for="bankName">Nome do banco</label>
              <input type="text" id="bankName" name="bankName" placeholder="Ex: Banco do Brasil">
            </div>
            <div class="form-group">
              <label for="bankAgency">Agência (com dígito)</label>
              <input type="text" id="bankAgency" name="bankAgency" placeholder="Ex: 0001-2">
            </div>
            <div class="form-group">
              <label for="bankAccount">Conta (com dígito)</label>
              <input type="text" id="bankAccount" name="bankAccount" placeholder="Ex: 123456-7">
            </div>
            <div class="form-group">
              <label for="bankAccountType">Tipo de conta</label>
              <select id="bankAccountType" name="bankAccountType">
                <option value="">Selecione...</option>
                <option value="corrente">Corrente</option>
                <option value="poupanca">Poupança</option>
              </select>
            </div>
          </div>
        </div>
      `;
      
      // Prazos
      prazosC.innerHTML = `
        <div class="form-group">
          <label for="dataInicio" class="required">Data de início</label>
          <input type="date" id="dataInicio" name="dataInicio" required>
          <div class="error-message">Campo obrigatório</div>
        </div>
        <div class="form-group">
          <label for="dataFim" class="required">Data de término</label>
          <input type="date" id="dataFim" name="dataFim" required>
          <div class="error-message">Campo obrigatório</div>
        </div>
      `;
      
      initPessoaBlocks();
      applyMoneyMask('#valorContrato');
    }

    function buildCompraVenda(partesC, objetoC, valoresC, prazosC) {
      // Restaurar título padrão da seção 6
      $('#prazosTitle').textContent = '6. Prazos';
      $('#prazosDescription').textContent = 'Defina os prazos do contrato.';
      
      partesC.innerHTML = `
        <div class="pfpj-mount" data-role="👤 Outra Parte Envolvida" data-target="outraParteEnvolvida"></div>
      `;
      
      objetoC.innerHTML = `
        <div class="form-group">
          <label for="objetoBem" class="required">Descrição detalhada do bem (imóvel, veículo, mercadoria, etc.)</label>
          <textarea id="objetoBem" name="objetoBem" placeholder="Descreva detalhadamente o objeto da compra e venda..." required></textarea>
          <div class="error-message">Campo obrigatório</div>
        </div>
        <div class="form-group">
          <label for="garantias">Garantias (se houver)</label>
          <textarea id="garantias" name="garantias" placeholder="Descreva as garantias associadas..."></textarea>
        </div>
      `;
      
      valoresC.innerHTML = `
        <div class="form-group">
          <label for="valorTotal" class="required">Valor total da negociação</label>
          <input type="text" id="valorTotal" name="valorTotal" placeholder="R$ 0,00" required>
          <div class="error-message">Campo obrigatório</div>
        </div>
        <div class="form-group">
          <label for="formaPagamentoCV" class="required">Forma de pagamento</label>
          <select id="formaPagamentoCV" name="formaPagamentoCV" required onchange="togglePaymentDetail('imovel')">
            <option value="">Selecione...</option>
            <option value="vista">À vista</option>
            <option value="financiamento">Financiamento</option>
            <option value="parcelado">Parcelado</option>
          </select>
          <div class="error-message">Campo obrigatório</div>
        </div>
        <div id="paymentDetail_imovel" class="payment-detail-field form-group" style="grid-column: 1 / -1;">
          <label for="detalheFormaPagamentoCV">Detalhe da forma de pagamento</label>
          <textarea id="detalheFormaPagamentoCV" name="detalheFormaPagamentoCV" placeholder="Insira informações e detalhes da forma de pagamento"></textarea>
        </div>
      `;
      
      prazosC.innerHTML = `
        <div class="form-group">
          <label for="prazoEntrega" class="required">Prazo de entrega/transferência</label>
          <input type="date" id="prazoEntrega" name="prazoEntrega" required>
          <div class="error-message">Campo obrigatório</div>
        </div>
      `;
      
      initPessoaBlocks();
      applyMoneyMask('#valorTotal');
    }

    function buildLocacao(partesC, objetoC, valoresC, prazosC) {
      // Restaurar título padrão da seção 6
      $('#prazosTitle').textContent = '6. Prazos';
      $('#prazosDescription').textContent = 'Defina os prazos do contrato.';
      
      partesC.innerHTML = `
        <div class="pfpj-mount" data-role="👤 Outra Parte Envolvida" data-target="outraParteEnvolvida"></div>
      `;
      
      objetoC.innerHTML = `
        <div class="form-group">
          <label for="enderecoImovel" class="required">Endereço completo do imóvel</label>
          <input type="text" id="enderecoImovel" name="enderecoImovel" placeholder="Endereço completo" required>
          <div class="error-message">Campo obrigatório</div>
        </div>
        <div class="form-group">
          <label for="finalidade" class="required">Finalidade</label>
          <select id="finalidade" name="finalidade" required>
            <option value="">Selecione...</option>
            <option value="residencial">Residencial</option>
            <option value="comercial">Comercial</option>
            <option value="rural">Rural</option>
          </select>
          <div class="error-message">Campo obrigatório</div>
        </div>
        <div class="form-group">
          <label for="objetoLocacao" class="required">Descrição do objeto do contrato</label>
          <textarea id="objetoLocacao" name="objetoLocacao" placeholder="Descreva detalhadamente o imóvel, suas características, dependências, condições e especificações..." required></textarea>
          <div class="error-message">Campo obrigatório</div>
        </div>
      `;
      
      valoresC.innerHTML = `
        <div class="form-group">
          <label for="valorAluguel" class="required">Valor mensal do aluguel/arrendamento</label>
          <input type="text" id="valorAluguel" name="valorAluguel" placeholder="R$ 0,00" required>
          <div class="error-message">Campo obrigatório</div>
        </div>
        <div class="form-group">
          <label for="formaPagamentoLoc" class="required">Forma de pagamento</label>
          <select id="formaPagamentoLoc" name="formaPagamentoLoc" required onchange="togglePaymentDetail('locacao')">
            <option value="">Selecione...</option>
            <option value="boleto">Boleto</option>
            <option value="deposito">Depósito</option>
            <option value="pix">PIX</option>
            <option value="transferencia">Transferência bancária</option>
          </select>
          <div class="error-message">Campo obrigatório</div>
        </div>
        <div id="paymentDetail_locacao" class="payment-detail-field form-group" style="grid-column: 1 / -1;">
          <label for="detalheFormaPagamentoLoc">Detalhe da forma de pagamento</label>
          <textarea id="detalheFormaPagamentoLoc" name="detalheFormaPagamentoLoc" placeholder="Insira informações e detalhes da forma de pagamento"></textarea>
        </div>
        <div class="form-group">
          <label for="diaVencimento" class="required">Data de vencimento mensal</label>
          <input type="number" id="diaVencimento" name="diaVencimento" placeholder="Ex: 10" min="1" max="31" required>
          <div class="error-message">Campo obrigatório</div>
        </div>
        <div class="form-group">
          <label for="reajuste">Reajuste (índice e periodicidade)</label>
          <input type="text" id="reajuste" name="reajuste" placeholder="Ex: IGPM anual">
        </div>
        <div class="form-group">
          <label for="garantia">Garantia locatícia</label>
          <select id="garantia" name="garantia">
            <option value="">Selecione...</option>
            <option value="caucao">Caução</option>
            <option value="fiador">Fiador</option>
            <option value="seguro">Seguro fiança</option>
            <option value="sem">Sem garantia</option>
          </select>
        </div>
        <div class="form-group" style="grid-column: 1 / -1;">
          <label>Dados bancários para recebimento (opcional)</label>
          <div style="background: var(--light-gray); padding: 16px; border-radius: 10px; border-left: 3px solid var(--primary-blue);">
            <div class="form-group">
              <label for="bankAccountOwnerLoc">Titular da conta</label>
              <input type="text" id="bankAccountOwnerLoc" name="bankAccountOwnerLoc" placeholder="Nome completo">
            </div>
            <div class="form-group">
              <label for="bankNameLoc">Nome do banco</label>
              <input type="text" id="bankNameLoc" name="bankNameLoc" placeholder="Ex: Banco do Brasil">
            </div>
            <div class="form-group">
              <label for="bankAgencyLoc">Agência (com dígito)</label>
              <input type="text" id="bankAgencyLoc" name="bankAgencyLoc" placeholder="Ex: 0001-2">
            </div>
            <div class="form-group">
              <label for="bankAccountLoc">Conta (com dígito)</label>
              <input type="text" id="bankAccountLoc" name="bankAccountLoc" placeholder="Ex: 123456-7">
            </div>
            <div class="form-group">
              <label for="bankAccountTypeLoc">Tipo de conta</label>
              <select id="bankAccountTypeLoc" name="bankAccountTypeLoc">
                <option value="">Selecione...</option>
                <option value="corrente">Corrente</option>
                <option value="poupanca">Poupança</option>
              </select>
            </div>
          </div>
        </div>
      `;
      
      prazosC.innerHTML = `
        <div class="form-group">
          <label for="inicioLocacao" class="required">Início da locação/arrendamento</label>
          <input type="date" id="inicioLocacao" name="inicioLocacao" required>
          <div class="error-message">Campo obrigatório</div>
        </div>
        <div class="form-group">
          <label for="terminoLocacao" class="required">Término da locação/arrendamento</label>
          <input type="date" id="terminoLocacao" name="terminoLocacao" required>
          <div class="error-message">Campo obrigatório</div>
        </div>
      `;
      
      initPessoaBlocks();
      applyMoneyMask('#valorAluguel');
    }

    function buildParceria(partesC, objetoC, valoresC, prazosC) {
      // Atualizar título da seção 6
      $('#prazosTitle').textContent = '6. Prazos da Parceria';
      $('#prazosDescription').textContent = 'Defina os prazos de início e término da parceria.';
      
      partesC.innerHTML = `
        <div class="pfpj-mount" data-role="👤 Outra Parte Envolvida" data-target="outraParteEnvolvida"></div>
      `;
      
      objetoC.innerHTML = `
        <div class="form-group">
          <label for="objetoParceria" class="required">Descrição detalhada da parceria</label>
          <textarea id="objetoParceria" name="objetoParceria" placeholder="Descreva o objeto da parceria agrícola/pecuária..." required></textarea>
          <div class="error-message">Campo obrigatório</div>
        </div>
        <div class="form-group">
          <label for="responsabilidades" class="required">Responsabilidades de cada parte (insumos, maquinário, mão de obra)</label>
          <textarea id="responsabilidades" name="responsabilidades" placeholder="Descreva as responsabilidades de cada parceiro..." required></textarea>
          <div class="error-message">Campo obrigatório</div>
        </div>
        <div class="form-group">
          <label for="obrigacoesAmbientais" class="required">Obrigações ambientais e legais</label>
          <textarea id="obrigacoesAmbientais" name="obrigacoesAmbientais" placeholder="Descreva as obrigações ambientais e legais..." required></textarea>
          <div class="error-message">Campo obrigatório</div>
        </div>
      `;
      
      valoresC.innerHTML = `
        <div class="form-group">
          <label>Divisão de custos e receitas</label>
          <textarea name="divisaoCustos" placeholder="Descreva como serão divididos os custos e as receitas da parceria..."></textarea>
        </div>
      `;
      
      prazosC.innerHTML = `
        <div class="form-group">
          <label for="prazoInicioParceria" class="required">Início da parceria</label>
          <input type="date" id="prazoInicioParceria" name="prazoInicioParceria" required>
          <div class="error-message">Campo obrigatório</div>
        </div>
        <div class="form-group">
          <label for="prazoTerminoParceria" class="required">Término da parceria</label>
          <input type="date" id="prazoTerminoParceria" name="prazoTerminoParceria" required>
          <div class="error-message">Campo obrigatório</div>
        </div>
      `;
      
      initPessoaBlocks();
    }

    function buildOutros(partesC, objetoC, valoresC, prazosC) {
      // Restaurar título padrão da seção 6
      $('#prazosTitle').textContent = '6. Prazos';
      $('#prazosDescription').textContent = 'Defina os prazos do contrato.';
      
      partesC.innerHTML = `
        <div class="pfpj-mount" data-role="👤 Outra Parte Envolvida" data-target="outraParteEnvolvida"></div>
      `;
      
      objetoC.innerHTML = `
        <div class="form-group">
          <label for="objetoOutros" class="required">Descrição detalhada do objeto do contrato</label>
          <textarea id="objetoOutros" name="objetoOutros" placeholder="Descreva o objeto do contrato..." required></textarea>
          <div class="error-message">Campo obrigatório</div>
        </div>
        <div class="form-group">
          <label for="informacoesComplementares">Informações complementares</label>
          <textarea id="informacoesComplementares" name="informacoesComplementares" placeholder="Outras informações relevantes..."></textarea>
        </div>
      `;
      
      valoresC.innerHTML = `
        <div class="form-group">
          <label for="valorOutros">Valor (se aplicável)</label>
          <input type="text" id="valorOutros" name="valorOutros" placeholder="R$ 0,00">
        </div>
        <div class="form-group">
          <label for="formaPagamentoOutros">Forma de pagamento (se aplicável)</label>
          <input type="text" id="formaPagamentoOutros" name="formaPagamentoOutros" placeholder="Descreva a forma de pagamento">
        </div>
      `;
      
      prazosC.innerHTML = `
        <div class="form-group">
          <label for="prazoOutros" class="required">Prazo do contrato</label>
          <input type="text" id="prazoOutros" name="prazoOutros" placeholder="Ex: 12 meses, indeterminado, etc." required>
          <div class="error-message">Campo obrigatório</div>
        </div>
      `;
      
      initPessoaBlocks();
      applyMoneyMask('#valorOutros');
    }

    // ====== PESSOA FÍSICA / JURÍDICA ======
    function initPessoaBlocks() {
      $$('.pfpj-mount').forEach(el => {
        if (el.dataset.initialized) return;
        el.dataset.initialized = 'true';
        
        const role = el.dataset.role;
        const targetId = el.dataset.target;
        
        const wrap = document.createElement('div');
        wrap.className = 'pfpj-wrap';
        
        wrap.innerHTML = `
          <div class="pfpj-toggle">
            <div class="radio-item selected" data-pessoa="pf">
              <input type="radio" name="${targetId}_tipo" value="pf" checked>
              <label>👤 Pessoa Física (PF)</label>
            </div>
            <div class="radio-item" data-pessoa="pj">
              <input type="radio" name="${targetId}_tipo" value="pj">
              <label>🏢 Pessoa Jurídica (PJ)</label>
            </div>
          </div>
          <div class="pfpj-grid" data-grid="pf">
            <div class="form-group">
              <label class="required">Nome completo</label>
              <input type="text" data-field="${targetId}_pf_nome" required>
            </div>
            <div class="form-group">
              <label class="required">Nacionalidade</label>
              <input type="text" data-field="${targetId}_pf_nacionalidade" required>
            </div>
            <div class="form-group">
              <label class="required">Estado civil</label>
              <input type="text" data-field="${targetId}_pf_estado_civil" required>
            </div>
            <div class="form-group">
              <label class="required">RG/Órgão emissor</label>
              <input type="text" data-field="${targetId}_pf_rg" required>
            </div>
            <div class="form-group">
              <label class="required">CPF</label>
              <input type="text" data-field="${targetId}_pf_cpf" placeholder="999.999.999-99" required>
            </div>
            <div class="form-group">
              <label class="required">Profissão</label>
              <input type="text" data-field="${targetId}_pf_profissao" required>
            </div>
            <div class="form-group">
              <label class="required">Endereço completo</label>
              <input type="text" data-field="${targetId}_pf_endereco" required>
            </div>
            <div class="form-group">
              <label class="required">Telefone</label>
              <input type="tel" data-field="${targetId}_pf_telefone" placeholder="(67) 99999-9999" required>
            </div>
            <div class="form-group">
              <label class="required">E-mail</label>
              <input type="email" data-field="${targetId}_pf_email" placeholder="email@exemplo.com" required>
            </div>
          </div>
          <div class="pfpj-grid hidden" data-grid="pj">
            <div class="form-group">
              <label class="required">Razão social</label>
              <input type="text" data-field="${targetId}_pj_razao">
            </div>
            <div class="form-group">
              <label class="required">CNPJ</label>
              <div style="display: flex; gap: 8px; align-items: flex-end;">
                <input type="text" data-field="${targetId}_pj_cnpj" placeholder="99.999.999/9999-99" style="flex: 1;">
                <button type="button" class="btn-buscar-cnpj" data-target="${targetId}" style="padding: 10px 16px; background: var(--primary-blue); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.3s ease;">
                  🔍 Buscar
                </button>
              </div>
            </div>
            <div class="form-group">
              <label class="required">Endereço comercial</label>
              <input type="text" data-field="${targetId}_pj_endereco">
            </div>
            <div class="form-group">
              <label class="required">Telefone</label>
              <input type="tel" data-field="${targetId}_pj_telefone" placeholder="(67) 99999-9999">
            </div>
            <div class="form-group">
              <label class="required">E-mail</label>
              <input type="email" data-field="${targetId}_pj_email" placeholder="email@exemplo.com" required>
            </div>
            <div class="form-group" style="grid-column: 1 / -1;">
              <div style="background: var(--light-blue); padding: 12px; border-radius: 8px; margin-bottom: 12px;">
                <strong style="color: var(--primary-blue);">Representante Legal:</strong>
              </div>
            </div>
            <div class="form-group">
              <label class="required">Nome do representante</label>
              <input type="text" data-field="${targetId}_pj_rep_nome">
            </div>
            <div class="form-group">
              <label class="required">Nacionalidade</label>
              <input type="text" data-field="${targetId}_pj_rep_nacionalidade">
            </div>
            <div class="form-group">
              <label class="required">Estado civil</label>
              <input type="text" data-field="${targetId}_pj_rep_estado_civil">
            </div>
            <div class="form-group">
              <label class="required">Profissão</label>
              <input type="text" data-field="${targetId}_pj_rep_profissao">
            </div>
            <div class="form-group">
              <label class="required">RG/Órgão emissor</label>
              <input type="text" data-field="${targetId}_pj_rep_rg">
            </div>
            <div class="form-group">
              <label class="required">CPF</label>
              <input type="text" data-field="${targetId}_pj_rep_cpf" placeholder="999.999.999-99">
            </div>
            <div class="form-group">
              <label class="required">Endereço</label>
              <input type="text" data-field="${targetId}_pj_rep_endereco">
            </div>
            <div class="form-group">
              <label class="required">Telefone</label>
              <input type="tel" data-field="${targetId}_pj_rep_telefone" placeholder="(67) 99999-9999">
            </div>
            <div class="form-group">
              <label>E-mail (opcional)</label>
              <input type="email" data-field="${targetId}_pj_rep_email" placeholder="email@exemplo.com">
            </div>
          </div>
          <input type="hidden" name="${targetId}" id="${targetId}">
        `;
        
        el.appendChild(wrap);
        
        // Toggle PF/PJ
        wrap.querySelectorAll('.pfpj-toggle .radio-item').forEach(item => {
          item.addEventListener('click', function() {
            const tipo = this.dataset.pessoa;
            wrap.querySelectorAll('.pfpj-toggle .radio-item').forEach(i => i.classList.remove('selected'));
            this.classList.add('selected');
            this.querySelector('input[type="radio"]').checked = true;
            
            wrap.querySelectorAll('[data-grid]').forEach(grid => {
              if (grid.dataset.grid === tipo) {
                grid.classList.remove('hidden');
                grid.querySelectorAll('input').forEach(inp => inp.setAttribute('required', 'required'));
              } else {
                grid.classList.add('hidden');
                grid.querySelectorAll('input').forEach(inp => inp.removeAttribute('required'));
              }
            });
            
            updatePessoaData(wrap, targetId);
          });
        });
        
        // Máscaras
        wrap.querySelectorAll('input[data-field*="_cpf"]').forEach(inp => {
          inp.addEventListener('input', e => {
            e.target.value = maskCPF(e.target.value);
          });
          // 🔥 NOVO: Validar CPF ao sair do campo
          inp.addEventListener('blur', e => {
            const cpfValue = e.target.value.replace(/\D/g, '');
            if (cpfValue.length === 11 && !isValidCPF(cpfValue)) {
              e.target.classList.add('error');
              let errorMsg = e.target.parentNode.querySelector('.error-message');
              if (!errorMsg) {
                errorMsg = document.createElement('div');
                errorMsg.className = 'error-message';
                errorMsg.textContent = 'CPF inválido';
                e.target.parentNode.appendChild(errorMsg);
              }
              errorMsg.style.display = 'block';
              errorMsg.textContent = 'CPF inválido';
            } else {
              e.target.classList.remove('error');
              const errorMsg = e.target.parentNode.querySelector('.error-message');
              if (errorMsg) errorMsg.style.display = 'none';
            }
          });
        });
        wrap.querySelectorAll('input[data-field*="_cnpj"]').forEach(inp => {
          inp.addEventListener('input', e => {
            e.target.value = maskCNPJ(e.target.value);
          });
          // 🔥 NOVO: Validar CNPJ ao sair do campo
          inp.addEventListener('blur', e => {
            const cnpjValue = e.target.value.replace(/\D/g, '');
            if (cnpjValue.length === 14 && !isValidCNPJ(cnpjValue)) {
              e.target.classList.add('error');
              let errorMsg = e.target.parentNode.querySelector('.error-message');
              if (!errorMsg) {
                errorMsg = document.createElement('div');
                errorMsg.className = 'error-message';
                errorMsg.textContent = 'CNPJ inválido';
                e.target.parentNode.appendChild(errorMsg);
              }
              errorMsg.style.display = 'block';
              errorMsg.textContent = 'CNPJ inválido';
            } else {
              e.target.classList.remove('error');
              const errorMsg = e.target.parentNode.querySelector('.error-message');
              if (errorMsg) errorMsg.style.display = 'none';
            }
          });
        });
        wrap.querySelectorAll('input[type="tel"]').forEach(inp => {
          inp.addEventListener('input', e => e.target.value = maskPhone(e.target.value));
        });
        
        // Update em tempo real
        wrap.querySelectorAll('input').forEach(inp => {
          inp.addEventListener('input', () => updatePessoaData(wrap, targetId));
        });
        
        updatePessoaData(wrap, targetId);
      });
    }

    function updatePessoaData(wrap, targetId) {
      const radioChecked = wrap.querySelector(`input[name="${targetId}_tipo"]:checked`);
      const tipo = radioChecked?.value || 'pf'; // 🔥 CORREÇÃO: Proteção contra null
      const hiddenInput = $(`#${targetId}`);
      
      if (!hiddenInput) return; // 🔥 CORREÇÃO: Proteção adicional
      
      let data = {};
      
      if (tipo === 'pf') {
        data = {
          tipo: 'Pessoa Física',
          nome: wrap.querySelector(`[data-field="${targetId}_pf_nome"]`)?.value || '',
          nacionalidade: wrap.querySelector(`[data-field="${targetId}_pf_nacionalidade"]`)?.value || '',
          estadoCivil: wrap.querySelector(`[data-field="${targetId}_pf_estado_civil"]`)?.value || '',
          rg: wrap.querySelector(`[data-field="${targetId}_pf_rg"]`)?.value || '',
          cpf: wrap.querySelector(`[data-field="${targetId}_pf_cpf"]`)?.value || '',
          profissao: wrap.querySelector(`[data-field="${targetId}_pf_profissao"]`)?.value || '',
          endereco: wrap.querySelector(`[data-field="${targetId}_pf_endereco"]`)?.value || '',
          telefone: wrap.querySelector(`[data-field="${targetId}_pf_telefone"]`)?.value || '',
          email: wrap.querySelector(`[data-field="${targetId}_pf_email"]`)?.value || ''
        };
      } else {
        data = {
          tipo: 'Pessoa Jurídica',
          razaoSocial: wrap.querySelector(`[data-field="${targetId}_pj_razao"]`)?.value || '',
          cnpj: wrap.querySelector(`[data-field="${targetId}_pj_cnpj"]`)?.value || '',
          endereco: wrap.querySelector(`[data-field="${targetId}_pj_endereco"]`)?.value || '',
          telefone: wrap.querySelector(`[data-field="${targetId}_pj_telefone"]`)?.value || '',
          email: wrap.querySelector(`[data-field="${targetId}_pj_email"]`)?.value || '',
          representante: {
            nome: wrap.querySelector(`[data-field="${targetId}_pj_rep_nome"]`)?.value || '',
            nacionalidade: wrap.querySelector(`[data-field="${targetId}_pj_rep_nacionalidade"]`)?.value || '',
            estadoCivil: wrap.querySelector(`[data-field="${targetId}_pj_rep_estado_civil"]`)?.value || '',
            profissao: wrap.querySelector(`[data-field="${targetId}_pj_rep_profissao"]`)?.value || '',
            rg: wrap.querySelector(`[data-field="${targetId}_pj_rep_rg"]`)?.value || '',
            cpf: wrap.querySelector(`[data-field="${targetId}_pj_rep_cpf"]`)?.value || '',
            endereco: wrap.querySelector(`[data-field="${targetId}_pj_rep_endereco"]`)?.value || '',
            telefone: wrap.querySelector(`[data-field="${targetId}_pj_rep_telefone"]`)?.value || '',
            email: wrap.querySelector(`[data-field="${targetId}_pj_rep_email"]`)?.value || ''
          }
        };
      }
      
      hiddenInput.value = JSON.stringify(data);
    }

    // ====== UPLOAD DE ARQUIVOS ======
    let uploadedFiles = [];
    
    function setupFileUpload() {
      const uploadArea = $('#documentosUploadArea');
      const fileInput = $('#documentosInput');
      const fileList = $('#documentosList');
      
      uploadArea.addEventListener('click', () => fileInput.click());
      
      uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--primary-blue)';
        uploadArea.style.background = 'var(--light-blue)';
      });
      
      uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = 'var(--border-color)';
        uploadArea.style.background = 'var(--light-gray)';
      });
      
      uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--border-color)';
        uploadArea.style.background = 'var(--light-gray)';
        handleFiles(e.dataTransfer.files);
      });
      
      fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
        e.target.value = '';
      });
      
      function handleFiles(files) {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const maxFiles = 10;
        
        Array.from(files).forEach(file => {
          if (uploadedFiles.length >= maxFiles) {
            alert(`Máximo de ${maxFiles} arquivos permitidos.`);
            return;
          }
          
          if (file.size > maxSize) {
            alert(`Arquivo muito grande: ${file.name}. Máximo 10MB.`);
            return;
          }
          
          if (uploadedFiles.find(f => f.name === file.name && f.size === file.size)) {
            alert(`Arquivo já adicionado: ${file.name}`);
            return;
          }
          
          uploadedFiles.push(file);
          displayFile(file);
        });
      }
      
      function displayFile(file) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        // 🔥 CORREÇÃO: Usar createElement ao invés de innerHTML para evitar XSS
        const fileSpan = document.createElement('span');
        fileSpan.textContent = `📎 ${file.name} (${formatFileSize(file.size)})`;
        
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.textContent = 'Remover';
        removeBtn.addEventListener('click', () => removeFile(file.name, file.size));
        
        fileItem.appendChild(fileSpan);
        fileItem.appendChild(removeBtn);
        fileList.appendChild(fileItem);
      }
      
      function removeFile(fileName, fileSize) {
        uploadedFiles = uploadedFiles.filter(f => !(f.name === fileName && f.size === fileSize));
        fileList.innerHTML = '';
        uploadedFiles.forEach(file => displayFile(file));
      };
      
      function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
      }
    }

    // ====== 🔥 BUSCA CNPJ REMOVIDA (USAR SOMENTE BRASILAPI COM BOTÃO) ======
    // Comentado pois a busca é feita via BrasilAPI ao clicar no botão
    /*
    function setupCNPJLookup() {
      // Removido - usar apenas BrasilAPI com botão de busca
    }
    */
    
    // Função vazia para manter compatibilidade
    function setupCNPJLookup() {
      // Busca de CNPJ agora é feita via BrasilAPI com clique no botão
    }

    // ====== WHATSAPP ======
    $('#receberWhatsapp').addEventListener('change', function() {
      const container = $('#whatsappInputContainer');
      if (this.checked) {
        container.classList.add('show');
        $('#whatsapp').focus();
      } else {
        container.classList.remove('show');
        $('#whatsapp').value = '';
      }
    });

    $('#whatsapp').addEventListener('input', function(e) {
      e.target.value = maskPhone(e.target.value);
    });

    // Removido: telefoneSolicitante já é tratado por applyGenericPhone()

    // ====== HELPER: APLICAR MÁSCARA DE DINHEIRO ======
    function applyMoneyMask(selector) {
      const input = $(selector);
      if (input) {
        input.addEventListener('input', function(e) {
          e.target.value = maskMoney(e.target.value);
        });
      }
    }

    // ====== BUSCA CNPJ (BrasilAPI) - CORRIGIDO ======
    document.addEventListener('click', async function(e) {
      if (e.target.classList.contains('btn-buscar-cnpj')) {
        e.preventDefault();
        
        const btn = e.target;
        const targetId = btn.getAttribute('data-target');
        const cnpjInput = document.querySelector(`input[data-field="${targetId}_pj_cnpj"]`);
        
        if (!cnpjInput || !cnpjInput.value.trim()) {
          alert('Por favor, preencha o CNPJ primeiro');
          return;
        }
        
        const cnpj = cnpjInput.value.replace(/[^0-9]/g, '');
        
        if (cnpj.length !== 14) {
          alert('CNPJ deve conter 14 dígitos');
          return;
        }
        
        btn.disabled = true;
        const originalText = btn.textContent;
        btn.textContent = '⏳ Buscando...';
        btn.classList.add('loading');
        
        try {
          const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
          const data = await response.json();
          
          if (!response.ok || data.status === 404 || data.message) {
            alert('❌ CNPJ não encontrado na base de dados.\n\nPreencha os dados manualmente.');
            return;
          }
          
          if (response.ok && data && data.razao_social) {
            const razaoSocialInput = document.querySelector(`input[data-field="${targetId}_pj_razao"]`);
            const enderecoInput = document.querySelector(`input[data-field="${targetId}_pj_endereco"]`);
            const telefoneInput = document.querySelector(`input[data-field="${targetId}_pj_telefone"]`);
            
            // Função toTitleCase local para normalizar texto
            const toTitleCase = (texto) => {
              if (!texto) return '';
              return texto.toLowerCase().split(/(\s+)/).map(p => !p || /^\s+$/.test(p) ? p : p.charAt(0).toUpperCase() + p.slice(1)).join('');
            };
            
            if (razaoSocialInput) razaoSocialInput.value = toTitleCase(data.razao_social || data.nome_fantasia || '');
            
            if (enderecoInput) {
              const endereco = [
                toTitleCase(data.logradouro || ''),
                data.numero || '',
                toTitleCase(data.complemento || ''),
                toTitleCase(data.bairro || ''),
                toTitleCase(data.municipio || '')
              ].filter(x => x).join(', ').trim();
              enderecoInput.value = endereco;
            }
            
            // 🔥 Processar telefone - usar função especial para API
            let telefoneBruto = data.ddd_telefone_1 || data.ddd_telefone_2 || '';
            
            if (telefoneInput && telefoneBruto) {
              telefoneInput.value = normalizeTelefoneAPI(telefoneBruto);
            }
            
            const situacaoMap = {1: 'Nula', 2: 'Ativa', 3: 'Suspensa', 4: 'Inapta', 8: 'Desativada'};
            const situacao = situacaoMap[data.situacao_cadastral] || 'Desconhecida';
            
            // 🔥 Chamar modal moderno com OBJETO COMPLETO DA API
            showCNPJSuccessModal(data);
          } else {
            alert('❌ Erro ao processar dados da API.\n\nPreencha os dados manualmente.');
          }
        } catch (error) {
          console.error('Erro na busca CNPJ:', error);
          alert('⚠️ Erro ao buscar dados (verifique sua conexão).\n\nPreencha os dados manualmente.');
        } finally {
          btn.disabled = false;
          btn.textContent = originalText;
          btn.classList.remove('loading');
        }
      }
    });

    // ====== SUBMISSÃO ======
    $('#dataSolicitacao').valueAsDate = new Date();

    $('#contratoForm').addEventListener('submit', async function(e) {
      e.preventDefault();
      
      if (!validateCurrentSection()) {
        alert('Por favor, revise e preencha todos os campos obrigatórios.');
        return;
      }
      
      const submitBtn = $('#submitBtn');
      submitBtn.textContent = '🚀 Enviando... Aguarde até finalização';
      submitBtn.disabled = true;
      
      try {
        const formData = new FormData(this);
        
        // 🔥 NOVO: Coletar dados estruturados da outra parte envolvida
        const tipoRadio = document.querySelector(`input[name="outraParteEnvolvida_tipo"]:checked`);
        if (tipoRadio) {
          const pessoaTipo = tipoRadio.value; // 'pf' ou 'pj'
          const outraParteData = {};
          
          // Coletar todos os campos data-field
          document.querySelectorAll(`[data-field^="outraParteEnvolvida_"]`).forEach(field => {
            const fieldName = field.dataset.field;
            const value = field.value;
            
            // Extrair chave do campo: outraParteEnvolvida_pj_razao -> razao
            const subKey = fieldName.replace(`outraParteEnvolvida_${pessoaTipo}_`, '');
            outraParteData[subKey] = value;
          });
          
          // Adicionar tipo de pessoa (pf/pj)
          outraParteData.tipo = pessoaTipo;
          
          // Se tem dados, enviar como JSON
          if (Object.keys(outraParteData).length > 1) {
            formData.append('outraParteEnvolvida', JSON.stringify(outraParteData));
          }
        }
                          
        // Adicionar empresas selecionadas
        if (selectedEmpresas && selectedEmpresas.length > 0) {
          formData.append('empresasSelecionadas', JSON.stringify(selectedEmpresas));
        }

        // Adicionar arquivos
        uploadedFiles.forEach((file, index) => {                
        formData.append(`documento_${index}`, file);
        });
        
        const resp = await fetch('https://grupoparana-n8n.qkcade.easypanel.host/webhook/solicitacao-contrato', {
          method: 'POST',
          body: formData
        });
        
        // 🔥 CORREÇÃO: Melhor tratamento de erro com detalhes do servidor
        if (!resp.ok) {
          const errorData = await resp.text().catch(() => 'Erro desconhecido');
          throw new Error(`Erro ${resp.status}: ${errorData}`);
        }

        // 🔥 Parse da resposta
        let responseData;
        try {
          responseData = await resp.json();
        } catch (e) {
          responseData = { success: true };
        }

        // 🔥 Mostrar modal de sucesso com os dados
        showSuccessModal(responseData);
        
        this.reset();
        uploadedFiles = [];
        $('#documentosList').innerHTML = '';
        
        // 🔥 CORREÇÃO: Limpar campos PF/PJ dinâmicos
        $$('[data-pessoa-picker]').forEach(picker => {
          const wrap = picker.querySelector('.pfpj-wrap, .pessoa-picker-wrapper');
          if (wrap) {
            wrap.querySelectorAll('input, textarea, select').forEach(input => {
              input.value = '';
              input.classList.remove('error');
            });
            // Resetar para PF por padrão
            const pfRadio = wrap.querySelector('input[value="pf"]');
            if (pfRadio) {
              pfRadio.checked = true;
              const radioItem = pfRadio.closest('.radio-item');
              if (radioItem) {
                radioItem.classList.add('selected');
                wrap.querySelectorAll('.radio-item').forEach(item => {
                  if (item !== radioItem) item.classList.remove('selected');
                });
              }
            }
          }
        });
        
        currentSection = 1;
        selectedContractType = null;
        updateSection();
        
      } catch (err) {
        console.error('Erro no envio:', err);
        showErrorModal(err.message);
      } finally {
        submitBtn.textContent = 'Enviar Solicitação';
        submitBtn.disabled = false;
      }
    });

    // 🔥 NOVO: Função para mostrar modal de sucesso
    function showSuccessModal(data) {
      const modal = document.getElementById('successModal');
      const successId = document.getElementById('successId');
      const successType = document.getElementById('successType');
      
      // Extrair dados da resposta
      const id = data?.id || data?.data?.id || 'N/A';
      const tipo = selectedContractType || data?.type || 'Não especificado';
      
      successId.textContent = id;
      successType.textContent = tipo;
      
      modal.classList.add('show');
    }

    // 🔥 NOVO: Função para mostrar modal de erro
    function showErrorModal(errorMessage) {
      const modal = document.getElementById('errorModal');
      const errorMessageEl = document.getElementById('errorMessage');
      
      errorMessageEl.textContent = errorMessage || 'Não foi possível enviar a solicitação. Verifique sua conexão e tente novamente.';
      
      modal.classList.add('show');
    }


    const EMPRESAS_GRUPO = [
      { cnpj: '28.216.424/0001-07', nome: 'AGROPECUARIA PARANA COSTA RICA LTDA', tipo: 'CNPJ' },
      { cnpj: '26.446.792/0001-16', nome: 'AGROPECUARIA PARANA LTDA', tipo: 'CNPJ' },
      { cnpj: '33.644.529/0001-05', nome: 'ASSOCIACAO ARTE NA VIDA', tipo: 'CNPJ' },
      { cnpj: '44.739.994/0001-38', nome: 'ASSOCIACAO INSTITUTO TRANSFORMAR', tipo: 'CNPJ' },
      { cnpj: '06.088.556/0001-68', nome: 'AUREA MARIA FREZARIN ROSA', tipo: 'CNPJ' },
      { cnpj: '03.007.724/0001-55', nome: 'COMERCIO E INDUSTRIA DE CARNES PARANA LTDA', tipo: 'CNPJ' },
      { cnpj: '61.764.344/0001-61', nome: 'ETMV HOLDING E PARTICIPACOES LTDA', tipo: 'CNPJ' },
      { cnpj: '61.881.534/0001-69', nome: 'HOLDING PATRIMONIAL WSR LTDA', tipo: 'CNPJ' },
      { cnpj: '05.609.830/0001-34', nome: 'IGREJA PRESBITERIANA DE COSTA RICA - MS', tipo: 'CNPJ' },
      { cnpj: '18.819.009/0001-94', nome: 'IMBIRUSSU EMPREENDIMENTOS IMOBILIARIOS SPE - LTDA', tipo: 'CNPJ' },
      { cnpj: '38.710.390/0001-66', nome: 'LOTEAMENTO VIA PARK SPE LTDA', tipo: 'CNPJ' },
      { cnpj: '61.921.629/0001-69', nome: 'PARANA AGROHOLDING LTDA', tipo: 'CNPJ' },
      { cnpj: '09.266.801/0001-78', nome: 'PARANA EMPREENDIMENTOS LTDA', tipo: 'CNPJ' },
      { cnpj: '20.656.027/0001-44', nome: 'PARANA ENERGETICA LTDA', tipo: 'CNPJ' },
      { cnpj: '08.975.645/0001-51', nome: 'PARANA GAS COMERCIO E REPRESENTACAO LTDA', tipo: 'CNPJ' },
      { cnpj: '10.629.636/0001-50', nome: 'PARANA IMOBILIARIA CONSULTORIA E CONSTRUCAO CIVIL LTDA', tipo: 'CNPJ' },
      { cnpj: '13.329.515/0001-81', nome: 'PARANA MATERIAIS E TRANSPORTES LTDA', tipo: 'CNPJ' },
      { cnpj: '61.348.055/0001-81', nome: 'PARANA SOLUCOES CORPORATIVAS LTDA', tipo: 'CNPJ' },
      { cnpj: '24.645.517/0001-04', nome: 'PEDREIRA BASALTO LTDA', tipo: 'CNPJ' },
      { cnpj: '04.287.065/0001-10', nome: 'RADIO RECANTO DAS AGUAS LTDA', tipo: 'CNPJ' },
      { cnpj: '06.088.542/0001-44', nome: 'VT PARANA SUPERMERCADO LTDA', tipo: 'CNPJ' },
      { cnpj: '06.088.542/0002-25', nome: 'VT PARANA SUPERMERCADO LTDA', tipo: 'CNPJ' },
      { cnpj: '06.088.542/0003-06', nome: 'VT PARANA SUPERMERCADO LTDA', tipo: 'CNPJ' },
      { cnpj: '06.088.542/0004-97', nome: 'VT PARANA SUPERMERCADO LTDA', tipo: 'CNPJ' },
      { cnpj: '900.552.331-04', nome: 'ELIZANDRA THAIS FREZARIN ROSA MATSUMOTO', tipo: 'CPF' },
      { cnpj: '241.163.439-00', nome: 'ÁUREA MARIA FREZARIN ROSA', tipo: 'CPF' },
      { cnpj: '326.120.019-72', nome: 'WALDELI DOS SANTOS ROSA', tipo: 'CPF' },
      { cnpj: '012.377.901-40', nome: 'MARCOS VINICIUS FREZARIN ROSA', tipo: 'CPF' }
    ];

    let selectedEmpresas = [];

    function initMultiSelect() {
      const toggle = $('#empresasToggle');
      const dropdown = $('#empresasDropdown');
      const search = $('#empresasSearch');
      const optionsDiv = $('#empresasOptions');
      const display = $('#empresasDisplay');
      const selectedDiv = $('#selectedEmpresas');
      const dataDiv = $('#empresasDataDisplay');

      // Preencher opções
      function renderOptions(filter = '') {
        optionsDiv.innerHTML = '';
        const filtered = EMPRESAS_GRUPO.filter(e => 
          e.nome.toLowerCase().includes(filter.toLowerCase()) || 
          e.cnpj.includes(filter)
        );

        if (filtered.length === 0) {
          optionsDiv.innerHTML = '<div style="padding: 10px; text-align: center; color: var(--text-secondary);">Nenhuma empresa encontrada</div>';
          return;
        }

        filtered.forEach(empresa => {
          const isSelected = selectedEmpresas.some(e => e.cnpj === empresa.cnpj);
          const item = document.createElement('div');
          item.className = 'multiselect-option';
          item.innerHTML = `
            <input type="checkbox" id="empresa_${empresa.cnpj.replace(/[^0-9]/g, '')}" ${isSelected ? 'checked' : ''}>
            <label for="empresa_${empresa.cnpj.replace(/[^0-9]/g, '')}" style="font-size: 12px;">
              <strong>${empresa.nome}</strong><br>
              <small style="color: var(--text-secondary);">${empresa.tipo}: ${empresa.cnpj}</small>
            </label>
          `;
          
          const checkbox = item.querySelector('input[type="checkbox"]');
          checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
              selectedEmpresas.push(empresa);
            } else {
              selectedEmpresas = selectedEmpresas.filter(e => e.cnpj !== empresa.cnpj);
            }
            updateDisplay();
            renderOptions(search.value);
          });
          
          optionsDiv.appendChild(item);
        });
      }

      function updateDisplay() {
        // Atualizar toggle display
        if (selectedEmpresas.length === 0) {
          display.textContent = 'Selecione as empresas...';
        } else {
          display.textContent = `${selectedEmpresas.length} empresa(s) selecionada(s)`;
        }

        // Atualizar tags
        selectedDiv.innerHTML = '';
        selectedEmpresas.forEach(empresa => {
          const tag = document.createElement('div');
          tag.className = 'selected-item';
          tag.innerHTML = `
            <span>${empresa.nome.substring(0, 30)}...</span>
            <button type="button" onclick="removeEmpresa('${empresa.cnpj}')">×</button>
          `;
          selectedDiv.appendChild(tag);
        });

        // Atualizar dados exibidos
        if (selectedEmpresas.length > 0) {
          dataDiv.innerHTML = '<strong style="color: var(--primary-blue); display: block; margin-bottom: 8px;">Empresas selecionadas:</strong>';
          selectedEmpresas.forEach(empresa => {
            const dataItem = document.createElement('div');
            dataItem.className = 'company-data-display';
            dataItem.innerHTML = `
              <div class="company-data-item"><span class="company-data-label">Empresa:</span> ${empresa.nome}</div>
              <div class="company-data-item"><span class="company-data-label">${empresa.tipo}:</span> ${empresa.cnpj}</div>
              <div style="border-top: 1px solid rgba(0,74,201,.2); margin-top: 6px; padding-top: 6px;"></div>
            `;
            dataDiv.appendChild(dataItem);
          });
        } else {
          dataDiv.innerHTML = '';
        }
        
        // Validação
        const errorDiv = $('#empresasError');
        if (selectedEmpresas.length > 0) {
          errorDiv.style.display = 'none';
        }
      }

      // Toggle dropdown
      toggle.addEventListener('click', () => {
        dropdown.classList.toggle('show');
        if (dropdown.classList.contains('show')) {
          search.focus();
          renderOptions();
        }
      });

      // Busca
      search.addEventListener('input', (e) => {
        renderOptions(e.target.value);
      });

      // Fechar dropdown ao clicar fora
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.multiselect-wrapper')) {
          dropdown.classList.remove('show');
        }
      });

      renderOptions();
    }

    function removeEmpresa(cnpj) {
      selectedEmpresas = selectedEmpresas.filter(e => e.cnpj !== cnpj);
      const dropdown = $('#empresasDropdown');
      const search = $('#empresasSearch');
      const optionsDiv = $('#empresasOptions');
      
      function renderOptions(filter = '') {
        optionsDiv.innerHTML = '';
        const filtered = EMPRESAS_GRUPO.filter(e => 
          e.nome.toLowerCase().includes(filter.toLowerCase()) || 
          e.cnpj.includes(filter)
        );

        if (filtered.length === 0) {
          optionsDiv.innerHTML = '<div style="padding: 10px; text-align: center; color: var(--text-secondary);">Nenhuma empresa encontrada</div>';
          return;
        }

        filtered.forEach(empresa => {
          const isSelected = selectedEmpresas.some(e => e.cnpj === empresa.cnpj);
          const item = document.createElement('div');
          item.className = 'multiselect-option';
          item.innerHTML = `
            <input type="checkbox" id="empresa_${empresa.cnpj.replace(/[^0-9]/g, '')}" ${isSelected ? 'checked' : ''}>
            <label for="empresa_${empresa.cnpj.replace(/[^0-9]/g, '')}" style="font-size: 12px;">
              <strong>${empresa.nome}</strong><br>
              <small style="color: var(--text-secondary);">${empresa.tipo}: ${empresa.cnpj}</small>
            </label>
          `;
          
          const checkbox = item.querySelector('input[type="checkbox"]');
          checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
              selectedEmpresas.push(empresa);
            } else {
              selectedEmpresas = selectedEmpresas.filter(e => e.cnpj !== empresa.cnpj);
            }
            updateDisplay();
            renderOptions(search.value);
          });
          
          optionsDiv.appendChild(item);
        });
      }

      function updateDisplay() {
        const toggle = $('#empresasToggle');
        const display = $('#empresasDisplay');
        const selectedDiv = $('#selectedEmpresas');
        const dataDiv = $('#empresasDataDisplay');
        const errorDiv = $('#empresasError');

        if (selectedEmpresas.length === 0) {
          display.textContent = 'Selecione as empresas...';
        } else {
          display.textContent = `${selectedEmpresas.length} empresa(s) selecionada(s)`;
        }

        selectedDiv.innerHTML = '';
        selectedEmpresas.forEach(empresa => {
          const tag = document.createElement('div');
          tag.className = 'selected-item';
          tag.innerHTML = `
            <span>${empresa.nome.substring(0, 30)}...</span>
            <button type="button" onclick="removeEmpresa('${empresa.cnpj}')">×</button>
          `;
          selectedDiv.appendChild(tag);
        });

        if (selectedEmpresas.length > 0) {
          dataDiv.innerHTML = '<strong style="color: var(--primary-blue); display: block; margin-bottom: 8px;">Empresas selecionadas:</strong>';
          selectedEmpresas.forEach(empresa => {
            const dataItem = document.createElement('div');
            dataItem.className = 'company-data-display';
            dataItem.innerHTML = `
              <div class="company-data-item"><span class="company-data-label">Empresa:</span> ${empresa.nome}</div>
              <div class="company-data-item"><span class="company-data-label">${empresa.tipo}:</span> ${empresa.cnpj}</div>
              <div style="border-top: 1px solid rgba(0,74,201,.2); margin-top: 6px; padding-top: 6px;"></div>
            `;
            dataDiv.appendChild(dataItem);
          });
        } else {
          dataDiv.innerHTML = '';
        }
        
        if (selectedEmpresas.length > 0) {
          errorDiv.style.display = 'none';
        }
      }

      renderOptions();
      updateDisplay();
    }


        // ====== INICIALIZAÇÃO ======
    updateSection();
    setupFileUpload();
    document.addEventListener("DOMContentLoaded", initMultiSelect);
</script>



<script>
(function(){
  function ensureAfter(el, node){
    if (!el || !node) return;
    if (el.nextElementSibling && el.nextElementSibling.classList && el.nextElementSibling.classList.contains('field-msg')){
      return el.nextElementSibling;
    }
    el.parentNode.insertBefore(node, el.nextSibling);
    return node;
  }
  function makeMsgEl(){
    var s = document.createElement('div');
    s.className = 'field-msg hint';
    s.setAttribute('aria-live','polite');
    return s;
  }
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
  function setupEmail(el){
    if (!el || el.dataset._emailSetup==='1') return;
    el.dataset._emailSetup='1';
    el.type = 'email';
    el.autocomplete = 'email';
    el.spellcheck = false;
    el.setAttribute('pattern', EMAIL_RE.source);
    el.setAttribute('title', 'Informe um e-mail válido (ex.: nome@empresa.com.br)');
    if (!el.placeholder) el.placeholder = 'nome@empresa.com.br';
    var msg = makeMsgEl(); ensureAfter(el, msg); msg.textContent = 'Ex.: nome@empresa.com.br';
    function validate(){
      var v = (el.value || '').trim();
      if (v && !EMAIL_RE.test(v)){
        el.setCustomValidity('E-mail inválido. Use algo como nome@empresa.com.br');
        msg.className = 'field-msg error'; msg.textContent = 'E-mail inválido. Ex.: nome@empresa.com.br';
      } else {
        el.setCustomValidity(''); msg.className = 'field-msg hint'; msg.textContent = v ? '' : 'Ex.: nome@empresa.com.br';
      }
    }
    el.addEventListener('input', validate);
    el.addEventListener('blur', validate);
  }
  function setupRequired(el){
    if (!el || el.dataset.reqMsgSetup === '1') return;
    el.dataset.reqMsgSetup = '1';
    var msg = el.nextElementSibling && el.nextElementSibling.classList && el.nextElementSibling.classList.contains('field-msg') ? el.nextElementSibling : makeMsgEl();
    ensureAfter(el, msg);
    function check(){
      var val = (el.value || '').trim();
      var invalid = !val;
      if (el.type === 'file'){
        invalid = !el.files || el.files.length === 0;
      }
      if (invalid){
        msg.className = 'field-msg error';
        msg.textContent = 'Preenchimento obrigatório para prosseguir.';
      } else {
        if (el.type !== 'email'){
          msg.className = 'field-msg hint';
          msg.textContent = '';
        }
      }
    }
    el.addEventListener('input', check);
    el.addEventListener('blur', check);
  }
  document.addEventListener('DOMContentLoaded', function(){
    var emailNodes = Array.prototype.slice.call(document.querySelectorAll('input[type="email"], input[name*="email" i], input[id*="email" i]'));
    emailNodes.forEach(setupEmail);
    var reqNodes = Array.prototype.slice.call(document.querySelectorAll('[required], input[aria-required="true"], textarea[aria-required="true"], select[aria-required="true"]'));
    reqNodes.forEach(setupRequired);
  });
})();
</script>








<script>
(function(){
  function onlyDigits(s){ return (s || '').replace(/\D+/g,''); }
  // Funções removidas - usando maskPhone diretamente
  // Função removida - usando maskPhone diretamente como na seção 3
  document.addEventListener('DOMContentLoaded', function(){
    // Aplicar maskPhone ao telefoneSolicitante (igual à seção 3)
    const telInput = document.getElementById('telefoneSolicitante');
    if (telInput) {
      telInput.addEventListener('input', function(e) {
        e.target.value = maskPhone(e.target.value);
      });
    }
  });
})();
</script>

<script>
(function(){
  function isVisible(el){
    if (!el) return false;
    // robust: rely on rendered boxes
    if (typeof el.getClientRects === 'function' && el.getClientRects().length === 0) return false;
    var st = window.getComputedStyle(el);
    if (st.display === 'none' || st.visibility === 'hidden' || parseFloat(st.opacity) === 0) return false;
    return true;
  }
  function clearHiddenValidity(scope){
    var nodes = Array.prototype.slice.call((scope || document).querySelectorAll('input, select, textarea'));
    nodes.forEach(function(el){
      if (!isVisible(el)){
        try { el.setCustomValidity && el.setCustomValidity(''); } catch(e){}
      }
    });
  }
  function firstVisibleInvalid(scope){
    var nodes = Array.prototype.slice.call((scope || document).querySelectorAll('input, select, textarea'));
    for (var i=0;i<nodes.length;i++){
      var el = nodes[i];
      if (!isVisible(el)) continue;
      try { el.dispatchEvent(new Event('input', {bubbles:true})); } catch(e){}
      if (typeof el.checkValidity === 'function' && !el.checkValidity()){
        return el;
      }
    }
    return null;
  }
  // 🔥 VALIDAÇÃO BLOQUEADORA DE CPF/CNPJ
  function validateDocumentsBeforeAdvance() {
    console.log('🔍 Validando CPF/CNPJ antes de avançar...');
    
    // Procurar campos por data-field (que é o padrão do seu formulário)
    var allInputs = document.querySelectorAll('input[data-field], input[type="text"], input[type="tel"]');
    var hasError = false;
    var errorMsg = '';
    
    allInputs.forEach(function(input) {
      if (!isVisible(input)) return;
      
      var id = (input.id || '').toLowerCase();
      var name = (input.name || '').toLowerCase();
      var dataField = (input.dataset.field || '').toLowerCase();
      var value = (input.value || '').trim();
      
      // Se o campo está vazio, pula
      if (!value) return;
      
      // Validar CPF por data-field ou id/name
      if ((dataField.includes('_cpf') || id.includes('cpf') || name.includes('cpf')) && value) {
        console.log('📋 Validando CPF:', value, 'data-field:', dataField);
        if (!isValidCPFValue(value)) {
          console.log('❌ CPF INVÁLIDO:', value);
          hasError = true;
          errorMsg = window._lastCPFError || 'CPF inválido. Verifique os dígitos.';
          input.classList.add('error');
          input.focus();
          input.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        } else {
          input.classList.remove('error');
        }
      }
      
      // Validar CNPJ por data-field ou id/name
      if ((dataField.includes('_cnpj') || id.includes('cnpj') || name.includes('cnpj')) && value) {
        console.log('📋 Validando CNPJ:', value, 'data-field:', dataField);
        if (!isValidCNPJValue(value)) {
          console.log('❌ CNPJ INVÁLIDO:', value);
          hasError = true;
          errorMsg = window._lastCNPJError || 'CNPJ inválido. Verifique os dígitos.';
          input.classList.add('error');
          input.focus();
          input.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        } else {
          input.classList.remove('error');
        }
      }
    });
    
    if (hasError) {
      alert('❌ Erro: ' + errorMsg);
      return false;
    }
    console.log('✅ CPF/CNPJ validados com sucesso!');
    return true;
  }
  
  document.addEventListener('click', function(ev){
    var nextSel = '[data-next], .btn-next, button.next, button.avancar, button[data-action=\"next\"]';
    var btn = ev.target.closest(nextSel);
    if (!btn) return;
    
    // 🔥 BLOQUEAR COM VALIDAÇÃO DE CPF/CNPJ
    if (!validateDocumentsBeforeAdvance()) {
      ev.preventDefault();
      ev.stopImmediatePropagation();
      console.log('🛑 BLOQUEADO! CPF/CNPJ inválido');
      return false;
    }
    
    // 🔥 PRODUCTION_MODE: Verificar se deve validar
    if (!PRODUCTION_MODE) {
      console.log('✅ MODO TESTE: Validação desativada - Avançando livremente');
      return true; // Permite avançar sem validar
    }
    
    var active = document.querySelector('[data-section].active') || document;
    clearHiddenValidity(active);
    var bad = firstVisibleInvalid(active);
    if (bad){
      ev.preventDefault();
      ev.stopImmediatePropagation();
      try { bad.reportValidity && bad.reportValidity(); } catch(e){}
      try { bad.scrollIntoView({behavior:'smooth', block:'center'}); } catch(e){}
      try { bad.focus && bad.focus({preventScroll:true}); } catch(e){}
    }
  }, true);
})();
</script>

<script>
(function(){
  // === Visibility helpers ===
  function isVisible(el){
    if (!el) return false;
    if (typeof el.getClientRects === 'function' && el.getClientRects().length === 0) return false;
    var st = window.getComputedStyle(el);
    if (st.display === 'none' || st.visibility === 'hidden' || parseFloat(st.opacity) === 0) return false;
    return true;
  }

  // === Auto-clear hidden values on PF<->PJ (or any show/hide) ===
  function clearHiddenValues(scope){
    var nodes = Array.prototype.slice.call((scope || document).querySelectorAll('input, select, textarea'));
    nodes.forEach(function(el){
      if (isVisible(el)) return;
      // Clear value of hidden fields so they won't be submitted/validated later
      if (el.matches('input[type="checkbox"], input[type="radio"]')){
        el.checked = false;
      } else if (el.type === 'file'){
        try { el.value = ''; } catch(e){}
      } else {
        el.value = '';
      }
      try { el.setCustomValidity && el.setCustomValidity(''); } catch(e){}
    });
  }

  // Resync after PF/PJ toggles: listen for changes and DOM mutations
  function resyncActive(){
    var active = document.querySelector('[data-section].active') || document;
    clearHiddenValues(active);
  }
  document.addEventListener('change', function(){
    setTimeout(resyncActive, 30);
  }, true);
  var mo = new MutationObserver(function(){
    resyncActive();
  });
  document.addEventListener('DOMContentLoaded', function(){
    resyncActive();
    mo.observe(document.body, {attributes:true, childList:true, subtree:true, attributeFilter:['style','class','hidden','aria-hidden']});
  });

  // === Hard validation on Next (visible fields only) with explicit CPF/CNPJ checks ===
  function onlyDigits(s){ return (s || '').replace(/\D+/g,''); }
  
  // 🔥 VALIDAÇÃO ROBUSTA DE CPF COM MENSAGENS
  function isValidCPFValue(v){
    var s = onlyDigits(v);
    if (s.length !== 11) {
      window._lastCPFError = 'CPF deve conter 11 dígitos.';
      return false;
    }
    if (/^(\d)\1{10}$/.test(s)) {
      window._lastCPFError = 'CPF inválido (dígitos repetidos).';
      return false;
    }
    var n = s.split('').map(function(x){return parseInt(x,10);});
    var sum=0;
    for (var i=0;i<9;i++) sum += n[i]*(10-i);
    var d1 = 11 - (sum % 11); if (d1 >= 10) d1 = 0;
    if (d1 !== n[9]) {
      window._lastCPFError = 'CPF com dígito verificador inválido.';
      return false;
    }
    sum=0;
    for (i=0;i<10;i++) sum += n[i]*(11-i);
    var d2 = 11 - (sum % 11); if (d2 >= 10) d2 = 0;
    if (d2 !== n[10]) {
      window._lastCPFError = 'CPF com dígito verificador inválido.';
      return false;
    }
    window._lastCPFError = '';
    return true;
  }
  
  // 🔥 VALIDAÇÃO ROBUSTA DE CNPJ COM MENSAGENS
  function isValidCNPJValue(v){
    var s = onlyDigits(v);
    if (s.length !== 14) {
      window._lastCNPJError = 'CNPJ deve conter 14 dígitos.';
      return false;
    }
    if (/^(\d)\1{13}$/.test(s)) {
      window._lastCNPJError = 'CNPJ inválido (dígitos repetidos).';
      return false;
    }
    var calc=function(digs){
      var pos=digs.length-7,sum=0;
      for (var i=0;i<digs.length;i++){
        sum += parseInt(digs[i],10) * pos--;
        if (pos < 2) pos = 9;
      }
      var r = sum % 11;
      return (r < 2) ? 0 : 11 - r;
    };
    var n12=s.substring(0,12);
    var d1=calc(n12);
    var d2=calc(n12 + String(d1));
    if (s !== n12 + String(d1) + String(d2)) {
      window._lastCNPJError = 'CNPJ com dígito verificador inválido.';
      return false;
    }
    window._lastCNPJError = '';
    return true;
  }
  
  // 🔥 VALIDAÇÃO EM TEMPO REAL PARA CPF/CNPJ
  function setupDocFieldValidation(){
    var cpfFields = Array.prototype.slice.call(document.querySelectorAll('input[id*="cpf" i], input[name*="cpf" i]'));
    var cnpjFields = Array.prototype.slice.call(document.querySelectorAll('input[id*="cnpj" i], input[name*="cnpj" i]'));
    
    cpfFields.forEach(function(el){
      if (el.dataset._cpfValidSetup) return;
      el.dataset._cpfValidSetup = '1';
      el.addEventListener('input', function(){
        if (this.value.trim()) {
          if (!isValidCPFValue(this.value)) {
            this.setCustomValidity(window._lastCPFError || 'CPF inválido');
            this.classList.add('error');
          } else {
            this.setCustomValidity('');
            this.classList.remove('error');
          }
        }
      });
      el.addEventListener('blur', function(){
        if (this.value.trim()) {
          if (!isValidCPFValue(this.value)) {
            this.setCustomValidity(window._lastCPFError || 'CPF inválido');
            this.classList.add('error');
          } else {
            this.setCustomValidity('');
            this.classList.remove('error');
          }
        }
      });
    });
    
    cnpjFields.forEach(function(el){
      if (el.dataset._cnpjValidSetup) return;
      el.dataset._cnpjValidSetup = '1';
      el.addEventListener('input', function(){
        if (this.value.trim()) {
          if (!isValidCNPJValue(this.value)) {
            this.setCustomValidity(window._lastCNPJError || 'CNPJ inválido');
            this.classList.add('error');
          } else {
            this.setCustomValidity('');
            this.classList.remove('error');
          }
        }
      });
      el.addEventListener('blur', function(){
        if (this.value.trim()) {
          if (!isValidCNPJValue(this.value)) {
            this.setCustomValidity(window._lastCNPJError || 'CNPJ inválido');
            this.classList.add('error');
          } else {
            this.setCustomValidity('');
            this.classList.remove('error');
          }
        }
      });
    });
  }

  function firstVisibleInvalid(scope){
    var nodes = Array.prototype.slice.call((scope || document).querySelectorAll('input, select, textarea'));
    for (var i=0;i<nodes.length;i++){
      var el = nodes[i];
      if (!isVisible(el)) { try { el.setCustomValidity && el.setCustomValidity(''); } catch(e){}; continue; }
      // Force any existing listeners to run
      try { el.dispatchEvent(new Event('input', {bubbles:true})); } catch(e){}
      // Extra: explicit CPF/CNPJ validation even if field is not 'required'
      var nameId = (el.name || '') + ' ' + (el.id || '');
      var v = (el.value || '').trim();
      if (v){
        if (/\bcpf\b/i.test(nameId)){
          if (!isValidCPFValue(v)){
            try { el.setCustomValidity && el.setCustomValidity(window._lastCPFError || 'CPF inválido. Revise os dígitos.'); } catch(e){}
            el.classList.add('error');
          }
        } else if (/\bcnpj\b/i.test(nameId)){
          if (!isValidCNPJValue(v)){
            try { el.setCustomValidity && el.setCustomValidity(window._lastCNPJError || 'CNPJ inválido. Revise os dígitos.'); } catch(e){}
            el.classList.add('error');
          }
        }
      }
      // Native validity (includes our setCustomValidity)
      if (typeof el.checkValidity === 'function' && !el.checkValidity()){
        return el;
      }
    }
    return null;
  }
  
  document.addEventListener('DOMContentLoaded', function(){
    setupDocFieldValidation();
  });

  document.addEventListener('click', function(ev){
    var nextSel = '[data-next], .btn-next, button.next, button.avancar, button[data-action="next"]';
    var btn = ev.target.closest(nextSel);
    if (!btn) return;
    
    // 🔥 PRODUCTION_MODE: Verificar se deve validar
    if (!PRODUCTION_MODE) {
      console.log('✅ MODO TESTE: Validação desativada - Avançando livremente');
      return true; // Permite avançar sem validar
    }
    
    var active = document.querySelector('[data-section].active') || document;
    var bad = firstVisibleInvalid(active);
    if (bad){
      ev.preventDefault();
      ev.stopImmediatePropagation();
      try { bad.reportValidity && bad.reportValidity(); } catch(e){}
      try { bad.scrollIntoView({behavior:'smooth', block:'center'}); } catch(e){}
      try { bad.focus && bad.focus({preventScroll:true}); } catch(e){}
    }
  }, true);
})();
</script>

<!-- 🔥 NOVO: Script para inicializar campos de detalhe de pagamento -->
<script>
document.addEventListener('DOMContentLoaded', function() {
  // Inicializar listeners para campos de forma de pagamento
  const paymentSelects = [
    { id: 'formaPagamento', type: 'compravenda' },
    { id: 'formaPagamentoCV', type: 'imovel' },
    { id: 'formaPagamentoLoc', type: 'locacao' }
  ];
  
  paymentSelects.forEach(select => {
    const el = document.getElementById(select.id);
    if (el) {
      el.addEventListener('change', function() {
        togglePaymentDetail(select.type);
      });
    }
  });
});
</script>

<!-- Modal de Sucesso -->
<div class="success-modal" id="successModal">
  <div class="success-content">
    <div class="success-icon">✅</div>
    <h2>Solicitação Enviada!</h2>
    <div class="success-meta">
      <p><span class="label">ID:</span> <span id="successId">—</span></p>
      <p><span class="label">Tipo:</span> <span id="successType">—</span></p>
    </div>
    <p id="successMessage">Sua solicitação de contrato foi enviada com sucesso. Em breve nossa equipe jurídica fará a análise.</p>
    <button class="success-btn" onclick="location.reload()">Nova Solicitação</button>
  </div>
</div>

<!-- Modal de Erro -->
<div class="error-modal" id="errorModal">
  <div class="error-content">
    <div class="error-icon">❌</div>
    <h2>Erro ao Enviar</h2>
    <p id="errorMessage">Não foi possível enviar a solicitação. Verifique sua conexão e tente novamente.</p>
    <button class="error-btn" onclick="document.getElementById('errorModal').classList.remove('show')">Tentar Novamente</button>
  </div>
</div>

    <script>
      // Modal CNPJ Success - Estilo Moderno (igual ao success-modal)
      function closeModalCNPJ() {
        const modal = document.getElementById('cnpjSuccessModal');
        if (modal) {
          modal.classList.remove('show');
        }
      }
      
      // Fechar modal ao clicar no fundo
      document.addEventListener('click', function(e) {
        const modal = document.getElementById('cnpjSuccessModal');
        if (modal && e.target === modal) {
          closeModalCNPJ();
        }
      });
      
      // Fechar com ESC
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
          closeModalCNPJ();
        }
      });

      /**
       * 🔥 NORMALIZAÇÃO DE TEXTOS (Razão Social, Endereço, etc)
       * 
       * Converte textos em UPPER CASE ou lower case para Title Case
       * Cada palavra começa com maiúscula
       */
      function normalizeTexto(texto) {
        if (!texto || texto === 'N/A') return 'N/A';
        
        // Converter para string
        texto = String(texto).trim();
        if (!texto) return 'N/A';
        
        // Se estiver todo em maiúscula ou minúscula, converter para title case
        // Dividir em palavras e capitalizar cada uma
        return texto
          .toLowerCase() // Primeiro converter tudo para minúscula
          .split(/(\s+)/) // Dividir preservando espaços
          .map(palavra => {
            // Se for espaço ou vazio, retornar como está
            if (!palavra || /^\s+$/.test(palavra)) return palavra;
            
            // Capitalizar primeira letra
            return palavra.charAt(0).toUpperCase() + palavra.slice(1);
          })
          .join(''); // Juntar de novo
      }

      /**
       * 🔥 FORMATAR DATA BRASILEIRA
       * 
       * Converte data ISO (2025-01-15) ou timestamp para formato brasileiro (15/01/2025)
       */
      function formatarDataBrasileira(data) {
        if (!data || data === 'N/A') return 'N/A';
        
        try {
          // Se for timestamp (número)
          if (typeof data === 'number') {
            data = new Date(data);
          } else if (typeof data === 'string') {
            // Tentar fazer parsing de diferentes formatos
            if (data.includes('-')) {
              // Formato ISO: 2025-01-15
              data = new Date(data + 'T00:00:00');
            } else if (data.includes('/')) {
              // Já está em formato brasileiro? Retornar como está
              return data;
            } else {
              // Tentar fazer parsing direto
              data = new Date(data);
            }
          }
          
          // Se não conseguir fazer parsing, retornar N/A
          if (isNaN(data.getTime())) return 'N/A';
          
          // Formatar como DD/MM/YYYY
          const dia = String(data.getDate()).padStart(2, '0');
          const mes = String(data.getMonth() + 1).padStart(2, '0');
          const ano = data.getFullYear();
          
          return `${dia}/${mes}/${ano}`;
        } catch(e) {
          return 'N/A';
        }
      }

      /**
       * 🔥 OBTER COR E ESTILO DA SITUAÇÃO
       */
      function obterEstiloSituacao(situacao) {
        const sit = String(situacao || '').toLowerCase().trim();
        
        if (sit.includes('ativa') || sit === 'ativa') {
          return {
            color: '#27AE60',
            backgroundColor: '#d4edda',
            borderColor: '#27AE60'
          };
        } else if (sit.includes('inativa') || sit === 'inativa' || sit.includes('baixada')) {
          return {
            color: '#d93025',
            backgroundColor: '#f8d7da',
            borderColor: '#d93025'
          };
        } else if (sit.includes('análise') || sit.includes('analise')) {
          return {
            color: '#ff9800',
            backgroundColor: '#fff3cd',
            borderColor: '#ff9800'
          };
        } else {
          return {
            color: '#666',
            backgroundColor: '#e9ecef',
            borderColor: '#999'
          };
        }
      }

      /**
       * 🔥 NORMALIZAÇÃO CORRETA DE TELEFONE BRASILEIRO
       * 
       * Padrão Brasileiro:
       * - Móvel: (XX) 9XXXX-XXXX (11 dígitos, começando com 9 após DDD)
       * - Fixo:  (XX) XXXX-XXXX  (10 dígitos, não começando com 9)
       * 
       * A API pode retornar:
       * - Somente números: "11987654321" ou "1133334444"
       * - Com formatação: "(11) 98765-4321" ou "(11) 3333-4444"
       * - Formatação errada: "(67) 9964-1096" (faltando um 9 no móvel)
       * - Com espaços e caracteres
       */
      function normalizeTelefoneAPI(telefone) {
        if (!telefone || telefone === 'N/A') return 'N/A';
        
        // Remover todos os caracteres não-numéricos
        let apenasNumeros = telefone.replace(/\D/g, '');
        
        // Se não tiver dígitos, retornar N/A
        if (!apenasNumeros) return 'N/A';
        
        // Se começar com 0, remover (era código de interurbano antigo)
        if (apenasNumeros.startsWith('0')) {
          apenasNumeros = apenasNumeros.substring(1);
        }
        
        let ddd = '';
        let numero = '';
        
        // ✅ NOVA LÓGICA: Detectar se é móvel (tem 9) ou fixo
        // Se tiver 9 números: pode ser móvel sem DDD ou fixo sem DDD
        // Se tiver 10 números: fixo com DDD
        // Se tiver 11 números: móvel com DDD
        
        if (apenasNumeros.length === 9) {
          numero = apenasNumeros;
          if (numero.startsWith('9')) {
            return `9${numero.substring(0, 4)}-${numero.substring(4)}`;
          } else {
            return `${numero.substring(0, 4)}-${numero.substring(4)}`;
          }
        } else if (apenasNumeros.length === 10) {
          ddd = apenasNumeros.substring(0, 2);
          numero = apenasNumeros.substring(2);
          return `(${ddd}) ${numero.substring(0, 4)}-${numero.substring(4)}`;
        } else if (apenasNumeros.length === 11) {
          ddd = apenasNumeros.substring(0, 2);
          numero = apenasNumeros.substring(2);
          if (numero.startsWith('9')) {
            return `(${ddd}) ${numero.substring(0, 5)}-${numero.substring(5)}`;
          } else {
            return `(${ddd}) ${numero.substring(0, 5)}-${numero.substring(5)}`;
          }
        } else if (apenasNumeros.length === 12) {
          ddd = apenasNumeros.substring(0, 2);
          numero = apenasNumeros.substring(2);
          return `(${ddd}) ${numero.substring(0, 5)}-${numero.substring(5)}`;
        } else {
          if (apenasNumeros.length > 10) {
            ddd = apenasNumeros.substring(0, 2);
            numero = apenasNumeros.substring(2);
            return `(${ddd}) ${numero.substring(0, 5)}-${numero.substring(5)}`;
          } else if (apenasNumeros.length > 4) {
            return apenasNumeros.replace(/(\d{4})(\d+)$/, '$1-$2');
          }
          return apenasNumeros;
        }
      }

      /**
       * 🔥 TRATAMENTO ROBUSTO DE ERROS DA API
       */
      function handleAPIError(error, status) {
        const errorModal = document.getElementById('errorModal');
        const errorMessage = document.getElementById('errorMessage');
        let mensagem = 'Erro ao comunicar com a API. Tente novamente.';
        
        // Tratamento por status HTTP
        switch(status) {
          case 400:
            // Bad Request - Problema no CNPJ
            if (error.name === 'BadRequestError') {
              mensagem = error.message || 'CNPJ inválido. Verifique o formato (XX.XXX.XXX/XXXX-XX).';
            } else {
              mensagem = error.message || 'Solicitação inválida. Verifique os dados informados.';
            }
            break;
            
          case 404:
            // Not Found - CNPJ não encontrado
            if (error.name === 'NotFoundError') {
              mensagem = error.message || 'CNPJ não encontrado na base de dados. Verifique o número informado.';
            } else {
              mensagem = 'Recurso não encontrado. Verifique os dados e tente novamente.';
            }
            break;
            
          case 401:
            mensagem = 'Autenticação falhou. Contate o administrador do sistema.';
            break;
            
          case 403:
            mensagem = 'Acesso negado. Você não tem permissão para esta operação.';
            break;
            
          case 429:
            mensagem = 'Muitas solicitações. Aguarde alguns momentos e tente novamente.';
            break;
            
          case 500:
          case 502:
          case 503:
          case 504:
            mensagem = 'Erro no servidor. Tente novamente em alguns momentos.';
            break;
            
          default:
            mensagem = error.message || 'Erro desconhecido ao processar a solicitação.';
        }
        
        // Atualizar e mostrar modal de erro
        errorMessage.textContent = mensagem;
        errorMessage.style.whiteSpace = 'pre-wrap';
        errorMessage.style.wordWrap = 'break-word';
        errorModal.classList.add('show');
        
        // Ativar botão se estava desativado
        const btns = document.querySelectorAll('.btn-buscar-cnpj');
        btns.forEach(btn => {
          btn.disabled = false;
          btn.classList.remove('loading');
          btn.textContent = 'Buscar CNPJ';
        });
        
        console.error(`API Error [${status}]:`, error);
      }

      /**
       * 🔥 CONVERTER PARA TITLE CASE (Primeira letra maiúscula)
       */
      function toTitleCase(texto) {
        if (!texto || texto === 'N/A' || texto === null) return 'N/A';
        
        texto = String(texto).trim();
        if (!texto) return 'N/A';
        
        return texto
          .toLowerCase()
          .split(/(\s+)/)
          .map(palavra => {
            if (!palavra || /^\s+$/.test(palavra)) return palavra;
            return palavra.charAt(0).toUpperCase() + palavra.slice(1);
          })
          .join('');
      }

      /**
       * 🔥 FORMATAR CEP BRASILEIRO
       * 12345678 -> 12345-678
       */
      function formatarCEP(cep) {
        if (!cep) return 'N/A';
        
        let apenas = cep.replace(/\D/g, '');
        if (apenas.length !== 8) return cep;
        
        return `${apenas.substring(0, 5)}-${apenas.substring(5)}`;
      }

      /**
       * 🔥 ATUALIZAR CAMPOS DA SEÇÃO COM DADOS DA API
       */
      function preencherCamposComAPI(data) {
        // Razão Social - Normalizar para Title Case
        const razaoField = document.getElementById('razaoSocial');
        if (razaoField) razaoField.value = toTitleCase(data.razao_social);
        
        // Nome Fantasia
        const fantField = document.getElementById('nomeFantasia');
        if (fantField) fantField.value = toTitleCase(data.nome_fantasia);
        
        // Email - Procurar em todos os possíveis campos de email na seção
        const emailSelectors = [
          'email',
          '[data-field*="_email"]',
          '[data-field*="_pj_email"]',
          '[data-field*="_pf_email"]'
        ];
        
        for (let selector of emailSelectors) {
          const emailField = document.querySelector(selector);
          if (emailField) {
            emailField.value = data.email || '';
            break;
          }
        }
        
        // Telefone
        const telefSelectors = [
          'telefone',
          '[data-field*="_telefone"]',
          '[data-field*="_phone"]'
        ];
        
        for (let selector of telefSelectors) {
          const telefField = document.querySelector(selector);
          if (telefField) {
            let tel = data.ddd_telefone_1 || data.ddd_telefone_2 || '';
            telefField.value = tel ? normalizeTelefoneAPI(tel) : '';
            break;
          }
        }
        
        // CEP
        const cepSelectors = [
          'cep',
          '[data-field*="_cep"]',
          '[data-field*="_postal"]'
        ];
        
        for (let selector of cepSelectors) {
          const cepField = document.querySelector(selector);
          if (cepField) {
            cepField.value = data.cep ? formatarCEP(data.cep) : '';
            break;
          }
        }
        
        // Endereço
        const endSelectors = [
          'endereco',
          '[data-field*="_endereco"]',
          '[data-field*="_address"]',
          '[data-field*="_logradouro"]'
        ];
        
        for (let selector of endSelectors) {
          const endField = document.querySelector(selector);
          if (endField) {
            let endereco = `${toTitleCase(data.descricao_tipo_de_logradouro)} ${toTitleCase(data.logradouro)}, ${data.numero}`;
            if (data.complemento) endereco += ` - ${toTitleCase(data.complemento)}`;
            endField.value = endereco;
            break;
          }
        }
        
        // Bairro
        const bairroSelectors = [
          'bairro',
          '[data-field*="_bairro"]',
          '[data-field*="_neighborhood"]'
        ];
        
        for (let selector of bairroSelectors) {
          const bairroField = document.querySelector(selector);
          if (bairroField) {
            bairroField.value = toTitleCase(data.bairro);
            break;
          }
        }
        
        // Cidade
        const cidadeSelectors = [
          'cidade',
          '[data-field*="_cidade"]',
          '[data-field*="_municipio"]',
          '[data-field*="_city"]'
        ];
        
        for (let selector of cidadeSelectors) {
          const cidadeField = document.querySelector(selector);
          if (cidadeField) {
            cidadeField.value = toTitleCase(data.municipio);
            break;
          }
        }
        
        // Estado
        const estadoSelectors = [
          'estado',
          '[data-field*="_estado"]',
          '[data-field*="_uf"]',
          '[data-field*="_state"]'
        ];
        
        for (let selector of estadoSelectors) {
          const estadoField = document.querySelector(selector);
          if (estadoField) {
            estadoField.value = data.uf || '';
            break;
          }
        }
      }
      
      /**
       * 🔥 MOSTRAR MODAL COM DADOS DA API
       */
      function showCNPJSuccessModalV2(data) {
        // Criar HTML do modal se não existir
        if (!document.getElementById('cnpjSuccessModal')) {
          const modalHTML = `
            <div class="success-modal" id="cnpjSuccessModal">
              <div class="success-content">
                <div class="success-icon" style="font-size: 1.6em; margin-bottom: 2px;">✅</div>
                <h2 style="color: var(--success-green); margin: 2px 0 8px 0; font-size: 1.2em;">Dados Encontrados!</h2>
                <div class="success-meta" style="padding: 10px 12px; margin: 0; font-size: 0.85em;">
                  <p style="margin: 4px 0;"><span class="label">Razão Social:</span> <span id="modalRazaoSocial" style="color: var(--text-primary); font-weight: 500; display: block; font-size: 1em; margin-top: 2px;"></span></p>
                  
                  <p style="margin: 6px 0 4px 0;"><span class="label">Nome Fantasia:</span> <span id="modalNomeFantasia" style="color: var(--text-primary); font-weight: 500; display: block; font-size: 1em; margin-top: 2px;"></span></p>
                  
                  <p style="margin: 6px 0 4px 0;"><span class="label">Situação:</span> <span id="modalSituacao" style="color: var(--text-primary); font-weight: 500; display: inline-block; font-size: 0.95em; margin-top: 2px; padding: 4px 12px; border-radius: 6px; border-left: 3px solid;"></span></p>
                  
                  <p style="margin: 6px 0 4px 0;"><span class="label">Data de Abertura:</span> <span id="modalDataAbertura" style="color: var(--text-primary); font-weight: 500; display: block; font-size: 1em; margin-top: 2px;">📅 <span id="dataAberturaValue"></span></span></p>
                  
                  <p style="margin: 6px 0 4px 0;"><span class="label">CNAE Principal:</span> <span id="modalCNAE" style="color: var(--text-primary); font-weight: 500; display: block; font-size: 1em; margin-top: 2px;"></span></p>
                  
                  <p style="margin: 6px 0 4px 0;"><span class="label">CNAEs Secundários:</span> <span id="modalCNAEsSecundarios" style="color: var(--text-primary); font-weight: 500; display: block; font-size: 0.9em; margin-top: 2px; max-height: 80px; overflow-y: auto; padding: 6px; background: #f9f9f9; border-radius: 4px; border-left: 2px solid var(--primary-blue);"></span></p>
                  
                  <p style="margin: 6px 0 4px 0;"><span class="label">Telefone:</span> <span id="modalTelefone" style="color: var(--text-primary); font-weight: 500; display: block; font-size: 1em; margin-top: 2px;">📱 <span id="telefoneValue"></span></span></p>
                  
                  <p style="margin: 6px 0 0 0;"><span class="label">Município:</span> <span id="modalMunicipio" style="color: var(--text-primary); font-weight: 500; display: block; font-size: 1em; margin-top: 2px;"></span></p>
                </div>
                <button class="success-btn" onclick="closeModalCNPJ()" style="padding: 10px 20px; font-size: 0.9em; margin-top: 8px;">Pronto</button>
              </div>
            </div>
          `;
          document.body.insertAdjacentHTML('beforeend', modalHTML);
        }
        
        // Preencher dados com normalização correta
        document.getElementById('modalRazaoSocial').textContent = toTitleCase(data.razao_social) || 'N/A';
        
        // Nome Fantasia
        document.getElementById('modalNomeFantasia').textContent = toTitleCase(data.nome_fantasia) || 'Não informado';
        
        // Situação com estilo condicional
        const situacaoTexto = toTitleCase(data.descricao_situacao_cadastral) || 'N/A';
        const estiloSit = obterEstiloSituacao(data.descricao_situacao_cadastral);
        const elSituacao = document.getElementById('modalSituacao');
        elSituacao.textContent = situacaoTexto;
        elSituacao.style.color = estiloSit.color;
        elSituacao.style.backgroundColor = estiloSit.backgroundColor;
        elSituacao.style.borderLeftColor = estiloSit.borderColor;
        
        // Data de Abertura
        let dataAbertura = data.data_inicio_atividade || data.data_situacao_cadastral || 'N/A';
        let dataFormatada = dataAbertura !== 'N/A' ? formatarDataBrasileira(dataAbertura) : 'N/A';
        document.getElementById('dataAberturaValue').textContent = dataFormatada;
        
        // CNAE Principal
        document.getElementById('modalCNAE').textContent = toTitleCase(data.cnae_fiscal_descricao) || 'N/A';
        
        // CNAEs Secundários
        if (data.cnaes_secundarios && data.cnaes_secundarios.length > 0) {
          let cnaesText = data.cnaes_secundarios.map(cnae => toTitleCase(cnae.descricao)).join('<br>• ');
          document.getElementById('modalCNAEsSecundarios').innerHTML = '• ' + cnaesText;
        } else {
          document.getElementById('modalCNAEsSecundarios').textContent = 'Nenhum';
        }
        
        // Normalizar telefone
        let telefoneBruto = data.ddd_telefone_1 || data.ddd_telefone_2 || 'N/A';
        let telefoneFomatado = telefoneBruto !== 'N/A' ? normalizeTelefoneAPI(telefoneBruto) : 'N/A';
        document.getElementById('telefoneValue').textContent = telefoneFomatado;
        
        // Normalizar município
        document.getElementById('modalMunicipio').textContent = toTitleCase(data.municipio) || 'N/A';
        
        // Mostrar modal
        const modal = document.getElementById('cnpjSuccessModal');
        modal.classList.add('show');
        
        // ✅ Preencher campos da seção também
        preencherCamposComAPI(data);
      }
    </script>

    <!-- 🔥 Script para integração com busca CNPJ e tratamento de erros -->
