import {
  isLocalDevelopmentHost,
  normalizeHostPattern,
  type PlatformHostConfig,
} from '@/lib/custom-domains';

export function getPlatformAppUrl() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  return appUrl?.trim() || null;
}

function getHostFromAppUrl() {
  try {
    const appUrl = getPlatformAppUrl();
    return appUrl ? new URL(appUrl).host : null;
  } catch {
    return null;
  }
}

/** Apex for subdomain suffix checks (e.g. `tenant.${rootDomain}`); `www.` is not a valid parent for labels. */
function normalizeExplicitRootDomain(value: string | null | undefined) {
  const normalized = normalizeHostPattern(value || '');
  if (!normalized) {
    return null;
  }

  return normalized.replace(/^www\./, '') || normalized;
}

export function getPlatformHostConfig(requestHost?: string | null): PlatformHostConfig {
  // Priority: 1. Host from arguments (server), 2. Host from window (browser), 3. Host from ENV
  const currentHost = 
    requestHost || 
    (typeof window !== 'undefined' ? window.location.host : null) || 
    getHostFromAppUrl();

  const appHost = normalizeHostPattern(currentHost);
  const fallbackRootDomain = appHost && isLocalDevelopmentHost(appHost) ? 'localhost' : appHost;
  
  const rootDomain =
    normalizeExplicitRootDomain(process.env.NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN) ||
    normalizeHostPattern(fallbackRootDomain ? fallbackRootDomain.replace(/^www\./, '') : '');

  return {
    appHost,
    rootDomain,
  };
}
