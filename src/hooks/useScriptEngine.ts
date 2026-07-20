import { useCallback, useState } from 'react';
import type { ScriptData, SimulationState } from '../types';

interface StudentResponse {
  lineIndex: number;
  text: string;
}

interface UseScriptEngineReturn {
  state: SimulationState;
  currentLineIndex: number;
  currentLine: ScriptData['lines'][number] | null;
  progress: number;
  studentResponses: StudentResponse[];
  start: () => void;
  advance: () => void;
  submitStudentResponse: (text: string) => void;
  reset: () => void;
}

export function useScriptEngine(scriptData: ScriptData | null): UseScriptEngineReturn {
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [state, setState] = useState<SimulationState>('IDLE');
  const [studentResponses, setStudentResponses] = useState<StudentResponse[]>([]);

  const lines = scriptData?.lines ?? [];
  const currentLine = lines[currentLineIndex] ?? null;
  const progress = lines.length > 0 ? (currentLineIndex / lines.length) * 100 : 0;

  const syncState = useCallback((index: number) => {
    if (!scriptData) return;
    if (index >= scriptData.lines.length) {
      setState('FINISHED');
      return;
    }
    const line = scriptData.lines[index];
    if (line.isStudentTurn) {
      setState('STUDENT_TURN');
    } else {
      setState('PLAYING');
    }
  }, [scriptData]);

  const start = useCallback(() => {
    if (!scriptData || scriptData.lines.length === 0) return;
    setCurrentLineIndex(0);
    syncState(0);
  }, [scriptData, syncState]);

  const advance = useCallback(() => {
    setCurrentLineIndex((prev) => {
      const next = prev + 1;
      syncState(next);
      return next;
    });
  }, [syncState]);

  const submitStudentResponse = useCallback((text: string) => {
    setStudentResponses((prev) => [...prev, { lineIndex: currentLineIndex, text }]);
    advance();
  }, [currentLineIndex, advance]);

  const reset = useCallback(() => {
    setCurrentLineIndex(0);
    setStudentResponses([]);
    setState('IDLE');
  }, []);

  return {
    state,
    currentLineIndex,
    currentLine,
    progress,
    studentResponses,
    start,
    advance,
    submitStudentResponse,
    reset,
  };
}
