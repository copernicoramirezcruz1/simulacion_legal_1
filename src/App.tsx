import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { Courtroom } from './components/Courtroom';
import { HUD } from './components/HUD';
import { ResultsScreen } from './components/ResultsScreen';
import { SentenceOverlay } from './components/SentenceOverlay';
import { useScriptEngine } from './hooks/useScriptEngine';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis';
import { useLLM } from './hooks/useLLM';
import { parseScript } from './utils/parseScript';
import type { CharacterRole, ScriptData } from './types';

const scriptModules = import.meta.glob('./data/*.txt', { query: '?raw', import: 'default' });

function getScriptOptions() {
  return Object.keys(scriptModules)
    .map((path) => ({
      path,
      name: path.replace('./data/', '').replace('.txt', ''),
    }))
    .sort();
}

function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.15} color="#304060" />
      <directionalLight
        position={[8, 10, 5]}
        intensity={0.7}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        color="#fff8e7"
      />
      <directionalLight
        position={[-4, 3, -3]}
        intensity={0.3}
        color="#aaccff"
      />
      <pointLight
        position={[0, 4, -4]}
        intensity={0.4}
        color="#ffd700"
        distance={10}
        decay={2}
      />
      <pointLight
        position={[-4, 2, 2]}
        intensity={0.2}
        color="#ffaa44"
        distance={8}
        decay={2}
      />
      <pointLight
        position={[4, 2, 2]}
        intensity={0.2}
        color="#ffaa44"
        distance={8}
        decay={2}
      />
    </>
  );
}

export default function App() {
  const scriptOptions = useMemo(() => getScriptOptions(), []);
  const [selectedPath, setSelectedPath] = useState('');
  const [scriptData, setScriptData] = useState<ScriptData | null>(null);
  const [loadingScript, setLoadingScript] = useState(false);

  const selectScript = useCallback(async (path: string) => {
    setSelectedPath(path);
    setLoadingScript(true);
    const raw = (await scriptModules[path]()) as string;
    setScriptData(parseScript(raw));
    setLoadingScript(false);
  }, []);

  const loadDefaultScript = useCallback(async () => {
    if (scriptOptions.length === 0 || selectedPath) return;
    const first = scriptOptions[0].path;
    setSelectedPath(first);
    setLoadingScript(true);
    const raw = (await scriptModules[first]()) as string;
    setScriptData(parseScript(raw));
    setLoadingScript(false);
  }, [scriptOptions, selectedPath]);

  useEffect(() => {
    loadDefaultScript();
  }, [loadDefaultScript]);

  const {
    state,
    currentLine,
    currentLineIndex,
    progress,
    studentResponses,
    start,
    advance,
    submitStudentResponse,
    reset,
  } = useScriptEngine(scriptData);

  const { isListening, transcript, error, startListening, stopListening } =
    useSpeechRecognition();
  const { speak, stop: stopTTS, isPreloading, preloadAll } = useSpeechSynthesis();
  const { generateSentence, isGenerating } = useLLM();

  const [modifiedSentence, setModifiedSentence] = useState<string | null>(null);
  const [finalSentencia, setFinalSentencia] = useState<string | null>(null);
  const spokenLineRef = useRef(-1);
  const simulationStarted = useRef(false);
  const sentenceLineIndexRef = useRef(-1);

  const speakingRole: CharacterRole | null = currentLine?.role ?? null;

  const activeRoles = useMemo(() => {
    if (!scriptData) return [] as CharacterRole[];
    const roles = new Set<CharacterRole>();
    for (const line of scriptData.lines) {
      roles.add(line.role);
    }
    return Array.from(roles);
  }, [scriptData]);

  const nonStudentLines = useMemo(
    () =>
      scriptData
        ? scriptData.lines
            .filter((l) => !l.isStudentTurn && l.text)
            .map((l) => ({ text: l.text, role: l.role }))
        : [],
    [scriptData]
  );

  const studentArguments = useMemo(
    () => studentResponses.map((r) => r.text).filter(Boolean),
    [studentResponses]
  );

  // Detect sentence + trigger LLM generation
  useEffect(() => {
    if (
      state === 'PLAYING' &&
      currentLine &&
      !currentLine.isStudentTurn &&
      currentLine.text &&
      currentLineIndex !== spokenLineRef.current
    ) {
      if (currentLine.role === 'SENTENCIA_FINAL') {
        spokenLineRef.current = currentLineIndex;
        sentenceLineIndexRef.current = currentLineIndex;

        if (studentArguments.length > 0) {
          generateSentence(currentLine.text, studentArguments).then(
            (modified) => {
              if (modified && sentenceLineIndexRef.current === currentLineIndex) {
                setFinalSentencia(modified);
                setModifiedSentence(modified);
              }
            }
          );
        } else {
          setFinalSentencia(currentLine.text);
          window.speechSynthesis.cancel();
          speak(currentLine.text, 'PRESIDENTE', () => {
            advance();
          });
        }
        return;
      }

      // Normal flow: speak directly
      spokenLineRef.current = currentLineIndex;
      sentenceLineIndexRef.current = -1;
      setModifiedSentence(null);
      window.speechSynthesis.cancel();
      speak(currentLine.text, currentLine.role, () => {
        advance();
      });
    }
  }, [
    state,
    currentLine,
    currentLineIndex,
    advance,
    speak,
    studentArguments,
    generateSentence,
  ]);

  // Speak the modified sentence once it's ready
  useEffect(() => {
    if (
      modifiedSentence &&
      state === 'PLAYING' &&
      currentLineIndex === sentenceLineIndexRef.current
    ) {
      speak(modifiedSentence, 'PRESIDENTE', () => {
        setModifiedSentence(null);
        advance();
      });
    }
  }, [modifiedSentence, state, currentLineIndex, speak, advance]);

  useEffect(() => {
    if (state === 'STUDENT_TURN') {
      stopTTS();
    }
  }, [state, stopTTS]);

  const handleStartMic = useCallback(() => {
    startListening();
  }, [startListening]);

  const handleStopMic = useCallback(() => {
    const text = stopListening();
    if (text.trim()) {
      submitStudentResponse(text.trim());
    }
  }, [stopListening, submitStudentResponse]);

  const handleRestart = useCallback(() => {
    spokenLineRef.current = -1;
    sentenceLineIndexRef.current = -1;
    simulationStarted.current = false;
    setModifiedSentence(null);
    setFinalSentencia(null);
    stopTTS();
    reset();
  }, [reset, stopTTS]);

  const courtroomElement = (
    <Courtroom speakingRole={speakingRole} activeRoles={activeRoles} />
  );

  if (state === 'FINISHED') {
    return (
      <div className="relative w-full h-full">
        <Canvas camera={{ position: [0, 5, 8], fov: 50 }}>
          <SceneLights />
          {courtroomElement}
          <OrbitControls
            enablePan={false}
            minDistance={5}
            maxDistance={12}
            maxPolarAngle={Math.PI / 2.2}
            target={[0, 0.2, -2]}
          />
        </Canvas>
        <ResultsScreen
          responses={studentResponses}
          sentencia={finalSentencia}
          caso={scriptData?.metadata.caso ?? ''}
          onRestart={handleRestart}
        />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{ position: [0, 5, 8], fov: 50 }}
        shadows
        gl={{ toneMapping: 3, toneMappingExposure: 1.2 }}
      >
        <SceneLights />
        <Environment preset="night" />

        {courtroomElement}

        <OrbitControls
          enablePan={false}
          minDistance={5}
          maxDistance={12}
          maxPolarAngle={Math.PI / 2.2}
          target={[0, 0.2, -2]}
        />
      </Canvas>

      {isGenerating && <SentenceOverlay />}

      {(state === 'IDLE' || state === 'PLAYING' || state === 'STUDENT_TURN') && (
        <>
          {state === 'IDLE' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-40">
              <div className="text-center max-w-lg w-full px-4">
                <div className="text-5xl mb-4">&#9878;</div>
                <h1 className="text-3xl font-bold text-amber-400 mb-2">
                  Simulacion de Audiencia
                </h1>

                {scriptOptions.length > 1 && (
                  <div className="mb-4">
                    <label className="text-gray-400 text-sm block mb-1">
                      Selecciona un caso:
                    </label>
                    <select
                      value={selectedPath}
                      onChange={(e) => selectScript(e.target.value)}
                      className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      {scriptOptions.map((opt) => (
                        <option key={opt.path} value={opt.path}>
                          {opt.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {scriptData && (
                  <>
                    <p className="text-gray-400 mb-2">{scriptData.metadata.titulo}</p>
                    <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
                      {scriptData.metadata.caso}
                    </p>
                  </>
                )}

                {!scriptData && (
                  <p className="text-gray-500 text-sm mb-6">Cargando caso...</p>
                )}

                <button
                  onClick={async () => {
                    simulationStarted.current = true;
                    preloadAll(nonStudentLines);
                    start();
                  }}
                  disabled={isPreloading || loadingScript || !scriptData}
                  className="px-8 py-3 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded-xl text-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-wait"
                >
                  {loadingScript
                    ? 'Cargando guion...'
                    : isPreloading
                      ? 'Preparando audios...'
                      : 'Iniciar Audiencia'}
                </button>
                <p className="text-xs text-gray-600 mt-4 max-w-sm mx-auto">
                  Escucharas a los miembros del tribunal. Cuando sea tu turno, presiona
                  &quot;Hablar&quot; y expresa tus argumentos.
                </p>
              </div>
            </div>
          )}

          <HUD
            currentRole={speakingRole}
            currentText={currentLine?.text ?? ''}
            studentTranscript={transcript}
            isStudentTurn={state === 'STUDENT_TURN'}
            progress={progress}
            onStartMic={handleStartMic}
            onStopMic={handleStopMic}
            isListening={isListening}
            error={error}
            titulo={scriptData?.metadata.titulo ?? ''}
            caso={scriptData?.metadata.caso ?? ''}
          />

        </>
      )}
    </div>
  );
}
