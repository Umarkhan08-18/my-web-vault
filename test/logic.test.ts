/**
 * Logic tests for the pure helpers (URL normalisation + filtering/sorting).
 * Run with:  npm run test:logic
 */
import assert from 'node:assert/strict';

import { faviconUrl, getDomain, normalizeUrl } from '../lib/url';
import { sanitizeWebsite, selectVisibleWebsites, sortWebsites, uniqueCategories } from '../lib/vault';
import { buildReply, normalize, rankSuggestions, tokens, buildCandidates } from '../lib/recommend';
import type { Website } from '../lib/types';

const cases: Array<[string, () => void]> = [];
const check = (name: string, fn: () => void) => cases.push([name, fn]);

check('adds https:// when the scheme is missing', () => {
  const r = normalizeUrl('openai.com');
  assert.equal(r.ok, true);
  assert.equal(r.ok && r.url, 'https://openai.com/');
  assert.equal(r.ok && r.domain, 'openai.com');
});

check('strips www. from the displayed domain', () => {
  const r = normalizeUrl('https://www.figma.com/files');
  assert.equal(r.ok && r.domain, 'figma.com');
});

check('keeps path + query, drops the hash', () => {
  const r = normalizeUrl('https://example.com/a/b?x=1#frag');
  assert.equal(r.ok && r.url, 'https://example.com/a/b?x=1');
});

check('rejects javascript: and data: URLs', () => {
  assert.equal(normalizeUrl('javascript:alert(1)').ok, false);
  assert.equal(normalizeUrl('JaVaScRiPt:alert(1)').ok, false);
  assert.equal(normalizeUrl('data:text/html,<script>alert(1)</script>').ok, false);
});

check('rejects control-character obfuscation', () => {
  assert.equal(normalizeUrl('java\nscript:alert(1)').ok, false);
});

check('rejects empty / whitespace / garbage input', () => {
  for (const bad of ['', '   ', 'https://', 'not a url', 'http://', 'ftp://files.example.com']) {
    assert.equal(normalizeUrl(bad).ok, false, `expected reject: ${bad}`);
  }
});

check('allows localhost, rejects hostnames without a TLD', () => {
  assert.equal(normalizeUrl('https://localhost').ok, true);
  assert.equal(normalizeUrl('https://foo').ok, false);
});

check('normalises uppercase hosts and keeps ports', () => {
  const r = normalizeUrl('HTTPS://OpenAI.com');
  assert.equal(r.ok && r.url, 'https://openai.com/');
  assert.equal(normalizeUrl('http://localhost:3000/dash').ok, true);
});

check('getDomain + favicon helpers behave', () => {
  assert.equal(getDomain('https://shopify.com/admin'), 'shopify.com');
  assert.match(faviconUrl('example.com'), /^https:\/\/www\.google\.com\/s2\/favicons\?domain=example\.com/);
});

const base = (over: Partial<Website> = {}): Website => ({
  id: Math.random().toString(36),
  name: 'Example',
  url: 'https://example.com/',
  domain: 'example.com',
  category: 'AI',
  description: '',
  favorite: false,
  createdAt: 1,
  updatedAt: 1,
  ...over,
});

check('sanitizeWebsite drops invalid rows and normalises good ones', () => {
  assert.equal(sanitizeWebsite(null), null);
  assert.equal(sanitizeWebsite({ name: 'x', url: 'javascript:alert(1)' }), null);
  assert.equal(sanitizeWebsite({ name: '', url: 'https://a.com' }), null);
  const ok = sanitizeWebsite({ name: ' X ', url: 'a.com', category: 'AI' });
  assert.ok(ok);
  assert.equal(ok && ok.name, 'X');
  assert.equal(ok && ok.url, 'https://a.com/');
  assert.equal(ok && ok.favorite, false);
  assert.equal(ok && ok.domain, 'a.com');
});

check('search matches name, domain, category and description', () => {
  const items = [
    base({ name: 'OpenAI', domain: 'openai.com', description: 'chat models' }),
    base({ name: 'Figma', domain: 'figma.com', description: 'design tool' }),
  ];
  assert.equal(selectVisibleWebsites(items, { query: 'chat', category: 'all', sort: 'recent' }).length, 1);
  assert.equal(selectVisibleWebsites(items, { query: 'figma', category: 'all', sort: 'recent' }).length, 1);
  assert.equal(selectVisibleWebsites(items, { query: 'ai', category: 'all', sort: 'recent' }).length, 2);
  assert.equal(selectVisibleWebsites(items, { query: 'nothing', category: 'all', sort: 'recent' }).length, 0);
});

check('favorites filter and category filter work', () => {
  const items = [base({ name: 'A', favorite: true, category: 'AI' }), base({ name: 'B', category: 'Design' })];
  assert.equal(selectVisibleWebsites(items, { query: '', category: 'favorites', sort: 'recent' }).length, 1);
  assert.equal(selectVisibleWebsites(items, { query: '', category: 'Design', sort: 'recent' }).length, 1);
  assert.equal(selectVisibleWebsites(items, { query: '', category: 'all', sort: 'recent' }).length, 2);
});

check('sorting: recent, alpha, favorites, category', () => {
  const items = [
    base({ name: 'Zeta', category: 'Tools', createdAt: 1 }),
    base({ name: 'Alpha', category: 'AI', createdAt: 3, favorite: true }),
    base({ name: 'Mid', category: 'AI', createdAt: 2 }),
  ];
  assert.deepEqual(sortWebsites(items, 'alpha').map((i) => i.name), ['Alpha', 'Mid', 'Zeta']);
  assert.deepEqual(sortWebsites(items, 'recent').map((i) => i.name), ['Alpha', 'Mid', 'Zeta']);
  assert.equal(sortWebsites(items, 'favorites')[0].name, 'Alpha');
  assert.deepEqual(sortWebsites(items, 'category').map((i) => i.name), ['Alpha', 'Mid', 'Zeta']);
});

check('uniqueCategories de-dupes case-insensitively and keeps defaults first', () => {
  const out = uniqueCategories(['ai', 'Crypto', 'Crypto', ' AI ']);
  assert.equal(out.filter((c) => c.toLowerCase() === 'ai').length, 1);
  assert.equal(out[0], 'AI');
  assert.ok(out.includes('Crypto'));
});

/* ------------------------------------------------------------------ */
/* voice assistant                                                     */
/* ------------------------------------------------------------------ */

function site(name: string, category: string, extra: Partial<Website> = {}): Website {
  return {
    id: `id-${name.toLowerCase()}`,
    name,
    url: `https://${name.toLowerCase().replace(/\s+/g, '')}.com`,
    domain: `${name.toLowerCase().replace(/\s+/g, '')}.com`,
    category,
    description: `${name} — saved by the user`,
    favorite: false,
    createdAt: 1_700_000_000_000,
    updatedAt: 1_700_000_000_000,
    ...extra,
  };
}

check('question words are stripped before matching', () => {
  assert.deepEqual(tokens('show me the best design websites please'), ['design']);
  assert.deepEqual(tokens('Figma!'), ['figma']);
  assert.equal(normalize('Shopify — Store'), 'shopify store');
});

check('naming a website answers with what it is', () => {
  const reply = buildReply('figma', { websites: [] });
  assert.equal(reply.kind, 'about');
  assert.equal(reply.items[0].name, 'Figma');
  assert.equal(reply.items[0].source, 'catalog');
  assert.match(reply.items[0].description, /interface design/i);
  assert.match(reply.spoken, /Figma/);
});

check('a category question returns several ranked picks', () => {
  const reply = buildReply('design tools', { websites: [] });
  assert.equal(reply.kind, 'recommend');
  assert.equal(reply.items.length, 3);
  assert.equal(reply.items[0].name, 'Figma');
  assert.ok(reply.verdict, 'a recommendation should say which one it picks');
  const scores = reply.items.map((i) => i.score);
  assert.deepEqual(scores, [...scores].sort((a, b) => b - a), 'picks are not ordered');
});

check('the vault is read before the catalogue', () => {
  const mine = site('Figma', 'Design', { description: 'my own design file' });
  const reply = buildReply('design', { websites: [mine] });
  assert.equal(reply.items[0].source, 'vault');
  assert.equal(reply.items[0].name, 'Figma');
  assert.match(reply.items[0].reasons.join(' '), /vault/i);
});

check('"Favorites" scope only ever returns starred sites', () => {
  const starred = site('Figma', 'Design', { favorite: true });
  const plain = site('Sketchbook', 'Design');
  const reply = buildReply('design', { websites: [starred, plain], scope: 'Favorites' });
  assert.ok(reply.items.length > 0);
  assert.ok(reply.items.every((i) => i.favorite && i.source === 'vault'));
  assert.equal(reply.items[0].name, 'Figma');
});

check('"Web Picks" scope ignores the vault entirely', () => {
  const mine = site('Figma', 'Design');
  const reply = buildReply('design', { websites: [mine], scope: 'Web Picks' });
  assert.ok(reply.items.length > 0);
  assert.ok(reply.items.every((i) => i.source === 'catalog'));
});

check('the result count is honoured', () => {
  const one = buildReply('design tools', { websites: [], limit: 'Top 1' });
  assert.equal(one.items.length, 1);
  const five = buildReply('design tools', { websites: [], limit: 'Top 5' });
  assert.equal(five.items.length, 5);
});

check('a favourite is not recommended when it does not match', () => {
  const starred = site('OpenAI', 'AI', { favorite: true });
  const scored = rankSuggestions(buildCandidates([starred], 'My Vault'), 'qqzzxx', {
    fav: false,
    recent: false,
  });
  assert.equal(scored.length, 0, 'a star turned into a match on its own');
  const reply = buildReply('qqzzxx nonsense', { websites: [starred] });
  assert.equal(reply.kind, 'empty');
});

check('no match is admitted, with fallback picks offered', () => {
  const mine = site('OpenAI', 'AI');
  const reply = buildReply('qqzzxx nonsense', { websites: [mine] });
  assert.equal(reply.kind, 'empty');
  assert.match(reply.text, /Nothing|could not|not/i);
  assert.ok(reply.items.length >= 1, 'the user should still get something to click');
});

check('help questions explain the assistant', () => {
  assert.equal(buildReply('help', { websites: [] }).kind, 'help');
  assert.equal(buildReply('', { websites: [] }).kind, 'help');
});

check('the same question ranks identically twice', () => {
  const sites = [site('Figma', 'Design'), site('Canva', 'Design', { favorite: true })];
  const a = buildReply('design', { websites: sites });
  const b = buildReply('design', { websites: sites });
  assert.deepEqual(a.items.map((i) => i.name), b.items.map((i) => i.name));
});

let failed = 0;
for (const [name, fn] of cases) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`  ✗ ${name}`);
    console.error(error);
  }
}
console.log(`\n${cases.length - failed}/${cases.length} logic tests passed`);
if (failed > 0) process.exit(1);
