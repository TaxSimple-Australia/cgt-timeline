# CGT Clarification Flow Documentation

## Overview

This document explains how the CGT (Capital Gains Tax) analysis flow handles clarification questions when the API needs additional information from the user.

## Flow Diagram

```
┌──────────────────┐
│ User clicks      │
│ "Analyze"        │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ handleAnalyze()  │
│ in page.tsx      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ POST to          │
│ /api/analyze-cgt │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ External CGT API │
└────────┬─────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
  success   needs_clarification
    │         │
    │         ▼
    │    ┌──────────────────────┐
    │    │ Transform to         │
    │    │ verification_failed  │
    │    │ format               │
    │    └──────┬───────────────┘
    │           │
    │           ▼
    │    ┌──────────────────────┐
    │    │ CGTAnalysisDisplay   │
    │    │ shows GapQuestions   │
    │    │ Panel                │
    │    └──────┬───────────────┘
    │           │
    │           ▼
    │    ┌──────────────────────┐
    │    │ User answers         │
    │    │ questions            │
    │    └──────┬───────────────┘
    │           │
    │           ▼
    │    ┌──────────────────────┐
    │    │ handleRetryWith      │
    │    │ GapAnswers()         │
    │    └──────┬───────────────┘
    │           │
    │           ▼
    │    ┌──────────────────────┐
    │    │ Add clarification_   │
    │    │ answers to request   │
    │    └──────┬───────────────┘
    │           │
    │           ▼
    │    ┌──────────────────────┐
    │    │ POST /api/analyze-   │
    │    │ cgt (same endpoint)  │
    │    └──────┬───────────────┘
    │           │
    └───────────┴───> (loops back to success check)
```

## Data Structures

### 1. API Response - Needs Clarification

When the API needs clarification, it returns:

```json
{
  "success": false,
  "needs_clarification": true,
  "clarification_questions": [
    {
      "question_id": "q_melbourne_2010_2012",
      "property_address": "123 Smith Street, Melbourne VIC 3000",
      "period": {
        "start_date": "2010-03-15",
        "end_date": "2012-04-02",
        "days": 749
      },
      "question": "Please specify your living arrangements from 2010-03-15 to 2012-04-02",
      "options": [
        "Living in property as main residence",
        "Renting elsewhere",
        "Staying with family/friends",
        "Overseas/traveling",
        "Property was vacant",
        "Other"
      ],
      "severity": "critical"
    }
  ],
  "data": null,
  "error": null
}
```

### 2. Transformed Format for UI

The API route transforms this to:

```json
{
  "success": true,
  "data": {
    "status": "verification_failed",
    "verification": {
      "clarification_questions": [
        {
          "question": "Please specify your living arrangements...",
          "type": "clarification",
          "properties_involved": ["123 Smith Street, Melbourne VIC 3000"],
          "period": {
            "start": "2010-03-15",
            "end": "2012-04-02",
            "days": 749
          },
          "possible_answers": ["Living in property...", "Renting elsewhere", ...],
          "severity": "critical",
          "question_id": "q_melbourne_2010_2012"
        }
      ],
      "issues": []
    },
    "summary": {
      "total_properties": 1,
      "requires_clarification": true
    }
  }
}
```

### 3. User Answers Format

When user submits answers, they are transformed to:

```json
{
  "properties": [...],
  "user_query": "...",
  "additional_info": {...},
  "verification_responses": [
    {
      "property_address": "123 Smith Street, Melbourne VIC 3000",
      "issue_period": {
        "start_date": "2010-03-15",
        "end_date": "2012-04-02"
      },
      "resolution_question": "Please specify your living arrangements from 2010-03-15 to 2012-04-02 (686 days) for property: 123 Smith Street, Melbourne VIC 3000",
      "user_response": "Renting elsewhere",
      "resolved_at": "2025-12-15T06:30:00.000Z"
    }
  ]
}
```

## Implementation Details

### Files Modified

1. **`src/types/cgt.ts`** (NEW)
   - Type definitions for clarification questions and answers
   - ClarificationQuestion interface
   - ClarificationAnswer interface
   - CGTAnalysisResponse union type

2. **`src/app/api/analyze-cgt/route.ts`** (UPDATED)
   - Lines 47-81: Added detection of `needs_clarification` response
   - Transforms API format to GapQuestionsPanel format
   - Converts to `verification_failed` status for UI compatibility

3. **`src/app/page.tsx`** (UPDATED)
   - Lines 507-523: Added `verification_responses` transformation
   - Transforms gap question answers to the format expected by backend API
   - Sends verification_responses array with user answers

### Component Reuse

**GapQuestionsPanel** (`src/components/ai-response/GapQuestionsPanel.tsx`)
- ✅ Already exists and works perfectly
- Displays questions with period information
- Collects radio button answers
- Supports "Other" option with custom text input
- Calls `onSubmit` callback with formatted answers

**CGTAnalysisDisplay** (`src/components/ai-response/CGTAnalysisDisplay.tsx`)
- ✅ Already handles `verification_failed` status
- Lines 560-566: Renders GapQuestionsPanel when questions exist
- No changes needed - works out of the box

## API Endpoints

### Initial Analysis & Retry (Same Endpoint)
- **Endpoint**: `POST /api/analyze-cgt`
- **Initial Request**: Timeline data without clarification_answers
- **Retry Request**: Timeline data WITH clarification_answers
- **Response**:
  - If needs clarification: `verification_failed` with questions
  - If successful: Success with analysis data

The same endpoint handles both initial analysis and retry with clarification answers. The external API (`/api/v1/analyze-portfolio-json`) receives the `clarification_answers` field and processes accordingly.

## Testing

### Mock Response for Testing

Save this as a JSON file to test the clarification flow:

```json
{
  "success": false,
  "needs_clarification": true,
  "clarification_questions": [
    {
      "question_id": "test_gap_1",
      "property_address": "123 Test Street",
      "period": {
        "start_date": "2020-01-01",
        "end_date": "2023-06-30",
        "days": 1276
      },
      "question": "What was the primary use of the property during this period?",
      "options": [
        "Main residence (lived in it)",
        "Rented to tenants",
        "Vacant (not used)",
        "Other, please specify"
      ],
      "severity": "critical"
    }
  ],
  "data": null,
  "error": null
}
```

### Test Steps

1. **Test Clarification Display**:
   - Click "Analyze" button
   - API should return clarification needed
   - GapQuestionsPanel should appear with questions
   - Questions should show property address, period, and options

2. **Test Answer Submission**:
   - Select an answer for each question
   - If "Other" selected, type custom text
   - Click Submit
   - handleRetryWithGapAnswers should be called
   - Request should include clarification_answers array

3. **Test Success Flow**:
   - API returns success: true with analysis data
   - CGTAnalysisDisplay shows formatted report
   - No more clarification questions

## Data Format

The implementation uses the standard `verification_responses` format:

- Property address
- Issue period (start and end dates)
- Resolution question (original question from API)
- User response (selected answer)
- Resolved timestamp

## Error Handling

- If API returns error, user sees error message
- If questions can't be parsed, falls back to showing raw JSON
- Network errors show user-friendly message with retry option

## Future Enhancements

Potential improvements:

1. **Question Validation**: Add client-side validation before submission
2. **Progress Tracking**: Show progress if multiple rounds of questions
3. **Question History**: Store answered questions in local storage
4. **Smart Defaults**: Pre-fill common answers based on property history
5. **Bulk Answers**: Allow answering same question for multiple properties at once

## Troubleshooting

### Questions Not Appearing

Check:
1. API response has `success: false` and `needs_clarification: true`
2. `clarification_questions` array exists and has items
3. Console logs show transformation happening in API route
4. CGTAnalysisDisplay detects `isVerificationFailed`

### Answers Not Being Sent

Check:
1. `handleRetryWithGapAnswers` is called (check console logs)
2. Answers are formatted correctly (check network tab)
3. `verification_responses` array exists in request payload
4. API endpoint is receiving the data

### UI Not Updating After Retry

Check:
1. API returns `success: true` on retry
2. `setAnalysisData` is called with new data
3. `isVerificationFailed` condition is now false
4. Component re-renders with success view

## Support

For questions or issues with the clarification flow:
1. Check console logs for detailed flow information
2. Use "Show Raw JSON" button to see exact API response
3. Verify type definitions match in `src/types/cgt.ts`
4. Review this documentation for expected formats
