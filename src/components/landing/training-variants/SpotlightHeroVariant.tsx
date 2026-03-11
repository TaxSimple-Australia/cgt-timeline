'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Clock, Sparkles, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TRAINING_VIDEOS, VIDEO_CATEGORIES } from './trainingVideosData';
import type { TrainingVideo } from './trainingVideosData';
import FullscreenVideoPlayer from './FullscreenVideoPlayer';

export default function SpotlightHeroVariant() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeVideo, setActiveVideo] = useState<{ videoId: string; provider: 'youtube' | 'vimeo' } | null>(null);

  // Featured video: first one with a real videoId
  const featuredVideo = TRAINING_VIDEOS.find((v) => v.videoId) || TRAINING_VIDEOS[0];

  const filteredVideos = selectedCategory === 'all'
    ? TRAINING_VIDEOS.filter((v) => v.id !== featuredVideo.id)
    : TRAINING_VIDEOS.filter((v) => v.category === selectedCategory && v.id !== featuredVideo.id);

  const handlePlay = (video: TrainingVideo) => {
    if (video.videoId) {
      setActiveVideo({ videoId: video.videoId, provider: video.provider || 'youtube' });
    }
  };

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
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
              Video Tutorials
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Start with our featured guide, then explore the full library below.
          </p>
        </motion.div>
      </div>

      {/* Featured / Spotlight Video */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.2 }}
        transition={{ duration: 0.6 }}
        className="max-w-5xl mx-auto px-4 mb-16"
      >
        <div
          className="group relative aspect-video rounded-2xl overflow-hidden border-2 border-cyan-500/30 shadow-2xl shadow-cyan-500/10 cursor-pointer"
          onClick={() => handlePlay(featuredVideo)}
        >
          <img
            src={featuredVideo.thumbnail}
            alt={featuredVideo.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Play button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className={cn(
                "p-5 rounded-full shadow-2xl",
                featuredVideo.videoId ? "bg-red-600" : "bg-cyan-500"
              )}
            >
              <Play className="w-10 h-10 text-white fill-white" />
            </motion.div>
          </div>

          {/* Info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-3">
              <span className="px-3 py-1 bg-cyan-500 rounded-full text-xs font-bold text-white uppercase tracking-wider">
                Featured
              </span>
              {featuredVideo.isNew && (
                <span className="px-3 py-1 bg-purple-500 rounded-full text-xs font-bold text-white flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> New
                </span>
              )}
              <span className="px-3 py-1 bg-black/50 rounded-full text-xs font-medium text-white flex items-center gap-1">
                <Clock className="w-3 h-3" /> {featuredVideo.duration}
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              {featuredVideo.title}
            </h2>
            <p className="text-slate-300 text-sm md:text-base max-w-2xl">
              {featuredVideo.description}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Category tabs */}
      <div className="max-w-7xl mx-auto px-4 mb-8">
        <div className="flex flex-wrap gap-2 justify-center">
          {VIDEO_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                'relative px-5 py-2.5 rounded-full text-sm font-medium transition-all',
                selectedCategory === cat.id
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700'
              )}
            >
              {cat.label}
              <span className={cn(
                "ml-2 text-xs",
                selectedCategory === cat.id ? "text-white/70" : "text-slate-400"
              )}>
                {cat.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Video grid */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedCategory}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          >
            {filteredVideos.map((video, index) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="group cursor-pointer"
                onClick={() => handlePlay(video)}
              >
                <div className="bg-slate-200 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all">
                  <div className="relative aspect-video bg-slate-300 dark:bg-slate-900 overflow-hidden">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className={cn(
                        "p-3 rounded-full",
                        video.videoId ? "bg-red-600" : "bg-cyan-500/80"
                      )}>
                        <Play className="w-5 h-5 text-white fill-white" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 rounded text-xs text-white flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {video.duration}
                    </div>
                    {video.isNew && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-cyan-500 rounded text-xs font-bold text-white">
                        NEW
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1 group-hover:text-cyan-400 transition-colors line-clamp-1">
                      {video.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {video.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {filteredVideos.length === 0 && (
          <div className="text-center py-16">
            <p className="text-slate-500 dark:text-slate-400">No videos in this category yet.</p>
          </div>
        )}
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
