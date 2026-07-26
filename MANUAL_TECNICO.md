# Manual Tecnico - Simulacion de Juicio de Amparo Constitucional

## 1. Descripcion General

Aplicacion web monousuario que simula una audiencia de garantias constitucionales en 3D. Los personajes del tribunal intervienen segun un guion predefinido mediante sintesis de voz neuronal (Piper TTS). El estudiante asume el rol de la parte accionante: su intervencion oral se captura via reconocimiento de voz y se convierte a texto. Al finalizar, un LLM evalua los argumentos del estudiante y genera una sentencia personalizada que se lee en voz alta.

---

## 2. Stack Tecnologico

| Capa | Tecnologia | Version |
|------|-----------|---------|
| Framework | React + TypeScript + Vite | 18 / 5 |
| 3D | Three.js, React Three Fiber, Drei | 0.185+ |
| Estilos | TailwindCSS v4 | — |
| Voz (TTS) | Piper TTS (local, ONNX) | 2023.11.14-2 |
| LLM | Ollama / Groq / Gemini / OpenAI | mistral:7b / varios |
| Reconocimiento (STT) | Web Speech API (navegador) | Chrome/Edge |
| Servidores | Python 3 (http.server) | 3.10+ |
| Audio | Web Audio API | Navegador |

---

## 3. Requisitos del Sistema

### Servidores (obligatorios)

| Servidor | Puerto | Descripcion |
|----------|--------|-------------|
| `tts_server.py` | 5050 | Voces Piper (multi-threaded) |
| `llm_server.py` | 5051 | LLM multi-proveedor (opcional sin argumentos) |

### TTS (Piper)
- Python 3.10+
- Piper binary en `./piper/`
- 6 modelos de voz ONNX (~360 MB) en `./piper_voices/`

### LLM
- **Ollama** (local): 8 GB RAM, `ollama pull mistral:7b`
- **Groq** (nube): API key gratuita, internet
- **Gemini** (nube): API key gratuita, internet
- **OpenAI** (nube): API key, internet

### Navegador
- Chrome o Edge (Web Speech API)
- WebGL 2.0
- Microfono habilitado

---

## 4. Instalacion

```bash
# 1. Dependencias Node
cd corte
npm install

# 2. Modelos GLB (personajes 3D)
node scripts/generate-models.mjs

# 3. Piper (TTS) – ya incluido en ./piper/
# 4. Modelos de voz – ya incluidos en ./piper_voices/

# 5. LLM local (opcional, solo si usas Ollama)
curl -fsSL https://ollama.com/install.sh | sh
ollama pull mistral:7b

# 6. Configurar proveedor LLM
# Editar llm_config.json con provider y API keys
```

### Inicio

```bash
./start.sh
```

Esto inicia los 3 servidores y el frontend. Abrir `http://localhost:5173`.

---

## 5. Estructura del Proyecto

```
corte/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── start.sh                      # Inicia TTS + LLM + frontend
├── tts_server.py                 # Servidor Piper (puerto 5050)
├── llm_server.py                 # Servidor LLM (puerto 5051)
├── llm_config.json               # Config de proveedor LLM
│
├── piper/                        # Piper binary + librerias ONNX
│
├── piper_voices/                 # Modelos de voz (.onnx)
│   ├── es_ES-carlfm-x_low.onnx     # Presidente (Espana, masc)
│   ├── es_ES-mls_10246-low.onnx    # Vocal (Espana, masc)
│   ├── es_AR-daniela-high.onnx     # Secretaria (Argentina, fem)
│   ├── es_ES-mls_9972-low.onnx     # Accionada (Espana, masc)
│   ├── es_MX-claude-high.onnx      # Tercero (Mexico, fem)
│   └── es_MX-ald-x_low.onnx        # Respaldo (Mexico, masc)
│
├── scripts/
│   ├── generate-models.mjs       # Generador GLB procedural
│   └── inspect_glb.mjs           # Inspector de estructura GLB
│
├── public/
│   ├── models/
│   │   ├── persona.glb           # Modelo masculino (181 KB)
│   │   ├── mujer.glb             # Modelo femenino (1.5 MB)
│   │   ├── man_in_suit.glb       # Modelo alternativo (no usado)
│   │   └── *.glb                 # Modelos procedurales (respaldo)
│   └── escudo-bolivia.jpg        # Imagen escudo (opcional)
│
└── src/
    ├── main.tsx
    ├── App.tsx                   # Orquestador principal
    ├── index.css
    ├── vite-env.d.ts
    │
    ├── types/
    │   └── index.ts              # Tipos: CharacterRole, ScriptLine, SimulationState
    │
    ├── data/
    │   └── sample-script.txt     # Guion de ejemplo
    │
    ├── utils/
    │   ├── parseScript.ts        # Parser .txt -> ScriptData
    │   └── textures.ts           # Texturas procedurales (Canvas 2D)
    │
    ├── hooks/
    │   ├── useScriptEngine.ts    # Motor de flujo del guion
    │   ├── useSpeechRecognition.ts # STT: voz -> texto
    │   ├── useSpeechSynthesis.ts   # TTS: texto -> voz (Piper)
    │   └── useLLM.ts             # LLM: generacion de sentencia
    │
    └── components/
        ├── Courtroom.tsx         # Escena 3D (sala + mesas + columnas)
        ├── CharacterGLB.tsx      # Personaje 3D (carga persona.glb / mujer.glb)
        ├── Character.tsx         # Personaje procedural (respaldo)
        ├── EscudoBolivia.tsx     # Escudo de Bolivia (Canvas 2D)
        ├── HUD.tsx               # Subtitulos, microfono, progreso
        ├── ResultsScreen.tsx     # Pantalla final + sentencia
        └── SentenceOverlay.tsx   # Overlay "Redactando Sentencia..."
```

---

## 6. Formato de Guiones (.txt)

```
TITULO: Accion de Amparo Constitucional
CASO: Causa N° 2024-001 - Perez vs Ministerio de Salud

PRESIDENTE: Se da inicio a la audiencia...
SECRETARIA: Causa N° 2024-001 sobre accion de amparo...
PRESIDENTE: Se concede la palabra a la parte accionante.
[ACCIONANTE]
ACCIONADA: Negamos categoricamente las acusaciones.
TERCERO: Como tercero interesado solicitamos...
SENTENCIA_FINAL: VISTOS: La accion de amparo... POR TANTO: ...
```

### Reglas de sintaxis

| Elemento | Formato | Ejemplo |
|----------|---------|---------|
| Metadato | `TITULO:` / `CASO:` | `TITULO: Caso Perez` |
| Dialogo | `ROL: texto` | `PRESIDENTE: Se da inicio...` |
| Turno estudiante | `[ACCIONANTE]` | Activa el microfono |
| Sentencia final | `SENTENCIA_FINAL: texto` | LLM la modifica si hay argumentos |
| Linea vacia | Se ignora | — |

### Roles validos

`PRESIDENTE`, `VOCAL`, `SECRETARIA`, `ACCIONANTE`, `ACCIONADA`, `TERCERO`, `SENTENCIA_FINAL`

---

## 7. Arquitectura del Motor de Guion

### Estados de la simulacion

```
IDLE -> PLAYING -> STUDENT_TURN -> PLAYING -> ... -> FINISHED
  ^                                                        |
  +------------------------ reset --------------------------+
```

| Estado | Descripcion |
|--------|-------------|
| `IDLE` | Pantalla de inicio |
| `PLAYING` | Personaje hablando via TTS o LLM generando |
| `STUDENT_TURN` | Microfono activo para el estudiante |
| `FINISHED` | Audiencia terminada, pantalla de resultados |

### Flujo completo

```
1. Usuario hace clic en "Iniciar Audiencia"
2. preloadAll(): precarga audios de todas las lineas en segundo plano
3. Se evalua linea actual (indice 0):
   a. Dialogo normal: TTS habla -> onEnd avanza
   b. [ACCIONANTE]: microfono activo -> texto capturado -> avanza
   c. SENTENCIA_FINAL:
      - Con argumentos: overlay "Redactando..." -> LLM modifica -> Piper lee
      - Sin argumentos: Piper lee la original
4. Repetir hasta el final
5. ResultsScreen muestra intervenciones + sentencia
```

### Textos largos

Textos de cualquier longitud se dividen en fragmentos de ~400 caracteres respetando limites de oracion. Cada fragmento se sintetiza y reproduce secuencialmente con una pausa de 500ms entre ellos.

---

## 8. Sistema de Voz (TTS)

### Arquitectura

```
Frontend (useSpeechSynthesis)
  │
  │ POST /tts { text, role }
  ▼
tts_server.py (multi-threaded, puerto 5050)
  │
  │ subprocess.run([piper, --model, voz.onnx])
  ▼
Piper (ONNX Runtime) → .wav
  │
  ▼
Frontend: AudioContext.decodeAudioData() → play()
```

### Mapeo de voces

| Rol | Modelo Piper | Origen | Genero |
|-----|-------------|--------|--------|
| PRESIDENTE | `es_ES-carlfm-x_low` | Espana | Masculino |
| VOCAL | `es_ES-mls_10246-low` | Espana | Masculino |
| SECRETARIA | `es_AR-daniela-high` | Argentina | Femenino |
| ACCIONADA | `es_ES-mls_9972-low` | Espana | Masculino |
| TERCERO | `es_MX-claude-high` | Mexico | Femenino |

Nota: `SENTENCIA_FINAL` usa la voz de `PRESIDENTE` para TTS.

### Cache

El servidor almacena archivos `.wav` en `/tmp/tts_cache/` usando hash MD5(texto + voz). Peticiones repetidas se sirven instantaneamente.

### Preload

Al iniciar la simulacion, `preloadAll()` envia secuencialmente todos los fragmentos de texto al servidor TTS. Los audios se decodifican y almacenan en memoria. Cuando un personaje habla, el audio ya esta listo (reproduccion instantanea sin espera de red).

### STT: Voz a Texto

- API nativa: `window.SpeechRecognition`
- Idioma: `es-ES`
- Modo continuo con resultados intermedios
- Hook: `useSpeechRecognition`
- Acumula fragmentos finales en un ref para devolver el texto completo al detener

---

## 9. Sistema LLM (Sentencia)

### Arquitectura

```
Frontend (useLLM)
  │
  │ POST /sentencia { sentenciaBase, argumentos }
  ▼
llm_server.py (puerto 5051)
  │
  ├── Ollama:    POST localhost:11434/api/generate
  ├── Groq:      POST api.groq.com/openai/v1/chat/completions
  ├── Gemini:    POST generativelanguage.googleapis.com/v1beta/...
  └── OpenAI:    POST {url}/chat/completions
  │
  ▼
Respuesta: { sentencia: "VISTOS: ... POR TANTO: ..." }
```

### Configuracion (`llm_config.json`)

```json
{
  "provider": "ollama",
  "ollama": {
    "url": "http://localhost:11434",
    "model": "mistral:7b"
  },
  "groq": {
    "api_key": "gsk_...",
    "model": "llama-3.1-8b-instant"
  },
  "gemini": {
    "api_key": "AIza...",
    "model": "gemini-2.0-flash"
  },
  "openai": {
    "url": "https://api.openai.com/v1",
    "api_key": "sk-...",
    "model": "gpt-4o-mini"
  }
}
```

### Tiempos por proveedor

| Proveedor | Tiempo | Costo | Internet |
|-----------|--------|-------|----------|
| Ollama `mistral:7b` | 3-5 min | Gratis | No |
| Groq `llama-3.1-8b` | 3-8 seg | Gratis | Si |
| Gemini `2.0-flash` | 5-10 seg | Gratis | Si |
| OpenAI `gpt-4o-mini` | 5-15 seg | ~$0.001 | Si |

### Flujo de la sentencia

1. Audiencia transcurre → se acumulan `studentResponses[]`
2. Llega linea `SENTENCIA_FINAL:`:
   - **Sin argumentos**: se lee la original via Piper (sin LLM)
   - **Con argumentos**: overlay "Redactando..." → LLM evalua → sentencia modificada → Piper lee
3. El texto de la sentencia (original o modificada) se muestra en `ResultsScreen` al final

### Prompt juridico

```
Eres un juez del Tribunal de Garantias Constitucionales de Bolivia.
Dicta sentencia considerando los argumentos expuestos.

SENTENCIA BASE: {original}
ARGUMENTOS DE LA PARTE ACCIONANTE: {argumentos}

- Si argumentos solidos: CONCEDE el amparo
- Si argumentos debiles: DENIEGA
- Si son parcialmente validos: CONCEDE EN PARTE
- Formato: VISTOS, CONSIDERANDO, POR TANTO
- Responde UNICAMENTE con la sentencia completa
```

---

## 10. Escena 3D

### Sala de Audiencias

| Elemento | Geometria | Textura |
|----------|-----------|---------|
| Piso | PlaneGeometry 16x16 | Baldosas procedurales (Canvas 2D) |
| Pasillo central | PlaneGeometry 4x10 | Alfombra con patron de rombos |
| Estrado del tribunal | BoxGeometry elevado | Madera oscura |
| Mesa del juez | BoxGeometry | Madera oscura |
| Mesas laterales (x2) | BoxGeometry 1.2x0.9x0.5 | Madera |
| Mesa secretaria | BoxGeometry 1.5x0.9x1.8 | Madera |
| Mesa tercero | BoxGeometry 1.2x0.9x0.5 | Madera (condicional) |
| Pared trasera | PlaneGeometry 16x8 | Panelado vertical |
| Columnas (x4) | CylinderGeometry | Marmol |
| Cortinado | PlaneGeometry 8x4 | Tela textil |
| Escudo de Bolivia | Canvas 2D procedural | Pintado via Canvas API |

### Modelos 3D

| Modelo | Archivo | Usado por |
|--------|---------|-----------|
| Masculino | `persona.glb` (181 KB) | Presidente, Vocal, Accionante, Tercero, SENTENCIA_FINAL |
| Femenino | `mujer.glb` (1.5 MB) | Secretaria, Accionada |

Cada personaje recibe un tinte de color distinto en el traje via `cloneAndCustomize()`. Escala calculada automaticamente por bounding box, con multiplicador y offset Y corregibles por modelo.

### Iluminacion

| Luz | Tipo | Posicion | Proposito |
|-----|------|----------|-----------|
| Ambient | ambientLight | — | Luz base azulada |
| Principal | directionalLight | [8, 10, 5] | Sombra principal |
| Relleno | directionalLight | [-4, 3, -3] | Luz azul de relleno |
| Estrado | pointLight | [0, 4, -4] | Iluminacion dorada tribunal |
| Laterales (x2) | pointLight | [+-4, 2, 2] | Calidez lateral |
| Foco | SpotLight | Sobre hablante | Destaca al orador actual |

### Posiciones de personajes

| Personaje | x | y | z | Detras de |
|-----------|---|---|---|-----------|
| Presidente | -0.7 | 0 | -6.3 | Estrado del juez |
| Vocal | 0.7 | 0 | -6.3 | Estrado del juez |
| Secretaria | -3.2 | 0 | -5.3 | Mesa de secretaria |
| Accionante | -2.8 | 0 | -0.45 | Mesa lateral izq |
| Accionada | 2.8 | 0 | -0.45 | Mesa lateral der |
| Tercero | 0 | 0 | -1.2 | Mesa central |
| Sentencia | -0.7 | 0 | -6.3 | Misma que Presidente |

---

## 11. APIs de Servidores

### POST /tts (TTS Server — puerto 5050)

Genera audio a partir de texto usando Piper.

**Request:**
```json
{ "text": "Se da inicio a la audiencia", "role": "PRESIDENTE" }
```

**Response:**
- `200 OK`: `audio/wav` (PCM 16-bit, mono, 16000 Hz)
- `400`: Texto vacio o JSON invalido
- `500`: Error de Piper o timeout (300s)

**Roles:** `PRESIDENTE`, `VOCAL`, `SECRETARIA`, `ACCIONADA`, `TERCERO`

---

### POST /sentencia (LLM Server — puerto 5051)

Genera sentencia modificada por LLM.

**Request:**
```json
{
  "sentenciaBase": "VISTOS: La accion de amparo... POR TANTO: ...",
  "argumentos": [
    "Senor presidente, se vulnero mi derecho...",
    "El ministerio nunca respondio..."
  ]
}
```

**Response:**
```json
{ "sentencia": "VISTOS: ... CONSIDERANDO: ... POR TANTO: CONCEDE..." }
```

**Errores:**
- `400`: `sentenciaBase` requerida
- `502`: No se pudo conectar al LLM
- `500`: Error interno

---

## 12. Personalizacion

### Cambiar proveedor LLM

Editar `llm_config.json` y cambiar `provider` + API keys del bloque correspondiente.

### Cambiar voces

Editar `VOICE_MAP` en `tts_server.py`. Agregar nuevos `.onnx` a `piper_voices/`.

### Agregar guiones

Colocar `.txt` en `src/data/`. Actualizar import en `App.tsx`:

```typescript
import nuevoScript from './data/mi-caso.txt?raw';
const scriptData = parseScript(nuevoScript);
```

### Cambiar modelos 3D

Reemplazar `persona.glb` o `mujer.glb` en `public/models/`. Ajustar `SCALE_MULTIPLIER`, `MODEL_ROTATION_FIX` y `MODEL_Y_OFFSET` en `CharacterGLB.tsx` segun el nuevo modelo.

### Texturas de la sala

Editar funciones en `src/utils/textures.ts`.

---

## 13. Solucion de Problemas

| Problema | Causa | Solucion |
|----------|-------|----------|
| Personajes no hablan | TTS no iniciado | `python3 tts_server.py &` |
| Voces se superponen | Puerto 5050 ocupado | `fuser -k 5050/tcp` |
| Error "Protobuf parsing" | Modelo ONNX incompatible | Verificar hexdump (debe ser pytorch 1.13) |
| Microfono no funciona | Navegador sin soporte | Usar Chrome o Edge |
| Personajes no visibles | Rol no esta en el guion | Agregar el rol al `.txt` |
| LLM no conecta | `llm_server.py` no iniciado | `python3 llm_server.py &` |
| LLM tarda mucho (Ollama) | CPU lenta | Usar Groq o Gemini (nube) |
| Sala no carga | Error JS en consola | Verificar F12 > Console |
| Modelo muy grande/chico | Escala incorrecta | Ajustar `SCALE_MULTIPLIER` en `CharacterGLB.tsx` |
| Modelo hundido en piso | Offset Y incorrecto | Ajustar `MODEL_Y_OFFSET` en `CharacterGLB.tsx` |

---

## 14. Dependencias del Sistema

```
piper/               # 33 MB (binary + libs)
piper_voices/        # 360 MB (6 modelos ONNX)
node_modules/        # ~200 MB
public/models/       # ~2 MB (persona.glb + mujer.glb)
```

**Total aproximado:** ~595 MB (+ modelo LLM si se usa Ollama: ~4 GB)

---

## 15. Diagrama de Componentes

```
┌──────────────────────────────────────────────────────────────────┐
│                          App.tsx                                  │
│  ┌────────────┐  ┌──────────────┐  ┌──────────┐  ┌───────────┐ │
│  │useScript   │  │useSpeech     │  │useSpeech │  │useLLM     │ │
│  │Engine      │  │Recognition   │  │Synthesis │  │           │ │
│  │- state     │  │- transcript  │  │- speak() │  │- generate │ │
│  │- advance() │  │- start/stop  │  │- preload │  │  Sentence │ │
│  └─────┬──────┘  └──────┬───────┘  └────┬─────┘  └─────┬─────┘ │
│        │                │               │              │        │
│  ┌─────┴────────────────┴───────────────┴──────────────┴──────┐ │
│  │                     Canvas (R3F)                             │ │
│  │  ┌────────────┐  ┌──────────────┐  ┌──────────────────┐    │ │
│  │  │ Courtroom  │  │ CharacterGLB │  │ EscudoBolivia    │    │ │
│  │  │ - mesas    │  │ - persona.glb│  │ - Canvas 2D      │    │ │
│  │  │ - paredes  │  │ - mujer.glb  │  │ - meshBasicMat   │    │ │
│  │  │ - columnas │  │ - tint traje │  │                  │    │ │
│  │  │ - spotlight│  │ - nametag    │  └──────────────────┘    │ │
│  │  └────────────┘  └──────────────┘                           │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────┐  ┌──────────────────┐                     │
│  │ HUD                │  │ SentenceOverlay  │                     │
│  │ - Subtitulos       │  │ - Spinner        │                     │
│  │ - Barra progreso   │  │ - "Redactando..."│                     │
│  │ - Boton microfono  │  └──────────────────┘                     │
│  └────────────────────┘                                           │
└──────────────────────────────────────────────────────────────────┘
         │                  │                  │
         ▼                  ▼                  ▼
┌─────────────┐  ┌──────────────┐  ┌──────────────┐
│tts_server.py│  │llm_server.py │  │  Navegador   │
│   :5050     │  │   :5051      │  │  :5173       │
│ Piper TTS   │  │ Ollama/Groq/ │  │ React SPA    │
│ (5 voces)   │  │ Gemini/OpenAI│  │              │
└─────────────┘  └──────────────┘  └──────────────┘
```
