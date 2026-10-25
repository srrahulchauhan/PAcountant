import { FolderOpen } from 'lucide-react'
import React from 'react'

export const EmptyState = ({
  icon: Icon = FolderOpen,
  title = 'No records found',
  description = 'Get started by adding your first record.',
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 my-4">
      <div className="rounded-2xl bg-slate-800/80 p-4 text-slate-400 mb-3">
        <Icon className="h-8 w-8" />
      </div>
      <h4 className="text-base font-semibold text-slate-200">{title}</h4>
      <p className="mt-1 text-xs text-slate-400 max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition shadow-lg shadow-emerald-950/40"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
