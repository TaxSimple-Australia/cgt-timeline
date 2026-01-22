/**
 * Script to generate a scenarios manifest file
 * This runs at build time to create a single JSON file with all scenario metadata
 * Instead of fetching 82 files, the app only needs to fetch this one manifest
 */

const fs = require('fs');
const path = require('path');

// Scenario configuration - same as in ScenarioSelectorModal.tsx
const SCENARIO_CONFIG = [
  // Core Concepts (1-10)
  { filename: 'scenario1_full_main_residence_exemption.json', displayTitle: 'Full Main Residence Exemption', category: 'Core Concepts' },
  { filename: 'scenario2_six_year_rule_within.json', displayTitle: '6-Year Absence Rule (Within Limit)', category: 'Core Concepts' },
  { filename: 'scenario3_six_year_rule_exceeded.json', displayTitle: '6-Year Absence Rule (Exceeded)', category: 'Core Concepts' },
  { filename: 'scenario4_rental_first_then_main_residence.json', displayTitle: 'Rental First, Then Main Residence', category: 'Core Concepts' },
  { filename: 'scenario5_moving_between_residences.json', displayTitle: 'Moving Between Residences', category: 'Core Concepts' },
  { filename: 'new_scenario_1_full_main_residence.json', displayTitle: 'Full Main Residence (Variant B)', category: 'Core Concepts' },
  { filename: 'new_scenario_2_six_year_within.json', displayTitle: '6-Year Rule Within (Variant B)', category: 'Core Concepts' },
  { filename: 'new_scenario_3_six_year_exceeded.json', displayTitle: '6-Year Rule Exceeded (Variant B)', category: 'Core Concepts' },
  { filename: 'new_scenario_4_rental_first.json', displayTitle: 'Rental First (Variant B)', category: 'Core Concepts' },
  { filename: 'new_scenario_5_moving_between_residences.json', displayTitle: 'Moving Between Residences (Variant B)', category: 'Core Concepts' },
  // Multi-Factor (11-20)
  { filename: 'scenario6_multiple_absence_periods.json', displayTitle: 'Multiple Absence Periods', category: 'Multi-Factor' },
  { filename: 'scenario7_two_properties_strategic_mre.json', displayTitle: 'Two Properties - Strategic MRE Choice', category: 'Multi-Factor' },
  { filename: 'scenario8_inherited_property_rental.json', displayTitle: 'Inherited Property with Rental', category: 'Multi-Factor' },
  { filename: 'scenario9_investment_then_ppr_then_rental.json', displayTitle: 'Investment → Main Residence → Rental', category: 'Multi-Factor' },
  { filename: 'scenario10_six_month_overlap_exceeded.json', displayTitle: '6-Month Overlap Rule Exceeded', category: 'Multi-Factor' },
  { filename: 'scenario11_construction_four_year_rule.json', displayTitle: 'Construction & 4-Year Building Rule', category: 'Multi-Factor' },
  { filename: 'scenario12_airbnb_room_rental.json', displayTitle: 'Partial Use - Airbnb Room Rental', category: 'Multi-Factor' },
  { filename: 'scenario13_couple_separate_properties.json', displayTitle: 'Couple with Separate Properties', category: 'Multi-Factor' },
  { filename: 'scenario14_foreign_resident_period.json', displayTitle: 'Foreign Resident Period Impact', category: 'Multi-Factor' },
  { filename: 'scenario15_three_property_portfolio.json', displayTitle: 'Three Property Portfolio', category: 'Multi-Factor' },
  // Special Rules (21-40)
  { filename: 'scenario21_aged_care_indefinite_absence.json', displayTitle: 'Aged Care - Indefinite Absence', category: 'Special Rules' },
  { filename: 'scenario22_delayed_move_in_work.json', displayTitle: 'Delayed Move-In (Work Assignment)', category: 'Special Rules' },
  { filename: 'scenario23_six_year_periods_reset.json', displayTitle: 'Multiple 6-Year Periods Reset', category: 'Special Rules' },
  { filename: 'scenario24_deceased_estate_two_years.json', displayTitle: 'Deceased Estate (Within 2 Years)', category: 'Special Rules' },
  { filename: 'scenario25_beneficiary_moves_in.json', displayTitle: 'Beneficiary Moves Into Inherited Property', category: 'Special Rules' },
  { filename: 'scenario26_pre_cgt_major_improvements.json', displayTitle: 'Pre-CGT with Major Improvements', category: 'Special Rules' },
  { filename: 'scenario27_large_rural_property.json', displayTitle: 'Large Rural Property (>2 Hectares)', category: 'Special Rules' },
  { filename: 'scenario28_granny_flat_arrangement.json', displayTitle: 'Granny Flat Arrangement', category: 'Special Rules' },
  { filename: 'scenario29_relationship_breakdown.json', displayTitle: 'Relationship Breakdown Rollover', category: 'Special Rules' },
  { filename: 'scenario30_home_office_business.json', displayTitle: 'Home Office Business Use', category: 'Special Rules' },
  { filename: 'scenario31_foreign_resident_life_event.json', displayTitle: 'Foreign Resident Life Event', category: 'Special Rules' },
  { filename: 'scenario32_pre_may_2012_foreign.json', displayTitle: 'Pre-9 May 2012 Foreign Residency', category: 'Special Rules' },
  { filename: 'scenario33_spouses_different_residences.json', displayTitle: 'Spouses - Different Main Residences', category: 'Special Rules' },
  { filename: 'scenario34_vacant_periods_extended_rental.json', displayTitle: 'Vacant Periods During Rental', category: 'Special Rules' },
  { filename: 'scenario35_four_year_construction.json', displayTitle: '4-Year Construction Rule Exceeded', category: 'Special Rules' },
  { filename: 'scenario36_subdivision_land_sale.json', displayTitle: 'Subdivision - Separate Land Sale', category: 'Special Rules' },
  { filename: 'scenario37_deceased_estate_covid.json', displayTitle: 'Deceased Estate - COVID Extension', category: 'Special Rules' },
  { filename: 'scenario38_small_business_15_year.json', displayTitle: 'Small Business 15-Year Exemption', category: 'Special Rules' },
  { filename: 'scenario39_investment_then_main_residence.json', displayTitle: 'Investment Then Main Residence', category: 'Special Rules' },
  { filename: 'scenario40_four_property_portfolio.json', displayTitle: 'Four Property Portfolio', category: 'Special Rules' },
  // Real-World (41-82)
  { filename: 'aged_care_main_residence.json', displayTitle: 'Aged Care - Main Residence', category: 'Real-World', path: 'tests' },
  { filename: 'airbnb_investment_only.json', displayTitle: 'Airbnb - Investment Only', category: 'Real-World', path: 'tests' },
  { filename: 'airbnb_spare_room.json', displayTitle: 'Airbnb - Spare Room', category: 'Real-World', path: 'tests' },
  { filename: 'bare_trust_no_cgt.json', displayTitle: 'Bare Trust - No CGT', category: 'Real-World', path: 'tests' },
  { filename: 'compulsory_acquisition_rollover.json', displayTitle: 'Compulsory Acquisition Rollover', category: 'Real-World', path: 'tests' },
  { filename: 'death_of_joint_owner.json', displayTitle: 'Death of Joint Owner', category: 'Real-World', path: 'tests' },
  { filename: 'defacto_breakdown_rollover.json', displayTitle: 'De Facto Breakdown Rollover', category: 'Real-World', path: 'tests' },
  { filename: 'divorce_complex_mre_then_rented_after_transfer.json', displayTitle: 'Divorce - MRE Then Rented After Transfer', category: 'Real-World', path: 'tests' },
  { filename: 'executor_sale_before_distribution.json', displayTitle: 'Executor Sale Before Distribution', category: 'Real-World', path: 'tests' },
  { filename: 'first_use_overseas_posting.json', displayTitle: 'First Use - Overseas Posting', category: 'Real-World', path: 'tests' },
  { filename: 'inherited_land_built_dwelling_then_sold.json', displayTitle: 'Inherited Land - Built Dwelling Then Sold', category: 'Real-World', path: 'tests' },
  { filename: 'inherited_land_farmland_subdivided_sold.json', displayTitle: 'Inherited Farmland - Subdivided & Sold', category: 'Real-World', path: 'tests' },
  { filename: 'inherited_land_vacant_pre_cgt_deceased.json', displayTitle: 'Inherited Vacant Land - Pre-CGT Deceased', category: 'Real-World', path: 'tests' },
  { filename: 'inherited_property_2year_rule.json', displayTitle: 'Inherited Property - 2 Year Rule', category: 'Real-World', path: 'tests' },
  { filename: 'investment_property_divorce_transfer.json', displayTitle: 'Investment Property - Divorce Transfer', category: 'Real-World', path: 'tests' },
  { filename: 'joint_ownership_main_residence_choice.json', displayTitle: 'Joint Ownership - MR Choice', category: 'Real-World', path: 'tests' },
  { filename: 'joint_sale_during_separation.json', displayTitle: 'Joint Sale During Separation', category: 'Real-World', path: 'tests' },
  { filename: 'joint_tenants_equal_split.json', displayTitle: 'Joint Tenants - Equal Split', category: 'Real-World', path: 'tests' },
  { filename: 'main_residence_land_exceeds_2ha.json', displayTitle: 'Main Residence - Land Exceeds 2ha', category: 'Real-World', path: 'tests' },
  { filename: 'mortgagee_sale_foreclosure.json', displayTitle: 'Mortgagee Sale - Foreclosure', category: 'Real-World', path: 'tests' },
  { filename: 'multiple_beneficiaries.json', displayTitle: 'Multiple Beneficiaries', category: 'Real-World', path: 'tests' },
  { filename: 'pre_cgt_inheritance.json', displayTitle: 'Pre-CGT Inheritance', category: 'Real-World', path: 'tests' },
  { filename: 'pre_cgt_property_with_improvements.json', displayTitle: 'Pre-CGT Property with Improvements', category: 'Real-World', path: 'tests' },
  { filename: 'relationship_breakdown_rollover.json', displayTitle: 'Relationship Breakdown Rollover', category: 'Real-World', path: 'tests' },
  { filename: 'six_month_overlap_old_home_rented.json', displayTitle: '6-Month Overlap - Old Home Rented', category: 'Real-World', path: 'tests' },
  { filename: 'six_year_rule_exceeded.json', displayTitle: '6-Year Rule Exceeded', category: 'Real-World', path: 'tests' },
  { filename: 'six_year_rule_multiple_absences.json', displayTitle: '6-Year Rule - Multiple Absences', category: 'Real-World', path: 'tests' },
  { filename: 'six_year_rule_within_limit.json', displayTitle: '6-Year Rule Within Limit', category: 'Real-World', path: 'tests' },
  { filename: 'subdivision_build_and_sell.json', displayTitle: 'Subdivision - Build & Sell', category: 'Real-World', path: 'tests' },
  { filename: 'subdivision_main_residence_vacant_land.json', displayTitle: 'Subdivision - MR Vacant Land', category: 'Real-World', path: 'tests' },
  { filename: 'subdivision_multiple_lots_sold.json', displayTitle: 'Subdivision - Multiple Lots Sold', category: 'Real-World', path: 'tests' },
  { filename: 'subdivision_pre_cgt_property.json', displayTitle: 'Subdivision - Pre-CGT Property', category: 'Real-World', path: 'tests' },
  { filename: 'subdivision_retain_dwelling_sell_vacant.json', displayTitle: 'Subdivision - Retain Dwelling, Sell Vacant', category: 'Real-World', path: 'tests' },
  { filename: 'subdivision_strata_title.json', displayTitle: 'Subdivision - Strata Title', category: 'Real-World', path: 'tests' },
  { filename: 'tenants_in_common_unequal.json', displayTitle: 'Tenants in Common - Unequal', category: 'Real-World', path: 'tests' },
  { filename: 'time_apportionment_multiple_periods.json', displayTitle: 'Time Apportionment - Multiple Periods', category: 'Real-World', path: 'tests' },
  { filename: 'time_apportionment_with_absence_rule.json', displayTitle: 'Time Apportionment with Absence Rule', category: 'Real-World', path: 'tests' },
  { filename: 'transfer_to_family_trust.json', displayTitle: 'Transfer to Family Trust', category: 'Real-World', path: 'tests' },
  { filename: 'trust_distribution_to_beneficiary.json', displayTitle: 'Trust Distribution to Beneficiary', category: 'Real-World', path: 'tests' },
  { filename: 'two_year_building_rule_eligible.json', displayTitle: '2-Year Building Rule - Eligible', category: 'Real-World', path: 'tests' },
  { filename: 'two_year_building_rule_exceeded.json', displayTitle: '2-Year Building Rule - Exceeded', category: 'Real-World', path: 'tests' },
  { filename: 'two_year_building_rule_renovation.json', displayTitle: '2-Year Building Rule - Renovation', category: 'Real-World', path: 'tests' },
];

const publicDir = path.join(__dirname, '..', 'public');

// Helper function to format currency
function formatCurrency(amount) {
  if (amount === undefined || amount === null) return null;
  return `$${amount.toLocaleString()}`;
}

// Helper function to format date
function formatDate(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Helper function to get event display name
function getEventDisplayName(event) {
  const eventNames = {
    'purchase': 'Purchased',
    'sale': 'Sold',
    'move_in': 'Moved In',
    'move_out': 'Moved Out',
    'rent_start': 'Started Renting',
    'rent_end': 'Stopped Renting',
    'improvement': 'Improvement',
    'refinance': 'Refinanced',
    'status_change': 'Status Change',
    'move_to_aged_care': 'Moved to Aged Care',
    'living_in_rental_start': 'Living in Rental',
    'living_in_rental_end': 'Left Rental'
  };
  return eventNames[event] || event;
}

// Helper function to calculate holding period in years
function calculateHoldingPeriod(startDate, endDate) {
  if (!startDate || !endDate) return null;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
  return Math.round(diffYears * 10) / 10; // Round to 1 decimal
}

// Extract detailed property info from scenario data
function extractPropertyDetails(properties) {
  if (!properties || !Array.isArray(properties) || properties.length === 0) {
    return null;
  }

  const propertySummaries = [];
  let totalPurchaseValue = 0;
  let totalSaleValue = 0;
  let earliestDate = null;
  let latestDate = null;
  const allEvents = [];

  for (const property of properties) {
    const history = property.property_history || [];

    // Find purchase and sale events
    const purchaseEvent = history.find(e => e.event === 'purchase');
    const saleEvent = history.find(e => e.event === 'sale');

    // Build event timeline for this property
    const keyEvents = [];
    for (const event of history) {
      // Track date range
      if (event.date) {
        const eventDate = new Date(event.date);
        if (!earliestDate || eventDate < earliestDate) earliestDate = eventDate;
        if (!latestDate || eventDate > latestDate) latestDate = eventDate;
      }

      // Add to key events (skip minor events for summary)
      const importantEvents = ['purchase', 'sale', 'move_in', 'move_out', 'rent_start', 'rent_end', 'move_to_aged_care', 'improvement'];
      if (importantEvents.includes(event.event)) {
        keyEvents.push({
          date: formatDate(event.date),
          event: getEventDisplayName(event.event),
          price: event.price ? formatCurrency(event.price) : null
        });

        // Add to all events for timeline
        allEvents.push({
          date: event.date,
          displayDate: formatDate(event.date),
          event: getEventDisplayName(event.event),
          property: property.address?.split(',')[0] || 'Property', // Short address
          price: event.price ? formatCurrency(event.price) : null
        });
      }
    }

    // Calculate totals
    if (purchaseEvent?.price) totalPurchaseValue += purchaseEvent.price;
    if (saleEvent?.price) totalSaleValue += saleEvent.price;

    // Create property summary
    const summary = {
      address: property.address || 'Unknown Address',
      shortAddress: property.address?.split(',')[0] || 'Property',
      purchasePrice: purchaseEvent?.price ? formatCurrency(purchaseEvent.price) : null,
      purchaseDate: purchaseEvent?.date ? formatDate(purchaseEvent.date) : null,
      salePrice: saleEvent?.price ? formatCurrency(saleEvent.price) : null,
      saleDate: saleEvent?.date ? formatDate(saleEvent.date) : null,
      keyEvents: keyEvents.slice(0, 6), // Limit to 6 key events
      notes: property.notes || null
    };

    // Add holding period if we have purchase date
    if (purchaseEvent?.date) {
      const endDate = saleEvent?.date || new Date().toISOString().split('T')[0];
      summary.holdingYears = calculateHoldingPeriod(purchaseEvent.date, endDate);
    }

    propertySummaries.push(summary);
  }

  // Sort all events by date
  allEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

  return {
    properties: propertySummaries,
    financialSummary: {
      totalPurchaseValue: totalPurchaseValue > 0 ? formatCurrency(totalPurchaseValue) : null,
      totalSaleValue: totalSaleValue > 0 ? formatCurrency(totalSaleValue) : null,
      totalGain: totalSaleValue > 0 && totalPurchaseValue > 0
        ? formatCurrency(totalSaleValue - totalPurchaseValue)
        : null,
      holdingPeriodYears: calculateHoldingPeriod(earliestDate, latestDate)
    },
    timeline: allEvents.slice(0, 10) // Limit to 10 events for the combined timeline
  };
}

async function generateManifest() {
  console.log('🔄 Generating scenarios manifest...');

  const scenarios = [];
  let successCount = 0;
  let errorCount = 0;

  for (const config of SCENARIO_CONFIG) {
    const basePath = config.path || 'scenariotestjsons';
    const filePath = path.join(publicDir, basePath, config.filename);

    try {
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️  File not found: ${basePath}/${config.filename}`);
        errorCount++;
        continue;
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      const scenarioInfo = data.scenario_info;

      // Extract detailed property information
      const propertyDetails = extractPropertyDetails(data.properties);

      scenarios.push({
        id: `${basePath}/${config.filename}`,
        filename: config.filename,
        path: basePath,
        title: config.displayTitle,
        description: scenarioInfo?.description || data.user_query || 'No description available',
        category: config.category,
        propertyCount: data.properties?.length || 0,
        // Include scenario_info for detail view
        scenario_info: scenarioInfo ? {
          name: scenarioInfo.name,
          expected_result: scenarioInfo.expected_result,
          applicable_rules: scenarioInfo.applicable_rules,
        } : undefined,
        // NEW: Include detailed property info
        propertyDetails: propertyDetails,
        // NEW: Include user query for context
        userQuery: data.user_query || null,
        // NEW: Include residency status if available
        australianResident: data.additional_info?.australian_resident,
        marginalTaxRate: data.additional_info?.marginal_tax_rate,
      });

      successCount++;
    } catch (error) {
      console.error(`❌ Error processing ${config.filename}:`, error.message);
      errorCount++;
    }
  }

  // Generate manifest
  const manifest = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    totalScenarios: scenarios.length,
    categories: {
      'Core Concepts': scenarios.filter(s => s.category === 'Core Concepts').length,
      'Multi-Factor': scenarios.filter(s => s.category === 'Multi-Factor').length,
      'Special Rules': scenarios.filter(s => s.category === 'Special Rules').length,
      'Real-World': scenarios.filter(s => s.category === 'Real-World').length,
    },
    scenarios,
  };

  // Write manifest file
  const manifestPath = path.join(publicDir, 'scenarios-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log(`✅ Manifest generated successfully!`);
  console.log(`   📁 Output: ${manifestPath}`);
  console.log(`   📊 Total scenarios: ${scenarios.length}`);
  console.log(`   ✓ Successful: ${successCount}`);
  console.log(`   ✗ Errors: ${errorCount}`);
  console.log(`   📦 Categories:`);
  Object.entries(manifest.categories).forEach(([cat, count]) => {
    console.log(`      - ${cat}: ${count}`);
  });
}

generateManifest().catch(console.error);
