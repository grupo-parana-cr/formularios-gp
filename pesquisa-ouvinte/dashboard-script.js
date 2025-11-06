// ============================================
// CONFIGURAÇÕES
// ============================================
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzw28DjwSek59S0T-uDFS7Gf-jajIiagYuzI4B9OTXdfb2bJ0QVwtqQ7TGnNG1-ZG3e/exec';
const SENHA_PADRAO = 'superfm2025';

const USUARIOS_VALIDOS = {
    'elizandra': 'superfm2025',
    'admin': 'superfm2025',
    'super': 'fm2025'
};

let chartInstances = {};
let respostasData = [];
let historicoSorteios = [];
let cpfsSorteados = [];
let participantesCarregados = false;

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const isLoggedIn = sessionStorage.getItem('superfm_loggedin');
    const username = sessionStorage.getItem('superfm_username');
    
    if (isLoggedIn === 'true' && username) {
        showDashboard(username);
    }
    
    document.getElementById('loginForm').addEventListener('submit', handleLogin);

    // Carregar histórico de sorteios do localStorage
    carregarHistoricoSorteios();
});

// ============================================
// NAVEGAÇÃO DE ABAS
// ============================================
function switchTab(tabName) {
    // Esconder todas as abas
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));

    // Mostrar aba selecionada
    document.getElementById(`tab-${tabName}`).classList.add('active');

    // Atualizar botões
    const btnTabs = document.querySelectorAll('.tab-btn');
    btnTabs.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    // Se for aba de sorteio, reinicializar
    if (tabName === 'sorteio') {
        reinicializarTelaSorteio();
    }
}

// ============================================
// LOGIN
// ============================================
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.toLowerCase().trim();
    const password = document.getElementById('password').value;
    
    if (USUARIOS_VALIDOS[username] && USUARIOS_VALIDOS[username] === password) {
        sessionStorage.setItem('superfm_loggedin', 'true');
        sessionStorage.setItem('superfm_username', username);
        showDashboard(username);
    } else {
        alert('❌ Usuário ou senha incorretos!');
    }
}

function showDashboard(username) {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboardScreen').style.display = 'block';
    document.getElementById('userName').textContent = username.charAt(0).toUpperCase() + username.slice(1);
    
    // Atualizar dados automaticamente ao entrar
    loadData();
}

function logout() {
    sessionStorage.removeItem('superfm_loggedin');
    sessionStorage.removeItem('superfm_username');
    window.location.reload();
}

// ============================================
// CARREGAR DADOS
// ============================================
async function loadData() {
    try {
        if (GOOGLE_SCRIPT_URL !== 'SUA_URL_DO_GOOGLE_APPS_SCRIPT_AQUI') {
            await loadFromGoogleSheets();
        } else {
            loadFromLocalStorage();
        }
        
        document.getElementById('lastUpdate').textContent = 
            `Última atualização: ${new Date().toLocaleString('pt-BR')}`;
            
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        loadFromLocalStorage();
    }
}

async function loadFromGoogleSheets() {
    const url = `${GOOGLE_SCRIPT_URL}?password=${SENHA_PADRAO}`;
    const response = await fetch(url);
    const result = await response.json();
    
    if (result.result === 'success') {
        respostasData = result.data;
        processData();
    } else {
        throw new Error('Erro ao carregar do Google Sheets');
    }
}

function loadFromLocalStorage() {
    const savedData = localStorage.getItem('superfm_respostas');
    if (savedData) {
        respostasData = JSON.parse(savedData);
        processData();
    } else {
        showNoDataMessage();
    }
}

async function refreshData() {
    const refreshBtn = document.querySelector('.btn-refresh');
    const originalText = refreshBtn.innerHTML;
    
    refreshBtn.innerHTML = '⏳ Carregando...';
    refreshBtn.style.background = '#999';
    refreshBtn.style.cursor = 'not-allowed';
    refreshBtn.disabled = true;
    
    try {
        await loadData();
    } finally {
        setTimeout(() => {
            refreshBtn.innerHTML = originalText;
            refreshBtn.style.background = '';
            refreshBtn.style.cursor = 'pointer';
            refreshBtn.disabled = false;
        }, 1000);
    }
}

// ============================================
// PROCESSAR DADOS
// ============================================
function processData() {
    if (!respostasData || respostasData.length === 0) {
        showNoDataMessage();
        return;
    }
    
    updateQuickStats();
    generateCharts();
    fillTable();
}

function showNoDataMessage() {
    document.getElementById('totalRespostas').textContent = '0';
    document.getElementById('horarioFavorito').textContent = '--';
    document.getElementById('estiloFavorito').textContent = '--';
    document.getElementById('programaFavorito').textContent = '--';
}

// ============================================
// ESTATÍSTICAS RÁPIDAS
// ============================================
function updateQuickStats() {
    document.getElementById('totalRespostas').textContent = respostasData.length;
    
    const horarios = countOccurrences(respostasData, 'Horário');
    document.getElementById('horarioFavorito').textContent = getTopItem(horarios);
    
    const estilos = countOccurrences(respostasData, 'Estilo Musical');
    document.getElementById('estiloFavorito').textContent = getTopItem(estilos);
    
    const programas = countOccurrences(respostasData, 'Programa');
    document.getElementById('programaFavorito').textContent = getTopItem(programas);
}

function countOccurrences(data, field) {
    const counts = {};
    data.forEach(item => {
        const value = item[field];
        if (value && value !== '') {
            counts[value] = (counts[value] || 0) + 1;
        }
    });
    return counts;
}

function getTopItem(counts) {
    let maxCount = 0;
    let topItem = '--';
    
    for (const [key, value] of Object.entries(counts)) {
        if (value > maxCount) {
            maxCount = value;
            topItem = key;
        }
    }
    
    return topItem;
}

// ============================================
// GERAR GRÁFICOS
// ============================================
function generateCharts() {
    Object.values(chartInstances).forEach(chart => {
        if (chart && chart.destroy) chart.destroy();
    });
    chartInstances = {};
    
    createBarChart('chartHorarios', 'Horário', 'Horários');
    createPieChart('chartEstilos', 'Estilo Musical', 'Estilos');
    createBarChart('chartLocutores', 'Locutor', 'Locutores');
    createBarChart('chartProgramas', 'Programa', 'Programas');
    createDoughnutChart('chartPlataformas', 'Plataforma', 'Plataformas');
    createBarChart('chartIdade', 'Idade', 'Idade');
    createMotivosChart();
}

function createBarChart(canvasId, field, label) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    
    const data = countOccurrences(respostasData, field);
    
    if (Object.keys(data).length === 0) {
        ctx.parentElement.innerHTML = `<p style="text-align: center; padding: 40px; color: #999;">Sem dados para exibir</p>`;
        return;
    }
    
    chartInstances[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(data),
            datasets: [{
                label: label,
                data: Object.values(data),
                backgroundColor: 'rgba(43, 91, 168, 0.7)',
                borderColor: 'rgba(43, 91, 168, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function createPieChart(canvasId, field, label) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    
    const data = countOccurrences(respostasData, field);
    
    if (Object.keys(data).length === 0) {
        ctx.parentElement.innerHTML = `<p style="text-align: center; padding: 40px; color: #999;">Sem dados para exibir</p>`;
        return;
    }
    
    const colors = [
        'rgba(43, 91, 168, 0.8)',
        'rgba(255, 215, 0, 0.8)',
        'rgba(76, 175, 80, 0.8)',
        'rgba(244, 67, 54, 0.8)',
        'rgba(156, 39, 176, 0.8)',
        'rgba(255, 152, 0, 0.8)',
        'rgba(0, 188, 212, 0.8)',
        'rgba(121, 85, 72, 0.8)'
    ];
    
    chartInstances[canvasId] = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(data),
            datasets: [{
                data: Object.values(data),
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

function createDoughnutChart(canvasId, field, label) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    
    const data = countOccurrences(respostasData, field);
    
    if (Object.keys(data).length === 0) {
        ctx.parentElement.innerHTML = `<p style="text-align: center; padding: 40px; color: #999;">Sem dados para exibir</p>`;
        return;
    }
    
    const colors = [
        'rgba(43, 91, 168, 0.8)',
        'rgba(255, 215, 0, 0.8)',
        'rgba(76, 175, 80, 0.8)',
        'rgba(244, 67, 54, 0.8)'
    ];
    
    chartInstances[canvasId] = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(data),
            datasets: [{
                data: Object.values(data),
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function createMotivosChart() {
    const ctx = document.getElementById('chartMotivos');
    if (!ctx) return;
    
    const motivosCount = {};
    
    respostasData.forEach(resposta => {
        const motivos = resposta['Motivos'] || '';
        if (motivos && motivos !== '') {
            const motivosArray = motivos.split(',').map(m => m.trim());
            motivosArray.forEach(motivo => {
                if (motivo && motivo !== '') {
                    motivosCount[motivo] = (motivosCount[motivo] || 0) + 1;
                }
            });
        }
    });
    
    if (Object.keys(motivosCount).length === 0) {
        ctx.parentElement.innerHTML = `<p style="text-align: center; padding: 40px; color: #999;">Sem dados para exibir</p>`;
        return;
    }
    
    chartInstances['chartMotivos'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(motivosCount),
            datasets: [{
                label: 'Número de Respostas',
                data: Object.values(motivosCount),
                backgroundColor: 'rgba(43, 91, 168, 0.7)',
                borderColor: 'rgba(43, 91, 168, 1)',
                borderWidth: 2
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// ============================================
// PREENCHER TABELA
// ============================================
function fillTable() {
    const tbody = document.getElementById('respostasBody');
    tbody.innerHTML = '';
    
    if (respostasData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="16" class="no-data">Nenhuma resposta encontrada</td></tr>';
        return;
    }
    
    respostasData.forEach(resposta => {
        const row = document.createElement('tr');
        
        let dataFormatada = '--';
        if (resposta['Data/Hora']) {
            const data = new Date(resposta['Data/Hora']);
            dataFormatada = data.toLocaleString('pt-BR');
        }
        
        row.innerHTML = `
            <td style="white-space: nowrap;">${dataFormatada}</td>
            <td>${resposta['Horário'] || '--'}</td>
            <td>${resposta['Estilo Musical'] || '--'}</td>
            <td>${resposta['Locutor'] || '--'}</td>
            <td>${resposta['Programa'] || '--'}</td>
            <td style="white-space: nowrap;">${resposta['Muda de Rádio'] || '--'}</td>
            <td>${resposta['Usa como Companhia'] || '--'}</td>
            <td style="min-width: 150px;">${resposta['Motivos'] || '--'}</td>
            <td style="white-space: nowrap;">${resposta['Plataforma'] || '--'}</td>
            <td style="min-width: 120px;">${resposta['Novo Conteúdo'] || '--'}</td>
            <td style="white-space: nowrap;">${resposta['Anúncios'] || '--'}</td>
            <td style="white-space: nowrap;">${resposta['Nome'] || '--'}</td>
            <td style="white-space: nowrap;">${resposta['CPF'] || '--'}</td>
            <td style="white-space: nowrap;">${resposta['Telefone'] || '--'}</td>
            <td style="white-space: nowrap;">${resposta['Sexo'] || '--'}</td>
            <td style="white-space: nowrap;">${resposta['Idade'] || '--'}</td>
        `;
        
        tbody.appendChild(row);
    });
}

// ============================================
// SORTEIO - FUNÇÕES NOVAS
// ============================================

function reinicializarTelaSorteio() {
    if (!participantesCarregados) {
        // Mostrar tela de carregar participantes
        document.getElementById('telaCarregarParticipantes').style.display = 'block';
        document.getElementById('telaCarregando').style.display = 'none';
        document.getElementById('sorteioHeaderCard').style.display = 'none';
        document.getElementById('btnSortear').style.display = 'none';
        document.getElementById('sorteioArea').style.display = 'none';
        document.getElementById('historicoSorteiosContainer').style.display = 'none';
    } else {
        // Mostrar dashboard de sorteio
        document.getElementById('telaCarregarParticipantes').style.display = 'none';
        document.getElementById('telaCarregando').style.display = 'none';
        document.getElementById('sorteioHeaderCard').style.display = 'block';
        document.getElementById('btnSortear').style.display = 'block';
        document.getElementById('historicoSorteiosContainer').style.display = 'block';
        atualizarDadosSorteio();
        atualizarHistoricoUI();
    }
}

async function carregarParticipantes() {
    // Desabilitar botão
    document.getElementById('btnCarregar').disabled = true;
    document.getElementById('btnCarregar').style.opacity = '0.6';
    
    // Transição para tela de carregamento
    document.getElementById('telaCarregarParticipantes').style.display = 'none';
    document.getElementById('telaCarregando').style.display = 'block';
    
    const listaParticipantes = document.getElementById('listaParticipantesCarregando');
    listaParticipantes.innerHTML = '';
    
    if (!respostasData || respostasData.length === 0) {
        await loadData();
    }
    
    // Simular carregamento com nomes aparecendo um a um
    for (let i = 0; i < respostasData.length; i++) {
        const resposta = respostasData[i];
        const nome = resposta['Nome'] || 'Participante ' + (i + 1);
        
        const item = document.createElement('div');
        item.className = 'participante-item';
        item.innerHTML = `
            <span class="participante-check">✓</span>
            <span>${nome}</span>
        `;
        listaParticipantes.appendChild(item);
        
        // Delay entre cada nome
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Aguardar um pouco mais
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Transição para tela de sorteio
    participantesCarregados = true;
    document.getElementById('telaCarregando').style.display = 'none';
    document.getElementById('sorteioHeaderCard').style.display = 'block';
    document.getElementById('btnSortear').style.display = 'block';
    document.getElementById('historicoSorteiosContainer').style.display = 'block';
    
    atualizarDadosSorteio();
    atualizarHistoricoUI();
}

function atualizarDadosSorteio() {
    document.getElementById('totalParticipantes').textContent = respostasData.length;
    document.getElementById('totalSorteados').textContent = historicoSorteios.length;
}

async function iniciarSorteio() {
    if (respostasData.length === 0) {
        alert('❌ Nenhum participante para sortear!');
        return;
    }

    document.getElementById('sorteioArea').style.display = 'block';
    document.getElementById('btnSortear').disabled = true;
    document.getElementById('carregando').style.display = 'block';
    document.getElementById('contagem').style.display = 'none';
    document.getElementById('resultado').style.display = 'none';

    // Simular carregamento
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Passar para contagem
    document.getElementById('carregando').style.display = 'none';
    document.getElementById('contagem').style.display = 'block';

    // Contagem dramática 10 -> 0
    for (let i = 10; i >= 0; i--) {
        document.getElementById('numeroContagem').textContent = i;
        document.getElementById('numeroContagem').style.transform = 'scale(1.2)';
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        document.getElementById('numeroContagem').style.transform = 'scale(1)';
    }

    // Sortear participante
    const vencedor = sortearParticipante();

    // Mostrar resultado
    document.getElementById('contagem').style.display = 'none';
    document.getElementById('resultado').style.display = 'block';
    document.getElementById('resultadoNome').textContent = vencedor.nome;
    document.getElementById('resultadoCPF').textContent = vencedor.cpf;
    document.getElementById('resultadoTelefone').textContent = vencedor.telefone;
    document.getElementById('resultadoHora').textContent = new Date().toLocaleString('pt-BR');

    // Confetti 🎉
    lancarConfetti();

    // Salvar no histórico
    salvarSorteio(vencedor);

    // Marcar como sorteado
    cpfsSorteados.push(vencedor.cpf);

    // Habilitar botão
    document.getElementById('btnSortear').disabled = false;
}

function sortearParticipante() {
    // Filtrar participantes ainda não sorteados
    let disponiveis = respostasData.filter(p => !cpfsSorteados.includes(p['CPF']));

    if (disponiveis.length === 0) {
        alert('⚠️ Todos os participantes já foram sorteados!');
        return null;
    }

    // Sortear aleatoriamente
    const indice = Math.floor(Math.random() * disponiveis.length);
    const vencedor = disponiveis[indice];

    return {
        nome: vencedor['Nome'] || '--',
        cpf: vencedor['CPF'] || '--',
        telefone: vencedor['Telefone'] || '--',
        data: new Date().toLocaleString('pt-BR')
    };
}

function salvarSorteio(vencedor) {
    historicoSorteios.push(vencedor);
    localStorage.setItem('superfm_sorteios', JSON.stringify(historicoSorteios));
    atualizarHistoricoUI();
    atualizarDadosSorteio();
}

function carregarHistoricoSorteios() {
    const salvo = localStorage.getItem('superfm_sorteios');
    if (salvo) {
        try {
            historicoSorteios = JSON.parse(salvo);
            cpfsSorteados = historicoSorteios.map(s => s.cpf);
            console.log('Histórico carregado:', historicoSorteios.length, 'sorteios');
        } catch (error) {
            console.error('Erro ao carregar histórico:', error);
            historicoSorteios = [];
            cpfsSorteados = [];
            localStorage.removeItem('superfm_sorteios');
        }
    } else {
        historicoSorteios = [];
        cpfsSorteados = [];
    }
}

function atualizarHistoricoUI() {
    const lista = document.getElementById('historicoLista');
    
    if (historicoSorteios.length === 0) {
        lista.innerHTML = '<p class="historico-vazio">Nenhum sorteio realizado ainda</p>';
        return;
    }

    lista.innerHTML = historicoSorteios.map((s, idx) => `
        <div class="historico-item">
            <div class="historico-numero">#${idx + 1}</div>
            <div class="historico-info">
                <strong>${s.nome}</strong><br>
                CPF: ${s.cpf}<br>
                <small>${s.data}</small>
            </div>
        </div>
    `).join('');
}

function fecharResultado() {
    document.getElementById('sorteioArea').style.display = 'none';
    document.getElementById('resultado').style.display = 'none';
    atualizarDadosSorteio();
}

// ============================================
// MODAL DE RESET
// ============================================
function abrirModalReset() {
    document.getElementById('modalReset').style.display = 'flex';
}

function fecharModalReset() {
    document.getElementById('modalReset').style.display = 'none';
}

function confirmarReset() {
    // Limpar tudo
    historicoSorteios = [];
    cpfsSorteados = [];
    
    // Remover do localStorage
    localStorage.removeItem('superfm_sorteios');
    
    // Atualizar UI
    atualizarHistoricoUI();
    atualizarDadosSorteio();
    
    // Fechar modal
    fecharModalReset();
    
    // Feedback visual
    alert('✅ Histórico de sorteios resetado com sucesso!\n\nTodos os participantes podem ser sorteados novamente.');
}

// ============================================
// CONFETTI EFFECT
// ============================================
function lancarConfetti() {
    const confettiCount = 50;
    const colors = ['#2B5BA8', '#FFD700', '#4CAF50', '#FF5722', '#9C27B0'];
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.top = '-10px';
        confetti.style.width = Math.random() * 10 + 5 + 'px';
        confetti.style.height = Math.random() * 10 + 5 + 'px';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.borderRadius = '50%';
        confetti.style.pointerEvents = 'none';
        confetti.style.zIndex = '1000';
        confetti.style.animation = `confetti-fall ${Math.random() * 2 + 2}s linear forwards`;
        
        document.body.appendChild(confetti);
        
        setTimeout(() => confetti.remove(), 4000);
    }
}
