#!/bin/bash
set -e

PORT_TTS=5050
PORT_LLM=5051
PORT_VITE=5173

# Liberar puertos ocupados
fuser -k $PORT_TTS/tcp 2>/dev/null || true
fuser -k $PORT_LLM/tcp 2>/dev/null || true
fuser -k $PORT_VITE/tcp 2>/dev/null || true
sleep 1

BASE_DIR="$(dirname "$0")"
cd "$BASE_DIR"

# Verificar configuracion LLM
if [ -f llm_config.json ]; then
  PROVIDER=$(python3 -c "import json; print(json.load(open('llm_config.json')).get('provider','ollama'))" 2>/dev/null || echo "ollama")
else
  PROVIDER="ollama"
fi

# Iniciar servidor TTS
echo "Iniciando servidor de voces (Piper TTS)..."
python3 tts_server.py &
TTS_PID=$!
sleep 2

if ! kill -0 $TTS_PID 2>/dev/null; then
    echo "ERROR: El servidor TTS no pudo iniciar"
    exit 1
fi

# Iniciar servidor LLM
echo "Iniciando servidor LLM ($PROVIDER)..."
python3 llm_server.py &
LLM_PID=$!
sleep 1

# Iniciar frontend Vite
echo "Iniciando simulacion (frontend)..."
npx vite --host 0.0.0.0 --port $PORT_VITE &
VITE_PID=$!

echo ""
echo "=================================="
echo "  Servidor TTS:  http://localhost:$PORT_TTS"
echo "  Servidor LLM:  http://localhost:$PORT_LLM ($PROVIDER)"
echo "  Simulacion:    http://localhost:$PORT_VITE"
echo ""
echo "  Voces Piper (neural local):"
echo "    Presidente  - es_ES-sharvard-medium (M, speaker 0)"
echo "    Vocal       - es_ES-davefx-medium (M)"
echo "    Secretaria  - es_AR-daniela-high (F)"
echo "    Accionada   - es_MX-claude-high (F)"
echo "    Tercero     - es_MX-ald-x_low (M)"
echo "=================================="
echo ""
echo "Ctrl+C para detener todos los servidores"

trap "kill $TTS_PID $LLM_PID $VITE_PID 2>/dev/null; exit" INT TERM
wait
