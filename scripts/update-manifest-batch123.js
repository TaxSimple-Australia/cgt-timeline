const fs = require('fs');
const path = require('path');

// Read the current manifest
const manifestPath = path.join(__dirname, '..', 'public', 'scenarios-manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// Define the 30 new Batch 1,2,3 scenarios
const batch123Scenarios = [
  // Scenarios 1-10
  {
    filename: 'batch123_scenario1_full_main_residence_exemption.json',
    path: 'scenariotestjsons',
    title: 'Batch 1,2,3 - Scenario 1: Full Main Residence Exemption',
    description: 'Property used exclusively as main residence for entire ownership period. Demonstrates full 100% exemption under s118-110 ITAA 1997.',
    category: 'Batch 1,2,3',
    subcategory: 'Main Residence',
    propertyCount: 1,
    exemptionType: 'full',
    expectedOutcome: 'NO CGT PAYABLE'
  },
  {
    filename: 'batch123_scenario2_six_year_within.json',
    path: 'scenariotestjsons',
    title: 'Batch 1,2,3 - Scenario 2: Six-Year Absence Rule (Within Limit)',
    description: 'Main residence for 4 years, then rented for 5.17 years. Demonstrates six-year absence rule when period is within 6-year limit.',
    category: 'Batch 1,2,3',
    subcategory: 'Six-Year Rule',
    propertyCount: 1,
    exemptionType: 'full',
    expectedOutcome: 'NO CGT PAYABLE'
  },
  {
    filename: 'batch123_scenario3_six_year_exceeded.json',
    path: 'scenariotestjsons',
    title: 'Batch 1,2,3 - Scenario 3: Six-Year Absence Rule Exceeded',
    description: 'Main residence for 2 years, then rented for 9 years. Demonstrates partial CGT when six-year absence rule exceeded, including deemed acquisition at market value.',
    category: 'Batch 1,2,3',
    subcategory: 'Six-Year Rule',
    propertyCount: 1,
    exemptionType: 'partial',
    expectedOutcome: 'NET CAPITAL GAIN = $152,710'
  },
  {
    filename: 'batch123_scenario4_rental_first.json',
    path: 'scenariotestjsons',
    title: 'Batch 1,2,3 - Scenario 4: Rental First, Then Main Residence',
    description: 'Investment property rented for 3 years, then converted to main residence for 5.67 years. Demonstrates time apportionment when property was investment before main residence.',
    category: 'Batch 1,2,3',
    subcategory: 'Time Apportionment',
    propertyCount: 1,
    exemptionType: 'partial',
    expectedOutcome: 'NET CAPITAL GAIN = $40,172'
  },
  {
    filename: 'batch123_scenario5_moving_between_residences.json',
    path: 'scenariotestjsons',
    title: 'Batch 1,2,3 - Scenario 5: Moving Between Main Residences (6-Month Overlap)',
    description: 'Two properties with 165-day overlap when moving between main residences. Demonstrates six-month overlap rule under s118-140 ITAA 1997.',
    category: 'Batch 1,2,3',
    subcategory: 'Multiple Properties',
    propertyCount: 2,
    exemptionType: 'full',
    expectedOutcome: 'NO CGT PAYABLE'
  },
  {
    filename: 'batch123_scenario6_six_year_within.json',
    path: 'scenariotestjsons',
    title: 'Batch 1,2,3 - Scenario 6: Six-Year Absence Rule (Within Limit)',
    description: 'Main residence for 3 years, then rented for 4.83 years. Another example demonstrating six-year absence rule within limit.',
    category: 'Batch 1,2,3',
    subcategory: 'Six-Year Rule',
    propertyCount: 1,
    exemptionType: 'full',
    expectedOutcome: 'NO CGT PAYABLE'
  },
  {
    filename: 'batch123_scenario7_six_year_exceeded.json',
    path: 'scenariotestjsons',
    title: 'Batch 1,2,3 - Scenario 7: Six-Year Absence Rule Exceeded',
    description: 'Main residence for 4 years, then rented for 8.67 years. Demonstrates six-year rule exceeded with deemed acquisition at first rental.',
    category: 'Batch 1,2,3',
    subcategory: 'Six-Year Rule',
    propertyCount: 1,
    exemptionType: 'partial',
    expectedOutcome: 'NET CAPITAL GAIN = $160,430'
  },
  {
    filename: 'batch123_scenario8_full_main_residence.json',
    path: 'scenariotestjsons',
    title: 'Batch 1,2,3 - Scenario 8: Full Main Residence Exemption',
    description: 'Property used exclusively as main residence throughout entire ownership period from 2014 to 2024.',
    category: 'Batch 1,2,3',
    subcategory: 'Main Residence',
    propertyCount: 1,
    exemptionType: 'full',
    expectedOutcome: 'NO CGT PAYABLE'
  },
  {
    filename: 'batch123_scenario9_moving_between_residences.json',
    path: 'scenariotestjsons',
    title: 'Batch 1,2,3 - Scenario 9: Moving Between Main Residences (6-Month Overlap)',
    description: 'Property sold with 136-day overlap with new property when moving between main residences. Within six-month overlap limit.',
    category: 'Batch 1,2,3',
    subcategory: 'Multiple Properties',
    propertyCount: 1,
    exemptionType: 'full',
    expectedOutcome: 'NO CGT PAYABLE'
  },
  {
    filename: 'batch123_scenario10_rental_first.json',
    path: 'scenariotestjsons',
    title: 'Batch 1,2,3 - Scenario 10: Rental First, Then Main Residence',
    description: 'Investment property rented for 4 years, then main residence for 6.5 years. Time apportionment applies with 38.1% taxable.',
    category: 'Batch 1,2,3',
    subcategory: 'Time Apportionment',
    propertyCount: 1,
    exemptionType: 'partial',
    expectedOutcome: 'NET CAPITAL GAIN = $61,834'
  },
  // Scenarios 21-40
  {
    filename: 'batch123_scenario21_aged_care_indefinite_absence.json',
    path: 'scenariotestjsons',
    title: 'Batch 1,2,3 - Scenario 21: Aged Care Entry with Indefinite Absence',
    description: 'Main residence for 17 years, then vacant (not rented) for 7 years while in aged care. Demonstrates indefinite absence rule under s118.145.',
    category: 'Batch 1,2,3',
    subcategory: 'Aged Care',
    propertyCount: 1,
    exemptionType: 'full',
    expectedOutcome: 'NO CGT PAYABLE'
  },
  {
    filename: 'batch123_scenario22_delayed_move_in_work.json',
    path: 'scenariotestjsons',
    title: 'Batch 1,2,3 - Scenario 22: Delayed Move-In Due to Work Assignment',
    description: 'Property purchased but left vacant for 8 months due to pre-arranged work assignment. Demonstrates delayed move-in exception under TR 98/14.',
    category: 'Batch 1,2,3',
    subcategory: 'Special Rules',
    propertyCount: 1,
    exemptionType: 'full',
    expectedOutcome: 'NO CGT PAYABLE'
  },
  {
    filename: 'batch123_scenario23_six_year_periods_reset.json',
    path: 'scenariotestjsons',
    title: 'Batch 1,2,3 - Scenario 23: Six-Year Absence Rule - Multiple Periods with Reset',
    description: 'Multiple absence periods with reset when moved back in. First absence 5 years (within limit), moved back in resets clock, second absence 6.25 years (0.25 years exceeds).',
    category: 'Batch 1,2,3',
    subcategory: 'Six-Year Rule',
    propertyCount: 1,
    exemptionType: 'partial',
    expectedOutcome: 'NET CAPITAL GAIN = $2,692'
  },
  {
    filename: 'batch123_scenario24_deceased_estate_two_years.json',
    path: 'scenariotestjsons',
    title: 'Batch 1,2,3 - Scenario 24: Deceased Estate - Two-Year Exemption',
    description: 'Inherited property sold within 2 years of death. Demonstrates two-year deceased estate exemption under s118-195 ITAA 1997.',
    category: 'Batch 1,2,3',
    subcategory: 'Deceased Estate',
    propertyCount: 1,
    exemptionType: 'full',
    expectedOutcome: 'NO CGT PAYABLE'
  },
  {
    filename: 'batch123_scenario25_beneficiary_moves_in.json',
    path: 'scenariotestjsons',
    title: 'Batch 1,2,3 - Scenario 25: Deceased Estate - Beneficiary Moves In',
    description: 'Inherited property where beneficiary moved in and used as main residence before selling.',
    category: 'Batch 1,2,3',
    subcategory: 'Deceased Estate',
    propertyCount: 1,
    exemptionType: 'full',
    expectedOutcome: 'NO CGT PAYABLE'
  },
  {
    filename: 'batch123_scenario26_pre_cgt_major_improvements.json',
    path: 'scenariotestjsons',
    title: 'Batch 1,2,3 - Scenario 26: Pre-CGT Property with Major Improvements',
    description: 'Property acquired before CGT commencement (20 Sep 1985). Major improvements in 2010 exceeded 50% of property value, triggering deemed post-CGT acquisition.',
    category: 'Batch 1,2,3',
    subcategory: 'Pre-CGT',
    propertyCount: 1,
    exemptionType: 'full',
    expectedOutcome: 'NO CGT PAYABLE'
  },
  {
    filename: 'batch123_scenario27_large_rural_property.json',
    path: 'scenariotestjsons',
    title: 'Batch 1,2,3 - Scenario 27: Large Rural Property Exceeding 2 Hectares',
    description: 'Rural property with 5.8 hectares of land - exceeds 2 hectare limit. Area apportionment applies with 65.5% taxable.',
    category: 'Batch 1,2,3',
    subcategory: 'Adjacent Land',
    propertyCount: 1,
    exemptionType: 'partial',
    expectedOutcome: 'NET CAPITAL GAIN = $356,500'
  },
  {
    filename: 'batch123_scenario28_granny_flat_arrangement.json',
    path: 'scenariotestjsons',
    title: 'Batch 1,2,3 - Scenario 28: Granny Flat Arrangement',
    description: 'Property with granny flat built for elderly parent under formal written arrangement. No rent charged. Demonstrates TD 2004/26.',
    category: 'Batch 1,2,3',
    subcategory: 'Special Rules',
    propertyCount: 1,
    exemptionType: 'full',
    expectedOutcome: 'NO CGT PAYABLE'
  },
  {
    filename: 'batch123_scenario29_relationship_breakdown.json',
    path: 'scenariotestjsons',
    title: 'Batch 1,2,3 - Scenario 29: Relationship Breakdown with Rollover Relief',
    description: 'Joint property, relationship breakdown, transfer to one partner under Family Court order with rollover relief under s126-5.',
    category: 'Batch 1,2,3',
    subcategory: 'Relationship Breakdown',
    propertyCount: 1,
    exemptionType: 'full',
    expectedOutcome: 'NO CGT PAYABLE'
  },
  {
    filename: 'batch123_scenario30_home_office_business.json',
    path: 'scenariotestjsons',
    title: 'Batch 1,2,3 - Scenario 30: Home Office Business Use',
    description: 'Main residence with one room (20% floor area) used for business from 2018. Home office expenses claimed. Business use portion taxable.',
    category: 'Batch 1,2,3',
    subcategory: 'Business Use',
    propertyCount: 1,
    exemptionType: 'partial',
    expectedOutcome: 'NET CAPITAL GAIN = $45,794'
  },
  {
    filename: 'batch123_scenario31_foreign_resident_life_event.json',
    path: 'scenariotestjsons',
    title: 'Batch 1,2,3 - Scenario 31: Foreign Resident - Life Event Exception',
    description: 'Australian resident became foreign resident due to work overseas. Eligible for life event exception under TD 2019/20.',
    category: 'Batch 1,2,3',
    subcategory: 'Foreign Resident',
    propertyCount: 1,
    exemptionType: 'full',
    expectedOutcome: 'NO CGT PAYABLE'
  },
  {
    filename: 'batch123_scenario32_pre_may_2012_foreign.json',
    path: 'scenariotestjsons',
    title: 'Batch 1,2,3 - Scenario 32: Foreign Resident - Pre-8 May 2012 Grandfathering',
    description: 'Property purchased before 8 May 2012, became foreign resident later. Grandfathered under old foreign resident rules.',
    category: 'Batch 1,2,3',
    subcategory: 'Foreign Resident',
    propertyCount: 1,
    exemptionType: 'full',
    expectedOutcome: 'NO CGT PAYABLE'
  },
  {
    filename: 'batch123_scenario33_spouses_different_residences.json',
    path: 'scenariotestjsons',
    title: 'Batch 1,2,3 - Scenario 33: Spouses with Different Main Residences',
    description: 'Two properties - spouses have separate main residences due to work in different cities. Demonstrates s118-110(2) from 1 July 2018.',
    category: 'Batch 1,2,3',
    subcategory: 'Multiple Properties',
    propertyCount: 2,
    exemptionType: 'full',
    expectedOutcome: 'NO CGT PAYABLE for both'
  },
  {
    filename: 'batch123_scenario34_vacant_periods_extended_rental.json',
    path: 'scenariotestjsons',
    title: 'Batch 1,2,3 - Scenario 34: Vacant Periods Between Rentals with Extended Rental',
    description: 'Rented for 2 years, then vacant for 1.5 years, then rented again for 4.62 years. Vacant periods do not count toward six-year limit.',
    category: 'Batch 1,2,3',
    subcategory: 'Six-Year Rule',
    propertyCount: 1,
    exemptionType: 'partial',
    expectedOutcome: 'NET CAPITAL GAIN = $16,839'
  },
  {
    filename: 'batch123_scenario35_four_year_construction.json',
    path: 'scenariotestjsons',
    title: 'Batch 1,2,3 - Scenario 35: Four-Year Construction Rule',
    description: 'Vacant land purchased, dwelling constructed and moved in within 4 years. Property treated as main residence from land acquisition under s118-150.',
    category: 'Batch 1,2,3',
    subcategory: 'Construction',
    propertyCount: 1,
    exemptionType: 'full',
    expectedOutcome: 'NO CGT PAYABLE'
  },
  {
    filename: 'batch123_scenario36_subdivision_land_sale.json',
    path: 'scenariotestjsons',
    title: 'Batch 1,2,3 - Scenario 36: Subdivision - Main Residence with Land Sale',
    description: 'Large property subdivided into two lots. Lot 1 (dwelling) has full exemption, Lot 2 (vacant land) has partial exemption under TR 97/11.',
    category: 'Batch 1,2,3',
    subcategory: 'Subdivision',
    propertyCount: 2,
    exemptionType: 'mixed',
    expectedOutcome: 'Lot 1: NO CGT; Lot 2: NET GAIN $52,913'
  },
  {
    filename: 'batch123_scenario37_deceased_estate_covid.json',
    path: 'scenariotestjsons',
    title: 'Batch 1,2,3 - Scenario 37: Deceased Estate - COVID-19 Extension Period',
    description: 'Inherited property sold 2 years 10 months after death. COVID-19 extension applies under PCG 2021/4.',
    category: 'Batch 1,2,3',
    subcategory: 'Deceased Estate',
    propertyCount: 1,
    exemptionType: 'full',
    expectedOutcome: 'NO CGT PAYABLE'
  },
  {
    filename: 'batch123_scenario38_small_business_15_year.json',
    path: 'scenariotestjsons',
    title: 'Batch 1,2,3 - Scenario 38: Small Business 15-Year Exemption',
    description: 'Business property held for 18 years as active asset. Owner 58, retiring. Qualifies for small business 15-year exemption under Subdivision 152-B.',
    category: 'Batch 1,2,3',
    subcategory: 'Small Business',
    propertyCount: 1,
    exemptionType: 'full',
    expectedOutcome: 'NO CGT PAYABLE'
  },
  {
    filename: 'batch123_scenario39_investment_then_main_residence.json',
    path: 'scenariotestjsons',
    title: 'Batch 1,2,3 - Scenario 39: Investment Property Then Main Residence',
    description: 'Investment property rented for 3.83 years, then main residence for 5.38 years. Six-year rule does not apply (must be main residence before renting).',
    category: 'Batch 1,2,3',
    subcategory: 'Time Apportionment',
    propertyCount: 1,
    exemptionType: 'partial',
    expectedOutcome: 'NET CAPITAL GAIN = $96,231'
  },
  {
    filename: 'batch123_scenario40_four_property_portfolio.json',
    path: 'scenariotestjsons',
    title: 'Batch 1,2,3 - Scenario 40: Four Property Portfolio with Mixed Use',
    description: 'Complex portfolio with 4 properties: (1) Main residence then rented, (2) Investment, (3) Investment, (4) New main residence. Mixed CGT outcomes.',
    category: 'Batch 1,2,3',
    subcategory: 'Multiple Properties',
    propertyCount: 4,
    exemptionType: 'mixed',
    expectedOutcome: 'Total portfolio net gain: $210,113'
  }
];

// Add the new scenarios to the manifest
manifest.scenarios.push(...batch123Scenarios);

// Update the total count
manifest.totalScenarios = manifest.scenarios.length;

// Update the generatedAt timestamp
manifest.generatedAt = new Date().toISOString();

// Add Batch 1,2,3 category if not exists
const batch123Category = manifest.categories.find(cat => cat.name === 'Batch 1,2,3');
if (!batch123Category) {
  manifest.categories.push({
    name: 'Batch 1,2,3',
    count: 30,
    subcategories: {
      'Main Residence': 2,
      'Six-Year Rule': 5,
      'Time Apportionment': 3,
      'Multiple Properties': 4,
      'Deceased Estate': 3,
      'Foreign Resident': 2,
      'Special Rules': 2,
      'Aged Care': 1,
      'Pre-CGT': 1,
      'Adjacent Land': 1,
      'Relationship Breakdown': 1,
      'Business Use': 1,
      'Construction': 1,
      'Subdivision': 1,
      'Small Business': 1
    }
  });
} else {
  batch123Category.count = 30;
}

// Write the updated manifest
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

console.log('✅ Successfully added 30 Batch 1,2,3 scenarios to manifest');
console.log(`📊 Total scenarios: ${manifest.totalScenarios}`);
console.log(`📁 Batch 1,2,3 category added with 30 scenarios`);
