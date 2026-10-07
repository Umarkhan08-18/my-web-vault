/**
 * The voice assistant's brain.
 *
 * It is deliberately not an LLM: the answers have to be true, instant and
 * offline, so this is a small scoring engine over two corpora — the user's own
 * vault (which always wins) and the curated catalogue in `lib/catalog.ts`.
 *
 * Everything here is a pure function so it can be unit tested directly.
 */

import type { Website } from './types';
import { CATALOG, type CatalogSite } from './catalog';

/* ------------------------------------------------------------------ */
/* Public types                                                        */
/* ------------------------------------------------------------------ */

export const SCOPES = ['My Vault', 'Favorites', 'Web Picks'] as const;
export type Scope = (typeof SCOPES)[number];

export const LIMITS = ['Top 1', 'Top 3', 'Top 5'] as const;
export type Limit = (typeof LIMITS)[number];

export type SuggestionSource = 'vault' | 'catalog';

export interface Suggestion {
  key: string;
  source: SuggestionSource;
  name: string;
  url: string;
  domain: string;
  category: string;
  description: string;
  favorite: boolean;
  savedAt?: number;
  score: number;
  reasons: string[];
}

export type ReplyKind = 'about' | 'recommend' | 'empty' | 'help';

export interface BotReply {
  kind: ReplyKind;
  title: string;
  text: string;
  /** What the voice actually reads aloud — short, no URLs, no markdown. */
  spoken: string;
  /** The single most confident pick, phrased as a recommendation. */
  verdict?: string;
  items: Suggestion[];
}

/* ------------------------------------------------------------------ */
/* Text helpers                                                        */
/* ------------------------------------------------------------------ */

/** Lowercase, strip punctuation, collapse whitespace. */
export function normalize(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Words that are noise in a question. Category words stay in — "design",
 * "shopify", "research" are exactly the signal we want.
 */
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'for', 'to', 'of', 'in', 'on', 'at', 'by', 'with', 'from',
  'i', 'me', 'my', 'mine', 'we', 'our', 'you', 'your', 'it', 'its', 'this', 'that', 'these', 'those',
  'is', 'are', 'was', 'be', 'do', 'does', 'did', 'can', 'could', 'would', 'should', 'will',
  'have', 'has', 'need', 'want', 'show', 'give', 'tell', 'find', 'get', 'look', 'looking',
  'please', 'some', 'any', 'more', 'many', 'much', 'one', 'two', 'three', 'list', 'all',
  'what', 'which', 'who', 'whose', 'where', 'when', 'how', 'why', 'about', 'something',
  'good', 'great', 'best', 'better', 'nice', 'cool', 'awesome', 'perfect', 'right',
  'website', 'websites', 'site', 'sites', 'web', 'link', 'links', 'url', 'page', 'pages',
  'tool', 'tools', 'app', 'apps', 'recommend', 'recommendation', 'suggest', 'suggestion',
  'suggestions', 'idea', 'ideas', 'help', 'helped', 'mujhe', 'mujhko', 'kuch', 'kya', 'kaun',
  'acha', 'achha', 'acchi', 'batao', 'bataiye', 'chahiye', 'liye', 'wala', 'wali', 'wale',
]);

/** Intent words that change ranking, detected before stop words are dropped. */
const FAVOURITE_INTENT = /\b(best|favourite|favorite|loved|love|top|star|starred|preferred)\b/i;
const RECENT_INTENT = /\b(recent|recently|latest|newest|new|just added|added last)\b/i;
const ABOUT_INTENT = /\b(what is|who is|about|explain|detail|details|describe|tell me about|kya hai|kaun hai|batao)\b/i;
const HELP_INTENT = /\b(help|help me|what can you do|who are you|how do (i|you) work|madad|kaise|how does this work)\b/i;

/** `query` split into meaningful, de-duplicated tokens. */
export function tokens(query: string): string[] {
  const seen: string[] = [];
  for (const raw of normalize(query).split(' ')) {
    if (!raw || raw.length < 2) continue;
    if (STOP_WORDS.has(raw)) continue;
    if (!seen.includes(raw)) seen.push(raw);
  }
  return seen;
}

/* ------------------------------------------------------------------ */
/* Candidate pool                                                      */
/* ------------------------------------------------------------------ */

interface Candidate {
  key: string;
  source: SuggestionSource;
  name: string;
  url: string;
  domain: string;
  category: string;
  description: string;
  tags: string[];
  /** editorial prominence, catalogue entries only */
  weight: number;
  favorite: boolean;
  savedAt?: number;
}

function vaultCandidate(item: Website): Candidate {
  return {
    key: `vault:${item.id}`,
    source: 'vault',
    name: item.name,
    url: item.url,
    domain: item.domain,
    category: item.category,
    description: item.description,
    tags: [],
    weight: 0,
    favorite: item.favorite,
    savedAt: item.createdAt,
  };
}

function catalogCandidate(item: CatalogSite): Candidate {
  return {
    key: `catalog:${item.domain}`,
    source: 'catalog',
    name: item.name,
    url: item.url,
    domain: item.domain,
    category: item.category,
    description: item.description,
    tags: item.tags,
    weight: item.weight,
    favorite: false,
  };
}

export function buildCandidates(websites: Website[], scope: Scope): Candidate[] {
  const vault = websites.map(vaultCandidate);
  const catalog = CATALOG.map(catalogCandidate);

  if (scope === 'Favorites') return vault.filter((c) => c.favorite);
  if (scope === 'Web Picks') return catalog;
  return [...vault, ...catalog];
}

/* ------------------------------------------------------------------ */
/* Scoring                                                             */
/* ------------------------------------------------------------------ */

const MIN_SCORE = 22;

export function scoreCandidate(candidate: Candidate, query: string, intent: { fav: boolean; recent: boolean }): Suggestion | null {
  const q = normalize(query);
  const toks = tokens(query);
  if (!toks.length) return null;

  const name = normalize(candidate.name);
  const domain = normalize(candidate.domain).replace(/ /g, '');
  const category = normalize(candidate.category);
  const description = normalize(candidate.description);
  const nameWords = name.split(' ');

  let score = 0;
  const reasons: string[] = [];
  let matched = false;

  // whole-question hits on the name are the strongest signal
  if (q && name === q) {
    score += 130;
    matched = true;
    reasons.push('exact name match');
  } else if (q && name.startsWith(q)) {
    score += 95;
    matched = true;
    reasons.push(`name starts with “${query.trim()}”`);
  } else if (q && name.includes(q)) {
    score += 80;
    matched = true;
    reasons.push(`name matches “${query.trim()}”`);
  }

  let nameHits = 0;
  let textHits = 0;
  let tagHits = 0;

  for (const tok of toks) {
    if (nameWords.includes(tok)) {
      score += 36;
      nameHits += 1;
      matched = true;
    } else if (name.includes(tok)) {
      score += 24;
      nameHits += 1;
      matched = true;
    }

    // weaker evidence than the name or the words in the description: plenty of
    // domains simply contain the word (spline.design, design.google).
    if (domain.includes(tok)) {
      score += 12;
      matched = true;
    }

    if (category === tok || category.includes(tok)) {
      score += 26;
      matched = true;
      if (!reasons.some((r) => r.startsWith('lives in'))) reasons.push(`lives in ${candidate.category}`);
    }

    if (description.includes(tok)) {
      textHits += 1;
      score += Math.min(9, 4 + textHits * 2);
    }

    if (candidate.tags.some((tag) => normalize(tag).includes(tok))) {
      tagHits += 1;
      score += Math.min(18, 12 + tagHits * 3);
      if (!reasons.some((r) => r.startsWith('tagged'))) reasons.push(`tagged “${tok}”`);
    }
  }

  if (nameHits && !reasons.length) reasons.push(`name matches ${toks[0]}`);

  // a candidate that covers every word of the question beats a partial match
  if (toks.length > 1 && nameHits + tagHits >= toks.length) score += 18;

  score += candidate.weight;

  if (candidate.favorite) {
    score += 16;
    reasons.push('one of your favourites');
  }
  if (candidate.source === 'vault') {
    // A personal vault: something you bothered to save outranks a stranger's
    // catalogue entry of the same weight.
    score += 18;
    if (!candidate.favorite) reasons.push('already in your vault');
  }
  if (intent.fav && candidate.favorite) score += 22;
  if (intent.recent && candidate.savedAt) {
    const days = (Date.now() - candidate.savedAt) / 86_400_000;
    if (days <= 30) score += 14;
    if (days <= 7) score += 8;
  }

  // The favourite/vault bonuses are tie-breakers, never a reason to match:
  // a starred site must still answer the question that was asked.
  if (!matched || score < MIN_SCORE) return null;

  // favourites + a stable name tie-break keep the order deterministic
  return {
    key: candidate.key,
    source: candidate.source,
    name: candidate.name,
    url: candidate.url,
    domain: candidate.domain,
    category: candidate.category,
    description: candidate.description,
    favorite: candidate.favorite,
    savedAt: candidate.savedAt,
    score,
    reasons: reasons.slice(0, 3),
  };
}

function byScoreThenName(a: Suggestion, b: Suggestion): number {
  if (b.score !== a.score) return b.score - a.score;
  if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
  // level pegging: the user's own copy goes first, then alphabetical
  if (a.source !== b.source) return a.source === 'vault' ? -1 : 1;
  return a.name.localeCompare(b.name);
}

function domainKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .replace(/[^a-z0-9]/g, '');
}

/**
 * One card per site. If the user has already saved a site, show their copy —
 * it is the one with their notes and their star on it.
 */
export function dedupeSuggestions(items: Suggestion[]): Suggestion[] {
  const byDomain = new Map<string, Suggestion>();
  for (const item of items) {
    const key = domainKey(item.domain);
    const existing = byDomain.get(key);
    if (!existing) {
      byDomain.set(key, item);
    } else if (item.source === 'vault' && existing.source === 'catalog') {
      byDomain.set(key, item);
    }
  }
  return [...byDomain.values()];
}

export function rankSuggestions(candidates: Candidate[], query: string, intent: { fav: boolean; recent: boolean }): Suggestion[] {
  const out: Suggestion[] = [];
  for (const candidate of candidates) {
    const scored = scoreCandidate(candidate, query, intent);
    if (scored) out.push(scored);
  }
  return dedupeSuggestions(out).sort(byScoreThenName);
}

/* ------------------------------------------------------------------ */
/* Reply composition                                                   */
/* ------------------------------------------------------------------ */

export function limitCount(limit: Limit): number {
  if (limit === 'Top 1') return 1;
  if (limit === 'Top 5') return 5;
  return 3;
}

function phraseReasons(item: Suggestion): string {
  if (!item.reasons.length) return `it fits ${item.category}`;
  return item.reasons.join(' · ');
}

function sourceLine(item: Suggestion): string {
  if (item.source === 'vault') return item.favorite ? 'Saved in your vault and starred.' : 'Already saved in your vault.';
  return 'Not in your vault yet — save it with one tap.';
}

function fallbackItems(websites: Website[], scope: Scope, count: number): Suggestion[] {
  if (scope !== 'Web Picks' && websites.length) {
    const sorted = [...websites].sort((a, b) => {
      if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
      return b.createdAt - a.createdAt;
    });
    return sorted.slice(0, count).map((item) => ({
      ...vaultCandidate(item),
      score: 0,
      reasons: item.favorite ? ['one of your favourites'] : ['recently added to your vault'],
    }));
  }

  const featured = ['Figma', 'Notion', 'GitHub'];
  return CATALOG.filter((c) => featured.includes(c.name)).map((c) => ({
    ...catalogCandidate(c),
    score: 0,
    reasons: ['a popular starting point'],
  }));
}

const HELP_REPLY: BotReply = {
  kind: 'help',
  title: 'Here is what I can do',
  text:
    'Ask me for a website by name and I will tell you what it is. Ask for a kind of site — “best design tools”, “something for SEO” — and I will recommend the strongest matches, reading your vault first. Use the mic to ask out loud, and the speaker toggle to hear the answer.',
  spoken:
    'Ask me for a website by name and I will tell you what it is. Ask for a kind of site, like best design tools, and I will recommend the strongest matches from your vault first.',
  items: [],
};

export interface ReplyOptions {
  websites: Website[];
  scope?: Scope;
  limit?: Limit;
}

export function buildReply(rawQuery: string, options: ReplyOptions): BotReply {
  const query = rawQuery.trim();
  const scope: Scope = options.scope ?? 'My Vault';
  const limit: Limit = options.limit ?? 'Top 3';
  const count = limitCount(limit);
  const { websites } = options;

  if (!query) return HELP_REPLY;
  if (HELP_INTENT.test(query) && tokens(query).length <= 3) return HELP_REPLY;

  const intent = {
    fav: FAVOURITE_INTENT.test(query),
    recent: RECENT_INTENT.test(query),
  };

  const candidates = buildCandidates(websites, scope);
  let ranked = rankSuggestions(candidates, query, intent);

  // "best X" with nothing starred should still answer: widen to the whole vault.
  if (!ranked.length && scope === 'Favorites' && websites.length) {
    ranked = rankSuggestions(buildCandidates(websites, 'My Vault'), query, intent);
  }

  if (!ranked.length) {
    const items = fallbackItems(websites, scope, count);
    const scopeNote =
      scope === 'Favorites'
        ? 'You have not starred anything yet — these are from your vault.'
        : scope === 'Web Picks'
          ? 'Nothing in the catalogue matched that either — here are three popular picks.'
          : 'Nothing in your vault or my catalogue matched that. Try a category name like “design”, “AI” or “Shopify”.';
    return {
      kind: 'empty',
      title: `Nothing matched “${query}”`,
      text: scopeNote,
      spoken: `I could not find anything for ${query}. Try asking for a category, like design, A I, or Shopify.`,
      items,
    };
  }

  const top = ranked[0];
  const strongName = top.score >= 80;
  const wantsAbout = ABOUT_INTENT.test(query) || (tokens(query).length <= 2 && strongName);

  const items = ranked.slice(0, count);

  if (wantsAbout) {
    return {
      kind: 'about',
      title: `${top.name} — ${top.category}`,
      text: `${top.name} is ${top.description.startsWith(top.name) ? top.description : top.description} ${sourceLine(top)} I rate it a match because: ${phraseReasons(top)}.`,
      spoken: `${top.name}. ${top.category}. ${top.description} ${sourceLine(top)}`,
      verdict: `${top.name} is worth your time — ${phraseReasons(top)}.`,
      items,
    };
  }

  const noun = items.length === 1 ? 'pick' : 'picks';
  return {
    kind: 'recommend',
    title: `${items.length} ${noun} for “${query}”`,
    text: `My top recommendation is ${top.name} — ${phraseReasons(top)}. ${sourceLine(top)}`,
    spoken: `My top recommendation is ${top.name}. ${phraseReasons(top)}. ${sourceLine(top)}`,
    verdict: `${top.name} is my pick for you — ${phraseReasons(top)}.`,
    items,
  };
}

/** Starter chips shown before the first question. */
export function starterPrompts(websites: Website[]): string[] {
  if (!websites.length) return ['Best design tools', 'AI assistants', 'Where do I learn to code?'];
  return ['Best in my vault', 'What is in my vault?', 'Design tools', 'Shopify helpers'];
}
