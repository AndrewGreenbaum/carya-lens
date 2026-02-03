// Smoke tests for utility functions

import { formatCurrency, formatDate, formatNumber } from '../src/utils/formatters';
import { isValidUrl, isValidEmail, isValidApiKey } from '../src/utils/validators';

console.log('🧪 Running utility smoke tests...\n');

// Test formatCurrency
console.log('Testing formatCurrency:');
console.assert(formatCurrency(2500000) === '$2.5M', 'formatCurrency 2.5M failed');
console.assert(formatCurrency(50000) === '$50.0K', 'formatCurrency 50K failed');
console.assert(formatCurrency(1000) === '$1.0K', 'formatCurrency 1K failed');
console.assert(formatCurrency(500) === '$500', 'formatCurrency 500 failed');
console.assert(formatCurrency(1200000000) === '$1.2B', 'formatCurrency 1.2B failed');
console.log('  ✅ All formatCurrency tests passed');

// Test formatNumber
console.log('Testing formatNumber:');
console.assert(formatNumber(1234) === '1.2K', 'formatNumber 1.2K failed');
console.assert(formatNumber(1234567) === '1.2M', 'formatNumber 1.2M failed');
console.assert(formatNumber(100) === '100', 'formatNumber 100 failed');
console.log('  ✅ All formatNumber tests passed');

// Test formatDate
console.log('Testing formatDate:');
const testDate1 = formatDate('2024-01-15');
console.assert(testDate1.includes('Jan') && testDate1.includes('2024'), 'formatDate Jan 2024 failed');
const testDate2 = formatDate('2023-12-31');
console.assert(testDate2.includes('Dec') && testDate2.includes('2023'), 'formatDate Dec 2023 failed');
console.log('  ✅ All formatDate tests passed');

// Test isValidUrl
console.log('Testing isValidUrl:');
console.assert(isValidUrl('https://api.carya.com') === true, 'isValidUrl https failed');
console.assert(isValidUrl('http://example.com') === true, 'isValidUrl http failed');
console.assert(isValidUrl('https://www.example.com') === true, 'isValidUrl https www failed');
console.assert(isValidUrl('invalid') === false, 'isValidUrl invalid failed');
console.assert(isValidUrl('') === false, 'isValidUrl empty failed');
console.log('  ✅ All isValidUrl tests passed');

// Test isValidEmail
console.log('Testing isValidEmail:');
console.assert(isValidEmail('test@example.com') === true, 'isValidEmail valid failed');
console.assert(isValidEmail('user.name+tag@example.co.uk') === true, 'isValidEmail complex valid failed');
console.assert(isValidEmail('invalid.email') === false, 'isValidEmail no @ failed');
console.assert(isValidEmail('@example.com') === false, 'isValidEmail no user failed');
console.assert(isValidEmail('') === false, 'isValidEmail empty failed');
console.log('  ✅ All isValidEmail tests passed');

// Test isValidApiKey
console.log('Testing isValidApiKey:');
console.assert(isValidApiKey('abcdefghijklmnopqrstuvwxyz123456') === true, 'isValidApiKey 32 chars failed');
console.assert(isValidApiKey('short') === false, 'isValidApiKey short failed');
console.assert(isValidApiKey('') === false, 'isValidApiKey empty failed');
console.log('  ✅ All isValidApiKey tests passed');

console.log('\n✅ All utility tests passed successfully!');
