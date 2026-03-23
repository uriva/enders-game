"use client";

import { useEffect, useRef } from "react";

export interface ProceduralAudioProps {
  mood?: "ominous" | "ethereal" | "tense" | "triumphant" | "silence";
  volume?: number;
}

export default function ProceduralAudio({ mood = "silence", volume = 0.2 }: ProceduralAudioProps) {
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (mood === "silence") return;

    // Use a small timeout to ensure user interaction has happened (Next.js client-side mount)
    const initAudio = () => {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;

        const ctx = new AudioContextClass();
        audioCtxRef.current = ctx;

        const gainNode = ctx.createGain();
        gainNode.connect(ctx.destination);
        gainNode.gain.value = 0; // start at 0 for fade in

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        
        // Add a lowpass filter for ambiance
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 1000;
        
        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gainNode);

        if (mood === "ominous") {
          osc1.type = "sawtooth";
          osc1.frequency.value = 55; // low A
          osc2.type = "sine";
          osc2.frequency.value = 55.5; // slight detune
          filter.frequency.value = 400; // muffled
        } else if (mood === "ethereal") {
          osc1.type = "sine";
          osc1.frequency.value = 220; // A3
          osc2.type = "triangle";
          osc2.frequency.value = 330; // E4 (perfect fifth)
          filter.frequency.value = 1200;
        } else if (mood === "tense") {
          osc1.type = "square";
          osc1.frequency.value = 65.41; // C2
          osc2.type = "square";
          osc2.frequency.value = 69.30; // C#2 (dissonant minor second)
          filter.frequency.value = 800;
        } else if (mood === "triumphant") {
          osc1.type = "triangle";
          osc1.frequency.value = 261.63; // C4
          osc2.type = "triangle";
          osc2.frequency.value = 329.63; // E4 (major third)
          filter.frequency.value = 2000;
        } else {
          osc1.type = "sine";
          osc1.frequency.value = 110;
          osc2.type = "sine";
          osc2.frequency.value = 110.5;
        }

        osc1.start();
        osc2.start();

        // Fade in
        gainNode.gain.setTargetAtTime(volume, ctx.currentTime, 2);
      } catch (err) {
        console.warn("AudioContext failed to start (likely needs user interaction):", err);
      }
    };

    // Initialize audio
    initAudio();

    return () => {
      if (audioCtxRef.current) {
        const ctx = audioCtxRef.current;
        // Since we can't easily retrieve the gain node without keeping a ref, 
        // we'll just close the context gracefully
        ctx.close().catch(console.error);
        audioCtxRef.current = null;
      }
    };
  }, [mood, volume]);

  return null;
}
