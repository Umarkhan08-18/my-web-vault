'use client';

import { useEffect, useMemo, useState } from 'react';
import { Settings2 } from 'lucide-react';

import { Modal } from '@/components/Modal';
import { useVault } from '@/components/VaultProvider';
import { FALLBACK_CATEGORY, type Website } from '@/lib/types';
import { normalizeUrl } from '@/lib/url';

const EMPTY_FORM = { name: '', url: '', category: '', description: '' };

export interface WebsiteFormModalProps {
  open: boolean;
  editing: Website | null;
  onClose: () => void;
  onManageCategories: () => void;
}

export function WebsiteFormModal({ open, editing, onClose, onManageCategories }: WebsiteFormModalProps) {
  const { categories, addWebsite, updateWebsite, notify } = useVault();

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<{ name?: string; url?: string }>({});

  // Reset (or prefill) the form every time the modal opens.
  useEffect(() => {
    if (!open) return;
    setForm(
      editing
        ? {
            name: editing.name,
            url: editing.url,
            category: editing.category,
            description: editing.description,
          }
        : { ...EMPTY_FORM, category: categories[0] ?? FALLBACK_CATEGORY },
    );
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  const preview = useMemo(() => {
    if (!form.url.trim()) return null;
    const result = normalizeUrl(form.url);
    return result.ok ? result : null;
  }, [form.url]);

  const submit = () => {
    const nameError = form.name.trim() ? undefined : 'Please enter a website name.';
    const urlCheck = normalizeUrl(form.url);
    const urlError = urlCheck.ok ? undefined : urlCheck.error;

    if (nameError || urlError) {
      setErrors({ name: nameError, url: urlError });
      return;
    }

    const payload = { ...form, category: form.category || FALLBACK_CATEGORY };
    const result = editing ? updateWebsite(editing.id, payload) : addWebsite(payload);

    if (!result.ok) {
      setErrors({ url: result.error });
      return;
    }

    notify(editing ? `Updated “${payload.name.trim()}”` : `Saved “${payload.name.trim()}”`);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit website' : 'Add website'}
      description={
        editing
          ? 'Update the name, link, category or note — your vault updates instantly.'
          : 'Two fields is all it takes. Your vault updates instantly — no refresh needed.'
      }
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button type="submit" form="website-form" className="btn-gradient px-5">
            {editing ? 'Save Changes' : 'Add Website'}
          </button>
        </>
      }
    >
      <form
        id="website-form"
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        noValidate
      >
        <div>
          <label htmlFor="website-name" className="mb-1.5 block text-[13px] font-semibold text-ink">
            Website Name
          </label>
          <input
            id="website-name"
            name="name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="OpenAI"
            maxLength={120}
            autoComplete="off"
            required
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'website-name-error' : undefined}
            className={`field ${errors.name ? 'field-error' : ''}`}
          />
          {errors.name ? (
            <p id="website-name-error" className="mt-1.5 text-[13px] font-medium text-rose-600">
              {errors.name}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="website-url" className="mb-1.5 block text-[13px] font-semibold text-ink">
            Website URL
          </label>
          <input
            id="website-url"
            name="url"
            value={form.url}
            onChange={(event) => setForm({ ...form, url: event.target.value })}
            placeholder="openai.com"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            required
            aria-invalid={Boolean(errors.url)}
            aria-describedby={errors.url ? 'website-url-error' : 'website-url-hint'}
            className={`field font-mono text-[14px] ${errors.url ? 'field-error' : ''}`}
          />
          {errors.url ? (
            <p id="website-url-error" className="mt-1.5 text-[13px] font-medium text-rose-600">
              {errors.url}
            </p>
          ) : (
            <p id="website-url-hint" className="mt-1.5 text-[12.5px] text-ink-muted">
              {preview ? (
                <>
                  Will save as <span className="font-mono text-ink">{preview.url}</span>
                </>
              ) : (
                <>No “https://”? No problem — it gets added for you.</>
              )}
            </p>
          )}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="website-category" className="block text-[13px] font-semibold text-ink">
              Category
            </label>
            <button
              type="button"
              onClick={onManageCategories}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12.5px] font-semibold text-violet-brand transition-colors hover:bg-violet-brand/[0.07]"
            >
              <Settings2 className="h-3.5 w-3.5" aria-hidden />
              Manage categories
            </button>
          </div>
          <select
            id="website-category"
            name="category"
            value={form.category}
            onChange={(event) => setForm({ ...form, category: event.target.value })}
            className="field appearance-none bg-[length:16px] pr-10"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%235B5B66' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 16px center',
            }}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="website-description" className="mb-1.5 block text-[13px] font-semibold text-ink">
            Description <span className="font-normal text-ink-muted">(optional)</span>
          </label>
          <textarea
            id="website-description"
            name="description"
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            placeholder="Chat models, API docs and playground"
            rows={3}
            maxLength={240}
            className="field resize-none"
          />
          <p className="mt-1.5 text-right text-[12px] text-ink-muted">{form.description.length}/240</p>
        </div>
      </form>
    </Modal>
  );
}
