# 🔧 Solução: Erro ao Importar Planilha

## ❌ Erro Encontrado

```
Erro: Missing optional dependency 'openpyxl'. Use pip or conda to install openpyxl.
```

## ✅ Solução Rápida

### Opção 1: Instalar Dependências (Recomendado)

Execute no terminal/PowerShell na pasta do projeto:

```powershell
cd "C:\Users\Julio Bueno\OneDrive - AMLabs\Área de Trabalho\ProjetosEmpresaPython\judo_sistema"
pip install -r requirements.txt
```

Ou use o script automático:

```powershell
.\install_dependencies.bat
```

### Opção 2: Instalar Apenas openpyxl

```powershell
pip install openpyxl pandas
```

### Opção 3: Usar CSV ao invés de Excel

Se você não quiser instalar o openpyxl, pode usar arquivos CSV:

1. Abra sua planilha Excel
2. Salve como CSV (Arquivo → Salvar Como → CSV)
3. Importe o arquivo CSV no sistema

## 📋 Verificar se Está Instalado

Para verificar se as bibliotecas estão instaladas:

```powershell
python -c "import openpyxl; import pandas; print('OK! Bibliotecas instaladas.')"
```

## 🚀 Após Instalar

1. Reinicie o servidor (pare com Ctrl+C e execute novamente `python app.py`)
2. Tente importar novamente

## 💡 Dica

O arquivo `run.bat` agora verifica automaticamente se as dependências estão instaladas antes de iniciar o servidor.

---

**Problema resolvido!** Agora você pode importar planilhas Excel (.xlsx) e CSV normalmente.
