'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Clock, Sparkles, BookOpen, GraduationCap, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TRAINING_VIDEOS, VIDEO_CATEGORIES, getCategoryLabel } from './trainingVideosData';
import type { TrainingVideo } from './trainingVideosData';
import FullscreenVideoPlayer from './FullscreenVideoPlayer';

export default function LearningPathVariant() {
  const [activeVideo, setActiveVideo] = useState<{ videoId: string; provider: 'youtube' | 'vimeo' } | null>(null);

  const handlePlay = (video: TrainingVideo) => {
    if (video.videoId) {
      setActiveVideo({ videoId: video.videoId, provider: video.provider || 'youtube' });
    }
  };

  // Group videos by category to create "modules" on the path
  const modules = VIDEO_CATEGORIES
    .filter((c) => c.id !== 'all')
    .map((cat, moduleIndex) => ({
      ...cat,
      moduleNumber: moduleIndex + 1,
      videos: TRAINING_VIDEOS.filter((v) => v.category === cat.id),
    }));

  return (
    <div className="relative">
      {/* Hero */}
      <div className="py-20 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto space-y-6"
        >
          <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
              Learning Path
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Follow the guided path from beginner to expert. Each module builds on the last.
          </p>

          {/* Progress summary */}
          <div className="flex items-center justify-center gap-6 pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">{modules.length}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Modules</div>
            </div>
            <div className="w-px h-8 bg-slate-300 dark:bg-slate-700" />
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">{TRAINING_VIDEOS.length}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Videos</div>
            </div>
            <div className="w-px h-8 bg-slate-300 dark:bg-slate-700" />
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">2h+</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Content</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Learning Path */}
      <div className="max-w-5xl mx-auto px-4 pb-20 relative">
        {/* Connecting vertical line */}
        <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-500/0 via-cyan-500/30 to-cyan-500/0" />

        <div className="space-y-20">
          {modules.map((module, moduleIndex) => {
            const isLeft = moduleIndex % 2 === 0;

            return (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, x: isLeft ? '-30vw' : '30vw' }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, amount: 0.2 }}
                transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
                className="relative"
              >
                {/* Connection dot */}
                <div className="absolute left-8 md:left-1/2 top-6 -translate-x-1/2 z-10">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 border-4 border-slate-100 dark:border-slate-900">
                    <span className="text-white font-bold text-sm">{module.moduleNumber}</span>
                  </div>
                </div>

                {/* Module card */}
                <div className={cn(
                  'ml-20 md:ml-0 md:w-[calc(50%-3rem)]',
                  isLeft ? 'md:mr-auto' : 'md:ml-auto'
                )}>
                  {/* Module header */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                        Module {module.moduleNumber}
                      </span>
                      <ChevronRight className="w-3 h-3 text-cyan-400" />
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {module.videos.length} videos
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {module.label}
                    </h2>
                  </div>

                  {/* Videos in this module */}
                  <div className="space-y-3">
                    {module.videos.map((video, videoIndex) => (
                      <motion.div
                        key={video.id}
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: false, amount: 0.3 }}
                        transition={{ duration: 0.4, delay: videoIndex * 0.1 }}
                        className="group cursor-pointer"
                        onClick={() => handlePlay(video)}
                      >
                        <div className="flex gap-3 bg-slate-200/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl p-3 hover:border-cyan-500/40 hover:shadow-md hover:shadow-cyan-500/5 transition-all">
                          {/* Mini thumbnail */}
                          <div className="relative w-28 flex-shrink-0 aspect-video rounded-lg overflow-hidden bg-slate-300 dark:bg-slate-900">
                            <img
                              src={video.thumbnail}
                              alt={video.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                              <Play className="w-4 h-4 text-white fill-white" />
                            </div>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-cyan-400 transition-colors line-clamp-1">
                                {video.title}
                              </h3>
                              {video.isNew && (
                                <span className="flex-shrink-0 px-1.5 py-0.5 bg-cyan-500 rounded text-[10px] font-bold text-white">
                                  NEW
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                              {video.description}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400">
                              <Clock className="w-3 h-3" />
                              <span>{video.duration}</span>
                              {video.videoId && (
                                <span className="text-green-500 font-medium flex items-center gap-1">
                                  <Play className="w-2.5 h-2.5 fill-green-500" /> Available
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* End marker */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: false, amount: 0.5 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mt-16"
        >
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
        </motion.div>
        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-3">
          You&apos;re now a CGT Brain expert!
        </p>
      </div>

      <AnimatePresence>
        {activeVideo && (
          <FullscreenVideoPlayer
            videoId={activeVideo.videoId}
            provider={activeVideo.provider}
            onClose={() => setActiveVideo(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
