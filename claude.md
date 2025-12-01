# CGT Calculation Display Enhancement

## Overview
Added detailed mathematical calculation breakdowns to CGT reports, allowing users to see exact formulas and step-by-step calculations for capital gains tax computations.

## Changes Made

### 1. New Component: `CalculationBreakdownSection.tsx`
**Location**: `src/components/ai-response/CalculationBreakdownSection.tsx`

A comprehensive component that displays detailed calculations for each property:

- **Step-by-Step Capital Gain Calculations**: Shows formulas from the API's `calculation_steps[]` array
- **Main Residence Exemption Math**: 3-step breakdown
  - Step 1: Calculate exemption percentage = (Main residence days ÷ Total days) × 100
  - Step 2: Calculate exempt amount = Capital gain × Exemption %
  - Step 3: Calculate taxable amount = Capital gain − Exempt amount
- **CGT Discount Calculation**:
  - Eligibility status display
  - 50% discount formula application
  - Before/after comparison
  - Savings amount display
- **Final Net Capital Gain**: Prominent summary after all exemptions and discounts

**Visual Features**:
- Color-coded sections (blue for capital gain, green for exemptions, purple for discounts)
- Numbered step badges
- Monospace font for formulas
- Professional styling with gradient backgrounds

### 2. Enhanced `DetailedReportSection.tsx`
Added the new `CalculationBreakdownSection` component to the detailed report view:
- Positioned after Portfolio Intelligence section
- Before Validation Information
- Displays for all properties with calculation data

### 3. Enhanced `PropertyAnalysisCard.tsx`
Updated the expandable "View Calculation Details" section to include:

**Main Residence Exemption - Detailed Calculations**:
- 3 step-by-step calculation cards showing exact formulas
- Green-themed styling
- Monospace formulas for clarity

**CGT Discount Section** (new):
- Eligibility badge (YES/NO)
- Before/after discount comparison
- Detailed formula step
- "You Save" display in green

**Final Net Capital Gain** (new):
- Prominent summary box at bottom
- Blue gradient background
- Shows final amount after all exemptions and discounts

### 4. Enhanced `CGTReportPDF.tsx`
Added detailed calculations to PDF exports:

**Main Residence Exemption Calculation Steps**:
- 3 numbered steps with formulas
- Days calculation
- Exempt amount calculation
- Taxable amount calculation

**CGT Discount Calculation**:
- Eligibility status
- Discount percentage
- Before/after amounts
- Formula application step
- Savings display

**Final Net Capital Gain**:
- Prominent summary box
- Blue-themed styling
- Final amount display

### 5. Bug Fix: `CGTAnalysisDisplay.tsx`
**Issue**: "View Calculation Details" toggle wasn't working because calculations prop was undefined

**Root Cause**: Property matching logic failed because:
- `property.property_id` = `"None"` (from API)
- `calc.property_id` = `"123 Smith Street, Melbourne VIC 3000"` (address)

**Solution**: Updated matching logic to try multiple strategies:
```javascript
calculations={response.calculations?.per_property?.find(
  (calc: any) =>
    calc.property_id === property.property_id ||
    calc.property_id === property.address ||
    calc.property_address === property.address
)}
```

## Data Structure Used

### Calculation Steps Format
```typescript
{
  step: number,
  description: string,
  formula: string,
  calculation: string,
  result: number,
  section: string  // ATO section reference
}
```

### Main Residence Exemption
```typescript
{
  days_as_main_residence: number,
  total_ownership_days: number,
  exemption_percentage: number,
  exempt_amount: number,
  taxable_amount_before_discount: number
}
```

### CGT Discount
```typescript
{
  eligible: boolean,
  discount_percentage: number,
  gain_before_discount: number,
  discounted_gain: number
}
```

## User Experience

### Web UI
Users can now see detailed calculations in two places:

1. **Property Cards** - Click "View Calculation Details" to expand and see:
   - Cost base breakdown
   - Main residence exemption calculations with formulas
   - CGT discount calculations
   - Final net capital gain

2. **Detailed Report Section** - Expand to see:
   - All calculation breakdowns for all properties
   - Professional formatting
   - Clear step-by-step explanations

### PDF Export
All calculations are included in exported PDFs with:
- Professional typography
- Color-coded sections
- Numbered steps
- Clear formulas and amounts

## Benefits

1. **Transparency**: Users see exactly how their CGT is calculated
2. **Education**: Step-by-step formulas help users understand the process
3. **Verification**: Users can verify calculations manually
4. **Professional**: Polished presentation suitable for client reports
5. **Compliance**: Shows ATO section references for each calculation step

## Technical Notes

- Uses `@react-pdf/renderer` for PDF generation
- Responsive design for web and PDF views
- Consistent styling across all display modes
- TypeScript-friendly with proper typing
- Handles missing data gracefully
