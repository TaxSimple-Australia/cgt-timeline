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
      subdivisionDate: p.subdivisionDate?.toISOString(),
    })),
    events: events.map((e) => ({
      ...e,
      date: e.date.toISOString(),
      contractDate: e.contractDate?.toISOString(),
      settlementDate: e.settlementDate?.toISOString(),
      constructionStartDate: e.constructionStartDate?.toISOString(),
      constructionEndDate: e.constructionEndDate?.toISOString(),
      rentalUseStartDate: e.rentalUseStartDate?.toISOString(),
      businessUseStartDate: e.businessUseStartDate?.toISOString(),
      mixedUseMoveInDate: e.mixedUseMoveInDate?.toISOString(),
      appreciationDate: e.appreciationDate?.toISOString(),
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
      subdivisionDate: p.subdivisionDate ? new Date(p.subdivisionDate) : undefined,
    })),
    events: data.events.map((e) => ({
      ...e,
      date: new Date(e.date),
      contractDate: e.contractDate ? new Date(e.contractDate) : undefined,
      settlementDate: e.settlementDate ? new Date(e.settlementDate) : undefined,
      constructionStartDate: e.constructionStartDate ? new Date(e.constructionStartDate) : undefined,
      constructionEndDate: e.constructionEndDate ? new Date(e.constructionEndDate) : undefined,
      rentalUseStartDate: e.rentalUseStartDate ? new Date(e.rentalUseStartDate) : undefined,
      businessUseStartDate: e.businessUseStartDate ? new Date(e.businessUseStartDate) : undefined,
      mixedUseMoveInDate: e.mixedUseMoveInDate ? new Date(e.mixedUseMoveInDate) : undefined,
      appreciationDate: e.appreciationDate ? new Date(e.appreciationDate) : undefined,
    })),
    notes: data.notes,
  };
}
