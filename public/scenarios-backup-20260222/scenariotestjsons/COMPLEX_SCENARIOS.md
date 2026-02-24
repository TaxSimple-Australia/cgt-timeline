# Complex CGT Scenarios

This document contains 10 complex Capital Gains Tax scenarios for testing the CGT Timeline application. These scenarios cover advanced situations including multiple properties, multiple rental periods, inherited properties, foreign residency, and more.

---

## Scenario 6: Multiple Absence Periods with Six-Year Rule

**Based on ATO Example 80**

### Timeline

Ian purchases a home in Sydney and lives in it as his main residence. Over the years, he is posted to different cities for work, buying and selling properties along the way, while renting out his Sydney home during absences.

- **1 July 1994:** Ian settles contract to buy Sydney home (0.9 hectares), uses as main residence
- **1 January 1996:** Posted to Brisbane, buys Brisbane home. Starts renting Sydney home.
- **31 December 2000:** Sells Brisbane home (does NOT claim MRE). Sydney tenant leaves, property left vacant.
- **1 January 2001:** Posted to Melbourne, buys Melbourne home.
- **1 March 2001:** Rents out Sydney home again.
- **28 February 2003:** Sydney tenant leaves, Ian leaves it vacant.
- **31 December 2003:** Sells Melbourne home (does NOT claim MRE).
- **31 December 2004:** Returns to Sydney home, re-establishes as main residence.
- **28 February 2025:** Sells Sydney home.

### Key Calculations

- **Total ownership:** 1 July 1994 to 28 February 2025 = 11,201 days
- **First rental period:** 1 Jan 1996 to 31 Dec 2000 = 1,827 days
- **Second rental period:** 1 Mar 2001 to 28 Feb 2003 = 730 days
- **Total rental:** 2,557 days
- **Six-year exemption:** 2,192 days
- **Excess (taxable):** 365 days
- **Taxable proportion:** 365 / 11,201 = 3.26%

### Expected Result

- **Exemption Type:** Partial
- If capital gain is $250,000, taxable gain = **$8,147**

---

## Scenario 7: Two Properties - Strategic MRE Choice

### Timeline

David owns two properties and must strategically choose which one to claim the main residence exemption on.

### Property 1 - Beach House (Gold Coast)

- **15 March 2015:** Purchases for **$650,000** (Stamp Duty $26,000, Legal $3,000)
- **15 March 2015:** Moves in as main residence
- **1 July 2018:** Moves out, starts renting
- **30 June 2024:** Sells for **$1,100,000** (Agent Fees $27,500, Legal $2,500)

### Property 2 - City Apartment (Brisbane)

- **1 July 2018:** Purchases for **$480,000** (Stamp Duty $19,200, Legal $2,800)
- **1 July 2018:** Moves in as main residence
- **15 December 2024:** Sells for **$620,000** (Agent Fees $15,500, Legal $2,200)

### Key Points

- Can only claim one property as main residence at any time
- Must choose: Beach House with 6-year rule OR City Apartment
- Beach House rental: 1 July 2018 to 30 June 2024 = **6 years exactly** (within 6-year rule!)

### Expected Result

- If claiming MRE on Beach House (6-year rule applies): **Beach House fully exempt**, City Apartment partially taxable
- Strategic choice depends on which property has larger gain

---

## Scenario 8: Inherited Property with Rental

### Timeline

Emma inherits her mother's home (which was her mother's main residence) and then rents it out before selling.

- **15 August 2020:** Mother passes away. Property market value: **$780,000**. Mother purchased in 1985 for $95,000.
- **1 October 2020:** Emma receives property as beneficiary
- **1 November 2020:** Emma starts renting the property
- **31 October 2024:** Sells property for **$950,000** (Agent Fees $23,750, Legal $2,800)

### Key Points

- Property was deceased's main residence: **2-year disposal rule applies**
- Emma did NOT sell within 2 years of death (sold 4+ years later)
- Since sold after 2 years: Normal CGT rules apply from date of death
- **Cost base** = Market value at death ($780,000)
- Entire period from death was rental (no MRE for Emma)

### Expected Result

- **Exemption Type:** None (for Emma's ownership period)
- **Capital Gain:** $950,000 - $780,000 - $23,750 - $2,800 = **$143,450**
- 50% discount applies (held more than 12 months from date of death)
- **Net Capital Gain: $71,725**

---

## Scenario 9: Investment First, Then PPR, Then Rental

### Timeline

Michael buys an investment property, later moves in, then moves out and rents again.

- **1 February 2014:** Purchases unit for **$385,000** (Stamp Duty $15,400, Legal $2,200)
- **1 February 2014:** Immediately rents out as investment
- **15 July 2017:** Tenant leaves, Michael moves in as main residence
- **1 September 2020:** Moves out for work relocation
- **15 September 2020:** Starts renting again
- **30 November 2024:** Sells for **$580,000** (Agent Fees $14,500, Legal $2,000)

### Key Points

- Property was rented BEFORE becoming main residence
- **Six-year rule does NOT apply** (only applies when MR first)
- Partial exemption for actual residence period only
- **Total ownership:** 1 Feb 2014 to 30 Nov 2024 = 3,955 days
- **Main residence period:** 15 Jul 2017 to 1 Sep 2020 = 1,144 days
- **Non-MR period:** 3,955 - 1,144 = 2,811 days

### Expected Result

- **Exemption Type:** Partial
- **Taxable proportion:** 2,811 / 3,955 = **71.07%**
- **Exempt proportion:** 28.93%

---

## Scenario 10: Six-Month Overlap Exceeded

### Timeline

Jennifer buys a new home before selling her old one, but takes too long to sell.

### Property 1 - Old Home (Paddington)

- **1 March 2012:** Purchases for **$720,000** (Stamp Duty $28,800, Legal $3,500)
- **1 March 2012:** Moves in as main residence
- **1 February 2024:** Moves out to new home (does NOT rent old home)
- **15 October 2024:** Sells old home for **$1,450,000** (Agent Fees $36,250, Legal $3,200)

### Property 2 - New Home (Ascot)

- **1 February 2024:** Purchases new home for **$1,200,000**
- **1 February 2024:** Moves in as main residence

### Key Points

- **Overlap period:** 1 Feb 2024 to 15 Oct 2024 = 257 days (8.5 months)
- Exceeds 6-month (183 days) overlap allowance by **74 days**
- Must choose which property loses exemption for the 74-day excess period

### Expected Result

- Old home loses exemption for 74 days
- **Old home total ownership:** 4,611 days
- **Taxable proportion:** 74 / 4,611 = **1.60%**
- **Capital gain on old home:** $1,450,000 - $720,000 - $28,800 - $3,500 - $36,250 - $3,200 = **$658,250**
- **Taxable gain:** $658,250 x 1.60% = **$10,532**

---

## Scenario 11: Building New Home (4-Year Construction Rule)

### Timeline

Robert buys vacant land and builds his dream home.

- **1 June 2020:** Purchases vacant land for **$450,000** (Stamp Duty $18,000, Legal $2,500)
- **1 September 2020:** Construction begins
- **15 December 2022:** Construction completed. Total build cost: **$380,000**
- **5 January 2023:** Moves in as main residence
- **20 November 2024:** Sells property for **$1,150,000** (Agent Fees $28,750, Legal $3,000)

### Key Points

- **4-year construction rule applies** (s118.150)
- Construction period: 1 Jun 2020 to 5 Jan 2023 = 2.6 years (within 4 years)
- Land treated as main residence from purchase date
- Moved in as soon as practicable after completion
- **Full exemption applies**

### Expected Result

- **Exemption Type:** Full
- **Net Capital Gain: $0**

---

## Scenario 12: Partial Use - Airbnb Room Rental

### Timeline

Sophie lives in her home but rents out a room on Airbnb.

- **1 April 2016:** Purchases home for **$520,000** (Stamp Duty $20,800, Legal $2,600)
- **1 April 2016:** Moves in as main residence
- **1 January 2019:** Starts renting spare room on Airbnb
- **31 December 2023:** Stops Airbnb rental
- **15 August 2024:** Sells home for **$850,000** (Agent Fees $21,250, Legal $2,400)

### Property Details

- **Total floor area:** 180 sqm
- **Rented room (exclusive to guest):** 18 sqm
- **Shared areas (kitchen, bathroom, living):** 45 sqm
- **Airbnb rental period:** 1 Jan 2019 to 31 Dec 2023 = 1,826 days
- **Total ownership:** 3,059 days

### Key Points

- Interest deductibility test applies (s118.190)
- **Exclusive area:** 18/180 = 10%
- **Shared area:** (45/180) x 50% = 12.5%
- **Total income-producing:** 22.5%
- **Taxable:** 22.5% x (1,826/3,059) = **13.43%**

### Expected Result

- **Exemption Type:** Partial
- **Taxable proportion:** 13.43%
- **Capital gain:** $850,000 - $520,000 - $20,800 - $2,600 - $21,250 - $2,400 = **$282,950**
- **Taxable gain:** $282,950 x 13.43% = **$38,000**

---

## Scenario 13: Couple Marries with Separate Properties

### Timeline

Alex and Sam each own a home before they get married and move in together.

### Alex's Property (Bulimba)

- **1 July 2015:** Alex purchases for **$580,000** (Stamp Duty $23,200, Legal $2,900)
- **1 July 2015:** Alex moves in as main residence
- **1 March 2020:** Alex moves out to live with Sam
- **1 June 2020:** Alex and Sam get married
- **15 September 2024:** Alex sells Bulimba property for **$920,000** (Agent Fees $23,000, Legal $2,600)

### Sam's Property (New Farm) - Now shared home

- **15 January 2017:** Sam purchases for **$650,000**
- **15 January 2017:** Sam moves in as main residence
- **1 March 2020:** Alex moves in with Sam

### Key Points

- From 1 March 2020 (cohabitation), couple can only claim **ONE main residence**
- **Alex Bulimba:** Main residence 1 Jul 2015 to 1 Mar 2020 = 1,705 days
- **Alex Bulimba:** Non-MR 1 Mar 2020 to 15 Sep 2024 = 1,660 days
- Six-year rule could apply if Alex did not claim Sam property as MR
- But couple claimed Sam property as joint MR from cohabitation

### Expected Result

- **Exemption Type:** Partial (for Alex property)
- **Main residence days:** 1,705
- **Total ownership:** 3,365 days
- **Exempt:** 50.68%
- **Taxable:** 49.32%

---

## Scenario 14: Foreign Resident Period

### Timeline

Lisa is an Australian resident who moves overseas for work, rents her home, then returns.

- **1 August 2013:** Purchases home for **$495,000** (Stamp Duty $19,800, Legal $2,400)
- **1 August 2013:** Moves in as main residence
- **1 July 2018:** Moves to Singapore for work (becomes foreign resident for tax)
- **1 July 2018:** Starts renting Australian property
- **30 June 2022:** Returns to Australia (becomes Australian resident again)
- **1 July 2022:** Tenant leaves, Lisa moves back in
- **15 November 2024:** Sells home for **$810,000** (Agent Fees $20,250, Legal $2,300)

### Key Points

- **Foreign resident** from 1 Jul 2018 to 30 Jun 2022 = 4 years
- Returned BEFORE selling = Can claim MRE (not excluded foreign resident at sale)
- **Six-year rule applies:** Rental period (4 years) less than 6 years = Full exemption
- BUT: CGT discount reduced for foreign resident period
- **Total ownership:** 11.3 years
- **Australian resident:** 7.3 years
- **Foreign resident:** 4 years

### Expected Result

- **Exemption Type:** Full (six-year rule applies)
- **CGT discount available but reduced:** 50% x (7.3/11.3) = 32.3%
- Since full MRE applies, **no CGT payable anyway**

---

## Scenario 15: Three Property Portfolio

### Timeline

Investment portfolio with three properties, different CGT treatments.

### Property A - Family Home (Clayfield)

- **1 March 2010:** Purchases for **$420,000** (Stamp Duty $16,800, Legal $2,100)
- **1 March 2010:** Moves in as main residence
- **15 February 2024:** Sells for **$890,000** (Agent Fees $22,250, Legal $2,000)

### Property B - Investment Unit (Fortitude Valley)

- **15 June 2016:** Purchases for **$340,000** (Stamp Duty $13,600, Legal $1,900)
- **15 June 2016:** Rented from day one (never lived in)
- **20 December 2024:** Sells for **$485,000** (Agent Fees $12,125, Legal $1,800)

### Property C - Holiday House (Noosa)

- **1 December 2018:** Purchases for **$580,000** (Stamp Duty $23,200, Legal $2,700)
- **1 December 2018:** Used as holiday home (occasional personal use)
- **1 January 2021:** Starts renting on Airbnb when not using
- **30 November 2024:** Sells for **$920,000** (Agent Fees $23,000, Legal $2,500)

### Expected Results

**Property A (Family Home)**

- **Exemption:** Full MRE (main residence entire period)
- **Net Capital Gain:** $0

**Property B (Investment Unit)**

- **Exemption:** None (pure investment)
- **Capital Gain:** $485,000 - $340,000 - $13,600 - $1,900 - $12,125 - $1,800 = **$115,575**
- **After 50% discount:** $57,788

**Property C (Holiday House)**

- **Exemption:** None (not main residence, mixed use)
- **Capital Gain:** $920,000 - $580,000 - $23,200 - $2,700 - $23,000 - $2,500 = **$288,600**
- **After 50% discount:** $144,300

**Total Net Capital Gain:** $0 + $57,788 + $144,300 = **$202,088**

---

## Summary Table

| Scenario | Description | Exemption | Complexity |
|----------|-------------|-----------|------------|
| 6 | Multiple Absence Periods | Partial (96.74% exempt) | Very High |
| 7 | Two Properties - Strategic MRE | Choice Required | High |
| 8 | Inherited Property | None for Emma | Medium |
| 9 | Investment First, Then PPR | Partial (28.93% exempt) | High |
| 10 | Six-Month Overlap Exceeded | Partial (98.4% exempt) | Medium |
| 11 | 4-Year Construction | Full | Medium |
| 12 | Airbnb Room Rental | Partial (86.57% exempt) | Medium |
| 13 | Couple with Separate Properties | Partial (50.68% exempt) | High |
| 14 | Foreign Resident Period | Full (with discount reduction) | High |
| 15 | Three Property Portfolio | Mixed | Very High |
