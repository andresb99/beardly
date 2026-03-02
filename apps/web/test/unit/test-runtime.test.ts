import { isMockRuntime } from '@/lib/test-runtime';

describe('isMockRuntime', () => {
  it('reads the mock runtime flag from the environment', () => {
    vi.stubEnv('NAVAJA_TEST_MODE', 'mock');
    expect(isMockRuntime()).toBe(true);

    vi.stubEnv('NAVAJA_TEST_MODE', 'live');
    expect(isMockRuntime()).toBe(false);

    vi.unstubAllEnvs();
  });
});
