import { useCallback, useRef, useState } from 'react';
import type { CharacterRole } from '../types';

interface UseSpeechSynthesisReturn {
  speak: (text: string, role: CharacterRole, onEnd?: () => void) => void;
  stop: () => void;
  isSpeaking: boolean;
}

const TTS_URL = 'http://localhost:5050/tts';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

export function useSpeechSynthesis(): UseSpeechSynthesisReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const currentSource = useRef<AudioBufferSourceNode | null>(null);
  const onEndRef = useRef<(() => void) | null>(null);

  const stop = useCallback(() => {
    if (currentSource.current) {
      try {
        currentSource.current.stop();
      } catch (_) {}
      currentSource.current = null;
    }
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(
    async (text: string, role: CharacterRole, onEnd?: () => void) => {
      stop();
      onEndRef.current = onEnd || null;

      try {
        const response = await fetch(TTS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, role }),
        });

        if (!response.ok) {
          console.error(`TTS server error: ${response.status}`);
          onEndRef.current?.();
          return;
        }

        const arrayBuffer = await response.arrayBuffer();
        const ctx = getAudioContext();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        currentSource.current = source;

        setIsSpeaking(true);

        source.onended = () => {
          currentSource.current = null;
          setIsSpeaking(false);
          onEndRef.current?.();
        };

        source.start();
      } catch (err) {
        console.error('TTS error:', err);
        setIsSpeaking(false);
        onEndRef.current?.();
      }
    },
    [stop]
  );

  return { speak, stop, isSpeaking };
}
