'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Play,
  Clock,
  BookOpen,
  Rocket,
  TrendingUp,
  Settings,
  FileText,
  Search,
  Filter,
  Video,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import LandingHeader from '@/components/landing/LandingHeader';
import LandingFooter from '@/components/landing/LandingFooter';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function TrainingVideosPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'all', label: 'All Videos', icon: Video, count: 12 },
    { id: 'getting-started', label: 'Getting Started', icon: Rocket, count: 3 },
    { id: 'timeline-builder', label: 'Timeline Builder', icon: Settings, count: 4 },
    { id: 'cgt-analysis', label: 'CGT Analysis', icon: TrendingUp, count: 3 },
    { id: 'advanced', label: 'Advanced Features', icon: Sparkles, count: 2 },
  ];

  const videos = [
    {
      id: 1,
      category: 'getting-started',
      title: 'Introduction to CGT Brain',
      description: 'A comprehensive overview of CGT Brain features and capabilities',
      duration: '5:30',
      thumbnail: 'https://placehold.co/400x225/1e293b/38bdf8?text=Intro+to+CGT+Brain',
      isNew: true,
    },
    {
      id: 2,
      category: 'getting-started',
      title: 'Creating Your First Timeline',
      description: 'Step-by-step guide to building your first property timeline',
      duration: '8:15',
      thumbnail: 'https://placehold.co/400x225/1e293b/38bdf8?text=First+Timeline',
      isNew: false,
    },
    {
      id: 3,
      category: 'getting-started',
      title: 'Understanding Event Types',
      description: 'Learn about the 11 event types and when to use each',
      duration: '6:45',
      thumbnail: 'https://placehold.co/400x225/1e293b/38bdf8?text=Event+Types',
      isNew: false,
    },
    {
      id: 4,
      category: 'timeline-builder',
      title: 'Using the Voice Timeline Builder',
      description: 'How to build timelines using voice commands and AI assistance',
      duration: '10:20',
      thumbnail: 'https://placehold.co/400x225/1e293b/38bdf8?text=Voice+Builder',
      isNew: true,
    },
    {
      id: 5,
      category: 'timeline-builder',
      title: 'Document Upload & Extraction',
      description: 'Automatically extract timeline data from documents',
      duration: '7:30',
      thumbnail: 'https://placehold.co/400x225/1e293b/38bdf8?text=Document+Upload',
      isNew: false,
    },
    {
      id: 6,
      category: 'timeline-builder',
      title: 'Managing Multiple Properties',
      description: 'Best practices for handling complex multi-property portfolios',
      duration: '9:15',
      thumbnail: 'https://placehold.co/400x225/1e293b/38bdf8?text=Multiple+Properties',
      isNew: false,
    },
    {
      id: 7,
      category: 'timeline-builder',
      title: 'Cost Base Management',
      description: 'Adding and managing cost base items across 5 CGT elements',
      duration: '11:40',
      thumbnail: 'https://placehold.co/400x225/1e293b/38bdf8?text=Cost+Base',
      isNew: false,
    },
    {
      id: 8,
      category: 'cgt-analysis',
      title: 'Running CGT Analysis',
      description: 'How to generate accurate CGT calculations using AI',
      duration: '8:50',
      thumbnail: 'https://placehold.co/400x225/1e293b/38bdf8?text=CGT+Analysis',
      isNew: false,
    },
    {
      id: 9,
      category: 'cgt-analysis',
      title: 'Understanding Verification Alerts',
      description: 'How to interpret and resolve verification alerts',
      duration: '6:30',
      thumbnail: 'https://placehold.co/400x225/1e293b/38bdf8?text=Verification+Alerts',
      isNew: true,
    },
    {
      id: 10,
      category: 'cgt-analysis',
      title: 'Generating PDF Reports',
      description: 'Creating professional CGT reports for clients',
      duration: '7:20',
      thumbnail: 'https://placehold.co/400x225/1e293b/38bdf8?text=PDF+Reports',
      isNew: false,
    },
    {
      id: 11,
      category: 'advanced',
      title: 'Admin Dashboard Overview',
      description: 'Using the admin dashboard to review AI accuracy and performance',
      duration: '12:15',
      thumbnail: 'https://placehold.co/400x225/1e293b/38bdf8?text=Admin+Dashboard',
      isNew: true,
    },
    {
      id: 12,
      category: 'advanced',
      title: 'Shareable Timeline Links',
      description: 'How to save and share timelines with colleagues and clients',
      duration: '5:45',
      thumbnail: 'https://placehold.co/400x225/1e293b/38bdf8?text=Shareable+Links',
      isNew: false,
    },
  ];

  const filteredVideos = videos.filter((video) => {
    const matchesCategory = selectedCategory === 'all' || video.category === selectedCategory;
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         video.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <LandingHeader />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium text-cyan-400">Training Resources</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Master CGT Brain
              </span>
              <br />
              <span className="text-white">with Video Tutorials</span>
            </h1>

            <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Comprehensive video guides to help you get the most out of CGT Brain.
              From beginner basics to advanced features.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Search and Filter */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 bg-slate-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search videos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all",
                    selectedCategory === category.id
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30"
                      : "bg-slate-800/50 text-slate-300 hover:bg-slate-700 border border-slate-700"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{category.label}</span>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs",
                    selectedCategory === category.id
                      ? "bg-white/20"
                      : "bg-slate-700"
                  )}>
                    {category.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Video Grid */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {filteredVideos.length === 0 ? (
            <div className="text-center py-20">
              <Video className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-400 mb-2">No videos found</h3>
              <p className="text-slate-500">Try adjusting your search or filter</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVideos.map((video, index) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.05 }}
                  className="group cursor-pointer"
                >
                  <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl overflow-hidden hover:border-cyan-500/50 transition-all">
                    {/* Thumbnail */}
                    <div className="relative aspect-video bg-slate-900 overflow-hidden">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      {/* Play Button Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/30 transition-colors">
                        <div className="p-4 bg-cyan-500/90 group-hover:bg-cyan-500 rounded-full transition-colors">
                          <Play className="w-6 h-6 text-white fill-white" />
                        </div>
                      </div>
                      {/* Duration Badge */}
                      <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/80 rounded text-xs font-medium text-white flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {video.duration}
                      </div>
                      {/* New Badge */}
                      {video.isNew && (
                        <div className="absolute top-3 left-3 px-2 py-1 bg-cyan-500 rounded text-xs font-medium text-white flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          New
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                        {video.title}
                      </h3>
                      <p className="text-sm text-slate-400 mb-4">
                        {video.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-cyan-400 uppercase tracking-wider">
                          {categories.find(c => c.id === video.category)?.label}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/30">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="p-8 sm:p-12 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl"
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              Need Personalized Training?
            </h2>
            <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
              Book a one-on-one training session with our experts to get customized
              guidance for your specific needs.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/book-demo">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/30"
                >
                  Book Training Session
                </Button>
              </Link>
              <Link href="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/50"
                >
                  Contact Support
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
