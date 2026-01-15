@echo off
echo ========================================
echo   Sistema de Gestao de Judo Social
echo ========================================
echo.
echo Verificando dependencias...
python -c "import flask" 2>nul
if errorlevel 1 (
    echo [AVISO] Flask nao encontrado. Instalando dependencias...
    pip install -r requirements.txt
    echo.
)

python -c "import pandas" 2>nul
if errorlevel 1 (
    echo [AVISO] Pandas nao encontrado. Instalando dependencias...
    pip install -r requirements.txt
    echo.
)

python -c "import openpyxl" 2>nul
if errorlevel 1 (
    echo [AVISO] OpenPyXL nao encontrado. Instalando dependencias...
    pip install -r requirements.txt
    echo.
)

echo.
echo Iniciando servidor...
echo.
echo ========================================
echo   Acesse: http://localhost:5000
echo   Login: admin / admin123
echo ========================================
echo.
echo Pressione Ctrl+C para parar o servidor
echo.
python app.py
pause

