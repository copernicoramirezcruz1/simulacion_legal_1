import { ROLE_COLORS, ROLE_LABELS } from '../types';
import type { CharacterRole } from '../types';

interface HUDProps {
  currentRole: CharacterRole | null;
  currentText: string;
  studentTranscript: string;
  isStudentTurn: boolean;
  progress: number;
  onStartMic: () => void;
  onStopMic: () => void;
  isListening: boolean;
  error: string | null;
  titulo: string;
  caso: string;
}

export function HUD({
  currentRole,
  currentText,
  studentTranscript,
  isStudentTurn,
  progress,
  onStartMic,
  onStopMic,
  isListening,
  error,
  titulo,
  caso,
}: HUDProps) {
  const roleColor = currentRole ? ROLE_COLORS[currentRole] : '#fff';
  const roleLabel = currentRole ? ROLE_LABELS[currentRole] : '';

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 bg-black/70 px-4 py-2 pointer-events-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-sm font-bold text-amber-400 uppercase tracking-wider">
              {titulo || 'Simulacion de Audiencia'}
            </h1>
            <p className="text-xs text-gray-400">{caso}</p>
          </div>
          <div className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
            {progress.toFixed(0)}%
          </div>
        </div>
        {/* Progress bar */}
        <div className="w-full h-1 bg-gray-800 mt-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 transition-all duration-300 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Error toast */}
      {error && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-900/90 text-red-200 px-4 py-2 rounded-lg text-sm pointer-events-auto">
          {error}
        </div>
      )}

      {/* Bottom subtitle / dialog area */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-auto">
        <div
          className="mx-4 mb-4 p-4 rounded-xl bg-black/80 backdrop-blur-sm border transition-colors duration-300"
          style={{ borderColor: roleColor }}
        >
          {/* Role indicator */}
          {currentRole && (
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: roleColor }}
              />
              <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: roleColor }}>
                {roleLabel}
              </span>
              {isStudentTurn && (
                <span className="text-xs bg-amber-600 text-black px-2 py-0.5 rounded-full font-bold animate-pulse">
                  TU TURNO
                </span>
              )}
            </div>
          )}

          {/* Dialog text */}
          {currentText && (
            <p className="text-white text-base leading-relaxed">{currentText}</p>
          )}

          {/* Student transcript */}
          {isStudentTurn && studentTranscript && (
            <div className="mt-2 p-3 rounded-lg bg-green-900/50 border border-green-700">
              <p className="text-green-200 text-sm italic">
                &ldquo;{studentTranscript}&rdquo;
              </p>
            </div>
          )}

          {/* Mic controls */}
          {isStudentTurn && (
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={isListening ? onStopMic : onStartMic}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all pointer-events-auto ${
                  isListening
                    ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                    : 'bg-amber-500 hover:bg-amber-600 text-black'
                }`}
              >
                {isListening ? '🛑 Detener' : '🎤 Hablar'}
              </button>
              {isListening && (
                <span className="text-xs text-gray-400">
                  Grabando tu intervencion...
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Skip button */}
      {!isStudentTurn && currentRole && (
        <div className="absolute bottom-4 right-4 pointer-events-auto">
          <button className="text-xs text-gray-500 hover:text-gray-300 bg-gray-800/80 px-3 py-1 rounded transition-colors">
            Saltar &rsaquo;
          </button>
        </div>
      )}
    </div>
  );
}
