'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

interface CGTBrainLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showTagline?: boolean;
}

const imageSizeClasses = {
  sm: 'h-6 md:h-7',
  md: 'h-8 md:h-10',
  lg: 'h-10 md:h-12',
  xl: 'h-12 md:h-16',
  '2xl': 'h-16 md:h-20',
};

export default function CGTBrainLogo({
  size = 'md',
  className,
  showTagline = false,
}: CGTBrainLogoProps) {
  return (
    <div className={cn('flex flex-col', className)}>
      <div className={cn('relative bg-transparent', imageSizeClasses[size])}>
        {/* Light theme logo */}
        <Image
          src="/cgt_brain_ai_logo_light_theme_transparent.webp"
          alt="CGT Brain Logo"
          width={200}
          height={50}
          className="h-full w-auto object-contain bg-transparent dark:hidden"
          priority
        />
        {/* Dark theme logo */}
        <Image
          src="/logos/logo-20-dark.png"
          alt="CGT Brain Logo"
          width={200}
          height={50}
          className="h-full w-auto object-contain bg-transparent hidden dark:block"
          priority
        />
      </div>
      {showTagline && (
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Capital Gains Tax Timeline
        </p>
      )}
    </div>
  );
}
