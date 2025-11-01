import { create } from 'zustand';
import type { Issue } from '@/types/model-response';

interface ValidationState {
  validationIssues: Record<string, Issue[]>; // propertyId -> issues
  apiConnected: boolean;
  lastValidation: Date | null;

  setValidationIssues: (issues: Issue[], properties: any[]) => void;
  clearValidationIssues: () => void;
  setApiConnected: (connected: boolean) => void;
  getIssuesForProperty: (propertyAddress: string) => Issue[];
}

export const useValidationStore = create<ValidationState>((set, get) => ({
  validationIssues: {},
  apiConnected: false,
  lastValidation: null,

  setValidationIssues: (issues: Issue[], properties: any[]) => {
    const issuesByProperty: Record<string, Issue[]> = {};

    // Group issues by property
    issues.forEach((issue) => {
      // Try to match issue to properties
      properties.forEach((property) => {
        const propertyAddress = property.address || property.name;

        // Check if issue is related to this property
        if (
          issue.field?.includes(propertyAddress) ||
          issue.message?.includes(propertyAddress) ||
          (issue as any).property_id?.includes(propertyAddress)
        ) {
          if (!issuesByProperty[propertyAddress]) {
            issuesByProperty[propertyAddress] = [];
          }
          issuesByProperty[propertyAddress].push(issue);
        }
      });
    });

    set({
      validationIssues: issuesByProperty,
      lastValidation: new Date()
    });
  },

  clearValidationIssues: () => {
    set({
      validationIssues: {},
      lastValidation: null
    });
  },

  setApiConnected: (connected: boolean) => {
    set({ apiConnected: connected });
  },

  getIssuesForProperty: (propertyAddress: string) => {
    const state = get();
    return state.validationIssues[propertyAddress] || [];
  },
}));
