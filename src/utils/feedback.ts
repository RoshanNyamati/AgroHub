import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Triggers short tactile haptic feedback on supported mobile devices.
 */
export function triggerHaptic(durationMs: number | number[] = 14): void {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(durationMs);
    } catch {
      // Ignore unsupported environments
    }
  }
}

export function formatRupees(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  return `₹${safe.toLocaleString('en-IN')}`;
}

export function formatShortTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  });
}

export function formatClockOnly(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  });
}

export function toDatetimeLocalValue(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '2026-11-18T09:00';
  return date.toISOString().slice(0, 16);
}

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

/**
 * Voice-to-text hook supporting Web Speech API with a deterministic guided-phrase fallback
 * when hardware microphone permissions or browser speech engines are unavailable.
 */
export function useVoiceInput(
  onTranscript: (text: string) => void,
  fallbackSamples: string[]
) {
  const [listening, setListening] = useState(false);
  const [voiceHint, setVoiceHint] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const sampleIdxRef = useRef(0);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const startVoiceCapture = useCallback(() => {
    triggerHaptic(18);
    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionInstance;
      webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
    };
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRec) {
      const sample =
        fallbackSamples[sampleIdxRef.current % fallbackSamples.length] ||
        'North Terrace Tractor';
      sampleIdxRef.current += 1;
      setListening(true);
      setVoiceHint(`Voice prompt filled: "${sample}"`);
      onTranscript(sample);
      setTimeout(() => {
        setListening(false);
      }, 650);
      setTimeout(() => {
        setVoiceHint(null);
      }, 3200);
      return;
    }

    try {
      const rec = new SpeechRec();
      recognitionRef.current = rec;
      rec.lang = 'en-US';
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      setListening(true);
      setVoiceHint('Listening for voice input…');

      rec.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript?.trim();
        if (transcript) {
          onTranscript(transcript);
          setVoiceHint(`Captured: "${transcript}"`);
        }
        setListening(false);
        setTimeout(() => setVoiceHint(null), 2600);
      };

      rec.onerror = () => {
        const sample =
          fallbackSamples[sampleIdxRef.current % fallbackSamples.length] || '';
        sampleIdxRef.current += 1;
        if (sample) {
          onTranscript(sample);
          setVoiceHint(`Mic unavailable — filled sample: "${sample}"`);
        }
        setListening(false);
        setTimeout(() => setVoiceHint(null), 3000);
      };

      rec.onend = () => {
        setListening(false);
      };

      rec.start();
    } catch {
      setListening(false);
    }
  }, [fallbackSamples, onTranscript]);

  return { listening, voiceHint, startVoiceCapture };
}
