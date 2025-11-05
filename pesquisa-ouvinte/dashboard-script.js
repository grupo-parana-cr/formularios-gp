// ============================================
// CONFIGURAÇÕES
// ============================================
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzw28DjwSek59S0T-uDFS7Gf-jajIiagYuzI4B9OTXdfb2bJ0QVwtqQ7TGnNG1-ZG3e/exec';
const SENHA_PADRAO = 'superfm2025';

// Credenciais válidas (pode adicionar mais usuários)
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
    // Verificar se já está logado
    const isLoggedIn = sessionStorage.getItem('superfm_loggedin');
    const username = sessionStorage.getItem('superfm_username');
    
    if (isLoggedIn === 'true' && username) {
        showDashboard(username);
    }
    
    // Form de login
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
});

// ============================================
// LOGIN
// ============================================
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.toLowerCase().trim();
    const password = document.getElementById('password').value;
    
    // Validar credenciais
    if (USUARIOS_VALIDOS[username] && USUARIOS_VALIDOS[username] === password) {
        // Salvar sessão
        sessionStorage.setItem('superfm_loggedin', 'true');
        sessionStorage.setItem('superfm_username', username);
        
        // Mostrar dashboard
        showDashboard(username);
    } else {
        alert('❌ Usuário ou senha incorretos!');
    }
}

function showDashboard(username) {
    // Esconder tela de login
    document.getElementById('loginScreen').style.display = 'none';
    
    // Mostrar dashboard
    document.getElementById('dashboardScreen').style.display = 'block';
    
    // Mostrar nome do usuário
    document.getElementById('userName').textContent = username.charAt(0).toUpperCase() + username.slice(1);
    
    // Carregar dados
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
        // Tentar carregar do Google Sheets primeiro
        if (GOOGLE_SCRIPT_URL !== 'SUA_URL_DO_GOOGLE_APPS_SCRIPT_AQUI') {
            await loadFromGoogleSheets();
        } else {
            // Se não configurado, carregar do localStorage
            loadFromLocalStorage();
        }
        
        // Atualizar timestamp
        document.getElementById('lastUpdate').textContent = 
            `Última atualização: ${new Date().toLocaleString('pt-BR')}`;
            
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        // Fallback para localStorage
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

function refreshData() {
    loadData();
}

// ============================================
// PROCESSAR DADOS
// ============================================
function processData() {
    if (!respostasData || respostasData.length === 0) {
        showNoDataMessage();
        return;
    }
    
    // Atualizar estatísticas rápidas
    updateQuickStats();
    
    // Gerar gráficos
    generateCharts();
    
    // Preencher tabela
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
    // Total de respostas
    document.getElementById('totalRespostas').textContent = respostasData.length;
    
    // Horário favorito
    const horarios = countOccurrences(respostasData, 'horario');
    document.getElementById('horarioFavorito').textContent = getTopItem(horarios);
    
    // Estilo favorito
    const estilos = countOccurrences(respostasData, 'estilo');
    document.getElementById('estiloFavorito').textContent = getTopItem(estilos);
    
    // Programa favorito
    const programas = countOccurrences(respostasData, 'programa');
    document.getElementById('programaFavorito').textContent = getTopItem(programas);
}

function countOccurrences(data, field) {
    const counts = {};
    data.forEach(item => {
        const value = item[field] || item[field.charAt(0).toUpperCase() + field.slice(1)];
        if (value) {
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
    // Destruir gráficos existentes
    Object.values(chartInstances).forEach(chart => chart.destroy());
    chartInstances = {};
    
    // Gráfico 1: Horários
    createBarChart('chartHorarios', 'horario', 'Horários');
    
    // Gráfico 2: Estilos
    createPieChart('chartEstilos', 'estilo', 'Estilos');
    
    // Gráfico 3: Locutores
    createBarChart('chartLocutores', 'locutor', 'Locutores');
    
    // Gráfico 4: Programas
    createBarChart('chartProgramas', 'programa', 'Programas');
    
    // Gráfico 5: Plataformas
    createDoughnutChart('chartPlataformas', 'plataforma', 'Plataformas');
    
    // Gráfico 6: Idade
    createBarChart('chartIdade', 'idade', 'Idade');
    
    // Gráfico 7: Motivos
    createMotivosChart();
}

function createBarChart(canvasId, field, label) {
    const ctx = document.getElementById(canvasId);
    const data = countOccurrences(respostasData, field);
    
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
    const data = countOccurrences(respostasData, field);
    
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
    const data = countOccurrences(respostasData, field);
    
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
    const motivosCount = {};
    
    respostasData.forEach(resposta => {
        const motivos = resposta.motivos || resposta.Motivos || '';
        if (motivos) {
            const motivosArray = motivos.split(',').map(m => m.trim());
            motivosArray.forEach(motivo => {
                if (motivo) {
                    motivosCount[motivo] = (motivosCount[motivo] || 0) + 1;
                }
            });
        }
    });
    
    chartInstances['chartMotivos'] = new Chart(ctx, {
        type: 'horizontalBar',
        data: {
            labels: Object.keys(motivosCount),
            datasets: [{
                label: 'Número de Respostas',
                data: Object.values(motivosCount),
                backgroundColor: 'rgba(255, 215, 0, 0.7)',
                borderColor: 'rgba(255, 215, 0, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'y',
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
        tbody.innerHTML = '<tr><td colspan="7" class="no-data">Nenhuma resposta encontrada</td></tr>';
        return;
    }
    
    respostasData.forEach(resposta => {
        const row = document.createElement('tr');
        
        // Formatar data
        let dataFormatada = '--';
        if (resposta.timestamp || resposta['Data/Hora']) {
            const data = new Date(resposta.timestamp || resposta['Data/Hora']);
            dataFormatada = data.toLocaleString('pt-BR');
        }
        
        row.innerHTML = `
            <td>${dataFormatada}</td>
            <td>${resposta.horario || resposta.Horário || '--'}</td>
            <td>${resposta.estilo || resposta['Estilo Musical'] || '--'}</td>
            <td>${resposta.locutor || resposta.Locutor || '--'}</td>
            <td>${resposta.programa || resposta.Programa || '--'}</td>
            <td>${resposta.nome || resposta.Nome || '--'}</td>
            <td>${resposta.telefone || resposta.Telefone || '--'}</td>
        `;
        
        tbody.appendChild(row);
    });
}
