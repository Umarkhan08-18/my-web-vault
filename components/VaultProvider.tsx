'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import {
  DEFAULT_CATEGORIES,
  FALLBACK_CATEGORY,
  VAULT_STORAGE_KEY,
  VAULT_VERSION,
  type VaultData,
  type Website,
} from '@/lib/types';
import { createId, sanitizeCategories, sanitizeWebsite, uniqueCategories } from '@/lib/vault';
import { normalizeUrl } from '@/lib/url';
import { ToastStack, type ToastItem } from '@/components/Toast';

export interface WebsiteInput {
  name: string;
  url: string;
  category: string;
  description: string;
}

export type ActionResult = { ok: true; item?: Website } | { ok: false; error: string };

interface VaultContextValue {
  hydrated: boolean;
  websites: Website[];
  categories: string[];
  stats: { total: number; favorites: number; categories: number };
  addWebsite: (input: WebsiteInput) => ActionResult;
  updateWebsite: (id: string, input: WebsiteInput) => ActionResult;
  deleteWebsite: (id: string) => void;
  toggleFavorite: (id: string) => void;
  addCategory: (name: string) => ActionResult;
  renameCategory: (from: string, to: string) => ActionResult;
  deleteCategory: (name: string) => ActionResult;
  importJson: (raw: string) => { added: number; skipped: number } | { error: string };
  exportJson: () => void;
  notify: (message: string, tone?: ToastItem['tone']) => void;
}

const VaultContext = createContext<VaultContextValue | null>(null);

const EMPTY_DATA: VaultData = {
  version: VAULT_VERSION,
  websites: [],
  categories: [...DEFAULT_CATEGORIES],
};

function loadFromStorage(): VaultData {
  if (typeof window === 'undefined') return EMPTY_DATA;
  try {
    const raw = window.localStorage.getItem(VAULT_STORAGE_KEY);
    if (!raw) return EMPTY_DATA;

    const parsed: unknown = JSON.parse(raw);
    const record = (parsed && typeof parsed === 'object' ? parsed : {}) as Record<string, unknown>;

    const seenIds = new Set<string>();
    const websites = (Array.isArray(record.websites) ? record.websites : [])
      .map(sanitizeWebsite)
      .filter((w): w is Website => {
        if (!w || seenIds.has(w.id)) return false;
        seenIds.add(w.id);
        return true;
      });

    const storedCategories = sanitizeCategories(record.categories);
    // Never lose a category that is still in use.
    const categories = uniqueCategories([...storedCategories, ...websites.map((w) => w.category)]);

    return { version: VAULT_VERSION, websites, categories };
  } catch {
    return EMPTY_DATA;
  }
}

export function VaultProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<VaultData>(EMPTY_DATA);
  const [hydrated, setHydrated] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastId = useRef(0);

  useEffect(() => {
    setData(loadFromStorage());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* storage full or unavailable — the UI keeps working in-memory */
    }
  }, [data, hydrated]);

  const notify = useCallback((message: string, tone: ToastItem['tone'] = 'success') => {
    const id = ++toastId.current;
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
    }, 2600);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const validateInput = (input: WebsiteInput): { ok: true; url: string; domain: string } | { ok: false; error: string } => {
    const name = input.name.trim();
    if (!name) return { ok: false, error: 'Please enter a website name.' };
    if (name.length > 120) return { ok: false, error: 'That name is a little too long (120 characters max).' };

    const normalized = normalizeUrl(input.url);
    if (!normalized.ok) return { ok: false, error: normalized.error };

    return { ok: true, url: normalized.url, domain: normalized.domain };
  };

  const addWebsite = useCallback<VaultContextValue['addWebsite']>(
    (input) => {
      const valid = validateInput(input);
      if (!valid.ok) return { ok: false, error: valid.error };

      const now = Date.now();
      const category = input.category.trim() || FALLBACK_CATEGORY;
      const item: Website = {
        id: createId(),
        name: input.name.trim(),
        url: valid.url,
        domain: valid.domain,
        category,
        description: input.description.trim().slice(0, 240),
        favorite: false,
        createdAt: now,
        updatedAt: now,
      };

      setData((current) => ({
        ...current,
        websites: [item, ...current.websites],
        categories: uniqueCategories([...current.categories, category]),
      }));

      return { ok: true, item };
    },
    [],
  );

  const updateWebsite = useCallback<VaultContextValue['updateWebsite']>((id, input) => {
    const valid = validateInput(input);
    if (!valid.ok) return { ok: false, error: valid.error };

    const category = input.category.trim() || FALLBACK_CATEGORY;
    let updated: Website | undefined;

    setData((current) => ({
      ...current,
      websites: current.websites.map((w) => {
        if (w.id !== id) return w;
        updated = {
          ...w,
          name: input.name.trim(),
          url: valid.url,
          domain: valid.domain,
          category,
          description: input.description.trim().slice(0, 240),
          updatedAt: Date.now(),
        };
        return updated;
      }),
      categories: uniqueCategories([...current.categories, category]),
    }));

    return { ok: true, item: updated };
  }, []);

  const deleteWebsite = useCallback<VaultContextValue['deleteWebsite']>((id) => {
    setData((current) => ({ ...current, websites: current.websites.filter((w) => w.id !== id) }));
  }, []);

  const toggleFavorite = useCallback<VaultContextValue['toggleFavorite']>((id) => {
    setData((current) => ({
      ...current,
      websites: current.websites.map((w) =>
        w.id === id ? { ...w, favorite: !w.favorite, updatedAt: Date.now() } : w,
      ),
    }));
  }, []);

  // Note: React state updaters are not guaranteed to run synchronously, so every
  // action below computes its result from the current snapshot before calling setData.
  const addCategory = useCallback<VaultContextValue['addCategory']>(
    (name) => {
      const clean = name.trim().slice(0, 40);
      if (!clean) return { ok: false, error: 'Please enter a category name.' };

      if (data.categories.some((c) => c.toLowerCase() === clean.toLowerCase())) {
        return { ok: false, error: 'That category already exists.' };
      }

      setData((current) => ({ ...current, categories: uniqueCategories([...current.categories, clean]) }));
      return { ok: true };
    },
    [data.categories],
  );

  const renameCategory = useCallback<VaultContextValue['renameCategory']>(
    (from, to) => {
      const clean = to.trim().slice(0, 40);
      if (!clean) return { ok: false, error: 'Category name can’t be empty.' };

      const conflict = data.categories.some(
        (c) => c.toLowerCase() === clean.toLowerCase() && c.toLowerCase() !== from.toLowerCase(),
      );
      if (conflict) return { ok: false, error: 'Another category already uses that name.' };

      setData((current) => ({
        ...current,
        categories: uniqueCategories(current.categories.map((c) => (c === from ? clean : c))),
        websites: current.websites.map((w) => (w.category === from ? { ...w, category: clean } : w)),
      }));
      return { ok: true };
    },
    [data.categories],
  );

  const deleteCategory = useCallback<VaultContextValue['deleteCategory']>((name) => {
    if (name === FALLBACK_CATEGORY) {
      return { ok: false, error: `“${FALLBACK_CATEGORY}” is the fallback category and can’t be removed.` };
    }
    setData((current) => ({
      ...current,
      categories: uniqueCategories(current.categories.filter((c) => c !== name)),
      websites: current.websites.map((w) => (w.category === name ? { ...w, category: FALLBACK_CATEGORY } : w)),
    }));
    return { ok: true };
  }, []);

  const importJson = useCallback<VaultContextValue['importJson']>((raw) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { error: 'That file isn’t valid JSON.' };
    }

    const record = (parsed && typeof parsed === 'object' ? parsed : {}) as Record<string, unknown>;
    const rows = Array.isArray(parsed) ? parsed : Array.isArray(record.websites) ? record.websites : null;
    if (!rows) return { error: 'No websites array found in that file.' };

    const incoming = rows
      .map(sanitizeWebsite)
      .filter((w): w is Website => Boolean(w));

    if (incoming.length === 0) return { error: 'No valid websites found in that file.' };

    const existingUrls = new Set(data.websites.map((w) => w.url.toLowerCase().replace(/\/+$/, '')));
    const fresh: Website[] = [];
    let skipped = 0;

    for (const item of incoming) {
      const key = item.url.toLowerCase().replace(/\/+$/, '');
      if (existingUrls.has(key)) {
        skipped += 1;
        continue;
      }
      existingUrls.add(key);
      fresh.push(item);
    }

    setData((current) => ({
      ...current,
      websites: [...fresh, ...current.websites],
      categories: uniqueCategories([
        ...current.categories,
        ...sanitizeCategories(record.categories),
        ...fresh.map((w) => w.category),
      ]),
    }));

    return { added: fresh.length, skipped };
  }, [data.websites]);

  const exportJson = useCallback(() => {
    const payload = {
      app: 'My Web Vault',
      version: VAULT_VERSION,
      exportedAt: new Date().toISOString(),
      categories: data.categories,
      websites: data.websites,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `my-web-vault-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [data]);

  const stats = useMemo(
    () => ({
      total: data.websites.length,
      favorites: data.websites.filter((w) => w.favorite).length,
      categories: new Set(data.websites.map((w) => w.category)).size,
    }),
    [data.websites],
  );

  const value = useMemo<VaultContextValue>(
    () => ({
      hydrated,
      websites: data.websites,
      categories: data.categories,
      stats,
      addWebsite,
      updateWebsite,
      deleteWebsite,
      toggleFavorite,
      addCategory,
      renameCategory,
      deleteCategory,
      importJson,
      exportJson,
      notify,
    }),
    [
      hydrated,
      data.websites,
      data.categories,
      stats,
      addWebsite,
      updateWebsite,
      deleteWebsite,
      toggleFavorite,
      addCategory,
      renameCategory,
      deleteCategory,
      importJson,
      exportJson,
      notify,
    ],
  );

  return (
    <VaultContext.Provider value={value}>
      {children}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </VaultContext.Provider>
  );
}

export function useVault(): VaultContextValue {
  const context = useContext(VaultContext);
  if (!context) throw new Error('useVault must be used inside <VaultProvider>.');
  return context;
}
