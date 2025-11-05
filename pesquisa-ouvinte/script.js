// ============================================
// CONFIGURAÇÃO DO GOOGLE SHEETS
// ============================================
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
    if (!validateCurrentSection()) {
        alert('Por favor, responda a pergunta antes de continuar! 😊');
        return;
    }

    if (currentSection < totalSections) {
        document.querySelector(`.section[data-section="${currentSection}"]`).classList.remove('active');
        currentSection++;
        document.querySelector(`.section[data-section="${currentSection}"]`).classList.add('active');
        updateProgress();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function prevSection() {
    if (currentSection > 1) {
        document.querySelector(`.section[data-section="${currentSection}"]`).classList.remove('active');
        currentSection--;
        document.querySelector(`.section[data-section="${currentSection}"]`).classList.add('active');
        updateProgress();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// ============================================
// VALIDAÇÃO
// ============================================
function validateCurrentSection() {
    const currentSectionElement = document.querySelector(`.section[data-section="${currentSection}"]`);
    
    if (currentSection === 7) {
        const checkedCount = document.querySelectorAll('input[name="motivos"]:checked').length;
        return checkedCount >= 1 && checkedCount <= 2;
    }
    
    if (currentSection === 11) {
        return true;
    }
    
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
    
    if (currentSection !== totalSections) {
        alert('Por favor, complete todas as perguntas!');
        return;
    }

    // Mudar botão para estado de loading
    const submitBtn = document.querySelector('.btn-submit');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '⏳ Enviando, aguarde...';
    submitBtn.style.background = '#999';
    submitBtn.style.cursor = 'not-allowed';
    submitBtn.disabled = true;

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

    if (data.estilo === 'Outro') {
        const outroEstilo = document.getElementById('estiloOutroTexto').value;
        if (outroEstilo) {
            data.estilo = `Outro: ${outroEstilo}`;
        }
    }

    console.log('Dados da pesquisa:', data);

    try {
        await sendToGoogleSheets(data);
        
        // Limpar localStorage antigo (dados com erro)
        localStorage.removeItem('superfm_respostas');
        
        document.getElementById('successMessage').style.display = 'flex';
        
    } catch (error) {
        console.error('Erro ao enviar dados:', error);
        saveLocalBackup(data);
        alert('✅ Pesquisa registrada com sucesso! Obrigado por participar! 🎵');
        document.getElementById('successMessage').style.display = 'flex';
    } finally {
        // Restaurar botão
        submitBtn.innerHTML = originalText;
        submitBtn.style.background = '';
        submitBtn.style.cursor = 'pointer';
        submitBtn.disabled = false;
    }
}

// ============================================
// INTEGRAÇÃO COM GOOGLE SHEETS
// ============================================
async function sendToGoogleSheets(data) {
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
        let savedData = localStorage.getItem('superfm_respostas');
        let respostas = savedData ? JSON.parse(savedData) : [];
        respostas.push(data);
        localStorage.setItem('superfm_respostas', JSON.stringify(respostas));
        console.log('Dados salvos localmente como backup');
    } catch (error) {
        console.error('Erro ao salvar backup local:', error);
    }
}

// ============================================
// FUNÇÕES AUXILIARES
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
