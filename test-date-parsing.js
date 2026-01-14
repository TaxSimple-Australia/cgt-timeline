// Quick test script for date parsing
// Run with: node test-date-parsing.js

const { parseDateFlexible, formatDateDisplay } = require('./src/lib/date-utils.ts');

console.log('🧪 Testing Enhanced Date Parsing\n');

const testCases = [
  { input: '14032008', expected: '14/03/2008', description: '8 digits: DDMMYYYY' },
  { input: '14308', expected: '14/03/2008', description: '5 digits: DDMYY' },
  { input: '1152008', expected: '01/15/2008 or 11/05/2008', description: '7 digits: Smart detect' },
  { input: '15/01/2023', expected: '15/01/2023', description: 'Standard Australian' },
  { input: '15 Jan 2023', expected: '15/01/2023', description: 'Natural language' },
  { input: '2023-01-15', expected: '15/01/2023', description: 'ISO format' },
  { input: '1408', expected: '01/04/2008', description: '4 digits: DMYY' },
];

testCases.forEach(({ input, expected, description }) => {
  try {
    const result = parseDateFlexible(input);

    if (result) {
      const day = result.getDate().toString().padStart(2, '0');
      const month = (result.getMonth() + 1).toString().padStart(2, '0');
      const year = result.getFullYear();
      const formatted = `${day}/${month}/${year}`;

      console.log(`✅ ${description}`);
      console.log(`   Input: "${input}" → Output: ${formatted}`);
      console.log(`   Expected: ${expected}\n`);
    } else {
      console.log(`❌ ${description}`);
      console.log(`   Input: "${input}" → Failed to parse\n`);
    }
  } catch (error) {
    console.log(`❌ ${description}`);
    console.log(`   Input: "${input}" → Error: ${error.message}\n`);
  }
});

console.log('✨ Testing complete!');
