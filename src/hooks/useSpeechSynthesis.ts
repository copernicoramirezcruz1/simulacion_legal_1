import { useCallback, useRef, useState } from 'react';
import type { CharacterRole } from '../types';

interface UseSpeechSynthesisReturn {
  speak: (text: string, role: CharacterRole, onEnd?: () => void) => void;
  stop: () => void;
  isSpeaking: boolean;
  isPreloading: boolean;
  preloadAll: (lines: { text: string; role: CharacterRole }[]) => void;
}

const TTS_URL = 'http://localhost:5050/tts';
const CHUNK_SIZE = 400;

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

function splitText(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];

  const chunks: string[] = [];
  const sentences = text.match(/[^.!?\n]+[.!?\n]?/g) || [text];

  let current = '';

  for (const sentence of sentences) {
    if (current.length + sentence.length > maxLen && current.length > 0) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += sentence;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks.length > 0 ? chunks : [text];
}

function cacheKey(text: string, role: CharacterRole): string {
  return `${role}:${text}`;
}

export function useSpeechSynthesis(): UseSpeechSynthesisReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPreloading, setIsPreloading] = useState(false);
  const currentSource = useRef<AudioBufferSourceNode | null>(null);
  const preloadedBuffers = useRef<Map<string, AudioBuffer>>(new Map());
  const stopRequested = useRef(false);

  const stop = useCallback(() => {
    if (currentSource.current) {
      try { currentSource.current.stop(); } catch (_) {}
      currentSource.current = null;
    }
    stopRequested.current = true;
    setIsSpeaking(false);
  }, []);

  const playBuffer = useCallback((buffer: AudioBuffer): Promise<void> => {
    if (stopRequested.current) return Promise.resolve();

    if (currentSource.current) {
      try { currentSource.current.stop(); } catch (_) {}
      currentSource.current = null;
    }

    stopRequested.current = false;

    return new Promise<void>((resolve) => {
      const ctx = getAudioContext();
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      currentSource.current = source;
      setIsSpeaking(true);

      source.onended = () => {
        currentSource.current = null;
        setIsSpeaking(false);
        resolve();
      };
      source.start();
    });
  }, []);

  const fetchAndDecode = useCallback(async (text: string, role: CharacterRole): Promise<AudioBuffer> => {
    const response = await fetch(TTS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, role }),
    });
    if (!response.ok) throw new Error(`TTS server error: ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    const ctx = getAudioContext();
    return ctx.decodeAudioData(arrayBuffer);
  }, []);

  const playChunk = useCallback(
    async (text: string, role: CharacterRole): Promise<void> => {
      const key = cacheKey(text, role);
      let buffer = preloadedBuffers.current.get(key);

      if (!buffer) {
        buffer = await fetchAndDecode(text, role);
        preloadedBuffers.current.set(key, buffer);
      }

      await playBuffer(buffer);
    },
    [playBuffer, fetchAndDecode]
  );

  const speak = useCallback(
    async (text: string, role: CharacterRole, onEnd?: () => void) => {
      stop();
      stopRequested.current = false;

      const chunks = splitText(text, CHUNK_SIZE);

      try {
        for (let i = 0; i < chunks.length; i++) {
          if (stopRequested.current) break;
          await playChunk(chunks[i], role);
          if (stopRequested.current) break;
          if (i < chunks.length - 1) {
            await new Promise((r) => setTimeout(r, 500));
          }
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        console.warn('TTS error:', (err as Error)?.message || err);
      }

      if (!stopRequested.current) {
        onEnd?.();
      }
    },
    [playChunk, stop]
  );

  const preloadAll = useCallback((lines: { text: string; role: CharacterRole }[]) => {
    setIsPreloading(true);
    const allChunks: { text: string; role: CharacterRole }[] = [];

    for (const line of lines) {
      const chunks = splitText(line.text, CHUNK_SIZE);
      for (const chunk of chunks) {
        allChunks.push({ text: chunk, role: line.role });
      }
    }

    let i = 0;
    const next = () => {
      if (i >= allChunks.length) {
        setIsPreloading(false);
        return;
      }
      const item = allChunks[i];
      const key = cacheKey(item.text, item.role);
      i++;

      if (preloadedBuffers.current.has(key)) {
        next();
        return;
      }

      fetchAndDecode(item.text, item.role)
        .then((buffer) => {
          preloadedBuffers.current.set(key, buffer);
        })
        .catch(() => {})
        .finally(() => next());
    };
    next();
  }, [fetchAndDecode]);

  return { speak, stop, isSpeaking, isPreloading, preloadAll };
}
