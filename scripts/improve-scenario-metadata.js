#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const stats = {
  totalScenarios: 0,
  scenariosUpdated: 0,
  scenariosSkipped: 0,
  titlesImproved: 0,
  descriptionsAdded: 0
};

const updates = [];

// Analyze scenario to determine type and generate contextual title
function generateContextualTitle(scenario, filename) {
  const properties = scenario.properties || [];
  const userQuery = scenario.user_query || '';
  const additionalInfo = scenario.additional_info || {};

  // Collect all events
  const allEvents = [];
  properties.forEach(prop => {
    if (prop.property_history) {
      allEvents.push(...prop.property_history);
    }
  });

  // Check for scenario patterns
  const hasSubdivision = allEvents.some(e => e.event === 'subdivision');
  const hasOwnershipChange = allEvents.some(e => e.event === 'ownership_change');
  const hasBuildingEvents = allEvents.some(e => e.event === 'building_start' || e.event === 'building_end');
  const isForeignResident = additionalInfo.australian_resident === false;

  // Check for rental events
  const rentStartEvents = allEvents.filter(e => e.event === 'rent_start');
  const rentEndEvents = allEvents.filter(e => e.event === 'rent_end');

  // Calculate rental period if applicable
  let rentalYears = 0;
  if (rentStartEvents.length > 0 && rentEndEvents.length > 0) {
    try {
      const start = new Date(rentStartEvents[0].date);
      const end = new Date(rentEndEvents[0].date);
      rentalYears = (end - start) / (1000 * 60 * 60 * 24 * 365);
    } catch {}
  }

  // Keyword detection
  const queryLower = userQuery.toLowerCase();
  const filenameLower = filename.toLowerCase();
  const combinedText = (queryLower + ' ' + filenameLower).toLowerCase();

  // Pattern matching for title generation

  // Aged care
  if (combinedText.includes('aged care') || combinedText.includes('aged_care')) {
    return 'Aged Care - Indefinite Absence Exemption';
  }

  // Airbnb scenarios
  if (combinedText.includes('airbnb')) {
    if (combinedText.includes('spare room') || combinedText.includes('room')) {
      return 'Partial Use - Airbnb Spare Room';
    }
    return 'Airbnb - Investment Property';
  }

  // Home office / business use
  if (combinedText.includes('home office') || combinedText.includes('business use')) {
    return 'Partial Use - Home Office Business';
  }

  // Granny flat
  if (combinedText.includes('granny flat')) {
    return 'Partial Use - Granny Flat Arrangement';
  }

  // Six-year rule scenarios
  if (combinedText.includes('six year') || combinedText.includes('6 year') || rentalYears > 0) {
    if (rentalYears > 6 || combinedText.includes('exceeded')) {
      return 'Six-Year Absence Rule Exceeded';
    } else if (rentalYears > 0) {
      return 'Six-Year Absence Rule - Within Limit';
    } else if (combinedText.includes('multiple absences')) {
      return 'Six-Year Rule - Multiple Absence Periods';
    } else if (combinedText.includes('reset')) {
      return 'Six-Year Rule - Reset After Return';
    }
    return 'Six-Year Absence Rule';
  }

  // Subdivision scenarios
  if (hasSubdivision || combinedText.includes('subdivis') || combinedText.includes('subdivision')) {
    if (combinedText.includes('build')) {
      return 'Subdivision - Build and Sell New Lot';
    } else if (combinedText.includes('vacant land') || combinedText.includes('vacant_land')) {
      return 'Subdivision - Vacant Land Sold Separately';
    } else if (combinedText.includes('multiple lots')) {
      return 'Subdivision - Multiple Lots Sold';
    } else if (combinedText.includes('pre cgt') || combinedText.includes('pre_cgt')) {
      return 'Subdivision - Pre-CGT Property';
    } else if (combinedText.includes('strata')) {
      return 'Subdivision - Strata Title';
    } else if (combinedText.includes('retain dwelling')) {
      return 'Subdivision - Retain Dwelling, Sell Vacant';
    } else if (combinedText.includes('farmland')) {
      return 'Subdivision - Farmland Subdivided and Sold';
    }
    return 'Property Subdivision';
  }

  // Inheritance / deceased estate scenarios
  if (hasOwnershipChange && (combinedText.includes('inherit') || combinedText.includes('deceased') || combinedText.includes('estate') || combinedText.includes('death'))) {
    if (combinedText.includes('2 year') || combinedText.includes('two year') || combinedText.includes('2year')) {
      return 'Deceased Estate - Two-Year CGT Exemption';
    } else if (combinedText.includes('beneficiary moves in')) {
      return 'Deceased Estate - Beneficiary Moves In';
    } else if (combinedText.includes('executor')) {
      return 'Deceased Estate - Executor Sale';
    } else if (combinedText.includes('pre cgt') || combinedText.includes('pre_cgt')) {
      return 'Inheritance - Pre-CGT Property';
    } else if (combinedText.includes('multiple beneficiaries')) {
      return 'Deceased Estate - Multiple Beneficiaries';
    } else if (combinedText.includes('covid')) {
      return 'Deceased Estate - COVID Extension';
    } else if (combinedText.includes('built dwelling') || combinedText.includes('build dwelling')) {
      return 'Inherited Land - Built Dwelling Then Sold';
    } else if (combinedText.includes('vacant')) {
      return 'Inherited Land - Vacant Pre-CGT';
    } else if (combinedText.includes('joint owner')) {
      return 'Deceased Estate - Death of Joint Owner';
    }
    return 'Inherited Property';
  }

  // Relationship breakdown scenarios
  if (combinedText.includes('divorce') || combinedText.includes('separation') || combinedText.includes('relationship breakdown') || combinedText.includes('defacto')) {
    if (combinedText.includes('rollover')) {
      return 'Relationship Breakdown - CGT Rollover';
    } else if (combinedText.includes('joint sale')) {
      return 'Relationship Breakdown - Joint Sale During Separation';
    } else if (combinedText.includes('defacto')) {
      return 'De Facto Breakdown - CGT Rollover';
    } else if (combinedText.includes('complex') || combinedText.includes('rented after')) {
      return 'Divorce - Property Rented After Transfer';
    } else if (combinedText.includes('investment')) {
      return 'Divorce - Investment Property Transfer';
    }
    return 'Relationship Breakdown - Property Transfer';
  }

  // Trust scenarios
  if (combinedText.includes('trust')) {
    if (combinedText.includes('bare trust')) {
      return 'Bare Trust - No CGT Event';
    } else if (combinedText.includes('family trust') && combinedText.includes('transfer')) {
      return 'Transfer to Family Trust';
    } else if (combinedText.includes('distribution')) {
      return 'Trust Distribution to Beneficiary';
    }
    return 'Trust Property Transfer';
  }

  // Construction / building rule scenarios
  if (hasBuildingEvents || combinedText.includes('construction') || combinedText.includes('building rule')) {
    if (combinedText.includes('2 year') || combinedText.includes('two year') || combinedText.includes('2year')) {
      if (combinedText.includes('eligible')) {
        return 'Two-Year Building Rule - Eligible';
      } else if (combinedText.includes('exceeded')) {
        return 'Two-Year Building Rule - Exceeded';
      } else if (combinedText.includes('renovation')) {
        return 'Two-Year Building Rule - Renovation';
      }
      return 'Two-Year Building Rule';
    } else if (combinedText.includes('4 year') || combinedText.includes('four year') || combinedText.includes('4year')) {
      return 'Four-Year Construction Rule';
    }
    return 'Construction and Main Residence';
  }

  // Compulsory acquisition
  if (combinedText.includes('compulsory acquisition')) {
    return 'Compulsory Acquisition - CGT Rollover';
  }

  // Mortgagee sale
  if (combinedText.includes('mortgagee') || combinedText.includes('foreclosure')) {
    return 'Mortgagee Sale - Foreclosure';
  }

  // Foreign resident
  if (isForeignResident || combinedText.includes('foreign resident')) {
    if (combinedText.includes('life event')) {
      return 'Foreign Resident - Life Event Impact';
    } else if (combinedText.includes('pre 2012') || combinedText.includes('pre-2012') || combinedText.includes('may 2012')) {
      return 'Foreign Resident - Pre-May 2012 Grandfathering';
    } else if (combinedText.includes('overseas posting')) {
      return 'First Use - Overseas Posting';
    }
    return 'Foreign Resident Period Impact';
  }

  // Pre-CGT scenarios
  if (combinedText.includes('pre cgt') || combinedText.includes('pre_cgt') || combinedText.includes('pre-cgt')) {
    if (combinedText.includes('improvements')) {
      return 'Pre-CGT Property with Major Improvements';
    }
    return 'Pre-CGT Property';
  }

  // Joint ownership scenarios
  if (combinedText.includes('joint') && combinedText.includes('owner')) {
    if (combinedText.includes('tenants in common')) {
      return 'Joint Ownership - Tenants in Common';
    } else if (combinedText.includes('joint tenants')) {
      return 'Joint Ownership - Joint Tenants';
    } else if (combinedText.includes('choice')) {
      return 'Joint Ownership - Main Residence Choice';
    }
    return 'Joint Ownership';
  }

  // Rental first scenarios
  if (combinedText.includes('rental first') || combinedText.includes('investment then main')) {
    return 'Investment Property Converted to Main Residence';
  }

  // Moving between residences
  if (combinedText.includes('moving between') || combinedText.includes('overlap')) {
    if (combinedText.includes('6 month') || combinedText.includes('six month')) {
      return 'Moving Between Residences - Six-Month Overlap';
    }
    return 'Moving Between Main Residences';
  }

  // Multiple properties / portfolio
  if (properties.length > 1) {
    if (properties.length >= 4) {
      return `${properties.length}-Property Portfolio - Strategic CGT Planning`;
    } else if (properties.length === 3) {
      return 'Three-Property Portfolio - MRE Optimization';
    } else {
      return 'Two Properties - Strategic Main Residence Choice';
    }
  }

  // Large rural property
  if (combinedText.includes('>2 hectares') || combinedText.includes('2ha') || combinedText.includes('rural')) {
    return 'Large Rural Property - Land Exceeding 2 Hectares';
  }

  // Time apportionment
  if (combinedText.includes('time apportionment')) {
    if (combinedText.includes('multiple periods')) {
      return 'Time Apportionment - Multiple Use Periods';
    }
    return 'Time Apportionment with Absence Rule';
  }

  // Small business
  if (combinedText.includes('small business') || combinedText.includes('15 year')) {
    return 'Small Business 15-Year Exemption';
  }

  // Couple scenarios
  if (combinedText.includes('couple') || combinedText.includes('spouses')) {
    return 'Couple with Separate Main Residences';
  }

  // Default: Clean up filename
  return filenameToTitle(filename);
}

// Convert filename to title (fallback)
function filenameToTitle(filename) {
  let title = filename.replace('.json', '');
  title = title.replace(/^new_scenario_\d+_/, '');
  title = title.replace(/^scenario\d+_/, '');

  title = title
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return title;
}

function processScenario(filePath, filename) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const scenario = JSON.parse(content);

    stats.totalScenarios++;

    let changed = false;
    const changes = [];

    // Ensure scenario_info exists
    if (!scenario.scenario_info) {
      scenario.scenario_info = {};
    }

    // Check if we should update title
    const currentTitle = scenario.scenario_info.name || scenario.title;
    const isGenericTitle = !currentTitle ||
                          currentTitle === filenameToTitle(filename) ||
                          currentTitle.length < 15; // Very short titles likely auto-generated

    if (!currentTitle || isGenericTitle) {
      const newTitle = generateContextualTitle(scenario, filename);
      scenario.scenario_info.name = newTitle;
      changes.push(`Title: "${currentTitle || 'none'}" → "${newTitle}"`);
      stats.titlesImproved++;
      changed = true;
    }

    // Add description from user_query if missing
    if (!scenario.scenario_info.description && scenario.user_query) {
      scenario.scenario_info.description = scenario.user_query;
      changes.push(`Description: Added from user_query`);
      stats.descriptionsAdded++;
      changed = true;
    }

    if (changed) {
      // Write back to file
      fs.writeFileSync(filePath, JSON.stringify(scenario, null, 2), 'utf-8');

      stats.scenariosUpdated++;
      updates.push({
        filename,
        oldTitle: currentTitle || 'none',
        newTitle: scenario.scenario_info.name,
        descriptionAdded: !!scenario.user_query,
        changes
      });

      return { updated: true, filename, changes };
    } else {
      stats.scenariosSkipped++;
      return { updated: false, filename, reason: 'Already has good title and description' };
    }

  } catch (error) {
    console.error(`❌ Error processing ${filename}:`, error.message);
    return { updated: false, filename, error: error.message };
  }
}

function scanDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    if (file.endsWith('.json')) {
      const filePath = path.join(dirPath, file);
      processScenario(filePath, file);
    }
  });
}

function generateReport() {
  const reportLines = [];

  reportLines.push('='.repeat(80));
  reportLines.push('SCENARIO METADATA IMPROVEMENT REPORT');
  reportLines.push(`Generated: ${new Date().toISOString()}`);
  reportLines.push('='.repeat(80));
  reportLines.push('');

  reportLines.push('SUMMARY');
  reportLines.push('-'.repeat(80));
  reportLines.push(`Total Scenarios Scanned:     ${stats.totalScenarios}`);
  reportLines.push(`Scenarios Updated:           ${stats.scenariosUpdated}`);
  reportLines.push(`Scenarios Skipped:           ${stats.scenariosSkipped}`);
  reportLines.push(`Titles Improved:             ${stats.titlesImproved}`);
  reportLines.push(`Descriptions Added:          ${stats.descriptionsAdded}`);
  reportLines.push('');

  if (updates.length > 0) {
    reportLines.push('DETAILED CHANGES');
    reportLines.push('-'.repeat(80));
    reportLines.push('');

    updates.forEach((update, index) => {
      reportLines.push(`${index + 1}. ${update.filename}`);
      update.changes.forEach(change => {
        reportLines.push(`   ${change}`);
      });
      reportLines.push('');
    });
  }

  return reportLines.join('\n');
}

// Main execution
console.log('✨ Improving scenario metadata...\n');

const publicDir = path.join(__dirname, '..', 'public');

// Scan scenariotestjsons folder
const dir1 = path.join(publicDir, 'scenariotestjsons');
console.log(`Scanning: ${dir1}`);
if (fs.existsSync(dir1)) {
  scanDirectory(dir1);
}

// Scan tests folder
const dir2 = path.join(publicDir, 'tests');
console.log(`Scanning: ${dir2}`);
if (fs.existsSync(dir2)) {
  scanDirectory(dir2);
}

// Generate report
const report = generateReport();
const reportPath = path.join(__dirname, '..', 'scenario-metadata-improvement-report.txt');
fs.writeFileSync(reportPath, report, 'utf-8');

console.log('\n✅ Metadata improvement complete!');
console.log(`📄 Report saved to: ${reportPath}`);
console.log(`\nScenarios scanned: ${stats.totalScenarios}`);
console.log(`Scenarios updated: ${stats.scenariosUpdated}`);
console.log(`Titles improved: ${stats.titlesImproved}`);
console.log(`Descriptions added: ${stats.descriptionsAdded}`);

// JSON report
const jsonReport = {
  generatedAt: new Date().toISOString(),
  stats,
  updates
};

const jsonReportPath = path.join(__dirname, '..', 'scenario-metadata-improvement-report.json');
fs.writeFileSync(jsonReportPath, JSON.stringify(jsonReport, null, 2), 'utf-8');
console.log(`📄 JSON report saved to: ${jsonReportPath}\n`);
