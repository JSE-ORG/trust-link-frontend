const { loadEnvConfig } = require('@next/env');

// Load the same .env* files used by Next.js before validating configuration.
loadEnvConfig(process.cwd());

// This is the checklist of required setup keys the website MUST have to run
const REQUIRED_VARIABLES = [
  'NEXT_PUBLIC_API_URL',
  'NEXT_PUBLIC_CONTRACT_ID',
  'NEXT_PUBLIC_STELLAR_NETWORK',
  'NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE'
];

function checkEnvironmentVariables() {
  const missingVariables = [];

  // Loop through our checklist and see if any are missing
  for (const name of REQUIRED_VARIABLES) {
    if (!process.env[name]) {
      missingVariables.push(name);
    }
  }

  // If we found missing variables, crash clearly with an error message!
  if (missingVariables.length > 0) {
    console.error('❌ CRITICAL ERROR: You are missing required setup variables!');
    console.error(`Please open your .env file and add these missing keys:\n- ${missingVariables.join('\n- ')}`);

    // This line intentionally stops the app right here
    throw new Error(`Missing environment configuration: ${missingVariables.join(', ')}`);
  }
}

// Run the check immediately
checkEnvironmentVariables();
