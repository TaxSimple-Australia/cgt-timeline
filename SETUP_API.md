# Setting Up Your CGT Model API

## Quick Setup

### Step 1: Create `.env.local` file

In the root of your project, create a file called `.env.local`:

```bash
# Create the file
touch .env.local
```

Or on Windows:
```bash
type nul > .env.local
```

### Step 2: Add Your API URL

Open `.env.local` and add:

```env
NEXT_PUBLIC_CGT_MODEL_API_URL=https://your-api-endpoint.com/analyze
```

Replace `https://your-api-endpoint.com/analyze` with your actual API URL.

### Step 3: Restart the Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart
npm run dev
```

### Step 4: Test It

1. Go to http://localhost:3001
2. Click "View CGT Analysis"
3. Check the browser console for logs:
   - 📤 "Sending data to API"
   - 🔗 "Calling CGT Model API"
   - ✅ "API Response Data"

## API Request Format

Your API will receive:

```json
{
  "properties": [
    {
      "address": "Humpty Doo, NT 0836, 45 Collard Road",
      "property_history": [
        {
          "date": "2003-01-01",
          "event": "purchase",
          "price": 106000
        },
        {
          "date": "2003-01-01",
          "event": "move_in"
        },
        {
          "date": "2020-01-01",
          "event": "rent_start"
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

## Expected API Response

Your API should return:

```json
{
  "properties": [...same as request...],
  "user_query": "...",
  "additional_info": {...},
  "use_claude": true,
  "response": {
    "summary": "Your estimated CGT liability is approximately AUD 87,000.",
    "recommendation": "Consider applying the 50% CGT discount since you held the property for more than 12 months.",
    "issues": [
      {
        "type": "missing_data",
        "field": "45 Collard Road",
        "message": "We couldn't locate purchase costs (stamp duty, legal fees) for this property.",
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

## Required Response Fields

✅ **Required:**
- `response.summary` (string)
- `response.detailed_breakdown` (object with capital_gain, cost_base, discount_applied, tax_payable)

✨ **Optional but Recommended:**
- `response.recommendation` (string)
- `response.issues` (array of issue objects)
- `response.visual_metrics` (object with data_completeness, confidence_score)

## Authentication (Optional)

If your API requires authentication, edit `src/app/api/analyze-cgt/route.ts`:

```typescript
// Add to .env.local:
CGT_MODEL_API_KEY=your_secret_api_key

// Update the fetch headers:
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${process.env.CGT_MODEL_API_KEY}`,
},
```

## Troubleshooting

### "API URL not configured"
- Check that `.env.local` exists in the root folder
- Check that the variable name is exactly: `NEXT_PUBLIC_CGT_MODEL_API_URL`
- Restart the dev server after creating/editing `.env.local`

### "API request failed with status 500"
- Check your API logs
- Verify the request format matches what your API expects
- Check browser console for the exact error message

### CORS Errors
Your API must allow requests from `http://localhost:3001`. Add CORS headers:

```
Access-Control-Allow-Origin: http://localhost:3001
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

## Testing Your API

Use the browser console to see:
- 📤 What data is being sent
- 📥 What response you're getting
- ❌ Any errors that occur

Open DevTools → Console → Click "View CGT Analysis"

## Need Help?

Check the logs in:
1. Browser Console (F12 → Console)
2. Terminal running `npm run dev`
3. Your API server logs
