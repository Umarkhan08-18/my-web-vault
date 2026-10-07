'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Clock,
  Download,
  LayoutGrid,
  Search,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';

import { AddWebsiteTrigger, OPEN_ADD_MODAL_EVENT } from '@/components/AddWebsiteTrigger';
import { CategoryManagerModal } from '@/components/CategoryManagerModal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useVault } from '@/components/VaultProvider';
import { WebsiteCard } from '@/components/WebsiteCard';
import { WebsiteFormModal } from '@/components/WebsiteFormModal';
import type { SortKey, Website } from '@/lib/types';
import { filterWebsites, selectVisibleWebsites, sortWebsites } from '@/lib/vault';

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: 'recent', label: 'Recently Added' },
  { value: 'alpha', label: 'Alphabetical (A–Z)' },
  { value: 'favorites', label: 'Favorites First' },
  { value: 'category', label: 'Category' },
];

const SELECT_ARROW = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%235B5B66' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 14px center',
  backgroundSize: '16px',
};

const SAMPLES: Array<{ name: string; url: string; category: string; description: string }> = [
  { name: 'OpenAI', url: 'https://openai.com', category: 'AI', description: 'Chat models, API docs and playground' },
  { name: 'Figma', url: 'https://figma.com', category: 'Design', description: 'Design, prototype and hand off' },
  { name: 'GitHub', url: 'https://github.com', category: 'Development', description: 'Repos, issues and actions' },
  { name: 'Shopify Admin', url: 'https://admin.shopify.com', category: 'Shopify', description: 'Store dashboard' },
  { name: 'Perplexity', url: 'https://perplexity.ai', category: 'Research', description: 'Answers with sources' },
  { name: 'Excalidraw', url: 'https://excalidraw.com', category: 'Tools', description: 'Quick sketches and diagrams' },
];

export function Dashboard() {
  const { hydrated, websites, categories, addWebsite, deleteWebsite, toggleFavorite, importJson, exportJson, notify } =
    useVault();

  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sort, setSort] = useState<SortKey>('recent');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Website | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Website | null>(null);

  const searchRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // ⌘K / Ctrl+K jumps to search
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Any "Add Website" button on the page opens this modal
  useEffect(() => {
    const onOpen = () => {
      setEditing(null);
      setFormOpen(true);
    };
    window.addEventListener(OPEN_ADD_MODAL_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_ADD_MODAL_EVENT, onOpen);
  }, []);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of websites) {
      map[item.category] = (map[item.category] ?? 0) + 1;
    }
    return map;
  }, [websites]);

  const visible = useMemo(
    () => selectVisibleWebsites(websites, { query, category: categoryFilter, sort }),
    [websites, query, categoryFilter, sort],
  );

  const favorites = useMemo(
    () => sortWebsites(filterWebsites(websites, { query, category: 'all', favoritesOnly: true }), 'recent'),
    [websites, query],
  );

  const recentPicks = useMemo(
    () =>
      [...websites]
        .filter((item) => !item.favorite)
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 5),
    [websites],
  );

  const showFavoritesSection = favorites.length > 0 && (categoryFilter === 'all' || categoryFilter === 'favorites');
  const showRecentRow = categoryFilter === 'all' && !query.trim() && websites.length > 4;

  const isEmpty = hydrated && websites.length === 0;
  const noResults = hydrated && websites.length > 0 && visible.length === 0;

  const handleEdit = (website: Website) => {
    setEditing(website);
    setFormOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!pendingDelete) return;
    deleteWebsite(pendingDelete.id);
    notify(`Deleted “${pendingDelete.name}”`, 'danger');
    setPendingDelete(null);
  };

  const handleExport = () => {
    if (websites.length === 0) {
      notify('Nothing to export yet — add a website first.', 'info');
      return;
    }
    exportJson();
    notify(`Exported ${websites.length} website${websites.length === 1 ? '' : 's'} as JSON`);
  };

  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const result = importJson(text);
      if ('error' in result) {
        notify(result.error, 'danger');
      } else {
        const parts = [`Imported ${result.added} website${result.added === 1 ? '' : 's'}`];
        if (result.skipped > 0) parts.push(`${result.skipped} duplicate${result.skipped === 1 ? '' : 's'} skipped`);
        notify(parts.join(' · '));
      }
    } catch {
      notify('That file couldn’t be read.', 'danger');
    }
  };

  const loadSamples = () => {
    let added = 0;
    for (const sample of SAMPLES) {
      const result = addWebsite({ ...sample, description: sample.description });
      if (result.ok) added += 1;
    }
    if (added > 0) notify(`Added ${added} example websites`);
    else notify('Examples are already in your vault.', 'info');
  };

  const allHeading =
    categoryFilter === 'favorites' ? 'Favorites' : categoryFilter === 'all' ? 'All websites' : categoryFilter;

  return (
    <section id="vault" className="relative scroll-mt-20 py-14 sm:py-16">
      <div
        className="orb left-1/2 top-0 h-[300px] w-[min(520px,100vw)] -translate-x-1/2 bg-violet-brand/[0.07]"
        aria-hidden
      />

      <div className="section-shell relative">
        {/* ---------------- Section header ---------------- */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between" data-rv="up">
          <div>
            <span className="eyebrow">
              <LayoutGrid className="h-3.5 w-3.5 text-blue-icon" aria-hidden />
              Dashboard
            </span>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.03em] sm:text-[2.5rem]">
              Your Web Vault
            </h2>
            <p className="mt-2 max-w-xl text-[15.5px] leading-relaxed text-ink-muted">
              Every saved site launches in a new tab — search it, star it, open it. Your vault stays exactly where you
              left it.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <AddWebsiteTrigger label="Add Website" className="btn-gradient btn-liquid px-4 py-2.5" />
            <button type="button" onClick={handleExport} className="btn-ghost px-3.5 py-2.5" title="Export as JSON">
              <Download className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="btn-ghost px-3.5 py-2.5"
              title="Import from JSON"
            >
              <Upload className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Import</span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              aria-label="Import websites from a JSON file"
              tabIndex={-1}
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleImport(file);
                event.target.value = '';
              }}
            />
          </div>
        </div>

        {/* ---------------- Toolbar ---------------- */}
        <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-center" data-rv="up">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
              aria-hidden
            />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, domain or description…"
              aria-label="Search websites"
              className="field py-3 pl-11 pr-24"
            />
            <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
              {query ? (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    searchRef.current?.focus();
                  }}
                  aria-label="Clear search"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-muted transition hover:bg-black/5 hover:text-ink"
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </button>
              ) : null}
              <span className="hidden rounded-md bg-black/[0.04] px-1.5 py-0.5 font-mono text-[11px] text-ink-muted md:block">
                ⌘K
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative">
              <SlidersHorizontal
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
                aria-hidden
              />
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as SortKey)}
                aria-label="Sort websites"
                className="field appearance-none py-3 pl-10 pr-9 text-[14px]"
                style={SELECT_ARROW}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setCategoryModalOpen(true)}
              className="btn-ghost px-3.5 py-3"
              title="Manage categories"
            >
              <Settings2 className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Categories</span>
            </button>
          </div>
        </div>

        {/* ---------------- Category filters ---------------- */}
        <div
          className="no-scrollbar -mx-5 mt-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:px-0"
          data-rv="up"
        >
          {[
            { id: 'all', label: 'All', count: websites.length, emoji: '🗂️' },
            { id: 'favorites', label: 'Favorites', count: websites.filter((w) => w.favorite).length, emoji: '⭐' },
            ...categories.map((name) => ({
              id: name,
              label: name,
              count: counts[name] ?? 0,
              emoji: undefined as string | undefined,
            })),
          ].map((pill) => {
            const active = categoryFilter === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => setCategoryFilter(pill.id)}
                aria-pressed={active}
                className={`pill shrink-0 ${
                  active
                    ? 'border-transparent bg-ink text-white shadow-soft'
                    : 'border-black/[0.08] bg-white text-ink-muted hover:border-black/20 hover:text-ink'
                }`}
              >
                {pill.emoji ? (
                  <span aria-hidden>{pill.emoji}</span>
                ) : null}
                {pill.label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                    active ? 'bg-white/15 text-white' : 'bg-black/[0.05] text-ink-muted'
                  }`}
                >
                  {pill.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ---------------- Empty state ---------------- */}
        {isEmpty ? (
          <div className="card-surface relative mt-8 animate-slide-up overflow-hidden px-6 py-16 text-center">
            <div className="dot-grid dot-grid-fade pointer-events-none absolute inset-0 opacity-60" aria-hidden />
            <div className="orb left-1/2 top-0 h-40 w-72 -translate-x-1/2 bg-violet-brand/15" aria-hidden />
            <div className="relative mx-auto max-w-md">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-pastel-lavender to-pastel-sky text-2xl shadow-soft">
                <span aria-hidden>🗂️</span>
              </div>
              <h3 className="mt-6 font-display text-2xl font-semibold tracking-[-0.02em]">Your web vault is empty.</h3>
              <p className="mt-3 text-[15.5px] leading-relaxed text-ink-muted">
                Add your first website and start building your personal web command center.
              </p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <AddWebsiteTrigger label="Add Website" className="btn-gradient btn-liquid px-5 py-3" />
                <button type="button" onClick={loadSamples} className="btn-ghost px-4 py-3">
                  <Sparkles className="h-4 w-4 text-violet-brand" aria-hidden />
                  Load 6 examples
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* ---------------- No search results ---------------- */}
        {noResults ? (
          <div className="card-surface mt-8 px-6 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-pastel-lavender text-xl">
              <span aria-hidden>🔍</span>
            </div>
            <h3 className="mt-5 font-display text-xl font-semibold">No matches for “{query.trim()}”</h3>
            <p className="mt-2 text-[15px] text-ink-muted">
              Try a different keyword, or clear the filters to see everything again.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setCategoryFilter('all');
                }}
                className="btn-primary"
              >
                Reset filters
              </button>
            </div>
          </div>
        ) : null}

        {/* ---------------- Favorites ---------------- */}
        {showFavoritesSection && !noResults ? (
          <div className="mt-10">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-lg font-semibold tracking-[-0.02em]">
                <span aria-hidden>⭐</span> Favorites
              </h3>
              <span className="chip bg-pastel-butter text-amber-700">{favorites.length}</span>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {favorites.map((website) => (
                <WebsiteCard
                  key={website.id}
                  website={website}
                  onEdit={handleEdit}
                  onDelete={setPendingDelete}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          </div>
        ) : null}

        {/* ---------------- Recently added (quick-launch chips) ---------------- */}
        {showRecentRow && recentPicks.length > 0 ? (
          <div className="mt-10">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-lg font-semibold tracking-[-0.02em]">
                <Clock className="mr-1 inline h-4 w-4 text-blue-icon" aria-hidden />
                Recently Added
              </h3>
            </div>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {recentPicks.map((website) => (
                <a
                  key={website.id}
                  href={website.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass group inline-flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-[14px] font-medium transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-14px_rgba(10,10,11,0.25),0_0_26px_-8px_rgba(34,211,238,0.65)]"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-violet-brand to-blue-icon text-[11px] font-bold text-white">
                    {website.name.trim()[0]?.toUpperCase() ?? '?'}
                  </span>
                  <span className="max-w-[180px] truncate">{website.name}</span>
                  <span className="text-ink/30 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-violet-brand">
                    ↗
                  </span>
                </a>
              ))}
            </div>
          </div>
        ) : null}

        {/* ---------------- All websites ---------------- */}
        {hydrated && visible.length > 0 ? (
          <div className="mt-10">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="font-display text-lg font-semibold tracking-[-0.02em]">
                  <span aria-hidden>🧭</span> {allHeading}
                </h3>
                <span className="chip bg-black/[0.05] text-ink-muted">{visible.length}</span>
              </div>
              <p className="text-[13px] text-ink-muted">
                Showing {visible.length} of {websites.length} saved website{websites.length === 1 ? '' : 's'}
              </p>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((website) => (
                <WebsiteCard
                  key={website.id}
                  website={website}
                  onEdit={handleEdit}
                  onDelete={setPendingDelete}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <WebsiteFormModal
        open={formOpen}
        editing={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onManageCategories={() => setCategoryModalOpen(true)}
      />

      <CategoryManagerModal open={categoryModalOpen} onClose={() => setCategoryModalOpen(false)} counts={counts} />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this website?"
        description={`“${pendingDelete?.name ?? ''}” will be removed from your vault. This can’t be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        onClose={() => setPendingDelete(null)}
      />
    </section>
  );
}
