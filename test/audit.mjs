/**
 * Design + accessibility audit. Verifies the things that are easy to break but
 * hard to notice: fonts, overflow at every breakpoint, contrast, tap targets,
 * focusability and image/link hygiene.
 *
 * Run with the dev server listening:  node test/audit.mjs
 */
import assert from 'node:assert/strict';

import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const WIDTHS = [360, 390, 768, 1024, 1280, 1440, 1920];

const results = [];
async function step(name, fn) {
  try {
    const info = await fn();
    results.push(true);
    console.log(`  ✓ ${name}${info ? ` — ${info}` : ''}`);
  } catch (error) {
    results.push(false);
    console.error(`  ✗ ${name}`);
    console.error(String(error).split('\n').slice(0, 5).join('\n'));
  }
}

const luminance = (rgb) => {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};
const parseRgb = (value) => (value.match(/\d+(\.\d+)?/g) ?? []).slice(0, 3).map(Number);

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 950 } });
const page = await context.newPage();
await page.goto(BASE_URL, { waitUntil: 'networkidle' });
// smooth scrolling is a UX choice, not a measurement aid
await page.addStyleTag({ content: 'html{scroll-behavior:auto !important}' });

// Seed some data so the dashboard is representative
await page.evaluate(() => {
  localStorage.setItem(
    'my-web-vault:v1',
    JSON.stringify({
      version: 1,
      categories: ['AI', 'Design', 'Development', 'Shopify', 'Social Media', 'Marketing', 'Research', 'Tools', 'Other'],
      websites: [
        {
          id: 'a1',
          name: 'OpenAI',
          url: 'https://openai.com/',
          domain: 'openai.com',
          category: 'AI',
          description: 'Chat models, API docs and playground',
          favorite: true,
          createdAt: 1,
          updatedAt: 1,
        },
        {
          id: 'a2',
          name: 'Figma',
          url: 'https://figma.com/',
          domain: 'figma.com',
          category: 'Design',
          description: 'Design, prototype and hand off in one place',
          favorite: false,
          createdAt: 2,
          updatedAt: 2,
        },
        {
          id: 'a3',
          name: 'GitHub',
          url: 'https://github.com/',
          domain: 'github.com',
          category: 'Development',
          description: 'Repos, issues and actions',
          favorite: false,
          createdAt: 3,
          updatedAt: 3,
        },
      ],
    }),
  );
});
await page.reload({ waitUntil: 'networkidle' });
await page.addStyleTag({ content: 'html{scroll-behavior:auto !important}' });

await step('webfonts (Space Grotesk + Inter) actually load', async () => {
  const fonts = await page.evaluate(async () => {
    await document.fonts.ready;
    return {
      space: document.fonts.check('600 40px "Space Grotesk"'),
      inter: document.fonts.check('400 16px Inter'),
      h1: getComputedStyle(document.querySelector('h1')).fontFamily,
      body: getComputedStyle(document.body).fontFamily,
    };
  });
  assert.ok(fonts.space, 'Space Grotesk did not load');
  assert.ok(fonts.inter, 'Inter did not load');
  assert.match(fonts.h1, /Space Grotesk/);
  assert.match(fonts.body, /Inter/);
  return fonts.h1.split(',')[0];
});

await step('page background is pure white', async () => {
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  assert.equal(bg, 'rgb(255, 255, 255)');
  return bg;
});

await step('no horizontal overflow at any breakpoint', async () => {
  const bad = [];
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(250);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    if (overflow > 1) bad.push(`${width}px→+${overflow}px`);
  }
  assert.deepEqual(bad, [], `overflow at: ${bad.join(', ')}`);
  return `${WIDTHS.length} widths clean`;
});

await step('body text meets WCAG AA contrast on white', async () => {
  const samples = await page.evaluate(() => {
    const pick = (selector) => {
      const el = document.querySelector(selector);
      return el ? getComputedStyle(el).color : null;
    };
    return {
      body: pick('p'),
      muted: pick('.text-ink-muted') ?? pick('#vault p'),
      heading: pick('h1'),
    };
  });
  const report = [];
  for (const [key, color] of Object.entries(samples)) {
    if (!color) continue;
    const ratio = contrast(parseRgb(color), [255, 255, 255]);
    assert.ok(ratio >= 4.5, `${key} contrast ${ratio.toFixed(2)} is below 4.5`);
    report.push(`${key} ${ratio.toFixed(1)}:1`);
  }
  return report.join(', ');
});

await step('white-on-brand buttons meet AA contrast', async () => {
  const ratio = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('a,button')].find((el) =>
      el.className.includes('btn-gradient') || el.className.includes('btn-primary'),
    );
    return getComputedStyle(btn).backgroundColor;
  });
  // gradient buttons fall back to a dark/violet base — check the darkest stop
  const violet = [124, 58, 237];
  const ink = [10, 10, 11];
  const c1 = contrast([255, 255, 255], violet);
  const c2 = contrast([255, 255, 255], ink);
  assert.ok(c1 >= 4.5, `violet button contrast ${c1.toFixed(2)}`);
  assert.ok(c2 >= 4.5, `ink button contrast ${c2.toFixed(2)}`);
  return `violet ${c1.toFixed(1)}:1, ink ${c2.toFixed(1)}:1 (${ratio})`;
});

await step('all interactive controls have an accessible name', async () => {
  const unnamed = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('button, a, input, select, textarea')) {
      const label =
        el.getAttribute('aria-label') ||
        el.getAttribute('title') ||
        el.textContent?.trim() ||
        (el.labels && el.labels.length ? el.labels[0].textContent?.trim() : '') ||
        (el.id && document.querySelector(`label[for="${el.id}"]`)?.textContent?.trim());
      if (!label) out.push(`${el.tagName}.${el.className.toString().slice(0, 40)}`);
    }
    return out;
  });
  assert.deepEqual(unnamed, []);
});

await step('interactive targets are at least 24x24 on mobile', async () => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#vault').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const small = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('button, a[href], select')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      // WCAG 2.2 AA "Target Size (Minimum)" = 24x24 CSS px
      if (r.height < 24 || r.width < 24) {
        out.push(`${el.tagName} ${Math.round(r.width)}x${Math.round(r.height)} "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 24)}"`);
      }
    }
    return out;
  });
  assert.deepEqual(small, [], `small targets: ${small.join(' | ')}`);
  await page.setViewportSize({ width: 1440, height: 950 });
});

await step('no text rendered below 11px', async () => {
  const tiny = await page.evaluate(() => {
    const out = new Set();
    for (const el of document.querySelectorAll('p, span, li, a, button, h1, h2, h3, label, input, select')) {
      if (!el.textContent?.trim()) continue;
      const size = parseFloat(getComputedStyle(el).fontSize);
      if (size < 11) out.add(`${el.tagName} ${size}px "${el.textContent.trim().slice(0, 20)}"`);
    }
    return [...out];
  });
  assert.deepEqual(tiny, [], tiny.join(' | '));
});

await step('heading hierarchy is sane (single h1, h2 per section)', async () => {
  const headings = await page.evaluate(() =>
    [...document.querySelectorAll('h1,h2,h3')].map((h) => ({ level: Number(h.tagName[1]), text: h.textContent.trim().slice(0, 34) })),
  );
  assert.equal(headings.filter((h) => h.level === 1).length, 1, 'more than one h1');
  assert.ok(headings.filter((h) => h.level === 2).length >= 5, 'sections lost their h2');
  return `${headings.length} headings`;
});

await step('cards use soft radius + elevation', async () => {
  const style = await page.evaluate(() => {
    const card = document.querySelector('#vault article > div');
    const cs = getComputedStyle(card);
    return { radius: cs.borderRadius, shadow: cs.boxShadow, background: cs.backgroundColor };
  });
  assert.ok(parseFloat(style.radius) >= 16, `radius too small: ${style.radius}`);
  assert.notEqual(style.shadow, 'none');
  return `${style.radius}, shadow ok`;
});

await step('glass surfaces use backdrop blur', async () => {
  const blur = await page.evaluate(() => {
    const el = document.querySelector('.glass, .glass-strong');
    return getComputedStyle(el).backdropFilter || getComputedStyle(el).webkitBackdropFilter;
  });
  assert.match(blur, /blur/);
  return blur;
});

await step('hover lifts a website card', async () => {
  // the transform lives on the inner card surface
  const card = page.locator('#vault div.grid').last().locator('article > div').first();
  await card.scrollIntoViewIfNeeded();
  const before = await card.boundingBox();
  await page.locator('#vault div.grid').last().locator('article').first().hover();
  await page.waitForTimeout(450);
  const after = await card.boundingBox();
  assert.ok(after.y < before.y, `card did not lift (${before.y} → ${after.y})`);
  return `lift ${(before.y - after.y).toFixed(1)}px`;
});

await step('focus ring is visible on keyboard focus', async () => {
  await page.keyboard.press('Tab');
  const outline = await page.evaluate(() => {
    const el = document.activeElement;
    const cs = getComputedStyle(el);
    return { tag: el.tagName, width: cs.outlineWidth, style: cs.outlineStyle };
  });
  assert.notEqual(outline.style, 'none');
  return `${outline.tag} outline ${outline.width} ${outline.style}`;
});

await step('favicon images are decorative and lazy-loaded', async () => {
  const imgs = await page.evaluate(() =>
    [...document.querySelectorAll('img')].map((i) => ({ alt: i.getAttribute('alt'), loading: i.loading })),
  );
  assert.ok(imgs.length > 0, 'no favicons rendered');
  assert.ok(imgs.every((i) => i.alt === ''), 'favicons must be decorative (alt="")');
  return `${imgs.length} favicons`;
});

await step('sections do not overlap vertically', async () => {
  const boxes = await page.evaluate(() =>
    [...document.querySelectorAll('main > section')].map((s) => {
      const r = s.getBoundingClientRect();
      return { id: s.id || s.className.slice(0, 12), top: r.top + window.scrollY, bottom: r.bottom + window.scrollY };
    }),
  );
  for (let i = 1; i < boxes.length; i += 1) {
    assert.ok(boxes[i].top >= boxes[i - 1].bottom - 2, `${boxes[i].id} overlaps ${boxes[i - 1].id}`);
  }
  return `${boxes.length} sections stacked`;
});

/* ============================ motion layer ============================ */
await step('every reveal element finishes revealed after a full scroll', async () => {
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.6;
    for (let y = 0; y <= document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 90));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(1400);
  const stuck = await page.evaluate(() =>
    [...document.querySelectorAll('[data-rv]')]
      .filter((el) => !el.classList.contains('rv-in'))
      .map((el) => el.className || el.tagName),
  );
  assert.deepEqual(stuck, [], `never revealed: ${stuck.join(' | ')}`);
  const invisible = await page.evaluate(() =>
    [...document.querySelectorAll('[data-rv]')].filter((el) => +getComputedStyle(el).opacity < 0.99).length,
  );
  assert.equal(invisible, 0);
  return `${await page.evaluate(() => document.querySelectorAll('[data-rv]').length)} reveals`;
});

await step('hero preview floats and parallaxes with the pointer', async () => {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  const panel = page.locator('[data-parallax]').first();
  const anim = await panel.evaluate((el) => {
    const wrap = el.parentElement;
    return getComputedStyle(wrap).animationName + '/' + getComputedStyle(wrap).animationDuration;
  });
  assert.notEqual(anim.split('/')[0], 'none', 'no float animation on the hero panel');

  await page.mouse.move(200, 300);
  await page.waitForTimeout(250);
  const before = await panel.evaluate((el) => getComputedStyle(el).transform);
  await page.mouse.move(1300, 800);
  await page.waitForTimeout(350);
  const after = await panel.evaluate((el) => getComputedStyle(el).transform);
  assert.notEqual(before, after, 'parallax did not respond to the pointer');
  return anim;
});

await step('cursor tracks the pointer and grows over controls', async () => {
  const dot = page.locator('#cursor');
  await page.mouse.move(400, 400);
  await page.waitForTimeout(300);
  const idle = await dot.evaluate((el) => ({ w: el.getBoundingClientRect().width, t: el.style.transform }));
  assert.ok(Math.abs(idle.w - 26) < 1, `idle cursor is ${idle.w}px`);
  assert.match(idle.t, /translate3d/);

  await page.locator('#vault').scrollIntoViewIfNeeded();
  const button = page.getByRole('button', { name: 'Add Website' }).first();
  const box = await button.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(550);
  const active = await dot.evaluate((el) => ({
    w: el.getBoundingClientRect().width,
    act: el.classList.contains('act'),
  }));
  assert.ok(active.act, 'cursor did not enter its active state');
  assert.ok(active.w > 40, `active cursor only grew to ${active.w}px`);
  return `26px → ${Math.round(active.w)}px`;
});

await step('card spotlight follows the pointer inside the card', async () => {
  const card = page.locator('#vault div.grid').last().locator('article > div').first();
  await card.scrollIntoViewIfNeeded();
  const box = await card.boundingBox();
  await page.mouse.move(box.x + 12, box.y + 12);
  await page.waitForTimeout(200);
  const a = await card.evaluate((el) => [el.style.getPropertyValue('--mx'), el.style.getPropertyValue('--my')]);
  await page.mouse.move(box.x + box.width - 12, box.y + box.height - 12);
  await page.waitForTimeout(200);
  const b = await card.evaluate((el) => [el.style.getPropertyValue('--mx'), el.style.getPropertyValue('--my')]);
  assert.notEqual(a.join(), b.join());
  assert.ok(parseFloat(b[0]) > parseFloat(a[0]) && parseFloat(b[1]) > parseFloat(a[1]));
  return `--mx ${a[0]} → ${b[0]}`;
});

await step('grain + vignette overlays are painted and inert', async () => {
  const fx = await page.evaluate(() => {
    const g = document.getElementById('grain');
    const v = document.getElementById('vignette');
    return {
      grain: getComputedStyle(g).backgroundImage.startsWith('url("data:image/png'),
      grainFixed: getComputedStyle(g).position,
      vignette: getComputedStyle(v).backgroundImage.startsWith('radial-gradient('),
      pointer: getComputedStyle(g).pointerEvents + '/' + getComputedStyle(v).pointerEvents,
    };
  });
  assert.equal(fx.grain, true, 'grain tile was never painted');
  assert.equal(fx.grainFixed, 'fixed');
  assert.equal(fx.vignette, true, 'vignette missing');
  assert.equal(fx.pointer, 'none/none');
  return 'noise tile + radial vignette';
});

await step('nav hides going down and returns going up', async () => {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  const shell = page.locator('header');
  assert.equal(await shell.evaluate((el) => el.classList.contains('hide')), false);

  await page.evaluate(() => window.scrollTo(0, 2200));
  await page.waitForTimeout(500);
  assert.equal(await shell.evaluate((el) => el.classList.contains('hide')), true, 'nav did not hide');

  await page.evaluate(() => window.scrollTo(0, 1500));
  await page.waitForTimeout(500);
  assert.equal(await shell.evaluate((el) => el.classList.contains('hide')), false, 'nav did not come back');
  return 'hide ↓ / show ↑';
});

await step('nav progress bar tracks the scroll', async () => {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  const bar = page.locator('.nav-progress');
  const at0 = await bar.evaluate((el) => el.style.getPropertyValue('--sp'));
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(500);
  const atEnd = await bar.evaluate((el) => el.style.getPropertyValue('--sp'));
  assert.ok(parseFloat(atEnd) > 95, `progress only reached ${atEnd}`);
  assert.ok(parseFloat(at0) < 1);
  return `${at0} → ${atEnd}`;
});

await step('section rail is desktop-only and jumps to a section', async () => {
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.waitForTimeout(200);
  const rail = page.locator('.rail');
  assert.ok(await rail.isVisible(), 'rail hidden on desktop');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await rail.locator('button').nth(2).click();
  await page.waitForTimeout(900);
  const atVault = await page.evaluate(() => {
    const el = document.getElementById('vault');
    return Math.abs(el.getBoundingClientRect().top) < 160;
  });
  assert.ok(atVault, 'rail button did not reach the dashboard');

  await page.setViewportSize({ width: 900, height: 900 });
  await page.waitForTimeout(250);
  assert.equal(await rail.isVisible(), false, 'rail should be hidden below xl');
  await page.setViewportSize({ width: 1440, height: 950 });
  return 'visible ≥1280, clickable, hidden below';
});

await step('hero stands down as the page leaves it', async () => {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  const hero = page.locator('[data-hero-fade]').first();
  const rest = await hero.evaluate((el) => el.style.opacity);
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 0.6));
  await page.waitForTimeout(400);
  const gone = await hero.evaluate((el) => el.style.opacity);
  assert.ok(parseFloat(rest) === 1 || rest === '', `hero at rest is "${rest}"`);
  assert.ok(parseFloat(gone) < 0.2, `hero only faded to ${gone}`);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  const back = await hero.evaluate((el) => el.style.opacity);
  assert.ok(parseFloat(back) > 0.95, 'hero did not come back at the top');
  return `1 → ${Number(gone).toFixed(2)} → 1`;
});

/* ========================== voice assistant ========================== */
const PANEL = 'section[aria-label="Vault Voice assistant"]';

await step('assistant docks, shrinks to an icon, then opens a panel', async () => {
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.evaluate(() => window.scrollTo(0, 900));
  await page.waitForTimeout(700);

  const bar = page.getByRole('button', { name: /Need a hand/ });
  await bar.waitFor();
  const barBox = await bar.boundingBox();
  assert.ok(barBox.x + barBox.width <= 1440, 'the docked bar hangs off the right edge');
  assert.ok(barBox.y + barBox.height <= 950, 'the docked bar hangs off the bottom');

  await page.getByRole('button', { name: 'Collapse assistant to an icon' }).click();
  await page.waitForTimeout(400);
  const icon = page.getByRole('button', { name: 'Open Vault Voice assistant' });
  const iconBox = await icon.boundingBox();
  assert.ok(iconBox.width >= 44 && iconBox.height >= 44, `icon is ${iconBox.width}x${iconBox.height}`);

  await icon.click();
  await page.locator(PANEL).waitFor();
  return `bar → ${Math.round(iconBox.width)}px icon → panel`;
});

await step('every control inside the open assistant is named', async () => {
  const unnamed = await page.evaluate((selector) => {
    const panel = document.querySelector(selector);
    const out = [];
    for (const el of panel.querySelectorAll('button, a, input, select, textarea')) {
      const label =
        el.getAttribute('aria-label') ||
        el.getAttribute('title') ||
        el.textContent?.trim() ||
        (el.id && document.querySelector(`label[for="${el.id}"]`)?.textContent?.trim());
      if (!label) out.push(`${el.tagName}.${String(el.className).slice(0, 40)}`);
    }
    return out;
  }, PANEL);
  assert.deepEqual(unnamed, [], `unnamed: ${unnamed.join(' | ')}`);
  return `${await page.locator(`${PANEL} button`).count()} controls`;
});

await step('the assistant fits the viewport at every breakpoint', async () => {
  const report = [];
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(320);
    const box = await page.locator(PANEL).boundingBox();
    assert.ok(box.x >= 0 && box.x + box.width <= width + 1, `panel overflows at ${width}px`);
    assert.ok(box.y >= 0 && box.y + box.height <= 901, `panel taller than the viewport at ${width}px`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert.ok(overflow <= 0, `page scrolls sideways by ${overflow}px at ${width}px`);
    report.push(`${width}✓`);
  }
  await page.setViewportSize({ width: 1440, height: 950 });
  return report.join(' ');
});

await step('assistant answers link out safely', async () => {
  const panel = page.locator(PANEL);
  await panel.getByRole('button', { name: 'Open prompt input' }).click({ timeout: 3000 }).catch(() => {});
  const prompt = panel.getByPlaceholder('Ask for a website…');
  await prompt.fill('design tools');
  await prompt.press('Enter');
  await page.waitForTimeout(600);

  const links = await panel
    .locator('[data-bot-reply]')
    .last()
    .locator('a')
    .evaluateAll((nodes) =>
      nodes.map((n) => ({
        href: n.getAttribute('href'),
        rel: n.getAttribute('rel'),
        target: n.getAttribute('target'),
      })),
    );

  assert.ok(links.length >= 1, 'the answer offered nothing to open');
  for (const link of links) {
    assert.match(link.href, /^https:\/\//, `unsafe href: ${link.href}`);
    assert.equal(link.rel, 'noopener noreferrer');
    assert.equal(link.target, '_blank');
  }
  const cards = await panel.locator('[data-bot-reply]').last().locator('article').count();
  return `${cards} picks · ${links.length} safe links`;
});

await step('the assistant never blocks the page behind it', async () => {
  const blocking = await page.evaluate((selector) => {
    const panel = document.querySelector(selector);
    const rect = panel.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return panel.contains(hit); // the panel should own its own pixels, nothing more
  }, PANEL);
  assert.ok(blocking, 'the panel is not receiving its own clicks');
  const outside = await page.evaluate(() => {
    const el = document.elementFromPoint(20, 20);
    return el ? el.tagName + '.' + String(el.className).slice(0, 24) : 'none';
  });
  assert.ok(!outside.includes('z-[85]'), 'an invisible layer is covering the page');
  return 'clicks land where they look like they land';
});

await browser.close();

const failed = results.filter((ok) => !ok).length;
console.log(`\n${results.length - failed}/${results.length} audit checks passed`);
process.exit(failed ? 1 : 0);
