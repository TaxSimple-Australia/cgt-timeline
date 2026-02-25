#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Valid event types in current system
const VALID_EVENT_TYPES = [
  'purchase',
  'building_start',
  'building_end',
  'move_in',
  'move_out',
  'rent_start',
  'rent_end',
  'sale',
  'improvement',
  'refinance',
  'status_change',
  'ownership_change',
  'subdivision',
  'living_in_rental_start',
  'living_in_rental_end'
];

// Legacy event types that need migration
const LEGACY_EVENT_TYPES = {
  'subdivision_approved': 'subdivision',
  'subdivision_registered': 'subdivision',
  'move_to_aged_care': 'status_change'
};

const issues = {
  invalidEventTypes: [],
  missingSubdivisionData: [],
  floorAreaInDescription: [],
  legacyCostBase: [],
  missingDates: [],
  parseErrors: []
};

const stats = {
  totalScenarios: 0,
  totalProperties: 0,
  totalEvents: 0,
  scenariosWithIssues: 0,
  scenariosClean: 0
};

function validateScenario(filePath, filename) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const scenario = JSON.parse(content);

    stats.totalScenarios++;

    let scenarioHasIssues = false;
    const scenarioIssues = {
      filename,
      title: scenario.title || scenario.scenario_info?.name || filename,
      issues: []
    };

    // Validate properties and events
    if (scenario.properties && Array.isArray(scenario.properties)) {
      stats.totalProperties += scenario.properties.length;

      scenario.properties.forEach((property, propIndex) => {
        const propertyAddress = property.address || `Property ${propIndex + 1}`;

        if (property.property_history && Array.isArray(property.property_history)) {
          stats.totalEvents += property.property_history.length;

          property.property_history.forEach((event, eventIndex) => {
            const eventType = event.event;

            // Check for invalid event types
            if (!VALID_EVENT_TYPES.includes(eventType)) {
              if (LEGACY_EVENT_TYPES[eventType]) {
                scenarioIssues.issues.push({
                  type: 'LEGACY_EVENT_TYPE',
                  severity: 'HIGH',
                  property: propertyAddress,
                  event: eventType,
                  date: event.date,
                  suggestion: `Migrate "${eventType}" → "${LEGACY_EVENT_TYPES[eventType]}"`,
                  eventIndex
                });
                scenarioHasIssues = true;
              } else {
                scenarioIssues.issues.push({
                  type: 'INVALID_EVENT_TYPE',
                  severity: 'CRITICAL',
                  property: propertyAddress,
                  event: eventType,
                  date: event.date,
                  suggestion: 'Unknown event type - needs manual review',
                  eventIndex
                });
                scenarioHasIssues = true;
              }
            }

            // Check for subdivision events missing required data
            if (eventType === 'subdivision' || eventType === 'subdivision_approved' || eventType === 'subdivision_registered') {
              if (!event.subdivisionDetails && !event.subdivisionGroup) {
                scenarioIssues.issues.push({
                  type: 'MISSING_SUBDIVISION_DATA',
                  severity: 'HIGH',
                  property: propertyAddress,
                  event: eventType,
                  date: event.date,
                  suggestion: 'Add subdivisionGroup UUID and subdivisionDetails',
                  eventIndex
                });
                scenarioHasIssues = true;
              }
            }

            // Check for floor area data in description (rent_start events)
            if (eventType === 'rent_start' && event.description) {
              const floorAreaPattern = /(\d+)\s*(sqm|square\s*meters?|m2)/i;
              if (floorAreaPattern.test(event.description) && !event.floorAreaData) {
                scenarioIssues.issues.push({
                  type: 'FLOOR_AREA_IN_DESCRIPTION',
                  severity: 'MEDIUM',
                  property: propertyAddress,
                  event: eventType,
                  date: event.date,
                  description: event.description,
                  suggestion: 'Extract floor area from description → floorAreaData structure',
                  eventIndex
                });
                scenarioHasIssues = true;
              }
            }

            // Check for legacy cost base fields
            const legacyCostBaseFields = [
              'stamp_duty',
              'purchase_legal_fees',
              'agent_fees',
              'selling_legal_fees',
              'advertising_costs',
              'improvement_costs'
            ];

            const hasLegacyCostBase = legacyCostBaseFields.some(field => event[field] !== undefined);
            if (hasLegacyCostBase && !event.costBases) {
              scenarioIssues.issues.push({
                type: 'LEGACY_COST_BASE',
                severity: 'LOW',
                property: propertyAddress,
                event: eventType,
                date: event.date,
                suggestion: 'Migrate legacy cost base fields → costBases array (auto-handled by import)',
                eventIndex
              });
              // Note: This is LOW severity because import handles it automatically
            }

            // Check for missing/invalid dates
            if (!event.date) {
              scenarioIssues.issues.push({
                type: 'MISSING_DATE',
                severity: 'CRITICAL',
                property: propertyAddress,
                event: eventType,
                suggestion: 'Event must have a valid date',
                eventIndex
              });
              scenarioHasIssues = true;
            } else {
              // Try to parse date
              const dateFormats = [
                /^\d{4}-\d{2}-\d{2}$/,  // YYYY-MM-DD
                /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY
                /^\d{2}\s+\w+\s+\d{4}$/  // DD MMM YYYY
              ];
              const isValidFormat = dateFormats.some(format => format.test(event.date));
              if (!isValidFormat) {
                scenarioIssues.issues.push({
                  type: 'INVALID_DATE_FORMAT',
                  severity: 'HIGH',
                  property: propertyAddress,
                  event: eventType,
                  date: event.date,
                  suggestion: 'Date format should be YYYY-MM-DD, DD/MM/YYYY, or DD MMM YYYY',
                  eventIndex
                });
                scenarioHasIssues = true;
              }
            }
          });
        }
      });
    }

    if (scenarioHasIssues) {
      stats.scenariosWithIssues++;
      return scenarioIssues;
    } else {
      stats.scenariosClean++;
      return null;
    }

  } catch (error) {
    stats.scenariosWithIssues++;
    return {
      filename,
      title: filename,
      issues: [{
        type: 'PARSE_ERROR',
        severity: 'CRITICAL',
        error: error.message,
        suggestion: 'Fix JSON syntax errors'
      }]
    };
  }
}

function scanDirectory(dirPath, scenariosWithIssues) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    if (file.endsWith('.json')) {
      const filePath = path.join(dirPath, file);
      const result = validateScenario(filePath, file);
      if (result) {
        scenariosWithIssues.push(result);
      }
    }
  });
}

function generateReport(scenariosWithIssues) {
  const reportLines = [];

  reportLines.push('='.repeat(80));
  reportLines.push('SCENARIO VALIDATION REPORT');
  reportLines.push(`Generated: ${new Date().toISOString()}`);
  reportLines.push('='.repeat(80));
  reportLines.push('');

  // Summary statistics
  reportLines.push('SUMMARY STATISTICS');
  reportLines.push('-'.repeat(80));
  reportLines.push(`Total Scenarios Scanned:     ${stats.totalScenarios}`);
  reportLines.push(`Total Properties:            ${stats.totalProperties}`);
  reportLines.push(`Total Events:                ${stats.totalEvents}`);
  reportLines.push(`Scenarios with Issues:       ${stats.scenariosWithIssues} (${Math.round(stats.scenariosWithIssues / stats.totalScenarios * 100)}%)`);
  reportLines.push(`Scenarios Clean:             ${stats.scenariosClean} (${Math.round(stats.scenariosClean / stats.totalScenarios * 100)}%)`);
  reportLines.push('');

  // Issue type breakdown
  const issueTypeCounts = {};
  const severityCounts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };

  scenariosWithIssues.forEach(scenario => {
    scenario.issues.forEach(issue => {
      issueTypeCounts[issue.type] = (issueTypeCounts[issue.type] || 0) + 1;
      severityCounts[issue.severity] = (severityCounts[issue.severity] || 0) + 1;
    });
  });

  reportLines.push('ISSUE BREAKDOWN BY TYPE');
  reportLines.push('-'.repeat(80));
  Object.entries(issueTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      reportLines.push(`${type.padEnd(40)} ${count}`);
    });
  reportLines.push('');

  reportLines.push('ISSUE BREAKDOWN BY SEVERITY');
  reportLines.push('-'.repeat(80));
  reportLines.push(`CRITICAL (must fix):         ${severityCounts.CRITICAL}`);
  reportLines.push(`HIGH (should fix):           ${severityCounts.HIGH}`);
  reportLines.push(`MEDIUM (recommended):        ${severityCounts.MEDIUM}`);
  reportLines.push(`LOW (auto-handled):          ${severityCounts.LOW}`);
  reportLines.push('');

  // Detailed issues per scenario
  reportLines.push('='.repeat(80));
  reportLines.push('DETAILED ISSUES BY SCENARIO');
  reportLines.push('='.repeat(80));
  reportLines.push('');

  scenariosWithIssues.forEach((scenario, index) => {
    reportLines.push(`${index + 1}. ${scenario.title}`);
    reportLines.push(`   File: ${scenario.filename}`);
    reportLines.push(`   Issues: ${scenario.issues.length}`);
    reportLines.push('');

    scenario.issues.forEach((issue, issueIndex) => {
      reportLines.push(`   ${issueIndex + 1}) [${issue.severity}] ${issue.type}`);
      if (issue.property) reportLines.push(`      Property: ${issue.property}`);
      if (issue.event) reportLines.push(`      Event: ${issue.event}`);
      if (issue.date) reportLines.push(`      Date: ${issue.date}`);
      if (issue.description) reportLines.push(`      Description: ${issue.description.substring(0, 60)}...`);
      if (issue.error) reportLines.push(`      Error: ${issue.error}`);
      reportLines.push(`      → ${issue.suggestion}`);
      reportLines.push('');
    });

    reportLines.push('-'.repeat(80));
    reportLines.push('');
  });

  return reportLines.join('\n');
}

// Main execution
console.log('🔍 Validating all scenarios...\n');

const scenariosWithIssues = [];

// Scan both directories
const dir1 = path.join(__dirname, '..', 'public', 'scenariotestjsons');
const dir2 = path.join(__dirname, '..', 'public', 'tests');

console.log(`Scanning: ${dir1}`);
if (fs.existsSync(dir1)) {
  scanDirectory(dir1, scenariosWithIssues);
}

console.log(`Scanning: ${dir2}`);
if (fs.existsSync(dir2)) {
  scanDirectory(dir2, scenariosWithIssues);
}

// Generate and save report
const report = generateReport(scenariosWithIssues);
const reportPath = path.join(__dirname, '..', 'scenario-validation-report.txt');
fs.writeFileSync(reportPath, report, 'utf-8');

console.log('\n✅ Validation complete!');
console.log(`📄 Report saved to: ${reportPath}`);
console.log(`\nScenarios scanned: ${stats.totalScenarios}`);
console.log(`Scenarios with issues: ${stats.scenariosWithIssues}`);
console.log(`Scenarios clean: ${stats.scenariosClean}`);

// Also output JSON for programmatic use
const jsonReport = {
  generatedAt: new Date().toISOString(),
  stats,
  issueTypeCounts: {},
  scenariosWithIssues
};

scenariosWithIssues.forEach(scenario => {
  scenario.issues.forEach(issue => {
    jsonReport.issueTypeCounts[issue.type] = (jsonReport.issueTypeCounts[issue.type] || 0) + 1;
  });
});

const jsonReportPath = path.join(__dirname, '..', 'scenario-validation-report.json');
fs.writeFileSync(jsonReportPath, JSON.stringify(jsonReport, null, 2), 'utf-8');
console.log(`📄 JSON report saved to: ${jsonReportPath}\n`);
