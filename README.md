# Sistema de Gestão - Projeto Social de Judô

Sistema web completo para gestão de projeto social de Judô, com controle de presença, comunicação e acompanhamento de desempenho dos alunos.

## 🚀 Funcionalidades

### Perfis de Usuários
- **Admin/Sensei**: Acesso completo ao sistema
- **Aluno/Responsável**: Acesso visual aos próprios dados

### Módulos Principais

1. **Cadastro de Alunos**
   - Dados completos (nome, tipo, data de nascimento, responsável, contato)
   - Status (Ativo/Inativo)
   - Observações

2. **Controle de Presença**
   - Registro diário de presença/ausência
   - Justificativas de ausência
   - Histórico completo

3. **Dashboards e Gráficos**
   - Frequência por aluno
   - Evolução ao longo do tempo
   - Ranking de presença
   - Filtros por período e tipo de aluno

4. **Avaliações de Desempenho**
   - Disciplina, Técnica, Participação, Respeito/Comportamento
   - Cálculo automático de média
   - Histórico de avaliações

5. **Quadro de Avisos**
   - Publicação de avisos gerais
   - Exibição para todos os usuários

6. **Rematrícula**
   - Geração de link público único
   - Formulário de confirmação
   - Taxa de R$ 20,00

## 📋 Requisitos

- Python 3.8 ou superior
- pip (gerenciador de pacotes Python)

## 🔧 Instalação

1. **Clone ou baixe o projeto**

2. **Instale as dependências:**
```bash
pip install -r requirements.txt
```

3. **Execute o sistema:**
```bash
python app.py
```

4. **Acesse no navegador:**
```
http://localhost:5000
```

## 👤 Credenciais Padrão

**Admin/Sensei:**
- Usuário: `admin`
- Senha: `admin123`

⚠️ **IMPORTANTE**: Altere a senha padrão em produção!

## 📁 Estrutura do Projeto

```
judo_sistema/
├── app.py                 # Aplicação Flask principal
├── requirements.txt       # Dependências Python
├── README.md             # Este arquivo
├── judo.db              # Banco de dados SQLite (criado automaticamente)
├── templates/            # Templates HTML
│   ├── index.html        # Interface principal
│   └── rematricula.html  # Página pública de rematrícula
└── static/               # Arquivos estáticos
    ├── css/
    │   └── style.css     # Estilos
    └── js/
        └── app.js        # JavaScript frontend
```

## 🎯 Como Usar

### Para o Admin/Sensei:

1. **Login** com credenciais de administrador
2. **Cadastrar Alunos**: Acesse a seção "Alunos" e clique em "Novo Aluno"
3. **Registrar Presença**: Na seção "Presença", selecione a data e marque presença/ausência
4. **Lançar Avaliações**: Seção "Avaliações" → "Nova Avaliação"
5. **Publicar Avisos**: Seção "Avisos" → "Novo Aviso"
6. **Gerar Link de Rematrícula**: Seção "Rematrícula" → Selecione aluno → "Gerar Link"

### Para Aluno/Responsável:

1. **Login** com credenciais fornecidas pelo Sensei
2. **Visualizar**:
   - Presenças e ausências
   - Avisos do Sensei
   - Histórico de desempenho
   - Indicadores de frequência

### Rematrícula Pública:

1. O Sensei gera um link único para cada aluno
2. O link pode ser compartilhado (ex: via WhatsApp)
3. O responsável acessa o link e confirma a rematrícula
4. O sistema atualiza automaticamente o status do aluno

## 🔒 Segurança

- Sistema de autenticação por sessão
- Controle de acesso por perfil (admin/aluno)
- Senhas criptografadas (hash)
- Tokens únicos para rematrícula

## 📊 Banco de Dados

O sistema usa SQLite, que é criado automaticamente na primeira execução.

**Tabelas:**
- `usuarios`: Usuários do sistema
- `alunos`: Cadastro de alunos
- `presencas`: Registro de presenças
- `avaliacoes`: Avaliações de desempenho
- `avisos`: Quadro de avisos
- `rematriculas`: Controle de rematrículas

## 🛠️ Personalização

### Alterar Porta
No arquivo `app.py`, linha final:
```python
app.run(debug=True, host='0.0.0.0', port=5000)  # Altere a porta aqui
```

### Alterar Valor da Rematrícula
No arquivo `app.py`, na função `gerar_link_rematricula`:
```python
valor_pago REAL DEFAULT 20.00  # Altere o valor padrão
```

## 📱 Responsividade

O sistema é totalmente responsivo e funciona bem em:
- Computadores
- Tablets
- Smartphones

## 🐛 Solução de Problemas

**Erro ao iniciar:**
- Verifique se o Python está instalado
- Instale as dependências: `pip install -r requirements.txt`
- Verifique se a porta 5000 está disponível

**Erro de banco de dados:**
- O banco é criado automaticamente
- Certifique-se de ter permissões de escrita no diretório

**Problemas de login:**
- Use as credenciais padrão: admin/admin123
- Verifique se o banco de dados foi inicializado

## 📝 Licença

Este sistema foi desenvolvido para uso em projetos sociais sem fins lucrativos.

## 🤝 Suporte

Para dúvidas ou problemas, consulte a documentação do código ou entre em contato com o desenvolvedor.

## 🔄 Próximas Melhorias Sugeridas

- Exportação de relatórios em PDF
- Notificações por email
- Backup automático do banco de dados
- Integração com WhatsApp para envio de avisos
- App mobile nativo
- Gráficos mais avançados

---

**Desenvolvido com ❤️ para projetos sociais**

