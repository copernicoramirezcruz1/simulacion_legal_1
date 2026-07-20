import { useState } from 'react';
import type { StudentResponse } from '../hooks/useScriptEngine';

interface ResultsScreenProps {
  responses: StudentResponse[];
  caso: string;
  onRestart: () => void;
}

export function ResultsScreen({ responses, caso, onRestart }: ResultsScreenProps) {
  const [showTranscripts, setShowTranscripts] = useState(false);

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-50">
      <div className="max-w-2xl w-full mx-4 bg-gray-900 rounded-2xl border border-gray-700 p-8 max-h-[80vh] overflow-y-auto">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">&#9878;</div>
          <h2 className="text-2xl font-bold text-amber-400">Audiencia Finalizada</h2>
          <p className="text-gray-400 text-sm mt-1">{caso}</p>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3">
            <span className="text-gray-300">Intervenciones de la parte accionante</span>
            <span className="text-amber-400 font-bold">{responses.length}</span>
          </div>
          {responses.map((r, i) => (
            <div key={i} className="bg-gray-800/50 rounded-lg px-4 py-3">
              <span className="text-xs text-gray-500">Intervencion {i + 1}</span>
              <p className="text-gray-200 mt-1 italic">&ldquo;{r.text}&rdquo;</p>
            </div>
          ))}
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => setShowTranscripts(!showTranscripts)}
            className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm transition-colors"
          >
            {showTranscripts ? 'Ocultar' : 'Mostrar'} transcripciones
          </button>
          <button
            onClick={onRestart}
            className="px-6 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-black font-bold transition-colors"
          >
            Nueva Audiencia
          </button>
        </div>
      </div>
    </div>
  );
}
