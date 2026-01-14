"""
Sistema de Gestão de Projeto Social de Judô
Backend Flask com SQLite
"""
from flask import Flask, render_template, request, jsonify, session, redirect, url_for, flash
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from datetime import datetime, timedelta
import sqlite3
import os
import secrets
from functools import wraps
import pandas as pd
import io
import csv
from io import StringIO

app = Flask(__name__)
app.secret_key = secrets.token_hex(32)
CORS(app)

# Configuração do banco de dados
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE = os.path.join(BASE_DIR, 'judo.db')

def get_db():
    """Conexão com o banco de dados"""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Inicializa o banco de dados com todas as tabelas"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Tabela de usuários
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            perfil TEXT NOT NULL,
            nome TEXT,
            aluno_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (aluno_id) REFERENCES alunos(id)
        )
    ''')
    
    # Tabela de alunos
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS alunos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome_completo TEXT NOT NULL,
            tipo TEXT NOT NULL,
            data_nascimento DATE,
            nome_responsavel TEXT,
            contato TEXT,
            data_matricula DATE NOT NULL,
            status TEXT DEFAULT 'Ativo',
            observacoes TEXT,
            -- Novos campos adicionados
            graduacao_atual TEXT DEFAULT 'Branca',
            modalidade TEXT,
            pode_graduar BOOLEAN DEFAULT 0,
            graduar_para TEXT,
            peso REAL,
            altura REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Adicionar novas colunas se a tabela já existir (migração)
    try:
        cursor.execute('ALTER TABLE alunos ADD COLUMN graduacao_atual TEXT DEFAULT "Branca"')
    except:
        pass
    try:
        cursor.execute('ALTER TABLE alunos ADD COLUMN modalidade TEXT')
    except:
        pass
    try:
        cursor.execute('ALTER TABLE alunos ADD COLUMN pode_graduar BOOLEAN DEFAULT 0')
    except:
        pass
    try:
        cursor.execute('ALTER TABLE alunos ADD COLUMN graduar_para TEXT')
    except:
        pass
    try:
        cursor.execute('ALTER TABLE alunos ADD COLUMN peso REAL')
    except:
        pass
    try:
        cursor.execute('ALTER TABLE alunos ADD COLUMN altura REAL')
    except:
        pass
    
    # Tabela de presenças
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS presencas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            aluno_id INTEGER NOT NULL,
            data DATE NOT NULL,
            presente BOOLEAN NOT NULL,
            justificativa TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (aluno_id) REFERENCES alunos(id),
            UNIQUE(aluno_id, data)
        )
    ''')
    
    # Tabela de avaliações/desempenho
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS avaliacoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            aluno_id INTEGER NOT NULL,
            data_avaliacao DATE NOT NULL,
            disciplina REAL,
            tecnica REAL,
            participacao REAL,
            respeito_comportamento REAL,
            observacoes TEXT,
            status TEXT DEFAULT 'Rascunho',
            data_liberacao DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (aluno_id) REFERENCES alunos(id)
        )
    ''')
    
    # Adicionar colunas de status se a tabela já existir
    try:
        cursor.execute('ALTER TABLE avaliacoes ADD COLUMN status TEXT DEFAULT "Rascunho"')
    except:
        pass
    try:
        cursor.execute('ALTER TABLE avaliacoes ADD COLUMN data_liberacao DATE')
    except:
        pass
    try:
        cursor.execute('ALTER TABLE avaliacoes ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP')
    except:
        pass
    
    # Tabela de justificativas de ausência
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS justificativas_ausencia (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            aluno_id INTEGER NOT NULL,
            data_ausencia DATE NOT NULL,
            justificativa TEXT NOT NULL,
            status TEXT DEFAULT 'Pendente',
            lida BOOLEAN DEFAULT 0,
            resolvida BOOLEAN DEFAULT 0,
            observacao_sensei TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (aluno_id) REFERENCES alunos(id)
        )
    ''')
    
    # Tabela de notificações
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS notificacoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER,
            aluno_id INTEGER,
            tipo TEXT NOT NULL,
            titulo TEXT NOT NULL,
            mensagem TEXT NOT NULL,
            lida BOOLEAN DEFAULT 0,
            data_notificacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            link TEXT,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
            FOREIGN KEY (aluno_id) REFERENCES alunos(id)
        )
    ''')
    
    # Tabela de avisos
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS avisos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo TEXT NOT NULL,
            conteudo TEXT NOT NULL,
            data_publicacao DATE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Tabela de rematrículas
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS rematriculas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            aluno_id INTEGER NOT NULL,
            token TEXT UNIQUE NOT NULL,
            data_rematricula DATE NOT NULL,
            valor_pago REAL DEFAULT 20.00,
            status TEXT DEFAULT 'Pendente',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (aluno_id) REFERENCES alunos(id)
        )
    ''')
    
    # Tabela de biblioteca técnica
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS biblioteca_tecnica (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo TEXT NOT NULL,
            tipo_golpe TEXT NOT NULL,
            graduacao_minima TEXT,
            modalidade TEXT,
            url_video TEXT,
            url_foto TEXT,
            instrucoes TEXT,
            descricao TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Criar usuário admin padrão (senha: admin123)
    cursor.execute('SELECT id FROM usuarios WHERE username = ?', ('admin',))
    if not cursor.fetchone():
        cursor.execute('''
            INSERT INTO usuarios (username, password, perfil, nome)
            VALUES (?, ?, ?, ?)
        ''', ('admin', generate_password_hash('admin123'), 'admin', 'Administrador'))
    
    conn.commit()
    conn.close()

# Decorador para verificar autenticação
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Não autenticado'}), 401
        return f(*args, **kwargs)
    return decorated_function

# Decorador para verificar perfil admin
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('perfil') != 'admin':
            return jsonify({'error': 'Acesso negado'}), 403
        return f(*args, **kwargs)
    return decorated_function

# Decorador para verificar perfil aluno
def aluno_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('perfil') != 'aluno':
            return jsonify({'error': 'Acesso negado'}), 403
        return f(*args, **kwargs)
    return decorated_function

# Função auxiliar para criar notificação
def criar_notificacao(usuario_id=None, aluno_id=None, tipo='', titulo='', mensagem='', link=None):
    """Cria uma notificação no sistema"""
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute('''
            INSERT INTO notificacoes (usuario_id, aluno_id, tipo, titulo, mensagem, link)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (usuario_id, aluno_id, tipo, titulo, mensagem, link))
        conn.commit()
    except Exception as e:
        print(f'Erro ao criar notificação: {e}')
    finally:
        conn.close()

# ==================== FUNÇÕES AUXILIARES ====================

def calcular_idade(data_nascimento):
    """Calcula a idade com base na data de nascimento"""
    if not data_nascimento:
        return None
    try:
        if isinstance(data_nascimento, str):
            nascimento = datetime.strptime(data_nascimento, '%Y-%m-%d').date()
        else:
            nascimento = data_nascimento
        hoje = datetime.now().date()
        idade = hoje.year - nascimento.year - ((hoje.month, hoje.day) < (nascimento.month, nascimento.day))
        return idade
    except:
        return None

def calcular_imc(peso, altura):
    """Calcula o IMC (Índice de Massa Corporal)"""
    if not peso or not altura:
        return None
    try:
        # Altura em metros (se estiver em cm, converte)
        altura_m = altura if altura < 3 else altura / 100
        imc = peso / (altura_m ** 2)
        return round(imc, 2)
    except:
        return None

def determinar_classe(idade):
    """Determina a classe do atleta baseado na idade"""
    if not idade:
        return None
    
    if idade < 13:
        return "Infantil"
    elif idade < 16:
        return "Juvenil"
    elif idade < 20:
        return "Júnior"
    elif idade < 30:
        return "Sênior"
    else:
        return "Veterano"

def determinar_categoria(idade, peso, genero='M'):
    """Determina a categoria de peso baseado em idade, peso e regras do Judô"""
    if not idade or not peso:
        return None
    
    # Categorias simplificadas baseadas nas regras da CBJ
    if idade < 13:  # Infantil
        if peso < 30:
            return "Até 30kg"
        elif peso < 34:
            return "Até 34kg"
        elif peso < 38:
            return "Até 38kg"
        elif peso < 42:
            return "Até 42kg"
        elif peso < 46:
            return "Até 46kg"
        elif peso < 50:
            return "Até 50kg"
        elif peso < 55:
            return "Até 55kg"
        else:
            return "Acima de 55kg"
    elif idade < 16:  # Juvenil
        if peso < 40:
            return "Até 40kg"
        elif peso < 44:
            return "Até 44kg"
        elif peso < 48:
            return "Até 48kg"
        elif peso < 52:
            return "Até 52kg"
        elif peso < 57:
            return "Até 57kg"
        elif peso < 63:
            return "Até 63kg"
        elif peso < 70:
            return "Até 70kg"
        else:
            return "Acima de 70kg"
    elif idade < 20:  # Júnior
        if peso < 50:
            return "Até 50kg"
        elif peso < 55:
            return "Até 55kg"
        elif peso < 60:
            return "Até 60kg"
        elif peso < 66:
            return "Até 66kg"
        elif peso < 73:
            return "Até 73kg"
        elif peso < 81:
            return "Até 81kg"
        elif peso < 90:
            return "Até 90kg"
        elif peso < 100:
            return "Até 100kg"
        else:
            return "Acima de 100kg"
    else:  # Sênior/Veterano
        if peso < 60:
            return "Até 60kg"
        elif peso < 66:
            return "Até 66kg"
        elif peso < 73:
            return "Até 73kg"
        elif peso < 81:
            return "Até 81kg"
        elif peso < 90:
            return "Até 90kg"
        elif peso < 100:
            return "Até 100kg"
        else:
            return "Acima de 100kg"

def obter_proxima_graduacao(graduacao_atual):
    """Retorna a próxima graduação possível"""
    graduacoes = [
        "Branca", "Cinza", "Azul", "Amarela", "Laranja",
        "Verde", "Roxa", "Marrom", "Preta"
    ]
    try:
        index = graduacoes.index(graduacao_atual)
        if index < len(graduacoes) - 1:
            return graduacoes[index + 1]
        return None
    except:
        return "Cinza"  # Se não encontrar, assume que pode graduar para Cinza

# ==================== ROTAS DE AUTENTICAÇÃO ====================

@app.route('/')
def index():
    """Página inicial"""
    return render_template('index.html')

@app.route('/api/login', methods=['POST'])
def login():
    """Login de usuário"""
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM usuarios WHERE username = ?', (username,))
    user = cursor.fetchone()
    conn.close()
    
    if user and check_password_hash(user['password'], password):
        session['user_id'] = user['id']
        session['username'] = user['username']
        session['perfil'] = user['perfil']
        session['nome'] = user['nome']
        if user['aluno_id']:
            session['aluno_id'] = user['aluno_id']
        
        return jsonify({
            'success': True,
            'perfil': user['perfil'],
            'nome': user['nome']
        })
    
    return jsonify({'success': False, 'error': 'Credenciais inválidas'}), 401

# ==================== ROTAS DE USUÁRIOS ====================

@app.route('/api/usuarios', methods=['GET'])
@admin_required
def listar_usuarios():
    """Lista todos os usuários"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT u.*, a.nome_completo as nome_aluno 
        FROM usuarios u 
        LEFT JOIN alunos a ON u.aluno_id = a.id 
        ORDER BY u.created_at DESC
    ''')
    usuarios = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(usuarios)

@app.route('/api/usuarios', methods=['POST'])
@admin_required
def criar_usuario():
    """Cria um novo usuário"""
    data = request.json
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Verificar se username já existe
        cursor.execute('SELECT id FROM usuarios WHERE username = ?', (data['username'],))
        if cursor.fetchone():
            conn.close()
            return jsonify({'success': False, 'error': 'Username já existe'}), 400
        
        # Verificar se aluno_id já tem usuário (se fornecido)
        if data.get('aluno_id'):
            cursor.execute('SELECT id FROM usuarios WHERE aluno_id = ?', (data['aluno_id'],))
            if cursor.fetchone():
                conn.close()
                return jsonify({'success': False, 'error': 'Este aluno já possui um login'}), 400
        
        cursor.execute('''
            INSERT INTO usuarios (username, password, perfil, nome, aluno_id)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            data['username'],
            generate_password_hash(data['password']),
            data.get('perfil', 'aluno'),
            data.get('nome'),
            data.get('aluno_id'),                        
        ))
        usuario_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'id': usuario_id}), 201
    except Exception as e:
        conn.close()
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/usuarios/<int:usuario_id>', methods=['GET'])
@admin_required
def obter_usuario(usuario_id):
    """Obtém um usuário específico"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT u.*, a.nome_completo as nome_aluno 
        FROM usuarios u 
        LEFT JOIN alunos a ON u.aluno_id = a.id 
        WHERE u.id = ?
    ''', (usuario_id,))
    usuario = cursor.fetchone()
    conn.close()
    
    if usuario:
        return jsonify(dict(usuario))
    return jsonify({'error': 'Usuário não encontrado'}), 404

@app.route('/api/usuarios/<int:usuario_id>', methods=['PUT'])
@admin_required
def atualizar_usuario(usuario_id):
    """Atualiza um usuário"""
    data = request.json
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Se mudou a senha, hash
        password_hash = None
        if data.get('password'):
            password_hash = generate_password_hash(data['password'])
        
        if password_hash:
            cursor.execute('''
                UPDATE usuarios SET
                    username = ?, password = ?, perfil = ?, nome = ?,
                    aluno_id = ?
                WHERE id = ?
            ''', (
                data.get('username'),
                password_hash,
                data.get('perfil'),
                data.get('nome'),
                data.get('aluno_id'),
                usuario_id
            ))
        else:
            cursor.execute('''
                UPDATE usuarios SET
                    username = ?, perfil = ?, nome = ?,
                    aluno_id = ?
                WHERE id = ?
            ''', (
                data.get('username'),
                data.get('perfil'),
                data.get('nome'),
                data.get('aluno_id'),
                usuario_id
            ))
        
        conn.commit()
        conn.close()
        return jsonify({'success': True})
    except Exception as e:
        conn.close()
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/usuarios/<int:usuario_id>', methods=['DELETE'])
@admin_required
def deletar_usuario(usuario_id):
    """Deleta um usuário"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Não permitir deletar o próprio usuário
    if usuario_id == session.get('user_id'):
        conn.close()
        return jsonify({'success': False, 'error': 'Não é possível deletar seu próprio usuário'}), 400
    
    cursor.execute('DELETE FROM usuarios WHERE id = ?', (usuario_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/usuarios/alunos-sem-login', methods=['GET'])
@admin_required
def listar_alunos_sem_login():
    """Lista alunos que ainda não possuem login"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT a.* FROM alunos a
        LEFT JOIN usuarios u ON a.id = u.aluno_id
        WHERE u.id IS NULL AND a.status = "Ativo"
        ORDER BY a.nome_completo
    ''')
    alunos = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(alunos)

@app.route('/api/logout', methods=['POST'])
def logout():
    """Logout de usuário"""
    session.clear()
    return jsonify({'success': True})

@app.route('/api/auth/check', methods=['GET'])
def check_auth():
    """Verifica se o usuário está autenticado"""
    if 'user_id' in session:
        return jsonify({
            'authenticated': True,
            'perfil': session.get('perfil'),
            'nome': session.get('nome')
        })
    return jsonify({'authenticated': False})

# ==================== ROTAS DE ALUNOS ====================

@app.route('/api/alunos', methods=['GET'])
@login_required
def listar_alunos():
    """Lista todos os alunos"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Se for aluno, só retorna seu próprio registro
    if session.get('perfil') == 'aluno':
        cursor.execute('SELECT * FROM alunos WHERE id = ?', (session.get('aluno_id'),))
    else:
        cursor.execute('SELECT * FROM alunos ORDER BY nome_completo')
    
    alunos = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    # Adicionar cálculos automáticos e converter datas
    for aluno in alunos:
        for key, value in aluno.items():
            if isinstance(value, datetime):
                aluno[key] = value.isoformat()
        
        # Calcular idade
        aluno['idade'] = calcular_idade(aluno.get('data_nascimento'))
        
        # Calcular IMC
        aluno['imc'] = calcular_imc(aluno.get('peso'), aluno.get('altura'))
        
        # Determinar classe
        aluno['classe'] = determinar_classe(aluno['idade'])
        
        # Determinar categoria
        aluno['categoria'] = determinar_categoria(
            aluno['idade'], 
            aluno.get('peso')
        )
        
        # Determinar próxima graduação se pode graduar
        if aluno.get('pode_graduar') and not aluno.get('graduar_para'):
            aluno['graduar_para'] = obter_proxima_graduacao(
                aluno.get('graduacao_atual', 'Branca')
            )
    
    return jsonify(alunos)

@app.route('/api/alunos', methods=['POST'])
@admin_required
def criar_aluno():
    """Cria um novo aluno"""
    data = request.json
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            INSERT INTO alunos (nome_completo, tipo, data_nascimento, nome_responsavel,
                              contato, data_matricula, status, observacoes,
                              graduacao_atual, modalidade, pode_graduar, graduar_para,
                              peso, altura)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data['nome_completo'],
            data['tipo'],
            data.get('data_nascimento'),
            data.get('nome_responsavel'),
            data.get('contato'),
            data.get('data_matricula', datetime.now().date().isoformat()),
            data.get('status', 'Ativo'),
            data.get('observacoes'),
            data.get('graduacao_atual', 'Branca'),
            data.get('modalidade'),
            data.get('pode_graduar', False),
            data.get('graduar_para'),
            data.get('peso'),
            data.get('altura')
        ))
        conn.commit()
        aluno_id = cursor.lastrowid
        conn.close()
        return jsonify({'success': True, 'id': aluno_id}), 201
    except Exception as e:
        conn.close()
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/alunos/<int:aluno_id>', methods=['GET'])
@login_required
def obter_aluno(aluno_id):
    """Obtém dados de um aluno específico"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Se for aluno, só pode ver seus próprios dados
    if session.get('perfil') == 'aluno' and session.get('aluno_id') != aluno_id:
        conn.close()
        return jsonify({'error': 'Acesso negado'}), 403
    
    cursor.execute('SELECT * FROM alunos WHERE id = ?', (aluno_id,))
    aluno = cursor.fetchone()
    conn.close()
    
    if aluno:
        aluno_dict = dict(aluno)
        # Adicionar cálculos automáticos
        aluno_dict['idade'] = calcular_idade(aluno_dict.get('data_nascimento'))
        aluno_dict['imc'] = calcular_imc(aluno_dict.get('peso'), aluno_dict.get('altura'))
        aluno_dict['classe'] = determinar_classe(aluno_dict['idade'])
        aluno_dict['categoria'] = determinar_categoria(
            aluno_dict['idade'], 
            aluno_dict.get('peso')
        )
        if aluno_dict.get('pode_graduar') and not aluno_dict.get('graduar_para'):
            aluno_dict['graduar_para'] = obter_proxima_graduacao(
                aluno_dict.get('graduacao_atual', 'Branca')
            )
        return jsonify(aluno_dict)
    return jsonify({'error': 'Aluno não encontrado'}), 404

@app.route('/api/alunos/<int:aluno_id>', methods=['PUT'])
@admin_required
def atualizar_aluno(aluno_id):
    """Atualiza um aluno"""
    data = request.json
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Se pode_graduar está marcado, calcular próxima graduação automaticamente
        graduar_para = data.get('graduar_para')
        if data.get('pode_graduar') and not graduar_para:
            graduar_para = obter_proxima_graduacao(data.get('graduacao_atual', 'Branca'))
        
        cursor.execute('''
            UPDATE alunos SET
                nome_completo = ?, tipo = ?, data_nascimento = ?,
                nome_responsavel = ?, contato = ?, status = ?,
                observacoes = ?, graduacao_atual = ?, modalidade = ?,
                pode_graduar = ?, graduar_para = ?, peso = ?, altura = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (
            data['nome_completo'],
            data['tipo'],
            data.get('data_nascimento'),
            data.get('nome_responsavel'),
            data.get('contato'),
            data.get('status'),
            data.get('observacoes'),
            data.get('graduacao_atual', 'Branca'),
            data.get('modalidade'),
            data.get('pode_graduar', False),
            graduar_para,
            data.get('peso'),
            data.get('altura'),
            aluno_id
        ))
        conn.commit()
        conn.close()
        return jsonify({'success': True})
    except Exception as e:
        conn.close()
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/alunos/<int:aluno_id>', methods=['DELETE'])
@admin_required
def deletar_aluno(aluno_id):
    """Deleta um aluno"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM alunos WHERE id = ?', (aluno_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/alunos/importar', methods=['POST'])
@admin_required
def importar_alunos():
    """Importa alunos em massa a partir de arquivo CSV ou Excel"""
    if 'file' not in request.files:
        return jsonify({'success': False, 'error': 'Nenhum arquivo enviado'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'error': 'Nenhum arquivo selecionado'}), 400
    
    try:
        # Ler arquivo
        filename = file.filename.lower()
        file_content = file.read()
        
        if filename.endswith('.csv'):
            # Ler CSV
            try:
                df = pd.read_csv(io.BytesIO(file_content), encoding='utf-8')
            except UnicodeDecodeError:
                # Tentar com encoding alternativo
                try:
                    df = pd.read_csv(io.BytesIO(file_content), encoding='latin-1')
                except:
                    df = pd.read_csv(io.BytesIO(file_content), encoding='cp1252')
        elif filename.endswith(('.xlsx', '.xls')):
            # Ler Excel - verificar se openpyxl está instalado
            try:
                import openpyxl
                df = pd.read_excel(io.BytesIO(file_content))
            except ImportError:
                return jsonify({
                    'success': False, 
                    'error': 'Biblioteca openpyxl não instalada.\n\nSOLUÇÃO:\n1. Execute no terminal: pip install openpyxl\n2. Ou use o arquivo install_dependencies.bat\n3. Ou use arquivo CSV ao invés de Excel (.xlsx)'
                }), 400
            except Exception as e:
                return jsonify({
                    'success': False, 
                    'error': f'Erro ao ler arquivo Excel: {str(e)}\n\nDica: Tente salvar como CSV e importar novamente.'
                }), 400
        else:
            return jsonify({'success': False, 'error': 'Formato não suportado. Use CSV ou Excel (.xlsx, .xls)'}), 400
        
        # Normalizar nomes das colunas
        df.columns = df.columns.str.strip().str.lower()
        
        # Mapear colunas possíveis
        col_mapping = {}
        col_names_map = {
            'nome': ['nome', 'nome completo', 'nome_completo', 'nomecompleto'],
            'data_nascimento': ['data nascimento', 'data_nascimento', 'datanascimento', 'nascimento', 'data de nascimento'],
            'tipo': ['tipo', 'categoria', 'categoria_aluno'],
            'nome_responsavel': ['responsavel', 'nome responsavel', 'nome_responsavel', 'responsável'],
            'contato': ['contato', 'telefone', 'whatsapp', 'celular'],
            'data_matricula': ['data matricula', 'data_matricula', 'matricula', 'data de matrícula'],
            'status': ['status', 'situacao', 'situação'],
            'graduacao_atual': ['graduacao', 'graduação', 'graduacao_atual', 'faixa', 'faixa atual'],
            'modalidade': ['modalidade'],
            'peso': ['peso', 'peso (kg)', 'peso_kg'],
            'altura': ['altura', 'altura (cm)', 'altura_cm'],
            'observacoes': ['observacoes', 'observações', 'obs', 'observacao']
        }
        
        for key, possible_names in col_names_map.items():
            for col in df.columns:
                if col in possible_names:
                    col_mapping[key] = col
                    break
        
        if 'nome' not in col_mapping:
            return jsonify({'success': False, 'error': 'Coluna "Nome" não encontrada na planilha'}), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        resultados = {
            'sucesso': [],
            'erros': [],
            'total': len(df)
        }
        
        # Processar cada linha
        for index, row in df.iterrows():
            try:
                nome_completo = str(row[col_mapping['nome']]).strip()
                if pd.isna(nome_completo) or nome_completo == '' or nome_completo == 'nan':
                    resultados['erros'].append({
                        'linha': index + 2,
                        'nome': 'Vazio',
                        'erro': 'Nome não pode estar vazio'
                    })
                    continue
                
                tipo = 'Criança'
                if 'tipo' in col_mapping:
                    tipo_val = str(row[col_mapping['tipo']]).strip().lower()
                    if 'adulto' in tipo_val:
                        tipo = 'Adulto'
                
                data_nascimento = None
                if 'data_nascimento' in col_mapping:
                    try:
                        data_val = row[col_mapping['data_nascimento']]
                        if pd.notna(data_val):
                            if isinstance(data_val, str):
                                for fmt in ['%d/%m/%Y', '%Y-%m-%d', '%d-%m-%Y', '%Y/%m/%d']:
                                    try:
                                        data_nascimento = datetime.strptime(data_val, fmt).date().isoformat()
                                        break
                                    except:
                                        continue
                            else:
                                data_nascimento = pd.to_datetime(data_val).date().isoformat()
                    except:
                        pass
                
                nome_responsavel = None
                if 'nome_responsavel' in col_mapping:
                    val = row[col_mapping['nome_responsavel']]
                    if pd.notna(val):
                        nome_responsavel = str(val).strip()
                
                contato = None
                if 'contato' in col_mapping:
                    val = row[col_mapping['contato']]
                    if pd.notna(val):
                        contato = str(val).strip()
                
                data_matricula = datetime.now().date().isoformat()
                if 'data_matricula' in col_mapping:
                    try:
                        val = row[col_mapping['data_matricula']]
                        if pd.notna(val):
                            if isinstance(val, str):
                                for fmt in ['%d/%m/%Y', '%Y-%m-%d', '%d-%m-%Y']:
                                    try:
                                        data_matricula = datetime.strptime(val, fmt).date().isoformat()
                                        break
                                    except:
                                        continue
                            else:
                                data_matricula = pd.to_datetime(val).date().isoformat()
                    except:
                        pass
                
                status = 'Ativo'
                if 'status' in col_mapping:
                    val = str(row[col_mapping['status']]).strip().lower()
                    if 'inativo' in val:
                        status = 'Inativo'
                
                graduacao_atual = 'Branca'
                if 'graduacao_atual' in col_mapping:
                    val = str(row[col_mapping['graduacao_atual']]).strip()
                    graduacoes_validas = ['Branca', 'Cinza', 'Azul', 'Amarela', 'Laranja', 'Verde', 'Roxa', 'Marrom', 'Preta']
                    if val in graduacoes_validas:
                        graduacao_atual = val
                
                modalidade = None
                if 'modalidade' in col_mapping:
                    val = row[col_mapping['modalidade']]
                    if pd.notna(val):
                        modalidade = str(val).strip()
                
                peso = None
                if 'peso' in col_mapping:
                    try:
                        val = row[col_mapping['peso']]
                        if pd.notna(val):
                            peso = float(val)
                    except:
                        pass
                
                altura = None
                if 'altura' in col_mapping:
                    try:
                        val = row[col_mapping['altura']]
                        if pd.notna(val):
                            altura_cm = float(val)
                            altura = altura_cm if altura_cm < 3 else altura_cm / 100
                    except:
                        pass
                
                observacoes = None
                if 'observacoes' in col_mapping:
                    val = row[col_mapping['observacoes']]
                    if pd.notna(val):
                        observacoes = str(val).strip()
                
                cursor.execute('''
                    INSERT INTO alunos (nome_completo, tipo, data_nascimento, nome_responsavel,
                                      contato, data_matricula, status, observacoes,
                                      graduacao_atual, modalidade, pode_graduar, graduar_para,
                                      peso, altura)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    nome_completo, tipo, data_nascimento, nome_responsavel,
                    contato, data_matricula, status, observacoes,
                    graduacao_atual, modalidade, False, None, peso, altura
                ))
                
                resultados['sucesso'].append({
                    'linha': index + 2,
                    'nome': nome_completo
                })
                
            except Exception as e:
                resultados['erros'].append({
                    'linha': index + 2,
                    'nome': str(row[col_mapping['nome']]) if 'nome' in col_mapping else 'Desconhecido',
                    'erro': str(e)
                })
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'resultados': resultados,
            'mensagem': f"Importação concluída: {len(resultados['sucesso'])} sucesso(s), {len(resultados['erros'])} erro(s)"
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': f'Erro ao processar arquivo: {str(e)}'}), 400

@app.route('/api/alunos/template', methods=['GET'])
@admin_required
def download_template():
    """Gera um template CSV para importação"""
    output = StringIO()
    writer = csv.writer(output)
    
    writer.writerow([
        'Nome', 'Data Nascimento', 'Tipo', 'Nome Responsável', 'Contato',
        'Data Matrícula', 'Status', 'Graduação', 'Modalidade', 'Peso', 'Altura', 'Observações'
    ])
    
    writer.writerow([
        'João Silva', '15/03/2010', 'Criança', 'Maria Silva', '(11) 99999-9999',
        '01/01/2024', 'Ativo', 'Branca', 'Judô Infantil', '35.5', '140', 'Aluno dedicado'
    ])
    
    output.seek(0)
    return output.getvalue(), 200, {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename=template_importacao_alunos.csv'
    }

# ==================== ROTAS DE PRESENÇA ====================

@app.route('/api/presencas', methods=['GET'])
@login_required
def listar_presencas():
    """Lista presenças com filtros"""
    aluno_id = request.args.get('aluno_id', type=int)
    data_inicio = request.args.get('data_inicio')
    data_fim = request.args.get('data_fim')
    
    conn = get_db()
    cursor = conn.cursor()
    
    query = 'SELECT p.*, a.nome_completo FROM presencas p JOIN alunos a ON p.aluno_id = a.id WHERE 1=1'
    params = []
    
    # Se for aluno, só vê suas presenças
    if session.get('perfil') == 'aluno':
        query += ' AND p.aluno_id = ?'
        params.append(session.get('aluno_id'))
    elif aluno_id:
        query += ' AND p.aluno_id = ?'
        params.append(aluno_id)
    
    if data_inicio:
        query += ' AND p.data >= ?'
        params.append(data_inicio)
    if data_fim:
        query += ' AND p.data <= ?'
        params.append(data_fim)
    
    query += ' ORDER BY p.data DESC'
    
    cursor.execute(query, params)
    presencas = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return jsonify(presencas)

@app.route('/api/presencas', methods=['POST'])
@admin_required
def registrar_presenca():
    """Registra presença ou ausência"""
    data = request.json
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            INSERT OR REPLACE INTO presencas (aluno_id, data, presente, justificativa)
            VALUES (?, ?, ?, ?)
        ''', (
            data['aluno_id'],
            data['data'],
            data['presente'],
            data.get('justificativa')
        ))
        conn.commit()
        conn.close()
        return jsonify({'success': True}), 201
    except Exception as e:
        conn.close()
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/presencas/hoje', methods=['GET'])
@admin_required
def presencas_hoje():
    """Lista alunos para registro de presença"""
    data_selecionada = request.args.get('data', datetime.now().date().isoformat())
    conn = get_db()
    cursor = conn.cursor()
    
    # Busca todos os alunos ativos
    cursor.execute('SELECT * FROM alunos WHERE status = "Ativo" ORDER BY nome_completo')
    alunos = cursor.fetchall()
    
    # Busca presenças da data selecionada
    cursor.execute('SELECT * FROM presencas WHERE data = ?', (data_selecionada,))
    presencas_dia = {row['aluno_id']: dict(row) for row in cursor.fetchall()}
    
    resultado = []
    for aluno in alunos:
        aluno_dict = dict(aluno)
        aluno_dict['presenca_hoje'] = presencas_dia.get(aluno['id'])
        resultado.append(aluno_dict)
    
    conn.close()
    return jsonify(resultado)

# ==================== ROTAS DE DASHBOARD ====================

@app.route('/api/dashboard/frequencia', methods=['GET'])
@login_required
def dashboard_frequencia():
    """Estatísticas de frequência"""
    data_inicio = request.args.get('data_inicio')
    data_fim = request.args.get('data_fim')
    tipo_aluno = request.args.get('tipo_aluno')
    
    if not data_inicio:
        data_inicio = (datetime.now() - timedelta(days=30)).date().isoformat()
    if not data_fim:
        data_fim = datetime.now().date().isoformat()
    
    conn = get_db()
    cursor = conn.cursor()
    
    query = '''
        SELECT a.id, a.nome_completo, a.tipo,
               COUNT(p.id) as total_registros,
               SUM(CASE WHEN p.presente = 1 THEN 1 ELSE 0 END) as total_presentes,
               SUM(CASE WHEN p.presente = 0 THEN 1 ELSE 0 END) as total_ausentes
        FROM alunos a
        LEFT JOIN presencas p ON a.id = p.aluno_id AND p.data BETWEEN ? AND ?
        WHERE a.status = "Ativo"
    '''
    params = [data_inicio, data_fim]
    
    if tipo_aluno:
        query += ' AND a.tipo = ?'
        params.append(tipo_aluno)
    
    if session.get('perfil') == 'aluno':
        query += ' AND a.id = ?'
        params.append(session.get('aluno_id'))
    
    query += ' GROUP BY a.id ORDER BY total_presentes DESC'
    
    cursor.execute(query, params)
    resultados = cursor.fetchall()
    
    dados = []
    for row in resultados:
        total = row['total_registros'] or 0
        presentes = row['total_presentes'] or 0
        frequencia = (presentes / total * 100) if total > 0 else 0
        
        dados.append({
            'aluno_id': row['id'],
            'nome': row['nome_completo'],
            'tipo': row['tipo'],
            'total_registros': total,
            'presentes': presentes,
            'ausentes': row['total_ausentes'] or 0,
            'frequencia_percentual': round(frequencia, 2)
        })
    
    conn.close()
    return jsonify(dados)

@app.route('/api/dashboard/evolucao', methods=['GET'])
@login_required
def dashboard_evolucao():
    """Evolução de frequência ao longo do tempo"""
    aluno_id = request.args.get('aluno_id', type=int)
    data_inicio = request.args.get('data_inicio')
    data_fim = request.args.get('data_fim')
    
    if not data_inicio:
        data_inicio = (datetime.now() - timedelta(days=90)).date().isoformat()
    if not data_fim:
        data_fim = datetime.now().date().isoformat()
    
    conn = get_db()
    cursor = conn.cursor()
    
    query = '''
        SELECT DATE(p.data) as data_dia,
               COUNT(*) as total,
               SUM(CASE WHEN p.presente = 1 THEN 1 ELSE 0 END) as presentes
        FROM presencas p
        WHERE p.data BETWEEN ? AND ?
    '''
    params = [data_inicio, data_fim]
    
    if aluno_id:
        query += ' AND p.aluno_id = ?'
        params.append(aluno_id)
    elif session.get('perfil') == 'aluno':
        query += ' AND p.aluno_id = ?'
        params.append(session.get('aluno_id'))
    
    query += ' GROUP BY DATE(p.data) ORDER BY data_dia'
    
    cursor.execute(query, params)
    resultados = cursor.fetchall()
    
    dados = []
    for row in resultados:
        total = row['total'] or 0
        presentes = row['presentes'] or 0
        frequencia = (presentes / total * 100) if total > 0 else 0
        
        dados.append({
            'data': row['data_dia'],
            'frequencia': round(frequencia, 2),
            'presentes': presentes,
            'total': total
        })
    
    conn.close()
    return jsonify(dados)

# ==================== ROTAS DE AVALIAÇÕES ====================

@app.route('/api/avaliacoes', methods=['GET'])
@login_required
def listar_avaliacoes():
    """Lista avaliações com controle de acesso por perfil"""
    aluno_id = request.args.get('aluno_id', type=int)
    incluir_nao_liberadas = request.args.get('incluir_nao_liberadas', 'false').lower() == 'true'
    
    conn = get_db()
    cursor = conn.cursor()
    
    query = 'SELECT av.*, a.nome_completo FROM avaliacoes av JOIN alunos a ON av.aluno_id = a.id WHERE 1=1'
    params = []
    
    # Controle de acesso baseado em perfil
    if session.get('perfil') == 'aluno':
        # Aluno só vê avaliações liberadas do seu próprio aluno_id
        query += ' AND av.aluno_id = ? AND av.status = "Liberada"'
        params.append(session.get('aluno_id'))
    elif session.get('perfil') == 'admin':
        # Admin vê todas, mas pode filtrar
        if aluno_id:
            query += ' AND av.aluno_id = ?'
            params.append(aluno_id)
        if not incluir_nao_liberadas:
            # Por padrão, admin também pode ver não liberadas, mas pode filtrar
            pass
    else:
        # Outros perfis não têm acesso
        conn.close()
        return jsonify({'error': 'Acesso negado'}), 403
    
    query += ' ORDER BY av.data_avaliacao DESC'
    
    cursor.execute(query, params)
    avaliacoes = [dict(row) for row in cursor.fetchall()]
    
    # Calcular média/score
    for av in avaliacoes:
        notas = [
            av.get('disciplina'),
            av.get('tecnica'),
            av.get('participacao'),
            av.get('respeito_comportamento')
        ]
        notas_validas = [n for n in notas if n is not None]
        av['media'] = round(sum(notas_validas) / len(notas_validas), 2) if notas_validas else None
    
    conn.close()
    return jsonify(avaliacoes)

@app.route('/api/avaliacoes', methods=['POST'])
@admin_required
def criar_avaliacao():
    """Cria uma avaliação (apenas Sensei/Admin)"""
    data = request.json
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        status = data.get('status', 'Rascunho')
        cursor.execute('''
            INSERT INTO avaliacoes (aluno_id, data_avaliacao, disciplina, tecnica,
                                  participacao, respeito_comportamento, observacoes, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data['aluno_id'],
            data['data_avaliacao'],
            data.get('disciplina'),
            data.get('tecnica'),
            data.get('participacao'),
            data.get('respeito_comportamento'),
            data.get('observacoes'),
            status
        ))
        avaliacao_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'id': avaliacao_id}), 201
    except Exception as e:
        conn.close()
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/avaliacoes/<int:avaliacao_id>', methods=['PUT'])
@admin_required
def atualizar_avaliacao(avaliacao_id):
    """Atualiza uma avaliação (apenas Sensei/Admin)"""
    data = request.json
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        status_anterior = None
        cursor.execute('SELECT status, aluno_id FROM avaliacoes WHERE id = ?', (avaliacao_id,))
        av_antiga = cursor.fetchone()
        if av_antiga:
            status_anterior = av_antiga['status']
        
        novo_status = data.get('status', status_anterior)
        data_liberacao = None
        
        # Se mudou para "Liberada", registrar data de liberação e criar notificação
        if novo_status == 'Liberada' and status_anterior != 'Liberada':
            data_liberacao = datetime.now().date().isoformat()
            aluno_id = av_antiga['aluno_id'] if av_antiga else data.get('aluno_id')
            
            # Buscar usuário associado ao aluno
            cursor.execute('SELECT id FROM usuarios WHERE aluno_id = ?', (aluno_id,))
            usuario = cursor.fetchone()
            if usuario:
                criar_notificacao(
                    usuario_id=usuario['id'],
                    aluno_id=aluno_id,
                    tipo='avaliacao_liberada',
                    titulo='Nova Avaliação Liberada',
                    mensagem=f'Uma nova avaliação foi liberada para visualização.',
                    link=f'/avaliacoes'
                )
        
        cursor.execute('''
            UPDATE avaliacoes SET
                aluno_id = ?, data_avaliacao = ?, disciplina = ?, tecnica = ?,
                participacao = ?, respeito_comportamento = ?, observacoes = ?,
                status = ?, data_liberacao = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (
            data.get('aluno_id'),
            data.get('data_avaliacao'),
            data.get('disciplina'),
            data.get('tecnica'),
            data.get('participacao'),
            data.get('respeito_comportamento'),
            data.get('observacoes'),
            novo_status,
            data_liberacao,
            avaliacao_id
        ))
        conn.commit()
        conn.close()
        return jsonify({'success': True})
    except Exception as e:
        conn.close()
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/avaliacoes/<int:avaliacao_id>/liberar', methods=['POST'])
@admin_required
def liberar_avaliacao(avaliacao_id):
    """Libera uma avaliação para visualização do aluno"""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('SELECT aluno_id FROM avaliacoes WHERE id = ?', (avaliacao_id,))
        avaliacao = cursor.fetchone()
        if not avaliacao:
            conn.close()
            return jsonify({'success': False, 'error': 'Avaliação não encontrada'}), 404
        
        aluno_id = avaliacao['aluno_id']
        data_liberacao = datetime.now().date().isoformat()
        
        cursor.execute('''
            UPDATE avaliacoes SET
                status = "Liberada",
                data_liberacao = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (data_liberacao, avaliacao_id))
        
        # Criar notificação para o aluno/responsável
        cursor.execute('SELECT id FROM usuarios WHERE aluno_id = ?', (aluno_id,))
        usuario = cursor.fetchone()
        if usuario:
            criar_notificacao(
                usuario_id=usuario['id'],
                aluno_id=aluno_id,
                tipo='avaliacao_liberada',
                titulo='Nova Avaliação Liberada',
                mensagem='Uma nova avaliação foi liberada para visualização.',
                link='/avaliacoes'
            )
        
        conn.commit()
        conn.close()
        return jsonify({'success': True})
    except Exception as e:
        conn.close()
        return jsonify({'success': False, 'error': str(e)}), 400

# ==================== ROTAS DE AVISOS ====================

@app.route('/api/avisos', methods=['GET'])
@login_required
def listar_avisos():
    """Lista avisos"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM avisos ORDER BY data_publicacao DESC LIMIT 10')
    avisos = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(avisos)

@app.route('/api/avisos', methods=['POST'])
@admin_required
def criar_aviso():
    """Cria um aviso"""
    data = request.json
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            INSERT INTO avisos (titulo, conteudo, data_publicacao)
            VALUES (?, ?, ?)
        ''', (
            data['titulo'],
            data['conteudo'],
            data.get('data_publicacao', datetime.now().date().isoformat())
        ))
        conn.commit()
        conn.close()
        return jsonify({'success': True}), 201
    except Exception as e:
        conn.close()
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/avisos/<int:aviso_id>', methods=['DELETE'])
@admin_required
def deletar_aviso(aviso_id):
    """Deleta um aviso"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM avisos WHERE id = ?', (aviso_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

# ==================== ROTAS DE JUSTIFICATIVAS DE AUSÊNCIA ====================

@app.route('/api/justificativas', methods=['GET'])
@login_required
def listar_justificativas():
    """Lista justificativas de ausência"""
    aluno_id = request.args.get('aluno_id', type=int)
    status_filtro = request.args.get('status')
    
    conn = get_db()
    cursor = conn.cursor()
    
    query = '''
        SELECT j.*, a.nome_completo 
        FROM justificativas_ausencia j 
        JOIN alunos a ON j.aluno_id = a.id 
        WHERE 1=1
    '''
    params = []
    
    # Controle de acesso
    if session.get('perfil') == 'aluno':
        # Aluno só vê suas próprias justificativas
        query += ' AND j.aluno_id = ?'
        params.append(session.get('aluno_id'))
    elif session.get('perfil') == 'admin':
        # Admin pode filtrar por aluno
        if aluno_id:
            query += ' AND j.aluno_id = ?'
            params.append(aluno_id)
    else:
        conn.close()
        return jsonify({'error': 'Acesso negado'}), 403
    
    if status_filtro:
        query += ' AND j.status = ?'
        params.append(status_filtro)
    
    query += ' ORDER BY j.data_ausencia DESC, j.created_at DESC'
    
    cursor.execute(query, params)
    justificativas = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return jsonify(justificativas)

@app.route('/api/justificativas', methods=['POST'])
@login_required
def criar_justificativa():
    """Cria uma justificativa de ausência (alunos podem criar)"""
    data = request.json
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Determinar aluno_id baseado no perfil
        aluno_id = None
        if session.get('perfil') == 'aluno':
            aluno_id = session.get('aluno_id')
        elif session.get('perfil') == 'admin':
            aluno_id = data.get('aluno_id')
        else:
            conn.close()
            return jsonify({'success': False, 'error': 'Acesso negado'}), 403
        
        if not aluno_id:
            conn.close()
            return jsonify({'success': False, 'error': 'Aluno não identificado'}), 400
        
        cursor.execute('''
            INSERT INTO justificativas_ausencia (aluno_id, data_ausencia, justificativa, status)
            VALUES (?, ?, ?, ?)
        ''', (
            aluno_id,
            data['data_ausencia'],
            data['justificativa'],
            'Pendente'
        ))
        justificativa_id = cursor.lastrowid
        
        # Criar notificação para o Sensei/Admin
        # Buscar todos os admins
        cursor.execute('SELECT id FROM usuarios WHERE perfil = "admin"')
        admins = cursor.fetchall()
        for admin in admins:
            cursor.execute('SELECT nome_completo FROM alunos WHERE id = ?', (aluno_id,))
            aluno = cursor.fetchone()
            nome_aluno = aluno['nome_completo'] if aluno else 'Aluno'
            
            criar_notificacao(
                usuario_id=admin['id'],
                aluno_id=aluno_id,
                tipo='justificativa_ausencia',
                titulo='Nova Justificativa de Ausência',
                mensagem=f'{nome_aluno} justificou uma ausência.',
                link='/justificativas'
            )
        
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'id': justificativa_id}), 201
    except Exception as e:
        conn.close()
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/justificativas/<int:justificativa_id>', methods=['PUT'])
@admin_required
def atualizar_justificativa(justificativa_id):
    """Atualiza status de justificativa (apenas Sensei/Admin)"""
    data = request.json
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            UPDATE justificativas_ausencia SET
                status = ?,
                lida = ?,
                resolvida = ?,
                observacao_sensei = ?
            WHERE id = ?
        ''', (
            data.get('status', 'Pendente'),
            data.get('lida', False),
            data.get('resolvida', False),
            data.get('observacao_sensei'),
            justificativa_id
        ))
        conn.commit()
        conn.close()
        return jsonify({'success': True})
    except Exception as e:
        conn.close()
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/justificativas/<int:justificativa_id>/marcar-lida', methods=['POST'])
@admin_required
def marcar_justificativa_lida(justificativa_id):
    """Marca justificativa como lida"""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('UPDATE justificativas_ausencia SET lida = 1 WHERE id = ?', (justificativa_id,))
        conn.commit()
        conn.close()
        return jsonify({'success': True})
    except Exception as e:
        conn.close()
        return jsonify({'success': False, 'error': str(e)}), 400

# ==================== ROTAS DE NOTIFICAÇÕES ====================

@app.route('/api/notificacoes', methods=['GET'])
@login_required
def listar_notificacoes():
    """Lista notificações do usuário logado"""
    apenas_nao_lidas = request.args.get('apenas_nao_lidas', 'false').lower() == 'true'
    
    conn = get_db()
    cursor = conn.cursor()
    
    query = 'SELECT * FROM notificacoes WHERE usuario_id = ?'
    params = [session.get('user_id')]
    
    if apenas_nao_lidas:
        query += ' AND lida = 0'
    
    query += ' ORDER BY data_notificacao DESC LIMIT 50'
    
    cursor.execute(query, params)
    notificacoes = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return jsonify(notificacoes)

@app.route('/api/notificacoes/contador', methods=['GET'])
@login_required
def contar_notificacoes_nao_lidas():
    """Retorna quantidade de notificações não lidas"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) as total FROM notificacoes WHERE usuario_id = ? AND lida = 0', 
                   (session.get('user_id'),))
    resultado = cursor.fetchone()
    conn.close()
    return jsonify({'total': resultado['total'] if resultado else 0})

@app.route('/api/notificacoes/<int:notificacao_id>/marcar-lida', methods=['POST'])
@login_required
def marcar_notificacao_lida(notificacao_id):
    """Marca uma notificação como lida"""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Verificar se a notificação pertence ao usuário
        cursor.execute('SELECT id FROM notificacoes WHERE id = ? AND usuario_id = ?', 
                      (notificacao_id, session.get('user_id')))
        if not cursor.fetchone():
            conn.close()
            return jsonify({'success': False, 'error': 'Notificação não encontrada'}), 404
        
        cursor.execute('UPDATE notificacoes SET lida = 1 WHERE id = ?', (notificacao_id,))
        conn.commit()
        conn.close()
        return jsonify({'success': True})
    except Exception as e:
        conn.close()
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/notificacoes/marcar-todas-lidas', methods=['POST'])
@login_required
def marcar_todas_notificacoes_lidas():
    """Marca todas as notificações do usuário como lidas"""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('UPDATE notificacoes SET lida = 1 WHERE usuario_id = ? AND lida = 0', 
                      (session.get('user_id'),))
        conn.commit()
        conn.close()
        return jsonify({'success': True})
    except Exception as e:
        conn.close()
        return jsonify({'success': False, 'error': str(e)}), 400

# ==================== ROTAS DE BIBLIOTECA TÉCNICA ====================

@app.route('/api/biblioteca', methods=['GET'])
@login_required
def listar_biblioteca():
    """Lista conteúdos da biblioteca técnica com filtros"""
    graduacao = request.args.get('graduacao')
    modalidade = request.args.get('modalidade')
    tipo_golpe = request.args.get('tipo_golpe')
    
    conn = get_db()
    cursor = conn.cursor()
    
    query = 'SELECT * FROM biblioteca_tecnica WHERE 1=1'
    params = []
    
    if graduacao:
        query += ' AND (graduacao_minima IS NULL OR graduacao_minima = ? OR graduacao_minima <= ?)'
        params.extend([graduacao, graduacao])
    if modalidade:
        query += ' AND (modalidade IS NULL OR modalidade = ?)'
        params.append(modalidade)
    if tipo_golpe:
        query += ' AND tipo_golpe = ?'
        params.append(tipo_golpe)
    
    query += ' ORDER BY created_at DESC'
    
    cursor.execute(query, params)
    conteudos = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return jsonify(conteudos)

@app.route('/api/avaliacoes/<int:avaliacao_id>', methods=['GET'])
@login_required
def obter_avaliacao(avaliacao_id):
    """Obtém uma avaliação específica"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT av.*, a.nome_completo FROM avaliacoes av JOIN alunos a ON av.aluno_id = a.id WHERE av.id = ?', (avaliacao_id,))
    avaliacao = cursor.fetchone()
    conn.close()
    
    if avaliacao:
        # Verificar permissão
        if session.get('perfil') == 'aluno':
            if avaliacao['aluno_id'] != session.get('aluno_id') or avaliacao['status'] != 'Liberada':
                return jsonify({'error': 'Acesso negado'}), 403
        
        # Calcular média
        notas = [
            avaliacao.get('disciplina'),
            avaliacao.get('tecnica'),
            avaliacao.get('participacao'),
            avaliacao.get('respeito_comportamento')
        ]
        notas_validas = [n for n in notas if n is not None]
        avaliacao_dict = dict(avaliacao)
        avaliacao_dict['media'] = round(sum(notas_validas) / len(notas_validas), 2) if notas_validas else None
        
        return jsonify(avaliacao_dict)
    return jsonify({'error': 'Avaliação não encontrada'}), 404

@app.route('/api/biblioteca/<int:conteudo_id>', methods=['GET'])
@login_required
def obter_conteudo(conteudo_id):
    """Obtém um conteúdo específico"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM biblioteca_tecnica WHERE id = ?', (conteudo_id,))
    conteudo = cursor.fetchone()
    conn.close()
    
    if conteudo:
        return jsonify(dict(conteudo))
    return jsonify({'error': 'Conteúdo não encontrado'}), 404

@app.route('/api/biblioteca', methods=['POST'])
@admin_required
def criar_conteudo():
    """Cria um novo conteúdo na biblioteca técnica"""
    data = request.json
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            INSERT INTO biblioteca_tecnica (titulo, tipo_golpe, graduacao_minima, modalidade,
                                           url_video, url_foto, instrucoes, descricao)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data['titulo'],
            data.get('tipo_golpe'),
            data.get('graduacao_minima'),
            data.get('modalidade'),
            data.get('url_video'),
            data.get('url_foto'),
            data.get('instrucoes'),
            data.get('descricao')
        ))
        conn.commit()
        conteudo_id = cursor.lastrowid
        conn.close()
        return jsonify({'success': True, 'id': conteudo_id}), 201
    except Exception as e:
        conn.close()
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/biblioteca/<int:conteudo_id>', methods=['PUT'])
@admin_required
def atualizar_conteudo(conteudo_id):
    """Atualiza um conteúdo"""
    data = request.json
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            UPDATE biblioteca_tecnica SET
                titulo = ?, tipo_golpe = ?, graduacao_minima = ?, modalidade = ?,
                url_video = ?, url_foto = ?, instrucoes = ?, descricao = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (
            data.get('titulo'),
            data.get('tipo_golpe'),
            data.get('graduacao_minima'),
            data.get('modalidade'),
            data.get('url_video'),
            data.get('url_foto'),
            data.get('instrucoes'),
            data.get('descricao'),
            conteudo_id
        ))
        conn.commit()
        conn.close()
        return jsonify({'success': True})
    except Exception as e:
        conn.close()
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/biblioteca/<int:conteudo_id>', methods=['DELETE'])
@admin_required
def deletar_conteudo(conteudo_id):
    """Deleta um conteúdo"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM biblioteca_tecnica WHERE id = ?', (conteudo_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/biblioteca/tipos-golpes', methods=['GET'])
@login_required
def listar_tipos_golpes():
    """Retorna lista de tipos de golpes disponíveis"""
    tipos = [
        "Queda (Nage-waza)",
        "Imobilização (Katame-waza)",
        "Golpe no Pescoço (Shime-waza)",
        "Luxação (Kansetsu-waza)",
        "Técnica de Chão (Ne-waza)",
        "Técnica em Pé (Tachi-waza)",
        "Projeção (Tsurikomi)",
        "Rasteira (Ashi-waza)",
        "Sacrifício (Sutemi-waza)",
        "Outro"
    ]
    return jsonify(tipos)

# ==================== ROTAS DE REMATRÍCULA ====================

@app.route('/api/rematriculas/gerar-link', methods=['POST'])
@admin_required
def gerar_link_rematricula():
    """Gera link de rematrícula para um aluno"""
    data = request.json
    aluno_id = data.get('aluno_id')
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Gera token único
    token = secrets.token_urlsafe(32)
    
    try:
        cursor.execute('''
            INSERT INTO rematriculas (aluno_id, token, data_rematricula, status)
            VALUES (?, ?, ?, ?)
        ''', (
            aluno_id,
            token,
            datetime.now().date().isoformat(),
            'Pendente'
        ))
        conn.commit()
        conn.close()
        
        # Retorna o link (em produção, usar domínio real)
        link = f"/rematricula/{token}"
        return jsonify({'success': True, 'link': link, 'token': token})
    except Exception as e:
        conn.close()
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/rematriculas/token/<token>', methods=['GET'])
def obter_rematricula_token(token):
    """Obtém dados da rematrícula pelo token"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT r.*, a.* FROM rematriculas r
        JOIN alunos a ON r.aluno_id = a.id
        WHERE r.token = ? AND r.status = "Pendente"
    ''', (token,))
    rematricula = cursor.fetchone()
    conn.close()
    
    if rematricula:
        return jsonify(dict(rematricula))
    return jsonify({'error': 'Link inválido ou já utilizado'}), 404

@app.route('/api/rematriculas/confirmar', methods=['POST'])
def confirmar_rematricula():
    """Confirma rematrícula via token público"""
    data = request.json
    token = data.get('token')
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Atualiza status da rematrícula
        cursor.execute('''
            UPDATE rematriculas SET status = "Confirmada"
            WHERE token = ? AND status = "Pendente"
        ''', (token,))
        
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({'success': False, 'error': 'Link inválido'}), 400
        
        # Atualiza status do aluno para Ativo
        cursor.execute('''
            UPDATE alunos SET status = "Ativo"
            WHERE id = (SELECT aluno_id FROM rematriculas WHERE token = ?)
        ''', (token,))
        
        conn.commit()
        conn.close()
        return jsonify({'success': True})
    except Exception as e:
        conn.close()
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/rematricula/<token>')
def pagina_rematricula(token):
    """Página pública de rematrícula"""
    return render_template('rematricula.html', token=token)

if __name__ == '__main__':
    # Inicializa o banco de dados
    init_db()
    print(f"🚀 Sistema iniciado!")
    print(f"📊 Banco de dados: {DATABASE}")
    print(f"🌐 Acesse: http://localhost:5000")
    print(f"👤 Login padrão: admin / admin123")
    app.run(debug=True, host='0.0.0.0', port=5000)

