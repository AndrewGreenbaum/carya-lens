// Smoke test for logger

import { logger } from '../src/utils/logger';

console.log('🧪 Running logger smoke tests...\n');

console.log('Testing logger methods:');

logger.debug('Debug message', { test: true, value: 123 });
console.log('  ✅ debug() method works');

logger.info('Info message', { test: true, status: 'success' });
console.log('  ✅ info() method works');

logger.warn('Warn message', { test: true, warning: 'example' });
console.log('  ✅ warn() method works');

logger.error('Error message', { test: true, error: 'example error' });
console.log('  ✅ error() method works');

console.log('\n✅ Logger test completed successfully!');
