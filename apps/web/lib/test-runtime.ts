export function isMockRuntime() {
  return process.env.NAVAJA_TEST_MODE === 'mock';
}
