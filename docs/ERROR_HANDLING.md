# API Error Handling

## Overview
The application now properly handles error responses from the CGT Model API, including cases where the API returns `status: "error"` in the response body.

## Error Response Format

When the external API encounters an error, it returns a response like this:

```json
{
  "status": "error",
  "timestamp": "2025-11-20T03:16:34.508903",
  "analysis_id": null,
  "summary": null,
  "properties": null,
  "calculations": null,
  "verification": null,
  "analysis": null,
  "links": null,
  "error": "division by zero"
}
```

## How Errors Are Handled

### 1. API Route (`/api/analyze-cgt`)

The API route now detects error responses and converts them to a standard format:

```typescript
// Check if the API returned an error response
if (data.status === 'error') {
  console.error('❌ API returned error status:', data.error);
  return NextResponse.json(
    {
      success: false,
      error: data.error || 'Analysis failed',
      errorDetails: data,
    },
    { status: 200 } // Still return 200 since the API call itself succeeded
  );
}
```

**Key Points**:
- Detects `status: "error"` in the API response
- Extracts the error message from the `error` field
- Returns a standardized error format to the frontend
- Uses HTTP 200 status (because the API call succeeded, even though the analysis failed)
- Includes full error details for debugging

### 2. Frontend Error Display (`page.tsx`)

The frontend now properly displays these errors to the user:

```typescript
if (!result.success) {
  // Format error message for better user experience
  const errorMessage = result.error || 'API request failed';
  const displayError = `Analysis Error: ${errorMessage}`;

  if (result.errorDetails) {
    console.error('📋 Error details:', result.errorDetails);
  }

  throw new Error(displayError);
}
```

**What the user sees**:
- Error message: "Analysis Error: division by zero"
- Full error details logged to browser console for debugging
- Error displayed in the ErrorDisplay component with retry option

## Error Flow

```
External API → API Route → Frontend
    ↓             ↓           ↓
status:error  success:false  ErrorDisplay
error:"..."   error:"..."    Shows user-friendly message
```

## Example Error Scenarios

### 1. Division by Zero
```json
{
  "status": "error",
  "error": "division by zero"
}
```
**User sees**: "Analysis Error: division by zero"

### 2. Invalid Property Data
```json
{
  "status": "error",
  "error": "Invalid property date format"
}
```
**User sees**: "Analysis Error: Invalid property date format"

### 3. Missing Required Fields
```json
{
  "status": "error",
  "error": "Missing required field: purchase_date"
}
```
**User sees**: "Analysis Error: Missing required field: purchase_date"

### 4. Network Errors
```
API call fails with status 500
```
**User sees**: "API request failed with status 500"

## Before vs After

### Before (Showing "Unknown response format")
- API returns `{status: "error", error: "division by zero"}`
- Frontend doesn't detect the error format
- Shows generic "Unknown response format" message
- No clear indication of what went wrong

### After (Showing Actual Error)
- API returns `{status: "error", error: "division by zero"}`
- API route detects error status and extracts message
- Frontend displays: "Analysis Error: division by zero"
- Full error details available in console
- User can retry or understand the issue

## Error Display Component

Errors are shown using the `ErrorDisplay` component which includes:
- ❌ Red error icon
- Clear error message
- "Retry Analysis" button
- Professional styling (light/dark mode support)

## Debugging

When an error occurs:

1. **Check Browser Console**:
   - Look for "📋 Error details:" log
   - Contains full API response for debugging

2. **Check Network Tab**:
   - Inspect the actual API response
   - Verify status codes

3. **Check Server Logs**:
   - API route logs all responses
   - Look for "❌ API returned error status:" messages

## Testing

To test error handling:

1. Trigger an API error (e.g., invalid data)
2. Observe the error message displayed to user
3. Check console for detailed error information
4. Verify retry button works correctly

## Files Modified

1. `src/app/api/analyze-cgt/route.ts` - Detects error responses
2. `src/app/page.tsx` - Enhanced error handling and display
3. `public/NewRequestsAndResponses/example_error_response.json` - Example error response

## Future Improvements

Potential enhancements:
- Categorize errors (validation, calculation, network)
- Show context-specific retry suggestions
- Add error reporting/logging service
- Display partial results when available
- Show progress indicators during retry
