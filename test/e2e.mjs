/**
 * End-to-end browser test for My Web Vault.
 *
 * Drives a real Chromium through the complete flow:
 * Add → Save → Search → Filter → Favorite → Edit → Delete → Refresh → Open
 * and writes screenshots to ./screenshots
 *
 * Run with the dev server already listening on http://localhost:3000:
 *   node test/e2e.mjs
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const SHOTS = path.join(process.cwd(), 'screenshots');
fs.mkdirSync(SHOTS, { recursive: true });

const results = [];
const consoleErrors = [];

const cardFor = (page, name) => page.locator('article').filter({ hasText: name }).first();

async function shot(page, name) {
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`) });
}

async function step(name, fn) {
  try {
    await fn();
    results.push([true, name]);
    console.log(`  ✓ ${name}`);
  } catch (error) {
    results.push([false, name]);
    console.error(`  ✗ ${name}`);
    console.error(String(error).split('\n').slice(0, 6).join('\n'));
  }
}

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 950 } });
const page = await context.newPage();

page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => consoleErrors.push(`pageerror: ${error.message}`));

// Headless Chromium ships no voices, so record what the assistant asks the
// speech engine to say instead of trying to hear it.
await page.addInitScript(() => {
  window.__spoken = [];
  const synth = window.speechSynthesis;
  if (synth) {
    synth.speak = (utterance) => {
      window.__spoken.push(String((utterance && utterance.text) || ''));
    };
  }
});

await page.goto(BASE_URL, { waitUntil: 'networkidle' });

/** Open the assistant panel, type a question and send it. */
async function askBot(page, text) {
  const panel = page.getByRole('region', { name: 'Vault Voice assistant' });
  await panel.waitFor();
  await panel.getByRole('button', { name: 'Open prompt input' }).click({ timeout: 3000 }).catch(() => {});
  const prompt = panel.getByPlaceholder('Ask for a website…');
  await prompt.fill(text);
  await prompt.press('Enter');
  await page.waitForTimeout(450);
  return panel;
}

/** The newest assistant reply (the conversation keeps older ones on screen). */
function lastReply(panel) {
  return panel.locator('[data-bot-reply]').last();
}

// ---------------------------------------------------------------- 1. landing
await step('landing hero renders the headline and CTA', async () => {
  await assert.doesNotReject(page.getByRole('heading', { level: 1 }).waitFor());
  const h1 = await page.getByRole('heading', { level: 1 }).innerText();
  assert.match(h1, /Your Internet/);
  assert.match(h1, /Organized/);
  assert.ok(await page.getByText('It’s your personal web command center').isVisible());
  await shot(page, '01-hero-desktop');
});

await step('three feature cards sit in one row on desktop', async () => {
  // The cards drift on slow float loops, so measure the layout with motion off.
  // Emulate first: a reveal already in flight keeps its original duration even
  // after the media query flips, and the three cards start 85ms apart.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('#features').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1400);
  const boxes = await page.locator('#features article').evaluateAll((nodes) =>
    nodes.map((n) => n.getBoundingClientRect().top),
  );
  assert.equal(boxes.length, 3);
  assert.ok(Math.abs(boxes[0] - boxes[1]) < 4 && Math.abs(boxes[1] - boxes[2]) < 4, 'cards are not on one row');
  await shot(page, '02-features');
  await page.emulateMedia({ reducedMotion: null });
});

await step('assistant docks while scrolling and collapses to an icon', async () => {
  await page.evaluate(() => window.scrollTo(0, 900));
  await page.waitForTimeout(700);
  const bar = page.getByRole('button', { name: /Need a hand/ });
  await bar.waitFor();
  // smooth scrolling plus the fade means the bar needs a moment to settle
  const faded = await page
    .waitForFunction(
      () => {
        const el = [...document.querySelectorAll('button')].find((b) => /Need a hand/.test(b.textContent || ''));
        return !!el && parseFloat(getComputedStyle(el.parentElement).opacity) > 0.95;
      },
      null,
      { timeout: 5000 },
    )
    .then(() => true)
    .catch(() => false);
  assert.ok(faded, 'the docked bar never faded in');
  await shot(page, '14-voice-bot-bar');

  await page.getByRole('button', { name: 'Collapse assistant to an icon' }).click();
  await page.waitForTimeout(400);
  assert.equal(await bar.count(), 0, 'the bar should disappear once collapsed');

  const icon = page.getByRole('button', { name: 'Open Vault Voice assistant' });
  assert.ok(await icon.isVisible(), 'no floating icon after collapsing');
  const box = await icon.boundingBox();
  assert.ok(box.width >= 44 && box.height >= 44, `icon is only ${box.width}x${box.height}`);
  // leave it as an icon so the rest of the flow has a clear page
  return `${Math.round(box.width)}px icon`;
});

// ------------------------------------------------------------ 2. empty state
await step('empty state is shown before anything is saved', async () => {
  await page.locator('#vault').scrollIntoViewIfNeeded();
  await assert.doesNotReject(page.getByText('Your web vault is empty.').waitFor({ timeout: 5000 }));
  await shot(page, '03-empty-state');
});

// --------------------------------------------------------------- 3. add flow
await step('Add Website modal opens from the empty state', async () => {
  await page.getByRole('button', { name: 'Add Website' }).first().click();
  const dialog = page.getByRole('dialog');
  await dialog.waitFor();
  assert.ok(await dialog.getByLabel('Website Name').isVisible());
  assert.ok(await dialog.getByLabel('Website URL').isVisible());
  await shot(page, '04-add-modal');
});

await step('invalid URL is rejected with a clear error', async () => {
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Website Name').fill('Broken Link');
  await dialog.getByLabel('Website URL').fill('not a website');
  await dialog.locator('button[type="submit"]').click();
  await dialog.getByText(/look like a valid URL|real domain/).waitFor({ timeout: 4000 });
  assert.ok(await dialog.isVisible(), 'dialog should stay open on error');
});

await step('javascript: URLs are rejected', async () => {
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Website URL').fill('javascript:alert(1)');
  await dialog.locator('button[type="submit"]').click();
  await dialog.getByText(/Only http/).waitFor({ timeout: 4000 });
  assert.ok(await dialog.isVisible(), 'dialog should stay open on error');
});

await step('valid site is saved and URL is normalised', async () => {
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Website Name').fill('OpenAI');
  await dialog.getByLabel('Website URL').fill('openai.com');
  await dialog.getByLabel('Category').selectOption('AI');
  await dialog.getByLabel(/Description/).fill('Chat models and API docs');
  await dialog.locator('button[type="submit"]').click();
  await dialog.waitFor({ state: 'detached' });

  const card = cardFor(page, 'OpenAI');
  await card.waitFor();
  assert.ok(await card.getByText('openai.com').isVisible());
  assert.equal(await card.locator('a').first().getAttribute('href'), 'https://openai.com/');
});

await step('seed a handful of sites through the UI', async () => {
  const samples = [
    ['Figma', 'https://www.figma.com/files', 'Design', 'Design and prototypes'],
    ['GitHub', 'github.com', 'Development', 'Repos and issues'],
    ['Perplexity', 'https://perplexity.ai', 'Research', 'Answers with sources'],
  ];
  for (const [name, url, category, description] of samples) {
    await page.getByRole('button', { name: 'Add Website' }).first().click();
    const dialog = page.getByRole('dialog');
    await dialog.waitFor();
    await dialog.getByLabel('Website Name').fill(name);
    await dialog.getByLabel('Website URL').fill(url);
    await dialog.getByLabel('Category').selectOption(category);
    await dialog.getByLabel(/Description/).fill(description);
    await dialog.locator('button[type="submit"]').click();
    await dialog.waitFor({ state: 'detached' });
    await cardFor(page, name).waitFor();
  }
  await page.locator('#vault').scrollIntoViewIfNeeded();
  await shot(page, '05-dashboard-with-cards');
});

// ---------------------------------------------------------------- 4. search
await step('search filters by name, domain and description', async () => {
  const search = page.getByLabel('Search websites');
  await search.fill('figma');
  await page.waitForTimeout(150);
  assert.ok(await cardFor(page, 'Figma').isVisible());
  assert.equal(await cardFor(page, 'GitHub').count(), 0);

  await search.fill('sources');
  await page.waitForTimeout(150);
  assert.ok(await cardFor(page, 'Perplexity').isVisible(), 'description search failed');
  assert.equal(await cardFor(page, 'OpenAI').count(), 0);
  await shot(page, '06-search');

  await search.fill('zzzz-nothing');
  await page.waitForTimeout(150);
  await page.getByText('No matches for').waitFor({ timeout: 4000 });
  await page.getByRole('button', { name: 'Reset filters' }).click();
});

// --------------------------------------------------------------- 5. filters
await step('category filter narrows the grid', async () => {
  await page.getByRole('button', { name: /^Design/ }).click();
  await page.waitForTimeout(150);
  assert.ok(await cardFor(page, 'Figma').isVisible());
  assert.equal(await cardFor(page, 'GitHub').count(), 0);
  await page.getByRole('button', { name: /^All/ }).click();
  await page.waitForTimeout(150);
  assert.equal(await page.locator('#vault article').count() > 0, true);
});

// ------------------------------------------------------------- 6. favorites
await step('favoriting surfaces the Favorites section', async () => {
  const card = cardFor(page, 'Figma');
  await card.getByRole('button', { name: /Add .* to favorites/ }).click();
  await page.getByRole('button', { name: /Remove .* from favorites/ }).first().waitFor();
  const favoritesHeading = page.locator('#vault h3', { hasText: 'Favorites' });
  await favoritesHeading.first().waitFor();
  await page.getByRole('button', { name: /^Favorites/ }).click();
  await page.waitForTimeout(150);
  assert.ok(await cardFor(page, 'Figma').isVisible());
  assert.equal(await cardFor(page, 'OpenAI').count(), 0);
  await shot(page, '07-favorites');
  await page.getByRole('button', { name: /^All/ }).click();
});

// ---------------------------------------------------------------- 7. sorting
await step('alphabetical sorting orders the grid A–Z', async () => {
  await page.getByLabel('Sort websites').selectOption('alpha');
  await page.waitForTimeout(200);
  const names = await page
    .locator('#vault article h3')
    .evaluateAll((nodes) => nodes.map((n) => n.textContent?.trim()));
  const sorted = [...names].sort((a, b) => a.localeCompare(b));
  assert.deepEqual(names.slice(0, sorted.length), sorted);
  await page.getByLabel('Sort websites').selectOption('recent');
});

// ------------------------------------------------------------------- 8. edit
await step('edit updates a saved website in place', async () => {
  const card = cardFor(page, 'GitHub');
  await card.getByRole('button', { name: /^Edit/ }).click();
  const dialog = page.getByRole('dialog');
  await dialog.waitFor();
  await dialog.getByLabel('Website Name').fill('GitHub · Repos');
  await dialog.getByLabel('Website URL').fill('https://github.com/trending');
  await dialog.locator('button[type="submit"]').click();
  await dialog.waitFor({ state: 'detached' });

  const updated = cardFor(page, 'GitHub · Repos');
  await updated.waitFor();
  assert.ok(await updated.getByText('github.com').isVisible());
  assert.equal(await updated.locator('a').first().getAttribute('href'), 'https://github.com/trending');
});

// --------------------------------------------------------------- 9. categories
await step('categories can be added and renamed', async () => {
  await page.getByTitle('Manage categories').click();
  const dialog = page.getByRole('dialog');
  await dialog.waitFor();
  await dialog.getByLabel('New category name').fill('Reading List');
  await dialog.getByRole('button', { name: 'Add' }).click();
  await assert.doesNotReject(dialog.getByLabel('Rename category Reading List').waitFor({ timeout: 3000 }));

  await dialog.getByLabel('Rename category Reading List').fill('Reading');
  await dialog.getByLabel('Rename category Reading List').blur();
  await page.waitForTimeout(200);
  await dialog.getByRole('button', { name: 'Done' }).click();
  await dialog.waitFor({ state: 'detached' });

  const pill = page.locator('#vault button', { hasText: 'Reading' }).first();
  await pill.waitFor({ timeout: 3000 });
});

// ---------------------------------------------------------------- 10. export
await step('export downloads a JSON backup', async () => {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByTitle('Export as JSON').click(),
  ]);
  assert.match(download.suggestedFilename(), /^my-web-vault-\d{4}-\d{2}-\d{2}\.json$/);
  const target = path.join(SHOTS, 'export-check.json');
  await download.saveAs(target);
  const parsed = JSON.parse(fs.readFileSync(target, 'utf8'));
  assert.ok(Array.isArray(parsed.websites) && parsed.websites.length >= 4);
  assert.ok(parsed.websites.every((w) => w.url.startsWith('https://')));
});

// ---------------------------------------------------------------- 11. import
await step('import merges a JSON backup and skips duplicates', async () => {
  const file = path.join(SHOTS, 'import-fixture.json');
  fs.writeFileSync(
    file,
    JSON.stringify({
      categories: ['Imported'],
      websites: [
        { name: 'Excalidraw', url: 'excalidraw.com', category: 'Imported', description: 'Sketching' },
        { name: 'OpenAI duplicate', url: 'https://openai.com/', category: 'AI' },
      ],
    }),
  );
  await page.locator('input[type="file"]').setInputFiles(file);
  await page.getByText(/Imported 1 website/).waitFor({ timeout: 5000 });
  await cardFor(page, 'Excalidraw').waitFor();
  assert.equal(await page.locator('#vault article').filter({ hasText: 'OpenAI duplicate' }).count(), 0);
});

// ---------------------------------------------------------- 12. persistence
await step('everything survives a page refresh', async () => {
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('#vault').scrollIntoViewIfNeeded();
  await cardFor(page, 'OpenAI').waitFor({ timeout: 5000 });
  await cardFor(page, 'Excalidraw').waitFor({ timeout: 5000 });
  await cardFor(page, 'GitHub · Repos').waitFor({ timeout: 5000 });
  const favoritesHeading = page.locator('#vault h3', { hasText: 'Favorites' });
  assert.ok(await favoritesHeading.first().isVisible(), 'favorite survived reload');
  const stored = await page.evaluate(() => localStorage.getItem('my-web-vault:v1'));
  assert.ok(stored && JSON.parse(stored).websites.length >= 5);
  await shot(page, '08-after-refresh');
});

// -------------------------------------------------------------- 13. launching
await step('clicking a card opens the site in a new tab', async () => {
  const [popup] = await Promise.all([
    page.waitForEvent('popup'),
    cardFor(page, 'OpenAI').getByRole('link', { name: /Open Website/ }).click(),
  ]);
  await popup.waitForLoadState('commit');
  assert.match(popup.url(), /^https:\/\/openai\.com/);
  assert.ok(await page.locator('#vault').isVisible(), 'vault stays open in the original tab');
  await popup.close();
});

await step('external links use safe rel attributes', async () => {
  const rel = await cardFor(page, 'OpenAI').locator('a').first().getAttribute('rel');
  assert.match(rel ?? '', /noopener/);
  assert.match(rel ?? '', /noreferrer/);
});

// ---------------------------------------------------------------- 14. delete
await step('delete asks for confirmation and removes the card', async () => {
  const target = cardFor(page, 'Excalidraw');
  await target.getByRole('button', { name: /^Delete/ }).click();
  const dialog = page.getByRole('dialog');
  await dialog.waitFor();
  assert.ok(await dialog.getByText('Delete this website?').isVisible());
  await dialog.getByRole('button', { name: 'Delete' }).click();
  await dialog.waitFor({ state: 'detached' });
  await page.waitForTimeout(200);
  assert.equal(await page.locator('#vault').getByText('Excalidraw').count(), 0);
});

await step('keyboard: Escape closes the add dialog', async () => {
  await page.getByRole('button', { name: 'Add Website' }).first().click();
  const dialog = page.getByRole('dialog');
  await dialog.waitFor();
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'detached' });
});

await step('keyboard: ⌘K focuses the search field', async () => {
  await page.keyboard.press('Control+k');
  const focused = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
  assert.equal(focused, 'Search websites');
});

// ------------------------------------------------------------ 15. the rest
// ------------------------------------------------------------- 17. voice bot
await step('the icon opens the assistant', async () => {
  await page.getByRole('button', { name: 'Open Vault Voice assistant' }).click();
  const panel = page.getByRole('region', { name: 'Vault Voice assistant' });
  await panel.waitFor();
  assert.ok(await panel.isVisible());
  await shot(page, '15-voice-bot');
});

await step('voice bot tells you about a website you name', async () => {
  const panel = await askBot(page, 'figma');
  const first = lastReply(panel).locator('article').first();
  await first.waitFor();
  const text = await first.innerText();
  assert.match(text, /Figma/);
  assert.match(text, /figma\.com/);
  assert.match(await panel.innerText(), /Design/i);
  return text.split('\n')[0];
});

await step('voice bot recommends from your own vault first', async () => {
  const panel = await askBot(page, 'best design tool');
  const first = lastReply(panel).locator('article').first();
  await first.waitFor();
  const text = await first.innerText();
  assert.match(text, /Figma/, 'the vault’s design site should win over the catalogue');
  assert.match(text, /your vault|favourite/i);
  await shot(page, '16-voice-bot-answer');
  return text.split('\n')[0];
});

await step('recommendations open safely and save into the vault', async () => {
  const panel = await askBot(page, 'notion');
  const first = lastReply(panel).locator('article').first();
  await first.waitFor();
  const link = first.getByRole('link', { name: /Open/ });
  assert.equal(await link.getAttribute('rel'), 'noopener noreferrer');
  assert.equal(await link.getAttribute('target'), '_blank');
  assert.match(await link.getAttribute('href'), /^https:\/\//);

  const before = await page.evaluate(() => JSON.parse(localStorage.getItem('my-web-vault:v1')).websites.length);
  await first.getByRole('button', { name: /Save to vault/ }).click();
  await page.getByText('Notion saved to your vault').waitFor();
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('my-web-vault:v1')).websites.length);
  assert.equal(after, before + 1);
  assert.ok(await first.getByText('In your vault').isVisible(), 'the card did not flip to saved');
  return `${before} → ${after} saved sites`;
});

await step('voice bot reads the answer aloud, and can be muted', async () => {
  const spokenAt = () => page.evaluate(() => window.__spoken.length);
  const before = await spokenAt();
  await askBot(page, 'slack');
  await page.waitForTimeout(400);
  const afterAsk = await spokenAt();
  assert.ok(afterAsk > before, 'nothing was sent to the speech engine');
  const last = await page.evaluate(() => window.__spoken[window.__spoken.length - 1]);
  assert.match(last, /Slack/i, `unexpected speech: ${last}`);

  await page.getByRole('button', { name: 'Turn voice replies off' }).click();
  const beforeMuted = await spokenAt();
  await askBot(page, 'trello');
  await page.waitForTimeout(400);
  assert.equal(await spokenAt(), beforeMuted, 'the assistant spoke while muted');
  await page.getByRole('button', { name: 'Turn voice replies on' }).click();
  return `spoke ${afterAsk - before}×, silent while muted`;
});

await step('voice bot admits it when nothing matches', async () => {
  const panel = await askBot(page, 'qqzzxx nonsense');
  const reply = lastReply(panel);
  await reply.waitFor();
  assert.equal(await reply.getAttribute('data-bot-reply'), 'empty');
  assert.match(await reply.innerText(), /Nothing matched/);
  const cards = await reply.locator('article').count();
  assert.ok(cards >= 1, 'no fallback suggestion was offered');
  return `${cards} fallback picks`;
});

await step('assistant remembers its shape but never reopens itself', async () => {
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  assert.equal(await page.getByRole('region', { name: 'Vault Voice assistant' }).count(), 0, 'panel reopened on load');
  const bar = page.getByRole('button', { name: /Need a hand/ });
  assert.equal(await bar.count(), 1, 'the docked shape was forgotten');
  await page.evaluate(() => window.scrollTo(0, 900));
  await page.waitForTimeout(700);
  await bar.click();
  await page.getByRole('region', { name: 'Vault Voice assistant' }).waitFor();
});

await step('terminal + tiers + testimonial sections render', async () => {
  await page.locator('#terminal').scrollIntoViewIfNeeded();
  assert.ok(await page.getByText('vault launch --name "OpenAI"').isVisible());
  await shot(page, '09-terminal');
  await page.locator('#styles').scrollIntoViewIfNeeded();
  assert.ok(await page.getByText('Choose Your').isVisible());
  await shot(page, '10-tiers');
  await page.locator('#demo').scrollIntoViewIfNeeded();
  assert.ok(await page.getByText(/fictional placeholders/).isVisible());
});

await step('no privacy policy link is present', async () => {
  const count = await page.getByRole('link', { name: /privacy/i }).count();
  assert.equal(count, 0);
});

await step('header stays sticky while scrolling', async () => {
  await page.evaluate(() => window.scrollTo(0, 1500));
  await page.waitForTimeout(400);
  const box = await page.locator('header').boundingBox();
  assert.ok(box && box.y <= 5, `header is not sticky (y=${box?.y})`);
  await page.evaluate(() => window.scrollTo(0, 0));
});

// -------------------------------------------------------------- 16. mobile
await step('mobile layout stacks to a single column', async () => {
  const mobile = await context.newPage();
  await mobile.setViewportSize({ width: 390, height: 844 });
  await mobile.goto(BASE_URL, { waitUntil: 'networkidle' });
  await mobile.emulateMedia({ reducedMotion: 'reduce' });
  await mobile.locator('#vault').scrollIntoViewIfNeeded();
  await mobile.waitForTimeout(300);
  // measure the main "All websites" grid (the favourites grid can hold a single card)
  const tops = await mobile
    .locator('#vault div.grid')
    .last()
    .locator('article')
    .evaluateAll((nodes) => nodes.map((n) => Math.round(n.getBoundingClientRect().top)));
  const uniqueTops = new Set(tops);
  assert.ok(tops.length > 1);
  assert.equal(uniqueTops.size, tops.length, 'cards share rows on mobile');
  const overflow = await mobile.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  assert.ok(overflow <= 1, `horizontal overflow of ${overflow}px on mobile`);
  await mobile.screenshot({ path: path.join(SHOTS, '11-mobile.png') });
  await mobile.screenshot({ path: path.join(SHOTS, '12-mobile-full.png'), fullPage: true });
  await mobile.close();
});

await step('tablet layout uses two columns', async () => {
  const tablet = await context.newPage();
  await tablet.setViewportSize({ width: 820, height: 1100 });
  await tablet.goto(BASE_URL, { waitUntil: 'networkidle' });
  await tablet.emulateMedia({ reducedMotion: 'reduce' });
  await tablet.locator('#vault').scrollIntoViewIfNeeded();
  await tablet.waitForTimeout(300);
  const tops = await tablet
    .locator('#vault div.grid')
    .last()
    .locator('article')
    .evaluateAll((nodes) => nodes.map((n) => Math.round(n.getBoundingClientRect().top)));
  const firstRow = tops.filter((t) => t === tops[0]).length;
  assert.equal(firstRow, 2, `expected 2 cards per row on tablet, got ${firstRow}`);
  await tablet.screenshot({ path: path.join(SHOTS, '13-tablet.png') });
  await tablet.close();
});

await step('no console errors anywhere in the flow', async () => {
  assert.deepEqual(consoleErrors, []);
});

await browser.close();

const failed = results.filter(([ok]) => !ok);
console.log(`\n${results.length - failed.length}/${results.length} browser checks passed`);
if (consoleErrors.length) {
  console.log('\nConsole errors:');
  consoleErrors.forEach((e) => console.log(' -', e));
}
process.exit(failed.length ? 1 : 0);
