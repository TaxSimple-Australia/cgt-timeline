'use client';

import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface FullscreenVideoPlayerProps {
  videoId: string;
  provider: 'youtube' | 'vimeo';
  onClose: () => void;
}

export default function FullscreenVideoPlayer({
  videoId,
  provider,
  onClose,
}: FullscreenVideoPlayerProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerDivId = `training-player-${videoId}`;

  // Load YouTube IFrame API
  useEffect(() => {
    if (provider !== 'youtube' || typeof window === 'undefined') return;
    if ((window as any).YT && (window as any).YT.Player) return;
    if (!document.getElementById('yt-iframe-api')) {
      const tag = document.createElement('script');
      tag.id = 'yt-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
    (window as any).onYouTubeIframeAPIReady = () => {};
  }, [provider]);

  // Load Vimeo Player SDK
  useEffect(() => {
    if (provider !== 'vimeo' || typeof window === 'undefined') return;
    if ((window as any).Vimeo && (window as any).Vimeo.Player) return;
    if (!document.getElementById('vimeo-player-api')) {
      const tag = document.createElement('script');
      tag.id = 'vimeo-player-api';
      tag.src = 'https://player.vimeo.com/api/player.js';
      document.head.appendChild(tag);
    }
  }, [provider]);

  // Create YouTube player
  useEffect(() => {
    if (provider !== 'youtube') return;

    const waitForApi = () => {
      const YT = (window as any).YT;
      if (!YT || !YT.Player) {
        setTimeout(waitForApi, 100);
        return;
      }
      const el = document.getElementById(playerDivId);
      if (!el) return;

      playerRef.current = new YT.Player(playerDivId, {
        videoId,
        playerVars: { autoplay: 1, rel: 0, modestbranding: 1 },
        events: {
          onStateChange: (event: any) => {
            if (event.data === 0) onClose();
          },
        },
      });
    };

    waitForApi();

    return () => {
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch {}
        playerRef.current = null;
      }
    };
  }, [provider, videoId, onClose, playerDivId]);

  // Create Vimeo player
  useEffect(() => {
    if (provider !== 'vimeo') return;

    const waitForApi = () => {
      const Vimeo = (window as any).Vimeo;
      if (!Vimeo || !Vimeo.Player) {
        setTimeout(waitForApi, 100);
        return;
      }
      const iframe = iframeRef.current;
      if (!iframe) return;

      const player = new Vimeo.Player(iframe);
      playerRef.current = player;
      player.on('ended', () => onClose());
    };

    waitForApi();

    return () => {
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch {}
        playerRef.current = null;
      }
    };
  }, [provider, videoId, onClose]);

  // Escape key closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-slate-50/10 hover:bg-slate-200/30 text-white flex items-center justify-center transition-colors"
        aria-label="Close video"
      >
        <X className="w-6 h-6" />
      </button>

      <div
        className="w-full max-w-6xl aspect-video mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {provider === 'youtube' ? (
          <div id={playerDivId} className="w-full h-full" />
        ) : (
          <iframe
            ref={iframeRef}
            src={`https://player.vimeo.com/video/${videoId}?autoplay=1&title=0&byline=0&portrait=0`}
            className="w-full h-full"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>
    </motion.div>
  );
}
