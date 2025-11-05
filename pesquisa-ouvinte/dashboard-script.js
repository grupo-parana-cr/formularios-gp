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
});

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
    
    // Mudar botão para loading
    refreshBtn.innerHTML = '⏳ Carregando...';
    refreshBtn.style.background = '#999';
    refreshBtn.style.cursor = 'not-allowed';
    refreshBtn.disabled = true;
    
    try {
        await loadData();
    } finally {
        // Restaurar botão após 1 segundo
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
        tbody.innerHTML = '<tr><td colspan="15" class="no-data">Nenhuma resposta encontrada</td></tr>';
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
            <td>${dataFormatada}</td>
            <td>${resposta['Horário'] || '--'}</td>
            <td>${resposta['Estilo Musical'] || '--'}</td>
            <td>${resposta['Locutor'] || '--'}</td>
            <td>${resposta['Programa'] || '--'}</td>
            <td>${resposta['Muda de Rádio'] || '--'}</td>
            <td>${resposta['Usa como Companhia'] || '--'}</td>
            <td style="max-width: 200px; white-space: normal;">${resposta['Motivos'] || '--'}</td>
            <td>${resposta['Plataforma'] || '--'}</td>
            <td style="max-width: 180px; white-space: normal;">${resposta['Novo Conteúdo'] || '--'}</td>
            <td>${resposta['Anúncios'] || '--'}</td>
            <td>${resposta['Nome'] || '--'}</td>
            <td>${resposta['Telefone'] || '--'}</td>
            <td>${resposta['Sexo'] || '--'}</td>
            <td>${resposta['Idade'] || '--'}</td>
        `;
        
        tbody.appendChild(row);
    });
}
