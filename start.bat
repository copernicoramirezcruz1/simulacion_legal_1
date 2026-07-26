@echo off
setlocal

set PORT_TTS=5050
set PORT_LLM=5051
set PORT_VITE=5173

echo Liberando puertos ocupados...
for %%p in (%PORT_TTS% %PORT_LLM% %PORT_VITE%) do (
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":%%p" ^| findstr "LISTENING"') do (
        taskkill /F /PID %%a 2>nul
    )
)
timeout /t 1 /nobreak >nul

:: Cambiar al directorio donde esta el script
cd /d "%~dp0"

:: Verificar configuracion LLM
set PROVIDER=ollama
if exist llm_config.json (
    for /f "delims=" %%i in ('python -c "import json; print(json.load(open('llm_config.json')).get('provider','ollama'))" 2^>nul') do set PROVIDER=%%i
)

echo Iniciando servidor de voces (Piper TTS)...
start /B "" python tts_server.py
timeout /t 2 /nobreak >nul

echo Iniciando servidor LLM (%PROVIDER%)...
start /B "" python llm_server.py
timeout /t 1 /nobreak >nul

echo Iniciando simulacion (frontend)...
start /B "" npx vite --host 0.0.0.0 --port %PORT_VITE%

echo.
echo ==================================
echo   Servidor TTS:  http://localhost:%PORT_TTS%
echo   Servidor LLM:  http://localhost:%PORT_LLM% (%PROVIDER%)
echo   Simulacion:    http://localhost:%PORT_VITE%
echo.
echo   Voces Piper (neural local):
echo     Presidente  - es_ES-sharvard-medium (M, speaker 0)
echo     Vocal       - es_ES-davefx-medium (M)
echo     Secretaria  - es_AR-daniela-high (F)
echo     Accionada   - es_MX-claude-high (F)
echo     Tercero     - es_MX-ald-x_low (M)
echo ==================================
echo.
echo Presiona cualquier tecla en esta ventana para detener todos los servidores y salir...
pause >nul

echo Deteniendo servidores...
for %%p in (%PORT_TTS% %PORT_LLM% %PORT_VITE%) do (
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":%%p" ^| findstr "LISTENING"') do (
        taskkill /F /PID %%a 2>nul
    )
)