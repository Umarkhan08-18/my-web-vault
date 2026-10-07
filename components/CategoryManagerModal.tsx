'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

import { Modal } from '@/components/Modal';
import { useVault } from '@/components/VaultProvider';
import { FALLBACK_CATEGORY } from '@/lib/types';

export interface CategoryManagerModalProps {
  open: boolean;
  onClose: () => void;
  counts: Record<string, number>;
}

export function CategoryManagerModal({ open, onClose, counts }: CategoryManagerModalProps) {
  const { categories, addCategory, renameCategory, deleteCategory, notify } = useVault();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [newCategory, setNewCategory] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDrafts({});
      setNewCategory('');
      setError(null);
    }
  }, [open]);

  const commitRename = (original: string) => {
    const draft = (drafts[original] ?? original).trim();
    setDrafts(({ [original]: _removed, ...rest }) => rest);
    if (!draft || draft === original) return;

    const result = renameCategory(original, draft);
    if (result.ok) {
      notify(`Renamed “${original}” to “${draft}”`);
    } else {
      notify(result.error, 'danger');
    }
  };

  const handleAdd = () => {
    const result = addCategory(newCategory);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    notify(`Added category “${newCategory.trim()}”`);
    setNewCategory('');
    setError(null);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Manage categories"
      description="Rename anything inline, or remove a category — its websites move to “Other”."
      maxWidth="max-w-xl"
      footer={
        <button type="button" onClick={onClose} className="btn-primary">
          Done
        </button>
      }
    >
      <div className="max-h-[46vh] space-y-2 overflow-y-auto pr-1">
        {categories.map((category) => {
          const protectedCategory = category === FALLBACK_CATEGORY;
          return (
            <div
              key={category}
              className="flex items-center gap-2 rounded-2xl border border-black/[0.06] bg-white p-2 pl-3 transition-colors hover:border-black/[0.12]"
            >
              <span className="w-9 shrink-0 text-center text-[12px] font-semibold text-ink-muted">
                {counts[category] ?? 0}
              </span>
              <input
                value={drafts[category] ?? category}
                onChange={(event) => setDrafts({ ...drafts, [category]: event.target.value })}
                onBlur={() => commitRename(category)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    event.currentTarget.blur();
                  }
                }}
                maxLength={40}
                aria-label={`Rename category ${category}`}
                className="min-w-0 flex-1 rounded-xl bg-transparent px-2 py-1.5 text-[15px] font-medium outline-none transition-colors focus:bg-black/[0.03]"
              />
              <button
                type="button"
                onClick={() => {
                  const result = deleteCategory(category);
                  if (result.ok) notify(`Removed “${category}” — sites moved to ${FALLBACK_CATEGORY}`);
                  else notify(result.error, 'danger');
                }}
                disabled={protectedCategory}
                title={protectedCategory ? `${FALLBACK_CATEGORY} can’t be removed` : `Delete ${category}`}
                aria-label={protectedCategory ? `${FALLBACK_CATEGORY} can’t be removed` : `Delete ${category}`}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-black/[0.06] text-ink-muted transition-all duration-200 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-black/[0.06] disabled:hover:bg-transparent disabled:hover:text-ink-muted"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <input
          value={newCategory}
          onChange={(event) => {
            setNewCategory(event.target.value);
            setError(null);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              handleAdd();
            }
          }}
          placeholder="New category — e.g. Reading List"
          maxLength={40}
          aria-label="New category name"
          className={`field py-2.5 ${error ? 'field-error' : ''}`}
        />
        <button type="button" onClick={handleAdd} className="btn-primary shrink-0 py-2.5">
          <Plus className="h-4 w-4" aria-hidden />
          Add
        </button>
      </div>
      {error ? <p className="mt-2 text-[13px] font-medium text-rose-600">{error}</p> : null}
    </Modal>
  );
}
