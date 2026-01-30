/**
 * Session Restore Logic
 * Handles checking for and restoring saved sessions on app load
 */

import {
  loadTimelineSession,
  hasTimelineSession,
  getSessionMetadata,
  deleteTimelineSession,
  type TimelineSession,
} from './IndexedDBService';

// ============================================================================
// TYPES
// ============================================================================

export interface SessionInfo {
  exists: boolean;
  session?: TimelineSession;
  metadata?: {
    lastModified: Date;
    propertyCount: number;
    eventCount: number;
    hasAnalysis: boolean;
    hasNotes: boolean;
  };
}

export interface RestoreOptions {
  autoRestoreIfRecent: boolean;   // Auto-restore if session is recent
  maxAgeHours: number;            // Max age for auto-restore (default: 24)
  showPromptAlways: boolean;      // Always show prompt even for recent sessions
}

const DEFAULT_OPTIONS: RestoreOptions = {
  autoRestoreIfRecent: true,
  maxAgeHours: 24,
  showPromptAlways: false,
};

// ============================================================================
// SESSION DETECTION
// ============================================================================

/**
 * Check if a saved session exists
 */
export async function checkForSavedSession(sessionId: string = 'current'): Promise<SessionInfo> {
  try {
    const exists = await hasTimelineSession(sessionId);
    if (!exists) {
      return { exists: false };
    }

    const session = await loadTimelineSession(sessionId);
    if (!session) {
      return { exists: false };
    }

    return {
      exists: true,
      session,
      metadata: {
        lastModified: new Date(session.updatedAt),
        propertyCount: session.properties?.length || 0,
        eventCount: session.events?.length || 0,
        hasAnalysis: !!session.savedAnalysis,
        hasNotes: !!(session.notes && session.notes.trim()),
      },
    };
  } catch (error) {
    console.error('❌ Error checking for saved session:', error);
    return { exists: false };
  }
}

/**
 * Get session metadata without loading full data
 */
export async function getSessionInfo(sessionId: string = 'current'): Promise<SessionInfo['metadata'] | null> {
  const metadata = await getSessionMetadata(sessionId);
  if (!metadata || !metadata.exists) {
    return null;
  }

  return {
    lastModified: metadata.updatedAt!,
    propertyCount: metadata.propertyCount!,
    eventCount: metadata.eventCount!,
    hasAnalysis: false, // Can't know without loading full data
    hasNotes: false,
  };
}

// ============================================================================
// SESSION RESTORE DECISION
// ============================================================================

/**
 * Determine if we should auto-restore or prompt the user
 */
export async function shouldAutoRestore(
  sessionInfo: SessionInfo,
  options: Partial<RestoreOptions> = {}
): Promise<'auto-restore' | 'prompt' | 'no-session'> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (!sessionInfo.exists || !sessionInfo.metadata) {
    return 'no-session';
  }

  // Always prompt if configured
  if (opts.showPromptAlways) {
    return 'prompt';
  }

  // Check session age
  const ageHours = (Date.now() - sessionInfo.metadata.lastModified.getTime()) / (1000 * 60 * 60);

  // Auto-restore if recent and has meaningful data
  if (
    opts.autoRestoreIfRecent &&
    ageHours < opts.maxAgeHours &&
    (sessionInfo.metadata.propertyCount > 0 || sessionInfo.metadata.eventCount > 0)
  ) {
    return 'auto-restore';
  }

  // Prompt for older sessions or sessions with no data
  if (sessionInfo.metadata.propertyCount > 0 || sessionInfo.metadata.eventCount > 0) {
    return 'prompt';
  }

  return 'no-session';
}

// ============================================================================
// SESSION ACTIONS
// ============================================================================

/**
 * Discard the saved session
 */
export async function discardSession(sessionId: string = 'current'): Promise<void> {
  await deleteTimelineSession(sessionId);
  console.log('🗑️ Discarded saved session');
}

/**
 * Format session age for display
 */
export function formatSessionAge(lastModified: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - lastModified.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) {
    return 'just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  } else {
    return lastModified.toLocaleDateString();
  }
}

/**
 * Format session summary for display
 */
export function formatSessionSummary(metadata: SessionInfo['metadata']): string {
  if (!metadata) return 'Empty session';

  const parts: string[] = [];

  if (metadata.propertyCount > 0) {
    parts.push(`${metadata.propertyCount} propert${metadata.propertyCount === 1 ? 'y' : 'ies'}`);
  }

  if (metadata.eventCount > 0) {
    parts.push(`${metadata.eventCount} event${metadata.eventCount === 1 ? '' : 's'}`);
  }

  if (metadata.hasAnalysis) {
    parts.push('with CGT analysis');
  }

  if (metadata.hasNotes) {
    parts.push('with notes');
  }

  if (parts.length === 0) {
    return 'Empty session';
  }

  return parts.join(', ');
}

// ============================================================================
// EXPORTS
// ============================================================================

export const sessionRestore = {
  checkForSavedSession,
  getSessionInfo,
  shouldAutoRestore,
  discardSession,
  formatSessionAge,
  formatSessionSummary,
};

export default sessionRestore;
