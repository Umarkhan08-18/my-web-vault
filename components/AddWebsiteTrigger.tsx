'use client';

import { Plus } from 'lucide-react';

export const OPEN_ADD_MODAL_EVENT = 'my-web-vault:open-add-modal';

/** Lets any section of the page (even server-rendered ones) open the Add Website modal. */
export function openAddWebsiteModal() {
  window.dispatchEvent(new CustomEvent(OPEN_ADD_MODAL_EVENT));
}

export function AddWebsiteTrigger({
  label = 'Add Website',
  className = 'btn-gradient',
}: {
  label?: string;
  className?: string;
}) {
  return (
    <button type="button" onClick={openAddWebsiteModal} data-magnet data-cursor className={`group ${className}`}>
      <Plus className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" aria-hidden />
      {label}
    </button>
  );
}
