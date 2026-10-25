import React, { useEffect, useState } from 'react'
import { formatINR } from '../../utils/formatters'

/**
 * Animated live number counter that smoothly counts up or down when values change.
 * Formats nicely with Indian numbering (₹, commas).
 */
export const AnimatedCounter = ({
  value = 0,
  duration = 900,
  showDecimals = false,
  compact = false,
  prefix = '',
}) => {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let startTime = null
    const startVal = displayValue
    const endVal = Number(value) || 0

    if (startVal === endVal) return

    let animationFrameId

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      
      // Easing: easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      const current = Math.round(startVal + (endVal - startVal) * ease)

      setDisplayValue(current)

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step)
      } else {
        setDisplayValue(endVal)
      }
    }

    animationFrameId = requestAnimationFrame(step)

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
    }
  }, [value, duration])

  return (
    <span className="tabular-nums tracking-tight">
      {prefix}
      {formatINR(displayValue, { showDecimals, compact })}
    </span>
  )
}
