import { cn } from '@/lib/cn';

export function mergeSlotClasses<T extends Record<string, unknown>>(
  base: T,
  overrides?: Record<string, unknown>,
): T {
  const next = { ...base } as Record<string, unknown>;

  if (!overrides) {
    return next as T;
  }

  for (const [key, value] of Object.entries(overrides)) {
    if (!value) {
      continue;
    }

    next[key] = cn(next[key] as string | undefined, value as string | undefined);
  }

  return next as T;
}
