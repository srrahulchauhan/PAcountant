import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import React, { createContext, useContext, useState } from 'react'

const ToastContext = createContext()

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const addToast = (message, type = 'success', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6)
    setToasts(prev => [...prev, { id, message, type }])

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ showToast: addToast, removeToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        {toasts.map(toast => {
          const typeConfig = {
            success: {
              icon: CheckCircle2,
              style: 'bg-emerald-950/90 text-emerald-200 border-emerald-500/30 shadow-emerald-950/40',
              iconColor: 'text-emerald-400',
            },
            error: {
              icon: AlertCircle,
              style: 'bg-rose-950/90 text-rose-200 border-rose-500/30 shadow-rose-950/40',
              iconColor: 'text-rose-400',
            },
            warning: {
              icon: AlertCircle,
              style: 'bg-amber-950/90 text-amber-200 border-amber-500/30 shadow-amber-950/40',
              iconColor: 'text-amber-400',
            },
            info: {
              icon: Info,
              style: 'bg-slate-900/95 text-slate-200 border-slate-700 shadow-black/40',
              iconColor: 'text-blue-400',
            },
          }

          const config = typeConfig[toast.type] || typeConfig.info
          const IconComponent = config.icon

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${config.style}`}
            >
              <div className="flex items-center gap-2.5 text-sm font-medium">
                <IconComponent className={`h-4 w-4 shrink-0 ${config.iconColor}`} />
                <span>{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="rounded p-1 text-slate-400 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
