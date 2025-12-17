// Configuração - URL do Google Apps Script
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxOgHibVcPjGKEi2l3ZSSMDDgqIwywsCTN3hmJLFNVDZizT31qrc-DRVtSbbkXr6NXQ/exec';

// Estado do formulário
let formState = {
  cpf: '',
  setor: '',
  perguntas: [],
  respostas: [],
  currentQuestion: 0,
  comentarioFinal: ''
};

// Inicializa o formulário
function initForm(setor, perguntas) {
  formState.setor = setor;
  formState.perguntas = perguntas;
  formState.respostas = new Array(perguntas.length).fill(null);
  showSection('cover');
}

// Valida CPF
function validateCPF(cpf) {
  cpf = cpf.replace(/\D/g, '');
  
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  
  let sum = 0;
  let remainder;
  
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(9, 10))) return false;
  
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(10, 11))) return false;
  
  return true;
}

// Formata CPF enquanto digita
function formatCPF(value) {
  value = value.replace(/\D/g, '');
  value = value.replace(/(\d{3})(\d)/, '$1.$2');
  value = value.replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3');
  value = value.replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
  return value;
}

// Evento do input CPF
document.addEventListener('DOMContentLoaded', () => {
  const cpfInput = document.getElementById('cpfInput');
  if (cpfInput) {
    cpfInput.addEventListener('input', (e) => {
      e.target.value = formatCPF(e.target.value);
    });
  }
});

// Mostra uma seção
function showSection(sectionId) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const section = document.getElementById(sectionId);
  if (section) {
    section.classList.add('active');
  }
}

// Inicia o formulário
function startForm() {
  showSection('cpf');
}

// Continua para as perguntas
function continueToCpf() {
  console.log('📝 continueToCpf chamado. Setor atual:', formState.setor);
  
  const cpfInput = document.getElementById('cpfInput');
  const errorMessage = document.querySelector('.error-message');
  const cpf = cpfInput.value.replace(/\D/g, '');
  
  errorMessage.classList.remove('show');
  cpfInput.classList.remove('error');
  
  if (!cpf) {
    errorMessage.textContent = 'Por favor, informe um CPF';
    errorMessage.classList.add('show');
    cpfInput.classList.add('error');
    return;
  }
  
  if (!validateCPF(cpf)) {
    errorMessage.textContent = 'CPF inválido. Por favor, verifique';
    errorMessage.classList.add('show');
    cpfInput.classList.add('error');
    return;
  }
  
  console.log('✅ CPF válido. Setor antes de checkCPFExists:', formState.setor);
  
  // Mostra indicador de carregamento
  const btn = event.target;
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = '⏳ Aguarde validando CPF...';
  
  // Valida se CPF já respondeu neste setor
  checkCPFExists(cpf, btn, originalText);
}

// Verifica se CPF já existe no setor
async function checkCPFExists(cpf, btn, originalText) {
  try {
    console.log('🔍 Verificando CPF:', cpf, 'Setor:', formState.setor);
    
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'checkCPF',
        cpf: cpf,
        setor: formState.setor
      })
    });
    
    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('📥 Resultado recebido:', result);
    
    if (result.exists === true) {
      // CPF já respondeu - BLOQUEIA
      console.log('❌ CPF já existe - BLOQUEANDO');
      showModal('error', '⚠️ Já Participou', `Você já respondeu este formulário em ${formState.setor}. Cada colaborador pode responder apenas uma vez por setor.`);
    } else if (result.exists === false) {
      // CPF é válido e não respondeu ainda - Mostra modal de sucesso
      console.log('✅ CPF novo - LIBERANDO');
      showModal('success', '✅ Liberado!', 'Seu CPF foi validado com sucesso. Você está autorizado a responder este formulário.');
      
      // Espera 3 segundos e continua
      setTimeout(() => {
        closeModal();
        
        // ⚠️ IMPORTANTE: Limpar respostas anteriores para novo CPF!
        formState.respostas = new Array(formState.perguntas.length).fill(null);
        formState.cpf = cpf;
        formState.currentQuestion = 0;
        
        console.log('✅ CPF liberado! Respostas limpas para novo usuário');
        console.log('📝 formState.respostas:', formState.respostas);
        
        showSection('questions');
        showQuestion();
      }, 3000);
    } else {
      // Resposta inválida
      console.error('⚠️ Resposta inválida:', result);
      showModal('error', '⚠️ Erro na Validação', 'Resposta inválida do servidor. Tente novamente.');
    }
  } catch (error) {
    console.error('❌ Erro ao verificar CPF:', error);
    showModal('error', '⚠️ Erro na Validação', 'Não foi possível validar o CPF no servidor. Tente novamente.');
  } finally {
    // Restaura botão
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

// Mostra a pergunta atual
function showQuestion() {
  // Esconde todas as perguntas
  document.querySelectorAll('.question-container').forEach(q => {
    q.classList.remove('active');
  });
  
  // Mostra a pergunta atual
  const questionId = `question-${formState.currentQuestion}`;
  const questionEl = document.getElementById(questionId);
  if (questionEl) {
    questionEl.classList.add('active');
  }
  
  // Scroll para o topo
  document.querySelector('.questions-section').scrollTop = 0;
  
  // Atualiza navegação
  updateNavigation();
}

// Atualiza navegação
function updateNavigation() {
  const btnPrev = document.querySelector('.btn-prev');
  const btnNext = document.querySelector('.btn-next');
  const progressInfo = document.querySelector('.progress-info');
  
  const currentResponse = formState.respostas[formState.currentQuestion];
  const isAnswered = currentResponse !== null && currentResponse !== undefined;
  
  console.log('📊 updateNavigation:', {
    pergunta: formState.currentQuestion,
    resposta: currentResponse,
    respondida: isAnswered,
    totalRespostas: formState.respostas.length
  });
  
  if (btnPrev) btnPrev.disabled = formState.currentQuestion === 0;
  if (btnNext) {
    const shouldEnable = currentResponse !== null && currentResponse !== undefined;
    btnNext.disabled = !shouldEnable;
    console.log('🔘 Botão Próxima:', shouldEnable ? 'HABILITADO ✅' : 'DESABILITADO ❌');
  }
  
  if (progressInfo) {
    progressInfo.textContent = `${formState.currentQuestion + 1} de ${formState.perguntas.length}`;
  }
}

// Próxima pergunta
function nextQuestion() {
  if (formState.respostas[formState.currentQuestion] !== null) {
    if (formState.currentQuestion < formState.perguntas.length - 1) {
      formState.currentQuestion++;
      showQuestion();
    } else {
      showSection('final-comment');
    }
  }
}

// Pergunta anterior
function prevQuestion() {
  if (formState.currentQuestion > 0) {
    formState.currentQuestion--;
    showQuestion();
  }
}

// Seleciona resposta
function selectEmoji(questionIndex, value) {
  console.log('😊 selectEmoji:', { pergunta: questionIndex, valor: value });
  
  formState.respostas[questionIndex] = value;
  
  console.log('✅ Resposta salva:', {
    pergunta: questionIndex,
    resposta: value,
    respostasAte: formState.respostas.slice(0, questionIndex + 1)
  });
  
  // Remove seleção anterior
  const buttons = document.querySelectorAll(`[data-question="${questionIndex}"]`);
  buttons.forEach(btn => {
    btn.classList.remove('selected');
  });
  
  // Adiciona seleção ao botão clicado
  const selected = document.querySelector(`[data-question="${questionIndex}"][data-value="${value}"]`);
  if (selected) {
    selected.classList.add('selected');
  }
  
  // Habilita próximo botão
  updateNavigation();
}

// Envia o formulário
async function submitForm() {
  const comentario = document.querySelector('.comment-input').value.trim();
  const errorDiv = document.querySelector('.comment-error');
  
  if (!comentario) {
    if (errorDiv) {
      errorDiv.textContent = 'Comentário obrigatório';
      errorDiv.classList.add('show');
    }
    return;
  }
  
  if (errorDiv) {
    errorDiv.classList.remove('show');
  }
  
  formState.comentarioFinal = comentario;
  
  const submitBtn = document.querySelector('.btn-submit');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="loading"></span> Enviando...';
  
  try {
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({
        cpf: formState.cpf,
        setor: formState.setor,
        respostas: formState.respostas,
        texto: formState.comentarioFinal
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      showModal('success', '🎉 Resposta Registrada!', 'Obrigado por sua participação! Seus dados foram salvos com sucesso. Sua opinião é muito importante para nós.');
      setTimeout(() => {
        location.reload();
      }, 2000);
    } else {
      if (result.message.includes('já respondeu')) {
        showModal('error', 'Já Respondido', 'Você já preencheu este formulário. Cada colaborador pode responder apenas uma vez por setor.');
      } else {
        showModal('error', 'Erro ao Enviar', result.message || 'Ocorreu um erro ao processar sua resposta.');
      }
    }
  } catch (error) {
    console.error('Erro:', error);
    showModal('error', 'Erro de Conexão', 'Não foi possível conectar ao servidor. Verifique sua conexão de internet.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Enviar Resposta';
  }
}

// Mostra modal
function showModal(type, title, message) {
  const modal = document.getElementById('modal');
  const modalContent = document.querySelector('.modal-content');
  
  let icon = '✓';
  if (type === 'error') {
    icon = '✕';
  }
  
  // Verifica se é erro de CPF duplicado
  const isCPFError = title.includes('Já Participou') || title.includes('Já Respondido');
  
  // Se for sucesso (modal Liberado), não mostra botão
  let buttonHTML = '';
  if (type !== 'success') {
    // ⚠️ IMPORTANTE: Erro de CPF deve voltar pra home (true), outros erros mantêm (false)
    buttonHTML = `<button class="btn-close-modal" onclick="closeModal(${isCPFError ? 'true' : 'false'})">Fechar</button>`;
  }
  
  modalContent.innerHTML = `
    <div class="checkmark">${icon}</div>
    <h2>${title}</h2>
    <p>${message}</p>
    ${buttonHTML}
  `;
  
  if (type === 'success') {
    modalContent.style.borderTop = '4px solid #10b981';
  } else if (type === 'error') {
    modalContent.style.borderTop = '4px solid #ef4444';
  }
  
  modal.classList.add('show');
}

// Reseta o estado do formulário
function resetFormState(keepSetor = true) {
  const setorAtual = formState.setor;
  const perguntasAtuais = formState.perguntas;
  const respostasAtuais = formState.respostas;
  
  console.log('🔄 resetFormState chamado. keepSetor:', keepSetor, 'Setor atual:', setorAtual);
  
  formState = {
    cpf: '',
    setor: keepSetor ? setorAtual : '',
    perguntas: perguntasAtuais, // ✅ MANTÉM perguntas!
    respostas: keepSetor ? respostasAtuais : [], // ✅ Se mantém setor, mantém respostas!
    currentQuestion: 0,
    comentarioFinal: ''
  };
  
  console.log('🔄 Após reset. Novo setor:', formState.setor, 'Respostas mantidas:', keepSetor ? 'sim' : 'não');
  
  const cpfInput = document.getElementById('cpfInput');
  if (cpfInput) {
    cpfInput.value = '';
  }
}

// Fecha modal e reseta formulário se foi erro de CPF duplicado
function closeModal(resetForm = false) {
  const modal = document.getElementById('modal');
  modal.classList.remove('show');
  
  if (resetForm) {
    // Volta pra tela de capa
    // ⚠️ IMPORTANTE: SEMPRE keepSetor=true para manter o contexto do formulário!
    resetFormState(true);
    // Reseta respostas manualmente para novo usuário
    formState.respostas = new Array(formState.perguntas.length).fill(null);
    formState.cpf = '';
    showSection('cover');
  } else {
    // Apenas fecha modal - mantém setor!
    resetFormState(true);
  }
}