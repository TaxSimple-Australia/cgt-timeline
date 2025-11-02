# Quick Start: Model Response Components

## 1. Import the Component

```tsx
import { ModelResponseDisplay } from '@/components/model-response';
import type { CGTModelResponse } from '@/types/model-response';
```

## 2. Use It

```tsx
const responseData: CGTModelResponse = {
  properties: [
    {
      address: '123 Smith St, Sydney NSW',
      property_history: [
        { date: '2015-01-15', event: 'purchased', price: 300000 },
        { date: '2024-03-15', event: 'sold', price: 650000 }
      ]
    }
  ],
  response: {
    summary: 'Your estimated CGT liability is approximately AUD 87,000.',
    recommendation: 'Consider applying the 50% CGT discount.',
    issues: [
      {
        type: 'missing_data',
        field: 'purchase_costs',
        message: 'Add purchase costs to reduce CGT liability.',
        severity: 'medium'
      }
    ],
    visual_metrics: {
      data_completeness: 85,
      confidence_score: 0.92
    },
    detailed_breakdown: {
      capital_gain: 325000,
      cost_base: 325000,
      discount_applied: 162500,
      tax_payable: 87000
    }
  }
};

<ModelResponseDisplay responseData={responseData} />
```

## 3. View Demo

```bash
npm run dev
```

Go to: `http://localhost:3000/model-response-demo`

## That's It!

For full documentation, see `MODEL_RESPONSE_COMPONENTS.md`.
