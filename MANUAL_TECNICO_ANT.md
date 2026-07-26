# Manual Tecnico - Simulacion de Juicio de Amparo Constitucional

## 1. Descripcion General

Aplicacion web monousuario que simula una audiencia de garantias constitucionales en 3D. Los personajes del tribunal (Presidente, Vocal, Secretaria, Accionante, Accionada y Tercero Interesado) intervienen segun un guion predefinido mediante sintesis de voz neuronal. El estudiante asume el rol de la parte accionante y su intervencion oral se captura via reconocimiento de voz y se convierte a texto.

---

## 2. Stack Tecnologico

| Capa | Tecnologia | Version |
|------|-----------|---------|
| Framework | React + TypeScript + Vite | 18 / 5 |
| 3D | Three.js, React Three Fiber, Drei | 0.185+ |
| Estilos | TailwindCSS v4 | — |
| Voz (TTS) | Piper TTS (local, ONNX) | 2023.11.14-2 |
| Reconocimiento (STT) | Web Speech API (navegador) | Chrome/Edge |
| Servidor TTS | Python 3 (http.server) | 3.10+ |
| Audio | Web Audio API | Navegador |

---

## 3. Requisitos del Sistema

### Servidor TTS (obligatorio para voces)
- Python 3.10+
- Piper binary descargado automaticamente en `./piper/`
- 5 modelos de voz ONNX (~277 MB) en `./piper_voices/`
- Puerto 5050 libre

### Navegador (cliente)
- Chrome o Edge (Web Speech API)
- WebGL 2.0 (para Three.js)
- Microfono habilitado

---

## 4. Instalacion

```bash
# 1. Clonar o copiar el proyecto
cd corte

# 2. Instalar dependencias Node
npm install

# 3. Generar modelos GLB (personajes 3D)
node scripts/generate-models.mjs

# 4. Descargar Piper + voces (si no estan ya)
#    - Piper binary: automatico al ejecutar scripts/generate-models.mjs
#      o descargar de https://github.com/rhasspy/piper
#    - Modelos de voz: ya incluidos en piper_voices/
```

### Inicio rapido

```bash
./start.sh
```

Esto inicia el servidor TTS (puerto 5050) y el frontend (puerto 5173). Abrir `http://localhost:5173`.

### Inicio manual

```bash
# Terminal 1 - Servidor TTS
python3 tts_server.py

# Terminal 2 - Frontend
npm run dev
```

---

## 5. Estructura del Proyecto

```
corte/
├── index.html                    # Entry point HTML
├── package.json
├── vite.config.ts                # Vite + TailwindCSS config
├── tsconfig.json
├── start.sh                      # Script de inicio (TTS + frontend)
├── tts_server.py                 # Servidor HTTP de voces Piper
│
├── piper/                        # Piper binary + librerias
│   ├── piper                     # Ejecutable TTS
│   ├── libonnxruntime.so.1.14.1  # ONNX Runtime
│   ├── libpiper_phonemize.so     # Fonemizacion
│   └── espeak-ng-data/           # Datos de eSpeak
│
├── piper_voices/                 # Modelos de voz (.onnx + .json)
│   ├── es_ES-carlfm-x_low.onnx     # Presidente (Espana, masculino)
│   ├── es_MX-ald-x_low.onnx        # Vocal (Mexico, masculino)
│   ├── es_AR-daniela-high.onnx     # Secretaria (Argentina, femenino)
│   ├── es_ES-mls_9972-low.onnx     # Accionada (Espana, masculino)
│   └── es_MX-claude-high.onnx      # Tercero (Mexico, femenino)
│
├── scripts/
│   └── generate-models.mjs       # Generador de modelos GLB
│
├── public/
│   ├── models/                   # Modelos GLB generados
│   │   ├── presidente.glb
│   │   ├── vocal.glb
│   │   ├── secretaria.glb
│   │   ├── accionante.glb
│   │   ├── accionada.glb
│   │   └── tercero.glb
│   └── escudo-bolivia.jpg        # Imagen del escudo (opcional)
│
└── src/
    ├── main.tsx                  # Entry point React
    ├── App.tsx                   # Orquestador principal
    ├── index.css                 # TailwindCSS + estilos globales
    ├── vite-env.d.ts             # Declaraciones TypeScript
    │
    ├── types/
    │   └── index.ts              # Tipos: CharacterRole, ScriptLine, SimulationState
    │
    ├── data/
    │   └── sample-script.txt     # Guion de ejemplo (amparo constitucional)
    │
    ├── utils/
    │   ├── parseScript.ts        # Parser .txt -> ScriptData
    │   └── textures.ts           # Generador de texturas procedurales (Canvas 2D)
    │
    ├── hooks/
    │   ├── useScriptEngine.ts    # Motor de flujo del guion
    │   ├── useSpeechRecognition.ts # STT: voz -> texto (Web Speech API)
    │   └── useSpeechSynthesis.ts   # TTS: texto -> voz (servidor Piper)
    │
    └── components/
        ├── Courtroom.tsx         # Escena 3D de la sala
        ├── CharacterGLB.tsx      # Personaje 3D (carga modelo GLB)
        ├── Character.tsx         # Personaje procedural (respaldo)
        ├── EscudoBolivia.tsx     # Escudo de Bolivia 3D
        ├── HUD.tsx               # Interfaz: subtitulos, microfono, progreso
        └── ResultsScreen.tsx     # Pantalla de resultados
```

---

## 6. Formato de Guiones (.txt)

Los guiones son archivos de texto plano con el siguiente formato:

```
TITULO: Accion de Amparo Constitucional
CASO: Causa N° 2024-001 - Perez vs Ministerio de Salud

PRESIDENTE: Se da inicio a la audiencia de garantias constitucionales.
SECRETARIA: Causa N° 2024-001 sobre accion de amparo...
[ACCIONANTE]
ACCIONADA: Negamos categoricamente las acusaciones.
[ACCIONANTE]
TERCERO: Como tercero interesado solicitamos...
```

### Reglas de sintaxis

| Elemento | Formato | Ejemplo |
|----------|---------|---------|
| Metadato (titulo) | `TITULO: texto` | `TITULO: Caso Perez` |
| Metadato (causa) | `CASO: texto` | `CASO: Causa N° 2024-001` |
| Dialogo de personaje | `ROL: texto` | `PRESIDENTE: Se da inicio...` |
| Turno del estudiante | `[ACCIONANTE]` | (activa el microfono) |
| Linea vacia | Se ignora | — |

### Roles validos
`PRESIDENTE`, `VOCAL`, `SECRETARIA`, `ACCIONANTE`, `ACCIONADA`, `TERCERO`

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
| `IDLE` | Pantalla de inicio, esperando al usuario |
| `PLAYING` | Un personaje del tribunal esta hablando via TTS |
| `STUDENT_TURN` | Turno del estudiante, microfono activo |
| `FINISHED` | Audiencia terminada, pantalla de resultados |

### Flujo

```
1. Usuario hace clic en "Iniciar Audiencia"
2. Se evalua linea actual (indice 0)
3. Si no es [ACCIONANTE]: TTS habla -> onEnd avanza a siguiente linea
4. Si es [ACCIONANTE]: se muestra boton de microfono
5. Usuario habla, detiene -> texto capturado -> avanza linea
6. Repetir hasta el final
```

### Hook: useScriptEngine

```
start()          -> inicia en indice 0, estado PLAYING
advance()        -> indice +1, sincroniza estado
submitStudentResponse(text) -> guarda respuesta, avanza
reset()          -> vuelve a IDLE, indice 0
```

---

## 8. Sistema de Voz

### TTS: Texto a Voz (Piper)

**Arquitectura:**

```
Frontend (hook useSpeechSynthesis)
  │
  │ POST /tts { text: "...", role: "PRESIDENTE" }
  ▼
tts_server.py (Flask-less HTTP en puerto 5050)
  │
  │ subprocess.run([piper, --model, voz.onnx])
  ▼
Piper (ONNX Runtime)
  │
  │ genera .wav
  ▼
Respuesta HTTP: audio/wav
  │
  ▼
Frontend: AudioContext.decodeAudioData() → play()
```

**Mapeo de voces:**

| Rol | Modelo Piper | Origen | Genero | Calidad |
|-----|-------------|--------|--------|---------|
| PRESIDENTE | `es_ES-carlfm-x_low` | Espana | Masculino | x-low |
| VOCAL | `es_MX-ald-x_low` | Mexico | Masculino | x-low |
| SECRETARIA | `es_AR-daniela-high` | Argentina | Femenino | high |
| ACCIONADA | `es_ES-mls_9972-low` | Espana | Masculino | low |
| TERCERO | `es_MX-claude-high` | Mexico | Femenino | high |

**Cache:** El servidor almacena archivos .wav generados en `/tmp/tts_cache/` usando hash MD5(texto + voz). Peticiones repetidas se sirven instantaneamente.

### STT: Voz a Texto (Web Speech API)

- API nativa del navegador (`window.SpeechRecognition`)
- Idioma: `es-ES`
- Modo continuo con resultados intermedios
- Hook: `useSpeechRecognition`
- Acumula fragmentos finales en un ref para devolver el texto completo al detener

---

## 9. Escena 3D

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
| Sillas (x6) | Compuesto (asiento + respaldo + patas) | Madera + metal |
| Pared trasera | PlaneGeometry 16x8 | Panelado vertical |
| Columnas (x4) | CylinderGeometry | Marmol |
| Cortinado | PlaneGeometry 8x4 | Tela textil |
| Escudo de Bolivia | Geometria 3D compuesta | Materiales coloreados + emisivos |

### Personajes

Modelos GLB generados proceduralmente con Three.js. Cada modelo incluye:

- Cabeza: esfera, ojos (blanco + iris + pupila), cejas, nariz, boca, orejas
- Cabello: distinto por genero (corto, largo, rodete)
- Cuerpo: piernas, pies, torso con toga, cuello de camisa, hombros, brazos, antebrazos, manos
- Accesorios: medallon (Presidente)

### Iluminacion

| Luz | Tipo | Posicion | Proposito |
|-----|------|----------|-----------|
| Ambient | ambientLight | — | Luz base azulada |
| Principal | directionalLight | [8, 10, 5] | Sombra principal (sol) |
| Relleno | directionalLight | [-4, 3, -3] | Luz azul de relleno |
| Estrado | pointLight | [0, 4, -4] | Iluminacion dorada del tribunal |
| Laterales (x2) | pointLight | [+-4, 2, 2] | Calidez lateral |
| Foco personaje | SpotLight (dinamico) | Sobre el hablante | Destaca al orador actual |
| Entorno | Environment | "night" | Mapa de entorno HDRI |

### Posiciones de personajes

| Personaje | x | y | z | Detras de |
|-----------|---|---|---|-----------|
| Presidente | -0.7 | 0 | -6.3 | Estrado del juez |
| Vocal | 0.7 | 0 | -6.3 | Estrado del juez |
| Secretaria | -3.2 | 0 | -5.3 | Mesa de secretaria |
| Accionante | -2.8 | 0 | -0.45 | Mesa lateral izq |
| Accionada | 2.8 | 0 | -0.45 | Mesa lateral der |
| Tercero | 0 | 0 | -1.2 | Mesa central |

---

## 10. Generacion de Modelos GLB

Los modelos de personajes se generan con el script `scripts/generate-models.mjs`:

```bash
node scripts/generate-models.mjs
```

Este script:
1. Construye geometrias 3D para cada personaje (cabeza, cuerpo, extremidades)
2. Exporta via `GLTFExporter` de Three.js
3. Guarda los .glb en `public/models/`

**Nota:** El script incluye un polyfill de `FileReader` para Node.js ya que `GLTFExporter` lo requiere internamente.

Para regenerar modelos con diferentes apariencias, modificar el objeto `chars` en el script y re-ejecutar.

---

## 11. API del Servidor TTS

### POST /tts

Genera audio a partir de texto usando Piper TTS.

**Request:**
```json
{
  "text": "Se da inicio a la audiencia de garantias constitucionales",
  "role": "PRESIDENTE"
}
```

**Response:**
- `200 OK`: `audio/wav` (PCM 16-bit, mono, 16000 Hz)
- `400 Bad Request`: Texto vacio o JSON invalido
- `500 Internal Server Error`: Error de Piper o modelo no encontrado

**Roles validos:** `PRESIDENTE`, `VOCAL`, `SECRETARIA`, `ACCIONADA`, `TERCERO`

**CORS:** Habilitado para `*`

---

## 12. Personalizacion

### Cambiar voces

Editar el diccionario `VOICE_MAP` en `tts_server.py`:

```python
VOICE_MAP = {
    "PRESIDENTE": "es_ES-carlfm-x_low",
    "VOCAL": "es_MX-ald-x_low",
    # ...
}
```

Agregar nuevos modelos `.onnx` a `piper_voices/` y referenciarlos en `VOICE_MAP`.

### Agregar guiones

Colocar archivos `.txt` en `src/data/` siguiendo el formato de la seccion 6. Actualizar el import en `src/App.tsx`:

```typescript
import nuevoScript from './data/mi-caso.txt?raw';
const scriptData = parseScript(nuevoScript);
```

### Cambiar apariencia de personajes

Modificar el objeto `chars` en `scripts/generate-models.mjs` y regenerar:

```bash
node scripts/generate-models.mjs
```

### Texturas de la sala

Editar las funciones en `src/utils/textures.ts` para modificar colores, patrones o agregar nuevas texturas.

---

## 13. Solucion de Problemas

| Problema | Causa probable | Solucion |
|----------|---------------|----------|
| Personajes no hablan | Servidor TTS no iniciado | Ejecutar `python3 tts_server.py` |
| Error "Protobuf parsing failed" | Modelo ONNX incompatible | Usar modelos con pytorch 1.13 (ver hexdump) |
| Reconocimiento de voz no funciona | Navegador sin soporte | Usar Chrome o Edge |
| Escudo no se ve | Columna central lo tapa | Ya esta corregido (sin columna en x=0) |
| Personajes no visibles | No estan en el guion | Agregar el rol al archivo .txt |
| Puerto 5050 ocupado | Otra instancia del servidor | `pkill -f tts_server.py` |
| Modelos GLB no cargan | No se generaron | Ejecutar `node scripts/generate-models.mjs` |

---

## 14. Dependencias del Sistema

```
piper/               # 33 MB (binary + libs)
piper_voices/        # 277 MB (5 modelos ONNX)
node_modules/        # ~200 MB
public/models/       # ~900 KB (6 modelos GLB)
```

**Total aproximado:** ~510 MB

---

## 15. Diagrama de Componentes

```
┌──────────────────────────────────────────────────────────────┐
│                        App.tsx                               │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │ useScript    │  │ useSpeech    │  │ useSpeech          │  │
│  │ Engine       │  │ Recognition  │  │ Synthesis          │  │
│  │              │  │ (Web Speech) │  │ (Piper TTS Server) │  │
│  │ - state      │  │ - transcript │  │ - speak(text,role) │  │
│  │ - advance()  │  │ - start/stop │  │ - stop()           │  │
│  │ - line       │  │              │  │                    │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬───────────┘  │
│         │                 │                    │              │
│  ┌──────┴─────────────────┴────────────────────┴──────────┐  │
│  │                      Canvas (R3F)                       │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │ Courtroom    │  │ CharacterGLB │  │ EscudoBolivia│  │  │
│  │  │ - mesas      │  │ - useGLTF    │  │ - 3D geometry │  │  │
│  │  │ - sillas     │  │ - animacion  │  │              │  │  │
│  │  │ - paredes    │  │ - nametag    │  │              │  │  │
│  │  │ - columnas   │  │              │  └──────────────┘  │  │
│  │  │ - spotlight  │  └──────────────┘                    │  │
│  │  └──────────────┘                                       │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ HUD (HTML overlay)                                       │ │
│  │ - Subtitulos del dialogo actual                          │ │
│  │ - Barra de progreso                                      │ │
│  │ - Boton de microfono (turno estudiante)                  │ │
│  │ - Texto capturado (STT)                                  │ │
│  └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```
