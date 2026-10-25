import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  generateActiveNotifications,
  requestBrowserNotificationPermission,
  sendBrowserNotification,
} from '../services/notificationService'
import { useFinance } from './FinanceContext'

const NotificationContext = createContext()

export const NotificationProvider = ({ children }) => {
  const financeState = useFinance()
  const [readNotificationIds, setReadNotificationIds] = useState(() => {
    try {
      const stored = localStorage.getItem('pa_read_notifs')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  const [browserPermission, setBrowserPermission] = useState(() => {
    return 'Notification' in window ? Notification.permission : 'unsupported'
  })

  // Generate dynamic active alerts
  const allNotifications = generateActiveNotifications({
    loans: financeState.loans,
    loanPayments: financeState.loanPayments,
    expenses: financeState.expenses,
    categories: financeState.categories,
    settings: financeState.settings,
  })

  // Mark items that the user already dismissed as read
  const notifications = allNotifications.map(n => ({
    ...n,
    isRead: readNotificationIds.includes(n.id),
  }))

  const unreadCount = notifications.filter(n => !n.isRead).length

  const markAsRead = (id) => {
    setReadNotificationIds(prev => {
      if (prev.includes(id)) return prev
      const updated = [...prev, id]
      localStorage.setItem('pa_read_notifs', JSON.stringify(updated))
      return updated
    })
  }

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id)
    setReadNotificationIds(allIds)
    localStorage.setItem('pa_read_notifs', JSON.stringify(allIds))
  }

  const clearNotification = (id) => {
    markAsRead(id)
  }

  const requestPermission = async () => {
    const result = await requestBrowserNotificationPermission()
    setBrowserPermission(result.permission)
    return result
  }

  // Trigger web notification for highest priority overdue loan or due today loan once
  useEffect(() => {
    if (browserPermission === 'granted') {
      const highPriority = notifications.find(n => !n.isRead && (n.type === 'danger' || n.type === 'warning'))
      if (highPriority) {
        sendBrowserNotification(highPriority.title, {
          body: highPriority.message,
        })
      }
    }
  }, [browserPermission])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotification,
        browserPermission,
        requestPermission,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
