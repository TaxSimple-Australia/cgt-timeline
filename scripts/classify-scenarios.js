#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const classifications = [];
const stats = {
  total: 0,
  byCategory: {},
  bySubcategory: {},
  needsManualReview: 0
};

// Classification functions
function isForeignResident(scenario) {
  if (scenario.additional_info?.australian_resident === false) {
    return true;
  }

  const text = (scenario.title + ' ' + (scenario.scenario_info?.description || '')).toLowerCase();
  return /foreign\s+resident|non-resident|overseas\s+resident/i.test(text);
}

function detectOwnershipChange(scenario) {
  const text = (scenario.title + ' ' + (scenario.scenario_info?.description || '')).toLowerCase();

  // Check for relationship breakdown keywords
  if (/divorce|separation|relationship\s+breakdown|de\s*facto|ex-spouse|spouse\s+transfer/i.test(text)) {
    return 'Relationships';
  }

  // Check for inheritance/death keywords
  if (/deceased|inheritance|inherit|beneficiary|estate|executor|death|died|will|probate/i.test(text)) {
    return 'Inheritance/Death';
  }

  // Check for trust & entity keywords
  if (/trust|bare\s+trust|family\s+trust|entity\s+transfer|distribution.*beneficiary/i.test(text)) {
    return 'Trust & Entity';
  }

  // Check events for ownership_change type
  if (scenario.properties) {
    for (const property of scenario.properties) {
      if (property.property_history) {
        for (const event of property.property_history) {
          if (event.event === 'ownership_change') {
            // Try to determine subcategory from description
            const desc = (event.description || '').toLowerCase();
            if (/divorce|separation|relationship/i.test(desc)) return 'Relationships';
            if (/inherit|death|deceased|estate/i.test(desc)) return 'Inheritance/Death';
            if (/trust/i.test(desc)) return 'Trust & Entity';

            // Default to Inheritance/Death if unclear
            return 'Inheritance/Death';
          }
        }
      }
    }
  }

  return null;
}

function isSubdivision(scenario) {
  const text = (scenario.title + ' ' + (scenario.scenario_info?.description || '')).toLowerCase();

  // Check for subdivision keywords
  if (/subdivision|subdivide|lot\s+\d|lots\s+\d-\d|strata|vacant\s+land\s+sold|split\s+property/i.test(text)) {
    return true;
  }

  // Check for subdivision events
  if (scenario.properties) {
    for (const property of scenario.properties) {
      if (property.property_history) {
        for (const event of property.property_history) {
          if (event.event === 'subdivision') {
            return true;
          }
        }
      }
    }
  }

  return false;
}

function hasSpecialRules(scenario) {
  const text = (scenario.title + ' ' + (scenario.scenario_info?.description || '')).toLowerCase();

  const specialKeywords = [
    'small\s+business', '15-year', 'active\s+asset',
    'compulsory\s+acquisition',
    'pre-cgt', 'pre\s+cgt',
    'vacant\s+land', '4-year', '2-year.*build',
    'mortgagee', 'foreclosure',
    '>2\s+hectares?', 'rural.*>2', 'large\s+rural'
  ];

  for (const keyword of specialKeywords) {
    const regex = new RegExp(keyword, 'i');
    if (regex.test(text)) {
      return true;
    }
  }

  return false;
}

function classifyScenario(scenario, filename) {
  const title = scenario.title || scenario.scenario_info?.name || filename;
  const description = scenario.scenario_info?.description || '';
  const propertyCount = scenario.properties?.length || 0;
  const exemptionType = scenario.scenario_info?.expected_result?.exemption_type || 'unknown';
  const exemptionPercentage = scenario.scenario_info?.expected_result?.exemption_percentage;

  let category = null;
  let subcategory = null;
  let confidence = 100;
  let notes = [];

  // Priority 1: Foreign Resident
  if (isForeignResident(scenario)) {
    category = 'Foreign Resident';
    confidence = 95;
  }

  // Priority 2: Ownership Changes
  else {
    const ownershipSubcat = detectOwnershipChange(scenario);
    if (ownershipSubcat) {
      category = 'Ownership Changes';
      subcategory = ownershipSubcat;
      confidence = 85;
    }
  }

  // Priority 3: Subdivision
  if (!category && isSubdivision(scenario)) {
    category = 'Subdivision';
    confidence = 90;
  }

  // Priority 4: Special Rules
  if (!category && hasSpecialRules(scenario)) {
    category = 'Special Rules & Exemptions';
    confidence = 80;
  }

  // Priority 5: Multi-Property
  if (!category && propertyCount > 1) {
    category = 'Multi-Property Portfolios';
    confidence = 100;
  }

  // Priority 6: Main Residence (default)
  if (!category) {
    category = 'Main Residence';

    if (exemptionType === 'full' && exemptionPercentage === 100) {
      subcategory = 'Full';
      confidence = 100;
    } else if (exemptionType === 'partial' || exemptionPercentage < 100) {
      subcategory = 'Partial';
      confidence = 100;
    } else {
      // Unclear - check keywords
      const text = (title + ' ' + description).toLowerCase();
      if (/full.*exemption|100%|entire.*period|always.*main\s+residence/i.test(text)) {
        subcategory = 'Full';
        confidence = 80;
        notes.push('Inferred from title/description - verify expected_result');
      } else {
        subcategory = 'Partial';
        confidence = 70;
        notes.push('Defaulted to Partial - verify exemption type');
      }
    }
  }

  // Flag for manual review if confidence < 85
  const needsReview = confidence < 85;
  if (needsReview) {
    stats.needsManualReview++;
    notes.push('⚠️ Confidence < 85% - recommend manual review');
  }

  return {
    filename,
    title,
    category,
    subcategory,
    propertyCount,
    exemptionType,
    exemptionPercentage,
    confidence,
    needsReview,
    notes
  };
}

function scanAndClassify(dirPath) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    if (file.endsWith('.json')) {
      try {
        const filePath = path.join(dirPath, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const scenario = JSON.parse(content);

        stats.total++;

        const classification = classifyScenario(scenario, file);
        classifications.push(classification);

        // Update stats
        stats.byCategory[classification.category] = (stats.byCategory[classification.category] || 0) + 1;
        if (classification.subcategory) {
          const key = `${classification.category} - ${classification.subcategory}`;
          stats.bySubcategory[key] = (stats.bySubcategory[key] || 0) + 1;
        }

      } catch (error) {
        console.error(`❌ Error classifying ${file}:`, error.message);
      }
    }
  });
}

function generateReport() {
  const reportLines = [];

  reportLines.push('='.repeat(80));
  reportLines.push('SCENARIO CLASSIFICATION REPORT');
  reportLines.push(`Generated: ${new Date().toISOString()}`);
  reportLines.push('='.repeat(80));
  reportLines.push('');

  // Summary statistics
  reportLines.push('CLASSIFICATION SUMMARY');
  reportLines.push('-'.repeat(80));
  reportLines.push(`Total Scenarios Classified:  ${stats.total}`);
  reportLines.push(`Scenarios Needing Review:    ${stats.needsManualReview} (${Math.round(stats.needsManualReview / stats.total * 100)}%)`);
  reportLines.push('');

  reportLines.push('BY CATEGORY');
  reportLines.push('-'.repeat(80));
  Object.entries(stats.byCategory)
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, count]) => {
      const percentage = Math.round(count / stats.total * 100);
      reportLines.push(`${category.padEnd(35)} ${count.toString().padStart(3)} (${percentage}%)`);
    });
  reportLines.push('');

  reportLines.push('BY SUBCATEGORY');
  reportLines.push('-'.repeat(80));
  Object.entries(stats.bySubcategory)
    .sort((a, b) => b[1] - a[1])
    .forEach(([subcategory, count]) => {
      const percentage = Math.round(count / stats.total * 100);
      reportLines.push(`${subcategory.padEnd(45)} ${count.toString().padStart(3)} (${percentage}%)`);
    });
  reportLines.push('');

  // Detailed classifications
  reportLines.push('='.repeat(80));
  reportLines.push('DETAILED CLASSIFICATIONS');
  reportLines.push('='.repeat(80));
  reportLines.push('');

  // Group by category
  const byCategory = {};
  classifications.forEach(c => {
    if (!byCategory[c.category]) {
      byCategory[c.category] = [];
    }
    byCategory[c.category].push(c);
  });

  Object.entries(byCategory).forEach(([category, scenarios]) => {
    reportLines.push('');
    reportLines.push(`### ${category.toUpperCase()} (${scenarios.length} scenarios)`);
    reportLines.push('-'.repeat(80));
    reportLines.push('');

    scenarios.forEach((c, index) => {
      reportLines.push(`${index + 1}. ${c.title}`);
      reportLines.push(`   File: ${c.filename}`);
      if (c.subcategory) {
        reportLines.push(`   Subcategory: ${c.subcategory}`);
      }
      reportLines.push(`   Properties: ${c.propertyCount} | Exemption: ${c.exemptionType} (${c.exemptionPercentage}%)`);
      reportLines.push(`   Confidence: ${c.confidence}%`);
      if (c.notes.length > 0) {
        c.notes.forEach(note => {
          reportLines.push(`   Note: ${note}`);
        });
      }
      reportLines.push('');
    });
  });

  return reportLines.join('\n');
}

// Main execution
console.log('🏷️  Classifying scenarios...\n');

const dir1 = path.join(__dirname, '..', 'public', 'scenariotestjsons');
const dir2 = path.join(__dirname, '..', 'public', 'tests');

console.log(`Scanning: ${dir1}`);
if (fs.existsSync(dir1)) {
  scanAndClassify(dir1);
}

console.log(`Scanning: ${dir2}`);
if (fs.existsSync(dir2)) {
  scanAndClassify(dir2);
}

// Generate reports
const report = generateReport();
const reportPath = path.join(__dirname, '..', 'scenario-classification-report.txt');
fs.writeFileSync(reportPath, report, 'utf-8');

console.log('\n✅ Classification complete!');
console.log(`📄 Report saved to: ${reportPath}`);
console.log(`\nTotal scenarios: ${stats.total}`);
console.log(`Scenarios needing manual review: ${stats.needsManualReview}`);
console.log('\nBreakdown by category:');
Object.entries(stats.byCategory)
  .sort((a, b) => b[1] - a[1])
  .forEach(([category, count]) => {
    console.log(`  ${category}: ${count}`);
  });

// JSON report
const jsonReport = {
  generatedAt: new Date().toISOString(),
  stats,
  classifications
};

const jsonReportPath = path.join(__dirname, '..', 'scenario-classification-report.json');
fs.writeFileSync(jsonReportPath, JSON.stringify(jsonReport, null, 2), 'utf-8');
console.log(`📄 JSON report saved to: ${jsonReportPath}\n`);
