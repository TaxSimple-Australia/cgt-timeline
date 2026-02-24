#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Event type mapping: Invalid → Valid + description enhancement
const EVENT_TYPE_MIGRATIONS = {
  // Inheritance events
  'inheritance': {
    newType: 'ownership_change',
    descriptionPrefix: 'Property inherited'
  },
  'inherited': {
    newType: 'ownership_change',
    descriptionPrefix: 'Property inherited by beneficiary'
  },
  'death_of_owner': {
    newType: 'status_change',
    descriptionPrefix: 'Death of property owner'
  },
  'death_of_joint_owner': {
    newType: 'ownership_change',
    descriptionPrefix: 'Death of joint owner - ownership transfer'
  },

  // Relationship breakdown
  'separation': {
    newType: 'status_change',
    descriptionPrefix: 'Separation/relationship breakdown began'
  },
  'divorce_finalised': {
    newType: 'status_change',
    descriptionPrefix: 'Divorce finalised'
  },
  'divorce_transfer': {
    newType: 'ownership_change',
    descriptionPrefix: 'Property transferred as part of divorce settlement'
  },
  'divorce_property_settlement': {
    newType: 'ownership_change',
    descriptionPrefix: 'Divorce property settlement - ownership transfer'
  },
  'defacto_transfer': {
    newType: 'ownership_change',
    descriptionPrefix: 'Property transferred to de facto partner'
  },
  'spouse_a_moves_out': {
    newType: 'move_out',
    descriptionPrefix: 'Spouse moved out following separation'
  },

  // Airbnb/short-term rental
  'airbnb_start': {
    newType: 'rent_start',
    descriptionPrefix: 'Started Airbnb/short-term rental'
  },
  'airbnb_end': {
    newType: 'rent_end',
    descriptionPrefix: 'Ended Airbnb/short-term rental'
  },
  'airbnb_start_spare_room': {
    newType: 'rent_start',
    descriptionPrefix: 'Started Airbnb in spare room (partial rental)'
  },

  // Construction
  'construction_start': {
    newType: 'building_start',
    descriptionPrefix: 'Construction commenced'
  },
  'construction_complete': {
    newType: 'building_end',
    descriptionPrefix: 'Construction completed'
  },
  'demolition_start': {
    newType: 'status_change',
    descriptionPrefix: 'Demolition commenced'
  },

  // Purchase variants
  'purchase_vacant_land': {
    newType: 'purchase',
    descriptionPrefix: 'Purchased vacant land'
  },
  'purchase_by_deceased': {
    newType: 'purchase',
    descriptionPrefix: 'Originally purchased by deceased'
  },

  // Subdivision (legacy types)
  'subdivision_approved': {
    newType: 'subdivision',
    descriptionPrefix: 'Subdivision approved by council'
  },
  'subdivision_registered': {
    newType: 'subdivision',
    descriptionPrefix: 'Subdivision registered - titles issued'
  },
  'strata_subdivision': {
    newType: 'subdivision',
    descriptionPrefix: 'Strata subdivision (duplex/townhouse)'
  },

  // Trust & other
  'transfer_to_trust': {
    newType: 'ownership_change',
    descriptionPrefix: 'Property transferred to family trust'
  },
  'distribution_to_beneficiary': {
    newType: 'ownership_change',
    descriptionPrefix: 'Property distributed from trust to beneficiary'
  },
  'compulsory_acquisition': {
    newType: 'sale',
    descriptionPrefix: 'Compulsory acquisition by government'
  },

  // Other status changes
  'move_to_aged_care': {
    newType: 'status_change',
    descriptionPrefix: 'Moved to aged care - main residence exemption continues (indefinite absence rule)'
  },
  'move_out_overseas': {
    newType: 'move_out',
    descriptionPrefix: 'Moved overseas (6-year absence rule may apply)'
  },
  'marriage': {
    newType: 'status_change',
    descriptionPrefix: 'Marriage/relationship commenced'
  },
  'major_renovation': {
    newType: 'improvement',
    descriptionPrefix: 'Major renovation/capital improvement'
  },

  // Rent variants
  'rent_start_unit_b': {
    newType: 'rent_start',
    descriptionPrefix: 'Started renting Unit B (post-strata subdivision)'
  },
  'rent_end_unit_b': {
    newType: 'rent_end',
    descriptionPrefix: 'Ended renting Unit B'
  }
};

// Floor area extraction patterns
const FLOOR_AREA_PATTERNS = [
  // "Room: 18sqm exclusive, 45sqm shared"
  { pattern: /Room:\s*(\d+)\s*sqm\s+exclusive[,\s]+(\d+)\s*sqm\s+shared/i,
    extract: (match) => ({ rental: parseInt(match[1]), shared: parseInt(match[2]) }) },

  // "18 square meters bedroom, 45 square meters shared"
  { pattern: /(\d+)\s*(?:square\s*meters?|sqm|m2)\s+(?:bedroom|room)[,\s]+(\d+)\s*(?:square\s*meters?|sqm|m2)\s+shared/i,
    extract: (match) => ({ rental: parseInt(match[1]), shared: parseInt(match[2]) }) },

  // "Total floor area: 120sqm, Rental area: 18sqm"
  { pattern: /Total\s+floor\s+area:\s*(\d+)\s*(?:sqm|m2)[,\s]+Rental\s+area:\s*(\d+)\s*(?:sqm|m2)/i,
    extract: (match) => ({ total: parseInt(match[1]), rental: parseInt(match[2]) }) }
];

const stats = {
  totalScenarios: 0,
  scenariosMigrated: 0,
  scenariosUnchanged: 0,
  eventTypesMigrated: 0,
  subdivisionDataAdded: 0,
  floorAreaExtracted: 0
};

const migrations = [];

function generateUUID() {
  return crypto.randomUUID();
}

function extractFloorAreaFromDescription(description) {
  if (!description) return null;

  for (const { pattern, extract } of FLOOR_AREA_PATTERNS) {
    const match = description.match(pattern);
    if (match) {
      return extract(match);
    }
  }

  return null;
}

function migrateEvent(event, propertyAddress, scenarioTitle) {
  let migrated = false;
  const changes = [];
  const newEvent = { ...event };

  // Migrate event type if needed
  if (EVENT_TYPE_MIGRATIONS[event.event]) {
    const migration = EVENT_TYPE_MIGRATIONS[event.event];
    changes.push(`Event type: "${event.event}" → "${migration.newType}"`);

    newEvent.event = migration.newType;

    // Enhance description
    const existingDesc = newEvent.description || '';
    if (existingDesc) {
      newEvent.description = `${migration.descriptionPrefix}. ${existingDesc}`;
    } else {
      newEvent.description = migration.descriptionPrefix;
    }

    migrated = true;
    stats.eventTypesMigrated++;
  }

  // Add subdivision data if subdivision event without it
  if ((newEvent.event === 'subdivision' || event.event === 'subdivision_approved' || event.event === 'subdivision_registered') &&
      !newEvent.subdivisionDetails && !newEvent.subdivisionGroup) {

    // Generate subdivision group UUID (will be same for all events in same scenario)
    newEvent.subdivisionGroup = generateUUID();
    newEvent.subdivisionDetails = {
      approvalDate: event.date,
      registrationDate: event.event === 'subdivision_registered' ? event.date : undefined,
      notes: event.description || `Subdivision event on ${event.date}`
    };

    changes.push(`Added subdivisionGroup and subdivisionDetails`);
    migrated = true;
    stats.subdivisionDataAdded++;
  }

  // Extract floor area from description (rent_start events only)
  if (newEvent.event === 'rent_start' && !newEvent.floorAreaData && newEvent.description) {
    const floorArea = extractFloorAreaFromDescription(newEvent.description);
    if (floorArea) {
      newEvent.floorAreaData = floorArea;
      changes.push(`Extracted floor area from description: ${JSON.stringify(floorArea)}`);
      migrated = true;
      stats.floorAreaExtracted++;
    }
  }

  if (migrated) {
    migrations.push({
      scenario: scenarioTitle,
      property: propertyAddress,
      event: event.event,
      date: event.date,
      changes
    });
  }

  return { event: newEvent, migrated };
}

function migrateScenario(filePath, filename) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const scenario = JSON.parse(content);

    stats.totalScenarios++;

    let scenarioChanged = false;
    const scenarioTitle = scenario.title || scenario.scenario_info?.name || filename;

    // Generate a subdivision group UUID for this scenario (used for all subdivision events)
    const subdivisionGroupUUID = generateUUID();

    if (scenario.properties && Array.isArray(scenario.properties)) {
      scenario.properties.forEach((property) => {
        const propertyAddress = property.address || 'Unknown Property';

        if (property.property_history && Array.isArray(property.property_history)) {
          property.property_history = property.property_history.map(event => {
            const result = migrateEvent(event, propertyAddress, scenarioTitle);

            // Use same subdivisionGroup for all subdivision events in this scenario
            if (result.event.event === 'subdivision' && result.event.subdivisionGroup) {
              result.event.subdivisionGroup = subdivisionGroupUUID;
            }

            if (result.migrated) {
              scenarioChanged = true;
            }
            return result.event;
          });
        }
      });
    }

    if (scenarioChanged) {
      // Save migrated scenario
      const migratedPath = filePath; // Overwrite original (we have backup)
      fs.writeFileSync(migratedPath, JSON.stringify(scenario, null, 2), 'utf-8');
      stats.scenariosMigrated++;
      return { migrated: true, scenario: scenarioTitle };
    } else {
      stats.scenariosUnchanged++;
      return { migrated: false, scenario: scenarioTitle };
    }

  } catch (error) {
    console.error(`❌ Error migrating ${filename}:`, error.message);
    return { migrated: false, scenario: filename, error: error.message };
  }
}

function scanAndMigrate(dirPath, results) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    if (file.endsWith('.json')) {
      const filePath = path.join(dirPath, file);
      const result = migrateScenario(filePath, file);
      results.push(result);
    }
  });
}

function generateReport(results) {
  const reportLines = [];

  reportLines.push('='.repeat(80));
  reportLines.push('SCENARIO MIGRATION REPORT');
  reportLines.push(`Generated: ${new Date().toISOString()}`);
  reportLines.push('='.repeat(80));
  reportLines.push('');

  // Summary
  reportLines.push('MIGRATION SUMMARY');
  reportLines.push('-'.repeat(80));
  reportLines.push(`Total Scenarios Processed:   ${stats.totalScenarios}`);
  reportLines.push(`Scenarios Migrated:          ${stats.scenariosMigrated}`);
  reportLines.push(`Scenarios Unchanged:         ${stats.scenariosUnchanged}`);
  reportLines.push('');
  reportLines.push('CHANGES APPLIED');
  reportLines.push('-'.repeat(80));
  reportLines.push(`Event Types Migrated:        ${stats.eventTypesMigrated}`);
  reportLines.push(`Subdivision Data Added:      ${stats.subdivisionDataAdded}`);
  reportLines.push(`Floor Areas Extracted:       ${stats.floorAreaExtracted}`);
  reportLines.push('');

  // Detailed migrations
  reportLines.push('='.repeat(80));
  reportLines.push('DETAILED MIGRATION LOG');
  reportLines.push('='.repeat(80));
  reportLines.push('');

  const migratedByScenario = {};
  migrations.forEach(m => {
    if (!migratedByScenario[m.scenario]) {
      migratedByScenario[m.scenario] = [];
    }
    migratedByScenario[m.scenario].push(m);
  });

  Object.entries(migratedByScenario).forEach(([scenario, changes], index) => {
    reportLines.push(`${index + 1}. ${scenario}`);
    reportLines.push(`   Total changes: ${changes.length}`);
    reportLines.push('');

    changes.forEach((change, changeIndex) => {
      reportLines.push(`   ${changeIndex + 1}) Property: ${change.property}`);
      reportLines.push(`      Original Event: ${change.event} (${change.date})`);
      change.changes.forEach(c => {
        reportLines.push(`      ✓ ${c}`);
      });
      reportLines.push('');
    });

    reportLines.push('-'.repeat(80));
    reportLines.push('');
  });

  return reportLines.join('\n');
}

// Main execution
console.log('🔄 Migrating scenarios...\n');
console.log('⚠️  Original files will be modified (backup already created in public/scenarios-backup-*)');
console.log('');

const results = [];

const dir1 = path.join(__dirname, '..', 'public', 'scenariotestjsons');
const dir2 = path.join(__dirname, '..', 'public', 'tests');

console.log(`Migrating: ${dir1}`);
if (fs.existsSync(dir1)) {
  scanAndMigrate(dir1, results);
}

console.log(`Migrating: ${dir2}`);
if (fs.existsSync(dir2)) {
  scanAndMigrate(dir2, results);
}

// Generate reports
const report = generateReport(results);
const reportPath = path.join(__dirname, '..', 'scenario-migration-report.txt');
fs.writeFileSync(reportPath, report, 'utf-8');

console.log('\n✅ Migration complete!');
console.log(`📄 Report saved to: ${reportPath}`);
console.log(`\nScenarios processed: ${stats.totalScenarios}`);
console.log(`Scenarios migrated: ${stats.scenariosMigrated}`);
console.log(`Scenarios unchanged: ${stats.scenariosUnchanged}`);
console.log(`\nChanges applied:`);
console.log(`  - Event types migrated: ${stats.eventTypesMigrated}`);
console.log(`  - Subdivision data added: ${stats.subdivisionDataAdded}`);
console.log(`  - Floor areas extracted: ${stats.floorAreaExtracted}`);

// JSON report
const jsonReport = {
  generatedAt: new Date().toISOString(),
  stats,
  results,
  migrations
};

const jsonReportPath = path.join(__dirname, '..', 'scenario-migration-report.json');
fs.writeFileSync(jsonReportPath, JSON.stringify(jsonReport, null, 2), 'utf-8');
console.log(`📄 JSON report saved to: ${jsonReportPath}\n`);
