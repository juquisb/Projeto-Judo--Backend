// app.js - Sistema de Gestão de Judô

// Estado global
let currentUser = null;
let alunosCache = [];
let chartFrequencia = null;
let chartEvolucao = null;
let chartAlunoFrequencia = null;
let chartAlunoEvolucao = null;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    
    // Event Listeners
    document.getElementById('login-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        login();
    });
});

// ==================== AUTENTICAÇÃO ====================

function checkAuth() {
    fetch('/api/auth/check', {
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.authenticated) {
            currentUser = data;
            showAppScreen(data.perfil);
        } else {
            showLoginScreen();
        }
    })
    .catch(error => {
        console.error('Erro ao verificar autenticação:', error);
        showLoginScreen();
    });
}

function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    fetch('/api/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            currentUser = data;
            showAppScreen(data.perfil);
        } else {
            document.getElementById('login-error').textContent = data.error || 'Erro ao fazer login';
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        document.getElementById('login-error').textContent = 'Erro de conexão';
    });
}

function logout() {
    fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
    })
    .then(() => {
        currentUser = null;
        showLoginScreen();
    })
    .catch(error => console.error('Erro ao fazer logout:', error));
}

function showLoginScreen() {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById('login-screen').classList.add('active');
}

function showAppScreen(perfil) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    if (perfil === 'admin') {
        document.getElementById('admin-screen').classList.add('active');
        loadDashboard();
        loadAlunosForSelect(); // Carregar alunos para selects
        loadTiposGolpes(); // Carregar tipos de golpes para filtros
    } else {
        document.getElementById('aluno-screen').classList.add('active');
        loadAvisosAluno();
        loadNotificacoes();
        loadJustificativasAluno();
        loadAvaliacoesAluno();
    }
}

// ==================== NAVEGAÇÃO ====================

function showSection(sectionId, event) {
    if (event) event.preventDefault();
    
    // Esconder todas as seções
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remover active de todos os links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Mostrar seção selecionada
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.add('active');
        if (event) event.target.classList.add('active');
        
        // Carregar dados da seção
        switch(sectionId) {
            case 'dashboard':
                loadDashboard();
                break;
            case 'alunos':
                loadAlunos();
                break;
            case 'presenca':
                loadPresencas();
                break;
            case 'avaliacoes':
                loadAvaliacoes();
                loadAlunosForSelect(); // Para o filtro de aluno
                break;
            case 'avisos':
                loadAvisos();
                break;
            case 'biblioteca':
                loadBiblioteca();
                break;
            case 'usuarios':
                loadUsuarios();
                setTimeout(() => loadAlunosSemLogin(), 100);
                break;
            case 'justificativas-admin':
                loadJustificativasAdmin();
                loadAlunosForJustificativasFilter();
                break;
            case 'rematricula':
                loadAlunosForRematricula();
                break;
        }
    } else {
        console.error(`Seção ${sectionId} não encontrada!`);
    }
}

function showSectionAluno(sectionId, event) {
    if (event) event.preventDefault();
    
    // Esconder todas as seções
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remover active de todos os links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Mostrar seção selecionada
    const section = document.getElementById('aluno-' + sectionId);
    if (section) {
        section.classList.add('active');
        if (event) event.target.classList.add('active');
        
        // Carregar dados da seção
        switch(sectionId) {
            case 'dashboard':
                loadDashboardAluno();
                break;
            case 'presenca':
                loadPresencasAluno();
                break;
            case 'biblioteca':
                loadBibliotecaAluno();
                break;
            case 'avisos':
                loadAvisosAluno();
                break;
            case 'avaliacoes':
                loadAvaliacoesAluno();
                break;
            case 'justificativas':
                loadJustificativasAluno();
                break;
            case 'notificacoes':
                loadNotificacoes();
                break;
        }
    } else {
        console.error(`Seção aluno-${sectionId} não encontrada!`);
    }
}

// ==================== DASHBOARD ====================

function loadDashboard() {
    const dataInicio = document.getElementById('filter-data-inicio').value || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
    const dataFim = document.getElementById('filter-data-fim').value || new Date().toISOString().split('T')[0];
    const tipo = document.getElementById('filter-tipo').value;
    
    // Setar valores nos inputs se estiverem vazios
    if (!document.getElementById('filter-data-inicio').value) {
        document.getElementById('filter-data-inicio').value = dataInicio;
    }
    if (!document.getElementById('filter-data-fim').value) {
        document.getElementById('filter-data-fim').value = dataFim;
    }
    
    let url = '/api/dashboard/frequencia?';
    const params = new URLSearchParams();
    if (dataInicio) params.append('data_inicio', dataInicio);
    if (dataFim) params.append('data_fim', dataFim);
    if (tipo) params.append('tipo_aluno', tipo);
    
    fetch(url + params.toString(), {
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        updateFrequenciaChart(data);
        updateRankingTable(data);
    })
    .catch(error => console.error('Erro ao carregar dashboard:', error));
    
    // Carregar evolução
    let urlEvolucao = '/api/dashboard/evolucao?';
    const paramsEvolucao = new URLSearchParams();
    if (dataInicio) paramsEvolucao.append('data_inicio', dataInicio);
    if (dataFim) paramsEvolucao.append('data_fim', dataFim);
    
    fetch(urlEvolucao + paramsEvolucao.toString(), {
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        updateEvolucaoChart(data);
    })
    .catch(error => console.error('Erro ao carregar evolução:', error));
    
    // Carregar avisos
    loadAvisosDashboard();
}

function updateFrequenciaChart(data) {
    const ctx = document.getElementById('chart-frequencia').getContext('2d');
    
    if (chartFrequencia) {
        chartFrequencia.destroy();
    }
    
    const labels = data.map(item => item.nome);
    const frequencias = data.map(item => item.frequencia_percentual);
    
    chartFrequencia = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Frequência (%)',
                data: frequencias,
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

function updateEvolucaoChart(data) {
    const ctx = document.getElementById('chart-evolucao').getContext('2d');
    
    if (chartEvolucao) {
        chartEvolucao.destroy();
    }
    
    const labels = data.map(item => new Date(item.data).toLocaleDateString('pt-BR'));
    const frequencias = data.map(item => item.frequencia);
    
    chartEvolucao = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Frequência (%)',
                data: frequencias,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

function updateRankingTable(data) {
    const tbody = document.querySelector('#ranking-table tbody');
    tbody.innerHTML = '';
    
    // Ordenar por frequência (decrescente)
    data.sort((a, b) => b.frequencia_percentual - a.frequencia_percentual);
    
    data.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.nome}</td>
            <td>${item.tipo}</td>
            <td>${item.presentes}</td>
            <td>${item.ausentes}</td>
            <td>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${item.frequencia_percentual}%"></div>
                    <span>${item.frequencia_percentual.toFixed(1)}%</span>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function loadAvisosDashboard() {
    fetch('/api/avisos', {
        credentials: 'include'
    })
    .then(response => response.json())
    .then(avisos => {
        const container = document.getElementById('avisos-dashboard');
        if (avisos.length === 0) {
            container.innerHTML = '<p>Nenhum aviso recente.</p>';
            return;
        }
        
        let html = '<h3>Últimos Avisos</h3>';
        avisos.slice(0, 3).forEach(aviso => {
            html += `
                <div class="aviso-card">
                    <h4>${aviso.titulo}</h4>
                    <p>${aviso.conteudo.substring(0, 100)}...</p>
                    <small>${new Date(aviso.data_publicacao).toLocaleDateString('pt-BR')}</small>
                </div>
            `;
        });
        container.innerHTML = html;
    })
    .catch(error => console.error('Erro ao carregar avisos:', error));
}

// ==================== DASHBOARD ALUNO ====================

function loadDashboardAluno() {
    // Carregar avisos para aluno
    loadAvisosAluno();
    
    // Carregar gráficos de frequência do aluno
    const alunoId = currentUser.aluno_id;
    if (!alunoId) {
        console.error('Aluno ID não encontrado');
        return;
    }
    
    const dataInicio = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
    const dataFim = new Date().toISOString().split('T')[0];
    
    // Gráfico de frequência
    fetch(`/api/dashboard/frequencia?data_inicio=${dataInicio}&data_fim=${dataFim}`, {
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        const alunoData = data.find(item => item.aluno_id == alunoId);
        if (alunoData) {
            updateAlunoFrequenciaChart(alunoData);
        }
    });
    
    // Gráfico de evolução
    fetch(`/api/dashboard/evolucao?data_inicio=${dataInicio}&data_fim=${dataFim}&aluno_id=${alunoId}`, {
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        updateAlunoEvolucaoChart(data);
    });
}

function updateAlunoFrequenciaChart(alunoData) {
    const ctx = document.getElementById('chart-aluno-frequencia').getContext('2d');
    
    if (chartAlunoFrequencia) {
        chartAlunoFrequencia.destroy();
    }
    
    chartAlunoFrequencia = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Presentes', 'Ausentes'],
            datasets: [{
                data: [alunoData.presentes, alunoData.ausentes],
                backgroundColor: ['#4caf50', '#f44336']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                title: {
                    display: true,
                    text: `Frequência: ${alunoData.frequencia_percentual.toFixed(1)}%`
                }
            }
        }
    });
}

function updateAlunoEvolucaoChart(data) {
    const ctx = document.getElementById('chart-aluno-evolucao').getContext('2d');
    
    if (chartAlunoEvolucao) {
        chartAlunoEvolucao.destroy();
    }
    
    const labels = data.map(item => new Date(item.data).toLocaleDateString('pt-BR'));
    const frequencias = data.map(item => item.frequencia);
    
    chartAlunoEvolucao = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Minha Frequência (%)',
                data: frequencias,
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

// ==================== ALUNOS ====================

function loadAlunos() {
    fetch('/api/alunos', {
        credentials: 'include'
    })
    .then(response => response.json())
    .then(alunos => {
        alunosCache = alunos;
        const tbody = document.querySelector('#alunos-table tbody');
        tbody.innerHTML = '';
        
        alunos.forEach(aluno => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${aluno.nome_completo}</td>
                <td>${aluno.idade || '-'}</td>
                <td><span class="badge graduacao">${aluno.graduacao_atual}</span></td>
                <td>${aluno.modalidade || '-'}</td>
                <td>${aluno.peso ? aluno.peso + ' kg' : '-'}</td>
                <td>${aluno.imc || '-'}</td>
                <td>${aluno.categoria || '-'}</td>
                <td><span class="status-badge ${aluno.status.toLowerCase()}">${aluno.status}</span></td>
                <td>
                    <button onclick="openAlunoModal(${aluno.id})" class="btn btn-small">Editar</button>
                    <button onclick="deleteAluno(${aluno.id})" class="btn btn-small btn-danger">Excluir</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    })
    .catch(error => console.error('Erro ao carregar alunos:', error));
}

function openAlunoModal(alunoId = null) {
    const modalBody = document.getElementById('modal-body');
    
    if (alunoId) {
        // Editar aluno existente
        fetch(`/api/alunos/${alunoId}`, {
            credentials: 'include'
        })
        .then(response => response.json())
        .then(aluno => {
            modalBody.innerHTML = `
                <h3>Editar Aluno</h3>
                <form id="aluno-form">
                    <input type="hidden" id="aluno-id" value="${aluno.id}">
                    <div class="form-group">
                        <label>Nome Completo *</label>
                        <input type="text" id="aluno-nome" value="${aluno.nome_completo}" required>
                    </div>
                    <div class="form-group">
                        <label>Tipo *</label>
                        <select id="aluno-tipo" required>
                            <option value="Criança" ${aluno.tipo === 'Criança' ? 'selected' : ''}>Criança</option>
                            <option value="Adulto" ${aluno.tipo === 'Adulto' ? 'selected' : ''}>Adulto</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Data de Nascimento</label>
                        <input type="date" id="aluno-nascimento" value="${aluno.data_nascimento || ''}">
                    </div>
                    <div class="form-group">
                        <label>Nome do Responsável</label>
                        <input type="text" id="aluno-responsavel" value="${aluno.nome_responsavel || ''}">
                    </div>
                    <div class="form-group">
                        <label>Contato</label>
                        <input type="text" id="aluno-contato" value="${aluno.contato || ''}">
                    </div>
                    <div class="form-group">
                        <label>Status *</label>
                        <select id="aluno-status" required>
                            <option value="Ativo" ${aluno.status === 'Ativo' ? 'selected' : ''}>Ativo</option>
                            <option value="Inativo" ${aluno.status === 'Inativo' ? 'selected' : ''}>Inativo</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Graduação Atual</label>
                        <select id="aluno-graduacao">
                            <option value="Branca" ${aluno.graduacao_atual === 'Branca' ? 'selected' : ''}>Branca</option>
                            <option value="Cinza" ${aluno.graduacao_atual === 'Cinza' ? 'selected' : ''}>Cinza</option>
                            <option value="Azul" ${aluno.graduacao_atual === 'Azul' ? 'selected' : ''}>Azul</option>
                            <option value="Amarela" ${aluno.graduacao_atual === 'Amarela' ? 'selected' : ''}>Amarela</option>
                            <option value="Laranja" ${aluno.graduacao_atual === 'Laranja' ? 'selected' : ''}>Laranja</option>
                            <option value="Verde" ${aluno.graduacao_atual === 'Verde' ? 'selected' : ''}>Verde</option>
                            <option value="Roxa" ${aluno.graduacao_atual === 'Roxa' ? 'selected' : ''}>Roxa</option>
                            <option value="Marrom" ${aluno.graduacao_atual === 'Marrom' ? 'selected' : ''}>Marrom</option>
                            <option value="Preta" ${aluno.graduacao_atual === 'Preta' ? 'selected' : ''}>Preta</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Modalidade</label>
                        <input type="text" id="aluno-modalidade" value="${aluno.modalidade || ''}">
                    </div>
                    <div class="form-group">
                        <label>Pode Graduar?</label>
                        <input type="checkbox" id="aluno-pode-graduar" ${aluno.pode_graduar ? 'checked' : ''}>
                    </div>
                    <div class="form-group">
                        <label>Peso (kg)</label>
                        <input type="number" step="0.1" id="aluno-peso" value="${aluno.peso || ''}">
                    </div>
                    <div class="form-group">
                        <label>Altura (cm)</label>
                        <input type="number" step="0.1" id="aluno-altura" value="${aluno.altura || ''}">
                    </div>
                    <div class="form-group">
                        <label>Observações</label>
                        <textarea id="aluno-observacoes" rows="3">${aluno.observacoes || ''}</textarea>
                    </div>
                    <button type="submit" class="btn btn-primary">Salvar</button>
                </form>
            `;
            
            document.getElementById('modal-overlay').classList.add('active');
        });
    } else {
        // Novo aluno
        const hoje = new Date().toISOString().split('T')[0];
        
        modalBody.innerHTML = `
            <h3>Novo Aluno</h3>
            <form id="aluno-form">
                <div class="form-group">
                    <label>Nome Completo *</label>
                    <input type="text" id="aluno-nome" required>
                </div>
                <div class="form-group">
                    <label>Tipo *</label>
                    <select id="aluno-tipo" required>
                        <option value="Criança">Criança</option>
                        <option value="Adulto">Adulto</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Data de Nascimento</label>
                    <input type="date" id="aluno-nascimento">
                </div>
                <div class="form-group">
                    <label>Nome do Responsável</label>
                    <input type="text" id="aluno-responsavel">
                </div>
                <div class="form-group">
                    <label>Contato</label>
                    <input type="text" id="aluno-contato">
                </div>
                <div class="form-group">
                    <label>Data de Matrícula *</label>
                    <input type="date" id="aluno-matricula" value="${hoje}" required>
                </div>
                <div class="form-group">
                    <label>Status *</label>
                    <select id="aluno-status" required>
                        <option value="Ativo" selected>Ativo</option>
                        <option value="Inativo">Inativo</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Graduação Atual</label>
                    <select id="aluno-graduacao">
                        <option value="Branca" selected>Branca</option>
                        <option value="Cinza">Cinza</option>
                        <option value="Azul">Azul</option>
                        <option value="Amarela">Amarela</option>
                        <option value="Laranja">Laranja</option>
                        <option value="Verde">Verde</option>
                        <option value="Roxa">Roxa</option>
                        <option value="Marrom">Marrom</option>
                        <option value="Preta">Preta</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Modalidade</label>
                    <input type="text" id="aluno-modalidade">
                </div>
                <div class="form-group">
                    <label>Peso (kg)</label>
                    <input type="number" step="0.1" id="aluno-peso">
                </div>
                <div class="form-group">
                    <label>Altura (cm)</label>
                    <input type="number" step="0.1" id="aluno-altura">
                </div>
                <div class="form-group">
                    <label>Observações</label>
                    <textarea id="aluno-observacoes" rows="3"></textarea>
                </div>
                <button type="submit" class="btn btn-primary">Criar</button>
            </form>
        `;
        
        document.getElementById('modal-overlay').classList.add('active');
    }
    
    // Configurar submit do formulário
    setTimeout(() => {
        document.getElementById('aluno-form').addEventListener('submit', function(e) {
            e.preventDefault();
            saveAluno();
        });
    }, 100);
}

function saveAluno() {
    const alunoId = document.getElementById('aluno-id')?.value;
    const isEdit = !!alunoId;
    
    const data = {
        nome_completo: document.getElementById('aluno-nome').value,
        tipo: document.getElementById('aluno-tipo').value,
        data_nascimento: document.getElementById('aluno-nascimento').value || null,
        nome_responsavel: document.getElementById('aluno-responsavel').value || null,
        contato: document.getElementById('aluno-contato').value || null,
        status: document.getElementById('aluno-status').value,
        graduacao_atual: document.getElementById('aluno-graduacao').value,
        modalidade: document.getElementById('aluno-modalidade').value || null,
        pode_graduar: document.getElementById('aluno-pode-graduar')?.checked || false,
        peso: document.getElementById('aluno-peso').value ? parseFloat(document.getElementById('aluno-peso').value) : null,
        altura: document.getElementById('aluno-altura').value ? parseFloat(document.getElementById('aluno-altura').value) : null,
        observacoes: document.getElementById('aluno-observacoes').value || null
    };
    
    if (!isEdit) {
        data.data_matricula = document.getElementById('aluno-matricula').value;
    }
    
    const url = isEdit ? `/api/alunos/${alunoId}` : '/api/alunos';
    const method = isEdit ? 'PUT' : 'POST';
    
    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(isEdit ? 'Aluno atualizado com sucesso!' : 'Aluno criado com sucesso!');
            closeModal();
            loadAlunos();
        } else {
            alert('Erro: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao salvar aluno');
    });
}

function deleteAluno(alunoId) {
    if (confirm('Tem certeza que deseja excluir este aluno?')) {
        fetch(`/api/alunos/${alunoId}`, {
            method: 'DELETE',
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Aluno excluído com sucesso!');
                loadAlunos();
            } else {
                alert('Erro: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Erro ao excluir aluno');
        });
    }
}

function openImportarModal() {
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <h3>Importar Alunos em Massa</h3>
        <p>Selecione um arquivo CSV ou Excel com os dados dos alunos.</p>
        
        <div class="form-group">
            <label>Arquivo *</label>
            <input type="file" id="import-file" accept=".csv,.xlsx,.xls" required>
        </div>
        
        <div class="form-group">
            <label>Formato esperado:</label>
            <ul style="font-size: 0.9em; color: #666;">
                <li>Coluna "Nome" (obrigatória)</li>
                <li>Coluna "Data Nascimento" (opcional, formato DD/MM/AAAA ou AAAA-MM-DD)</li>
                <li>Coluna "Tipo" (opcional: "Criança" ou "Adulto")</li>
                <li>Coluna "Nome Responsável" (opcional)</li>
                <li>Coluna "Contato" (opcional)</li>
                <li>Coluna "Status" (opcional: "Ativo" ou "Inativo")</li>
                <li>Coluna "Graduação" (opcional)</li>
                <li>Coluna "Modalidade" (opcional)</li>
                <li>Coluna "Peso" (opcional, em kg)</li>
                <li>Coluna "Altura" (opcional, em cm)</li>
            </ul>
        </div>
        
        <div style="display: flex; gap: 10px; margin-top: 20px;">
            <button onclick="importarAlunos()" class="btn btn-primary">Importar</button>
            <a href="/api/alunos/template" class="btn btn-secondary" download>📄 Baixar Template</a>
        </div>
    `;
    
    document.getElementById('modal-overlay').classList.add('active');
}

function importarAlunos() {
    const fileInput = document.getElementById('import-file');
    if (!fileInput.files.length) {
        alert('Selecione um arquivo!');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    
    fetch('/api/alunos/importar', {
        method: 'POST',
        credentials: 'include',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(data.mensagem);
            closeModal();
            loadAlunos();
        } else {
            alert('Erro: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao importar alunos');
    });
}

function loadAlunosForSelect(selectedAlunoId = null) {
    fetch('/api/alunos', {
        credentials: 'include'
    })
    .then(response => response.json())
    .then(alunos => {
        // Atualizar select de filtro de aluno para avaliações
        const selectAvaliacao = document.getElementById('filter-aluno-avaliacao');
        if (selectAvaliacao) {
            selectAvaliacao.innerHTML = '<option value="">Todos os alunos</option>';
            alunos.forEach(aluno => {
                const option = document.createElement('option');
                option.value = aluno.id;
                option.textContent = aluno.nome_completo;
                if (selectedAlunoId && aluno.id == selectedAlunoId) {
                    option.selected = true;
                }
                selectAvaliacao.appendChild(option);
            });
        }
        
        // Atualizar select de filtro de aluno para justificativas admin
        const selectJustificativa = document.getElementById('filter-aluno-justificativa');
        if (selectJustificativa) {
            selectJustificativa.innerHTML = '<option value="">Todos os alunos</option>';
            alunos.forEach(aluno => {
                const option = document.createElement('option');
                option.value = aluno.id;
                option.textContent = aluno.nome_completo;
                selectJustificativa.appendChild(option);
            });
        }
        
        // Atualizar select de aluno para rematrícula
        const selectRematricula = document.getElementById('aluno-rematricula');
        if (selectRematricula) {
            selectRematricula.innerHTML = '';
            alunos.forEach(aluno => {
                const option = document.createElement('option');
                option.value = aluno.id;
                option.textContent = aluno.nome_completo;
                selectRematricula.appendChild(option);
            });
        }
    });
}

function loadAlunosForRematricula() {
    loadAlunosForSelect();
}

// ==================== PRESENÇA ====================

function loadPresencas() {
    const dataSelecionada = document.getElementById('presenca-data').value || new Date().toISOString().split('T')[0];
    document.getElementById('presenca-data').value = dataSelecionada;
    
    fetch(`/api/presencas/hoje?data=${dataSelecionada}`, {
        credentials: 'include'
    })
    .then(response => response.json())
    .then(alunos => {
        const container = document.getElementById('presenca-lista');
        container.innerHTML = '';
        
        alunos.forEach(aluno => {
            const presenca = aluno.presenca_hoje;
            const isPresente = presenca ? presenca.presente : false;
            const justificativa = presenca ? presenca.justificativa : '';
            
            const div = document.createElement('div');
            div.className = 'presenca-item';
            div.innerHTML = `
                <div class="presenca-info">
                    <span class="aluno-nome">${aluno.nome_completo}</span>
                    <span class="aluno-info">${aluno.graduacao_atual} • ${aluno.tipo}</span>
                </div>
                <div class="presenca-actions">
                    <button class="btn-presenca ${isPresente ? 'presente active' : 'presente'}" 
                            onclick="marcarPresenca(${aluno.id}, '${dataSelecionada}', true)">
                        ✅ Presente
                    </button>
                    <button class="btn-presenca ${!isPresente && !justificativa ? 'ausente active' : 'ausente'}" 
                            onclick="marcarPresenca(${aluno.id}, '${dataSelecionada}', false)">
                        ❌ Ausente
                    </button>
                    <input type="text" 
                           class="justificativa-input" 
                           placeholder="Justificativa..." 
                           value="${justificativa || ''}"
                           onchange="atualizarJustificativaPresenca(${aluno.id}, '${dataSelecionada}', this.value)">
                </div>
            `;
            container.appendChild(div);
        });
    })
    .catch(error => console.error('Erro ao carregar presenças:', error));
}

function marcarHoje() {
    const hoje = new Date().toISOString().split('T')[0];
    document.getElementById('presenca-data').value = hoje;
    loadPresencas();
}

function marcarPresenca(alunoId, data, presente) {
    fetch('/api/presencas', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
            aluno_id: alunoId,
            data: data,
            presente: presente,
            justificativa: ''
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            loadPresencas();
        }
    })
    .catch(error => console.error('Erro ao marcar presença:', error));
}

function atualizarJustificativaPresenca(alunoId, data, justificativa) {
    fetch('/api/presencas', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
            aluno_id: alunoId,
            data: data,
            presente: false,
            justificativa: justificativa
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Justificativa atualizada');
        }
    })
    .catch(error => console.error('Erro ao atualizar justificativa:', error));
}

function loadPresencasAluno() {
    fetch('/api/presencas', {
        credentials: 'include'
    })
    .then(response => response.json())
    .then(presencas => {
        const tbody = document.querySelector('#aluno-presencas-table tbody');
        tbody.innerHTML = '';
        
        presencas.forEach(p => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(p.data).toLocaleDateString('pt-BR')}</td>
                <td>
                    <span class="status-badge ${p.presente ? 'presente' : 'ausente'}">
                        ${p.presente ? 'Presente' : 'Ausente'}
                    </span>
                </td>
                <td>${p.justificativa || '-'}</td>
            `;
            tbody.appendChild(row);
        });
    })
    .catch(error => console.error('Erro ao carregar presenças do aluno:', error));
}

// ==================== AVALIAÇÕES ====================

function loadAvaliacoes() {
    const alunoId = document.getElementById('filter-aluno-avaliacao')?.value || '';
    
    let url = '/api/avaliacoes';
    if (alunoId) {
        url += `?aluno_id=${alunoId}&incluir_nao_liberadas=true`;
    }
    
    fetch(url, {
        credentials: 'include'
    })
    .then(response => response.json())
    .then(avaliacoes => {
        const container = document.getElementById('avaliacoes-lista');
        container.innerHTML = '';
        
        if (avaliacoes.length === 0) {
            container.innerHTML = '<p>Nenhuma avaliação encontrada.</p>';
            return;
        }
        
        avaliacoes.forEach(av => {
            const card = document.createElement('div');
            card.className = 'avaliacao-card';
            card.innerHTML = `
                <div class="avaliacao-header">
                    <h4>${av.nome_completo}</h4>
                    <span class="status-badge ${av.status.toLowerCase()}">${av.status}</span>
                </div>
                <div class="avaliacao-data">
                    <p><strong>Data:</strong> ${new Date(av.data_avaliacao).toLocaleDateString('pt-BR')}</p>
                    ${av.media ? `<p><strong>Média:</strong> ${av.media}</p>` : ''}
                </div>
                <div class="avaliacao-notas">
                    <span>Disciplina: ${av.disciplina || '-'}</span>
                    <span>Técnica: ${av.tecnica || '-'}</span>
                    <span>Participação: ${av.participacao || '-'}</span>
                    <span>Respeito: ${av.respeito_comportamento || '-'}</span>
                </div>
                ${av.observacoes ? `<p><strong>Observações:</strong> ${av.observacoes}</p>` : ''}
                <div class="avaliacao-actions">
                    <button onclick="openAvaliacaoModal(${av.id})" class="btn btn-small">Editar</button>
                    ${av.status !== 'Liberada' ? `<button onclick="liberarAvaliacao(${av.id})" class="btn btn-small btn-success">Liberar</button>` : ''}
                </div>
            `;
            container.appendChild(card);
        });
    })
    .catch(error => console.error('Erro ao carregar avaliações:', error));
}

function loadAvaliacoesAluno() {
    fetch('/api/avaliacoes', {
        credentials: 'include'
    })
    .then(response => response.json())
    .then(avaliacoes => {
        const container = document.getElementById('aluno-avaliacoes-lista');
        container.innerHTML = '';
        
        if (avaliacoes.length === 0) {
            container.innerHTML = '<p>Nenhuma avaliação disponível.</p>';
            return;
        }
        
        avaliacoes.forEach(av => {
            const card = document.createElement('div');
            card.className = 'avaliacao-card';
            card.innerHTML = `
                <div class="avaliacao-header">
                    <h4>Avaliação</h4>
                    <span class="status-badge ${av.status.toLowerCase()}">${av.status}</span>
                </div>
                <div class="avaliacao-data">
                    <p><strong>Data:</strong> ${new Date(av.data_avaliacao).toLocaleDateString('pt-BR')}</p>
                    ${av.media ? `<p><strong>Média Geral:</strong> ${av.media}</p>` : ''}
                </div>
                <div class="avaliacao-notas">
                    <div class="nota-item">
                        <span class="nota-label">Disciplina:</span>
                        <span class="nota-valor">${av.disciplina || '-'}</span>
                    </div>
                    <div class="nota-item">
                        <span class="nota-label">Técnica:</span>
                        <span class="nota-valor">${av.tecnica || '-'}</span>
                    </div>
                    <div class="nota-item">
                        <span class="nota-label">Participação:</span>
                        <span class="nota-valor">${av.participacao || '-'}</span>
                    </div>
                    <div class="nota-item">
                        <span class="nota-label">Respeito/Comportamento:</span>
                        <span class="nota-valor">${av.respeito_comportamento || '-'}</span>
                    </div>
                </div>
                ${av.observacoes ? `<div class="avaliacao-observacoes"><strong>Observações do Sensei:</strong> ${av.observacoes}</div>` : ''}
            `;
            container.appendChild(card);
        });
    })
    .catch(error => console.error('Erro ao carregar avaliações do aluno:', error));
}

function openAvaliacaoModal(avaliacaoId = null) {
    const modalBody = document.getElementById('modal-body');
    
    if (avaliacaoId) {
        // Editar avaliação existente
        fetch(`/api/avaliacoes/${avaliacaoId}`, {
            credentials: 'include'
        })
        .then(response => response.json())
        .then(avaliacao => {
            modalBody.innerHTML = `
                <h3>Editar Avaliação</h3>
                <form id="avaliacao-form">
                    <input type="hidden" id="avaliacao-id" value="${avaliacao.id}">
                    <div class="form-group">
                        <label>Aluno *</label>
                        <select id="avaliacao-aluno" required></select>
                    </div>
                    <div class="form-group">
                        <label>Data da Avaliação *</label>
                        <input type="date" id="avaliacao-data" value="${avaliacao.data_avaliacao}" required>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Disciplina (0-10)</label>
                            <input type="number" min="0" max="10" step="0.5" id="avaliacao-disciplina" value="${avaliacao.disciplina || ''}">
                        </div>
                        <div class="form-group">
                            <label>Técnica (0-10)</label>
                            <input type="number" min="0" max="10" step="0.5" id="avaliacao-tecnica" value="${avaliacao.tecnica || ''}">
                        </div>
                        <div class="form-group">
                            <label>Participação (0-10)</label>
                            <input type="number" min="0" max="10" step="0.5" id="avaliacao-participacao" value="${avaliacao.participacao || ''}">
                        </div>
                        <div class="form-group">
                            <label>Respeito (0-10)</label>
                            <input type="number" min="0" max="10" step="0.5" id="avaliacao-respeito" value="${avaliacao.respeito_comportamento || ''}">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Status</label>
                        <select id="avaliacao-status">
                            <option value="Rascunho" ${avaliacao.status === 'Rascunho' ? 'selected' : ''}>Rascunho</option>
                            <option value="Liberada" ${avaliacao.status === 'Liberada' ? 'selected' : ''}>Liberada</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Observações</label>
                        <textarea id="avaliacao-observacoes" rows="3">${avaliacao.observacoes || ''}</textarea>
                    </div>
                    <button type="submit" class="btn btn-primary">Salvar</button>
                </form>
            `;
            
            // Carregar alunos para select
            loadAlunosForSelect(avaliacao.aluno_id);
            document.getElementById('modal-overlay').classList.add('active');
        });
    } else {
        // Nova avaliação
        const hoje = new Date().toISOString().split('T')[0];
        
        modalBody.innerHTML = `
            <h3>Nova Avaliação</h3>
            <form id="avaliacao-form">
                <div class="form-group">
                    <label>Aluno *</label>
                    <select id="avaliacao-aluno" required></select>
                </div>
                <div class="form-group">
                    <label>Data da Avaliação *</label>
                    <input type="date" id="avaliacao-data" value="${hoje}" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Disciplina (0-10)</label>
                        <input type="number" min="0" max="10" step="0.5" id="avaliacao-disciplina">
                    </div>
                    <div class="form-group">
                        <label>Técnica (0-10)</label>
                        <input type="number" min="0" max="10" step="0.5" id="avaliacao-tecnica">
                    </div>
                    <div class="form-group">
                        <label>Participação (0-10)</label>
                        <input type="number" min="0" max="10" step="0.5" id="avaliacao-participacao">
                    </div>
                    <div class="form-group">
                        <label>Respeito (0-10)</label>
                        <input type="number" min="0" max="10" step="0.5" id="avaliacao-respeito">
                    </div>
                </div>
                <div class="form-group">
                    <label>Observações</label>
                    <textarea id="avaliacao-observacoes" rows="3"></textarea>
                </div>
                <button type="submit" class="btn btn-primary">Criar</button>
            </form>
        `;
        
        // Carregar alunos para select
        loadAlunosForSelect();
        document.getElementById('modal-overlay').classList.add('active');
    }
    
    // Configurar submit do formulário
    setTimeout(() => {
        document.getElementById('avaliacao-form').addEventListener('submit', function(e) {
            e.preventDefault();
            saveAvaliacao();
        });
    }, 100);
}

function saveAvaliacao() {
    const avaliacaoId = document.getElementById('avaliacao-id')?.value;
    const isEdit = !!avaliacaoId;
    
    const data = {
        aluno_id: document.getElementById('avaliacao-aluno').value,
        data_avaliacao: document.getElementById('avaliacao-data').value,
        disciplina: document.getElementById('avaliacao-disciplina').value || null,
        tecnica: document.getElementById('avaliacao-tecnica').value || null,
        participacao: document.getElementById('avaliacao-participacao').value || null,
        respeito_comportamento: document.getElementById('avaliacao-respeito').value || null,
        observacoes: document.getElementById('avaliacao-observacoes').value || null
    };
    
    if (isEdit) {
        data.status = document.getElementById('avaliacao-status').value;
    }
    
    const url = isEdit ? `/api/avaliacoes/${avaliacaoId}` : '/api/avaliacoes';
    const method = isEdit ? 'PUT' : 'POST';
    
    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(isEdit ? 'Avaliação atualizada com sucesso!' : 'Avaliação criada com sucesso!');
            closeModal();
            loadAvaliacoes();
        } else {
            alert('Erro: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao salvar avaliação');
    });
}

function liberarAvaliacao(avaliacaoId) {
    if (confirm('Liberar esta avaliação para visualização do aluno?')) {
        fetch(`/api/avaliacoes/${avaliacaoId}/liberar`, {
            method: 'POST',
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Avaliação liberada com sucesso!');
                loadAvaliacoes();
            } else {
                alert('Erro: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Erro ao liberar avaliação');
        });
    }
}

// ==================== AVISOS ====================

function loadAvisos() {
    fetch('/api/avisos', {
        credentials: 'include'
    })
    .then(response => response.json())
    .then(avisos => {
        const container = document.getElementById('avisos-lista');
        container.innerHTML = '';
        
        if (avisos.length === 0) {
            container.innerHTML = '<p>Nenhum aviso cadastrado.</p>';
            return;
        }
        
        avisos.forEach(aviso => {
            const card = document.createElement('div');
            card.className = 'aviso-card';
            card.innerHTML = `
                <div class="aviso-header">
                    <h4>${aviso.titulo}</h4>
                    <span class="aviso-data">${new Date(aviso.data_publicacao).toLocaleDateString('pt-BR')}</span>
                </div>
                <div class="aviso-conteudo">
                    <p>${aviso.conteudo}</p>
                </div>
                <div class="aviso-actions">
                    <button onclick="deletarAviso(${aviso.id})" class="btn btn-small btn-danger">Excluir</button>
                </div>
            `;
            container.appendChild(card);
        });
    })
    .catch(error => console.error('Erro ao carregar avisos:', error));
}

function loadAvisosAluno() {
    fetch('/api/avisos', {
        credentials: 'include'
    })
    .then(response => response.json())
    .then(avisos => {
        const container = document.getElementById('avisos-aluno-lista');
        container.innerHTML = '';
        
        if (avisos.length === 0) {
            container.innerHTML = '<p>Nenhum aviso disponível.</p>';
            return;
        }
        
        avisos.forEach(aviso => {
            const card = document.createElement('div');
            card.className = 'aviso-card';
            card.innerHTML = `
                <div class="aviso-header">
                    <h4>${aviso.titulo}</h4>
                    <span class="aviso-data">${new Date(aviso.data_publicacao).toLocaleDateString('pt-BR')}</span>
                </div>
                <div class="aviso-conteudo">
                    <p>${aviso.conteudo}</p>
                </div>
            `;
            container.appendChild(card);
        });
    })
    .catch(error => console.error('Erro ao carregar avisos para aluno:', error));
}

function openAvisoModal() {
    const modalBody = document.getElementById('modal-body');
    const hoje = new Date().toISOString().split('T')[0];
    
    modalBody.innerHTML = `
        <h3>Novo Aviso</h3>
        <form id="aviso-form">
            <div class="form-group">
                <label>Título *</label>
                <input type="text" id="aviso-titulo" required>
            </div>
            <div class="form-group">
                <label>Conteúdo *</label>
                <textarea id="aviso-conteudo" rows="5" required></textarea>
            </div>
            <div class="form-group">
                <label>Data de Publicação</label>
                <input type="date" id="aviso-data" value="${hoje}">
            </div>
            <button type="submit" class="btn btn-primary">Publicar</button>
        </form>
    `;
    
    document.getElementById('modal-overlay').classList.add('active');
    
    setTimeout(() => {
        document.getElementById('aviso-form').addEventListener('submit', function(e) {
            e.preventDefault();
            saveAviso();
        });
    }, 100);
}

function saveAviso() {
    const data = {
        titulo: document.getElementById('aviso-titulo').value,
        conteudo: document.getElementById('aviso-conteudo').value,
        data_publicacao: document.getElementById('aviso-data').value
    };
    
    fetch('/api/avisos', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Aviso publicado com sucesso!');
            closeModal();
            loadAvisos();
        } else {
            alert('Erro: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao publicar aviso');
    });
}

function deletarAviso(avisoId) {
    if (confirm('Tem certeza que deseja excluir este aviso?')) {
        fetch(`/api/avisos/${avisoId}`, {
            method: 'DELETE',
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Aviso excluído com sucesso!');
                loadAvisos();
            } else {
                alert('Erro: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Erro ao excluir aviso');
        });
    }
}

// ==================== BIBLIOTECA TÉCNICA ====================

function loadBiblioteca() {
    const graduacao = document.getElementById('filter-graduacao-bib')?.value || '';
    const modalidade = document.getElementById('filter-modalidade-bib')?.value || '';
    const tipoGolpe = document.getElementById('filter-tipo-golpe-bib')?.value || '';
    
    let url = '/api/biblioteca';
    const params = new URLSearchParams();
    if (graduacao) params.append('graduacao', graduacao);
    if (modalidade) params.append('modalidade', modalidade);
    if (tipoGolpe) params.append('tipo_golpe', tipoGolpe);
    
    if (params.toString()) {
        url += '?' + params.toString();
    }
    
    fetch(url, {
        credentials: 'include'
    })
    .then(response => response.json())
    .then(conteudos => {
        const container = document.getElementById('biblioteca-lista');
        container.innerHTML = '';
        
        if (conteudos.length === 0) {
            container.innerHTML = '<p>Nenhum conteúdo encontrado.</p>';
            return;
        }
        
        conteudos.forEach(conteudo => {
            const card = document.createElement('div');
            card.className = 'biblioteca-card';
            card.innerHTML = `
                <div class="biblioteca-header">
                    <h4>${conteudo.titulo}</h4>
                    <span class="badge tipo-golpe">${conteudo.tipo_golpe || 'Geral'}</span>
                </div>
                <div class="biblioteca-info">
                    <p><strong>Graduação:</strong> ${conteudo.graduacao_minima || 'Todas'}</p>
                    <p><strong>Modalidade:</strong> ${conteudo.modalidade || 'Geral'}</p>
                </div>
                <div class="biblioteca-descricao">
                    <p>${conteudo.descricao || conteudo.instrucoes || 'Sem descrição'}</p>
                </div>
                ${conteudo.url_video ? `
                    <div class="biblioteca-video">
                        <a href="${conteudo.url_video}" target="_blank" class="btn btn-small">Assistir Vídeo</a>
                    </div>
                ` : ''}
                ${conteudo.url_foto ? `
                    <div class="biblioteca-foto">
                        <img src="${conteudo.url_foto}" alt="${conteudo.titulo}" style="max-width: 100%; border-radius: 4px;">
                    </div>
                ` : ''}
                <div class="biblioteca-actions">
                    <button onclick="openBibliotecaModal(${conteudo.id})" class="btn btn-small">Editar</button>
                    <button onclick="deletarConteudoBiblioteca(${conteudo.id})" class="btn btn-small btn-danger">Excluir</button>
                </div>
            `;
            container.appendChild(card);
        });
    })
    .catch(error => console.error('Erro ao carregar biblioteca:', error));
}

function loadBibliotecaAluno() {
    const graduacao = document.getElementById('filter-graduacao-bib-aluno')?.value || '';
    const modalidade = document.getElementById('filter-modalidade-bib-aluno')?.value || '';
    
    let url = '/api/biblioteca';
    const params = new URLSearchParams();
    if (graduacao) params.append('graduacao', graduacao);
    if (modalidade) params.append('modalidade', modalidade);
    
    if (params.toString()) {
        url += '?' + params.toString();
    }
    
    fetch(url, {
        credentials: 'include'
    })
    .then(response => response.json())
    .then(conteudos => {
        const container = document.getElementById('biblioteca-lista-aluno');
        container.innerHTML = '';
        
        if (conteudos.length === 0) {
            container.innerHTML = '<p>Nenhum conteúdo disponível.</p>';
            return;
        }
        
        conteudos.forEach(conteudo => {
            const card = document.createElement('div');
            card.className = 'biblioteca-card';
            card.innerHTML = `
                <div class="biblioteca-header">
                    <h4>${conteudo.titulo}</h4>
                    <span class="badge tipo-golpe">${conteudo.tipo_golpe || 'Geral'}</span>
                </div>
                <div class="biblioteca-info">
                    <p><strong>Graduação:</strong> ${conteudo.graduacao_minima || 'Todas'}</p>
                    <p><strong>Modalidade:</strong> ${conteudo.modalidade || 'Geral'}</p>
                </div>
                <div class="biblioteca-descricao">
                    <p>${conteudo.descricao || conteudo.instrucoes || 'Sem descrição'}</p>
                </div>
                ${conteudo.url_video ? `
                    <div class="biblioteca-video">
                        <a href="${conteudo.url_video}" target="_blank" class="btn btn-small">Assistir Vídeo</a>
                    </div>
                ` : ''}
                ${conteudo.url_foto ? `
                    <div class="biblioteca-foto">
                        <img src="${conteudo.url_foto}" alt="${conteudo.titulo}" style="max-width: 100%; border-radius: 4px;">
                    </div>
                ` : ''}
            `;
            container.appendChild(card);
        });
    })
    .catch(error => console.error('Erro ao carregar biblioteca do aluno:', error));
}

function loadTiposGolpes() {
    fetch('/api/biblioteca/tipos-golpes', {
        credentials: 'include'
    })
    .then(response => response.json())
    .then(tipos => {
        const selectBib = document.getElementById('filter-tipo-golpe-bib');
        if (selectBib) {
            selectBib.innerHTML = '<option value="">Todos os tipos</option>';
            tipos.forEach(tipo => {
                const option = document.createElement('option');
                option.value = tipo;
                option.textContent = tipo;
                selectBib.appendChild(option);
            });
        }
    })
    .catch(error => console.error('Erro ao carregar tipos de golpes:', error));
}

function openBibliotecaModal(conteudoId = null) {
    const modalBody = document.getElementById('modal-body');
    
    if (conteudoId) {
        // Editar conteúdo existente
        fetch(`/api/biblioteca/${conteudoId}`, {
            credentials: 'include'
        })
        .then(response => response.json())
        .then(conteudo => {
            modalBody.innerHTML = `
                <h3>Editar Conteúdo</h3>
                <form id="biblioteca-form">
                    <input type="hidden" id="conteudo-id" value="${conteudo.id}">
                    <div class="form-group">
                        <label>Título *</label>
                        <input type="text" id="conteudo-titulo" value="${conteudo.titulo}" required>
                    </div>
                    <div class="form-group">
                        <label>Tipo de Golpe</label>
                        <select id="conteudo-tipo-golpe"></select>
                    </div>
                    <div class="form-group">
                        <label>Graduação Mínima</label>
                        <select id="conteudo-graduacao">
                            <option value="">Todas</option>
                            <option value="Branca" ${conteudo.graduacao_minima === 'Branca' ? 'selected' : ''}>Branca</option>
                            <option value="Cinza" ${conteudo.graduacao_minima === 'Cinza' ? 'selected' : ''}>Cinza</option>
                            <option value="Azul" ${conteudo.graduacao_minima === 'Azul' ? 'selected' : ''}>Azul</option>
                            <option value="Amarela" ${conteudo.graduacao_minima === 'Amarela' ? 'selected' : ''}>Amarela</option>
                            <option value="Laranja" ${conteudo.graduacao_minima === 'Laranja' ? 'selected' : ''}>Laranja</option>
                            <option value="Verde" ${conteudo.graduacao_minima === 'Verde' ? 'selected' : ''}>Verde</option>
                            <option value="Roxa" ${conteudo.graduacao_minima === 'Roxa' ? 'selected' : ''}>Roxa</option>
                            <option value="Marrom" ${conteudo.graduacao_minima === 'Marrom' ? 'selected' : ''}>Marrom</option>
                            <option value="Preta" ${conteudo.graduacao_minima === 'Preta' ? 'selected' : ''}>Preta</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Modalidade</label>
                        <input type="text" id="conteudo-modalidade" value="${conteudo.modalidade || ''}">
                    </div>
                    <div class="form-group">
                        <label>URL do Vídeo</label>
                        <input type="url" id="conteudo-url-video" value="${conteudo.url_video || ''}">
                    </div>
                    <div class="form-group">
                        <label>URL da Foto</label>
                        <input type="url" id="conteudo-url-foto" value="${conteudo.url_foto || ''}">
                    </div>
                    <div class="form-group">
                        <label>Instruções</label>
                        <textarea id="conteudo-instrucoes" rows="3">${conteudo.instrucoes || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Descrição</label>
                        <textarea id="conteudo-descricao" rows="3">${conteudo.descricao || ''}</textarea>
                    </div>
                    <button type="submit" class="btn btn-primary">Salvar</button>
                </form>
            `;
            
            // Carregar tipos de golpes
            loadTiposGolpesForModal(conteudo.tipo_golpe);
            document.getElementById('modal-overlay').classList.add('active');
        });
    } else {
        // Novo conteúdo
        modalBody.innerHTML = `
            <h3>Novo Conteúdo</h3>
            <form id="biblioteca-form">
                <div class="form-group">
                    <label>Título *</label>
                    <input type="text" id="conteudo-titulo" required>
                </div>
                <div class="form-group">
                    <label>Tipo de Golpe</label>
                    <select id="conteudo-tipo-golpe"></select>
                </div>
                <div class="form-group">
                    <label>Graduação Mínima</label>
                    <select id="conteudo-graduacao">
                        <option value="">Todas</option>
                        <option value="Branca">Branca</option>
                        <option value="Cinza">Cinza</option>
                        <option value="Azul">Azul</option>
                        <option value="Amarela">Amarela</option>
                        <option value="Laranja">Laranja</option>
                        <option value="Verde">Verde</option>
                        <option value="Roxa">Roxa</option>
                        <option value="Marrom">Marrom</option>
                        <option value="Preta">Preta</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Modalidade</label>
                    <input type="text" id="conteudo-modalidade">
                </div>
                <div class="form-group">
                    <label>URL do Vídeo</label>
                    <input type="url" id="conteudo-url-video">
                </div>
                <div class="form-group">
                    <label>URL da Foto</label>
                    <input type="url" id="conteudo-url-foto">
                </div>
                <div class="form-group">
                    <label>Instruções</label>
                    <textarea id="conteudo-instrucoes" rows="3"></textarea>
                </div>
                <div class="form-group">
                    <label>Descrição</label>
                    <textarea id="conteudo-descricao" rows="3"></textarea>
                </div>
                <button type="submit" class="btn btn-primary">Criar</button>
            </form>
        `;
        
        // Carregar tipos de golpes
        loadTiposGolpesForModal();
        document.getElementById('modal-overlay').classList.add('active');
    }
    
    // Configurar submit do formulário
    setTimeout(() => {
        document.getElementById('biblioteca-form').addEventListener('submit', function(e) {
            e.preventDefault();
            saveBiblioteca();
        });
    }, 100);
}

function loadTiposGolpesForModal(selectedTipo = null) {
    fetch('/api/biblioteca/tipos-golpes', {
        credentials: 'include'
    })
    .then(response => response.json())
    .then(tipos => {
        const select = document.getElementById('conteudo-tipo-golpe');
        select.innerHTML = '<option value="">Selecione...</option>';
        
        tipos.forEach(tipo => {
            const option = document.createElement('option');
            option.value = tipo;
            option.textContent = tipo;
            if (selectedTipo && tipo === selectedTipo) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    });
}

function saveBiblioteca() {
    const conteudoId = document.getElementById('conteudo-id')?.value;
    const isEdit = !!conteudoId;
    
    const data = {
        titulo: document.getElementById('conteudo-titulo').value,
        tipo_golpe: document.getElementById('conteudo-tipo-golpe').value || null,
        graduacao_minima: document.getElementById('conteudo-graduacao').value || null,
        modalidade: document.getElementById('conteudo-modalidade').value || null,
        url_video: document.getElementById('conteudo-url-video').value || null,
        url_foto: document.getElementById('conteudo-url-foto').value || null,
        instrucoes: document.getElementById('conteudo-instrucoes').value || null,
        descricao: document.getElementById('conteudo-descricao').value || null
    };
    
    const url = isEdit ? `/api/biblioteca/${conteudoId}` : '/api/biblioteca';
    const method = isEdit ? 'PUT' : 'POST';
    
    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(isEdit ? 'Conteúdo atualizado com sucesso!' : 'Conteúdo criado com sucesso!');
            closeModal();
            loadBiblioteca();
        } else {
            alert('Erro: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao salvar conteúdo');
    });
}

function deletarConteudoBiblioteca(conteudoId) {
    if (confirm('Tem certeza que deseja excluir este conteúdo?')) {
        fetch(`/api/biblioteca/${conteudoId}`, {
            method: 'DELETE',
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Conteúdo excluído com sucesso!');
                loadBiblioteca();
            } else {
                alert('Erro: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Erro ao excluir conteúdo');
        });
    }
}

// ==================== USUÁRIOS ====================

function loadUsuarios() {
    fetch('/api/usuarios', {
        credentials: 'include'
    })
    .then(response => response.json())
    .then(usuarios => {
        const tbody = document.querySelector('#usuarios-table tbody');
        tbody.innerHTML = '';
        
        usuarios.forEach(usuario => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${usuario.username}</td>
                <td>${usuario.nome || '-'}</td>
                <td><span class="badge ${usuario.perfil}">${usuario.perfil}</span></td>
                <td>${usuario.nome_aluno || '-'}</td>
                <td>${new Date(usuario.created_at).toLocaleDateString('pt-BR')}</td>
                <td>
                    <button onclick="openUsuarioModal(${usuario.id})" class="btn btn-small">Editar</button>
                    <button onclick="deletarUsuario(${usuario.id})" class="btn btn-small btn-danger">Excluir</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    })
    .catch(error => console.error('Erro ao carregar usuários:', error));
}

function loadAlunosSemLogin() {
    fetch('/api/usuarios/alunos-sem-login', {
        credentials: 'include'
    })
    .then(response => response.json())
    .then(alunos => {
        const select = document.getElementById('alunos-sem-login');
        select.innerHTML = '';
        
        alunos.forEach(aluno => {
            const option = document.createElement('option');
            option.value = aluno.id;
            option.textContent = aluno.nome_completo;
            select.appendChild(option);
        });
    })
    .catch(error => console.error('Erro ao carregar alunos sem login:', error));
}

function openUsuarioModal(usuarioId = null) {
    const modalBody = document.getElementById('modal-body');
    
    if (usuarioId) {
        // Editar usuário existente
        fetch(`/api/usuarios/${usuarioId}`, {
            credentials: 'include'
        })
        .then(response => response.json())
        .then(usuario => {
            modalBody.innerHTML = `
                <h3>Editar Usuário</h3>
                <form id="usuario-form">
                    <input type="hidden" id="usuario-id" value="${usuario.id}">
                    <div class="form-group">
                        <label>Username</label>
                        <input type="text" id="usuario-username" value="${usuario.username}" required>
                    </div>
                    <div class="form-group">
                        <label>Nome</label>
                        <input type="text" id="usuario-nome" value="${usuario.nome || ''}">
                    </div>
                    <div class="form-group">
                        <label>Perfil</label>
                        <select id="usuario-perfil">
                            <option value="admin" ${usuario.perfil === 'admin' ? 'selected' : ''}>Admin</option>
                            <option value="aluno" ${usuario.perfil === 'aluno' ? 'selected' : ''}>Aluno</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Aluno Vinculado</label>
                        <select id="usuario-aluno-id">
                            <option value="">Nenhum</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Nova Senha (deixe em branco para manter atual)</label>
                        <input type="password" id="usuario-password">
                    </div>
                    <div class="form-group">
                        <label>Confirmar Senha</label>
                        <input type="password" id="usuario-password-confirm">
                    </div>
                    <button type="submit" class="btn btn-primary">Salvar</button>
                </form>
            `;
            
            // Carregar alunos para select
            loadAlunosForUsuarioSelect(usuario.aluno_id);
            
            document.getElementById('modal-overlay').classList.add('active');
        });
    } else {
        // Novo usuário
        modalBody.innerHTML = `
            <h3>Novo Usuário</h3>
            <form id="usuario-form">
                <div class="form-group">
                    <label>Username *</label>
                    <input type="text" id="usuario-username" required>
                </div>
                <div class="form-group">
                    <label>Nome</label>
                    <input type="text" id="usuario-nome">
                </div>
                <div class="form-group">
                    <label>Perfil *</label>
                    <select id="usuario-perfil" required>
                        <option value="admin">Admin</option>
                        <option value="aluno" selected>Aluno</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Aluno Vinculado</label>
                    <select id="usuario-aluno-id">
                        <option value="">Nenhum</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Senha *</label>
                    <input type="password" id="usuario-password" required>
                </div>
                <div class="form-group">
                    <label>Confirmar Senha *</label>
                    <input type="password" id="usuario-password-confirm" required>
                </div>
                <button type="submit" class="btn btn-primary">Criar</button>
            </form>
        `;
        
        // Carregar alunos para select
        loadAlunosForUsuarioSelect();
        
        document.getElementById('modal-overlay').classList.add('active');
    }
    
    // Configurar submit do formulário
    setTimeout(() => {
        document.getElementById('usuario-form').addEventListener('submit', function(e) {
            e.preventDefault();
            saveUsuario();
        });
    }, 100);
}

function loadAlunosForUsuarioSelect(selectedAlunoId = null) {
    fetch('/api/alunos', {
        credentials: 'include'
    })
    .then(response => response.json())
    .then(alunos => {
        const select = document.getElementById('usuario-aluno-id');
        if (!select) return;
        
        select.innerHTML = '<option value="">Nenhum</option>';
        alunos.forEach(aluno => {
            const option = document.createElement('option');
            option.value = aluno.id;
            option.textContent = aluno.nome_completo;
            if (selectedAlunoId && aluno.id == selectedAlunoId) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    });
}

function saveUsuario() {
    const usuarioId = document.getElementById('usuario-id')?.value;
    const isEdit = !!usuarioId;
    
    const password = document.getElementById('usuario-password').value;
    const passwordConfirm = document.getElementById('usuario-password-confirm').value;
    
    if ((!isEdit || password) && password !== passwordConfirm) {
        alert('As senhas não coincidem!');
        return;
    }
    
    const data = {
        username: document.getElementById('usuario-username').value,
        nome: document.getElementById('usuario-nome').value,
        perfil: document.getElementById('usuario-perfil').value,
        aluno_id: document.getElementById('usuario-aluno-id').value || null
    };
    
    if (password) {
        data.password = password;
    }
    
    const url = isEdit ? `/api/usuarios/${usuarioId}` : '/api/usuarios';
    const method = isEdit ? 'PUT' : 'POST';
    
    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(isEdit ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!');
            closeModal();
            loadUsuarios();
            loadAlunosSemLogin();
        } else {
            alert('Erro: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao salvar usuário');
    });
}

function criarLoginParaAluno() {
    const select = document.getElementById('alunos-sem-login');
    const alunoId = select.value;
    const alunoNome = select.options[select.selectedIndex].text;
    
    if (!alunoId) {
        alert('Selecione um aluno!');
        return;
    }
    
    const username = prompt(`Digite o username para ${alunoNome}:`);
    if (!username) return;
    
    const password = prompt('Digite a senha:');
    if (!password) return;
    
    const data = {
        username: username,
        password: password,
        perfil: 'aluno',
        aluno_id: alunoId,
        nome: alunoNome
    };
    
    fetch('/api/usuarios', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Login criado com sucesso!');
            loadUsuarios();
            loadAlunosSemLogin();
        } else {
            alert('Erro: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao criar login');
    });
}

function deletarUsuario(usuarioId) {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
        fetch(`/api/usuarios/${usuarioId}`, {
            method: 'DELETE',
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Usuário excluído com sucesso!');
                loadUsuarios();
                loadAlunosSemLogin();
            } else {
                alert('Erro: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Erro ao excluir usuário');
        });
    }
}

// ==================== JUSTIFICATIVAS (ADMIN) ====================

function loadJustificativasAdmin() {
    const status = document.getElementById('filter-status-justificativa')?.value || '';
    const alunoId = document.getElementById('filter-aluno-justificativa')?.value || '';
    
    let url = '/api/justificativas';
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (alunoId) params.append('aluno_id', alunoId);
    
    if (params.toString()) {
        url += '?' + params.toString();
    }
    
    fetch(url, {
        credentials: 'include'
    })
    .then(response => response.json())
    .then(justificativas => {
        const container = document.getElementById('justificativas-admin-lista');
        if (!container) return;
        
        if (justificativas.length === 0) {
            container.innerHTML = '<p>Nenhuma justificativa encontrada.</p>';
            return;
        }
        
        let html = '<div class="justificativas-grid">';
        
        justificativas.forEach(j => {
            html += `
                <div class="justificativa-card ${j.lida ? 'lida' : 'nao-lida'}">
                    <div class="justificativa-header">
                        <span class="aluno-nome">${j.nome_completo}</span>
                        <span class="status ${j.status.toLowerCase()}">${j.status}</span>
                    </div>
                    <div class="justificativa-body">
                        <p><strong>Data da ausência:</strong> ${new Date(j.data_ausencia).toLocaleDateString('pt-BR')}</p>
                        <p><strong>Justificativa:</strong> ${j.justificativa}</p>
                        ${j.observacao_sensei ? `<p><strong>Observação do Sensei:</strong> ${j.observacao_sensei}</p>` : ''}
                        <p class="data-envio">Enviado em: ${new Date(j.created_at).toLocaleString('pt-BR')}</p>
                    </div>
                    <div class="justificativa-actions">
                        ${!j.lida ? `<button onclick="marcarJustificativaLida(${j.id})" class="btn btn-small">Marcar como lida</button>` : ''}
                        <select onchange="atualizarStatusJustificativa(${j.id}, this.value)" class="form-control-small">
                            <option value="Pendente" ${j.status === 'Pendente' ? 'selected' : ''}>Pendente</option>
                            <option value="Aprovada" ${j.status === 'Aprovada' ? 'selected' : ''}>Aprovada</option>
                            <option value="Rejeitada" ${j.status === 'Rejeitada' ? 'selected' : ''}>Rejeitada</option>
                        </select>
                        <button onclick="adicionarObservacaoJustificativa(${j.id})" class="btn btn-small">Adicionar observação</button>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    })
    .catch(error => console.error('Erro ao carregar justificativas:', error));
}

function marcarJustificativaLida(justificativaId) {
    fetch(`/api/justificativas/${justificativaId}/marcar-lida`, {
        method: 'POST',
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            loadJustificativasAdmin();
        }
    });
}

function atualizarStatusJustificativa(justificativaId, status) {
    fetch(`/api/justificativas/${justificativaId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: status })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            loadJustificativasAdmin();
        }
    });
}

function adicionarObservacaoJustificativa(justificativaId) {
    const observacao = prompt('Digite a observação do Sensei:');
    if (observacao === null) return;
    
    fetch(`/api/justificativas/${justificativaId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ observacao_sensei: observacao })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            loadJustificativasAdmin();
        }
    });
}

// ==================== JUSTIFICATIVAS (ALUNO) ====================

function loadJustificativasAluno() {
    fetch('/api/justificativas', {
        credentials: 'include'
    })
    .then(response => response.json())
    .then(justificativas => {
        const container = document.getElementById('justificativas-aluno-lista');
        if (!container) return;
        
        if (justificativas.length === 0) {
            container.innerHTML = '<p>Nenhuma justificativa enviada.</p>';
            return;
        }
        
        let html = '<table class="data-table"><thead><tr><th>Data da Ausência</th><th>Justificativa</th><th>Status</th><th>Observação</th><th>Enviado em</th></tr></thead><tbody>';
        
        justificativas.forEach(j => {
            html += `
                <tr>
                    <td>${new Date(j.data_ausencia).toLocaleDateString('pt-BR')}</td>
                    <td>${j.justificativa}</td>
                    <td><span class="status ${j.status.toLowerCase()}">${j.status}</span></td>
                    <td>${j.observacao_sensei || '-'}</td>
                    <td>${new Date(j.created_at).toLocaleString('pt-BR')}</td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        container.innerHTML = html;
    })
    .catch(error => console.error('Erro ao carregar justificativas do aluno:', error));
}

function openJustificativaModal() {
    const modalBody = document.getElementById('modal-body');
    const hoje = new Date().toISOString().split('T')[0];
    
    modalBody.innerHTML = `
        <h3>Nova Justificativa de Ausência</h3>
        <form id="justificativa-form">
            <div class="form-group">
                <label>Data da Ausência *</label>
                <input type="date" id="justificativa-data" value="${hoje}" required>
            </div>
            <div class="form-group">
                <label>Justificativa *</label>
                <textarea id="justificativa-texto" rows="4" required></textarea>
            </div>
            <button type="submit" class="btn btn-primary">Enviar</button>
        </form>
    `;
    
    document.getElementById('modal-overlay').classList.add('active');
    
    setTimeout(() => {
        document.getElementById('justificativa-form').addEventListener('submit', function(e) {
            e.preventDefault();
            enviarJustificativa();
        });
    }, 100);
}

function enviarJustificativa() {
    const data = {
        data_ausencia: document.getElementById('justificativa-data').value,
        justificativa: document.getElementById('justificativa-texto').value
    };
    
    fetch('/api/justificativas', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Justificativa enviada com sucesso!');
            closeModal();
            loadJustificativasAluno();
        } else {
            alert('Erro: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao enviar justificativa');
    });
}

// ==================== NOTIFICAÇÕES ====================

function loadNotificacoes() {
    fetch('/api/notificacoes', {
        credentials: 'include'
    })
    .then(response => response.json())
    .then(notificacoes => {
        // Atualizar badge
        const badge = document.getElementById('notificacao-badge');
        const naoLidas = notificacoes.filter(n => !n.lida).length;
        
        if (badge) {
            if (naoLidas > 0) {
                badge.textContent = naoLidas;
                badge.style.display = 'inline';
            } else {
                badge.style.display = 'none';
            }
        }
        
        // Atualizar contador total
        const totalSpan = document.getElementById('notificacoes-total');
        if (totalSpan) {
            totalSpan.textContent = `${notificacoes.length} notificação${notificacoes.length !== 1 ? 'es' : ''} (${naoLidas} não lida${naoLidas !== 1 ? 's' : ''})`;
        }
        
        // Atualizar lista se estiver na seção de notificações
        const container = document.getElementById('notificacoes-lista');
        if (!container) return;
        
        if (notificacoes.length === 0) {
            container.innerHTML = '<p>Nenhuma notificação.</p>';
            return;
        }
        
        let html = '';
        notificacoes.forEach(notificacao => {
            html += `
                <div class="notificacao-card ${notificacao.lida ? 'lida' : 'nao-lida'}">
                    <div class="notificacao-header">
                        <span class="notificacao-titulo">${notificacao.titulo}</span>
                        <span class="notificacao-data">${new Date(notificacao.data_notificacao).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div class="notificacao-conteudo">
                        <p>${notificacao.mensagem}</p>
                    </div>
                    <div class="notificacao-actions">
                        ${!notificacao.lida ? `<button onclick="marcarNotificacaoLida(${notificacao.id})" class="btn btn-small">Marcar como lida</button>` : ''}
                        ${notificacao.link ? `<a href="${notificacao.link}" class="btn btn-small">Ver</a>` : ''}
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    })
    .catch(error => console.error('Erro ao carregar notificações:', error));
}

function marcarNotificacaoLida(notificacaoId) {
    fetch(`/api/notificacoes/${notificacaoId}/marcar-lida`, {
        method: 'POST',
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            loadNotificacoes();
        }
    });
}

function marcarTodasNotificacoesLidas() {
    fetch('/api/notificacoes/marcar-todas-lidas', {
        method: 'POST',
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            loadNotificacoes();
        }
    });
}

// ==================== REMATRÍCULA ====================

function gerarLinkRematricula() {
    const alunoId = document.getElementById('aluno-rematricula').value;
    
    if (!alunoId) {
        alert('Selecione um aluno!');
        return;
    }
    
    fetch('/api/rematriculas/gerar-link', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ aluno_id: alunoId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const resultado = document.getElementById('link-rematricula-result');
            const urlCompleta = window.location.origin + data.link;
            resultado.innerHTML = `
                <div class="success-message">
                    <p><strong>Link gerado com sucesso!</strong></p>
                    <p>Compartilhe este link com o aluno/responsável:</p>
                    <div class="link-box">
                        <input type="text" value="${urlCompleta}" readonly style="width: 100%; padding: 8px; margin: 10px 0;">
                        <button onclick="copiarParaAreaTransferencia('${urlCompleta}')" class="btn btn-small">Copiar Link</button>
                    </div>
                </div>
            `;
        } else {
            alert('Erro: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao gerar link');
    });
}

function copiarParaAreaTransferencia(texto) {
    navigator.clipboard.writeText(texto)
        .then(() => alert('Link copiado para a área de transferência!'))
        .catch(err => alert('Erro ao copiar: ' + err));
}

// ==================== UTILITÁRIOS ====================

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('active');
}

// Carregar tipos de golpes na inicialização
loadTiposGolpes();