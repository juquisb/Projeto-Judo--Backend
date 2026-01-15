# 🚀 Guia Rápido de Deploy

## ⚠️ CORREÇÃO DOS BOTÕES

Se os botões "Usuários" e "Justificativas" não estão funcionando, faça o seguinte:

1. **Limpe o cache do navegador** (Ctrl+Shift+Delete)
2. **Recarregue a página** com Ctrl+F5
3. Verifique o console do navegador (F12) para erros

## 📦 Preparação para Deploy

### Opção 1: Railway.app (Mais Fácil - Recomendado)

1. Acesse https://railway.app
2. Faça login com GitHub
3. Clique em "New Project" → "Deploy from GitHub repo"
4. Selecione o repositório
5. Railway detecta automaticamente Flask
6. Adicione variáveis de ambiente:
   - `SECRET_KEY`: Gere com `python -c "import secrets; print(secrets.token_hex(32))"`
   - `FLASK_ENV`: `production`
7. Deploy automático!

### Opção 2: Render.com

1. Acesse https://render.com
2. Novo "Web Service"
3. Conecte repositório GitHub
4. Configure:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
5. Adicione variáveis de ambiente (mesmas do Railway)

### Opção 3: Heroku

```bash
heroku login
heroku create seu-app-nome
heroku config:set SECRET_KEY=$(python -c "import secrets; print(secrets.token_hex(32))")
git push heroku main
```

## 🔧 Arquivos já Preparados

✅ `requirements.txt` - Todas as dependências
✅ `Procfile` - Configuração para servidor
✅ `runtime.txt` - Versão do Python
✅ `.gitignore` - Arquivos ignorados
✅ Variáveis de ambiente configuradas

## ⚡ Teste Local Antes

```bash
# Instalar dependências
pip install -r requirements.txt

# Rodar localmente
python app.py

# Acessar http://localhost:5000
# Login: admin / admin123
```

## 🔐 Segurança

**IMPORTANTE**: Após o deploy:
1. Acesse o sistema
2. Vá em "Usuários"
3. Edite o usuário "admin"
4. Altere a senha para uma senha forte

## 📝 Checklist

- [x] Código corrigido para deploy
- [x] Dependências atualizadas
- [x] Arquivos de configuração criados
- [ ] Teste local realizado
- [ ] Deploy realizado
- [ ] Senha do admin alterada
- [ ] Teste de todas as funcionalidades online

---

**Pronto para deploy! 🎉**
