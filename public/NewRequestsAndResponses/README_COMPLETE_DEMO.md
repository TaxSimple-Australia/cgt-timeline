# Complete Demo Scenario with Cost Bases

## Overview
This is the default demo scenario that loads when the application starts. It represents a realistic and complete property portfolio with full cost base tracking for accurate CGT calculations.

## Properties in the Demo

### 1. 15 Oakwood Drive, Cremorne NSW 2090 (SOLD)
**Timeline**: 2012-2023 (11 years)
**Status**: Sold in 2023

**Purchase (June 2012)**:
- Purchase Price: $485,000
- Legal Fees: $2,800
- Stamp Duty: $18,700
- Valuation: $550
- Building Inspection: $750
- Pest Inspection: $350
- **Total Cost Base at Purchase**: $508,150

**Occupancy History**:
- Main Residence: July 2012 - August 2018 (6 years, 1 month)
- Rental Property: September 2018 - May 2023 (4 years, 8 months)

**Capital Improvements**:
- March 2014: Kitchen renovation - $35,000

**Sale (June 2023)**:
- Sale Price: $825,000
- Agent Fees: $20,625
- Legal Fees: $2,400
- Advertising: $3,200
- Auction Costs: $1,500
- **Total Selling Costs**: $27,725

**Total Cost Base**: $508,150 + $35,000 + $27,725 = $570,875
**Capital Gain**: $825,000 - $570,875 = $254,125

---

### 2. 42 Harbour View Terrace, Mosman NSW 2088 (CURRENT PPR)
**Timeline**: 2018-Present
**Status**: Current Main Residence

**Purchase (August 2018)**:
- Purchase Price: $920,000
- Legal Fees: $4,200
- Stamp Duty: $38,050
- Valuation: $750
- Buyer's Agent: $13,800
- Building Inspection: $950
- Pest Inspection: $450
- Title Fees: $1,800
- Loan Establishment: $1,200
- **Total Cost Base at Purchase**: $981,200

**Occupancy History**:
- Main Residence: August 2018 - Present (6+ years)

**Capital Improvements**:
- November 2019: Bathroom & ensuite renovation - $65,000
- April 2021: Deck and outdoor area - $28,000
- January 2023: Solar panels & energy efficiency - $42,000
- **Total Improvements**: $135,000

**Current Cost Base**: $981,200 + $135,000 = $1,116,200

---

### 3. 88 Investment Street, Parramatta NSW 2150 (RENTAL)
**Timeline**: 2016-Present
**Status**: Investment Property (Never Main Residence)

**Purchase (March 2016)**:
- Purchase Price: $545,000
- Legal Fees: $3,100
- Stamp Duty: $21,175
- Valuation: $600
- Building Inspection: $700
- Pest Inspection: $350
- **Total Cost Base at Purchase**: $570,925

**Occupancy History**:
- Rental Property: April 2016 - Present (8+ years)
- Never used as main residence

**Capital Improvements**:
- July 2019: Carpets and paint - $18,500
- February 2022: Kitchen upgrade - $32,000
- **Total Improvements**: $50,500

**Current Cost Base**: $570,925 + $50,500 = $621,425

---

### 4. 23 Coastal Road, Manly NSW 2095 (SOLD)
**Timeline**: 2020-2024 (3.5 years)
**Status**: Sold in 2024

**Purchase (September 2020)**:
- Purchase Price: $1,150,000
- Legal Fees: $5,200
- Stamp Duty: $50,350
- Valuation: $850
- Buyer's Agent: $17,250
- Building Inspection: $1,100
- Pest Inspection: $500
- Title Fees: $2,200
- Loan Establishment: $1,500
- Mortgage Insurance: $9,500
- Conveyancing: $1,800
- **Total Cost Base at Purchase**: $1,240,250

**Occupancy History**:
- Rental Property: October 2020 - March 2024 (3 years, 5 months)
- Never used as main residence

**Capital Improvements**:
- November 2021: Bathroom & flooring - $45,000

**Sale (April 2024)**:
- Sale Price: $1,485,000
- Agent Fees: $37,125
- Legal Fees: $3,200
- Advertising: $5,500
- Staging: $6,500
- Auction Costs: $2,000
- **Total Selling Costs**: $54,325

**Total Cost Base**: $1,240,250 + $45,000 + $54,325 = $1,339,575
**Capital Gain**: $1,485,000 - $1,339,575 = $145,425

---

## Summary

### Portfolio Statistics:
- **Total Properties**: 4
- **Properties Sold**: 2
- **Current Properties**: 2
- **Main Residence Properties**: 2
- **Pure Investment Properties**: 2

### Cost Base Components Demonstrated:
✅ Purchase costs (price, stamp duty, legal fees)
✅ Acquisition costs (valuations, inspections, buyer's agent fees)
✅ Capital improvements (renovations, upgrades)
✅ Selling costs (agent fees, legal fees, marketing, staging)
✅ Financing costs (loan establishment, mortgage insurance)

### CGT Scenarios Demonstrated:
1. **Partial Main Residence Exemption**: Property 1 (PPR then rental)
2. **Full Main Residence Exemption**: Property 2 (current PPR)
3. **Pure Investment**: Property 3 (never main residence)
4. **Short-term Investment**: Property 4 (investment held < 12 months eligible for CGT discount)

### Timeline Features Showcased:
- Multiple property ownership periods
- PPR to rental conversions
- Pure investment properties
- Overlapping property ownership
- Complete cost base tracking
- Capital improvements over time
- Both sold and current properties

---

## Cost Base Element Reference

### Purchase Costs (First Element):
- Purchase price
- Stamp duty
- Legal fees for purchase
- Valuation fees
- Building and pest inspections
- Buyer's agent fees
- Conveyancing fees
- Title search fees
- Loan establishment fees
- Mortgage insurance (if applicable)

### Capital Improvements (Second Element):
- Renovations (kitchens, bathrooms)
- Extensions and additions
- Structural improvements
- Major upgrades (decking, solar panels)
- NOT repairs and maintenance

### Selling Costs (Fifth Element):
- Real estate agent fees
- Legal fees for sale
- Advertising and marketing
- Staging costs
- Auction costs
- Conveyancing fees

---

## File Location
`/public/NewRequestsAndResponses/complete_demo_with_cost_bases.json`

## Default Loading
This scenario is automatically loaded when the application starts (configured in `src/store/timeline.ts`).
