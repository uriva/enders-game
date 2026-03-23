"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSpeech } from "@/hooks/useSpeech";

interface DialogBoxProps {
  dialog: string;
  onAction: (action: string) => void;
  disabled: boolean;
  deathCount: number;
  scene: string;
  onFocusChange?: (focused: boolean) => void;
}

export default function DialogBox({
  dialog,
  onAction,
  disabled,
  deathCount,
  scene,
  onFocusChange,
}: DialogBoxProps) {
  const [input, setInput] = useState("");
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const handleFinalTranscript = useCallback(
    (text: string) => {
      if (disabled) return;
      // Auto-submit the spoken text
      onAction(text.trim());
    },
    [disabled, onAction]
  );

  const handleInterimTranscript = useCallback((text: string) => {
    setInput(text);
  }, []);

  const {
    speak,
    stopSpeaking,
    isSpeaking,
    ttsSupported,
    toggleListening,
    isListening,
    sttSupported,
  } = useSpeech({
    ttsEnabled,
    onFinalTranscript: handleFinalTranscript,
    onInterimTranscript: handleInterimTranscript,
  });

  // Auto-scroll dialog
  useEffect(() => {
    if (dialogRef.current) {
      dialogRef.current.scrollTop = dialogRef.current.scrollHeight;
    }
  }, [dialog]);

  // Speak new dialog when it arrives (only the final version, not partials)
  const lastSpokenDialog = useRef("");
  useEffect(() => {
    if (!dialog || !ttsEnabled || disabled) return;
    // Only speak when the dialog is "settled" — wait a brief moment
    // to avoid speaking every streaming partial
    const timeout = setTimeout(() => {
      if (dialog !== lastSpokenDialog.current && dialog.length > 20) {
        lastSpokenDialog.current = dialog;
        speak(dialog);
      }
    }, 1500);
    return () => clearTimeout(timeout);
  }, [dialog, ttsEnabled, disabled, speak]);

  // Clear input when listening ends (it was auto-submitted)
  useEffect(() => {
    if (!isListening) {
      // Small delay to let final transcript fire
      const t = setTimeout(() => setInput(""), 200);
      return () => clearTimeout(t);
    }
  }, [isListening]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || disabled) return;
    onAction(input.trim());
    setInput("");
    inputRef.current?.blur();
  };

  const handleFocus = () => {
    onFocusChange?.(true);
  };

  const handleBlur = () => {
    onFocusChange?.(false);
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
      <div className="max-w-2xl mx-auto p-4 space-y-3">
        {/* Dialog display */}
        {dialog && (
          <div
            ref={dialogRef}
            className="pointer-events-auto bg-black/80 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4 max-h-48 overflow-y-auto"
          >
            <p className="text-gray-200 font-serif text-lg leading-relaxed italic">
              {dialog}
            </p>
          </div>
        )}

        {/* Input row */}
        <form onSubmit={handleSubmit} className="pointer-events-auto">
          <div className="flex gap-2">
            {/* Mic button */}
            {sttSupported && (
              <button
                type="button"
                onClick={toggleListening}
                disabled={disabled}
                className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg border transition-colors ${
                  isListening
                    ? "bg-red-900/60 border-red-500/50 text-red-300 animate-pulse"
                    : "bg-black/80 border-gray-600/50 text-gray-500 hover:text-gray-300 hover:border-gray-400/50"
                } backdrop-blur-sm disabled:opacity-30`}
                title={isListening ? "Stop listening" : "Speak"}
              >
                {/* Microphone icon */}
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="w-4 h-4"
                >
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              </button>
            )}

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              disabled={disabled}
              placeholder={
                isListening
                  ? "Listening..."
                  : disabled
                    ? "..."
                    : "Speak..."
              }
              className="flex-1 bg-black/80 backdrop-blur-sm border border-gray-600/50 rounded-lg px-4 py-2.5 text-gray-200 font-mono text-base placeholder-gray-600 focus:outline-none focus:border-gray-400/50 disabled:opacity-50"
            />

            <button
              type="submit"
              disabled={disabled || !input.trim()}
              className="bg-gray-800/80 backdrop-blur-sm border border-gray-600/50 rounded-lg px-4 py-2.5 text-gray-400 font-mono text-sm hover:text-gray-200 hover:border-gray-400/50 transition-colors disabled:opacity-30"
            >
              act
            </button>
          </div>
        </form>

        {/* HUD */}
        <div className="pointer-events-none flex justify-between px-1 text-[10px] font-mono text-gray-600 uppercase tracking-widest">
          <span>{scene.replace("_", " ")}</span>
          <div className="flex gap-4 items-center">
            {deathCount > 0 && <span>deaths: {deathCount}</span>}
            {/* TTS toggle */}
            {ttsSupported && (
              <button
                onClick={() => {
                  setTtsEnabled(!ttsEnabled);
                  if (ttsEnabled) stopSpeaking();
                }}
                className="pointer-events-auto text-[10px] font-mono uppercase tracking-widest text-gray-600 hover:text-gray-400 transition-colors"
              >
                {ttsEnabled ? (
                  <span title="Mute narration">
                    {isSpeaking ? "narrating..." : "voice on"}
                  </span>
                ) : (
                  <span title="Enable narration">voice off</span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
