#!/usr/bin/env tsx

import { randomBytes } from 'crypto';

/**
 * Generate a new API key for Paver
 * Format: pvr_[32 character hex string]
 */
function generateApiKey(): string {
  const randomHex = randomBytes(16).toString('hex');
  return `pvr_${randomHex}`;
}

// Generate and display API key
const apiKey = generateApiKey();
console.log('🔑 New Paver API Key generated:');
console.log('');
console.log(`PAVER_API_KEY=${apiKey}`);
console.log('');
console.log('Add this to your .env file to enable API authentication.');
console.log('Keep this key secure and do not share it publicly!');
console.log('');

export { generateApiKey };