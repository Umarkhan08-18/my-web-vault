# My Web Vault

**Your internet — organized.** A personal website launcher: save the sites you use every day,
organize them by category and favorites, and open any of them in one click.

It’s not another bookmark page — it’s your personal web command center.

---

## Quick start

```bash
npm install
npm run dev      # http://localhost:3000
```

Production build:

```bash
npm run build && npm start
```

`collected-websites.json` is a ready-made backup of the first batch of collected sites
(Emailnator, LCN, AutoAE, Znole Technology, Pinokio, TextMatchCut, FreeStudy). Load it
with **Dashboard → Import** — it merges in and skips anything you already saved.

> `node_modules` is not committed. If the sandbox was reset, run `npm install` again.

---

## What it actually does

| Feature | Behaviour |
| --- | --- |
| **Add Website** | Name + URL + category + optional description. Invalid URLs are rejected, missing `https://` is added automatically. |
| **Website cards** | Favicon (with a gradient letter fallback), name, domain, category badge, description, Open / Favorite / Edit / Delete. |
| **Click-to-open** | The whole card and the *Open Website* button open the site in a new tab with `rel="noopener noreferrer"`. |
| **Search** | Live match on name, domain, description and category. `⌘K` / `Ctrl+K` focuses the field. |
| **Categories** | AI, Design, Development, Shopify, Social Media, Marketing, Research, Tools, Other — fully editable (add, rename inline, delete; deleting moves sites to “Other”). |
| **Favorites** | Star any card; a Favorites section and filter appear automatically. |
| **Edit / Delete** | Edit re-opens the same modal prefilled; delete asks for confirmation first. |
| **Sorting** | Recently Added · Alphabetical · Favorites First · Category. |
| **Persistence** | Saved in `localStorage` under `my-web-vault:v1` — survives refresh and restarts. |
| **Import / Export** | One-click JSON export, and JSON import that merges new entries and skips duplicates. |

| **Vault Voice** | A docked “Need a hand?” strip that shrinks to a floating icon and opens an assistant that recommends websites by voice or text — see below. |

Keyboard: `⌘K` search · `Enter` submits forms · `Esc` closes any dialog.

### Vault Voice — the assistant

A voice bot that answers questions about websites instead of just listing them.

| | |
| --- | --- |
| **Three shapes** | docked “Need a hand?” strip while you scroll → collapses to a 48px floating icon → opens a composer with a running transcript |
| **Ask out loud** | the mic uses the Web Speech API; if the browser has no recognition or the mic is blocked it says so instead of faking a transcript |
| **Reads the answer** | `speechSynthesis` speaks every reply, with a mute toggle and a per-card *Listen* button |
| **Two corpora** | your vault first (a site you saved outranks a stranger's entry), then a curated catalogue of ~70 well-known sites with real descriptions |
| **Scoring** | name, domain, category, description and tag matches, a favourite boost, a recency boost for “latest”, and an editorial prominence weight so “design tools” answers *Figma*, not *spline.design* |
| **Honest empty state** | no match is admitted as no match, with fallback picks offered |
| **One tap to keep it** | every recommendation carries *Open* (`rel="noopener noreferrer"`) and *Save to vault*, which files it under the right category |

There is no LLM behind it and nothing leaves the browser: `lib/recommend.ts` is a small,
unit-tested ranking engine, and `lib/catalog.ts` is a hand-written catalogue. Answers are
therefore instant, offline and never invented.

The composer is `components/ui/ai-chat-input.tsx` — a shadcn-style prompt box (morphing
labels, spring physics, live waveform, shared-element gallery) wired into this project.
It is loaded lazily with the panel, so the landing page's first load stays small.

### The liquid layer

The interface is meant to feel like it is floating slightly above the page:

| Behaviour | How | Opt-in |
| --- | --- | --- |
| Scroll reveals | `IntersectionObserver` adds `.rv-in` to `[data-rv]`, staggered by sibling index | `data-rv="up\|fade\|left\|right\|scale"` |
| Word + line masks | Display type uncovers from below its own mask, word by word | `<RevealWords>` / `<MaskLine>` |
| Float | Three slow drift loops on separate clocks, paused on hover | `.float-a .float-b .float-c` |
| Pointer parallax | `--px/--py` written from the pointer, depth per element | `data-parallax="0…2.6"` |
| Magnetic controls | Buttons lean a few pixels toward the cursor | `data-magnet` |
| Cursor spotlight | A light source follows the pointer across any surface | `data-spot` |
| Custom cursor | A ring that trails the pointer and swells over anything clickable | automatic |
| Hero stand-down | The hero's floating panel dissolves as the page leaves it | `data-hero-fade="0…1"` |
| Film grain + vignette | One generated 180px noise tile, repeated | automatic |
| Chapter rail | Fixed section dots, desktop only | automatic |

Every one of these is additive and skipped under `prefers-reduced-motion`. Nothing is
hidden unless the document carries `.js-motion`, and a `<noscript>` block reveals
everything if the script never runs — motion is never allowed to cost content.

---

## Architecture

```
app/
  layout.tsx        fonts (Space Grotesk + Inter), metadata, accent stripe, icon.svg
  page.tsx          server component: composes the landing + dashboard
  globals.css       design system (glass, dot-grid, rainbow, orbs, neon, sheen)
components/
  ui/ai-chat-input.tsx  the prompt composer (shadcn-style, lazily loaded)
  VoiceBot.tsx          the launcher: docked strip, floating icon, state
  VoiceBotPanel.tsx     the open assistant (transcript + composer)
  VaultProvider.tsx single source of truth: state, localStorage, import/export, toasts
  Dashboard.tsx     search · filters · sort · sections · empty states
  WebsiteCard.tsx   favicon, stretched link, favorite/edit/delete actions
  WebsiteFormModal / CategoryManagerModal / ConfirmDialog / Modal
  Hero · Features · BentoStats · TerminalShowcase · WorkspaceTiers · DemoTestimonials · Footer
lib/
  url.ts            untrusted-URL normalisation (http/https only, rebuilt from parsed parts)
  vault.ts          pure search / filter / sort + sanitisers for stored & imported data
  types.ts          shared types, default categories
  catalog.ts        ~70 curated websites with real descriptions, tags and prominence
  recommend.ts      the assistant's ranking engine (pure, unit tested)
  utils.ts          shadcn's `cn()` helper (clsx + tailwind-merge)
test/
  logic.test.ts     25 unit tests: URL/vault helpers + the recommendation engine
  e2e.mjs           36 browser checks driving the full flow, voice bot included
  audit.mjs         29 checks: design, a11y, every motion behaviour, the assistant
```

**shadcn/ui:** the project now follows the shadcn conventions — `components/ui/` for
primitives, `lib/utils.ts` for `cn()`, and CSS-variable design tokens in `app/globals.css`
(Tailwind 3 style: HSL triplets consumed as `hsl(var(--token))`).

**Security:** user URLs are treated as untrusted. Only `http:` and `https:` survive
normalisation, control characters are stripped, and every link is rendered with
`rel="noopener noreferrer"`. All user text is escaped by React (no `dangerouslySetInnerHTML`).
Nothing is ever sent to a server — data lives in this browser only.

---

## Tests

```bash
npm run test            # logic + audit + e2e (dev server must be running)
npm run test:logic      # pure functions only, no browser needed
npm run test:audit      # design + accessibility audit
npm run test:e2e        # full user flow in Chromium
```

Current status: **25/25 logic · 29/29 audit · 36/36 browser checks passing**, plus a clean
`next build` (121 kB First Load JS, assistant lazy-loaded) with no type errors and zero
console errors during the entire flow.

Browser tests need Chromium once: `npx playwright install chromium`.

---

## Design language

Pure white canvas · purple + black accents · blue side icons · rainbow gradients on
headlines and hover rings · **liquid-glass surfaces that drift on slow float loops** ·
dot-grid fields · radial orbs · soft 24px radii · layered shadows · sparkles and animated
arrows · pastel chips · controlled neon on interaction · **word-by-word headline reveals** ·
**a cursor that trails the pointer and swells over anything clickable** · **a light source
that follows the pointer across every card** · **film grain and a vignette** · bento grid ·
terminal window (decorative) · three feature cards in one row · three “workspace style”
tiers (a layout demo, nothing for sale) · testimonials clearly labelled as fictional
placeholder copy · **a floating voice assistant that lives in the corner** · no skeleton
loaders, no privacy-policy page.

---

## Renaming the app

The name lives in three places: `components/TopNav.tsx`, `components/Footer.tsx`, and
`app/layout.tsx` (metadata). The storage key is `VAULT_STORAGE_KEY` in `lib/types.ts` —
change it if you want a fresh vault.
