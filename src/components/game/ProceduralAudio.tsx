"use client";

import { useEffect, useRef } from "react";

export interface ProceduralAudioProps {
  mood?: "ominous" | "ethereal" | "tense" | "triumphant" | "silence";
  volume?: number;
}

export default function ProceduralAudio({ mood = "silence", volume = 0.2 }: ProceduralAudioProps) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const intervalsRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    if (mood === "silence") return;

    // Clear old timeouts/intervals if any
    timeoutsRef.current.forEach(clearTimeout);
    intervalsRef.current.forEach(clearInterval);
    timeoutsRef.current = [];
    intervalsRef.current = [];

    const initAudio = () => {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;

        const ctx = new AudioContextClass();
        audioCtxRef.current = ctx;

        const masterGain = ctx.createGain();
        masterGain.connect(ctx.destination);
        masterGain.gain.value = 0;
        
        // Reverb effect (simple convolution)
        const convolver = ctx.createConvolver();
        const reverbTime = 3;
        const sampleRate = ctx.sampleRate;
        const length = sampleRate * reverbTime;
        const impulse = ctx.createBuffer(2, length, sampleRate);
        const left = impulse.getChannelData(0);
        const right = impulse.getChannelData(1);
        for (let i = 0; i < length; i++) {
          const decay = Math.exp(-i / (sampleRate * (reverbTime / 3)));
          left[i] = (Math.random() * 2 - 1) * decay;
          right[i] = (Math.random() * 2 - 1) * decay;
        }
        convolver.buffer = impulse;
        
        // Dry/Wet mix for reverb
        const dryGain = ctx.createGain();
        const wetGain = ctx.createGain();
        dryGain.connect(masterGain);
        wetGain.connect(convolver);
        convolver.connect(masterGain);
        
        dryGain.gain.value = 0.6;
        wetGain.gain.value = 0.4;

        // Base Drone
        const createDrone = (freq1: number, freq2: number, type: OscillatorType, filterFreq: number) => {
          const droneGain = ctx.createGain();
          droneGain.gain.value = 0.3; // keep drone quiet
          
          const filter = ctx.createBiquadFilter();
          filter.type = "lowpass";
          filter.frequency.value = filterFreq;
          
          // LFO for filter sweep
          const lfo = ctx.createOscillator();
          lfo.type = "sine";
          lfo.frequency.value = 0.1; // Very slow sweep
          const lfoGain = ctx.createGain();
          lfoGain.gain.value = filterFreq * 0.5;
          lfo.connect(lfoGain);
          lfoGain.connect(filter.frequency);
          lfo.start();
          
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          osc1.type = type;
          osc2.type = type;
          osc1.frequency.value = freq1;
          osc2.frequency.value = freq2;
          
          osc1.connect(filter);
          osc2.connect(filter);
          filter.connect(droneGain);
          droneGain.connect(dryGain);
          droneGain.connect(wetGain);
          
          osc1.start();
          osc2.start();
          
          return { osc1, osc2, lfo };
        };

        // Melody / Chime generator
        const playNote = (freq: number, type: OscillatorType, time: number, dur: number, vol = 0.5) => {
          if (ctx.state === "closed") return;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = type;
          osc.frequency.value = freq;
          
          osc.connect(gain);
          gain.connect(dryGain);
          gain.connect(wetGain); // send to reverb
          
          // Envelope
          gain.gain.setValueAtTime(0, time);
          gain.gain.linearRampToValueAtTime(vol, time + dur * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
          
          osc.start(time);
          osc.stop(time + dur);
        };

        const playRandomMelody = (notes: number[], type: OscillatorType, minDelay: number, maxDelay: number) => {
          const nextNote = () => {
            if (ctx.state === "closed") return;
            const note = notes[Math.floor(Math.random() * notes.length)];
            // Random octave
            const octave = Math.random() > 0.7 ? 2 : 1; 
            playNote(note * octave, type, ctx.currentTime, 3, 0.4);
            
            const delay = minDelay + Math.random() * (maxDelay - minDelay);
            const timeout = setTimeout(nextNote, delay * 1000);
            timeoutsRef.current.push(timeout);
          };
          nextNote();
        };

        // Setup based on mood
        if (mood === "ominous") {
          createDrone(55, 55.5, "sawtooth", 300); // Low A
          // Occasional low thumps / dissonant bells
          const notes = [110, 116.54, 130.81, 164.81]; // A2, Bb2, C3, E3
          playRandomMelody(notes, "sine", 4, 10);
        } else if (mood === "ethereal") {
          createDrone(220, 222, "sine", 800); // A3
          // Pentatonic scale
          const notes = [220, 246.94, 277.18, 329.63, 369.99]; // A3, B3, C#4, E4, F#4
          playRandomMelody(notes, "triangle", 3, 7);
        } else if (mood === "tense") {
          createDrone(65.41, 69.30, "square", 500); // C2, C#2 dissonance
          // Fast, erratic minor notes
          const notes = [261.63, 277.18, 311.13, 369.99]; // C4, C#4, Eb4, F#4
          playRandomMelody(notes, "sawtooth", 1, 4);
        } else if (mood === "triumphant") {
          createDrone(130.81, 196.00, "triangle", 1200); // C3, G3 (perfect fifth)
          // Major arpeggios
          const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
          playRandomMelody(notes, "sine", 2, 5);
        } else {
          createDrone(110, 110.5, "sine", 1000);
        }

        // Fade in master volume
        masterGain.gain.setTargetAtTime(volume, ctx.currentTime, 2);

      } catch (err) {
        console.warn("AudioContext failed to start:", err);
      }
    };

    initAudio();

    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      intervalsRef.current.forEach(clearInterval);
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(console.error);
        audioCtxRef.current = null;
      }
    };
  }, [mood, volume]);

  return null;
}
