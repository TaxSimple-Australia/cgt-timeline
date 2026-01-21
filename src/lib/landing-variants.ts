/**
 * Landing Page Variants Configuration
 * Central config for all landing page variants
 */

export interface LandingVariant {
  name: string;
  path: string;
  description?: string;
}

export const LANDING_VARIANTS: LandingVariant[] = [
  {
    name: 'Default',
    path: '/landing',
    description: 'Full-featured landing page'
  },
  {
    name: 'Version 2',
    path: '/landing/v2',
    description: 'Alternative layout and messaging'
  },
  {
    name: 'Version 3',
    path: '/landing/v3',
    description: 'Premium luxury design with interactive filters'
  },
];

/**
 * Get the current variant based on pathname
 */
export function getCurrentVariant(pathname: string): LandingVariant | undefined {
  // Exact match first
  const exactMatch = LANDING_VARIANTS.find(v => v.path === pathname);
  if (exactMatch) return exactMatch;

  // Default to first variant if on /landing
  if (pathname === '/landing' || pathname === '/landing/') {
    return LANDING_VARIANTS[0];
  }

  return undefined;
}

/**
 * Check if a path is a landing page variant
 */
export function isLandingVariant(pathname: string): boolean {
  return pathname.startsWith('/landing');
}
