import { type NextRequest } from 'next/server';

function normalizeHostname(hostname: string) {
  return hostname === '0.0.0.0' ? 'localhost' : hostname;
}

export function getRequestOrigin(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const forwardedHost = request.headers.get('x-forwarded-host');
  const host = forwardedHost ?? request.headers.get('host');

  if (!host) {
    requestUrl.hostname = normalizeHostname(requestUrl.hostname);
    return requestUrl.origin;
  }

  const [rawHostname, ...portParts] = host.split(':');
  const normalizedHost = normalizeHostname(rawHostname || requestUrl.hostname);
  const port = portParts.join(':');
  const protocol = forwardedProto ?? requestUrl.protocol.replace(':', '');

  return `${protocol}://${normalizedHost}${port ? `:${port}` : ''}`;
}
