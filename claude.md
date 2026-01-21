# CGT Timeline - Project Memory

This file serves as the project's memory and workflow guide. All instructions here should be followed automatically when working on this codebase.

---

## Project Overview

**CGT Timeline** is an interactive web application for visualizing and calculating Capital Gains Tax (CGT) obligations for Australian property portfolios. Built for Tax Simple Australia.

### Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS with dark mode
- **State**: Zustand
- **UI**: Radix UI + Lucide Icons + Framer Motion
- **PDF**: @react-pdf/renderer, jspdf, html2canvas
- **Charts**: Recharts
- **DnD**: @dnd-kit
- **Storage**: Vercel KV (Redis)
- **Email**: Resend API

### Key Features
1. Interactive GitHub-style timeline visualization
2. Multi-property portfolio management
3. 11 event types (purchase, sale, move in/out, improvements, etc.)
4. Drag & drop event repositioning
5. Dynamic cost base tracking (5 CGT elements)
6. AI-powered CGT analysis
7. Verification alerts for timeline gaps
8. PDF export (reports, visualizations, cost base summaries)
9. Shareable timeline links
10. Dark mode support
11. **AI Timeline Builder** - Voice/text interface for building timelines
    - Voice interaction (Deepgram STT + ElevenLabs TTS)
    - Multi-LLM support (Deepseek, Claude, GPT-4, Gemini)
    - Document upload & extraction
    - Full undo/redo support
12. **Admin Dashboard** - Review AI outputs and track accuracy
    - CGT Analysis testing with multiple LLM providers
    - Tax Agent Review (annotation queue, correctness rating)
    - Accuracy Dashboard (metrics by scenario/LLM, training data export)
    - Accessible via Settings with admin credentials

---

## Git Workflow

### Branch Strategy
- **master** - Production branch (never push directly)
- **GilbertBranch** - Current main development branch
- **EricBranch** - Additional development branch

### Rules
1. Always work on feature branches (GilbertBranch or create new branch)
2. Never push directly to master
3. Merge to master via pull requests or explicit merges
4. Commit regularly with descriptive messages
5. **NEVER push code to remote unless explicitly told to do so by the user** - Always wait for user confirmation before pushing

### Commit Message Format
```
[Action] [Brief description]

[Optional detailed explanation]
```

**Examples**:
- `Add verification alert system for timeline gaps`
- `Fix calculation matching logic in property cards`
- `Improve PDF export with detailed cost base breakdown`

**Patterns**:
- Use "Add" for new features
- Use "Fix" for bug fixes
- Use "Improve/Enhance" for improvements
- Use "Update" for changes/modifications
- Focus on WHAT changed, not HOW

---

## Development

### Commands
```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Environment Variables
Create `.env.local` with:
```env
# API Configuration
NEXT_PUBLIC_CGT_MODEL_API_URL=https://cgtbrain.com.au/api/v1/analyze-portfolio

# Vercel KV (for shareable links)
KV_URL=your_vercel_kv_url
KV_REST_API_URL=your_kv_rest_url
KV_REST_API_TOKEN=your_kv_token
KV_REST_API_READ_ONLY_TOKEN=your_kv_read_token

# Email (Resend)
RESEND_API_KEY=your_resend_key

# AI Timeline Builder - LLM Providers (at least one required)
DEEPSEEK_API_KEY=your_deepseek_key        # Deepseek V3 (default, recommended)
ANTHROPIC_API_KEY=your_anthropic_key      # Claude Sonnet 4
OPENAI_API_KEY=your_openai_key            # GPT-4 Turbo
GOOGLE_AI_API_KEY=your_google_ai_key      # Gemini 2.0 Flash

# AI Timeline Builder - Voice Services (optional, enables voice features)
DEEPGRAM_API_KEY=your_deepgram_key        # Speech-to-Text (Nova-2)
ELEVENLABS_API_KEY=your_elevenlabs_key    # Text-to-Speech

# Admin Dashboard (optional, connects to CGT Brain RAG backend)
# NEXT_PUBLIC_ADMIN_API_URL=https://cgtbrain.com.au  # Default
```

**Notes**:
- If `NEXT_PUBLIC_CGT_MODEL_API_URL` is not set, app uses mock responses.
- For AI Timeline Builder, at least one LLM API key is required (Deepseek is default).
- Voice features require both DEEPGRAM_API_KEY and ELEVENLABS_API_KEY.
- Admin Dashboard defaults to https://cgtbrain.com.au for the RAG backend.

---

## Architecture

### Directory Structure
```
src/
├── app/                           # Next.js App Router
│   ├── api/                       # API routes
│   │   ├── analyze-cgt/          # Main CGT analysis endpoint
│   │   ├── analyze-with-resolution/ # With verification
│   │   ├── suggest-questions/    # AI question suggestions
│   │   ├── send-email/           # Email functionality
│   │   └── timeline/             # Timeline sharing (save/load)
│   ├── page.tsx                  # Main application page
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles & theme
├── components/                   # React components
│   ├── Timeline.tsx              # Main timeline container
│   ├── PropertyBranch.tsx        # Property lane visualization
│   ├── EventCard.tsx             # Event card display
│   ├── EventCircle.tsx           # Event circle display
│   ├── PropertyPanel.tsx         # Side panel (property details)
│   ├── TimelineControls.tsx      # Zoom/pan controls
│   ├── QuickAddMenu.tsx          # Right-click menu
│   ├── ConversationBox.tsx       # AI chat interface
│   ├── VerificationAlertBar.tsx  # Alert overlays
│   ├── ai-response/              # AI analysis display
│   │   ├── CGTAnalysisDisplay.tsx
│   │   ├── PropertyAnalysisCard.tsx
│   │   ├── CalculationBreakdownSection.tsx
│   │   ├── DetailedReportSection.tsx
│   │   └── CGTReportPDF.tsx
│   ├── admin/                    # Admin dashboard components
│   │   ├── AdminLoginModal.tsx   # Login with credentials
│   │   ├── AdminPage.tsx         # Main admin page with tabs
│   │   ├── ChatPanel.tsx         # Follow-up questions chat
│   │   ├── AnnotationPanel.tsx   # Tax agent review
│   │   └── AccuracyDashboard.tsx # AI engineer dashboard
│   ├── timeline-viz/             # Visualization modes
│   └── ui/                       # Reusable UI primitives
├── store/                        # Zustand state
│   ├── timeline.ts               # Main timeline state (1500+ lines!)
│   └── validation.ts             # Validation state
├── lib/                          # Utilities
│   ├── utils.ts                  # General utilities (cn, formatCurrency)
│   ├── cost-base-definitions.ts  # Cost base categories
│   ├── transform-timeline-data.ts # API transformations
│   ├── timeline-serialization.ts # Save/load
│   └── extract-verification-alerts.ts # Alert extraction
└── types/                        # TypeScript types
    ├── model-response.ts
    ├── verification-alert.ts
    └── suggested-questions.ts
```

### State Management (Zustand)

**Main Store**: `src/store/timeline.ts`
- Single source of truth
- Properties, events, UI state, AI responses
- 1500+ lines of comprehensive state management

**Key Methods**:
```typescript
// Properties
addProperty(property)
updateProperty(id, property)
deleteProperty(id)

// Events
addEvent(event)
updateEvent(id, event)
deleteEvent(id)
moveEvent(id, newPosition)

// Timeline Control
setZoom(zoom)
zoomIn() / zoomOut()
panToDate(date)
panToPosition(position)

// Data
loadDemoData()
clearAllData()
importTimelineData(data)

// AI & Verification
setAIResponse(response)
setVerificationAlerts(alerts)
resolveVerificationAlert(alertId, userResponse)
```

---

## Code Standards

### Component Structure
Always follow this pattern:

```typescript
'use client';  // For interactive components

// 1. Imports: React, external libs, internal components, stores, types, utils
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTimelineStore } from '@/store/timeline';
import { cn } from '@/lib/utils';

// 2. Props interface
interface ComponentProps {
  property: Property;
  events: TimelineEvent[];
  onEventClick: (event: TimelineEvent) => void;
}

// 3. Default export with destructured props
export default function Component({ property, events, onEventClick }: ComponentProps) {
  // State hooks
  const [isOpen, setIsOpen] = useState(false);

  // Store hooks
  const { selectProperty, updateEvent } = useTimelineStore();

  // Event handlers
  const handleClick = () => {
    // ...
  };

  // Render
  return (
    <div className={cn("base-classes", conditionalClasses)}>
      {/* JSX */}
    </div>
  );
}
```

### TypeScript Conventions
- **Strict mode enabled**
- Use `@/` path alias for imports
- Explicit prop types for all components
- Define types in `src/types/` for shared types
- Use union types for enums (EventType, PropertyStatus, etc.)

**Key Types**:
```typescript
type EventType = 'purchase' | 'move_in' | 'move_out' | 'rent_start' |
                 'rent_end' | 'sale' | 'improvement' | 'refinance' |
                 'status_change' | 'living_in_rental_start' | 'living_in_rental_end';

type PropertyStatus = 'ppr' | 'rental' | 'vacant' | 'construction' | 'sold' | 'living_in_rental';

type ZoomLevel = '30-years' | 'decade' | 'multi-year' | 'years' | 'year' |
                 'months' | 'month' | 'weeks' | 'days';
```

### Styling Patterns

**Use `cn()` utility for conditional classes**:
```typescript
className={cn(
  "base-classes always-applied",
  isSelected && "selected-state-classes",
  isDragging ? "dragging-classes" : "default-classes"
)}
```

**Dark Mode**: Use Tailwind's class-based dark mode
```typescript
className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
```

**Common Patterns**:
- Cards: `bg-white dark:bg-gray-800 rounded-lg shadow-md p-4`
- Buttons: Use Radix UI Button with variants
- Animations: Framer Motion for complex, CSS for simple
- Responsive: Mobile-first, use `sm:`, `md:`, `lg:` breakpoints

### File Naming
- Components: PascalCase (`PropertyBranch.tsx`, `EventCard.tsx`)
- Utilities: camelCase (`utils.ts`, `cost-base-definitions.ts`)
- Types: kebab-case (`model-response.ts`, `verification-alert.ts`)
- API Routes: kebab-case folders with `route.ts`

---

## Key Systems

### 1. Timeline Event System

**11 Event Types**:
1. `purchase` - Property purchase
2. `sale` - Property sale
3. `move_in` - Move into property
4. `move_out` - Move out of property
5. `rent_start` - Start renting to tenants
6. `rent_end` - Stop renting
7. `improvement` - Capital improvements
8. `refinance` - Loan refinancing
9. `status_change` - Manual status change
10. `living_in_rental_start` - Start living in rental property
11. `living_in_rental_end` - Stop living in rental

**Event Lifecycle**:
1. User clicks timeline → `QuickAddMenu` opens
2. User selects type → `addEvent()` in store
3. Store generates ID, color, adds to array
4. Timeline re-renders
5. Can edit via `EventDetailsModal`
6. Can drag (if enabled) → `moveEvent()` updates date

### 2. Zoom/Pan System

**9 Zoom Levels**: `30-years` → `decade` → `multi-year` → `years` → `year` → `months` → `month` → `weeks` → `days`

**Controls**:
- Mouse wheel: Zoom in/out
- Click zoom buttons: Change level
- Drag timeline: Pan left/right
- Smart zoom: Centers on last interacted event

### 3. Cost Base System

**5 CGT Cost Base Elements**:
1. First Element - Purchase price
2. Incidental costs (acquire) - Stamp duty, legal fees, etc.
3. Capital improvements - Renovations, additions
4. Incidental costs (ownership) - Interest, rates (if not claimed)
5. Selling costs - Agent fees, advertising, legal

**Dynamic Cost Base Items**:
```typescript
interface CostBaseItem {
  id: string;
  definitionId: string;  // Predefined or 'custom'
  name: string;
  amount: number;
  category: CostBaseCategory;
  isCustom: boolean;
  description?: string;
}
```

**Predefined Definitions**: See `src/lib/cost-base-definitions.ts`

### 4. Verification Alert System

**Flow**:
1. API returns validation issues
2. `extractVerificationAlerts()` converts to timeline format
3. `setVerificationAlerts()` stores with property matching
4. `VerificationAlertBar` renders on timeline
5. User clicks → `AlertResolutionModal` opens
6. User answers → `resolveVerificationAlert()` marks resolved
7. Auto-advances to next unresolved

### 5. AI API Integration

**Endpoint**: `/api/analyze-cgt`
**Flow**:
1. Transform timeline data: `transformTimelineToAPIFormat()`
2. POST to API with properties + history
3. API forwards to external AI or returns mock
4. Extract verification alerts, calculations
5. Store in Zustand: `setAIResponse()`
6. Render: `CGTAnalysisDisplay`

**Mock Mode**: If `NEXT_PUBLIC_CGT_MODEL_API_URL` not set, uses mock data

### 6. Property Status System

**Status Types & Colors**:
- `ppr` (Main Residence) - Green
- `rental` - Blue
- `vacant` - Blue (no label)
- `construction` - Orange
- `sold` - Purple
- `living_in_rental` - Pink

**Status Calculation**: `calculateStatusPeriods(events)` determines from event types

---

## Common Tasks

### Add a New Event Type

1. **Update type definition** (`src/types/` or component):
```typescript
type EventType = 'purchase' | 'sale' | ... | 'your_new_type';
```

2. **Add to event colors** (in store or component):
```typescript
const EVENT_COLORS = {
  // ...
  your_new_type: '#COLOR_CODE',
};
```

3. **Add to QuickAddMenu** (`src/components/QuickAddMenu.tsx`):
```typescript
const eventOptions = [
  // ...
  { type: 'your_new_type', label: 'Your New Event', icon: YourIcon },
];
```

4. **Handle in event details modal** if special fields needed

5. **Update API transformation** if API needs this event type

### Add a New Component

1. Create file: `src/components/YourComponent.tsx`
2. Follow component structure template (see Code Standards)
3. Import and use in parent component
4. Add TypeScript types for props
5. Use Tailwind for styling
6. Add dark mode classes

### Add a New API Endpoint

1. Create route: `src/app/api/your-endpoint/route.ts`
2. Export `GET`, `POST`, etc. handlers
3. Use `NextRequest` and `NextResponse`
4. Add error handling
5. Document in this file if significant

### Add a New Visualization Mode

1. Create component in `src/components/timeline-viz/`
2. Add to visualization switcher
3. Accept same props as other viz modes
4. Render timeline data in new format
5. Handle zoom/pan if needed

---

## Testing & Quality

### Current State
- **No test suite currently** (TODO: Add tests)
- Manual testing via `npm run dev`
- Browser testing (Chrome, Safari, Firefox)

### Code Quality Expectations
- TypeScript strict mode compliance
- No console errors or warnings
- Dark mode support for all UI
- Responsive design (mobile-first)
- Error handling (try/catch for async ops)
- Loading states for async operations

### Console Logging Conventions
Use emojis for easy scanning:
```typescript
console.log('📍 Checkpoint:', data);
console.log('✅ Success:', result);
console.log('❌ Error:', error);
console.log('🔍 Debug:', value);
console.log('📤 Sending:', payload);
console.log('📥 Received:', response);
```

---

## Debugging

### Common Issues

**Timeline not rendering**:
- Check Zustand store: Are properties/events loaded?
- Check console for errors
- Verify date parsing (events must have valid Date objects)

**API errors**:
- Check `.env.local` configuration
- Check Network tab: Is request sent? What's response?
- Verify mock mode fallback

**Drag & drop not working**:
- Check if events have IDs
- Verify @dnd-kit setup
- Check event handlers in Timeline.tsx

**Calculations not showing**:
- Check if `calculations` prop is passed correctly
- Verify property matching logic (address vs property_id)
- Check for undefined/null in calculation data

### Browser DevTools
1. **Console**: Check for errors, use emoji logs
2. **Network**: Inspect API calls (analyze-cgt, timeline/save)
3. **React DevTools**: Inspect component props/state
4. **Zustand DevTools**: Install and inspect store state

---

## Recent Major Changes

### December 2024
- ✅ Added detailed CGT calculation breakdowns
- ✅ Enhanced PropertyAnalysisCard with step-by-step math
- ✅ Improved PDF exports with calculation details
- ✅ Fixed calculation matching logic

### November 2024
- ✅ Added AI suggested questions feature (optional)
- ✅ Implemented verification alert system
- ✅ Added JSON viewer for API responses
- ✅ Improved cost base PDF exports
- ✅ Added shareable timeline links

---

## External Documentation

See also:
- `README.md` - User-facing documentation
- `SETUP_API.md` - API setup guide
- `API_INTEGRATION.md` - Detailed API integration docs

---

## Notes

### Known Limitations
- No test suite (TODO)
- Mock data fallback behavior (intentional for development)
- Backward compatibility with legacy cost base fields

### Feature Flags
- AI suggested questions: Disabled by default (user can enable in settings)

### Performance
- Large timelines (50+ events per property) may slow drag & drop
- PDF generation can take 3-5 seconds for complex reports
- Vercel KV has rate limits for shareable links

---

**Last Updated**: December 2024
