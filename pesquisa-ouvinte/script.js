// ============================================
// CONFIGURAÇÃO DO GOOGLE SHEETS
// ============================================
// INSTRUÇÕES PARA CONFIGURAR:
// 1. Acesse https://script.google.com
// 2. Crie um novo projeto
// 3. Cole o código do arquivo google-apps-script.js
// 4. Publique como Web App
// 5. Cole a URL gerada abaixo:

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzw28DjwSek59S0T-uDFS7Gf-jajIiagYuzI4B9OTXdfb2bJ0QVwtqQ7TGnNG1-ZG3e/exec';

// ============================================
// VARIÁVEIS GLOBAIS
// ============================================
let currentSection = 1;
const totalSections = 11;

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // Iniciar música com volume baixo
    const music = document.getElementById('backgroundMusic');
    if (music) {
        music.volume = 0.15;
        music.play().catch(e => console.log('Autoplay bloqueado pelo navegador'));
    }

    // Campo "Outro" do estilo musical
    document.getElementById('estiloOutro').addEventListener('change', function() {
        const outroTexto = document.getElementById('estiloOutroTexto');
        if (this.checked) {
            outroTexto.style.display = 'block';
        } else {
            outroTexto.style.display = 'none';
            outroTexto.value = '';
        }
    });

    // Limitar checkboxes a 2 opções
    const checkboxes = document.querySelectorAll('input[name="motivos"]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const checkedCount = document.querySelectorAll('input[name="motivos"]:checked').length;
            if (checkedCount > 2) {
                this.checked = false;
                alert('Você pode selecionar no máximo 2 opções! 😊');
            }
        });
    });

    // Máscara de telefone
    document.getElementById('telefone').addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length <= 11) {
            value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
            value = value.replace(/(\d)(\d{4})$/, '$1-$2');
        }
        e.target.value = value;
    });

    // Envio do formulário
    document.getElementById('pesquisaForm').addEventListener('submit', handleSubmit);
});

// ============================================
// NAVEGAÇÃO ENTRE SEÇÕES
// ============================================
function nextSection() {
    // Validar seção atual
    if (!validateCurrentSection()) {
        alert('Por favor, responda a pergunta antes de continuar! 😊');
        return;
    }

    if (currentSection < totalSections) {
        // Esconder seção atual
        document.querySelector(`.section[data-section="${currentSection}"]`).classList.remove('active');
        
        // Avançar para próxima seção
        currentSection++;
        
        // Mostrar próxima seção
        document.querySelector(`.section[data-section="${currentSection}"]`).classList.add('active');
        
        // Atualizar barra de progresso
        updateProgress();
        
        // Scroll para o topo
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function prevSection() {
    if (currentSection > 1) {
        // Esconder seção atual
        document.querySelector(`.section[data-section="${currentSection}"]`).classList.remove('active');
        
        // Voltar para seção anterior
        currentSection--;
        
        // Mostrar seção anterior
        document.querySelector(`.section[data-section="${currentSection}"]`).classList.add('active');
        
        // Atualizar barra de progresso
        updateProgress();
        
        // Scroll para o topo
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// ============================================
// VALIDAÇÃO
// ============================================
function validateCurrentSection() {
    const currentSectionElement = document.querySelector(`.section[data-section="${currentSection}"]`);
    
    // Seção 7 (checkboxes) - validação especial
    if (currentSection === 7) {
        const checkedCount = document.querySelectorAll('input[name="motivos"]:checked').length;
        return checkedCount >= 1 && checkedCount <= 2;
    }
    
    // Seção 11 (informações pessoais) - opcional
    if (currentSection === 11) {
        return true;
    }
    
    // Outras seções com radio buttons obrigatórios
    const requiredInputs = currentSectionElement.querySelectorAll('input[required]');
    
    for (let input of requiredInputs) {
        const name = input.getAttribute('name');
        const checked = currentSectionElement.querySelector(`input[name="${name}"]:checked`);
        
        if (!checked) {
            return false;
        }
    }
    
    return true;
}

// ============================================
// BARRA DE PROGRESSO
// ============================================
function updateProgress() {
    const percentage = (currentSection / totalSections) * 100;
    document.getElementById('progressBar').style.width = percentage + '%';
    document.getElementById('progressText').textContent = `Pergunta ${currentSection} de ${totalSections}`;
}

// ============================================
// ENVIO DO FORMULÁRIO
// ============================================
async function handleSubmit(e) {
    e.preventDefault();
    
    // Validar última seção (embora seja opcional)
    if (currentSection !== totalSections) {
        alert('Por favor, complete todas as perguntas!');
        return;
    }

    // Coletar dados do formulário
    const formData = new FormData(e.target);
    const data = {
        timestamp: new Date().toISOString(),
        horario: formData.get('horario'),
        estilo: formData.get('estilo'),
        locutor: formData.get('locutor'),
        programa: formData.get('programa'),
        mudarRadio: formData.get('mudarRadio'),
        companhia: formData.get('companhia'),
        motivos: formData.getAll('motivos').join(', '),
        plataforma: formData.get('plataforma'),
        novoConteudo: formData.get('novoConteudo'),
        anuncio: formData.get('anuncio'),
        nome: formData.get('nome') || '',
        telefone: formData.get('telefone') || '',
        sexo: formData.get('sexo') || '',
        idade: formData.get('idade') || ''
    };

    // Se "Outro" foi selecionado no estilo
    if (data.estilo === 'Outro') {
        const outroEstilo = document.getElementById('estiloOutroTexto').value;
        if (outroEstilo) {
            data.estilo = `Outro: ${outroEstilo}`;
        }
    }

    console.log('Dados da pesquisa:', data);

    try {
        // Enviar para Google Sheets
        await sendToGoogleSheets(data);
        
        // Mostrar mensagem de sucesso
        document.getElementById('successMessage').style.display = 'flex';
        
    } catch (error) {
        console.error('Erro ao enviar dados:', error);
        
        // Se falhar, salvar localmente
        saveLocalBackup(data);
        
        alert('✅ Pesquisa registrada com sucesso! Obrigado por participar! 🎵');
        
        // Mostrar mensagem de sucesso mesmo com erro
        document.getElementById('successMessage').style.display = 'flex';
    }
}

// ============================================
// INTEGRAÇÃO COM GOOGLE SHEETS
// ============================================
async function sendToGoogleSheets(data) {
    // Verificar se a URL está configurada
    if (GOOGLE_SCRIPT_URL === 'SUA_URL_DO_GOOGLE_APPS_SCRIPT_AQUI') {
        console.warn('Google Sheets não configurado. Salvando apenas localmente.');
        throw new Error('Google Sheets não configurado');
    }

    const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    });

    return true;
}

// ============================================
// BACKUP LOCAL (FALLBACK)
// ============================================
function saveLocalBackup(data) {
    try {
        // Obter dados salvos anteriormente
        let savedData = localStorage.getItem('superfm_respostas');
        let respostas = savedData ? JSON.parse(savedData) : [];
        
        // Adicionar nova resposta
        respostas.push(data);
        
        // Salvar de volta
        localStorage.setItem('superfm_respostas', JSON.stringify(respostas));
        
        console.log('Dados salvos localmente como backup');
    } catch (error) {
        console.error('Erro ao salvar backup local:', error);
    }
}

// ============================================
// FUNÇÕES AUXILIARES PARA O DASHBOARD
// ============================================
function getLocalResponses() {
    try {
        const savedData = localStorage.getItem('superfm_respostas');
        return savedData ? JSON.parse(savedData) : [];
    } catch (error) {
        console.error('Erro ao recuperar respostas locais:', error);
        return [];
    }
}

function clearLocalResponses() {
    try {
        localStorage.removeItem('superfm_respostas');
        console.log('Respostas locais limpas');
    } catch (error) {
        console.error('Erro ao limpar respostas locais:', error);
    }
}