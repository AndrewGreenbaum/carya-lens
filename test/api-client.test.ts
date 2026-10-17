import assert from 'node:assert/strict';
import test from 'node:test';

test('API client handles empty responses, retry limits and fetch cleanup', async (t) => {
  const originalChrome = globalThis.chrome;
  const originalFetch = globalThis.fetch;
  const originalSetTimeout = globalThis.setTimeout;
  const originalClearTimeout = globalThis.clearTimeout;
  globalThis.chrome = {
    storage: { sync: { get: async () => ({ environment: 'development' }) } },
  } as unknown as typeof chrome;
  try {
    const { APIClient } = await import('../src/services/api/client');
    const client = new APIClient();
    await client.loadSettings();
    await t.test('204 DELETE succeeds without JSON', async () => {
      globalThis.fetch = async () => new Response(null, { status: 204 });
      assert.deepEqual(await client.delete('/tracker/1', { retries: 0 }), { success: true });
    });
    await t.test('retries: 0 makes one server-error request', async () => {
      let calls = 0;
      globalThis.fetch = async () => {
        calls += 1;
        return new Response('{}', { status: 503 });
      };
      const response = await client.get('/deals', { retries: 0 });
      assert.equal(response.errorType, 'SERVER_ERROR');
      assert.equal(calls, 1);
    });
    await t.test('rejected fetch clears its timeout', async () => {
      const timers = new Set<ReturnType<typeof setTimeout>>();
      globalThis.setTimeout = ((...args: Parameters<typeof setTimeout>) => {
        const handle = originalSetTimeout(...args);
        timers.add(handle);
        return handle;
      }) as typeof setTimeout;
      globalThis.clearTimeout = ((handle: ReturnType<typeof setTimeout>) => {
        timers.delete(handle);
        originalClearTimeout(handle);
      }) as typeof clearTimeout;
      globalThis.fetch = async () => { throw new TypeError('offline'); };
      const response = await client.get('/deals', { retries: 0 });
      assert.equal(response.errorType, 'NETWORK_ERROR');
      assert.equal(timers.size, 0);
    });
  } finally {
    globalThis.chrome = originalChrome;
    globalThis.fetch = originalFetch;
    globalThis.setTimeout = originalSetTimeout;
    globalThis.clearTimeout = originalClearTimeout;
  }
});
