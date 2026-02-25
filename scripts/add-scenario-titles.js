#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const stats = {
  totalScenarios: 0,
  scenariosUpdated: 0,
  scenariosSkipped: 0
};

const updates = [];

// Convert filename to title
function filenameToTitle(filename) {
  // Remove .json extension
  let title = filename.replace('.json', '');

  // Remove common prefixes
  title = title.replace(/^new_scenario_\d+_/, '');
  title = title.replace(/^scenario\d+_/, '');

  // Convert snake_case to Title Case
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

    // Check if title or scenario_info.name already exists
    const hasTitle = scenario.title || scenario.scenario_info?.name;

    if (hasTitle) {
      stats.scenariosSkipped++;
      return { updated: false, filename, reason: 'Already has title' };
    }

    // Generate title from filename
    const generatedTitle = filenameToTitle(filename);

    // Add scenario_info section if it doesn't exist
    if (!scenario.scenario_info) {
      scenario.scenario_info = {};
    }

    // Add title to scenario_info.name
    scenario.scenario_info.name = generatedTitle;

    // Write back to file
    fs.writeFileSync(filePath, JSON.stringify(scenario, null, 2), 'utf-8');

    stats.scenariosUpdated++;
    updates.push({
      filename,
      generatedTitle
    });

    return { updated: true, filename, title: generatedTitle };

  } catch (error) {
    console.error(`❌ Error processing ${filename}:`, error.message);
    return { updated: false, filename, error: error.message };
  }
}

function scanDirectory(dirPath, relativePath) {
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
  reportLines.push('SCENARIO TITLES GENERATION REPORT');
  reportLines.push(`Generated: ${new Date().toISOString()}`);
  reportLines.push('='.repeat(80));
  reportLines.push('');

  reportLines.push('SUMMARY');
  reportLines.push('-'.repeat(80));
  reportLines.push(`Total Scenarios Scanned:     ${stats.totalScenarios}`);
  reportLines.push(`Scenarios Updated:           ${stats.scenariosUpdated}`);
  reportLines.push(`Scenarios Skipped:           ${stats.scenariosSkipped} (already had titles)`);
  reportLines.push('');

  if (updates.length > 0) {
    reportLines.push('TITLES ADDED');
    reportLines.push('-'.repeat(80));
    reportLines.push('');

    updates.forEach((update, index) => {
      reportLines.push(`${index + 1}. ${update.filename}`);
      reportLines.push(`   Title: "${update.generatedTitle}"`);
      reportLines.push('');
    });
  }

  return reportLines.join('\n');
}

// Main execution
console.log('📝 Adding missing scenario titles...\n');

const publicDir = path.join(__dirname, '..', 'public');

// Scan scenariotestjsons folder
const dir1 = path.join(publicDir, 'scenariotestjsons');
console.log(`Scanning: ${dir1}`);
if (fs.existsSync(dir1)) {
  scanDirectory(dir1, 'scenariotestjsons');
}

// Scan tests folder
const dir2 = path.join(publicDir, 'tests');
console.log(`Scanning: ${dir2}`);
if (fs.existsSync(dir2)) {
  scanDirectory(dir2, 'tests');
}

// Generate report
const report = generateReport();
const reportPath = path.join(__dirname, '..', 'scenario-titles-report.txt');
fs.writeFileSync(reportPath, report, 'utf-8');

console.log('\n✅ Title generation complete!');
console.log(`📄 Report saved to: ${reportPath}`);
console.log(`\nScenarios scanned: ${stats.totalScenarios}`);
console.log(`Scenarios updated: ${stats.scenariosUpdated}`);
console.log(`Scenarios skipped: ${stats.scenariosSkipped} (already had titles)`);

// JSON report
const jsonReport = {
  generatedAt: new Date().toISOString(),
  stats,
  updates
};

const jsonReportPath = path.join(__dirname, '..', 'scenario-titles-report.json');
fs.writeFileSync(jsonReportPath, JSON.stringify(jsonReport, null, 2), 'utf-8');
console.log(`📄 JSON report saved to: ${jsonReportPath}\n`);
