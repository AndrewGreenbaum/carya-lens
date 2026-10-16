import assert from 'node:assert/strict';
// Smoke tests for utility functions

import { formatCurrency, formatDate, formatNumber } from '../src/utils/formatters';
import { isValidUrl, isValidEmail, isValidApiKey } from '../src/utils/validators';


// Test formatCurrency
assert(formatCurrency(2500000) === '$2.5M', 'formatCurrency 2.5M failed');
assert(formatCurrency(50000) === '$50.0K', 'formatCurrency 50K failed');
assert(formatCurrency(1000) === '$1.0K', 'formatCurrency 1K failed');
assert(formatCurrency(500) === '$500', 'formatCurrency 500 failed');
assert(formatCurrency(1200000000) === '$1.2B', 'formatCurrency 1.2B failed');

// Test formatNumber
assert(formatNumber(1234) === '1.2K', 'formatNumber 1.2K failed');
assert(formatNumber(1234567) === '1.2M', 'formatNumber 1.2M failed');
assert(formatNumber(100) === '100', 'formatNumber 100 failed');

// Test formatDate
const testDate1 = formatDate('2024-01-15');
assert(testDate1.includes('Jan') && testDate1.includes('2024'), 'formatDate Jan 2024 failed');
const testDate2 = formatDate('2023-12-31');
assert(testDate2.includes('Dec') && testDate2.includes('2023'), 'formatDate Dec 2023 failed');

// Test isValidUrl
assert(isValidUrl('https://api.carya.com') === true, 'isValidUrl https failed');
assert(isValidUrl('http://example.com') === true, 'isValidUrl http failed');
assert(isValidUrl('https://www.example.com') === true, 'isValidUrl https www failed');
assert(isValidUrl('invalid') === false, 'isValidUrl invalid failed');
assert(isValidUrl('') === false, 'isValidUrl empty failed');

// Test isValidEmail
assert(isValidEmail('test@example.com') === true, 'isValidEmail valid failed');
assert(isValidEmail('user.name+tag@example.co.uk') === true, 'isValidEmail complex valid failed');
assert(isValidEmail('invalid.email') === false, 'isValidEmail no @ failed');
assert(isValidEmail('@example.com') === false, 'isValidEmail no user failed');
assert(isValidEmail('') === false, 'isValidEmail empty failed');

// Test isValidApiKey
assert(isValidApiKey('abcdefghijklmnopqrstuvwxyz123456') === true, 'isValidApiKey 32 chars failed');
assert(isValidApiKey('short') === false, 'isValidApiKey short failed');
assert(isValidApiKey('') === false, 'isValidApiKey empty failed');
