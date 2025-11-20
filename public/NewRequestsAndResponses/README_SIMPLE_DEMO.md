# Simple Complete Demo Scenario

## Overview
This is a clean, simple demo scenario with **NO GAPS** in the timeline. All events flow seamlessly from one to another, making it perfect for demonstrations and testing.

## Key Features
✅ **No timeline gaps** - every period is accounted for
✅ **Same-date transitions** - purchase/move_in and move_out/rent_start occur on the same day
✅ **Clean event flow** - logical progression of property events
✅ **Complete cost bases** - all purchase costs and selling costs included
✅ **Simple to understand** - straightforward property scenarios

---

## Properties

### 1. 25 Sunshine Street, Sydney NSW 2000 (SOLD)
**Timeline**: 2015-2024 (9 years) - **NO GAPS**

**Events**:
- **15 Mar 2015**: Purchase ($650,000) + Move In (same day)
- **30 Jun 2020**: Move Out + Rent Start (same day - seamless transition)
- **15 Aug 2024**: Rent End + Sale ($950,000) (same day - seamless transition)

**Cost Base**:
- Purchase Price: $650,000
- Stamp Duty: $26,000
- Legal Fees: $3,200
- Valuation: $600
- Building Inspection: $750
- **Purchase Total**: $680,550

**Selling Costs**:
- Agent Fees: $23,750
- Legal Fees: $2,500
- Advertising: $3,200
- **Selling Total**: $29,450

**Total Cost Base**: $710,000
**Sale Price**: $950,000
**Capital Gain**: $240,000

**Occupancy**:
- Main Residence: 15 Mar 2015 - 30 Jun 2020 (5.3 years)
- Rental: 30 Jun 2020 - 15 Aug 2024 (4.1 years)
- **No gaps between occupancy periods**

---

### 2. 88 Harbour Boulevard, Melbourne VIC 3000 (CURRENT PPR)
**Timeline**: 2020-Present (4+ years) - **NO GAPS**

**Events**:
- **30 Jun 2020**: Purchase ($820,000) + Move In (same day - same day as Property 1 move out)
- **20 Sep 2022**: Kitchen & bathroom renovation ($45,000)

**Cost Base**:
- Purchase Price: $820,000
- Stamp Duty: $34,300
- Legal Fees: $3,800
- Valuation: $700
- Building Inspection: $850
- **Purchase Total**: $859,650
- Improvements: $45,000
- **Total Cost Base**: $904,650

**Occupancy**:
- Main Residence: 30 Jun 2020 - Present (4+ years)
- **Purchased same day as moved out of Property 1 - no overlap, no gap**

---

### 3. 42 Investment Avenue, Brisbane QLD 4000 (RENTAL)
**Timeline**: 2018-Present (6+ years) - **NO GAPS**

**Events**:
- **10 Nov 2018**: Purchase ($485,000) + Rent Start (same day)

**Cost Base**:
- Purchase Price: $485,000
- Stamp Duty: $18,700
- Legal Fees: $2,900
- Valuation: $550
- Building Inspection: $700
- **Total Cost Base**: $507,850

**Occupancy**:
- Rental: 10 Nov 2018 - Present (6+ years)
- Never main residence
- **No gaps in rental period**

---

## Timeline Visualization

```
Property 1 (Sydney):
2015 ████████████ PPR ████████████ 2020 ▓▓▓▓ Rental ▓▓▓▓ 2024 [SOLD]
     ↑ Purchase+Move In                ↑ Move Out+Rent Start  ↑ Rent End+Sale

Property 2 (Melbourne):
                                   2020 ████████████ PPR ████████████ Present
                                        ↑ Purchase+Move In (same day as P1 move out)

Property 3 (Brisbane):
          2018 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ Rental ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ Present
               ↑ Purchase+Rent Start
```

**Legend**:
- `████` = Main Residence (PPR)
- `▓▓▓▓` = Rental Period
- **NO GAPS** - all periods connect seamlessly

---

## Perfect for Demonstrations

### Why This Demo Works Well:
1. **No Verification Alerts** - clean data, no questions needed
2. **Logical Flow** - natural progression of property ownership
3. **Same-Day Transitions** - realistic moving behavior (sell one, buy another same day)
4. **Complete Information** - all cost base elements included
5. **Three Common Scenarios**:
   - Property 1: PPR → Rental → Sold
   - Property 2: Current PPR with improvements
   - Property 3: Pure investment (never PPR)

### CGT Concepts Demonstrated:
- ✅ Partial main residence exemption (Property 1)
- ✅ Full main residence exemption (Property 2 - current)
- ✅ No main residence exemption (Property 3 - pure investment)
- ✅ 50% CGT discount (all held > 12 months)
- ✅ Cost base calculations with purchase and selling costs
- ✅ Capital improvements to cost base (Property 2)

---

## File Location
`/public/NewRequestsAndResponses/simple_complete_demo.json`

## Default Loading
This scenario is automatically loaded when the application starts.

---

## Comparison with Other Demos

| Demo File | Properties | Gaps | Complexity | Use Case |
|-----------|-----------|------|------------|----------|
| `simple_complete_demo.json` | 3 | None | Low | **Default demo** - clean, simple |
| `complete_demo_with_cost_bases.json` | 4 | None | Medium | Comprehensive cost tracking |
| `4_new_timeline_request_with_gaps.json` | 3 | Many | High | Testing verification alerts |
| `1_new_complete_request_json.json` | 6 | None | Very High | Complex portfolio analysis |

---

## Perfect Timeline Flow

**No gaps means**:
- ✅ Move in same day as purchase
- ✅ Move out same day as rent starts
- ✅ Rent ends same day as sale
- ✅ Moving between properties on the same day (no overlap, no gap)
- ✅ No unknown periods
- ✅ No verification questions needed
- ✅ Ready for immediate CGT analysis
