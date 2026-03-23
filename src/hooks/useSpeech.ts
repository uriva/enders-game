"use client";

import { useRef, useState, useCallback, useEffect } from "react";

// ---- Types for Web Speech API (not in all TS libs) ----

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

// ---- Hook ----

interface UseSpeechOptions {
  /** Whether TTS is enabled (default true) */
  ttsEnabled?: boolean;
  /** TTS voice — tries to match a dark/serious tone */
  voiceName?: string;
  /** TTS rate (default 0.9 — slightly slow for drama) */
  rate?: number;
  /** TTS pitch (default 0.85 — slightly low) */
  pitch?: number;
  /** Language for STT (default "en-US") */
  lang?: string;
  /** Called with interim transcript while speaking */
  onInterimTranscript?: (text: string) => void;
  /** Called with final transcript when speech ends */
  onFinalTranscript?: (text: string) => void;
}

export function useSpeech(options: UseSpeechOptions = {}) {
  const {
    ttsEnabled = true,
    rate = 0.9,
    pitch = 0.85,
    lang = "en-US",
    onInterimTranscript,
    onFinalTranscript,
  } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [sttSupported, setSttSupported] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const lastSpokenRef = useRef<string>("");

  // Check browser support on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    setSttSupported(
      !!(window.SpeechRecognition || window.webkitSpeechRecognition)
    );
    setTtsSupported(!!window.speechSynthesis);
    synthRef.current = window.speechSynthesis ?? null;
  }, []);

  // ---- TTS ----

  /**
   * Speak text aloud. Cancels any in-progress speech first.
   * Skips if the text hasn't changed (dedupes streaming updates).
   */
  const speak = useCallback(
    (text: string) => {
      if (!ttsEnabled || !synthRef.current || !text) return;

      // Only speak new text
      if (text === lastSpokenRef.current) return;
      lastSpokenRef.current = text;

      // Cancel current speech
      synthRef.current.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.lang = lang;

      // Try to pick a good voice (English, not too bright)
      const voices = synthRef.current.getVoices();
      const preferred = voices.find(
        (v) =>
          v.lang.startsWith("en") &&
          (v.name.toLowerCase().includes("male") ||
            v.name.toLowerCase().includes("daniel") ||
            v.name.toLowerCase().includes("alex") ||
            v.name.toLowerCase().includes("james"))
      );
      if (preferred) utterance.voice = preferred;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      synthRef.current.speak(utterance);
    },
    [ttsEnabled, rate, pitch, lang]
  );

  /** Stop speaking */
  const stopSpeaking = useCallback(() => {
    synthRef.current?.cancel();
    setIsSpeaking(false);
  }, []);

  // ---- STT ----

  /** Start listening for speech */
  const startListening = useCallback(() => {
    if (!sttSupported || typeof window === "undefined") return;

    // Stop any TTS so the mic doesn't pick it up
    stopSpeaking();

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (interimTranscript) {
        onInterimTranscript?.(interimTranscript);
      }
      if (finalTranscript) {
        onFinalTranscript?.(finalTranscript);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [sttSupported, lang, stopSpeaking, onInterimTranscript, onFinalTranscript]);

  /** Stop listening */
  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  /** Toggle listening on/off */
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      synthRef.current?.cancel();
    };
  }, []);

  return {
    // TTS
    speak,
    stopSpeaking,
    isSpeaking,
    ttsSupported,
    // STT
    startListening,
    stopListening,
    toggleListening,
    isListening,
    sttSupported,
  };
}
