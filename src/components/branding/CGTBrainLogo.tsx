'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface CGTBrainLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showTagline?: boolean;
  variant?: 'text' | string; // 'text' or logo ID like 'logo-1'
  logoPath?: string; // Custom logo path
}

interface LogoConfig {
  id: string;
  name: string;
  description: string;
  type: string;
  file: string | null;
  darkFile?: string;
}

const sizeClasses = {
  sm: 'text-lg md:text-xl',
  md: 'text-xl md:text-2xl',
  lg: 'text-2xl md:text-3xl',
  xl: 'text-3xl md:text-4xl',
  '2xl': 'text-4xl md:text-5xl',
};

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
  variant = 'text',
  logoPath
}: CGTBrainLogoProps) {
  const [logoConfig, setLogoConfig] = useState<LogoConfig | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load logo config from JSON
  useEffect(() => {
    if (variant !== 'text' && variant.startsWith('logo-')) {
      fetch('/logos/logos-config.json')
        .then(res => res.json())
        .then(data => {
          const config = data.logos.find((l: LogoConfig) => l.id === variant);
          setLogoConfig(config || null);
        })
        .catch(err => console.error('Failed to load logo config:', err));
    }
  }, [variant]);

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };

    checkDarkMode();

    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  // If using image variant, show image logo
  if (variant !== 'text' && variant.startsWith('logo-')) {
    // Use config file path, custom logoPath, or construct from variant name
    const fallbackPath = `/logos/${variant}-dark.png`;
    const lightPath = logoConfig?.file || logoPath || fallbackPath;
    const darkPath = logoConfig?.darkFile || fallbackPath;
    const imagePath = (isDarkMode && darkPath) ? darkPath : lightPath;

    if (!imagePath) {
      // Loading state or fallback to text logo
      return (
        <div className={cn('flex flex-col', className)}>
          <h1 className={cn('font-bold transition-all', sizeClasses[size])}>
            <span className="bg-gradient-to-r from-cyan-400 to-cyan-500 bg-clip-text text-transparent">
              CGT
            </span>
            <span className="text-slate-900 dark:text-slate-100 ml-1">
              Brain
            </span>
          </h1>
        </div>
      );
    }

    return (
      <div className={cn('flex flex-col', className)}>
        <div className={cn('relative bg-transparent', imageSizeClasses[size])}>
          <Image
            src={imagePath}
            alt="CGT Brain Logo"
            width={200}
            height={50}
            className="h-full w-auto object-contain bg-transparent"
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

  // Default text logo
  return (
    <div className={cn('flex flex-col', className)}>
      <h1 className={cn('font-bold transition-all', sizeClasses[size])}>
        <span className="bg-gradient-to-r from-cyan-400 to-cyan-500 bg-clip-text text-transparent">
          CGT
        </span>
        <span className="text-slate-900 dark:text-slate-100 ml-1">
          Brain
        </span>
      </h1>
      {showTagline && (
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Capital Gains Tax Timeline
        </p>
      )}
    </div>
  );
}
