# 📁 Estrutura de Arquivos para Deploy no Render

## ✅ Estrutura Completa Necessária

```
judo_sistema/                    # ← Pasta raiz do projeto (ou pode ser a raiz do repo)
│
├── app.py                       # ✅ OBRIGATÓRIO - Aplicação Flask principal
│
├── requirements.txt             # ✅ OBRIGATÓRIO - Dependências Python
│
├── Procfile                     # ⚠️ OPCIONAL - Para Heroku (Render pode usar)
│
├── runtime.txt                  # ⚠️ OPCIONAL - Versão Python (Recomendado)
│
├── .gitignore                   # ✅ RECOMENDADO - Arquivos ignorados pelo Git
│
├── templates/                   # ✅ OBRIGATÓRIO - Templates HTML
│   ├── index.html              # ✅ Página principal
│   └── rematricula.html        # ✅ (Se existir)
│
└── static/                      # ✅ OBRIGATÓRIO - Arquivos estáticos
    ├── css/
    │   ├── style.css           # ✅ Estilos principais
    │   └── notificacoes_justificativas.css  # ✅ Estilos extras
    │
    └── js/
        └── app.js              # ✅ JavaScript da aplicação
```

## ❌ Arquivos que NÃO devem ser commitados

Os seguintes arquivos **NÃO** devem ser enviados para o Render:

- ❌ `judo.db` - Banco de dados SQLite (será criado automaticamente)
- ❌ `__pycache__/` - Cache Python
- ❌ `*.pyc` - Arquivos compilados
- ❌ `.env` - Variáveis de ambiente locais
- ❌ `venv/`, `env/` - Ambientes virtuais
- ❌ `*.log` - Arquivos de log

**Todos estes já estão no `.gitignore`! ✅**

## 🔧 Configuração no Render Dashboard

### 1. Informações Básicas

- **Name**: `judo-social` (ou seu nome escolhido)
- **Environment**: `Python 3`
- **Region**: Escolha a mais próxima (ex: `Oregon (US West)`)
- **Branch**: `main` ou `master`
- **Root Directory**: 
  - Se o código está na raiz do repo: **deixe vazio**
  - Se está em `judo_sistema/`: **use `judo_sistema`**

### 2. Build & Deploy

- **Build Command**:
  ```bash
  pip install -r requirements.txt
  ```

- **Start Command**:
  ```bash
  gunicorn app:app
  ```
  
  **Alternativa** (se gunicorn der problema):
  ```bash
  python app.py
  ```

### 3. Environment Variables (Variáveis de Ambiente)

No Render, vá em **"Environment"** e adicione:

| Key | Value | Exemplo |
|-----|-------|---------|
| `SECRET_KEY` | Chave secreta gerada | `a1b2c3d4e5f6...` |
| `FLASK_ENV` | `production` | `production` |
| `PYTHON_VERSION` | (Opcional) | `3.11.0` |

**Para gerar SECRET_KEY:**
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Ou gere online em: https://randomkeygen.com/

## 📋 Checklist Antes do Deploy

### Estrutura de Arquivos
- [ ] `app.py` existe na raiz (ou na pasta especificada)
- [ ] `requirements.txt` existe e contém todas as dependências
- [ ] Pasta `templates/` existe com `index.html`
- [ ] Pasta `static/` existe com `css/` e `js/`
- [ ] `.gitignore` está configurado corretamente
- [ ] `judo.db` NÃO está sendo commitado (verifique com `git status`)

### Conteúdo dos Arquivos
- [ ] `requirements.txt` tem `gunicorn` (para produção)
- [ ] `app.py` tem `init_db()` sendo chamado
- [ ] Todos os caminhos em `app.py` são relativos (não absolutos)

### Configuração Render
- [ ] Build Command configurado
- [ ] Start Command configurado
- [ ] Variáveis de ambiente adicionadas
- [ ] Root Directory configurado (se necessário)

## 🎯 Estrutura Mínima (O que o Render PRECISA)

A estrutura **mínima absoluta** para funcionar:

```
projeto/
├── app.py
├── requirements.txt
├── templates/index.html
└── static/
    ├── css/style.css
    └── js/app.js
```

**Isso é suficiente!** Os outros arquivos são recomendados mas não obrigatórios.

## 📝 Exemplo de Repositório Completo

Se você vai commitar tudo para GitHub, a estrutura seria:

```
seu-repositorio/
├── .git/
├── .gitignore
├── judo_sistema/              # ← Pasta do projeto
│   ├── app.py
│   ├── requirements.txt
│   ├── runtime.txt
│   ├── Procfile
│   ├── templates/
│   │   └── index.html
│   └── static/
│       ├── css/
│       │   ├── style.css
│       │   └── notificacoes_justificativas.css
│       └── js/
│           └── app.js
└── README.md
```

**No Render, configure:**
- **Root Directory**: `judo_sistema`

## 🔍 Como Verificar Sua Estrutura

### Windows (PowerShell)
```powershell
cd judo_sistema
tree /F /A
```

### Ou use este comando:
```powershell
Get-ChildItem -Recurse -File | Select-Object FullName
```

## ⚠️ Pontos Importantes

1. **Root Directory no Render**:
   - Se seu código está na raiz do repositório: deixe **vazio**
   - Se está em `judo_sistema/`: coloque `judo_sistema`

2. **Banco de Dados**:
   - O SQLite será criado automaticamente
   - No Free Tier do Render, dados podem não persistir entre deploys
   - Para produção, considere PostgreSQL (Render oferece grátis)

3. **Arquivos Estáticos**:
   - O Flask serve automaticamente arquivos de `static/`
   - Não precisa de configuração extra

4. **Templates**:
   - Flask procura templates em `templates/`
   - Caminho correto já está no código

## ✅ Resumo Rápido

**Estrutura necessária:**
```
judo_sistema/
├── app.py
├── requirements.txt
├── templates/index.html
└── static/
    ├── css/style.css
    └── js/app.js
```

**Configuração Render:**
- Build: `pip install -r requirements.txt`
- Start: `gunicorn app:app`
- Vars: `SECRET_KEY` + `FLASK_ENV=production`
- Root: `judo_sistema` (ou vazio se na raiz)

**Pronto! 🚀**
