# CGT Timeline - Additional Test Scenarios

This document contains 5 additional CGT (Capital Gains Tax) scenarios for testing the CGT Brain timeline application. Each scenario demonstrates different aspects of Australian CGT rules, including the main residence exemption, six-year absence rule, partial exemptions, and more.

## Table of Contents
1. [New Scenario 1: Full Main Residence Exemption](#new-scenario-1-full-main-residence-exemption)
2. [New Scenario 2: Six-Year Absence Rule (Within 6 Years)](#new-scenario-2-six-year-absence-rule-within-6-years)
3. [New Scenario 3: Six-Year Absence Rule Exceeded (Partial Exemption)](#new-scenario-3-six-year-absence-rule-exceeded-partial-exemption)
4. [New Scenario 4: Rental First, Then Main Residence](#new-scenario-4-rental-first-then-main-residence)
5. [New Scenario 5: Moving Between Main Residences (6-Month Overlap Rule)](#new-scenario-5-moving-between-main-residences-6-month-overlap-rule)

---

## CGT Rules Reference

### Key Rules Applied in These Scenarios

| Rule | Description | Reference |
|------|-------------|-----------|
| **Full Main Residence Exemption** | Capital gain is disregarded if the dwelling was main residence for entire ownership period | ITAA97 s118.110 |
| **Six-Year Absence Rule** | Can treat former home as main residence for up to 6 years while rented | ITAA97 s118.145 |
| **50% CGT Discount** | 50% discount for assets held more than 12 months (individuals only) | ITAA97 s115.25 |
| **First Use to Produce Income Rule** | Market value at first rental becomes cost base if main residence rented out | ITAA97 s118.192 |
| **Moving Between Residences** | Both dwellings treated as main residence for up to 6 months during overlap | ITAA97 s118.140 |
| **Partial Exemption Formula** | Taxable portion = Capital Gain × (Non-main-residence days ÷ Total ownership days) | ITAA97 s118.185 |

### Cost Base Elements (Five Elements)

1. **First Element**: Money paid for asset (purchase price)
2. **Second Element**: Incidental costs of acquisition (stamp duty, legal fees, inspections)
3. **Third Element**: Costs of owning the asset (not claimable as deductions)
4. **Fourth Element**: Capital improvements
5. **Fifth Element**: Costs incurred in selling the asset

### Market Value at First Income (Revised Cost Base)

When a property transitions from main residence to rental (move_out event followed by rent_start), the `market_value` field captures the revised cost base at that point in time. This is critical for:

- **First Use to Produce Income Rule (s118.192)**: When a main residence is first rented out, the market value at that time can become the new cost base for CGT purposes
- **Partial Exemption Calculations**: The accumulated cost base at move_out helps determine the taxable portion

The `market_value` should be the sum of:
- Purchase price
- Acquisition costs (stamp duty, legal fees)
- Capital improvements made before move_out
- Any other eligible cost base elements accumulated before the property was rented

---

## New Scenario 1: Full Main Residence Exemption

### Description
Thomas purchases his first home and lives in it continuously from purchase until sale. As he resided in the dwelling for the entire ownership period and never used it to produce income, he qualifies for the **full main residence exemption**.

### Key Facts
- **Property**: 18 Riverside Terrace, Newstead QLD 4006
- **Purchase Date**: 1 June 2014
- **Purchase Price**: $545,000
- **Sale Date**: 15 September 2024
- **Sale Price**: $1,020,000
- **Total Ownership**: 3,759 days (10 years, 3.5 months)
- **Main Residence Days**: 3,759 days (100%)

### Timeline of Events

| Date | Event | Details |
|------|-------|---------|
| 01 Jun 2014 | Purchase | $545,000 + $21,800 stamp duty + $2,300 legal fees |
| 01 Jun 2014 | Move In | Established as main residence |
| 15 Mar 2017 | Improvement | Deck and outdoor entertaining area: $38,000 |
| 01 Aug 2020 | Improvement | Solar panels and battery system: $22,000 |
| 15 Sep 2024 | Sale | $1,020,000 (agent fees: $25,500, legal fees: $2,100) |

### CGT Calculation

```
Step 1: Calculate Capital Proceeds
  Sale Price:                           $1,020,000

Step 2: Calculate Cost Base
  Purchase Price:                       $545,000
  Stamp Duty:                           $21,800
  Purchase Legal Fees:                  $2,300
  Deck/Outdoor Area:                    $38,000
  Solar System:                         $22,000
  Sale Agent Fees:                      $25,500
  Sale Legal Fees:                      $2,100
  ─────────────────────────────────────────────
  Total Cost Base:                      $656,700

Step 3: Calculate Capital Gain
  Capital Gain = $1,020,000 - $656,700 = $363,300

Step 4: Apply Main Residence Exemption
  Main Residence Days: 3,759 / 3,759 = 100%
  Exemption: FULL (100%)

Step 5: Taxable Capital Gain
  Taxable Amount = $0 (FULLY EXEMPT)

RESULT: NO CGT PAYABLE
```

### Applicable Rules
- **ITAA97 s118.110**: Full main residence exemption applies
- Property was main residence for entire ownership period
- No income-producing use

### Timeline JSON

```json
{
  "properties": [
    {
      "address": "18 Riverside Terrace, Newstead QLD 4006",
      "property_history": [
        {
          "date": "2014-06-01",
          "event": "purchase",
          "price": 545000,
          "stamp_duty": 21800,
          "purchase_legal_fees": 2300
        },
        {
          "date": "2014-06-01",
          "event": "move_in"
        },
        {
          "date": "2017-03-15",
          "event": "improvement",
          "price": 38000
        },
        {
          "date": "2020-08-01",
          "event": "improvement",
          "price": 22000
        },
        {
          "date": "2024-09-15",
          "event": "sale",
          "price": 1020000,
          "contract_date": "2024-09-15",
          "agent_fees": 25500,
          "legal_fees": 2100
        }
      ],
      "notes": "sold - Full main residence exemption applies. Lived in property entire ownership period."
    }
  ],
  "user_query": "I lived in my home for the entire time I owned it. What is my CGT liability on sale?",
  "additional_info": {
    "australian_resident": true
  }
}
```

---

## New Scenario 2: Six-Year Absence Rule (Within 6 Years)

### Description
Amanda purchases a home, lives in it for 3 years, then accepts a job transfer to another city and rents out the property. She sells the property after 4.5 years of renting. As the rental period is **less than 6 years** and she chose to treat it as her main residence during absence (and didn't claim another property as main residence), the **full exemption** applies under the six-year rule.

### Key Facts
- **Property**: 55 Panorama Drive, Surfers Paradise QLD 4217
- **Purchase Date**: 1 March 2016
- **Purchase Price**: $720,000
- **Sale Date**: 1 November 2024
- **Sale Price**: $1,350,000
- **Total Ownership**: 3,168 days (8 years, 8 months)
- **Lived In**: 1,096 days (3 years)
- **Rented**: 2,072 days (5 years, 8 months)
- **Six-Year Rule**: Applies (rental period < 6 years)

### Timeline of Events

| Date | Event | Details                                              |
|------|-------|------------------------------------------------------|
| 01 Mar 2016 | Purchase | $720,000 + $28,800 stamp duty + $3,500 legal fees    |
| 01 Mar 2016 | Move In | Established as main residence                        |
| 01 Oct 2017 | Improvement | Pool installation: $48,000                           |
| 01 Mar 2019 | Move Out | Relocated to Melbourne for work                      |
| 01 Mar 2019 | Rent Start | Tenant moves in (same day as move out)               |
| 01 Nov 2024 | Sale | $1,350,000 (agent fees: $33,750, legal fees: $3,000) |

### CGT Calculation

```
Step 1: Calculate Rental Period
  Rent Start: 1 March 2019
  Sale Date: 1 November 2024
  Rental Period = 2,072 days = 5.67 years

  ✓ Rental period is LESS than 6 years

Step 2: Six-Year Rule Assessment
  - Property was main residence before renting: ✓
  - Rental period under 6 years: ✓
  - No other property claimed as main residence: ✓

  RESULT: Full main residence exemption applies

Step 3: Calculate Capital Gain (for reference)
  Sale Price:                           $1,350,000

  Cost Base:
  Purchase Price:                       $720,000
  Stamp Duty:                           $28,800
  Purchase Legal Fees:                  $3,500
  Pool Installation:                    $48,000
  Sale Agent Fees:                      $33,750
  Sale Legal Fees:                      $3,000
  ─────────────────────────────────────────────
  Total Cost Base:                      $837,050

  Capital Gain = $1,350,000 - $837,050 = $512,950

Step 4: Apply Main Residence Exemption (Six-Year Rule)
  Under s118.145, property continues to be treated as main residence
  Exemption: FULL (100%)

Step 5: Taxable Capital Gain
  Taxable Amount = $0 (FULLY EXEMPT)

RESULT: NO CGT PAYABLE
```

### Applicable Rules
- **ITAA97 s118.145**: Six-year absence rule applies
- Property treated as main residence during absence
- Rental period (5.67 years) < 6 years
- No other property claimed as main residence during this period

### Timeline JSON

```json
{
  "properties": [
    {
      "address": "55 Panorama Drive, Surfers Paradise QLD 4217",
      "property_history": [
        {
          "date": "2016-03-01",
          "event": "purchase",
          "price": 720000,
          "stamp_duty": 28800,
          "purchase_legal_fees": 3500
        },
        {
          "date": "2016-03-01",
          "event": "move_in"
        },
        {
          "date": "2017-10-01",
          "event": "improvement",
          "price": 48000
        },
        {
          "date": "2019-03-01",
          "event": "move_out",
          "market_value": 800300
        },
        {
          "date": "2019-03-01",
          "event": "rent_start"
        },
        {
          "date": "2024-11-01",
          "event": "sale",
          "price": 1350000,
          "contract_date": "2024-11-01",
          "agent_fees": 33750,
          "legal_fees": 3000
        }
      ],
      "notes": "sold - Six-year absence rule applies. Rented for 5.67 years while working in Melbourne. Full exemption."
    }
  ],
  "user_query": "I moved to Melbourne for work and rented my Gold Coast home for about 5.5 years before selling. What is my CGT liability?",
  "additional_info": {
    "australian_resident": true
  }
}
```

---

## New Scenario 3: Six-Year Absence Rule Exceeded (Partial Exemption)

### Description
Peter purchases a home, lives in it for 4 years, then moves to Singapore for an extended work assignment and rents the property. He returns and sells the property after **8 years** of renting. Since the rental period exceeds 6 years, only the first 6 years of rental are covered by the main residence exemption. The remaining 2 years are subject to CGT, resulting in a **partial exemption**.

### Key Facts
- **Property**: 42 Harbour View Road, McMahons Point NSW 2060
- **Purchase Date**: 1 January 2012
- **Move In Date**: 1 January 2012
- **Move Out Date**: 1 January 2016
- **Rent Start Date**: 1 January 2016 (same day as move out)
- **Sale Date**: 1 September 2024
- **Purchase Price**: $890,000
- **Market Value at First Rental**: $1,050,000 (First use to produce income rule applies)
- **Sale Price**: $2,150,000
- **Total Ownership Days**: 4,627 days (from purchase to sale)
- **Rental Period**: 3,166 days (8.67 years)

### Timeline of Events

| Date | Event | Details |
|------|-------|---------|
| 01 Jan 2012 | Purchase | $890,000 + $35,600 stamp duty + $4,200 legal fees |
| 01 Jan 2012 | Move In | Established as main residence |
| 15 Jun 2014 | Improvement | Kitchen renovation: $55,000 |
| 01 Jan 2016 | Move Out | Relocated to Singapore for work |
| 01 Jan 2016 | Rent Start | Tenant moves in. Market value: $1,050,000 |
| 01 Sep 2024 | Sale | $2,150,000 (agent fees: $53,750, legal fees: $4,500) |

### CGT Calculation

```
Step 1: Apply First Use to Produce Income Rule (s118.192)
  Since property was main residence then rented:
  - Deemed acquisition date: 1 January 2016
  - Deemed cost base: $1,050,000 (market value at first rental)

Step 2: Calculate Rental Period
  Rent Start: 1 January 2016
  Sale Date: 1 September 2024
  Total Rental Period = 3,166 days = 8.67 years

  ✗ Rental period EXCEEDS 6 years by 2.67 years (976 days)

Step 3: Calculate Ownership Period (from deemed acquisition)
  Deemed Acquisition: 1 January 2016
  Sale Date: 1 September 2024
  Total Ownership = 3,166 days

Step 4: Calculate Non-Main-Residence Days
  Total rental days: 3,166 days
  Six-year exemption: 2,191 days (6 years)
  Non-main-residence days: 3,166 - 2,191 = 975 days

Step 5: Calculate Capital Gain
  Sale Price:                           $2,150,000

  Cost Base (from deemed acquisition):
  Deemed Acquisition Value:             $1,050,000
  Sale Agent Fees:                      $53,750
  Sale Legal Fees:                      $4,500
  ─────────────────────────────────────────────
  Total Cost Base:                      $1,108,250

  Capital Gain = $2,150,000 - $1,108,250 = $1,041,750

Step 6: Apply Partial Main Residence Exemption
  Taxable Proportion = Non-MR Days / Total Ownership Days
  Taxable Proportion = 975 / 3,166 = 30.80%

  Taxable Capital Gain = $1,041,750 × 30.80% = $320,859

Step 7: Apply 50% CGT Discount
  Held > 12 months: ✓
  Discounted Gain = $320,859 × 50% = $160,430

RESULT: NET CAPITAL GAIN = $160,430
```

### Applicable Rules
- **ITAA97 s118.192**: First use to produce income rule (deemed acquisition at market value)
- **ITAA97 s118.145**: Six-year absence rule (partial - exceeded 6 years)
- **ITAA97 s115.25**: 50% CGT discount applies (held > 12 months)

### Timeline JSON

```json
{
  "properties": [
    {
      "address": "42 Harbour View Road, McMahons Point NSW 2060",
      "property_history": [
        {
          "date": "2012-01-01",
          "event": "purchase",
          "price": 890000,
          "stamp_duty": 35600,
          "purchase_legal_fees": 4200
        },
        {
          "date": "2012-01-01",
          "event": "move_in"
        },
        {
          "date": "2014-06-15",
          "event": "improvement",
          "price": 55000
        },
        {
          "date": "2016-01-01",
          "event": "move_out",
          "market_value": 1050000
        },
        {
          "date": "2016-01-01",
          "event": "rent_start"
        },
        {
          "date": "2024-09-01",
          "event": "sale",
          "price": 2150000,
          "contract_date": "2024-09-01",
          "agent_fees": 53750,
          "legal_fees": 4500
        }
      ],
      "notes": "sold - Six-year rule exceeded. Rented for 8.67 years while in Singapore. Partial exemption applies. First use to produce income rule triggered."
    }
  ],
  "user_query": "I rented my Sydney home for over 8 years while working in Singapore. How much CGT do I owe now that I've sold?",
  "additional_info": {
    "australian_resident": true,
    "market_value_at_first_rental": 1050000
  }
}
```

---

## New Scenario 4: Rental First, Then Main Residence

### Description
Nicole purchases an investment property and rents it out immediately. After 4 years, she decides to move in and make it her main residence. She lives there for 6 years before selling. Because the property was **rented before becoming a main residence**, the six-year absence rule does NOT apply. Only the period as main residence is exempt.

### Key Facts
- **Property**: 127 Exhibition Street, Melbourne VIC 3000
- **Purchase Date**: 1 April 2014
- **Purchase Price**: $485,000
- **Rent Period**: 1 April 2014 to 15 May 2018 (1,505 days)
- **Move In Date**: 15 May 2018 (same day as rent end)
- **Sale Date**: 1 October 2024
- **Sale Price**: $875,000
- **Total Ownership**: 3,836 days
- **Non-Main-Residence Days**: 1,505 days (rental period)

### Timeline of Events

| Date | Event | Details |
|------|-------|---------|
| 01 Apr 2014 | Purchase | $485,000 + $19,400 stamp duty + $2,900 legal fees |
| 01 Apr 2014 | Rent Start | Rented as investment property (same day as purchase) |
| 15 May 2018 | Rent End | Tenant vacates |
| 15 May 2018 | Move In | Owner moves in as main residence (same day as rent end) |
| 01 Aug 2021 | Improvement | Bathroom renovation: $28,000 |
| 01 Oct 2024 | Sale | $875,000 (agent fees: $21,875, legal fees: $2,600) |

### CGT Calculation

```
Step 1: Verify Six-Year Rule Eligibility
  Property was rented BEFORE being used as main residence

  ✗ Six-year rule does NOT apply (only applies when main residence first)

Step 2: Calculate Ownership Periods
  Total Ownership: 1 Apr 2014 to 1 Oct 2024 = 3,836 days

  Rental Period (Non-MR): 1 Apr 2014 to 15 May 2018 = 1,505 days
  Main Residence Period: 15 May 2018 to 1 Oct 2024 = 2,331 days

Step 3: Calculate Capital Gain
  Sale Price:                           $875,000

  Cost Base:
  Purchase Price:                       $485,000
  Stamp Duty:                           $19,400
  Purchase Legal Fees:                  $2,900
  Bathroom Renovation:                  $28,000
  Sale Agent Fees:                      $21,875
  Sale Legal Fees:                      $2,600
  ─────────────────────────────────────────────
  Total Cost Base:                      $559,775

  Capital Gain = $875,000 - $559,775 = $315,225

Step 4: Apply Partial Main Residence Exemption
  Taxable Proportion = Non-MR Days / Total Ownership Days
  Taxable Proportion = 1,505 / 3,836 = 39.23%

  Exempt Proportion = 2,331 / 3,836 = 60.77%
  Exempt Amount = $315,225 × 60.77% = $191,558

  Taxable Capital Gain = $315,225 × 39.23% = $123,667

Step 5: Apply 50% CGT Discount
  Held > 12 months: ✓
  Discounted Gain = $123,667 × 50% = $61,834

RESULT: NET CAPITAL GAIN = $61,834
```

### Applicable Rules
- **ITAA97 s118.185**: Partial main residence exemption
- **Six-year rule NOT applicable**: Property was investment first, then main residence
- **ITAA97 s115.25**: 50% CGT discount applies

### Timeline JSON

```json
{
  "properties": [
    {
      "address": "127 Exhibition Street, Melbourne VIC 3000",
      "property_history": [
        {
          "date": "2014-04-01",
          "event": "purchase",
          "price": 485000,
          "stamp_duty": 19400,
          "purchase_legal_fees": 2900
        },
        {
          "date": "2014-04-01",
          "event": "rent_start"
        },
        {
          "date": "2018-05-15",
          "event": "rent_end"
        },
        {
          "date": "2018-05-15",
          "event": "move_in"
        },
        {
          "date": "2021-08-01",
          "event": "improvement",
          "price": 28000
        },
        {
          "date": "2024-10-01",
          "event": "sale",
          "price": 875000,
          "contract_date": "2024-10-01",
          "agent_fees": 21875,
          "legal_fees": 2600
        }
      ],
      "notes": "sold - Investment property converted to main residence. Partial exemption for main residence period only."
    }
  ],
  "user_query": "I bought an investment property, rented it for 4 years, then moved in for 6 years before selling. What CGT do I owe?",
  "additional_info": {
    "australian_resident": true
  }
}
```

---

## New Scenario 5: Moving Between Main Residences (6-Month Overlap Rule)

### Description
Karen owns her main residence (Property 1) and purchases a new home (Property 2). She moves into the new home while still owning the old one. This scenario demonstrates the **6-month overlap rule** where both properties can be treated as main residence for up to 6 months during the transition period.

### Key Facts

#### Property 1: Original Home
- **Address**: 65 Parkview Crescent, Toowong QLD 4066
- **Purchase Date**: 1 July 2010
- **Purchase Price**: $510,000
- **Sale Date**: 15 August 2024
- **Sale Price**: $980,000
- **Total Ownership**: 5,159 days

#### Property 2: New Home
- **Address**: 22 Ridgeline Drive, Chapel Hill QLD 4069
- **Purchase Date**: 1 April 2024
- **Purchase Price**: $1,150,000
- **Current Status**: Main Residence (not sold)

#### Overlap Period
- **New Home Purchase (Move In)**: 1 April 2024
- **Old Home Sale**: 15 August 2024
- **Overlap Duration**: 136 days (4.5 months)
- **Within 6-Month Limit**: YES

### Timeline of Events

#### Property 1 Events
| Date | Event | Details |
|------|-------|---------|
| 01 Jul 2010 | Purchase | $510,000 + $17,850 stamp duty + $2,800 legal fees |
| 01 Jul 2010 | Move In | Established as main residence (same day as purchase) |
| 15 Sep 2015 | Improvement | Extension and renovations: $85,000 |
| 01 Apr 2024 | Move Out | Moved to new home (Property 2) |
| 15 Aug 2024 | Sale | $980,000 (agent fees: $24,500, legal fees: $2,400) |

#### Property 2 Events
| Date | Event | Details |
|------|-------|---------|
| 01 Apr 2024 | Purchase | $1,150,000 + $46,000 stamp duty + $5,200 legal fees |
| 01 Apr 2024 | Move In | Established as new main residence (same day as purchase) |

### CGT Calculation - Property 1

```
Step 1: Verify 6-Month Overlap Rule Eligibility (s118.140)
  Requirements:
  - Lived in Property 1 for at least 3 months in past 12 months: ✓
    (Lived there until 1 Apr 2024, sold 15 Aug 2024)
  - Property 1 did not produce income during overlap: ✓
    (Was not rented)
  - Overlap period ≤ 6 months: ✓
    (136 days = 4.5 months)

  RESULT: Both properties treated as main residence during overlap

Step 2: Calculate Main Residence Period for Property 1
  Purchase: 1 July 2010
  Sale: 15 August 2024
  Total Ownership = 5,159 days

  Property 1 treated as main residence: ENTIRE period
  (Including overlap period under s118.140)

Step 3: Calculate Capital Gain (for reference)
  Sale Price:                           $980,000

  Cost Base:
  Purchase Price:                       $510,000
  Stamp Duty:                           $17,850
  Purchase Legal Fees:                  $2,800
  Extension/Renovations:                $85,000
  Sale Agent Fees:                      $24,500
  Sale Legal Fees:                      $2,400
  ─────────────────────────────────────────────
  Total Cost Base:                      $642,550

  Capital Gain = $980,000 - $642,550 = $337,450

Step 4: Apply Main Residence Exemption
  Under s118.140, both homes treated as main residence for overlap
  Property 1 was main residence for entire ownership
  Exemption: FULL (100%)

Step 5: Taxable Capital Gain
  Taxable Amount = $0 (FULLY EXEMPT)

RESULT: NO CGT PAYABLE
```

### What If Overlap Exceeded 6 Months?

If Karen had sold Property 1 **after** 1 October 2024 (more than 6 months after purchasing Property 2):

```
Example: Sale on 15 December 2024 (8.5 months overlap)

Step 1: Determine Taxable Period
  Only 6 months before sale date can have overlapping exemption
  Sale Date: 15 December 2024
  6 months before: 15 June 2024
  New Home Purchase: 1 April 2024

  Non-exempt overlap: 1 Apr 2024 to 15 Jun 2024 = 75 days

  One property must NOT be main residence for 75 days
  Karen must choose which property loses exemption for this period

Step 2: If Property 1 Loses Exemption for 75 Days
  Total Ownership: 5,281 days (1 Jul 2010 to 15 Dec 2024)
  Non-MR Days: 75 days

  Taxable Proportion = 75 / 5,281 = 1.42%
  Taxable Gain = $337,450 × 1.42% = $4,792
  After 50% discount = $2,396
```

### Applicable Rules
- **ITAA97 s118.140**: Moving between main residences (6-month overlap rule)
- Both properties can be main residence for up to 6 months during transition
- If exceeded, one property loses exemption for the excess period

### Timeline JSON

```json
{
  "properties": [
    {
      "address": "65 Parkview Crescent, Toowong QLD 4066",
      "property_history": [
        {
          "date": "2010-07-01",
          "event": "purchase",
          "price": 510000,
          "stamp_duty": 17850,
          "purchase_legal_fees": 2800
        },
        {
          "date": "2010-07-01",
          "event": "move_in"
        },
        {
          "date": "2015-09-15",
          "event": "improvement",
          "price": 85000
        },
        {
          "date": "2024-04-01",
          "event": "move_out",
          "market_value": 642550
        },
        {
          "date": "2024-08-15",
          "event": "sale",
          "price": 980000,
          "contract_date": "2024-08-15",
          "agent_fees": 24500,
          "legal_fees": 2400
        }
      ],
      "notes": "sold - Original main residence sold within 6-month overlap period. Full exemption under s118.140."
    },
    {
      "address": "22 Ridgeline Drive, Chapel Hill QLD 4069",
      "property_history": [
        {
          "date": "2024-04-01",
          "event": "purchase",
          "price": 1150000,
          "stamp_duty": 46000,
          "purchase_legal_fees": 5200
        },
        {
          "date": "2024-04-01",
          "event": "move_in"
        }
      ],
      "notes": "ppr - Current main residence. Overlap with Property 1 sale within 6-month window."
    }
  ],
  "user_query": "I bought a new home and moved in before selling my old home. The overlap was about 4.5 months. What CGT do I owe?",
  "additional_info": {
    "australian_resident": true
  }
}
```

---

## Summary Table

| Scenario | Key Rule | Rental Period | Exemption | Net Capital Gain |
|----------|----------|---------------|-----------|------------------|
| New 1. Full Main Residence | s118.110 | None | 100% | $0 |
| New 2. Six-Year Rule (Within) | s118.145 | 5.67 years | 100% | $0 |
| New 3. Six-Year Rule (Exceeded) | s118.145 + s118.192 | 8.67 years | 69.20% | $160,430 |
| New 4. Rental First | s118.185 | 4 years (before MR) | 60.77% | $61,834 |
| New 5. Moving Between Residences | s118.140 | None (overlap) | 100% | $0 |

---

## Date Gap Rules

To avoid timeline verification issues, the following date rules should be applied:

1. **Purchase + Move In**: Should occur on the same date when owner-occupied from start
2. **Purchase + Rent Start**: Should occur on the same date when investment property from start
3. **Move Out + Rent Start**: Should occur on the same date when converting to rental
4. **Rent End + Move In**: Should occur on the same date when converting from rental to owner-occupied
5. **Move Out + Sale**: Can have a gap (property vacant before sale)
6. **Rent End + Sale**: Should occur on the same date or rent_end should be on sale date

---

## Sources and References

- [ATO: How to calculate your CGT](https://www.ato.gov.au/individuals-and-families/investments-and-assets/capital-gains-tax/calculating-your-cgt/how-to-calculate-your-cgt)
- [ATO: Treating former home as main residence](https://www.ato.gov.au/individuals-and-families/investments-and-assets/capital-gains-tax/property-and-capital-gains-tax/your-main-residence---home/treating-former-home-as-main-residence)
- [ATO: Moving to a new main residence](https://www.ato.gov.au/individuals-and-families/investments-and-assets/capital-gains-tax/property-and-capital-gains-tax/your-main-residence---home/moving-to-a-new-main-residence)
- [ATO: Your main residence - home](https://www.ato.gov.au/individuals-and-families/investments-and-assets/capital-gains-tax/property-and-capital-gains-tax/your-main-residence-home)
- ITAA97 s118.110, s118.140, s118.145, s118.185, s118.192, s115.25

---

*Document generated for CGT Brain Timeline Application testing purposes.*
*Last updated: December 2024*
