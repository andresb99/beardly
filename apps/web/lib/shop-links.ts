export function normalizeShopSlug(slug: string) {
  return slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function buildShopHref(slug: string, section?: 'book' | 'jobs' | 'courses' | 'modelos') {
  const basePath = `/shops/${normalizeShopSlug(slug)}`;
  if (!section) {
    return basePath;
  }
  return `${basePath}/${section}`;
}
