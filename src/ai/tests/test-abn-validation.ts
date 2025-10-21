/**
 * @fileOverview A Multi-skilled Cybernetic Persona (MCP) for testing ABN validation.
 * This script runs automated tests against the `validateAbn` flow to ensure it
 * correctly handles live data from the Australian Business Register.
 *
 * To run this test, execute `genkit:dev` or `genkit:watch`
 */
import { validateAbn } from '@/ai/flows/validate-abn';

// --- Test Cases ---
const testCases = [
  {
    description: '✅ Valid ABN and Matching Name (Google Australia)',
    input: {
      abn: '54 125 526 805',
      businessName: 'GOOGLE AUSTRALIA PTY LTD',
    },
    shouldBeValid: true,
  },
  {
    description: '❌ Valid ABN but Mismatched Name',
    input: {
      abn: '54 125 526 805',
      businessName: 'Totally Fake Company Inc.',
    },
    shouldBeValid: false,
  },
  {
    description: '❌ Invalid ABN (Incorrect Structure)',
    input: {
      abn: '12 345 678 900',
      businessName: 'Some Company',
    },
    shouldBeValid: false,
  },
];

async function runAbnValidationTests() {
  console.log('--- Running ABN Validation MCP Test Suite ---');
  console.log('--- Using Live ABR Data ---');

  for (const test of testCases) {
    console.log(`\n▶️  Testing: ${test.description}`);
    try {
      const result = await validateAbn(test.input);
      const isPass = result.isValid === test.shouldBeValid;
      console.log(
        `   ${isPass ? 'PASS' : 'FAIL'}: Expected isValid to be ${
          test.shouldBeValid
        }, Got: ${result.isValid}`
      );
      console.log(`   Message: "${result.message}"`);
    } catch (error) {
      console.error(`   ERROR: Test case failed unexpectedly.`, error);
    }
  }

  console.log('\n--- ABN Validation Test Suite Complete ---');
}

// Automatically run the tests when Genkit starts in dev mode.
runAbnValidationTests();
