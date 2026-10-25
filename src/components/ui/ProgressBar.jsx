import React from 'react'

export const ProgressBar = ({
  value = 0,
  max = 100,
  label,
  valueLabel,
  size = 'md', // 'sm' | 'md' | 'lg'
  variant = 'emerald', // 'emerald' | 'amber' | 'rose' | 'blue' | 'gradient'
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / (max || 1)) * 100)))

  // Determine warning variant dynamically if threshold exceeded
  let resolvedVariant = variant
  if (variant === 'auto') {
    if (percentage >= 100) resolvedVariant = 'rose'
    else if (percentage >= 80) resolvedVariant = 'amber'
    else resolvedVariant = 'emerald'
  }

  const heights = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  }

  const barColors = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    blue: 'bg-blue-500',
    gradient: 'bg-gradient-to-r from-emerald-500 via-teal-400 to-blue-500',
  }

  return (
    <div className="w-full">
      {(label || valueLabel) && (
        <div className="flex justify-between items-center text-xs mb-1.5">
          {label && <span className="font-medium text-slate-300">{label}</span>}
          {valueLabel && <span className="text-slate-400 font-semibold">{valueLabel}</span>}
        </div>
      )}
      <div className={`w-full overflow-hidden rounded-full bg-slate-800 ${heights[size]}`}>
        <div
          className={`h-full transition-all duration-500 rounded-full ${
            barColors[resolvedVariant] || barColors.emerald
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
