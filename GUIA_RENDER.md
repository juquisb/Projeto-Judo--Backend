# 🚀 Guia Completo de Deploy no Render

## 📁 Estrutura de Arquivos Necessária

A estrutura mínima necessária para deploy no Render é:

```
judo_sistema/
├── app.py                      # ✅ Arquivo principal da aplicação Flask
├── requirements.txt            # ✅ Dependências Python
├── Procfile                    # ✅ (Opcional para Render, mas útil)
├── runtime.txt                 # ✅ (Opcional) Versão do Python
├── .gitignore                  # ✅ Arquivos a ignorar no Git
│
├── templates/                  # ✅ Templates HTML
│   └── index.html
│
├── static/                     # ✅ Arquivos estáticos
│   ├── css/
│   │   ├── style.css
│   │   └── notificacoes_justificativas.css
│   └── js/
│       └── app.js
│
└── judo.db                     # ❌ NÃO incluir (será criado automaticamente)
```

## 🔧 Configuração no Render

### 1. Criar Conta e Conectar Repositório

1. Acesse https://render.com
2. Faça login (pode usar GitHub)
3. Clique em **"New +"** → **"Web Service"**
4. Conecte seu repositório GitHub/Bitbucket/GitLab
5. Selecione o repositório e branch

### 2. Configurações do Serviço

Configure os seguintes campos:

#### **Informações Básicas**
- **Name**: `judo-social` (ou nome de sua escolha)
- **Region**: Escolha a mais próxima (ex: `Oregon (US West)`)
- **Branch**: `main` ou `master` (dependendo do seu repo)
- **Root Directory**: `judo_sistema` (se o código estiver em subpasta)

#### **Build & Deploy**
- **Runtime**: `Python 3`
- **Build Command**: 
  ```bash
  pip install -r requirements.txt
  ```
- **Start Command**: 
  ```bash
  gunicorn app:app
  ```

#### **Environment Variables (Variáveis de Ambiente)**

Clique em **"Add Environment Variable"** e adicione:

| Key | Value | Descrição |
|-----|-------|-----------|
| `SECRET_KEY` | `[GERE_UMA_CHAVE]` | Chave secreta para sessões |
| `FLASK_ENV` | `production` | Ambiente de produção |
| `PYTHON_VERSION` | `3.11.0` | (Opcional) Versão do Python |

**Para gerar SECRET_KEY:**
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Ou use este gerador online: https://randomkeygen.com/

### 3. Plano de Serviço

- **Free Tier**: Disponível (com algumas limitações)
  - Spins down após 15 minutos de inatividade
  - Pode levar alguns segundos para iniciar após spin down
- **Starter ($7/mês)**: Sem spin down, melhor performance

Para começar, use o **Free Tier**.

## 📋 Checklist de Arquivos

### ✅ Arquivos Obrigatórios

- [x] `app.py` - Aplicação Flask principal
- [x] `requirements.txt` - Lista de dependências
- [x] `templates/index.html` - Template principal
- [x] `static/css/style.css` - Estilos CSS
- [x] `static/js/app.js` - JavaScript

### ✅ Arquivos Recomendados

- [x] `.gitignore` - Para não commitar arquivos desnecessários
- [x] `Procfile` - Para definição do comando de start (Render pode não usar, mas não faz mal)
- [x] `runtime.txt` - Para especificar versão do Python (opcional)

### ❌ Arquivos que NÃO devem ser commitados

- `judo.db` - Banco de dados SQLite (já está no .gitignore)
- `__pycache__/` - Cache Python (já está no .gitignore)
- `.env` - Variáveis de ambiente locais (já está no .gitignore)
- `*.pyc` - Arquivos compilados Python (já está no .gitignore)

## 🔍 Verificação da Estrutura

Execute este comando no terminal para verificar:

```bash
cd judo_sistema
tree /F /A
```

Ou no PowerShell:
```powershell
Get-ChildItem -Recurse | Select-Object FullName
```

## 🛠️ Comandos de Build e Start

### Build Command (comando de build)
```bash
pip install -r requirements.txt
```

### Start Command (comando de início)
```bash
gunicorn app:app
```

**Alternativa (se gunicorn der problema):**
```bash
python app.py
```

**Nota**: O comando `python app.py` funciona, mas `gunicorn` é recomendado para produção.

## ⚙️ Configurações Avançadas (Opcional)

### Criar arquivo `render.yaml` (Opcional)

Você pode criar um arquivo `render.yaml` na raiz do projeto:

```yaml
services:
  - type: web
    name: judo-social
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: gunicorn app:app
    envVars:
      - key: SECRET_KEY
        generateValue: true
      - key: FLASK_ENV
        value: production
    disk:
      name: judo-db
      mountPath: /opt/render/project/src
      sizeGB: 1
```

Este arquivo permite configurar tudo via código, mas não é obrigatório.

## 🚨 Problemas Comuns e Soluções

### Erro: "Module not found"
**Solução**: Verifique se `requirements.txt` contém todas as dependências:
```bash
Flask==3.0.0
Flask-CORS==4.0.0
Werkzeug==3.0.1
pandas==2.1.4
openpyxl==3.1.2
gunicorn==21.2.0
```

### Erro: "gunicorn: command not found"
**Solução**: Certifique-se de que `gunicorn` está em `requirements.txt`

### Erro: "Application failed to respond"
**Solução**: 
- Verifique se o `Start Command` está correto: `gunicorn app:app`
- Verifique os logs no dashboard do Render

### Banco de dados não persiste
**Solução**: 
- O SQLite no Render pode não persistir entre deploys no Free Tier
- Considere usar PostgreSQL (Render oferece PostgreSQL gratuito)
- Ou use o disco persistente (disponível em planos pagos)

## 📝 Passo a Passo Completo

1. **Prepare o código localmente**
   ```bash
   cd judo_sistema
   # Teste localmente primeiro
   python app.py
   ```

2. **Commit e push para GitHub**
   ```bash
   git add .
   git commit -m "Preparado para deploy no Render"
   git push origin main
   ```

3. **No Render Dashboard**
   - Clique em "New +" → "Web Service"
   - Conecte repositório
   - Configure como descrito acima
   - Clique em "Create Web Service"

4. **Aguarde o deploy**
   - Primeiro deploy pode levar 3-5 minutos
   - Monitore os logs em tempo real

5. **Acesse sua aplicação**
   - Render fornece uma URL: `https://seu-app.onrender.com`
   - Teste o login: `admin / admin123`
   - **IMPORTANTE**: Altere a senha imediatamente!

## 🔐 Segurança Pós-Deploy

1. **Altere a senha do admin**
   - Acesse o sistema
   - Vá em "Usuários"
   - Edite o usuário "admin"
   - Altere para uma senha forte

2. **Configure HTTPS** (já está ativo no Render)

3. **Use variáveis de ambiente** para dados sensíveis

## 📊 Monitoramento

No dashboard do Render você pode:
- Ver logs em tempo real
- Verificar métricas de uso
- Ver histórico de deploys
- Configurar alerts

## 💰 Custos

- **Free Tier**: Grátis
  - 750 horas/mês
  - Spins down após 15 min de inatividade
  - 100GB de bandwidth/mês
  
- **Starter**: $7/mês
  - Sem spin down
  - Mais recursos

## 🎯 Resumo

**Estrutura mínima necessária:**
```
judo_sistema/
├── app.py
├── requirements.txt
├── templates/index.html
└── static/
    ├── css/
    └── js/
```

**Configuração no Render:**
- Build Command: `pip install -r requirements.txt`
- Start Command: `gunicorn app:app`
- Variáveis: `SECRET_KEY` e `FLASK_ENV=production`

**Pronto!** 🎉
