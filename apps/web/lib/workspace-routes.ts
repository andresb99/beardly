type QueryParamPrimitive = string | number | boolean;
type QueryParamValue =
  | QueryParamPrimitive
  | null
  | undefined
  | Array<QueryParamPrimitive | null | undefined>;

function appendQueryValue(searchParams: URLSearchParams, key: string, value: QueryParamValue) {
  if (Array.isArray(value)) {
    for (const entry of value) {
      appendQueryValue(searchParams, key, entry);
    }
    return;
  }

  if (value === null || value === undefined) {
    return;
  }

  const normalized = String(value).trim();
  if (!normalized) {
    return;
  }

  searchParams.append(key, normalized);
}

export function buildAppHref(
  pathname: string,
  query?: Record<string, QueryParamValue>,
) {
  const url = new URL(pathname, 'http://localhost');

  for (const [key, value] of Object.entries(query || {})) {
    appendQueryValue(url.searchParams, key, value);
  }

  const search = url.searchParams.toString();
  return search ? `${url.pathname}?${search}` : url.pathname;
}

export function buildWorkspaceHref(
  pathname: string,
  shopSlug?: string | null,
  query?: Record<string, QueryParamValue>,
) {
  return buildAppHref(pathname, {
    shop: shopSlug || undefined,
    ...(query || {}),
  });
}

export function buildAdminHref(
  pathname: string,
  shopSlug?: string | null,
  query?: Record<string, QueryParamValue>,
) {
  return buildWorkspaceHref(pathname, shopSlug, query);
}

export function buildStaffHref(
  pathname: string,
  shopSlug?: string | null,
  query?: Record<string, QueryParamValue>,
) {
  return buildWorkspaceHref(pathname, shopSlug, query);
}
