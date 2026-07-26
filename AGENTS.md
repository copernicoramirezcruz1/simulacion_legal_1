# AGENTS.md

## Project overview

Bolivian constitutional court hearing simulator. React 19 + TypeScript + Vite + Three.js 3D courtroom. Two Python backend servers and browser speech APIs for TTS/LLM/voice input.

## Commands

```bash
npm run dev        # Vite dev server (port 5173)
npm run build      # tsc -b && vite build (typecheck THEN build)
npm run lint       # oxlint
npm run preview    # vite preview
```

## Run the full stack

`./start.sh` (Linux) or `start.bat` (Windows) launches:
- TTS server (Python, port 5050) — Piper neural voices
- LLM server (Python, port 5051) — multi-provider: Ollama/Groq/Gemini/OpenAI
- Vite dev (port 5173)

## TypeScript quirks

- **`verbatimModuleSyntax: true`** — must use `import type { X }` for type-only imports, not plain `import { X }`.
- **`erasableSyntaxOnly: true`** — no enums, no `namespace`, no `constructor parameter properties` (TS 6.0 feature).
- **`noUnusedLocals: true`, `noUnusedParameters: true`** — unused variables/params are errors.
- **`allowArbitraryExtensions: true`** — enables `?raw` imports (e.g. `.txt?raw` for script files).

## Architecture

### Frontend (`src/`)
- `App.tsx` — main simulation orchestrator, wires script engine + speech + LLM
- `components/` — React + Three.js: `Courtroom` (3D scene), `CharacterGLB` (GLB models), `HUD`, `ResultsScreen`, `SentenceOverlay`
- `hooks/useScriptEngine.ts` — state machine: IDLE → PLAYING → STUDENT_TURN → FINISHED
- `hooks/useSpeechSynthesis.ts` — calls TTS server, caches decoded AudioBuffers in-memory, splits text into 400-char chunks
- `hooks/useSpeechRecognition.ts` — wraps browser SpeechRecognition API (es-ES)
- `hooks/useLLM.ts` — fetches `localhost:5051/sentencia`
- `utils/parseScript.ts` — parses custom script format

### Script format (`src/data/*.txt`)
```
TITULO: <title>
CASO: <case description>
ROLE: spoken text
[ACCIONANTE]         # marks a student turn (triggers mic input)
SENTENCIA_FINAL: ... # triggers LLM to regenerate the sentence using student arguments
```

### Python servers
- **`tts_server.py`** — runs `piper/piper` binary with `.onnx` voice models from `piper_voices/`. Caches generated WAVs in `/tmp/tts_cache/`. Requires `LD_LIBRARY_PATH` pointing to `piper/` directory.
- **`llm_server.py`** — single endpoint `POST /sentencia`. Reads `llm_config.json` to pick provider. Sends a judge prompt with base sentence + student arguments, returns regenerated sentence.

### 3D models
GLB character models in `public/models/`. Script `scripts/generate-models.mjs` generates them. Each character role maps to a model file (presidente.glb, vocal.glb, secretaria.glb, accionante.glb, accionada.glb, tercero.glb, persona.glb, man_in_suit.glb, mujer.glb).

## Dependencies not tracked in repo

- `piper/` — Piper TTS binary and shared library (gitignored)
- `piper_voices/` — `.onnx` voice model files (gitignored)
- LLM backend (Ollama, Groq API key, Gemini API key, or OpenAI API key) configured in `llm_config.json`

## Key gotchas

- The app hardcodes `http://localhost:5050/tts` and `http://localhost:5051/sentencia`. The Python servers must be running for the full experience (TTS audio, LLM sentence generation).
- `npm run build` runs `tsc -b` (project references build via `tsconfig.json`) — do NOT skip typecheck before build.
- Audio is preloaded before simulation starts (`preloadAll` in `useSpeechSynthesis.ts`). This fires one-by-one POST requests to the TTS server for every script line chunk.
- The `SENTENCIA_FINAL` role in the script shares the PRESIDENTE's position in the 3D scene.
- `ErasableSyntaxOnly: true` means standard TS enums, namespace, and `public x: string` in constructor params are NOT allowed.
