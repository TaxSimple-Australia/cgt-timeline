# Humpty Doo Property - Complete Timeline

## Overview
Complete, gap-free timeline data for the Humpty Doo property, perfect for testing CGT calculations.

## Property Details
**Address**: 45 Collard Road, Humpty Doo NT 0836
**Status**: SOLD (2023)
**Total Ownership**: 20.5 years (2003-2023)

---

## Complete Timeline (NO GAPS)

### 1. Purchase & Move In
**Date**: January 1, 2003
**Events**: Purchase + Move In (same day)

**Purchase Costs**:
- Purchase Price: $106,000
- Stamp Duty: $3,180
- Legal Fees: $1,800
- Valuation: $400
- Building Inspection: $600
- **Total Purchase Cost Base**: $112,980

### 2. Main Residence Period
**Period**: Jan 1, 2003 - Dec 31, 2019
**Duration**: 17 years
**Status**: Main Residence (PPR)

### 3. Move Out
**Date**: December 31, 2019
**Event**: Move Out
**Transition**: Same day move out/next day rent start

### 4. Rental Period Begins
**Date**: January 1, 2020
**Event**: Rent Start
**Status**: Investment Property (Rental)

### 5. Rental Period
**Period**: Jan 1, 2020 - Jun 30, 2023
**Duration**: 3.5 years
**Status**: Rental Property

### 6. Rental Period Ends
**Date**: June 30, 2023
**Event**: Rent End
**Preparation**: Property prepared for sale

### 7. Sale
**Date**: July 14, 2023
**Event**: Sale
**Sale Price**: $450,000

**Selling Costs**:
- Agent Fees: $11,250 (2.5%)
- Legal Fees: $1,800
- Advertising: $2,500
- **Total Selling Costs**: $15,550

---

## Complete Event Flow (NO GAPS)

```
2003 ══════════════════ Main Residence (PPR) ══════════════════ 2019
↑                                                                 ↓
Jan 1: Purchase + Move In                                Dec 31: Move Out
                                                          ↓
2020 ▓▓▓▓▓▓▓▓▓▓▓▓ Rental ▓▓▓▓▓▓▓▓▓▓▓▓ 2023
↑                                      ↓        ↓
Jan 1: Rent Start              Jun 30: Rent End  Jul 14: Sale
```

**Legend**:
- `══` = Main Residence Period
- `▓▓` = Rental Period
- ✅ **NO GAPS** - Every period accounted for

---

## Cost Base Calculation

### Total Cost Base
| Component | Amount |
|-----------|--------|
| Purchase Price | $106,000 |
| Stamp Duty | $3,180 |
| Legal Fees (Purchase) | $1,800 |
| Valuation | $400 |
| Building Inspection | $600 |
| Agent Fees (Sale) | $11,250 |
| Legal Fees (Sale) | $1,800 |
| Advertising | $2,500 |
| **Total Cost Base** | **$127,530** |

### Capital Gain Calculation
| Item | Amount |
|------|--------|
| Sale Price | $450,000 |
| Less: Cost Base | -$127,530 |
| **Capital Gain** | **$322,470** |

---

## CGT Exemptions

### Main Residence Exemption
- **PPR Period**: Jan 1, 2003 - Dec 31, 2019 (17 years)
- **Rental Period**: Jan 1, 2020 - Jul 14, 2023 (3.57 years)
- **Total Ownership**: 20.57 years

**Exemption Calculation**:
- PPR Years: 17 years
- Total Ownership: 20.57 years
- **Exempt Portion**: 17/20.57 = 82.6%
- **Taxable Portion**: 17.4%

### Taxable Capital Gain
| Calculation | Amount |
|-------------|--------|
| Total Capital Gain | $322,470 |
| Taxable Portion (17.4%) | $56,110 |
| 50% CGT Discount (held > 12 months) | -$28,055 |
| **Net Taxable Gain** | **$28,055** |

---

## Timeline Features

### ✅ Perfect Timeline (No Gaps)
1. **Purchase & Move In**: Same day (Jan 1, 2003)
2. **Move Out & Rent Start**: Consecutive days (Dec 31, 2019 → Jan 1, 2020)
3. **Rent End & Sale**: Close timing (Jun 30 → Jul 14, 2023)
4. **Complete Records**: Every period documented
5. **Full Cost Base**: All purchase and selling costs included

### Why This Works for Testing
- ✅ No verification alerts
- ✅ No timeline gaps
- ✅ Complete cost base data
- ✅ Clean PPR to rental conversion
- ✅ Realistic ownership period (20+ years)
- ✅ Demonstrates partial main residence exemption
- ✅ Shows 50% CGT discount eligibility

---

## File Locations

### JSON Data File
`/public/NewRequestsAndResponses/humpty_doo_complete.json`

### Fallback Data
Also included in `src/store/timeline.ts` as fallback demo data (Property 1)

---

## Usage

### Load as Default
To make this the default demo, update `src/store/timeline.ts`:
```typescript
loadDemoData: async () => {
  const response = await fetch('/NewRequestsAndResponses/humpty_doo_complete.json');
  // ...
}
```

### Load for Testing
Use the importTimelineData function or manually load via the app.

---

## Comparison: Before vs After Fix

### Before (HAD GAPS)
```
2003: Purchase + Move In
                    ❌ GAP: 17 years missing move_out event
2020: Rent Start
                    ❌ GAP: 3.5 years missing rent_end event
2023: Sale
```

### After (NO GAPS)
```
2003: Purchase + Move In
2019: Move Out ✅
2020: Rent Start ✅
2023: Rent End ✅
2023: Sale ✅
```

---

## Events Summary

| # | Date | Event | Amount | Type |
|---|------|-------|--------|------|
| 1 | Jan 1, 2003 | Purchase | $106,000 | Purchase |
| 2 | Jan 1, 2003 | Move In | - | Occupancy |
| 3 | Dec 31, 2019 | Move Out | - | Occupancy |
| 4 | Jan 1, 2020 | Rent Start | - | Rental |
| 5 | Jun 30, 2023 | Rent End | - | Rental |
| 6 | Jul 14, 2023 | Sale | $450,000 | Sale |

**Total Events**: 6
**Gaps**: 0
**Complete**: ✅

---

## Perfect for Testing

This property is ideal for testing:
1. ✅ Long-term ownership (20+ years)
2. ✅ PPR to rental conversion
3. ✅ Partial main residence exemption
4. ✅ 50% CGT discount
5. ✅ Complete cost base tracking
6. ✅ No gaps in timeline
7. ✅ No verification alerts needed
8. ✅ Realistic NT property values and dates
