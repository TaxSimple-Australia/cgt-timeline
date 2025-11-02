# CGT Model Response Components

A production-ready, interactive UI system for displaying AI-powered Capital Gains Tax (CGT) analysis results with beautiful animations and conversational design.

## Overview

This component library provides a comprehensive solution for displaying CGT model responses with:

- Clean, conversational UI with friendly animations
- Visual metrics using Recharts
- Detailed report modal with full property breakdown
- Responsive design (mobile-first)
- Dark mode support
- Fully typed with TypeScript

## Components

### `<ModelResponseDisplay />`

**Main wrapper component** that orchestrates all sub-components.

```tsx
import { ModelResponseDisplay } from '@/components/model-response';
import type { CGTModelResponse } from '@/types/model-response';

const responseData: CGTModelResponse = {
  properties: [...],
  response: {
    summary: "Your estimated CGT liability is approximately AUD 87,000.",
    recommendation: "Consider applying the 50% CGT discount...",
    issues: [...],
    visual_metrics: {
      data_completeness: 85,
      confidence_score: 0.92
    }
  }
};

<ModelResponseDisplay responseData={responseData} />
```

**Props:**
- `responseData: CGTModelResponse` - The full model response object
- `className?: string` - Optional CSS classes

---

### `<SummaryCard />`

**Hero component** displaying the main CGT summary and recommendation.

**Features:**
- Automatic dollar amount extraction and highlighting
- Gradient backgrounds with animated glow effects
- Icon-based visual indicators
- Separate recommendation section with lightbulb icon

```tsx
<SummaryCard
  summary="Your estimated CGT liability is approximately AUD 87,000"
  recommendation="Consider applying the 50% CGT discount..."
  delay={0.1}
/>
```

---

### `<AIChatBubble />`

**Conversational component** for displaying issues, warnings, and missing data.

**Features:**
- AI assistant branding with Sparkles icon
- Color-coded issue types (error, warning, missing_data, info)
- Chat bubble design with tail
- Severity indicators
- Hover animations

```tsx
<AIChatBubble
  issues={[
    {
      type: 'missing_data',
      field: 'purchase_costs',
      message: 'We couldn\'t locate purchase costs...',
      severity: 'medium'
    }
  ]}
  delay={0.3}
/>
```

**Issue Types:**
- `error` - Red, critical issues
- `warning` - Amber, important warnings
- `missing_data` - Blue, data gaps
- `info` - Gray, informational notes

---

### `<VisualSummary />`

**Recharts-based component** showing data completeness and confidence metrics.

**Features:**
- Dual radial progress charts
- Dynamic status labels (Excellent, Good, Fair, etc.)
- Color-coded based on score ranges
- Animated chart rendering

```tsx
<VisualSummary
  metrics={{
    data_completeness: 85,
    confidence_score: 0.92
  }}
  delay={0.2}
/>
```

**Status Ranges:**
- 90-100%: Excellent/Very High (Green)
- 70-89%: Good/High (Blue)
- 50-69%: Fair/Moderate (Amber)
- 0-49%: Needs Improvement/Low (Red)

---

### `<DetailedReportModal />`

**Full-featured modal** with comprehensive property details and breakdown.

**Features:**
- Financial breakdown table
- Property history timeline
- Additional information section
- Export as JSON
- Print functionality
- Smooth animations

```tsx
<DetailedReportModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  data={responseData}
/>
```

---

## Data Structure

### CGTModelResponse Type

```typescript
interface CGTModelResponse {
  properties: Property[];
  user_query?: string;
  additional_info?: AdditionalInfo;
  use_claude?: boolean;
  response: ModelResponse;
}
```

### Property Type

```typescript
interface Property {
  address: string;
  property_history: PropertyHistoryEvent[];
  notes?: string;
}

interface PropertyHistoryEvent {
  date: string;           // ISO date format
  event: string;          // e.g., "purchased", "sold", "rented"
  price?: number;
  price_per_week?: number;
  description?: string;
}
```

### ModelResponse Type

```typescript
interface ModelResponse {
  summary: string;
  recommendation?: string;
  issues?: Issue[];
  visual_metrics?: VisualMetrics;
  detailed_breakdown?: {
    capital_gain?: number;
    cost_base?: number;
    discount_applied?: number;
    tax_payable?: number;
  };
}
```

### Issue Type

```typescript
interface Issue {
  type: 'missing_data' | 'warning' | 'info' | 'error';
  field?: string;
  message: string;
  severity?: 'low' | 'medium' | 'high';
}
```

### VisualMetrics Type

```typescript
interface VisualMetrics {
  data_completeness: number;  // 0-100
  confidence_score: number;   // 0-1
}
```

---

## Installation

The components use the following dependencies:

```bash
npm install recharts @radix-ui/react-dialog framer-motion lucide-react date-fns
```

Already included in `package.json`:
- `recharts`: ^2.10.3
- `@radix-ui/react-dialog`: ^1.0.5
- `framer-motion`: ^11.0.3
- `lucide-react`: ^0.323.0
- `date-fns`: ^3.3.1

---

## Usage Examples

### Basic Usage

```tsx
'use client';

import { ModelResponseDisplay } from '@/components/model-response';
import type { CGTModelResponse } from '@/types/model-response';

export default function ResultsPage() {
  const data: CGTModelResponse = {
    properties: [
      {
        address: '123 Smith St, Sydney NSW',
        property_history: [
          {
            date: '2015-01-15',
            event: 'purchased',
            price: 300000
          },
          {
            date: '2024-03-15',
            event: 'sold',
            price: 650000
          }
        ]
      }
    ],
    response: {
      summary: 'Your estimated CGT liability is approximately AUD 87,000.',
      recommendation: 'Consider applying the 50% CGT discount.',
      visual_metrics: {
        data_completeness: 85,
        confidence_score: 0.92
      }
    }
  };

  return (
    <div className="container mx-auto py-12">
      <ModelResponseDisplay responseData={data} />
    </div>
  );
}
```

### With API Integration

```tsx
'use client';

import { useState, useEffect } from 'react';
import { ModelResponseDisplay } from '@/components/model-response';
import type { CGTModelResponse } from '@/types/model-response';

export default function AnalysisPage() {
  const [data, setData] = useState<CGTModelResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalysis() {
      const response = await fetch('/api/cgt-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: '123' })
      });
      const result = await response.json();
      setData(result);
      setLoading(false);
    }
    fetchAnalysis();
  }, []);

  if (loading) return <div>Loading analysis...</div>;
  if (!data) return <div>No data available</div>;

  return <ModelResponseDisplay responseData={data} />;
}
```

---

## Sample Data

Sample data is available in `src/lib/sample-data.ts`:

```typescript
import { sampleCGTResponse, minimalCGTResponse, multiPropertyResponse } from '@/lib/sample-data';
```

**Three scenarios provided:**
1. `sampleCGTResponse` - Standard investment property with full data
2. `minimalCGTResponse` - Primary residence with missing data
3. `multiPropertyResponse` - Multiple properties

---

## Demo Page

View all components in action:

```bash
npm run dev
```

Navigate to: `http://localhost:3000/model-response-demo`

The demo page includes:
- Interactive example switcher
- All three sample scenarios
- Responsive design preview
- Dark mode toggle (via system settings)

---

## Styling & Customization

### Color Schemes

Issue type colors are defined in `AIChatBubble.tsx`:

```typescript
const issueColors = {
  error: { color: 'red', bg: 'red-50', border: 'red-200' },
  warning: { color: 'amber', bg: 'amber-50', border: 'amber-200' },
  missing_data: { color: 'blue', bg: 'blue-50', border: 'blue-200' },
  info: { color: 'gray', bg: 'gray-50', border: 'gray-200' }
};
```

### Animation Timing

Customize animation delays:

```tsx
<SummaryCard delay={0.1} />
<VisualSummary delay={0.2} />
<AIChatBubble delay={0.3} />
```

### Dark Mode

Components automatically support dark mode via Tailwind's `dark:` classes. Ensure your app has dark mode configured:

```tsx
// app/layout.tsx
<html className={theme === 'dark' ? 'dark' : ''}>
```

---

## Component Architecture

```
ModelResponseDisplay (Main Container)
├── User Query Display (if present)
├── Left Column (lg:col-span-7)
│   ├── SummaryCard (Hero)
│   └── AIChatBubble (Issues/Warnings)
└── Right Column (lg:col-span-5)
    ├── VisualSummary (Metrics)
    ├── "View Detailed Report" Button
    └── Quick Stats Card
```

---

## Responsive Behavior

### Mobile (< 1024px)
- Single column layout
- Full-width cards
- Stacked components

### Desktop (≥ 1024px)
- Two-column grid (7/5 split)
- Summary takes prominence on left
- Metrics and actions on right

---

## Accessibility

- Semantic HTML structure
- ARIA labels on interactive elements
- Keyboard navigation support (via Radix UI)
- Focus management in modal
- Screen reader friendly

---

## Performance

- Lazy loading of modal content
- Framer Motion animations use GPU acceleration
- Recharts renders only when visible
- Optimized re-renders with React memoization

---

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: iOS Safari 14+, Chrome Android

---

## File Structure

```
src/
├── types/
│   └── model-response.ts          # TypeScript definitions
├── components/
│   ├── ui/
│   │   ├── dialog.tsx             # Radix Dialog wrapper
│   │   └── button.tsx             # Button component
│   └── model-response/
│       ├── index.ts               # Barrel export
│       ├── ModelResponseDisplay.tsx
│       ├── SummaryCard.tsx
│       ├── AIChatBubble.tsx
│       ├── VisualSummary.tsx
│       └── DetailedReportModal.tsx
├── lib/
│   └── sample-data.ts             # Demo data
└── app/
    └── model-response-demo/
        └── page.tsx               # Demo page
```

---

## Troubleshooting

### Charts not rendering
Ensure `recharts` is installed and imported correctly.

### Modal not opening
Check that `@radix-ui/react-dialog` is installed.

### Animations stuttering
Verify `framer-motion` is installed and GPU acceleration is enabled in browser.

### Dark mode not working
Ensure your root HTML element has the `dark` class when in dark mode.

---

## Future Enhancements

Potential improvements:
- [ ] Export to PDF functionality
- [ ] Email report feature
- [ ] Comparison view for multiple scenarios
- [ ] Interactive property timeline
- [ ] Tax optimization suggestions
- [ ] Integration with ATO calculator

---

## License

Part of the CGT Timeline project. Internal use only.

---

## Support

For issues or questions, contact the development team or file an issue in the project repository.
