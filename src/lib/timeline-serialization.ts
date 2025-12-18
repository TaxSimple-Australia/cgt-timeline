import type { Property, TimelineEvent } from '@/store/timeline';

export interface SerializedTimeline {
  version: number;
  properties: any[];
  events: any[];
  notes?: string; // Timeline notes/feedback
}

/**
 * Serialize timeline data for storage
 * Converts Date objects to ISO strings
 */
export function serializeTimeline(
  properties: Property[],
  events: TimelineEvent[],
  notes?: string
): SerializedTimeline {
  return {
    version: 1,
    properties: properties.map((p) => ({
      ...p,
      purchaseDate: p.purchaseDate?.toISOString(),
      saleDate: p.saleDate?.toISOString(),
    })),
    events: events.map((e) => ({
      ...e,
      date: e.date.toISOString(),
      contractDate: e.contractDate?.toISOString(),
      settlementDate: e.settlementDate?.toISOString(),
    })),
    notes: notes || undefined,
  };
}

/**
 * Deserialize timeline data from storage
 * Converts ISO strings back to Date objects
 */
export function deserializeTimeline(data: SerializedTimeline): {
  properties: Property[];
  events: TimelineEvent[];
  notes?: string;
} {
  return {
    properties: data.properties.map((p) => ({
      ...p,
      purchaseDate: p.purchaseDate ? new Date(p.purchaseDate) : undefined,
      saleDate: p.saleDate ? new Date(p.saleDate) : undefined,
    })),
    events: data.events.map((e) => ({
      ...e,
      date: new Date(e.date),
      contractDate: e.contractDate ? new Date(e.contractDate) : undefined,
      settlementDate: e.settlementDate ? new Date(e.settlementDate) : undefined,
    })),
    notes: data.notes,
  };
}
