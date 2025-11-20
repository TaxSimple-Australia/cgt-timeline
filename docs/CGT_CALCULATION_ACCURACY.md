# CGT Calculation Accuracy Guide

## Important: Where Calculations Happen

**The CGT calculations are performed by the EXTERNAL API**, not by this frontend application.

This application:
- ✅ Collects property data
- ✅ Transforms it to API format
- ✅ Sends to external CGT Model API
- ✅ Displays the results

**The external API performs:**
- ❌ All CGT calculations
- ❌ Main residence exemption calculations
- ❌ 50% CGT discount application
- ❌ Apportionment of partial exemptions
- ❌ Tax liability calculations

## Ensuring 100% Accuracy

### 1. Complete Data Entry (User Responsibility)

Users must enter ALL relevant information:

#### ✅ For Each Property:
- Purchase date and price
- All acquisition costs (stamp duty, legal fees, inspections)
- All capital improvements with dates and amounts
- Sale date, price, and all selling costs
- Complete occupancy timeline (no gaps)

#### ✅ For Occupancy Timeline:
- Every move_in and move_out event
- Every rent_start and rent_end event
- No gaps or unknown periods
- Accurate dates (day-level precision)

### 2. Cost Base Completeness

The application now exports ALL cost base elements to the API:

#### Element 1 & 2 (Acquisition Costs):
```json
{
  "purchase_legal_fees": 1800,
  "stamp_duty": 3180,
  "valuation_fees": 400,
  "building_inspection": 600,
  "pest_inspection": 350,
  "purchase_agent_fees": 0,
  "title_legal_fees": 0,
  "loan_establishment": 0,
  "mortgage_insurance": 0,
  "conveyancing_fees": 0
}
```

#### Element 3 (Capital Improvements):
```json
{
  "improvement_cost": 45000,
  "description": "Kitchen renovation"
}
```

#### Element 5 (Disposal Costs):
```json
{
  "legal_fees": 1800,
  "agent_fees": 11250,
  "advertising_costs": 2500,
  "staging_costs": 0,
  "auction_costs": 0
}
```

### 3. API Accuracy (External System)

The accuracy of calculations depends on the external API:

#### What the API Should Do:
- Apply correct ATO CGT formulas
- Calculate main residence exemption correctly
- Apply 50% CGT discount when property held > 12 months
- Apportion partial exemptions accurately
- Use correct marginal tax rates

#### If Results Are Inaccurate:

**Option A: Verify Data Completeness**
1. Check browser console for API request payload
2. Verify all cost bases are included
3. Ensure no timeline gaps
4. Confirm all dates are accurate

**Option B: Contact API Provider**
If data is complete but calculations are wrong:
- The issue is in the external API's calculation logic
- Contact the API provider/developer
- Provide example data and expected vs actual results
- Request calculation methodology review

### 4. Data Verification Checklist

Before submitting for analysis, verify:

#### Property Details:
- [ ] Purchase date is correct
- [ ] Purchase price is accurate
- [ ] Sale date is correct (if sold)
- [ ] Sale price is accurate (if sold)

#### Acquisition Costs:
- [ ] Stamp duty amount verified
- [ ] Legal fees included
- [ ] All inspection fees recorded
- [ ] Valuation fees included
- [ ] Any buyer's agent fees added
- [ ] Loan/mortgage costs captured

#### Capital Improvements:
- [ ] All renovations listed with dates
- [ ] Improvement amounts are accurate
- [ ] Only capital improvements (not repairs) included
- [ ] Dates match when work was completed

#### Selling Costs:
- [ ] Agent commission accurate
- [ ] Legal/conveyancing fees included
- [ ] Marketing/advertising costs added
- [ ] Any staging or auction costs recorded

#### Timeline Accuracy:
- [ ] No gaps in occupancy
- [ ] Move dates are accurate
- [ ] Rental periods clearly defined
- [ ] Main residence periods identified

### 5. Common Accuracy Issues

#### Issue: Partial Exemption Incorrect
**Cause**: Timeline gaps or incorrect move dates
**Fix**: Ensure every move_in/move_out event is recorded with exact dates

#### Issue: Cost Base Too Low
**Cause**: Missing cost base items
**Fix**: Add ALL purchase costs, improvements, and selling costs

#### Issue: Wrong Main Residence Status
**Cause**: Missing or incorrect move_in/move_out events
**Fix**: Verify occupancy timeline matches actual living arrangements

#### Issue: 50% Discount Not Applied
**Cause**: Property held < 12 months or API error
**Fix**: Verify ownership period, check API calculation logic

### 6. Testing Accuracy

Use known scenarios to test:

```json
{
  "purchase_date": "2010-01-01",
  "purchase_price": 500000,
  "stamp_duty": 20000,
  "legal_fees": 2000,

  "sale_date": "2024-01-01",
  "sale_price": 800000,
  "agent_fees": 20000,
  "legal_fees": 2000,

  "occupancy": "100% main residence"
}
```

**Expected Result**:
- Cost Base: $544,000 ($500k + $20k + $2k + $20k + $2k)
- Capital Gain: $256,000 ($800k - $544k)
- 100% Main Residence Exemption
- **CGT Liability: $0**

If result differs, the issue is in the API calculation logic.

### 7. Debugging Inaccurate Results

#### Step 1: Check Request Payload
Open browser DevTools → Network → Find API request → Check payload

Verify all cost bases are present:
```json
{
  "properties": [{
    "property_history": [{
      "event": "purchase",
      "price": 106000,
      "stamp_duty": 3180,        // ✓ Present
      "purchase_legal_fees": 1800, // ✓ Present
      "valuation_fees": 400       // ✓ Present
    }]
  }]
}
```

#### Step 2: Check API Response
Verify the API's cost base calculation matches your data:
```json
{
  "cost_base": {
    "purchase_price": 106000,
    "stamp_duty": 3180,
    "legal_fees": 1800,
    "total": 110980
  }
}
```

#### Step 3: Manual Verification
Calculate CGT manually using ATO formulas:
1. Cost Base = Purchase + Element 2 + Element 3 + Element 5
2. Capital Gain = Sale Price - Cost Base
3. Apply Main Residence Exemption (if applicable)
4. Apply 50% Discount (if held > 12 months)
5. Taxable Gain × Marginal Tax Rate = CGT Liability

Compare manual calculation with API result.

### 8. Reporting Accuracy Issues

If you find an inaccuracy:

**Provide:**
1. Complete property data (JSON request payload)
2. Expected CGT calculation (show your work)
3. Actual API result
4. Specific difference (e.g., "Cost base $10k too low")

**Example Report:**
```
Property: 45 Collard Road, Humpty Doo
Purchase: $106,000 + $5,380 costs = $111,380
Sale: $450,000 - $15,550 costs = $434,450
Capital Gain: $323,070

Expected:
- PPR exemption: 82.6% (17/20.57 years)
- Taxable: $56,254
- After 50% discount: $28,127
- Tax (37%): $10,407

Actual API Result: $12,500

Difference: $2,093 higher than expected
Possible cause: Main residence apportionment formula incorrect
```

## Summary

✅ **Frontend Ensures**: All data is captured and sent to API
❌ **Frontend Does NOT**: Perform CGT calculations
⚠️ **For Accuracy**: Verify API calculation logic and formulas

**The frontend's role is complete** - all cost bases and timeline data are now properly exported to the API for calculation.
