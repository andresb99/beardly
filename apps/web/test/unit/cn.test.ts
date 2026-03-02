import { cn } from '@/lib/cn';

describe('cn', () => {
  it('merges clsx values and resolves tailwind conflicts', () => {
    expect(cn('px-2', undefined, 'px-4', 'text-sm')).toBe('px-4 text-sm');
  });
});
