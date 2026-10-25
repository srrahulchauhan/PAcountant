/**
 * Notification Service for Personal Accountant Pro
 * Generates proactive reminders for:
 * - Upcoming and overdue loan EMIs (3 days, 2 days, today, overdue)
 * - Monthly category budget thresholds (exceeded 80% or 100%)
 * - Cloud synchronization warnings
 */

import { formatDate, formatINR } from '../utils/formatters'
import { generateAmortizationSchedule } from '../utils/loanCalculations'

export const generateActiveNotifications = (state) => {
  const notifications = []
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  // 1. Check EMI due dates and generate notifications
  const loans = state.loans || []
  const payments = state.loanPayments || []
  const reminderPrefs = state.settings?.notifications?.remindDaysBefore || [3, 2, 0]
  const remindIfOverdue = state.settings?.notifications?.remindIfOverdue !== false

  loans.forEach(loan => {
    const schedule = generateAmortizationSchedule(loan, payments)
    
    // Find upcoming and overdue installments
    schedule.forEach(item => {
      if (item.status === 'paid' || item.status === 'advance_paid') return

      const dueDate = new Date(item.dueDate)
      dueDate.setHours(0, 0, 0, 0)
      const diffDays = Math.round((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      // Check if overdue
      if (diffDays < 0 && remindIfOverdue) {
        notifications.push({
          id: `notif_overdue_${loan.id}_${item.installmentNumber}`,
          type: 'danger',
          category: 'loan_emi',
          title: `Overdue EMI: ${loan.loanName}`,
          message: `Installment #${item.installmentNumber} of ${formatINR(item.emiAmount)} was due on ${formatDate(dueDate)} (${Math.abs(diffDays)} days overdue).`,
          loanId: loan.id,
          installmentNumber: item.installmentNumber,
          amount: item.emiAmount,
          dueDate: item.dueDate,
          timestamp: dueDate.toISOString(),
          isRead: false,
        })
      } else if (diffDays === 0 && reminderPrefs.includes(0)) {
        notifications.push({
          id: `notif_due_today_${loan.id}_${item.installmentNumber}`,
          type: 'warning',
          category: 'loan_emi',
          title: `EMI Due Today: ${loan.loanName}`,
          message: `Installment #${item.installmentNumber} of ${formatINR(item.emiAmount)} is scheduled for payment today.`,
          loanId: loan.id,
          installmentNumber: item.installmentNumber,
          amount: item.emiAmount,
          dueDate: item.dueDate,
          timestamp: new Date().toISOString(),
          isRead: false,
        })
      } else if (diffDays > 0 && reminderPrefs.includes(diffDays)) {
        notifications.push({
          id: `notif_due_soon_${loan.id}_${item.installmentNumber}_d${diffDays}`,
          type: 'info',
          category: 'loan_emi',
          title: `Upcoming EMI: ${loan.loanName}`,
          message: `Installment #${item.installmentNumber} of ${formatINR(item.emiAmount)} is due in ${diffDays} day${diffDays > 1 ? 's' : ''} (${formatDate(dueDate)}).`,
          loanId: loan.id,
          installmentNumber: item.installmentNumber,
          amount: item.emiAmount,
          dueDate: item.dueDate,
          timestamp: new Date().toISOString(),
          isRead: false,
        })
      }
    })
  })

  // 2. Check Category Budget limits
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  const currentMonthExpenses = (state.expenses || []).filter(e => {
    const d = new Date(e.date)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  })

  const threshold = state.settings?.notifications?.budgetWarningThreshold || 80

  ;(state.categories || []).forEach(cat => {
    if (cat.type !== 'expense' || !cat.budget || cat.budget <= 0) return

    const spent = currentMonthExpenses
      .filter(e => e.category === cat.id)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0)

    const pct = Math.round((spent / cat.budget) * 100)

    if (pct >= 100) {
      notifications.push({
        id: `notif_budget_exceeded_${cat.id}_${currentMonth}_${currentYear}`,
        type: 'danger',
        category: 'budget',
        title: `Budget Exceeded: ${cat.name}`,
        message: `You have spent ${formatINR(spent)} against your monthly limit of ${formatINR(cat.budget)} (${pct}%).`,
        categoryId: cat.id,
        timestamp: new Date().toISOString(),
        isRead: false,
      })
    } else if (pct >= threshold) {
      notifications.push({
        id: `notif_budget_warning_${cat.id}_${currentMonth}_${currentYear}`,
        type: 'warning',
        category: 'budget',
        title: `Budget Alert: ${cat.name}`,
        message: `You have reached ${pct}% (${formatINR(spent)} of ${formatINR(cat.budget)}) of your monthly limit.`,
        categoryId: cat.id,
        timestamp: new Date().toISOString(),
        isRead: false,
      })
    }
  })

  return notifications
}

/**
 * Request Web Browser Notification permission
 */
export const requestBrowserNotificationPermission = async () => {
  if (!('Notification' in window)) {
    return { supported: false, permission: 'unsupported' }
  }

  try {
    const permission = await Notification.requestPermission()
    return { supported: true, permission }
  } catch (err) {
    return { supported: true, permission: 'denied', error: err }
  }
}

/**
 * Dispatch desktop browser notification if permitted
 */
export const sendBrowserNotification = (title, options = {}) => {
  if (!('Notification' in window)) return null
  if (Notification.permission === 'granted') {
    try {
      return new Notification(title, {
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        ...options,
      })
    } catch (err) {
      console.warn('Browser notification failed to display:', err)
    }
  }
  return null
}
