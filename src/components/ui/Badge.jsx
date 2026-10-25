import React from 'react'

export const Badge = ({
  children,
  variant = 'default', // 'emerald' | 'amber' | 'rose' | 'blue' | 'purple' | 'slate'
  size = 'md', // 'sm' | 'md'
  dot = false,
  className = '',
}) => {
  const variantStyles = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    slate: 'bg-slate-800 text-slate-300 border-slate-700',
    default: 'bg-slate-800/80 text-slate-300 border-slate-700/60',
  }

  const dotColors = {
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400',
    rose: 'bg-rose-400',
    blue: 'bg-blue-400',
    purple: 'bg-purple-400',
    slate: 'bg-slate-400',
    default: 'bg-slate-400',
  }

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${
        variantStyles[variant] || variantStyles.default
      } ${sizeStyles[size]} ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dotColors[variant] || dotColors.default}`} />}
      {children}
    </span>
  )
}
