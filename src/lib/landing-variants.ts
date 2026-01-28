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
    name: 'Main',
    path: '/landing',
    description: 'Main landing page'
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
