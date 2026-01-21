# API Integration Guide

## Overview

The CGT Timeline application now sends your property data to your AI model API and displays the results with beautiful charts and visualizations.

## How It Works

### 1. User Flow
```
Timeline with Properties
    ↓
Click "View CGT Analysis"
    ↓
Transform Data → Send to API → Display Results
```

### 2. Data Flow

**Timeline Data (Input):**
```typescript
{
  properties: [
    {
      id: "prop-1",
      name: "Humpty Doo, NT 0836",
      address: "45 Collard Road",
      purchasePrice: 106000,
      purchaseDate: Date,
      salePrice: 450000,
      saleDate: Date,
      // ... other fields
    }
  ],
  events: [
    {
      id: "event-1",
      propertyId: "prop-1",
      type: "purchase",
      date: Date,
      amount: 106000,
      // ... other fields
    }
  ]
}
```

**Transformed API Request:**
```json
{
  "properties": [
    {
      "address": "Humpty Doo, NT 0836, 45 Collard Road",
      "property_history": [
        {
          "date": "2003-01-01",
          "event": "purchase",
          "price": 106000,
          "description": "Initial purchase"
        },
        {
          "date": "2023-07-14",
          "event": "sale",
          "price": 450000
        }
      ],
      "notes": ""
    }
  ],
  "user_query": "What is my total CGT liability?",
  "additional_info": {
    "australian_resident": true,
    "other_property_owned": false,
    "land_size_hectares": 0,
    "marginal_tax_rate": 37
  },
  "use_claude": true
}
```

**Expected API Response:**
```json
{
  "properties": [...],
  "user_query": "...",
  "additional_info": {...},
  "use_claude": true,
  "response": {
    "summary": "Your estimated CGT liability is approximately AUD 87,000.",
    "recommendation": "Consider applying the 50% CGT discount...",
    "issues": [
      {
        "type": "missing_data",
        "field": "45 Collard Road",
        "message": "Purchase costs missing...",
        "severity": "medium"
      }
    ],
    "visual_metrics": {
      "data_completeness": 85,
      "confidence_score": 0.92
    },
    "detailed_breakdown": {
      "capital_gain": 325000,
      "cost_base": 325000,
      "discount_applied": 162500,
      "tax_payable": 87000
    }
  }
}
```

## Configuration

### Step 1: Set Up Environment Variables

1. Copy the example file:
```bash
cp .env.local.example .env.local
```

2. Edit `.env.local` and add your API URL:
```env
# The actual endpoints are hardcoded in src/app/api/calculate-cgt/route.ts:
# - https://cgtbrain.com.au/calculate-cgt/      (Markdown response)
# - https://cgtbrain.com.au/calculate-cgt-json/ (JSON response)
NEXT_PUBLIC_CGT_MODEL_API_URL=https://cgtbrain.com.au/calculate-cgt/
```

Note: The API endpoints are hardcoded in the route file. This env variable is used to check if the API is enabled.

3. If your API requires authentication, add:
```env
CGT_MODEL_API_KEY=your_api_key_here
```

### Step 2: Update API Route (if needed)

Edit `src/app/api/calculate-cgt/route.ts` if you need to:
- Add authentication headers
- Transform the request format
- Handle specific error cases

Example with authentication:
```typescript
const response = await fetch(API_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.CGT_MODEL_API_KEY}`,
  },
  body: JSON.stringify(body),
});
```

## Testing

### Without API (Mock Mode)

If you haven't configured the API URL, the system automatically uses **mock data** generated from your timeline:

1. Click "View CGT Analysis"
2. See mock response based on your properties
3. Check browser console: "Using mock response (API not configured)"

### With API

1. Configure your API URL in `.env.local`
2. Restart the dev server: `npm run dev`
3. Click "View CGT Analysis"
4. Data is sent to your API
5. Results are displayed

## File Structure

```
src/
├── app/
│   ├── api/
│   │   └── calculate-cgt/
│   │       └── route.ts          # API endpoint handler
│   └── page.tsx                  # Main page with API integration
├── lib/
│   └── transform-timeline-data.ts # Data transformation utilities
├── components/
│   └── model-response/
│       ├── LoadingSpinner.tsx    # Loading state
│       ├── ErrorDisplay.tsx      # Error state
│       └── ModelResponseDisplay.tsx # Results display
└── types/
    └── model-response.ts         # TypeScript types
```

## Key Functions

### `transformTimelineToAPIFormat(properties, events)`
Located in `src/lib/transform-timeline-data.ts`

Converts timeline data to API request format.

### `generateMockResponse(properties, events)`
Located in `src/lib/transform-timeline-data.ts`

Generates intelligent mock responses based on timeline data when API is not configured.

## API Requirements

Your API should:

1. **Accept POST requests** with JSON body
2. **Return JSON** in the expected format
3. **Include** the following in the response:
   - `response.summary` (required)
   - `response.recommendation` (optional)
   - `response.issues` (optional array)
   - `response.detailed_breakdown` (required for charts)

## Debugging

### Check Console Logs

Open browser DevTools → Console to see:
```
Sending data to API: {...}
Using mock response (API not configured)
```

### Network Tab

Check the Network tab to see:
- Request payload
- Response data
- Status codes
- Headers

### Common Issues

**"API URL not configured"**
- Solution: Add `NEXT_PUBLIC_CGT_MODEL_API_URL` to `.env.local`

**"API request failed with status 500"**
- Solution: Check API logs for errors
- Verify request format matches API expectations

**CORS errors**
- Solution: Enable CORS on your API endpoint
- Add appropriate headers to API response

## Example API Implementation (Python/FastAPI)

```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

@app.post("/analyze")
async def analyze_cgt(request: dict):
    # Your AI model processing here

    return {
        "properties": request["properties"],
        "user_query": request["user_query"],
        "additional_info": request["additional_info"],
        "use_claude": True,
        "response": {
            "summary": "Your estimated CGT liability...",
            "recommendation": "Consider applying...",
            "issues": [...],
            "detailed_breakdown": {
                "capital_gain": 325000,
                "cost_base": 325000,
                "discount_applied": 162500,
                "tax_payable": 87000
            }
        }
    }
```

## Support

For issues or questions:
1. Check browser console for errors
2. Verify `.env.local` configuration
3. Test with mock mode first
4. Review API logs

---

**Ready to go!** Configure your API URL and click "View CGT Analysis" to see your model in action! 🚀
