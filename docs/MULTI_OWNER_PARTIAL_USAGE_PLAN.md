# CGT Timeline: Multi-Owner & Partial Property Usage

## Complete Implementation Plan with UX/UI Recommendations

**Created:** December 12, 2025
**Author:** Gilbert Intabo
**Based on:** CGT Brain AI Updates Meeting (December 10, 2025)

---

# Table of Contents

1. [Meeting Context](#meeting-context)
2. [Problem Statement](#problem-statement)
3. [Current System Analysis](#current-system-analysis)
4. [Scenario 1: Multiple Owners - Design Options](#scenario-1-multiple-owners)
5. [Scenario 2: Partial Property Usage - Design Options](#scenario-2-partial-property-usage)
6. [Recommended Implementation Strategy](#recommended-implementation-strategy)
7. [Detailed Component Specifications](#detailed-component-specifications)
8. [File Changes Summary](#file-changes-summary)
9. [Implementation Roadmap](#implementation-roadmap)

---

# Meeting Context

## CGT Brain AI Updates - December 10, 2025

### Key Accomplishments
- Eric & Samson fixed critical AI ↔ Timeline communication issues
- System is now faster after removing over-engineered layers
- AI correctly interprets complex CGT scenarios including:
  - Six-year absence rule (with clock resets)
  - Investment-first properties
  - Multiple rental periods
- Successfully tested ~10 scenarios

### Tasks Assigned to Gilbert
| Task | Reference | Priority |
|------|-----------|----------|
| Multiple Owners | ATO Example 83 | High |
| Partial Property Usage | ATO Example 69 | High |
| Different PPR Nominations | Example 83 subset | High |

### Next Steps from Meeting
- Anil to send Gilbert examples for multi-owner scenarios
- Gilbert to figure out how to represent complex ownership on timeline
- System update for extensive testing

---

# Problem Statement

## ATO Example 83: Spouses with Different Main Residences

**Scenario:**
- Kathy (30%) and Grahame (70%) jointly own a townhouse (purchased July 1999)
- They also jointly own a beach house 50%/50% (purchased August 2001)
- From May 2002: Kathy moves to beach house, Grahame stays in townhouse
- Kathy nominates beach house as her PPR; Grahame nominates townhouse as his PPR
- Both properties sold April 2025

**CGT Calculation Complexity:**
- Each owner has DIFFERENT exempt periods
- Grahame: Townhouse is 100% exempt for shared period, 50% exempt for separate period (because he owns >50%)
- Kathy: Beach house is 100% exempt for separate period, townhouse only exempt for shared period
- Ownership percentages affect capital gain allocation

**What the system cannot do today:**
- Track multiple owners per property
- Store different ownership percentages
- Allow different PPR nominations per owner
- Calculate CGT separately for each owner

---

## ATO Example 69: Running Business in Part of Home

**Scenario:**
- Ruth owns 100% of her home
- For HALF the ownership period, she used 25% of floor area for photographic business
- The rooms were modified and no longer suitable for residential use
- Capital gain on sale: $80,000

**CGT Formula:**
```
Taxable = Capital Gain × Floor Area % × Time %
$10,000 = $80,000 × 25% × 50%
```

**What the system cannot do today:**
- Track floor area usage percentages
- Define income-producing periods for property zones
- Apply partial usage CGT formula
- Visualize mixed-use periods on timeline

---

# Current System Analysis

## Existing Data Model

```typescript
// Current Property (simplified)
interface Property {
  id: string;
  name: string;
  address: string;
  purchasePrice?: number;
  currentStatus?: 'ppr' | 'rental' | 'vacant' | 'sold';
  // NO owner field
  // NO ownership percentage
  // NO partial usage tracking
}

// Current Event
interface TimelineEvent {
  id: string;
  propertyId: string;
  type: EventType;  // purchase, sale, move_in, move_out, etc.
  date: Date;
  isPPR?: boolean;  // Single flag, not per-owner
  // NO owner association
}
```

## Gap Analysis

| Feature | Current | Required | Gap Severity |
|---------|---------|----------|--------------|
| Owner entity | None | Full profile system | **Critical** |
| Ownership % | None | Per-owner per-property | **Critical** |
| PPR per owner | Single boolean | Per-owner dates | **Critical** |
| Floor area zones | None | Zone definitions | **Critical** |
| Income periods | None | Per-zone tracking | **Critical** |
| CGT per owner | Single calc | Separate calcs | **High** |
| Timeline viz | Single status band | Multi-owner bands | **Medium** |

---

# Scenario 1: Multiple Owners

## Design Options Evaluated

### Option A: Separate Property Lanes per Owner

**Concept:** Each owner gets their own timeline lane for the same property address.

```
Timeline View:
┌──────────────────────────────────────────────────┐
│ 45 Collard Rd (Kathy - 30%)                      │
│ [===PPR===][------RENTAL------][SOLD]           │
├──────────────────────────────────────────────────┤
│ 45 Collard Rd (Grahame - 70%)                    │
│ [=========PPR==================][SOLD]          │
└──────────────────────────────────────────────────┘
```

**Pros:**
- Clear visual separation
- No new UI components needed
- CGT naturally separated

**Cons:**
- ❌ Duplicates property data
- ❌ Confusing - same address appears twice
- ❌ Events must be duplicated or shared awkwardly
- ❌ Doesn't scale (4 owners = 4 lanes for same property)

**Verdict:** ❌ **Not Recommended** - Creates confusion and data duplication

---

### Option B: Single Lane with Owner Dropdown/Tabs

**Concept:** One property lane with a selector to switch between owners' perspectives.

```
┌──────────────────────────────────────────────────┐
│ 45 Collard Rd    [Kathy ▼] | [Grahame]          │
│ [===PPR===][------RENTAL------][SOLD]           │
│ Showing Kathy's PPR periods                      │
└──────────────────────────────────────────────────┘
```

**Pros:**
- Single source of truth for property
- Clean timeline view
- Familiar tab/dropdown pattern

**Cons:**
- ❌ Can only see one owner at a time
- ❌ Harder to compare owners' CGT situations
- ❌ Easy to forget to check other owners
- ❌ Not intuitive that different owners have different situations

**Verdict:** ⚠️ **Acceptable but Limited** - Good for simple cases, not ideal for comparison

---

### Option C: Owner Profile System with Sub-bands (RECOMMENDED)

**Concept:** Global owner profiles + property ownership associations + thin sub-bands showing per-owner PPR status.

```
┌──────────────────────────────────────────────────┐
│ 45 Collard Rd (Kathy 30% | Grahame 70%)         │
│ Main: [===PPR===][====RENTAL====][SOLD]          │
│ ────────────────────────────────────────────────  │
│ Kathy:   [===][- - - - - - - - - -]  30%        │
│ Grahame: [====================PPR==]  70%        │
└──────────────────────────────────────────────────┘
```

**Pros:**
- ✅ Single property, multiple perspectives visible simultaneously
- ✅ Owners are reusable across properties (Kathy owns 30% of townhouse, 50% of beach house)
- ✅ Clear visual comparison of PPR periods
- ✅ Percentage clearly displayed
- ✅ Scales well (sub-bands stack vertically)
- ✅ Progressive disclosure (sub-bands only show when multiple owners exist)

**Cons:**
- More complex implementation
- Requires new owner management UI
- Sub-bands add visual complexity

**Verdict:** ✅ **RECOMMENDED** - Best balance of clarity, accuracy, and scalability

---

## ⭐ RECOMMENDATION: Option C - Owner Profile System

### Why This Approach?

1. **Data Integrity**: Single source of truth for property data. Owners are separate entities that link to properties via ownership records.

2. **Real-World Accuracy**: Mirrors how joint ownership actually works. Kathy and Grahame are real people who own shares of properties - this models that directly.

3. **Reusability**: Once you create "Kathy" as an owner, she can be associated with multiple properties with different percentages - exactly like Example 83 where she owns 30% of townhouse and 50% of beach house.

4. **Visual Clarity**: Sub-bands let users see at a glance whose PPR period is when. Green band for owner during their PPR, gray during non-PPR.

5. **CGT Calculation Ready**: When you have separate owner records with ownership percentages and PPR periods, the CGT calculation per owner becomes straightforward:
   ```
   Owner's CGT = (Total Gain × Ownership%) - (Exemption based on their PPR days)
   ```

6. **Progressive Disclosure**: For single-owner properties (majority case), no extra UI is shown. Sub-bands only appear when property has 2+ owners.

---

# Scenario 2: Partial Property Usage

## Design Options Evaluated

### Option A: New Event Types (partial_use_start/end)

**Concept:** Add event types like "Business Use Start" and "Business Use End" to the existing event system.

```
Events on timeline:
[Purchase] → [Business Use Start 25%] → [Business Use End] → [Sale]
```

**Pros:**
- Fits existing event paradigm
- Familiar interaction pattern
- Events are already visualized on timeline

**Cons:**
- ❌ Events are points in time, but usage is continuous
- ❌ Percentage doesn't naturally fit event model
- ❌ What if multiple zones? Many overlapping events
- ❌ Hard to visualize floor area allocation
- ❌ Zone concept (which part of house) gets lost

**Verdict:** ❌ **Not Recommended** - Events model doesn't fit zone-based usage well

---

### Option B: Property-Level Settings with Time Periods

**Concept:** Add usage configuration at property level that changes over time.

```
Property Panel:
┌──────────────────────────────────────────────────┐
│ Usage Mode: [Residential Only ▼]                │
│             [Partial Use]                        │
│             [Full Investment]                    │
│                                                  │
│ If Partial Use:                                 │
│ Business %: [25%] From: [2010-01] To: [2020-06] │
└──────────────────────────────────────────────────┘
```

**Pros:**
- Simple UI
- Clear percentage input
- Date range capture

**Cons:**
- ❌ Only supports one non-residential zone
- ❌ What about renting one room while using another for business?
- ❌ No visual on timeline
- ❌ Zone identity (which rooms) not captured

**Verdict:** ⚠️ **Acceptable for Simple Cases** - Doesn't handle complex multi-zone scenarios

---

### Option C: Usage Zone System with Periods (RECOMMENDED)

**Concept:** Define named zones with floor area percentages. Each zone can have multiple income-producing periods.

```
Property Panel - Usage Zones:
┌──────────────────────────────────────────────────┐
│ FLOOR AREA ALLOCATION                [+ Add Zone]│
│ ┌────────────────────────────────────────────┐  │
│ │ [====RESIDENTIAL 75%====][BUSINESS 25%]   │  │
│ └────────────────────────────────────────────┘  │
│                                                  │
│ ZONES:                                          │
│ ┌────────────────────────────────────────────┐  │
│ │ 🏠 Residential Areas              75%      │  │
│ │    Living room, bedrooms, kitchen          │  │
│ │    Always exempt (main residence)          │  │
│ └────────────────────────────────────────────┘  │
│ ┌────────────────────────────────────────────┐  │
│ │ 📷 Photographic Studio            25%      │  │
│ │    Modified for business use               │  │
│ │    Income Period: 2010-01 to 2020-06       │  │
│ │    [Add Period]                            │  │
│ └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘

Timeline Visualization:
┌──────────────────────────────────────────────────┐
│ 5 Wanda Dr                                       │
│ Main: [=========MAIN RESIDENCE=========][SOLD]  │
│ ────────────────────────────────────────────────  │
│ 25%: [//////BUSINESS//////][------------]        │
│         (Income Producing)  (Ceased)             │
└──────────────────────────────────────────────────┘
```

**Pros:**
- ✅ Named zones make it clear which part of property
- ✅ Multiple zones supported (office + granny flat rental)
- ✅ Each zone can have multiple income periods
- ✅ Visual floor area bar shows proportion at a glance
- ✅ Striped timeline overlay shows when business/rental active
- ✅ Directly maps to ATO formula: Gain × Area% × Time%
- ✅ Progressive disclosure (hidden until enabled)

**Cons:**
- Most complex implementation
- Requires new zone management UI
- Striped patterns may look busy

**Verdict:** ✅ **RECOMMENDED** - Accurately models ATO requirements for partial usage

---

## ⭐ RECOMMENDATION: Option C - Usage Zone System

### Why This Approach?

1. **ATO Compliance**: The ATO formula explicitly uses:
   - Floor area percentage (A)
   - Time percentage (C)
   - This model captures both directly

2. **Real-World Flexibility**: People have complex situations:
   - Home office in spare bedroom (10%)
   - Granny flat rented out (20%)
   - Rest is main residence (70%)
   - Each zone has different income periods

3. **Visual Clarity**: The horizontal bar chart instantly shows the split. Users can see "25% of my home is business" without reading numbers.

4. **Audit Trail**: Named zones with descriptions provide documentation:
   - "Photographic Studio - modified for business, separate entrance"
   - This supports the CGT claim with clear records

5. **Progressive Disclosure**: 95% of users have simple main residence. They never see the zones UI. Only users who enable "partial usage" see this complexity.

6. **Timeline Integration**: Striped overlay on property lane shows exactly when partial use was active. A CGT expert reviewing the timeline immediately sees the business use period.

---

# Recommended Implementation Strategy

## Combined Architecture

The two features share a common pattern: **progressive disclosure with layered information**.

```
                    ┌─────────────────────────┐
                    │     PROPERTY LANE       │
                    ├─────────────────────────┤
    Standard View → │  Main Status Band       │  (always visible)
                    ├─────────────────────────┤
 Multi-Owner View → │  Owner PPR Sub-bands    │  (if 2+ owners)
                    ├─────────────────────────┤
 Partial Use View → │  Zone Usage Overlay     │  (if partial use enabled)
                    └─────────────────────────┘
```

## Data Model Design

```typescript
// ============================================
// OWNER SYSTEM
// ============================================

interface Owner {
  id: string;
  name: string;
  color: string;                    // For visual identification
  taxResidencyStatus: 'australian' | 'foreign' | 'temporary';
  createdAt: Date;
}

interface PropertyOwnership {
  id: string;
  propertyId: string;
  ownerId: string;
  ownershipPercentage: number;      // 0-100, must total 100 per property
  acquisitionDate: Date;            // When this owner acquired their share
  disposalDate?: Date;              // When they disposed (if different from property sale)
  isPPRForOwner: boolean;           // Is this their nominated PPR?
  pprPeriods: PPRPeriod[];          // When was it their PPR?
}

interface PPRPeriod {
  id: string;
  startDate: Date;
  endDate?: Date;                   // null = ongoing
}

// ============================================
// PARTIAL USAGE SYSTEM
// ============================================

interface PropertyUsageZone {
  id: string;
  propertyId: string;
  name: string;                     // "Photographic Studio", "Granny Flat"
  description?: string;             // Notes for documentation
  floorAreaPercentage: number;      // 0-100, all zones must total 100
  usageType: 'residential' | 'business' | 'rental' | 'mixed';
  icon?: string;                    // Lucide icon name
  color?: string;                   // For visualization
}

interface UsagePeriod {
  id: string;
  zoneId: string;
  startDate: Date;
  endDate?: Date;                   // null = ongoing
  incomeProducing: boolean;         // Was this zone producing income?
  notes?: string;                   // Documentation
}

// ============================================
// EXTENDED PROPERTY
// ============================================

interface Property {
  // ... existing fields ...

  // Multi-owner support
  ownerships: PropertyOwnership[];  // Empty array = single owner (legacy)

  // Partial usage support
  partialUsageEnabled: boolean;     // Toggle for progressive disclosure
  usageZones: PropertyUsageZone[];  // Empty until enabled
}
```

---

# Detailed Component Specifications

## Multi-Owner Components

### 1. OwnerManagementPanel

**Purpose:** Create and manage owner profiles

**Location:** New tab in sidebar or floating panel from TimelineControls

**Mockup:**
```
┌─────────────────────────────────────────────────────────┐
│  👥 OWNERS                                    [+ Add]   │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🔵 Kathy                                        │   │
│  │    Australian Resident                          │   │
│  │    Properties: Townhouse (30%), Beach House (50%)│   │
│  │                                    [Edit] [❌]   │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🟢 Grahame                                      │   │
│  │    Australian Resident                          │   │
│  │    Properties: Townhouse (70%), Beach House (50%)│   │
│  │                                    [Edit] [❌]   │   │
│  └─────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│  💡 Tip: Add owners to track joint property ownership   │
│     and calculate CGT separately for each owner.        │
└─────────────────────────────────────────────────────────┘
```

**Interactions:**
- [+ Add] → Opens AddOwnerModal
- [Edit] → Opens EditOwnerModal
- [❌] → Confirmation dialog, then removes owner
- Clicking owner row → Highlights their properties on timeline

**State:**
```typescript
// In timeline store
owners: Owner[];
addOwner: (owner: Omit<Owner, 'id' | 'createdAt'>) => void;
updateOwner: (id: string, updates: Partial<Owner>) => void;
deleteOwner: (id: string) => void;
```

---

### 2. PropertyOwnershipModal

**Purpose:** Configure ownership % and PPR for each owner on a property

**Trigger:** "Ownership" button in PropertyPanel (only visible when owners exist)

**Mockup:**
```
┌─────────────────────────────────────────────────────────────┐
│  PROPERTY OWNERSHIP                                    [X]  │
│  45 Collard Road, Humpty Doo                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  OWNERSHIP ALLOCATION                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [========= Kathy 30% =========][=== Grahame 70% ===]│   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🔵 Kathy                                            │   │
│  │    Ownership: [30] %                                │   │
│  │    ☑️ This is Kathy's main residence                │   │
│  │    PPR Period: [2003-01-01] to [2019-05-01]        │   │
│  │                                      [Remove Owner] │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🟢 Grahame                                          │   │
│  │    Ownership: [70] %                                │   │
│  │    ☑️ This is Grahame's main residence              │   │
│  │    PPR Period: [2003-01-01] to [present]           │   │
│  │                                      [Remove Owner] │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Total Ownership: 100% ✅                                   │
│  [+ Add Another Owner]                                      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ⚠️ Percentages must add to 100%                     │   │
│  │    Currently: 100% ✅                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│           [Cancel]                    [Save Changes]        │
└─────────────────────────────────────────────────────────────┘
```

**Validation Rules:**
- All ownership percentages must sum to exactly 100%
- Each owner can only appear once per property
- PPR dates must be within property ownership period
- At least one owner required if modal is open

**State:**
```typescript
// In timeline store
setPropertyOwnership: (propertyId: string, ownerships: PropertyOwnership[]) => void;
addOwnerToProperty: (propertyId: string, ownership: PropertyOwnership) => void;
removeOwnerFromProperty: (propertyId: string, ownerId: string) => void;
```

---

### 3. OwnerPPRBands (SVG Component)

**Purpose:** Visualize per-owner PPR periods as thin colored bands below main status band

**Location:** Rendered inside PropertyBranch.tsx, below PropertyStatusBands

**Visual Specification:**
```
Band Height: 4px per owner
Band Spacing: 1px between bands
Colors:
  - PPR Active: Owner's color at 100% opacity
  - PPR Inactive: Owner's color at 20% opacity (grayed out)
  - Border: 1px solid with owner's color

Hover: Tooltip shows "Kathy (30%): PPR Jan 2003 - May 2019"
Click: Opens PropertyOwnershipModal
```

**Implementation Notes:**
- Only render if property has 2+ ownerships
- Stack vertically (Kathy on top, Grahame below)
- Use Framer Motion for smooth transitions when dates change
- Respect current zoom level for date positioning

---

### 4. OwnerCGTResultsView

**Purpose:** Display separate CGT calculations for each owner

**Location:** Replace or augment PropertyAnalysisCard in CGTAnalysisDisplay

**Mockup:**
```
┌─────────────────────────────────────────────────────────────┐
│  CGT ANALYSIS: 45 Collard Road, Humpty Doo                 │
│                                                             │
│  [🔵 Kathy (30%)] | [🟢 Grahame (70%)]  ← Tabbed interface │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  KATHY'S CGT CALCULATION                                   │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                             │
│  OWNERSHIP DETAILS                                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Ownership Share:              30%                   │   │
│  │ Acquisition Date:             01 Jul 1999           │   │
│  │ Disposal Date:                15 Apr 2025           │   │
│  │ Ownership Period:             9,421 days            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  CAPITAL GAIN ALLOCATION                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Total Property Gain:          $100,000              │   │
│  │ Kathy's Share (30%):          $30,000               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  MAIN RESIDENCE EXEMPTION                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ PPR Days (before May 2002):   1,035 days            │   │
│  │ Total Ownership Days:         9,421 days            │   │
│  │ Exempt Percentage:            10.99%                │   │
│  │                                                     │   │
│  │ Exempt Amount:                                      │   │
│  │ $30,000 × (1,035 ÷ 9,421) = $3,296                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  FINAL CALCULATION                                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Kathy's Share:                $30,000               │   │
│  │ Less: Exempt Amount:          -$3,296               │   │
│  │ Taxable Capital Gain:         $26,704               │   │
│  │ Less: 50% Discount:           -$13,352              │   │
│  │ ─────────────────────────────────────────────────   │   │
│  │ NET CAPITAL GAIN:             $13,352               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Partial Usage Components

### 5. PartialUsageToggle

**Purpose:** Enable/disable partial usage tracking for a property

**Location:** PropertyPanel header area (below property name)

**Mockup:**
```
┌─────────────────────────────────────────────────────────────┐
│  5 Wanda Dr, Boyne Island                                  │
│  ─────────────────────────────────────────────────────────  │
│  ☐ Enable partial property usage                           │
│    Track when parts of your property are used for business │
│    or rental purposes                                       │
└─────────────────────────────────────────────────────────────┘
```

**Behavior:**
- When enabled: Shows UsageZoneEditor section below
- When disabled: Hides all zone configuration
- Default: Disabled (progressive disclosure)

---

### 6. UsageZoneEditor

**Purpose:** Define floor area zones with percentages

**Location:** PropertyPanel, visible only when partial usage enabled

**Mockup:**
```
┌─────────────────────────────────────────────────────────────┐
│  FLOOR AREA ALLOCATION                         [+ Add Zone] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  VISUAL BREAKDOWN                                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │[======= RESIDENTIAL 75% =======][BUSINESS 25%]     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ZONES                                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🏠 Residential Areas                         75%    │   │
│  │    Living room, bedrooms, kitchen, bathrooms        │   │
│  │    [Always exempt as main residence]                │   │
│  │                                        [Edit] [❌]   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📷 Photographic Studio                       25%    │   │
│  │    Two rooms modified for business                  │   │
│  │    [1 income period defined]                        │   │
│  │                                        [Edit] [❌]   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Total: 100% ✅                                             │
│                                                             │
│  ⚠️ All zones must add up to 100% of floor area            │
└─────────────────────────────────────────────────────────────┘
```

**Zone Types:**
- `residential` - Main residence, fully exempt
- `business` - Used for business (home office, studio)
- `rental` - Rented to others (granny flat)
- `mixed` - Sometimes residential, sometimes other

---

### 7. UsagePeriodTimeline

**Purpose:** Define income-producing periods for non-residential zones

**Location:** Expanded view when clicking on a zone in UsageZoneEditor

**Mockup:**
```
┌─────────────────────────────────────────────────────────────┐
│  📷 PHOTOGRAPHIC STUDIO (25%)                          [X] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  INCOME-PRODUCING PERIODS                                  │
│  Define when this zone was used for income                 │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Period 1:                                           │   │
│  │ From: [2010-01-01]  To: [2020-06-30]               │   │
│  │ ☑️ Income producing during this period              │   │
│  │ Notes: Full-time photography business               │   │
│  │                                          [Remove]   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [+ Add Another Period]                                    │
│                                                             │
│  TIMELINE VISUALIZATION                                    │
│  Ownership: 2005 ─────────────────────────────── 2024      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │[----][////////INCOME////////][--------][SOLD]      │   │
│  │ No   2010          2020      No income              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  SUMMARY                                                   │
│  Total ownership: 19 years                                 │
│  Income period: 10.5 years (55%)                          │
│                                                             │
│                              [Cancel]    [Save Changes]    │
└─────────────────────────────────────────────────────────────┘
```

---

### 8. PartialUsageStatusBand (SVG Component)

**Purpose:** Striped overlay on timeline showing partial usage periods

**Location:** Rendered in PropertyBranch, as overlay on main status band

**Visual Specification:**
```
Pattern: Diagonal stripes (45° angle)
Stripe Width: 3px
Gap: 3px
Colors by usage type:
  - business: Orange stripes (#F97316)
  - rental: Blue stripes (#3B82F6)
  - mixed: Purple stripes (#8B5CF6)

Opacity:
  - Income producing: 60%
  - Not income producing: 0% (invisible)

Hover: Tooltip shows "Business use 25% (income: 2010-2020)"
```

**Implementation:**
- Use SVG `<pattern>` for stripes
- Animate stripe movement on hover (optional flair)
- Layer on top of main status band but below events

---

### 9. PartialUsageCGTCalculation

**Purpose:** Display the ATO partial usage formula with step-by-step calculation

**Location:** Within CalculationBreakdownSection in CGT results

**Mockup:**
```
┌─────────────────────────────────────────────────────────────┐
│  PARTIAL USAGE ADJUSTMENT                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  This property had partial business use, affecting the     │
│  main residence exemption.                                 │
│                                                             │
│  USAGE BREAKDOWN                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Zone: Photographic Studio                           │   │
│  │ Floor Area: 25% of property                         │   │
│  │ Income Period: 10.5 years of 19 years (55%)        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ATO FORMULA                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Taxable Portion = Gain × Area% × Time%              │   │
│  │                                                     │   │
│  │ Capital Gain:           $80,000                     │   │
│  │ × Floor Area %:         25%                         │   │
│  │ × Income Time %:        55%                         │   │
│  │ ─────────────────────────────────────────────────   │   │
│  │ = Taxable Amount:       $11,000                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  EXEMPTION BREAKDOWN                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Fully Exempt (75% residential):    $60,000          │   │
│  │ Partially Exempt (25% × 45%):      $9,000           │   │
│  │ Taxable (25% × 55%):               $11,000          │   │
│  │ ─────────────────────────────────────────────────   │   │
│  │ Total:                             $80,000 ✅       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

# File Changes Summary

## New Files to Create

| File | Purpose |
|------|---------|
| `src/components/OwnerManagementPanel.tsx` | Owner profiles panel |
| `src/components/AddOwnerModal.tsx` | Create new owner |
| `src/components/PropertyOwnershipModal.tsx` | Configure ownership |
| `src/components/timeline-viz/OwnerPPRBands.tsx` | Owner PPR visualization |
| `src/components/ai-response/OwnerCGTResultsView.tsx` | Per-owner CGT display |
| `src/components/PartialUsageSection.tsx` | Container for partial usage UI |
| `src/components/UsageZoneEditor.tsx` | Zone configuration |
| `src/components/UsageZoneModal.tsx` | Edit zone details |
| `src/components/UsagePeriodTimeline.tsx` | Income period editor |
| `src/components/timeline-viz/PartialUsageStatusBand.tsx` | Striped overlay |
| `src/components/ai-response/PartialUsageCGTCalculation.tsx` | Formula display |
| `src/types/owner.ts` | Owner-related types |
| `src/types/usage-zone.ts` | Usage zone types |

## Existing Files to Modify

| File | Changes |
|------|---------|
| `src/store/timeline.ts` | Add Owner, PropertyOwnership, UsageZone, UsagePeriod to state; add CRUD methods |
| `src/components/PropertyBranch.tsx` | Render OwnerPPRBands and PartialUsageStatusBand |
| `src/components/PropertyPanel.tsx` | Add Ownership button, Partial Usage toggle and section |
| `src/components/TimelineControls.tsx` | Add OwnerManagementPanel access button |
| `src/components/ai-response/CGTAnalysisDisplay.tsx` | Integrate OwnerCGTResultsView and PartialUsageCGTCalculation |
| `src/components/ai-response/CalculationBreakdownSection.tsx` | Add partial usage calculation section |
| `src/lib/transform-timeline-data.ts` | Transform owner and zone data for API (future) |

---

# Implementation Roadmap

## Phase 1: Data Foundation

**Goal:** Establish data types and store structure

**Tasks:**
1. Create `src/types/owner.ts` with Owner, PropertyOwnership, PPRPeriod interfaces
2. Create `src/types/usage-zone.ts` with PropertyUsageZone, UsagePeriod interfaces
3. Update `src/store/timeline.ts`:
   - Add `owners: Owner[]` to state
   - Add ownership and zone arrays to Property interface
   - Add CRUD methods for owners
   - Add CRUD methods for property ownerships
   - Add CRUD methods for usage zones and periods

**Deliverable:** Store compiles with new types, no UI changes yet

---

## Phase 2: Multi-Owner UI

**Goal:** Users can create owners and assign to properties

**Tasks:**
1. Create `OwnerManagementPanel.tsx`
2. Create `AddOwnerModal.tsx`
3. Create `PropertyOwnershipModal.tsx`
4. Modify `PropertyPanel.tsx` to show Ownership button (when owners exist)
5. Modify `TimelineControls.tsx` to show Owners button
6. Test: Can create owners, assign to properties, set percentages

**Deliverable:** Fully functional owner assignment without timeline visualization

---

## Phase 3: Multi-Owner Timeline Visualization

**Goal:** Show owner PPR periods on timeline

**Tasks:**
1. Create `OwnerPPRBands.tsx` SVG component
2. Modify `PropertyBranch.tsx` to render owner bands
3. Style bands with owner colors, opacity states
4. Add hover tooltips
5. Test with multiple owners, overlapping PPR periods

**Deliverable:** Timeline shows per-owner PPR bands

---

## Phase 4: Multi-Owner CGT Display

**Goal:** Show separate CGT calculations per owner

**Tasks:**
1. Create `OwnerCGTResultsView.tsx` with tabbed interface
2. Modify `CGTAnalysisDisplay.tsx` to use owner tabs when applicable
3. Format calculations according to ATO formulas
4. Test with Example 83 scenario

**Deliverable:** CGT results show per-owner breakdown

---

## Phase 5: Partial Usage UI

**Goal:** Users can define floor area zones

**Tasks:**
1. Create `PartialUsageSection.tsx` with toggle
2. Create `UsageZoneEditor.tsx`
3. Create `UsageZoneModal.tsx`
4. Create `UsagePeriodTimeline.tsx`
5. Modify `PropertyPanel.tsx` to include partial usage section
6. Test: Can enable partial usage, add zones, define periods

**Deliverable:** Fully functional zone configuration without timeline visualization

---

## Phase 6: Partial Usage Timeline Visualization

**Goal:** Show usage zones on timeline

**Tasks:**
1. Create `PartialUsageStatusBand.tsx` with stripe patterns
2. Modify `PropertyBranch.tsx` to render zone overlays
3. Style with usage type colors
4. Add hover tooltips
5. Test with multiple zones, various income periods

**Deliverable:** Timeline shows striped overlays for partial usage

---

## Phase 7: Partial Usage CGT Display

**Goal:** Show partial usage formula in CGT results

**Tasks:**
1. Create `PartialUsageCGTCalculation.tsx`
2. Modify `CalculationBreakdownSection.tsx` to include when applicable
3. Format according to ATO formula
4. Test with Example 69 scenario

**Deliverable:** CGT results show partial usage breakdown

---

## Phase 8: Integration & Polish

**Goal:** Ensure both features work together

**Tasks:**
1. Test: Property with multiple owners AND partial usage
2. Verify CGT calculations combine both adjustments correctly
3. UI polish: transitions, loading states, error handling
4. Update CLAUDE.md with new features documentation
5. User testing feedback incorporation

**Deliverable:** Production-ready features

---

# Success Criteria

## Example 83 (Multi-Owner) Must Work:
- [ ] Can create Kathy and Grahame as owners
- [ ] Can assign Kathy 30%, Grahame 70% to townhouse
- [ ] Can assign Kathy 50%, Grahame 50% to beach house
- [ ] Can set different PPR nominations per owner
- [ ] Timeline shows owner sub-bands
- [ ] CGT calculates separately for each owner
- [ ] Results match ATO example calculations

## Example 69 (Partial Usage) Must Work:
- [ ] Can enable partial usage for property
- [ ] Can define 75% residential, 25% business zones
- [ ] Can set business zone income period (half of ownership)
- [ ] Timeline shows striped overlay for business use
- [ ] CGT applies formula: Gain × Area% × Time%
- [ ] Results match ATO example ($10,000 taxable)

---

# Appendix: ATO Reference Calculations

## Example 83 - Grahame's Townhouse CGT

```
Total Capital Gain: $100,000
Grahame's Share (70%): $70,000

Period 1 - Joint Residence (1 Jul 1999 - 30 Apr 2002):
  Days: 1,035
  Exemption: $70,000 × (1,035 ÷ 9,421) = $7,690

Period 2 - Different Homes (1 May 2002 - 15 Apr 2025):
  Days: 8,386
  Since Grahame owns >50%, 50% of this period is exempt
  Exemption: $70,000 × 50% × (8,386 ÷ 9,421) = $31,155

Total Exempt: $7,690 + $31,155 = $38,845
Taxable: $70,000 - $38,845 = $31,155
```

## Example 69 - Ruth's Partial Business Use

```
Total Capital Gain: $80,000
Business Floor Area: 25%
Business Period: 50% of ownership

Exempt (75% always residential): $80,000 × 75% = $60,000
Exempt (25% × 50% non-business): $80,000 × 25% × 50% = $10,000
Taxable (25% × 50% business): $80,000 × 25% × 50% = $10,000

Total: $60,000 + $10,000 + $10,000 = $80,000 ✅
```
