'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { RealtimeState } from '@/lib/ai-builder/voice/OpenAIRealtimeClient';

interface VoiceOrbProps {
  state: RealtimeState;
  audioLevel: number;
  className?: string;
}

// State configurations for colors and animation
const stateConfigs = {
  disconnected: {
    blobOpacity: 0.4,
    barOpacity: 0.5,
    animationSpeed: 0.3,
    pulseIntensity: 0.2,
  },
  connecting: {
    blobOpacity: 0.6,
    barOpacity: 0.7,
    animationSpeed: 1.0,
    pulseIntensity: 0.5,
  },
  connected: {
    blobOpacity: 0.7,
    barOpacity: 0.8,
    animationSpeed: 0.4,
    pulseIntensity: 0.3,
  },
  listening: {
    blobOpacity: 0.8,
    barOpacity: 0.9,
    animationSpeed: 0.5,
    pulseIntensity: 0.4,
  },
  thinking: {
    blobOpacity: 0.85,
    barOpacity: 0.9,
    animationSpeed: 0.8,
    pulseIntensity: 0.6,
  },
  speaking: {
    blobOpacity: 1.0,
    barOpacity: 1.0,
    animationSpeed: 0.6,
    pulseIntensity: 0.7,
  },
  error: {
    blobOpacity: 0.6,
    barOpacity: 0.7,
    animationSpeed: 0.4,
    pulseIntensity: 0.3,
  },
};

export default function VoiceOrb({ state, audioLevel, className }: VoiceOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const smoothAudioRef = useRef<number>(0);
  const barHeightsRef = useRef<number[]>(new Array(11).fill(0));
  const currentConfigRef = useRef({ ...stateConfigs.disconnected });
  const targetConfigRef = useRef({ ...stateConfigs.disconnected });

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  const draw = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const time = timeRef.current;

    // Smooth audio level
    smoothAudioRef.current = lerp(smoothAudioRef.current, audioLevel, 0.15);
    const smoothAudio = smoothAudioRef.current;

    // Smooth config transitions
    const configSpeed = 0.05;
    const curr = currentConfigRef.current;
    const target = targetConfigRef.current;
    curr.blobOpacity = lerp(curr.blobOpacity, target.blobOpacity, configSpeed);
    curr.barOpacity = lerp(curr.barOpacity, target.barOpacity, configSpeed);
    curr.animationSpeed = lerp(curr.animationSpeed, target.animationSpeed, configSpeed);
    curr.pulseIntensity = lerp(curr.pulseIntensity, target.pulseIntensity, configSpeed);

    const config = curr;
    const cx = width / 2;
    const cy = height / 2;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // ===== DRAW GRADIENT BLOBS =====
    // Scale factor based on canvas size
    const scale = Math.min(width, height) / 256;
    const blobRadius = Math.max(width, height) * 0.25;
    const blobOpacity = config.blobOpacity;

    // Blob movement based on time (scaled)
    const blobMove1 = Math.sin(time * 0.4) * 20 * scale;
    const blobMove2 = Math.cos(time * 0.35) * 18 * scale;
    const blobMove3 = Math.sin(time * 0.45 + 1) * 15 * scale;

    // Offset multiplier for blob positions (scaled)
    const offsetScale = Math.min(width, height) * 0.15;

    // Orange/warm blob (top-left area)
    const orangeGrad = ctx.createRadialGradient(
      cx - offsetScale * 1.0 + blobMove1, cy - offsetScale * 0.8 + blobMove2, 0,
      cx - offsetScale * 1.0 + blobMove1, cy - offsetScale * 0.8 + blobMove2, blobRadius * 0.9
    );
    orangeGrad.addColorStop(0, `rgba(255, 160, 80, ${0.7 * blobOpacity})`);
    orangeGrad.addColorStop(0.4, `rgba(255, 120, 80, ${0.4 * blobOpacity})`);
    orangeGrad.addColorStop(1, 'rgba(255, 100, 60, 0)');
    ctx.fillStyle = orangeGrad;
    ctx.beginPath();
    ctx.arc(cx - offsetScale * 1.0 + blobMove1, cy - offsetScale * 0.8 + blobMove2, blobRadius * 0.9, 0, Math.PI * 2);
    ctx.fill();

    // Pink/magenta blob (left area)
    const pinkGrad = ctx.createRadialGradient(
      cx - offsetScale * 1.2 + blobMove2, cy + offsetScale * 0.5 - blobMove1, 0,
      cx - offsetScale * 1.2 + blobMove2, cy + offsetScale * 0.5 - blobMove1, blobRadius * 0.85
    );
    pinkGrad.addColorStop(0, `rgba(255, 100, 180, ${0.6 * blobOpacity})`);
    pinkGrad.addColorStop(0.5, `rgba(200, 80, 180, ${0.35 * blobOpacity})`);
    pinkGrad.addColorStop(1, 'rgba(180, 60, 160, 0)');
    ctx.fillStyle = pinkGrad;
    ctx.beginPath();
    ctx.arc(cx - offsetScale * 1.2 + blobMove2, cy + offsetScale * 0.5 - blobMove1, blobRadius * 0.85, 0, Math.PI * 2);
    ctx.fill();

    // Purple blob (center-bottom)
    const purpleGrad = ctx.createRadialGradient(
      cx - offsetScale * 0.2 - blobMove3, cy + offsetScale * 0.8 + blobMove2, 0,
      cx - offsetScale * 0.2 - blobMove3, cy + offsetScale * 0.8 + blobMove2, blobRadius * 0.95
    );
    purpleGrad.addColorStop(0, `rgba(140, 80, 220, ${0.55 * blobOpacity})`);
    purpleGrad.addColorStop(0.5, `rgba(100, 60, 200, ${0.3 * blobOpacity})`);
    purpleGrad.addColorStop(1, 'rgba(80, 40, 180, 0)');
    ctx.fillStyle = purpleGrad;
    ctx.beginPath();
    ctx.arc(cx - offsetScale * 0.2 - blobMove3, cy + offsetScale * 0.8 + blobMove2, blobRadius * 0.95, 0, Math.PI * 2);
    ctx.fill();

    // Blue blob (center-right)
    const blueGrad = ctx.createRadialGradient(
      cx + offsetScale * 0.8 + blobMove1, cy + offsetScale * 0.3 - blobMove3, 0,
      cx + offsetScale * 0.8 + blobMove1, cy + offsetScale * 0.3 - blobMove3, blobRadius
    );
    blueGrad.addColorStop(0, `rgba(80, 120, 255, ${0.6 * blobOpacity})`);
    blueGrad.addColorStop(0.5, `rgba(60, 100, 220, ${0.35 * blobOpacity})`);
    blueGrad.addColorStop(1, 'rgba(40, 80, 200, 0)');
    ctx.fillStyle = blueGrad;
    ctx.beginPath();
    ctx.arc(cx + offsetScale * 0.8 + blobMove1, cy + offsetScale * 0.3 - blobMove3, blobRadius, 0, Math.PI * 2);
    ctx.fill();

    // Teal/cyan blob (top-right)
    const tealGrad = ctx.createRadialGradient(
      cx + offsetScale * 1.2 - blobMove2, cy - offsetScale * 0.6 + blobMove3, 0,
      cx + offsetScale * 1.2 - blobMove2, cy - offsetScale * 0.6 + blobMove3, blobRadius * 0.85
    );
    tealGrad.addColorStop(0, `rgba(60, 200, 180, ${0.55 * blobOpacity})`);
    tealGrad.addColorStop(0.5, `rgba(40, 180, 160, ${0.3 * blobOpacity})`);
    tealGrad.addColorStop(1, 'rgba(30, 160, 140, 0)');
    ctx.fillStyle = tealGrad;
    ctx.beginPath();
    ctx.arc(cx + offsetScale * 1.2 - blobMove2, cy - offsetScale * 0.6 + blobMove3, blobRadius * 0.85, 0, Math.PI * 2);
    ctx.fill();

    // Green blob (top area)
    const greenGrad = ctx.createRadialGradient(
      cx + offsetScale * 0.5 + blobMove3, cy - offsetScale * 1.1 - blobMove1, 0,
      cx + offsetScale * 0.5 + blobMove3, cy - offsetScale * 1.1 - blobMove1, blobRadius * 0.8
    );
    greenGrad.addColorStop(0, `rgba(80, 200, 120, ${0.5 * blobOpacity})`);
    greenGrad.addColorStop(0.5, `rgba(60, 180, 100, ${0.25 * blobOpacity})`);
    greenGrad.addColorStop(1, 'rgba(40, 160, 80, 0)');
    ctx.fillStyle = greenGrad;
    ctx.beginPath();
    ctx.arc(cx + offsetScale * 0.5 + blobMove3, cy - offsetScale * 1.1 - blobMove1, blobRadius * 0.8, 0, Math.PI * 2);
    ctx.fill();

    // ===== DRAW AUDIO BARS =====
    const numBars = 11;
    const barWidth = Math.max(3, 4 * scale);
    const barGap = Math.max(4, 6 * scale);
    const totalBarsWidth = numBars * barWidth + (numBars - 1) * barGap;
    const startX = cx - totalBarsWidth / 2;
    const maxBarHeight = Math.max(30, 50 * scale);
    const minBarHeight = Math.max(6, 8 * scale);

    // Bar height pattern (middle bars taller)
    const basePattern = [0.3, 0.5, 0.4, 0.7, 0.6, 1.0, 0.6, 0.7, 0.4, 0.5, 0.3];

    for (let i = 0; i < numBars; i++) {
      // Calculate target height based on audio and pattern
      const patternHeight = basePattern[i];
      const audioInfluence = state === 'speaking' || state === 'listening' ? smoothAudio : smoothAudio * 0.3;
      const pulseOffset = Math.sin(time * 3 + i * 0.5) * config.pulseIntensity * 0.3;

      let targetHeight = minBarHeight + (maxBarHeight - minBarHeight) * patternHeight * (0.4 + audioInfluence * 0.8 + pulseOffset);

      // Add some randomness for more organic feel (scaled)
      if (state === 'speaking') {
        targetHeight += Math.sin(time * 5 + i * 1.2) * 8 * scale * smoothAudio;
      } else if (state === 'thinking') {
        targetHeight = minBarHeight + (maxBarHeight - minBarHeight) * 0.5 * (0.5 + Math.sin(time * 2 + i * 0.8) * 0.5);
      } else if (state === 'connecting') {
        const wave = Math.sin(time * 4 - i * 0.4);
        targetHeight = minBarHeight + (maxBarHeight - minBarHeight) * 0.6 * (0.5 + wave * 0.5);
      }

      // Smooth bar height transition
      barHeightsRef.current[i] = lerp(barHeightsRef.current[i], targetHeight, 0.2);
      const barHeight = barHeightsRef.current[i];

      const x = startX + i * (barWidth + barGap);
      const y = cy - barHeight / 2;

      // Create gradient for each bar (pink to blue)
      const progress = i / (numBars - 1);
      const barGradient = ctx.createLinearGradient(x, y, x, y + barHeight);

      // Color interpolation from pink/magenta to cyan/blue
      const r = Math.round(lerp(255, 100, progress));
      const g = Math.round(lerp(120, 180, progress));
      const b = Math.round(lerp(200, 255, progress));

      barGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${config.barOpacity * 0.9})`);
      barGradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${config.barOpacity})`);
      barGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${config.barOpacity * 0.9})`);

      // Draw bar with rounded ends
      ctx.fillStyle = barGradient;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, barWidth / 2);
      ctx.fill();

      // Add subtle glow to bars (scaled)
      ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.5)`;
      ctx.shadowBlur = Math.max(4, 8 * scale);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

  }, [audioLevel, state]);

  // Update target config when state changes
  useEffect(() => {
    const config = stateConfigs[state];
    targetConfigRef.current = config ? { ...config } : { ...stateConfigs.disconnected };
  }, [state]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const animate = () => {
      timeRef.current += 0.016;
      draw(ctx, rect.width, rect.height);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [draw]);

  // Handle resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={cn('relative w-full h-full', className)}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ background: 'transparent' }}
      />
    </div>
  );
}
