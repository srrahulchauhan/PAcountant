import { AlertCircle, RotateCcw, Trash2, X } from 'lucide-react'
import React, { useState } from 'react'
import { useFinance } from '../../context/FinanceContext'
import { useToast } from '../ui/Toast'

export const DemoBanner = () => {
  const { isDemo, resetToDemo, clearAll } = useFinance()
  const { showToast } = useToast()
  const [dismissed, setDismissed] = useState(false)

  if (!isDemo || dismissed) return null

  return (
    <div className="relative border-b border-emerald-500/20 bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-emerald-950/40 px-4 py-2.5 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2 text-emerald-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>
            <strong className="font-semibold text-white">Demo Mode Active:</strong> Realistic sample
            INR financial data loaded. All balances, EMI calculations, and bank transactions are fully interactive.
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              clearAll()
              showToast('Demo data cleared. Clean slate ready!', 'info')
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition"
          >
            <Trash2 className="h-3.5 w-3.5 text-rose-400" />
            Clear Demo Data
          </button>
          <button
            onClick={() => {
              resetToDemo()
              showToast('Demo data reloaded successfully', 'success')
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition"
          >
            <RotateCcw className="h-3.5 w-3.5 text-emerald-400" />
            Reset Data
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="rounded p-1 text-slate-400 hover:text-white transition"
            title="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
