'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Clock, Sparkles, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TRAINING_VIDEOS, VIDEO_CATEGORIES, getCategoryLabel } from './trainingVideosData';
import type { TrainingVideo } from './trainingVideosData';
import FullscreenVideoPlayer from './FullscreenVideoPlayer';

function VideoCard({ video, onPlay }: { video: TrainingVideo; onPlay: (v: TrainingVideo) => void }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05, zIndex: 10 }}
      transition={{ duration: 0.2 }}
      className="group cursor-pointer flex-shrink-0 w-[300px] snap-start"
      onClick={() => video.videoId && onPlay(video)}
    >
      <div className="bg-slate-200 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all">
        <div className="relative aspect-video bg-slate-300 dark:bg-slate-900 overflow-hidden">
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-full h-full object-cover transition-transform group-hover:scale-110"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src.includes('maxresdefault')) {
                target.src = target.src.replace('maxresdefault', 'hqdefault');
              }
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className={cn(
              "p-3 rounded-full",
              video.videoId ? "bg-red-600" : "bg-cyan-500/80"
            )}>
              <Play className="w-6 h-6 text-white fill-white" />
            </div>
          </div>
          <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 rounded text-xs font-medium text-white flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {video.duration}
          </div>
          {video.isNew && (
            <div className="absolute top-2 left-2 px-2 py-0.5 bg-cyan-500 rounded text-xs font-bold text-white flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              NEW
            </div>
          )}
          {video.videoId && (
            <div className="absolute top-2 right-2 px-2 py-0.5 bg-green-500 rounded text-xs font-medium text-white flex items-center gap-1">
              <Play className="w-3 h-3 fill-white" />
              Watch Now
            </div>
          )}
        </div>
        <div className="p-3">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1 line-clamp-1 group-hover:text-cyan-400 transition-colors">
            {video.title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
            {video.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function CarouselRow({ category, videos, onPlay }: { category: string; videos: TrainingVideo[]; onPlay: (v: TrainingVideo) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = 320;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.2 }}
      transition={{ duration: 0.6 }}
      className="relative group/row"
    >
      <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-4 px-1">
        {getCategoryLabel(category)}
        <span className="ml-3 text-sm font-normal text-slate-500 dark:text-slate-400">
          {videos.length} videos
        </span>
      </h2>

      <div className="relative">
        {/* Scroll buttons */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-0 bottom-0 z-10 w-12 bg-gradient-to-r from-slate-100 dark:from-slate-900 to-transparent flex items-center justify-start opacity-0 group-hover/row:opacity-100 transition-opacity"
        >
          <ChevronLeft className="w-6 h-6 text-slate-700 dark:text-white" />
        </button>
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-0 bottom-0 z-10 w-12 bg-gradient-to-l from-slate-100 dark:from-slate-900 to-transparent flex items-center justify-end opacity-0 group-hover/row:opacity-100 transition-opacity"
        >
          <ChevronRight className="w-6 h-6 text-slate-700 dark:text-white" />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} onPlay={onPlay} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function NetflixCarouselVariant() {
  const [activeVideo, setActiveVideo] = useState<{ videoId: string; provider: 'youtube' | 'vimeo' } | null>(null);

  const handlePlay = (video: TrainingVideo) => {
    if (video.videoId) {
      setActiveVideo({ videoId: video.videoId, provider: video.provider || 'youtube' });
    }
  };

  // Group videos by category (excluding 'all')
  const categoryGroups = VIDEO_CATEGORIES
    .filter((c) => c.id !== 'all')
    .map((cat) => ({
      category: cat.id,
      videos: TRAINING_VIDEOS.filter((v) => v.category === cat.id),
    }))
    .filter((g) => g.videos.length > 0);

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
              Training Library
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Browse by category. Master CGT Brain at your own pace.
          </p>
        </motion.div>
      </div>

      {/* Carousel rows */}
      <div className="max-w-7xl mx-auto px-4 pb-20 space-y-12">
        {categoryGroups.map((group) => (
          <CarouselRow
            key={group.category}
            category={group.category}
            videos={group.videos}
            onPlay={handlePlay}
          />
        ))}
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
