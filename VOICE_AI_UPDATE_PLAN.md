# Voice AI Comprehensive Update Plan

## Overview
This plan outlines all changes needed to make the Voice AI fully capable of handling ALL timeline operations, especially subdivision, lot management, and complex property scenarios.

---

## Current State Analysis

### What Voice AI Can Do (35 tools):
- Property: add, update, delete, subdivide, set_owners
- Events: add (14 types), update, delete, list
- Cost Base: add, update, remove items
- Query: timeline summary, property details, event details, CGT estimate
- Navigation: zoom, pan, focus, undo, redo
- Analysis: portfolio analysis, tax rate settings

### Critical Gaps Identified:

#### 1. **Lot Management (HIGH PRIORITY)**
- ❌ Cannot list lots of a subdivided property
- ❌ Cannot get lot-specific details
- ❌ Cannot update lot properties (lotNumber, lotSize, address)
- ❌ Cannot delete individual lots
- ❌ Cannot toggle subdivision collapse/expand
- ❌ Cannot undo/reverse a subdivision

#### 2. **Event Operations on Lots**
- ❌ Cannot easily add events to lots by lot number (e.g., "add improvement to Lot 2")
- ❌ No awareness of lot relationships in event operations

#### 3. **System Instructions Gaps**
- ❌ No information about subdivision/lot relationships
- ❌ No guidance on Lot 1 special handling (continues main timeline)
- ❌ No context about lot cost base allocation

---

## Implementation Plan

### Phase 1: New Lot Management Tools

#### Tool 1: `list_lots_for_property`
```typescript
{
  name: 'list_lots_for_property',
  description: 'List all child lots of a subdivided property. Returns lot IDs, numbers, sizes, and allocated cost bases.',
  parameters: {
    propertyAddress: string  // Parent property address
  }
}
```

#### Tool 2: `get_lot_details`
```typescript
{
  name: 'get_lot_details',
  description: 'Get detailed information about a specific lot including events, cost base, and relationship to parent.',
  parameters: {
    propertyAddress: string,  // Parent or lot address
    lotNumber?: string        // e.g., "Lot 1", "Lot 2" (optional if using lot address)
  }
}
```

#### Tool 3: `update_lot`
```typescript
{
  name: 'update_lot',
  description: 'Update lot details like lot number, size, or address.',
  parameters: {
    propertyAddress: string,  // Parent property address
    lotNumber: string,        // Current lot number to update
    newLotNumber?: string,    // New lot number
    newLotSize?: number,      // New size in sqm
    newAddress?: string       // New address
  }
}
```

#### Tool 4: `delete_lot`
```typescript
{
  name: 'delete_lot',
  description: 'Delete a specific lot. If deleting the last non-Lot-1 lot, this will undo the entire subdivision.',
  parameters: {
    propertyAddress: string,  // Parent property address
    lotNumber: string,        // Lot number to delete
    confirmed: boolean        // Must be true to confirm
  }
}
```

#### Tool 5: `toggle_subdivision_collapse`
```typescript
{
  name: 'toggle_subdivision_collapse',
  description: 'Expand or collapse a subdivided property group to show/hide lots.',
  parameters: {
    propertyAddress: string   // Parent property address
  }
}
```

#### Tool 6: `undo_subdivision`
```typescript
{
  name: 'undo_subdivision',
  description: 'Reverse a subdivision, restoring the original parent property. Lot 1 events after subdivision are merged back.',
  parameters: {
    propertyAddress: string,  // Parent property address
    confirmed: boolean        // Must be true to confirm
  }
}
```

---

### Phase 2: Enhanced Event Tools for Lots

#### Update `add_*_event` tools to support lot targeting:
Add optional `lotNumber` parameter to all add event tools:
```typescript
{
  propertyAddress: string,
  lotNumber?: string,  // NEW: Target specific lot (e.g., "Lot 2")
  date: string,
  // ... other params
}
```

#### Update `list_events_for_property` to show lot events:
Include lot information in event listings for subdivided properties.

---

### Phase 3: Update ToolExecutorContext

Add new store methods to executor context:
```typescript
interface ToolExecutorContext {
  // ... existing ...

  // NEW: Lot operations
  toggleSubdivisionCollapse?: (subdivisionGroup: string) => void;

  // Helper getters
  getChildProperties?: (parentId: string) => Property[];
  getParentProperty?: (lotId: string) => Property | undefined;
}
```

---

### Phase 4: System Instructions Update

Add comprehensive subdivision/lot guidance:

```
## Subdivision & Lot Operations

### Understanding Subdivisions
- A property can be SUBDIVIDED into multiple LOTS (child properties)
- **Lot 1** is special: it CONTINUES the parent's CGT history
- **Lot 2+** start fresh from subdivision date
- Parent property becomes "retired" after subdivision (no new events allowed)

### Working with Lots
1. Use `list_lots_for_property` to see all lots and their details
2. Use `get_lot_details` for specific lot information
3. Add events to specific lots using `lotNumber` parameter
4. Use `update_lot` to change lot details
5. Use `delete_lot` to remove lots (may undo subdivision)

### Cost Base Allocation
- Subdivision costs are split proportionally by lot size
- Lot 1 inherits pre-subdivision improvements
- Each lot has its own allocated cost base

### Collapse/Expand
- Use `toggle_subdivision_collapse` to show/hide lot branches
- Collapsed subdivisions show as a single line with lot count

### Example Flows
**Adding event to a lot:**
1. "Add a $50,000 renovation to Lot 2 of 123 Main St"
2. Call list_lots_for_property to find Lot 2's ID
3. Call add_improvement_event with lotNumber: "Lot 2"

**Viewing lot details:**
1. "Show me the details of Lot 1"
2. Call get_lot_details with propertyAddress and lotNumber: "Lot 1"
```

---

### Phase 5: State Context Enhancement

Update `generateVoiceStateContext` to include:
1. Subdivision relationships
2. Lot details for each subdivided property
3. Which lots are collapsed/expanded
4. Lot 1 special status indicator

---

## Implementation Checklist

### Files to Modify:
1. `src/lib/ai-builder/voice/realtimeTools.ts`
   - [ ] Add 6 new lot management tools
   - [ ] Update add_*_event tools with lotNumber param
   - [ ] Add tool handlers in RealtimeToolExecutor
   - [ ] Update system instructions

2. `src/components/ai-builder/Voice2Controls.tsx`
   - [ ] Update generateVoiceStateContext for lots
   - [ ] Add lot context to initial state

3. `src/lib/ai-builder/voice/OpenAIRealtimeClient.ts`
   - [ ] No changes needed (tools are dynamic)

### New Helper Methods Needed in Executor:
- `findLotByNumber(parentId, lotNumber)`
- `getChildLots(parentId)`
- `getParentProperty(lotId)`
- `isSubdivided(propertyId)`

---

## Testing Scenarios

1. **Create Subdivision** - "Subdivide 123 Main St into 3 lots"
2. **List Lots** - "Show me the lots for 123 Main St"
3. **Add Event to Lot** - "Add a $30,000 kitchen renovation to Lot 2"
4. **Update Lot** - "Change Lot 2 size to 500 sqm"
5. **Delete Lot** - "Delete Lot 3 from the subdivision"
6. **Undo Subdivision** - "Undo the subdivision of 123 Main St"
7. **Collapse/Expand** - "Collapse the lots for 123 Main St"
8. **Query Lot Details** - "What's the cost base for Lot 1?"

---

## Priority Order

1. **HIGH**: list_lots_for_property, get_lot_details (query capabilities)
2. **HIGH**: Add lotNumber param to event tools (event creation on lots)
3. **MEDIUM**: update_lot, delete_lot (lot management)
4. **MEDIUM**: toggle_subdivision_collapse (UI control)
5. **LOW**: undo_subdivision (complex operation)

---

## Estimated Changes

- ~300 lines: New tool definitions
- ~200 lines: New executor handlers
- ~100 lines: System instructions update
- ~50 lines: State context enhancement
- **Total: ~650 lines**
