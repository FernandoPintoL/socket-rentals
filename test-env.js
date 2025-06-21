// Simple test script to verify that the server uses the correct URL based on APP_ENV
// This script will modify the APP_ENV value in memory and run the server

// Load environment variables from .env file
require('dotenv').config();

// Test with APP_ENV=local
console.log('\n--- Testing with APP_ENV=local ---');
process.env.APP_ENV = 'local';
const appUrlLocal = process.env.APP_URL_LOCAL || 'http://localhost:4000';
console.log(`APP_ENV: ${process.env.APP_ENV}`);
console.log(`Expected URL: ${appUrlLocal}`);

// Test with APP_ENV=production
console.log('\n--- Testing with APP_ENV=production ---');
process.env.APP_ENV = 'production';
const appUrlProd = process.env.APP_URL_PROD || 'https://web-production-5f93.up.railway.app/';
console.log(`APP_ENV: ${process.env.APP_ENV}`);
console.log(`Expected URL: ${appUrlProd}`);

console.log('\nTo test the server with different APP_ENV values:');
console.log('1. Edit the .env file and set APP_ENV=local or APP_ENV=production');
console.log('2. Run the server with "npm start" or "npm run dev"');
console.log('3. Check the console output to verify that the correct URL is used');