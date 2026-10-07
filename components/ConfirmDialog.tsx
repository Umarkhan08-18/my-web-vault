'use client';

import { Trash2 } from 'lucide-react';

import { Modal } from '@/components/Modal';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      maxWidth="max-w-md"
      zIndex="z-[95]"
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-ghost">
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="btn inline-flex items-center gap-2 bg-rose-600 px-4 py-2.5 text-white shadow-soft hover:bg-rose-700 hover:shadow-lift"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="pb-2 text-[15px] leading-relaxed text-ink-muted">{description}</p>
    </Modal>
  );
}
