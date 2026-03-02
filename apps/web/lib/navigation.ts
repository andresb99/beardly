const allowedNextRoots = ['/admin', '/staff', '/cuenta', '/book', '/courses', '/modelos', '/jobs', '/login'] as const;

function isAllowedPath(pathname: string) {
  if (pathname === '/') {
    return true;
  }

  return allowedNextRoots.some((root) => pathname === root || pathname.startsWith(`${root}/`));
}

export function resolveSafeNextPath(input: string | null | undefined, fallback = '/cuenta') {
  if (!input || !input.startsWith('/') || input.startsWith('//')) {
    return fallback;
  }

  const queryIndex = input.indexOf('?');
  const hashIndex = input.indexOf('#');
  let pathnameEnd = input.length;

  if (queryIndex >= 0) {
    pathnameEnd = queryIndex;
  }

  if (hashIndex >= 0 && hashIndex < pathnameEnd) {
    pathnameEnd = hashIndex;
  }

  const pathname = input.slice(0, pathnameEnd);

  if (!isAllowedPath(pathname)) {
    return fallback;
  }

  return input;
}
