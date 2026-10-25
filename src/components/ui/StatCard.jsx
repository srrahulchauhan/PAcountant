import { motion } from 'framer-motion'
import React from 'react'
import { AnimatedCounter } from './AnimatedCounter'

export const StatCard = ({
  title,
  value,
  rawNumericValue, // If passed, uses AnimatedCounter
  subtitle,
  icon: Icon,
  trend,
  trendLabel,
  trendDirection = 'neutral', // 'up' | 'down' | 'neutral'
  variant = 'default', // 'default' | 'emerald' | 'amber' | 'blue' | 'rose'
  compact = true,
  onClick,
}) => {
  const variantStyles = {
    default: 'from-slate-900/90 to-slate-900/50 border-slate-800 hover:border-slate-700',
    emerald: 'from-emerald-950/40 to-slate-900/80 border-emerald-500/30 hover:border-emerald-500/50 hover:shadow-emerald-950/30',
    amber: 'from-amber-950/40 to-slate-900/80 border-amber-500/30 hover:border-amber-500/50 hover:shadow-amber-950/30',
    blue: 'from-blue-950/40 to-slate-900/80 border-blue-500/30 hover:border-blue-500/50 hover:shadow-blue-950/30',
    rose: 'from-rose-950/40 to-slate-900/80 border-rose-500/30 hover:border-rose-500/50 hover:shadow-rose-950/30',
  }

  const iconColors = {
    default: 'text-slate-400 bg-slate-800/80',
    emerald: 'text-emerald-400 bg-emerald-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
    blue: 'text-blue-400 bg-blue-500/10',
    rose: 'text-rose-400 bg-rose-500/10',
  }

  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-b p-5 border backdrop-blur-xl transition-all duration-300 shadow-lg shadow-black/20 ${
        variantStyles[variant] || variantStyles.default
      } ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
            {title}
          </span>
          <div className="mt-2 text-2xl font-bold tracking-tight text-white flex items-center gap-1">
            {rawNumericValue !== undefined ? (
              <AnimatedCounter value={rawNumericValue} compact={compact} />
            ) : (
              value
            )}
          </div>
        </div>
        {Icon && (
          <div className={`rounded-xl p-2.5 ${iconColors[variant] || iconColors.default}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {trend && (
            <span
              className={`inline-flex items-center font-semibold px-1.5 py-0.5 rounded ${
                trendDirection === 'up'
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : trendDirection === 'down'
                  ? 'bg-rose-500/10 text-rose-400'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {trend}
            </span>
          )}
          {trendLabel && <span className="text-slate-400">{trendLabel}</span>}
          {subtitle && !trend && <span className="text-slate-400">{subtitle}</span>}
        </div>
      )}
    </motion.div>
  )
}
