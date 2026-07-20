import { useEffect, useRef, useCallback, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { Courtroom } from './components/Courtroom';
import { HUD } from './components/HUD';
import { ResultsScreen } from './components/ResultsScreen';
import { useScriptEngine } from './hooks/useScriptEngine';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis';
import { parseScript } from './utils/parseScript';
import type { CharacterRole } from './types';
import sampleScriptRaw from './data/sample-script.txt?raw';

const scriptData = parseScript(sampleScriptRaw);

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
  const { speak, stop: stopTTS, isSpeaking } = useSpeechSynthesis();

  const spokenLineRef = useRef(-1);
  const simulationStarted = useRef(false);

  const speakingRole: CharacterRole | null = currentLine?.role ?? null;

  const activeRoles = useMemo(() => {
    const roles = new Set<CharacterRole>();
    for (const line of scriptData.lines) {
      roles.add(line.role);
    }
    return Array.from(roles);
  }, [scriptData.lines]);

  useEffect(() => {
    if (
      state === 'PLAYING' &&
      currentLine &&
      !currentLine.isStudentTurn &&
      currentLine.text &&
      currentLineIndex !== spokenLineRef.current
    ) {
      spokenLineRef.current = currentLineIndex;
      window.speechSynthesis.cancel();
      speak(currentLine.text, currentLine.role, () => {
        advance();
      });
    }
  }, [state, currentLine, currentLineIndex, advance, speak]);

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

  const handleSkip = useCallback(() => {
    if (!isSpeaking && state === 'PLAYING' && currentLine && !currentLine.isStudentTurn) {
      stopTTS();
      advance();
    }
  }, [isSpeaking, state, currentLine, stopTTS, advance]);

  const handleRestart = useCallback(() => {
    spokenLineRef.current = -1;
    simulationStarted.current = false;
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
          caso={scriptData.metadata.caso}
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

      {(state === 'IDLE' || state === 'PLAYING' || state === 'STUDENT_TURN') && (
        <>
          {state === 'IDLE' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-40">
              <div className="text-center">
                <div className="text-5xl mb-4">&#9878;</div>
                <h1 className="text-3xl font-bold text-amber-400 mb-2">
                  Simulacion de Audiencia
                </h1>
                <p className="text-gray-400 mb-2">{scriptData.metadata.titulo}</p>
                <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
                  {scriptData.metadata.caso}
                </p>
                <button
                  onClick={() => {
                    simulationStarted.current = true;
                    start();
                  }}
                  className="px-8 py-3 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded-xl text-lg transition-all hover:scale-105"
                >
                  Iniciar Audiencia
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
            titulo={scriptData.metadata.titulo}
            caso={scriptData.metadata.caso}
          />

          {state === 'PLAYING' && currentLine && !currentLine.isStudentTurn && (
            <button
              onClick={handleSkip}
              className="absolute bottom-20 right-4 z-30 text-xs text-gray-500 hover:text-gray-300 bg-gray-800/80 px-3 py-1 rounded transition-colors pointer-events-auto"
            >
              Saltar &rsaquo;
            </button>
          )}
        </>
      )}
    </div>
  );
}
