# 🚀 Guia de Deploy - Sistema de Gestão Judô Social

## 📋 Pré-requisitos

1. Conta em uma plataforma de hospedagem (Heroku, Railway, Render, etc.)
2. Git instalado
3. Python 3.8+ instalado localmente (para testes)

## 🔧 Configuração para Deploy

### 1. Variáveis de Ambiente

O sistema já está configurado para usar variáveis de ambiente. Para produção, configure:

```bash
# Secret key para sessões (gerar uma nova para produção)
SECRET_KEY=sua_chave_secreta_aqui_gerada_aleatoriamente

# Porta (geralmente gerenciada pela plataforma)
PORT=5000

# Debug (sempre False em produção)
FLASK_ENV=production
```

### 2. Plataformas Recomendadas

#### **Heroku** (Gratuito com limitações)

1. Instalar Heroku CLI
2. Login: `heroku login`
3. Criar app: `heroku create seu-app-nome`
4. Adicionar buildpack: `heroku buildpacks:set heroku/python`
5. Configurar variáveis:
   ```bash
   heroku config:set SECRET_KEY=$(python -c "import secrets; print(secrets.token_hex(32))")
   heroku config:set FLASK_ENV=production
   ```
6. Deploy: `git push heroku main`

#### **Railway** (Recomendado - Gratuito)

1. Acesse [railway.app](https://railway.app)
2. Conecte seu repositório GitHub
3. Railway detecta automaticamente o Flask
4. Adicione variáveis de ambiente no painel:
   - `SECRET_KEY`: gere uma chave aleatória
   - `FLASK_ENV=production`
5. Deploy automático!

#### **Render** (Gratuito com limitações)

1. Acesse [render.com](https://render.com)
2. Novo Web Service
3. Conecte repositório
4. Configure:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
   - **Environment**: Python 3
5. Adicione variáveis de ambiente

### 3. Modificações Necessárias no Código

#### Atualizar `app.py` para produção:

```python
# Adicionar no início do arquivo
import os

# Atualizar SECRET_KEY
app.secret_key = os.environ.get('SECRET_KEY', secrets.token_hex(32))

# Atualizar configuração do servidor
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') != 'production'
    app.run(host='0.0.0.0', port=port, debug=debug)
```

## 📦 Arquivos para Deploy

### Arquivos já incluídos:
- ✅ `requirements.txt` - Dependências Python
- ✅ `Procfile` - Configuração para Heroku/Railway
- ✅ `.gitignore` - Arquivos ignorados pelo Git

### Arquivos a verificar:
- ✅ Banco de dados SQLite (será criado automaticamente)
- ✅ Arquivos estáticos (CSS, JS) já estão incluídos

## 🔐 Segurança em Produção

### IMPORTANTE:

1. **Altere a senha padrão do admin** após o primeiro login
2. **Use HTTPS** (plataformas modernas já fornecem)
3. **Não commite** o arquivo `judo.db` (já está no `.gitignore`)
4. **Gere uma SECRET_KEY única** para produção

## 🧪 Teste Local Antes do Deploy

```bash
# 1. Instalar dependências
pip install -r requirements.txt

# 2. Executar localmente
python app.py

# 3. Testar em http://localhost:5000
# Login padrão: admin / admin123
```

## 📝 Checklist Pré-Deploy

- [ ] Testar todas as funcionalidades localmente
- [ ] Alterar senha do admin padrão
- [ ] Configurar variáveis de ambiente
- [ ] Verificar se `.gitignore` está correto
- [ ] Testar criação de usuários
- [ ] Testar importação de alunos
- [ ] Verificar funcionamento em diferentes navegadores
- [ ] Fazer backup do banco de dados local (se necessário)

## 🐛 Solução de Problemas Comuns

### Erro: "Module not found"
```bash
# Instale todas as dependências
pip install -r requirements.txt
```

### Erro: "Port already in use"
```bash
# Use uma porta diferente ou mate o processo
# Windows: netstat -ano | findstr :5000
# Linux/Mac: lsof -ti:5000 | xargs kill
```

### Banco de dados não funciona
- O SQLite será criado automaticamente no primeiro acesso
- Certifique-se de que o diretório tem permissões de escrita

## 🌐 URLs Públicas

Após o deploy, você terá uma URL pública como:
- Heroku: `https://seu-app.herokuapp.com`
- Railway: `https://seu-app.up.railway.app`
- Render: `https://seu-app.onrender.com`

## 📞 Suporte

Em caso de problemas:
1. Verifique os logs da plataforma
2. Teste localmente primeiro
3. Verifique variáveis de ambiente
4. Confirme que todas as dependências estão instaladas

---

**Boa sorte com seu deploy! 🥋**
