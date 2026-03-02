import { resolveSafeNextPath } from '@/lib/navigation';

describe('resolveSafeNextPath', () => {
  it('keeps allowed internal paths', () => {
    expect(resolveSafeNextPath('/admin?shop=navaja#top')).toBe('/admin?shop=navaja#top');
    expect(resolveSafeNextPath('/')).toBe('/');
  });

  it('rejects disallowed or unsafe paths', () => {
    expect(resolveSafeNextPath('/shops', '/cuenta')).toBe('/cuenta');
    expect(resolveSafeNextPath('//evil.test', '/cuenta')).toBe('/cuenta');
    expect(resolveSafeNextPath('https://evil.test', '/cuenta')).toBe('/cuenta');
    expect(resolveSafeNextPath('/%E0%A4%A', '/cuenta')).toBe('/cuenta');
    expect(resolveSafeNextPath('/admin#top?ignored-order')).toBe('/admin#top?ignored-order');
  });
});
