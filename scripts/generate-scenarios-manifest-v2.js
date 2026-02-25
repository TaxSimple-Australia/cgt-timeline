/**
 * Script to generate a scenarios manifest file with automated classifications
 * This runs at build time to create a single JSON file with all scenario metadata
 * Uses classifications from scenario-classification-report.json
 */

const fs = require('fs');
const path = require('path');

// Load automated classifications
const classificationReportPath = path.join(__dirname, '..', 'scenario-classification-report.json');
const classificationReport = JSON.parse(fs.readFileSync(classificationReportPath, 'utf-8'));
const classifications = classificationReport.classifications;

// Create a map of filename → classification
const classificationMap = {};
classifications.forEach(c => {
  classificationMap[c.filename] = c;
});

const publicDir = path.join(__dirname, '..', 'public');

// Helper function to format currency
function formatCurrency(amount) {
  if (amount === undefined || amount === null) return null;
  return `$${amount.toLocaleString()}`;
}

// Helper function to format date
function formatDate(dateStr) {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
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
    'ownership_change': 'Ownership Change',
    'subdivision': 'Subdivision',
    'building_start': 'Construction Started',
    'building_end': 'Construction Completed',
    'living_in_rental_start': 'Living in Rental',
    'living_in_rental_end': 'Left Rental'
  };
  return eventNames[event] || event;
}

// Helper function to calculate holding period in years
function calculateHoldingPeriod(startDate, endDate) {
  if (!startDate || !endDate) return null;
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
    return Math.round(diffYears * 10) / 10; // Round to 1 decimal
  } catch {
    return null;
  }
}

// Extract detailed property info from scenario data
function extractPropertyDetails(properties) {
  if (!properties || !Array.isArray(properties) || properties.length === 0) {
    return null;
  }

  const propertySummaries = [];

  properties.forEach(property => {
    const history = property.property_history || [];

    // Find purchase and sale dates
    const purchaseEvent = history.find(e => e.event === 'purchase');
    const saleEvent = history.find(e => e.event === 'sale');

    propertySummaries.push({
      address: property.address,
      purchasePrice: purchaseEvent ? formatCurrency(purchaseEvent.price) : null,
      purchaseDate: purchaseEvent ? formatDate(purchaseEvent.date) : null,
      salePrice: saleEvent ? formatCurrency(saleEvent.price) : null,
      saleDate: saleEvent ? formatDate(saleEvent.date) : null,
      holdingPeriod: purchaseEvent && saleEvent ?
        calculateHoldingPeriod(purchaseEvent.date, saleEvent.date) : null,
      eventCount: history.length
    });
  });

  return propertySummaries;
}

// Process a single scenario file
function processScenario(filename, folderPath) {
  const filePath = path.join(publicDir, folderPath, filename);

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);

    // Get classification
    const classification = classificationMap[filename] || {
      category: 'Main Residence',
      subcategory: 'Partial',
      confidence: 50,
      needsReview: true,
      notes: ['⚠️ Not found in classification report - default assigned']
    };

    // Extract expected result
    const expectedResult = data.scenario_info?.expected_result || {};

    // Extract property details
    const properties = extractPropertyDetails(data.properties);

    return {
      filename,
      path: folderPath,
      title: data.title || data.scenario_info?.name || filename,
      description: data.scenario_info?.description || null,

      // New 7-category system
      category: classification.category,
      subcategory: classification.subcategory,

      // Classification metadata
      classificationConfidence: classification.confidence,
      needsReview: classification.needsReview,
      classificationNotes: classification.notes,

      // Property counts
      propertyCount: data.properties?.length || 0,

      // Expected result
      exemptionType: expectedResult.exemption_type || null,
      exemptionPercentage: expectedResult.exemption_percentage || null,
      capitalGain: expectedResult.capital_gain ? formatCurrency(expectedResult.capital_gain) : null,
      taxableGain: expectedResult.taxable_gain !== undefined ? formatCurrency(expectedResult.taxable_gain) : null,
      cgtPayable: expectedResult.cgt_payable !== undefined ? formatCurrency(expectedResult.cgt_payable) : null,

      // Applicable rules
      applicableRules: data.scenario_info?.applicable_rules || [],

      // Property details
      properties
    };

  } catch (error) {
    console.error(`Error processing ${filename}:`, error.message);
    return null;
  }
}

// Main execution
console.log('📦 Generating scenarios manifest with automated classifications...\n');

const scenarios = [];

// Scan scenariotestjsons folder
const dir1 = path.join(publicDir, 'scenariotestjsons');
if (fs.existsSync(dir1)) {
  const files = fs.readdirSync(dir1);
  files.forEach(file => {
    if (file.endsWith('.json')) {
      const scenario = processScenario(file, 'scenariotestjsons');
      if (scenario) {
        scenarios.push(scenario);
      }
    }
  });
}

// Scan tests folder
const dir2 = path.join(publicDir, 'tests');
if (fs.existsSync(dir2)) {
  const files = fs.readdirSync(dir2);
  files.forEach(file => {
    if (file.endsWith('.json')) {
      const scenario = processScenario(file, 'tests');
      if (scenario) {
        scenarios.push(scenario);
      }
    }
  });
}

// Generate category summary
const categoryStats = {};
scenarios.forEach(s => {
  const key = s.subcategory ? `${s.category} - ${s.subcategory}` : s.category;
  categoryStats[key] = (categoryStats[key] || 0) + 1;
});

// Create manifest
const manifest = {
  generatedAt: new Date().toISOString(),
  totalScenarios: scenarios.length,
  classificationSystem: '7-category',
  categories: [
    {
      name: 'Main Residence',
      count: scenarios.filter(s => s.category === 'Main Residence').length,
      subcategories: {
        'Full': scenarios.filter(s => s.category === 'Main Residence' && s.subcategory === 'Full').length,
        'Partial': scenarios.filter(s => s.category === 'Main Residence' && s.subcategory === 'Partial').length
      }
    },
    {
      name: 'Ownership Changes',
      count: scenarios.filter(s => s.category === 'Ownership Changes').length,
      subcategories: {
        'Relationships': scenarios.filter(s => s.category === 'Ownership Changes' && s.subcategory === 'Relationships').length,
        'Inheritance/Death': scenarios.filter(s => s.category === 'Ownership Changes' && s.subcategory === 'Inheritance/Death').length,
        'Trust & Entity': scenarios.filter(s => s.category === 'Ownership Changes' && s.subcategory === 'Trust & Entity').length
      }
    },
    {
      name: 'Subdivision',
      count: scenarios.filter(s => s.category === 'Subdivision').length
    },
    {
      name: 'Multi-Property Portfolios',
      count: scenarios.filter(s => s.category === 'Multi-Property Portfolios').length
    },
    {
      name: 'Foreign Resident',
      count: scenarios.filter(s => s.category === 'Foreign Resident').length
    },
    {
      name: 'Special Rules & Exemptions',
      count: scenarios.filter(s => s.category === 'Special Rules & Exemptions').length
    }
  ],
  scenarios
};

// Write manifest
const manifestPath = path.join(publicDir, 'scenarios-manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

console.log('✅ Manifest generated successfully!');
console.log(`📄 Saved to: ${manifestPath}`);
console.log(`\nTotal scenarios: ${manifest.totalScenarios}`);
console.log('\nBreakdown by category:');
manifest.categories.forEach(cat => {
  console.log(`  ${cat.name}: ${cat.count}`);
  if (cat.subcategories) {
    Object.entries(cat.subcategories).forEach(([sub, count]) => {
      if (count > 0) {
        console.log(`    - ${sub}: ${count}`);
      }
    });
  }
});

console.log('\n✨ Manifest generation complete!\n');
