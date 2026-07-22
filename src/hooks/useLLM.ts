import { useCallback, useRef, useState } from 'react';

interface UseLLMReturn {
  generateSentence: (sentenciaBase: string, argumentos: string[]) => Promise<string>;
  isGenerating: boolean;
  error: string | null;
}

const LLM_URL = 'http://localhost:5051/sentencia';

export function useLLM(): UseLLMReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const generateSentence = useCallback(
    async (sentenciaBase: string, argumentos: string[]): Promise<string> => {
      setIsGenerating(true);
      setError(null);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch(LLM_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sentenciaBase, argumentos }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const msg = (errData as any)?.error || `Error ${response.status}`;
          throw new Error(msg);
        }

        const data = await response.json();
        const sentencia = data.sentencia || '';
        setIsGenerating(false);
        return sentencia;
      } catch (err: any) {
        if (err?.name === 'AbortError') return '';
        const msg = (err as Error)?.message || 'Error desconocido';
        setError(msg);
        setIsGenerating(false);
        return '';
      }
    },
    []
  );

  return { generateSentence, isGenerating, error };
}
