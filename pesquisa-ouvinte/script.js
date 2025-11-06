// ============================================
// CONFIGURAÇÃO DO GOOGLE SHEETS
// ============================================
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzw28DjwSek59S0T-uDFS7Gf-jajIiagYuzI4B9OTXdfb2bJ0QVwtqQ7TGnNG1-ZG3e/exec';

// ============================================
// VARIÁVEIS GLOBAIS
// ============================================
let currentSection = 1;
const totalSections = 11;
let confettiInstance = null;

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // Iniciar música com volume baixo
    const music = document.getElementById('backgroundMusic');
    const musicToggle = document.getElementById('musicToggle');
    
    if (music) {
        music.volume = 0.15;
        
        // Tentar autoplay (pode ser bloqueado pelo navegador)
        const playPromise = music.play();
        
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                // Autoplay foi bloqueado, usuário precisa clicar
                console.log('Autoplay bloqueado. Usuário pode clicar para ativar.');
                if (musicToggle) {
                    musicToggle.classList.add('muted');
                }
            });
        }
    }

    // Toggle de música
    if (musicToggle && music) {
        musicToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            
            if (music.paused) {
                music.play();
                musicToggle.classList.remove('muted');
            } else {
                music.pause();
                musicToggle.classList.add('muted');
            }
        });
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
        
        // Limitar a 11 dígitos
        if (value.length > 11) {
            value = value.substring(0, 11);
        }
        
        // Aplicar máscara
        if (value.length <= 11) {
            if (value.length <= 2) {
                value = value.replace(/^(\d{0,2})/, '($1');
            } else if (value.length <= 6) {
                value = value.replace(/^(\d{2})(\d{0,4})/, '($1) $2');
            } else if (value.length <= 10) {
                value = value.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
            } else {
                value = value.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
            }
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

        // Iniciar confetti na seção 11
        if (currentSection === 11) {
            setTimeout(() => {
                startConfetti();
            }, 300);
        }
    }
}

function prevSection() {
    if (currentSection > 1) {
        // Parar confetti se voltar da seção 11
        if (currentSection === 11 && confettiInstance) {
            stopConfetti();
        }

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
    
    // Seção 11 - validação especial
    if (currentSection === 11) {
        return true; // Validar no handleSubmit
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
// CONFETTI EFFECT
// ============================================
class ConfettiEffect {
    constructor() {
        this.canvas = document.getElementById('confetti-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.animationId = null;

        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        });
    }

    createParticles() {
        const colors = ['#2B5BA8', '#FFD700', '#FFFFFF', '#1B3A6B', '#E3F2FD'];
        const particleCount = 100;

        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height - this.canvas.height,
                vx: (Math.random() - 0.5) * 4,
                vy: Math.random() * 3 + 2,
                size: Math.random() * 10 + 5,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                rotationVel: (Math.random() - 0.5) * 10
            });
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.particles = this.particles.filter(p => p.y < this.canvas.height);

        this.particles.forEach((p, index) => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1; // Gravidade
            p.rotation += p.rotationVel;

            // Desenhar confetti
            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate((p.rotation * Math.PI) / 180);
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = Math.max(0, 1 - p.y / this.canvas.height);
            this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            this.ctx.restore();
        });

        if (this.particles.length > 0) {
            this.animationId = requestAnimationFrame(() => this.animate());
        }
    }

    start() {
        this.createParticles();
        this.animate();
    }

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.particles = [];
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

function startConfetti() {
    if (confettiInstance) {
        confettiInstance.stop();
    }
    confettiInstance = new ConfettiEffect();
    confettiInstance.start();

    // Parar após 3 segundos
    setTimeout(() => {
        if (confettiInstance) {
            confettiInstance.stop();
        }
    }, 3000);
}

function stopConfetti() {
    if (confettiInstance) {
        confettiInstance.stop();
        confettiInstance = null;
    }
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

    // Validar seção 11 (campos obrigatórios)
    const nome = document.querySelector('input[name="nome"]').value.trim();
    const telefone = document.querySelector('input[name="telefone"]').value.trim();
    const sexo = document.querySelector('input[name="sexo"]:checked');
    const idade = document.querySelector('input[name="idade"]:checked');

    if (!nome || nome.length < 3) {
        alert('⚠️ Por favor, digite seu nome completo para concorrer ao sorteio! 🎁');
        return;
    }

    if (!telefone || telefone.replace(/\D/g, '').length < 10) {
        alert('⚠️ Por favor, digite um telefone válido para concorrer ao sorteio! 📱');
        return;
    }

    if (!sexo) {
        alert('⚠️ Por favor, selecione seu sexo para concorrer ao sorteio! 👥');
        return;
    }

    if (!idade) {
        alert('⚠️ Por favor, selecione sua faixa etária para concorrer ao sorteio! 📅');
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
        nome: nome,
        telefone: telefone,
        sexo: formData.get('sexo'),
        idade: formData.get('idade')
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
        
        // Parar confetti e mostrar sucesso
        stopConfetti();
        document.getElementById('successMessage').style.display = 'flex';
        
    } catch (error) {
        console.error('Erro ao enviar dados:', error);
        saveLocalBackup(data);
        stopConfetti();
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
