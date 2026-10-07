/**
 * URL handling. Everything that comes from a user is treated as untrusted:
 * we only ever keep `http:` / `https:` URLs, and we rebuild the URL from its
 * parsed parts instead of trusting the raw string.
 */

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);
const SCHEME_RE = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;
const HOSTNAME_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/i;
const IPV4_RE = /^(\d{1,3}\.){3}\d{1,3}$/;
const CONTROL_CHARS_RE = /[\u0000-\u001F\u007F-\u009F]/g;

export type NormalizeResult =
  | { ok: true; url: string; domain: string }
  | { ok: false; error: string };

export function normalizeUrl(raw: string): NormalizeResult {
  if (typeof raw !== 'string' || raw.trim().length === 0) {
    return { ok: false, error: 'Please enter a website URL.' };
  }

  // Strip control characters (classic `java\nscript:` trick) and whitespace.
  let candidate = raw.trim().replace(CONTROL_CHARS_RE, '').replace(/\s+/g, '');

  if (!candidate) return { ok: false, error: 'Please enter a website URL.' };

  // No scheme? Assume https — this is the "automatic normalization" behaviour.
  if (!SCHEME_RE.test(candidate)) {
    candidate = `https://${candidate.replace(/^\/+/, '')}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return { ok: false, error: 'That doesn’t look like a valid URL.' };
  }

  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    return { ok: false, error: 'Only http:// and https:// links are supported.' };
  }

  const hostname = parsed.hostname.toLowerCase().replace(/\.$/, '');
  const isLocalhost = hostname === 'localhost';
  const isIPv4 = IPV4_RE.test(hostname) && hostname.split('.').every((p) => Number(p) <= 255);

  if (!isLocalhost && !isIPv4 && !HOSTNAME_RE.test(hostname)) {
    return {
      ok: false,
      error: 'Enter a real domain — for example example.com.',
    };
  }

  const port = parsed.port && parsed.port !== '80' && parsed.port !== '443' ? `:${parsed.port}` : '';
  const pathname = parsed.pathname === '' ? '/' : parsed.pathname;
  const safeUrl = `${parsed.protocol}//${hostname}${port}${pathname}${parsed.search}`;

  return { ok: true, url: safeUrl, domain: getDomain(safeUrl) };
}

/** `https://www.figma.com/files` -> `figma.com` */
export function getDomain(url: string): string {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host.startsWith('www.') ? host.slice(4) : host;
  } catch {
    return url.replace(/^\w+:\/\//, '').split('/')[0] || url;
  }
}

/** Favicon service. Falls back to a letter tile when the request fails. */
export function faviconUrl(domain: string, size = 128): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${size}`;
}

export function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
