# 🥋 Guia Rápido de Execução - Sistema de Gestão de Judô

## ⚡ Execução Rápida (Windows)

### Opção 1: Usando o arquivo .bat (Mais fácil)
1. Abra o PowerShell ou Prompt de Comando
2. Navegue até a pasta do projeto:
   ```powershell
   cd "C:\Users\Julio Bueno\OneDrive - AMLabs\Área de Trabalho\ProjetosEmpresaPython\judo_sistema"
   ```
3. Execute o arquivo:
   ```powershell
   .\run.bat
   ```

### Opção 2: Execução manual
1. Abra o PowerShell na pasta `judo_sistema`
2. Ative o ambiente virtual (se estiver usando):
   ```powershell
   ..\venv\Scripts\Activate.ps1
   ```
3. Instale as dependências (se ainda não instalou):
   ```powershell
   pip install -r requirements.txt
   ```
4. Execute o sistema:
   ```powershell
   python app.py
   ```

## 🌐 Acessando o Sistema

Após executar, você verá uma mensagem como:
```
 * Running on http://0.0.0.0:5000
```

**Acesse no navegador:**
- http://localhost:5000
- ou http://127.0.0.1:5000

## 🔐 Credenciais Padrão

**Admin/Sensei:**
- Usuário: `admin`
- Senha: `admin123`

⚠️ **IMPORTANTE**: Altere a senha padrão após o primeiro acesso!

## ✅ Teste Rápido do Sistema

### 1. Login como Admin
- Acesse http://localhost:5000
- Faça login com `admin` / `admin123`
- Você verá o Dashboard principal

### 2. Cadastrar um Aluno
- Clique em "Alunos" no menu
- Clique em "+ Novo Aluno"
- Preencha os dados:
  - Nome Completo: João Silva
  - Tipo: Criança
  - Data de Nascimento: 01/01/2010
  - Nome do Responsável: Maria Silva
  - Contato: (11) 99999-9999
- Clique em "Cadastrar"

### 3. Registrar Presença
- Clique em "Presença" no menu
- Selecione a data de hoje (ou use o botão "Hoje")
- Para cada aluno, clique em "✓ Presente" ou "✗ Ausente"
- As presenças são salvas automaticamente

### 4. Criar um Aviso
- Clique em "Avisos" no menu
- Clique em "+ Novo Aviso"
- Preencha:
  - Título: Aviso Importante
  - Conteúdo: Treino cancelado na próxima semana
- Clique em "Publicar"

### 5. Ver Dashboard
- Clique em "Dashboard" no menu
- Veja os gráficos de frequência
- Use os filtros para ver períodos diferentes

### 6. Gerar Link de Rematrícula
- Clique em "Rematrícula" no menu
- Selecione um aluno
- Clique em "Gerar Link"
- Copie o link gerado
- Abra em uma nova aba (modo anônimo) para testar

## 🐛 Solução de Problemas

### Erro: "ModuleNotFoundError: No module named 'flask'"
**Solução:**
```powershell
pip install -r requirements.txt
```

### Erro: "Address already in use"
**Solução:** A porta 5000 está em uso. Altere a porta no `app.py`:
```python
app.run(debug=True, host='0.0.0.0', port=5001)  # Mude para 5001
```

### Erro: "Permission denied" ao criar banco de dados
**Solução:** Execute o PowerShell como Administrador ou verifique permissões da pasta

### O sistema não abre no navegador
**Solução:**
1. Verifique se o servidor está rodando (veja a mensagem no terminal)
2. Tente acessar http://127.0.0.1:5000 ao invés de localhost
3. Verifique se há firewall bloqueando a porta

### Banco de dados não é criado
**Solução:** O banco é criado automaticamente na primeira execução. Se não criar:
1. Verifique permissões de escrita na pasta
2. Execute o Python como administrador
3. O banco será criado em: `judo_sistema/judo.db`

## 📱 Testando em Dispositivo Móvel

1. Descubra o IP da sua máquina:
   ```powershell
   ipconfig
   ```
   Procure por "IPv4 Address" (ex: 192.168.1.100)

2. No celular conectado na mesma rede WiFi:
   - Acesse: http://192.168.1.100:5000
   - O sistema é totalmente responsivo!

## 🔄 Parar o Servidor

No terminal onde o servidor está rodando, pressione:
- `Ctrl + C` (Windows/Linux)
- `Cmd + C` (Mac)

## 📊 Estrutura de Arquivos Criados

Após a primeira execução, será criado:
- `judo_sistema/judo.db` - Banco de dados SQLite

## 🎯 Próximos Passos

1. ✅ Teste todas as funcionalidades
2. ✅ Cadastre alguns alunos de exemplo
3. ✅ Registre algumas presenças
4. ✅ Crie avisos e avaliações
5. ✅ Teste o link de rematrícula
6. ⚠️ Altere a senha padrão do admin
7. ⚠️ Crie usuários para alunos (se necessário)

## 💡 Dicas

- O sistema salva automaticamente todas as ações
- Use o Dashboard para acompanhar a frequência
- Os gráficos são atualizados em tempo real
- O sistema funciona offline (após carregar a página)
- Para backup, copie o arquivo `judo.db`

---

**Pronto para usar! 🥋**
