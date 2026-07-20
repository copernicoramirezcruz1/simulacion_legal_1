#!/bin/bash
set -e

PORT_TTS=5050
PORT_VITE=5173

# Liberar puertos ocupados
fuser -k $PORT_TTS/tcp 2>/dev/null || true
fuser -k $PORT_VITE/tcp 2>/dev/null || true
sleep 1

BASE_DIR="$(dirname "$0")"
cd "$BASE_DIR"

# Iniciar servidor TTS en segundo plano
echo "Iniciando servidor de voces (Piper TTS)..."
python3 tts_server.py &
TTS_PID=$!
sleep 2

# Verificar que el servidor TTS arranco
if ! kill -0 $TTS_PID 2>/dev/null; then
    echo "ERROR: El servidor TTS no pudo iniciar"
    exit 1
fi

# Iniciar frontend Vite
echo "Iniciando simulacion (frontend)..."
npx vite --host 0.0.0.0 --port $PORT_VITE &
VITE_PID=$!

echo ""
echo "=================================="
echo "  Servidor TTS:  http://localhost:$PORT_TTS"
echo "  Simulacion:    http://localhost:$PORT_VITE"
echo ""
echo "  Voces disponibles (Piper neural):"
echo "    Presidente  - es_ES (masculina, x-low)"
echo "    Vocal       - es_MX (masculina, x-low)"
echo "    Secretaria  - es_AR (femenina, high)"
echo "    Accionada   - es_ES (masculina, low)"
echo "    Tercero     - es_MX (femenina, high)"
echo "=================================="
echo ""
echo "Ctrl+C para detener ambos servidores"

trap "kill $TTS_PID $VITE_PID 2>/dev/null; exit" INT TERM
wait
