import { DEFAULT_CATEGORIES, FALLBACK_CATEGORY, type SortKey, type Website } from './types';
import { normalizeUrl } from './url';

export function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `w_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function matchesQuery(item: Website, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    item.name.toLowerCase().includes(q) ||
    item.domain.toLowerCase().includes(q) ||
    item.description.toLowerCase().includes(q) ||
    item.category.toLowerCase().includes(q)
  );
}

export function sortWebsites(items: Website[], sort: SortKey): Website[] {
  const list = [...items];
  switch (sort) {
    case 'alpha':
      return list.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    case 'favorites':
      return list.sort(
        (a, b) =>
          Number(b.favorite) - Number(a.favorite) ||
          b.createdAt - a.createdAt,
      );
    case 'category':
      return list.sort(
        (a, b) =>
          a.category.localeCompare(b.category, undefined, { sensitivity: 'base' }) ||
          a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
      );
    case 'recent':
    default:
      return list.sort((a, b) => b.createdAt - a.createdAt);
  }
}

export function filterWebsites(
  items: Website[],
  options: { query: string; category: string; favoritesOnly?: boolean },
): Website[] {
  const { query, category } = options;
  // "favorites" is a virtual category: it ignores the real category value.
  const favoritesOnly = options.favoritesOnly ?? category === 'favorites';
  return items.filter((item) => {
    if (favoritesOnly && !item.favorite) return false;
    if (!favoritesOnly && category !== 'all' && item.category !== category) return false;
    return matchesQuery(item, query);
  });
}

export function selectVisibleWebsites(
  items: Website[],
  options: { query: string; category: string; sort: SortKey },
): Website[] {
  const filtered = filterWebsites(items, {
    query: options.query,
    category: options.category,
    favoritesOnly: options.category === 'favorites',
  });
  return sortWebsites(filtered, options.sort);
}

export function uniqueCategories(categories: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of [...DEFAULT_CATEGORIES, ...categories]) {
    const name = raw.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out;
}

/** Coerces anything (localStorage, imported JSON) into a valid Website or null. */
export function sanitizeWebsite(input: unknown): Website | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Record<string, unknown>;

  const name = typeof raw.name === 'string' ? raw.name.trim().slice(0, 120) : '';
  const urlInput = typeof raw.url === 'string' ? raw.url : '';
  if (!name || !urlInput) return null;

  const normalized = normalizeUrl(urlInput);
  if (!normalized.ok) return null;

  const now = Date.now();
  const createdAt = typeof raw.createdAt === 'number' && Number.isFinite(raw.createdAt) ? raw.createdAt : now;
  const updatedAt = typeof raw.updatedAt === 'number' && Number.isFinite(raw.updatedAt) ? raw.updatedAt : now;

  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : createId(),
    name,
    url: normalized.url,
    domain: normalized.domain || normalized.url,
    category:
      typeof raw.category === 'string' && raw.category.trim() ? raw.category.trim().slice(0, 40) : FALLBACK_CATEGORY,
    description: typeof raw.description === 'string' ? raw.description.trim().slice(0, 240) : '',
    favorite: raw.favorite === true,
    createdAt,
    updatedAt,
  };
}

export function sanitizeCategories(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((c): c is string => typeof c === 'string' && c.trim().length > 0)
    .map((c) => c.trim().slice(0, 40));
}
