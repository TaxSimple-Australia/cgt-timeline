import {
  Video,
  Rocket,
  Settings,
  TrendingUp,
  Sparkles,
} from 'lucide-react';

export interface TrainingVideo {
  id: number;
  category: string;
  title: string;
  description: string;
  duration: string;
  thumbnail: string;
  videoId?: string;
  provider?: 'youtube' | 'vimeo';
  isNew: boolean;
}

export interface VideoCategory {
  id: string;
  label: string;
  icon: typeof Video;
  count: number;
}

export const VIDEO_CATEGORIES: VideoCategory[] = [
  { id: 'all', label: 'All Videos', icon: Video, count: 13 },
  { id: 'getting-started', label: 'Getting Started', icon: Rocket, count: 4 },
  { id: 'timeline-builder', label: 'Timeline Builder', icon: Settings, count: 4 },
  { id: 'cgt-analysis', label: 'CGT Analysis', icon: TrendingUp, count: 3 },
  { id: 'advanced', label: 'Advanced Features', icon: Sparkles, count: 2 },
];

export const TRAINING_VIDEOS: TrainingVideo[] = [
  {
    id: 0,
    category: 'getting-started',
    title: 'How to Add Events',
    description: 'Learn how to add different types of events to your property timeline including purchases, sales, improvements, and more',
    duration: '10:00',
    thumbnail: '/youtube_thumbnail_how_to_add_events.jpeg',
    videoId: '1165576075',
    provider: 'vimeo' as const,
    isNew: true,
  },
  {
    id: 1,
    category: 'getting-started',
    title: 'Introduction to CGT Brain',
    description: 'A comprehensive overview of CGT Brain features and capabilities',
    duration: '5:30',
    thumbnail: 'https://placehold.co/400x225/1e293b/38bdf8?text=Intro+to+CGT+Brain',
    isNew: false,
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

export function getVideosByCategory(category: string): TrainingVideo[] {
  if (category === 'all') return TRAINING_VIDEOS;
  return TRAINING_VIDEOS.filter((v) => v.category === category);
}

export function getCategoryLabel(categoryId: string): string {
  return VIDEO_CATEGORIES.find((c) => c.id === categoryId)?.label ?? categoryId;
}
