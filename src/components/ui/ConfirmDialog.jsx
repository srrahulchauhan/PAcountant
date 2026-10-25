import { AlertTriangle } from 'lucide-react'
import React from 'react'
import { Modal } from './Modal'

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = true,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex items-start gap-4 py-2">
        <div
          className={`shrink-0 rounded-xl p-3 ${
            isDestructive ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'
          }`}
        >
          <AlertTriangle className="h-6 w-6" />
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">{message}</p>
      </div>

      <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-800">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm()
            onClose()
          }}
          className={`rounded-xl px-4 py-2 text-xs font-semibold text-white transition shadow-lg ${
            isDestructive
              ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-950/40'
              : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/40'
          }`}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  )
}
