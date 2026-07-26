# Instalacion en Windows 10

Guia paso a paso para instalar y ejecutar el simulador de audiencia constitucional en una maquina con Windows 10.

---

## 1. Requisitos previos

Instalar estos programas con sus instaladores oficiales (todos gratuitos):

| Programa | Version minima | Descargar de |
|----------|---------------|-------------|
| **Node.js** | 20.x LTS | https://nodejs.org/es |
| **Python** | 3.10 o superior | https://www.python.org/downloads/ |
| **Chrome** o **Edge** | ultima version | Ya incluido en Windows 10 |

> Durante la instalacion de Python, **marca la casilla "Add Python to PATH"** antes de hacer clic en Install. Si no la marcaste, reinstala o agrega Python manualmente al PATH.

**Verifica que todo funciona** abriendo una terminal (cmd o PowerShell) y ejecutando:

```cmd
node --version
python --version
```

Si `python` no se reconoce, prueba con `py` o revisa la instalacion.

---

## 2. Descargar el proyecto

**Opcion A — Git** (recomendado):

```cmd
git clone <url-del-repositorio> corte
cd corte
```

**Opcion B — ZIP**: descarga el ZIP del repositorio, extraelo en `C:\corte` (o donde prefieras), abre una terminal en esa carpeta.

---

## 3. Instalar dependencias Node

Dentro de la carpeta `corte`:

```cmd
npm install
```

Este comando descarga React, Three.js, TailwindCSS y todas las librerias del frontend (~200 MB en `node_modules/`). Tarda entre 1 y 3 minutos.

---

## 4. Instalar Piper TTS (sintesis de voz neuronal)

Piper es el motor de voz local. Necesitas dos cosas: el ejecutable de Windows y los modelos de voz.

### 4.1 Descargar Piper para Windows

1. Ve a https://github.com/rhasspy/piper/releases
2. Busca el release mas reciente (ej. `2023.11.14-2`)
3. Descarga el archivo **`piper_windows_amd64.zip`**
4. Extrae su contenido en la carpeta `piper/` del proyecto

La carpeta `piper/` debe quedar asi:

```
piper/
├── piper.exe
├── piper_phonemize.exe
├── onnxruntime.dll
├── piper_phonemize.dll
├── espeak-ng.dll
├── espeak-ng-data/
├── libtashkeel_model.ort
└── (resto de DLLs del zip)
```

### 4.2 Descargar modelos de voz

Cada personaje necesita su modelo de voz (archivos `.onnx` y `.onnx.json`). Se descargan en la carpeta `piper_voices/`.

Desde una terminal en la carpeta `corte`:

```cmd
cd piper_voices
```

Descarga los 6 modelos necesarios (copiar cada URL en el navegador y guardar en `piper_voices/`):

| Personaje | URL del .onnx | URL del .json | Tamano |
|-----------|--------------|---------------|--------|
| **PRESIDENTE** | `https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/sharvard/medium/es_ES-sharvard-medium.onnx` | cambia `.onnx` por `.onnx.json` | ~74 MB |
| **VOCAL** | `https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/davefx/medium/es_ES-davefx-medium.onnx` | cambia `.onnx` por `.onnx.json` | ~60 MB |
| **SECRETARIA** | `https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_AR/daniela/high/es_AR-daniela-high.onnx` | cambia `.onnx` por `.onnx.json` | ~109 MB |
| **ACCIONADA** | `https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_MX/claude/high/es_MX-claude-high.onnx` | cambia `.onnx` por `.onnx.json` | ~60 MB |
| **TERCERO** | `https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_MX/ald/x_low/es_MX-ald-x_low.onnx` | cambia `.onnx` por `.onnx.json` | ~20 MB |

> Tambien se conserva el modelo `es_ES-mls_10246-low` (ya incluido en el proyecto) como respaldo — no es necesario volver a descargarlo.

**Total aproximado: ~340 MB** de modelos de voz.

### 4.3 Verificar Piper

Para comprobar que Piper funciona en Windows:

```cmd
echo Hola mundo | piper\piper.exe --model piper_voices\es_ES-davefx-medium.onnx --output_file prueba.wav
```

Si se genera `prueba.wav` sin errores, Piper esta listo.

---

## 5. Configurar el LLM (opcional pero recomendado)

Edita el archivo `llm_config.json` en la raiz del proyecto. Elige **un solo** proveedor:

### Opcion A — Ollama (local, sin internet, requiere ~8 GB RAM)

1. Descarga Ollama de https://ollama.com/download/windows e instalalo.
2. Abre una terminal y descarga el modelo:

```cmd
ollama pull mistral:7b
```

3. En `llm_config.json` dejar `"provider": "ollama"` (ya viene por defecto).

### Opcion B — Groq (nube, gratuito con limites generosos)

1. Crea una cuenta en https://console.groq.com
2. Genera una API key
3. En `llm_config.json`:

```json
{
  "provider": "groq",
  "groq": {
    "api_key": "TU_API_KEY_AQUI",
    "model": "llama-3.1-8b-instant"
  }
}
```

### Opcion C — Gemini (Google, gratuito)

1. Obten una API key en https://aistudio.google.com/apikey
2. En `llm_config.json`:

```json
{
  "provider": "gemini",
  "gemini": {
    "api_key": "TU_API_KEY_AQUI",
    "model": "gemini-2.0-flash"
  }
}
```

> **Sin LLM**: la simulacion funciona igual, pero la sentencia final no se personalizara con los argumentos del estudiante y se leera el texto original del guion.

---

## 6. Ejecutar el proyecto

Abre una terminal (cmd) en la carpeta `corte` y ejecuta:

```cmd
start.bat
```

El script automaticamente:
1. Libera los puertos 5050, 5051 y 5173 si estan ocupados.
2. Inicia el servidor de voces (Python, puerto 5050).
3. Inicia el servidor LLM (Python, puerto 5051).
4. Inicia el frontend Vite (puerto 5173).

Si todo sale bien, veras:

```
==================================
  Servidor TTS:  http://localhost:5050
  Servidor LLM:  http://localhost:5051 (ollama)
  Simulacion:    http://localhost:5173

  Voces Piper (neural local):
    Presidente  - es_ES-sharvard-medium (M, speaker 0)
    Vocal       - es_ES-davefx-medium (M)
    Secretaria  - es_AR-daniela-high (F)
    Accionada   - es_MX-claude-high (F)
    Tercero     - es_MX-ald-x_low (M)
==================================
```

Abre **Chrome o Edge** en `http://localhost:5173`.

---

## 7. Requisitos del navegador

- **Solo funciona en Chrome o Edge** (usan el motor Chromium, unico con Web Speech API en espanol).
- El microfono debe estar **habilitado y configurado** en Windows. Al primer uso, el navegador pedira permiso.
- **WebGL 2.0** requerido para la escena 3D. Si no carga, actualiza los drivers de video.
- Firefox y otros navegadores **no** son compatibles con reconocimiento de voz en este proyecto.

---

## 8. Solucion de problemas

### "python" no se reconoce como comando

Prueba con `py` en lugar de `python`. Si usas `py`, edita `start.bat` y cambia:
```
python → py
```

### Error "piper.exe no se encuentra" o "No such file"

La carpeta `piper/` no existe o no tiene `piper.exe`. Revisa la seccion 4.1.

### Error "Voice model not found: es_ES-sharvard-medium"

Falta descargar ese modelo en `piper_voices/`. Revisa la seccion 4.2.

### Error "onnxruntime.dll no se encontro"

Las DLLs de Piper no estan en la misma carpeta que `piper.exe`. Extrae **todo** el ZIP de Piper dentro de `piper/`, no solo el `.exe`.

### Error "Import error: No module named '...'"

Faltan librerias de Python. El proyecto usa solo modulos estandar de Python (sin pip install), asi que verifica que tienes Python 3.10+.

### No se ve el escudo de Bolivia

La imagen `public/escudo-bolivia.jpg` debe existir. Si no esta, copia `Escudo-bolivia.jpg` (en la raiz) a `public/escudo-bolivia.jpg`.

### El puerto 5173 ya esta en uso

El script `start.bat` intenta liberarlo automaticamente. Si falla, ejecuta manualmente:

```cmd
netstat -aon | findstr ":5173"
taskkill /F /PID <numero_del_PID>
```

### Windows en espanol — no se liberan los puertos

El comando `findstr "LISTENING"` busca la palabra en ingles. En Windows en espanol el estado se llama `"ESCUCHANDO"`. Edita `start.bat` y cambia `LISTENING` por `ESCUCHANDO` en las lineas 10 y 55.

### El audio no se escucha

- Verifica que los parlantes/audifonos funcionen en Windows.
- El servidor TTS debe mostrar `[TTS]` en la terminal al recibir peticiones. Si no, revisa que el puerto 5050 este libre.
- Chrome a veces bloquea audio sin interaccion del usuario. Haz clic en la pagina antes de iniciar la simulacion.

### La voz suena robotica o muy lenta

- Cierra la terminal y vuelve a ejecutar `start.bat`. El servidor TTS se carga fresco.
- Borra la cache de audio: `del /s /q %TEMP%\tts_cache\*` y reinicia.
- Si usas Ollama para LLM, verifica que Ollama este corriendo (`ollama serve` en otra terminal).

---

## 9. Comandos utiles

```cmd
npm run dev          # Solo el frontend (sin TTS ni LLM)
npm run build        # Compilar para produccion (tsc + vite)
npm run preview      # Previsualizar build de produccion
npm run lint         # Ejecutar linter (oxlint)
```

---

## Resumen de archivos necesarios despues de la instalacion

```
corte/
├── start.bat                    ← script que inicia todo
├── llm_config.json              ← config de LLM (editar con API key)
├── node_modules/                ← npm install crea esto
├── piper/
│   ├── piper.exe                ← descargado de GitHub Releases
│   ├── onnxruntime.dll          ← incluido en el zip de Piper
│   ├── piper_phonemize.dll      ← incluido en el zip de Piper
│   └── espeak-ng-data/          ← incluido en el zip de Piper
├── piper_voices/
│   ├── es_ES-sharvard-medium.onnx + .json    ← descargar (PRESIDENTE)
│   ├── es_ES-davefx-medium.onnx + .json      ← descargar (VOCAL)
│   ├── es_AR-daniela-high.onnx + .json       ← descargar (SECRETARIA)
│   ├── es_MX-claude-high.onnx + .json        ← descargar (ACCIONADA)
│   └── es_MX-ald-x_low.onnx + .json          ← descargar (TERCERO)
└── public/
    └── escudo-bolivia.jpg        ← imagen del escudo
```

---

Si algo falla, revisa que los 3 servidores esten respondiendo:

```cmd
curl http://localhost:5050/tts
curl http://localhost:5051/sentencia
curl http://localhost:5173
```

(Cada uno debe responder, aunque sea con error — si no responden, ese servidor no arranco.)
