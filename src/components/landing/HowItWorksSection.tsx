'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Play, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

const VIDEOS = [
  {
    id: 'tHd5YmChsaA',
    title: 'How It Works',
    thumbnail: '/landing.png',
    hoverLabel: 'Watch How It Works',
    width: 960,
    height: 540,
  },
  {
    id: 'Ok0H627f6ls',
    title: 'How To Add Events',
    thumbnail: '/youtube_thumbnail_how_to_add_events.jpeg',
    hoverLabel: 'Watch How To Add Events',
    width: 960,
    height: 540,
  },
];

export default function HowItWorksSection() {
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null);
  const playerDivId = 'yt-howitworks-player';

  // Load YouTube IFrame API once
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ((window as any).YT && (window as any).YT.Player) return;
    if (!document.getElementById('yt-iframe-api')) {
      const tag = document.createElement('script');
      tag.id = 'yt-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
    (window as any).onYouTubeIframeAPIReady = () => {};
  }, []);

  const handleClose = useCallback(() => {
    if (playerRef.current) {
      try { playerRef.current.destroy(); } catch {}
      playerRef.current = null;
    }
    setActiveVideoId(null);
  }, []);

  // Create the YT player when a video is selected
  useEffect(() => {
    if (!activeVideoId) return;

    const waitForApi = () => {
      const YT = (window as any).YT;
      if (!YT || !YT.Player) {
        setTimeout(waitForApi, 100);
        return;
      }
      const el = document.getElementById(playerDivId);
      if (!el) return;

      playerRef.current = new YT.Player(playerDivId, {
        videoId: activeVideoId,
        playerVars: { autoplay: 1, rel: 0, modestbranding: 1 },
        events: {
          onStateChange: (event: any) => {
            if (event.data === 0) handleClose();
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
  }, [activeVideoId, handleClose]);

  // Escape key closes modal
  useEffect(() => {
    if (!activeVideoId) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeVideoId, handleClose]);

  return (
    <>
      <section id="how-it-works" className="relative py-24 px-4 overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        {/* Decorative gradient orbs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <div className="flex items-center justify-center gap-6 mb-4">
              <div className="h-px w-16 bg-gradient-to-r from-transparent via-cyan-500 to-cyan-500" />
              <h2 className="text-4xl md:text-5xl font-bold text-white">
                How It Works
              </h2>
              <div className="h-px w-16 bg-gradient-to-l from-transparent via-cyan-500 to-cyan-500" />
            </div>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              From timeline to tax report in three simple steps
            </p>
          </motion.div>

          {/* Video Thumbnails */}
          <div className="mb-16 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {VIDEOS.map((video, index) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.15 }}
                className="flex flex-col items-center"
              >
                <button
                  onClick={() => setActiveVideoId(video.id)}
                  className="relative w-full rounded-xl overflow-hidden shadow-2xl border border-cyan-500/50 shadow-cyan-500/50 group cursor-pointer"
                >
                  <Image
                    src={video.thumbnail}
                    alt={`${video.title} — Click to play video`}
                    width={video.width}
                    height={video.height}
                    className="w-full h-auto"
                    priority={index === 0}
                  />
                  {/* Play overlay */}
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/90 group-hover:bg-white group-hover:scale-110 transition-all flex items-center justify-center shadow-2xl">
                      <Play className="w-7 h-7 md:w-9 md:h-9 text-slate-900 ml-1" fill="currentColor" />
                    </div>
                  </div>
                  {/* Hover label */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-sm text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {video.hoverLabel}
                  </div>
                </button>
                <p className="mt-3 text-base font-medium text-slate-300">{video.title}</p>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="text-center"
          >
            <Link href="/app">
              <Button size="lg" className="group bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-6 text-lg shadow-lg shadow-cyan-500/50 hover:shadow-xl hover:shadow-cyan-500/60 transition-all">
                Get Started Now
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Fullscreen Video Modal */}
      <AnimatePresence>
        {activeVideoId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center"
            onClick={handleClose}
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              aria-label="Close video"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Video container */}
            <div
              className="w-full max-w-6xl aspect-video mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div id={playerDivId} className="w-full h-full" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
