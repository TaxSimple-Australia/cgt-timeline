# CGT Timeline Test Scenarios

This document contains 5 comprehensive CGT (Capital Gains Tax) scenarios for testing the CGT Brain timeline application. Each scenario demonstrates different aspects of Australian CGT rules, including the main residence exemption, six-year absence rule, partial exemptions, and more.

## Table of Contents
1. [Scenario 1: Full Main Residence Exemption](#scenario-1-full-main-residence-exemption)
2. [Scenario 2: Six-Year Absence Rule (Within 6 Years)](#scenario-2-six-year-absence-rule-within-6-years)
3. [Scenario 3: Six-Year Absence Rule Exceeded (Partial Exemption)](#scenario-3-six-year-absence-rule-exceeded-partial-exemption)
4. [Scenario 4: Rental First, Then Main Residence (First Use to Produce Income)](#scenario-4-rental-first-then-main-residence-first-use-to-produce-income)
5. [Scenario 5: Moving Between Main Residences (6-Month Overlap Rule)](#scenario-5-moving-between-main-residences-6-month-overlap-rule)

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

---

## Scenario 1: Full Main Residence Exemption

### Description
Sarah purchases her first home and lives in it continuously from purchase until sale. As she resided in the dwelling for the entire ownership period and never used it to produce income, she qualifies for the **full main residence exemption**.

### Key Facts
- **Property**: 42 Jacaranda Avenue, Paddington QLD 4064
- **Purchase Date**: 15 March 2015
- **Purchase Price**: $620,000
- **Sale Date**: 20 November 2024
- **Sale Price**: $1,150,000
- **Total Ownership**: 3,538 days (9 years, 8 months)
- **Main Residence Days**: 3,538 days (100%)

### Timeline of Events

| Date | Event | Details |
|------|-------|---------|
| 15 Mar 2015 | Purchase | $620,000 + $24,800 stamp duty + $2,500 legal fees |
| 15 Mar 2015 | Move In | Established as main residence |
| 01 Jun 2018 | Improvement | Kitchen renovation: $45,000 |
| 15 Sep 2021 | Improvement | Bathroom upgrade: $28,000 |
| 20 Nov 2024 | Sale | $1,150,000 (agent fees: $28,750, legal fees: $2,200) |

### CGT Calculation

```
Step 1: Calculate Capital Proceeds
  Sale Price:                           $1,150,000

Step 2: Calculate Cost Base
  Purchase Price:                       $620,000
  Stamp Duty:                           $24,800
  Purchase Legal Fees:                  $2,500
  Kitchen Renovation:                   $45,000
  Bathroom Upgrade:                     $28,000
  Sale Agent Fees:                      $28,750
  Sale Legal Fees:                      $2,200
  ─────────────────────────────────────────────
  Total Cost Base:                      $751,250

Step 3: Calculate Capital Gain
  Capital Gain = $1,150,000 - $751,250 = $398,750

Step 4: Apply Main Residence Exemption
  Main Residence Days: 3,538 / 3,538 = 100%
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
      "address": "42 Jacaranda Avenue, Paddington QLD 4064",
      "property_history": [
        {
          "date": "2015-03-15",
          "event": "purchase",
          "price": 620000,
          "stamp_duty": 24800,
          "purchase_legal_fees": 2500
        },
        {
          "date": "2015-03-15",
          "event": "move_in"
        },
        {
          "date": "2018-06-01",
          "event": "improvement",
          "price": 45000
        },
        {
          "date": "2021-09-15",
          "event": "improvement",
          "price": 28000
        },
        {
          "date": "2024-11-20",
          "event": "sale",
          "price": 1150000,
          "contract_date": "2024-11-20",
          "agent_fees": 28750,
          "legal_fees": 2200
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

## Scenario 2: Six-Year Absence Rule (Within 6 Years)

### Description
Michael purchases a home, lives in it for 4 years, then moves interstate for work and rents out the property. He sells the property after 5 years of renting. As the rental period is **less than 6 years** and he chose to treat it as his main residence during absence (and didn't claim another property as main residence), the **full exemption** applies under the six-year rule.

### Key Facts
- **Property**: 88 Harbour Street, Sydney NSW 2000
- **Purchase Date**: 1 July 2015
- **Purchase Price**: $850,000
- **Sale Date**: 15 August 2024
- **Sale Price**: $1,580,000
- **Total Ownership**: 3,333 days (9 years, 1.5 months)
- **Lived In**: 1,461 days (4 years)
- **Rented**: 1,872 days (5 years, 1.5 months)
- **Six-Year Rule**: Applies (rental period < 6 years)

### Timeline of Events

| Date | Event | Details |
|------|-------|---------|
| 01 Jul 2015 | Purchase | $850,000 + $34,000 stamp duty + $3,800 legal fees |
| 01 Jul 2015 | Move In | Established as main residence |
| 15 Mar 2017 | Improvement | New deck and landscaping: $32,000 |
| 30 Jun 2019 | Move Out | Relocated interstate for work |
| 15 Jul 2019 | Rent Start | Tenant moves in |
| 15 Aug 2024 | Sale | $1,580,000 (agent fees: $39,500, legal fees: $3,200) |

### CGT Calculation

```
Step 1: Calculate Rental Period
  Rent Start: 15 July 2019
  Sale Date: 15 August 2024
  Rental Period = 1,858 days = 5.09 years

  ✓ Rental period is LESS than 6 years

Step 2: Six-Year Rule Assessment
  - Property was main residence before renting: ✓
  - Rental period under 6 years: ✓
  - No other property claimed as main residence: ✓

  RESULT: Full main residence exemption applies

Step 3: Calculate Capital Gain (for reference)
  Sale Price:                           $1,580,000

  Cost Base:
  Purchase Price:                       $850,000
  Stamp Duty:                           $34,000
  Purchase Legal Fees:                  $3,800
  Deck/Landscaping:                     $32,000
  Sale Agent Fees:                      $39,500
  Sale Legal Fees:                      $3,200
  ─────────────────────────────────────────────
  Total Cost Base:                      $962,500

  Capital Gain = $1,580,000 - $962,500 = $617,500

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
- Rental period (5.09 years) < 6 years
- No other property claimed as main residence during this period

### Timeline JSON

```json
{
  "properties": [
    {
      "address": "88 Harbour Street, Sydney NSW 2000",
      "property_history": [
        {
          "date": "2015-07-01",
          "event": "purchase",
          "price": 850000,
          "stamp_duty": 34000,
          "purchase_legal_fees": 3800
        },
        {
          "date": "2015-07-01",
          "event": "move_in"
        },
        {
          "date": "2017-03-15",
          "event": "improvement",
          "price": 32000
        },
        {
          "date": "2019-06-30",
          "event": "move_out"
        },
        {
          "date": "2019-07-15",
          "event": "rent_start"
        },
        {
          "date": "2024-08-15",
          "event": "sale",
          "price": 1580000,
          "contract_date": "2024-08-15",
          "agent_fees": 39500,
          "legal_fees": 3200
        }
      ],
      "notes": "sold - Six-year absence rule applies. Rented for 5 years while working interstate. Full exemption."
    }
  ],
  "user_query": "I moved interstate for work and rented my home for 5 years before selling. What is my CGT liability?",
  "additional_info": {
    "australian_resident": true
  }
}
```

---

## Scenario 3: Six-Year Absence Rule Exceeded (Partial Exemption)

### Description
John purchases a home, lives in it for 2 years, then moves overseas and rents it out. He returns and sells the property after **9 years** of renting. Since the rental period exceeds 6 years, only the first 6 years of rental are covered by the main residence exemption. The remaining 3 years are subject to CGT, resulting in a **partial exemption**.

### Key Facts
- **Property**: 15 Ocean View Drive, Byron Bay NSW 2481
- **Purchase Date**: 1 March 2012
- **Move In Date**: 1 March 2012
- **Move Out Date**: 28 February 2014
- **Rent Start Date**: 1 March 2014
- **Return & Sale Date**: 1 June 2024
- **Purchase Price**: $450,000
- **Market Value at First Rental**: $480,000 (First use to produce income rule applies)
- **Sale Price**: $1,250,000
- **Total Ownership Days**: 4,476 days (from rent start to sale: 3,746 days)
- **Main Residence Days**: 2,922 days (lived in + 6 years rental exemption)
- **Non-Main Residence Days**: 1,096 days (3 years beyond 6-year limit)

### Timeline of Events

| Date | Event | Details |
|------|-------|---------|
| 01 Mar 2012 | Purchase | $450,000 + $18,000 stamp duty + $2,800 legal fees |
| 01 Mar 2012 | Move In | Established as main residence |
| 28 Feb 2014 | Move Out | Relocated overseas for work |
| 01 Mar 2014 | Rent Start | Market value: $480,000 (deemed acquisition) |
| 01 Jun 2024 | Sale | $1,250,000 (agent fees: $31,250, legal fees: $2,800) |

### CGT Calculation

```
Step 1: Apply First Use to Produce Income Rule (s118.192)
  Since property was main residence then rented:
  - Deemed acquisition date: 1 March 2014
  - Deemed cost base: $480,000 (market value at first rental)

Step 2: Calculate Rental Period
  Rent Start: 1 March 2014
  Sale Date: 1 June 2024
  Total Rental Period = 3,746 days = 10.26 years

  ✗ Rental period EXCEEDS 6 years by 3.26 years (1,096 days)

Step 3: Calculate Ownership Period (from deemed acquisition)
  Deemed Acquisition: 1 March 2014
  Sale Date: 1 June 2024
  Total Ownership = 3,746 days

Step 4: Calculate Non-Main-Residence Days
  Total rental days: 3,746
  Six-year exemption: 2,192 days (6 years)
  Non-main-residence days: 3,746 - 2,192 = 1,554 days

  Note: Using the period from 1 March 2020 (end of 6-year rule)
  to 1 June 2024 = 1,554 days as non-main-residence period

Step 5: Calculate Capital Gain
  Sale Price:                           $1,250,000

  Cost Base (from deemed acquisition):
  Deemed Acquisition Value:             $480,000
  Sale Agent Fees:                      $31,250
  Sale Legal Fees:                      $2,800
  ─────────────────────────────────────────────
  Total Cost Base:                      $514,050

  Capital Gain = $1,250,000 - $514,050 = $735,950

Step 6: Apply Partial Main Residence Exemption
  Taxable Proportion = Non-MR Days / Total Ownership Days
  Taxable Proportion = 1,554 / 3,746 = 41.48%

  Taxable Capital Gain = $735,950 × 41.48% = $305,272

Step 7: Apply 50% CGT Discount
  Held > 12 months: ✓
  Discounted Gain = $305,272 × 50% = $152,636

RESULT: CGT LIABILITY = $152,636 (before applying marginal tax rate)

Example at 37% marginal tax rate:
Tax Payable = $152,636 × 37% = $56,475
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
      "address": "15 Ocean View Drive, Byron Bay NSW 2481",
      "property_history": [
        {
          "date": "2012-03-01",
          "event": "purchase",
          "price": 450000,
          "stamp_duty": 18000,
          "purchase_legal_fees": 2800
        },
        {
          "date": "2012-03-01",
          "event": "move_in"
        },
        {
          "date": "2014-02-28",
          "event": "move_out"
        },
        {
          "date": "2014-03-01",
          "event": "rent_start"
        },
        {
          "date": "2024-06-01",
          "event": "sale",
          "price": 1250000,
          "contract_date": "2024-06-01",
          "agent_fees": 31250,
          "legal_fees": 2800
        }
      ],
      "notes": "sold - Six-year rule exceeded. Rented for 9+ years. Partial exemption applies. First use to produce income rule triggered."
    }
  ],
  "user_query": "I rented my former home for over 9 years while overseas. How much CGT do I owe?",
  "additional_info": {
    "australian_resident": true,
    "market_value_at_first_rental": 480000
  }
}
```

---

## Scenario 4: Rental First, Then Main Residence (First Use to Produce Income)

### Description
Emma purchases an investment property and rents it out immediately. After 3 years, she decides to move in and make it her main residence. She lives there for 5 years before selling. Because the property was **rented before becoming a main residence**, the six-year absence rule does NOT apply. Only the period as main residence is exempt.

### Key Facts
- **Property**: 256 Collins Street, Melbourne VIC 3000
- **Purchase Date**: 1 February 2016
- **Purchase Price**: $530,000
- **Rent Period**: 1 February 2016 to 10 April 2019 (1,165 days)
- **Move In Date**: 10 April 2019
- **Sale Date**: 1 October 2024
- **Sale Price**: $795,000
- **Total Ownership**: 3,166 days
- **Non-Main-Residence Days**: 1,165 days (rental period)

### Timeline of Events

| Date | Event | Details |
|------|-------|---------|
| 01 Feb 2016 | Purchase | $530,000 + $21,200 stamp duty + $3,200 legal fees |
| 01 Feb 2016 | Rent Start | Rented as investment property |
| 10 Apr 2019 | Rent End | Tenant vacates |
| 10 Apr 2019 | Move In | Owner moves in as main residence |
| 01 Oct 2024 | Sale | $795,000 (agent fees: $19,875, legal fees: $2,400) |

### CGT Calculation

```
Step 1: Verify Six-Year Rule Eligibility
  Property was rented BEFORE being used as main residence

  ✗ Six-year rule does NOT apply (only applies when main residence first)

Step 2: Calculate Ownership Periods
  Total Ownership: 1 Feb 2016 to 1 Oct 2024 = 3,166 days

  Rental Period (Non-MR): 1 Feb 2016 to 10 Apr 2019 = 1,165 days
  Main Residence Period: 10 Apr 2019 to 1 Oct 2024 = 2,001 days

Step 3: Calculate Capital Gain
  Sale Price:                           $795,000

  Cost Base:
  Purchase Price:                       $530,000
  Stamp Duty:                           $21,200
  Purchase Legal Fees:                  $3,200
  Sale Agent Fees:                      $19,875
  Sale Legal Fees:                      $2,400
  ─────────────────────────────────────────────
  Total Cost Base:                      $576,675

  Capital Gain = $795,000 - $576,675 = $218,325

Step 4: Apply Partial Main Residence Exemption
  Taxable Proportion = Non-MR Days / Total Ownership Days
  Taxable Proportion = 1,165 / 3,166 = 36.80%

  Exempt Proportion = 2,001 / 3,166 = 63.20%
  Exempt Amount = $218,325 × 63.20% = $137,981

  Taxable Capital Gain = $218,325 × 36.80% = $80,344

Step 5: Apply 50% CGT Discount
  Held > 12 months: ✓
  Discounted Gain = $80,344 × 50% = $40,172

RESULT: CGT LIABILITY = $40,172 (before applying marginal tax rate)

Example at 37% marginal tax rate:
Tax Payable = $40,172 × 37% = $14,864
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
      "address": "256 Collins Street, Melbourne VIC 3000",
      "property_history": [
        {
          "date": "2016-02-01",
          "event": "purchase",
          "price": 530000,
          "stamp_duty": 21200,
          "purchase_legal_fees": 3200
        },
        {
          "date": "2016-02-01",
          "event": "rent_start"
        },
        {
          "date": "2019-04-10",
          "event": "rent_end"
        },
        {
          "date": "2019-04-10",
          "event": "move_in"
        },
        {
          "date": "2024-10-01",
          "event": "sale",
          "price": 795000,
          "contract_date": "2024-10-01",
          "agent_fees": 19875,
          "legal_fees": 2400
        }
      ],
      "notes": "sold - Investment property converted to main residence. Partial exemption for main residence period only."
    }
  ],
  "user_query": "I bought an investment property, rented it for 3 years, then moved in for 5 years before selling. What CGT do I owe?",
  "additional_info": {
    "australian_resident": true
  }
}
```

---

## Scenario 5: Moving Between Main Residences (6-Month Overlap Rule)

### Description
David owns his main residence (Property 1) and purchases a new home (Property 2). He moves into the new home while still owning the old one. This scenario demonstrates the **6-month overlap rule** where both properties can be treated as main residence for up to 6 months during the transition period.

### Key Facts

#### Property 1: Original Home
- **Address**: 78 Rose Street, Brisbane QLD 4000
- **Purchase Date**: 1 May 2012
- **Purchase Price**: $420,000
- **Sale Date**: 15 July 2024
- **Sale Price**: $780,000
- **Total Ownership**: 4,458 days

#### Property 2: New Home
- **Address**: 33 Mountain View Road, Brisbane QLD 4000
- **Purchase Date**: 1 February 2024
- **Purchase Price**: $920,000
- **Current Status**: Main Residence (not sold)

#### Overlap Period
- **New Home Purchase (Move In)**: 1 February 2024
- **Old Home Sale**: 15 July 2024
- **Overlap Duration**: 165 days (5.5 months)
- **Within 6-Month Limit**: ✓ YES

### Timeline of Events

#### Property 1 Events
| Date | Event | Details |
|------|-------|---------|
| 01 May 2012 | Purchase | $420,000 + $14,700 stamp duty + $2,200 legal fees |
| 01 May 2012 | Move In | Established as main residence |
| 01 Feb 2024 | Move Out | Moved to new home (Property 2) |
| 15 Jul 2024 | Sale | $780,000 (agent fees: $19,500, legal fees: $2,000) |

#### Property 2 Events
| Date | Event | Details |
|------|-------|---------|
| 01 Feb 2024 | Purchase | $920,000 + $36,800 stamp duty + $4,200 legal fees |
| 01 Feb 2024 | Move In | Established as new main residence |

### CGT Calculation - Property 1

```
Step 1: Verify 6-Month Overlap Rule Eligibility (s118.140)
  Requirements:
  - Lived in Property 1 for at least 3 months in past 12 months: ✓
    (Lived there until 1 Feb 2024, sold 15 Jul 2024)
  - Property 1 did not produce income during overlap: ✓
    (Was not rented)
  - Overlap period ≤ 6 months: ✓
    (165 days = 5.5 months)

  RESULT: Both properties treated as main residence during overlap

Step 2: Calculate Main Residence Period for Property 1
  Purchase: 1 May 2012
  Sale: 15 July 2024
  Total Ownership = 4,458 days

  Property 1 treated as main residence: ENTIRE period
  (Including overlap period under s118.140)

Step 3: Calculate Capital Gain (for reference)
  Sale Price:                           $780,000

  Cost Base:
  Purchase Price:                       $420,000
  Stamp Duty:                           $14,700
  Purchase Legal Fees:                  $2,200
  Sale Agent Fees:                      $19,500
  Sale Legal Fees:                      $2,000
  ─────────────────────────────────────────────
  Total Cost Base:                      $458,400

  Capital Gain = $780,000 - $458,400 = $321,600

Step 4: Apply Main Residence Exemption
  Under s118.140, both homes treated as main residence for overlap
  Property 1 was main residence for entire ownership
  Exemption: FULL (100%)

Step 5: Taxable Capital Gain
  Taxable Amount = $0 (FULLY EXEMPT)

RESULT: NO CGT PAYABLE
```

### What If Overlap Exceeded 6 Months?

If David had sold Property 1 **after** 1 August 2024 (more than 6 months after purchasing Property 2):

```
Example: Sale on 15 October 2024 (8.5 months overlap)

Step 1: Determine Taxable Period
  Only 6 months before sale date can have overlapping exemption
  Sale Date: 15 October 2024
  6 months before: 15 April 2024
  New Home Purchase: 1 February 2024

  Non-exempt overlap: 1 Feb 2024 to 15 Apr 2024 = 74 days

  One property must NOT be main residence for 74 days
  David must choose which property loses exemption for this period

Step 2: If Property 1 Loses Exemption for 74 Days
  Total Ownership: 4,550 days (1 May 2012 to 15 Oct 2024)
  Non-MR Days: 74 days

  Taxable Proportion = 74 / 4,550 = 1.63%
  Taxable Gain = $321,600 × 1.63% = $5,242
  After 50% discount = $2,621
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
      "address": "78 Rose Street, Brisbane QLD 4000",
      "property_history": [
        {
          "date": "2012-05-01",
          "event": "purchase",
          "price": 420000,
          "stamp_duty": 14700,
          "purchase_legal_fees": 2200
        },
        {
          "date": "2012-05-01",
          "event": "move_in"
        },
        {
          "date": "2024-02-01",
          "event": "move_out"
        },
        {
          "date": "2024-07-15",
          "event": "sale",
          "price": 780000,
          "contract_date": "2024-07-15",
          "agent_fees": 19500,
          "legal_fees": 2000
        }
      ],
      "notes": "sold - Original main residence sold within 6-month overlap period. Full exemption under s118.140."
    },
    {
      "address": "33 Mountain View Road, Brisbane QLD 4000",
      "property_history": [
        {
          "date": "2024-02-01",
          "event": "purchase",
          "price": 920000,
          "stamp_duty": 36800,
          "purchase_legal_fees": 4200
        },
        {
          "date": "2024-02-01",
          "event": "move_in"
        }
      ],
      "notes": "ppr - Current main residence. Overlap with Property 1 sale within 6-month window."
    }
  ],
  "user_query": "I bought a new home and moved in before selling my old home. The overlap was about 5.5 months. What CGT do I owe?",
  "additional_info": {
    "australian_resident": true
  }
}
```

---

## Summary Table

| Scenario | Key Rule | Rental Period | Exemption | CGT Payable |
|----------|----------|---------------|-----------|-------------|
| 1. Full Main Residence | s118.110 | None | 100% | $0 |
| 2. Six-Year Rule (Within) | s118.145 | 5 years | 100% | $0 |
| 3. Six-Year Rule (Exceeded) | s118.145 + s118.192 | 9+ years | 58.52% | $152,636* |
| 4. Rental First | s118.185 | 3 years (before MR) | 63.20% | $40,172* |
| 5. Moving Between Residences | s118.140 | None (overlap) | 100% | $0 |

*Before applying marginal tax rate

---

## Sources and References

- [ATO: How to calculate your CGT](https://www.ato.gov.au/individuals-and-families/investments-and-assets/capital-gains-tax/calculating-your-cgt/how-to-calculate-your-cgt)
- [ATO: Treating former home as main residence](https://www.ato.gov.au/individuals-and-families/investments-and-assets/capital-gains-tax/property-and-capital-gains-tax/your-main-residence---home/treating-former-home-as-main-residence)
- [ATO: Moving to a new main residence](https://www.ato.gov.au/individuals-and-families/investments-and-assets/capital-gains-tax/property-and-capital-gains-tax/your-main-residence---home/moving-to-a-new-main-residence)
- [ATO: Your main residence - home](https://www.ato.gov.au/individuals-and-families/investments-and-assets/capital-gains-tax/property-and-capital-gains-tax/your-main-residence-home)
- [MLC: Qualifying for main residence CGT exemption](https://www.mlc.com.au/content/dam/mlcsecure/adviser/technical/pdf/qualifying-for-main-residence-exemption.pdf)
- ITAA97 s118.110, s118.140, s118.145, s118.185, s118.192, s115.25

---

*Document generated for CGT Brain Timeline Application testing purposes.*
*Last updated: December 2024*
