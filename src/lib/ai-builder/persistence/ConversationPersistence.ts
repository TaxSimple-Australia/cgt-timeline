/**
 * AI Builder Conversation Persistence
 * Handles saving and restoring AI conversation state
 */

import {
  saveAIConversation,
  loadAIConversation,
  deleteAIConversation,
  listAIConversations,
  type AIConversation,
} from '@/lib/persistence/IndexedDBService';

// ============================================================================
// TYPES
// ============================================================================

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  toolCallId: string;
  result: unknown;
  error?: string;
}

export interface ConversationState {
  messages: ConversationMessage[];
  pendingActions: PendingAction[];
  isProcessing: boolean;
  lastActivityAt: string;
}

export interface PendingAction {
  id: string;
  type: string;
  payload: unknown;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  createdAt: string;
}

// ============================================================================
// CONVERSATION PERSISTENCE SERVICE
// ============================================================================

class ConversationPersistenceService {
  private sessionId: string = 'current';
  private autoSaveEnabled: boolean = true;
  private saveDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private saveDebounceMs: number = 2000;

  /**
   * Configure the persistence service
   */
  configure(options: {
    sessionId?: string;
    autoSaveEnabled?: boolean;
    saveDebounceMs?: number;
  }) {
    if (options.sessionId !== undefined) this.sessionId = options.sessionId;
    if (options.autoSaveEnabled !== undefined) this.autoSaveEnabled = options.autoSaveEnabled;
    if (options.saveDebounceMs !== undefined) this.saveDebounceMs = options.saveDebounceMs;
  }

  /**
   * Save conversation state (debounced)
   */
  saveConversation(state: ConversationState): void {
    if (!this.autoSaveEnabled) return;

    // Clear existing debounce timer
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
    }

    // Debounce the save
    this.saveDebounceTimer = setTimeout(async () => {
      try {
        const conversation: AIConversation = {
          id: this.sessionId,
          messages: state.messages.map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
          })),
          pendingActions: state.pendingActions,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await saveAIConversation(conversation);
        console.log('💬 AI conversation saved');
      } catch (error) {
        console.error('❌ Failed to save AI conversation:', error);
      }
    }, this.saveDebounceMs);
  }

  /**
   * Save conversation state immediately (no debounce)
   */
  async saveConversationNow(state: ConversationState): Promise<void> {
    // Clear any pending debounced save
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
      this.saveDebounceTimer = null;
    }

    try {
      const conversation: AIConversation = {
        id: this.sessionId,
        messages: state.messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
        })),
        pendingActions: state.pendingActions,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveAIConversation(conversation);
      console.log('💬 AI conversation saved (immediate)');
    } catch (error) {
      console.error('❌ Failed to save AI conversation:', error);
      throw error;
    }
  }

  /**
   * Load conversation state
   */
  async loadConversation(): Promise<ConversationState | null> {
    try {
      const conversation = await loadAIConversation(this.sessionId);
      if (!conversation) {
        console.log('📂 No saved AI conversation found');
        return null;
      }

      const state: ConversationState = {
        messages: conversation.messages.map((msg, index) => ({
          id: `msg-${index}-${Date.now()}`,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
        })),
        pendingActions: (conversation.pendingActions || []) as PendingAction[],
        isProcessing: false,
        lastActivityAt: conversation.updatedAt,
      };

      console.log('📂 AI conversation restored with', state.messages.length, 'messages');
      return state;
    } catch (error) {
      console.error('❌ Failed to load AI conversation:', error);
      return null;
    }
  }

  /**
   * Check if a saved conversation exists
   */
  async hasConversation(): Promise<boolean> {
    try {
      const conversation = await loadAIConversation(this.sessionId);
      return conversation !== null && conversation.messages.length > 0;
    } catch (error) {
      console.error('❌ Failed to check for conversation:', error);
      return false;
    }
  }

  /**
   * Clear saved conversation
   */
  async clearConversation(): Promise<void> {
    try {
      await deleteAIConversation(this.sessionId);
      console.log('🗑️ AI conversation cleared');
    } catch (error) {
      console.error('❌ Failed to clear AI conversation:', error);
      throw error;
    }
  }

  /**
   * List all saved conversations
   */
  async listConversations(): Promise<{ id: string; messageCount: number; updatedAt: string }[]> {
    try {
      const conversations = await listAIConversations();
      return conversations.map(conv => ({
        id: conv.id,
        messageCount: conv.messages.length,
        updatedAt: conv.updatedAt,
      }));
    } catch (error) {
      console.error('❌ Failed to list conversations:', error);
      return [];
    }
  }

  /**
   * Add a message and trigger auto-save
   */
  addMessage(state: ConversationState, message: ConversationMessage): ConversationState {
    const newState = {
      ...state,
      messages: [...state.messages, message],
      lastActivityAt: new Date().toISOString(),
    };

    // Trigger auto-save
    this.saveConversation(newState);

    return newState;
  }

  /**
   * Add multiple messages and trigger auto-save
   */
  addMessages(state: ConversationState, messages: ConversationMessage[]): ConversationState {
    const newState = {
      ...state,
      messages: [...state.messages, ...messages],
      lastActivityAt: new Date().toISOString(),
    };

    // Trigger auto-save
    this.saveConversation(newState);

    return newState;
  }

  /**
   * Update a pending action
   */
  updatePendingAction(
    state: ConversationState,
    actionId: string,
    updates: Partial<PendingAction>
  ): ConversationState {
    const newState = {
      ...state,
      pendingActions: state.pendingActions.map(action =>
        action.id === actionId ? { ...action, ...updates } : action
      ),
      lastActivityAt: new Date().toISOString(),
    };

    // Trigger auto-save
    this.saveConversation(newState);

    return newState;
  }

  /**
   * Clear all pending actions
   */
  clearPendingActions(state: ConversationState): ConversationState {
    const newState = {
      ...state,
      pendingActions: [],
      lastActivityAt: new Date().toISOString(),
    };

    // Trigger auto-save
    this.saveConversation(newState);

    return newState;
  }

  /**
   * Flush any pending saves (call before page unload)
   */
  flush(): void {
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
      this.saveDebounceTimer = null;
    }
  }
}

// Export singleton instance
export const conversationPersistence = new ConversationPersistenceService();

// Export class for testing
export { ConversationPersistenceService };

export default conversationPersistence;
