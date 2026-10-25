/**
 * Persistent Storage Service for Personal Accountant Pro
 * Handles LocalStorage persistence, state hydration, schema migration, and backup/restore.
 */

import {
  INITIAL_BANK_ACCOUNTS,
  INITIAL_BANK_TRANSACTIONS,
  INITIAL_CATEGORIES,
  INITIAL_EXPENSES,
  INITIAL_INCOME,
  INITIAL_LOAN_PAYMENTS,
  INITIAL_LOANS,
  INITIAL_SETTINGS,
} from './demoData'

const STORAGE_KEY = 'pa_pro_finance_v1'
const DEMO_MODE_KEY = 'pa_pro_is_demo_mode'

export const getInitialData = () => {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY)
    if (rawData) {
      const parsed = JSON.parse(rawData)
      return {
        isDemo: localStorage.getItem(DEMO_MODE_KEY) === 'true',
        bankAccounts: parsed.bankAccounts || INITIAL_BANK_ACCOUNTS,
        bankTransactions: parsed.bankTransactions || INITIAL_BANK_TRANSACTIONS,
        expenses: parsed.expenses || INITIAL_EXPENSES,
        income: parsed.income || INITIAL_INCOME,
        loans: parsed.loans || INITIAL_LOANS,
        loanPayments: parsed.loanPayments || INITIAL_LOAN_PAYMENTS,
        categories: parsed.categories || INITIAL_CATEGORIES,
        settings: { ...INITIAL_SETTINGS, ...(parsed.settings || {}) },
      }
    }
  } catch (err) {
    console.error('Error reading financial state from localStorage:', err)
  }

  // First time visitor: seed with realistic demo data
  localStorage.setItem(DEMO_MODE_KEY, 'true')
  const defaultState = {
    isDemo: true,
    bankAccounts: INITIAL_BANK_ACCOUNTS,
    bankTransactions: INITIAL_BANK_TRANSACTIONS,
    expenses: INITIAL_EXPENSES,
    income: INITIAL_INCOME,
    loans: INITIAL_LOANS,
    loanPayments: INITIAL_LOAN_PAYMENTS,
    categories: INITIAL_CATEGORIES,
    settings: INITIAL_SETTINGS,
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultState))
  } catch (err) {
    console.warn('LocalStorage unavailable or quota exceeded:', err)
  }

  return defaultState
}

// Debounce timer for saving to disk
let saveTimeout = null

export const saveToStorage = (state, immediate = false) => {
  const doSave = () => {
    try {
      const dataToSave = {
        bankAccounts: state.bankAccounts,
        bankTransactions: state.bankTransactions,
        expenses: state.expenses,
        income: state.income,
        loans: state.loans,
        loanPayments: state.loanPayments,
        categories: state.categories,
        settings: state.settings,
        lastSavedAt: new Date().toISOString(),
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave))
      localStorage.setItem(DEMO_MODE_KEY, state.isDemo ? 'true' : 'false')
      return true
    } catch (err) {
      console.error('Failed to save to localStorage:', err)
      return false
    }
  }

  if (immediate) {
    if (saveTimeout) clearTimeout(saveTimeout)
    return doSave()
  }

  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(doSave, 300)
  return true
}

export const exportJsonBackup = (state) => {
  const exportPayload = {
    version: '1.0.0',
    appName: 'Personal Accountant Pro',
    exportedAt: new Date().toISOString(),
    currency: 'INR',
    data: {
      bankAccounts: state.bankAccounts,
      bankTransactions: state.bankTransactions,
      expenses: state.expenses,
      income: state.income,
      loans: state.loans,
      loanPayments: state.loanPayments,
      categories: state.categories,
      settings: state.settings,
    },
  }

  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const dateStr = new Date().toISOString().split('T')[0]
  a.href = url
  a.download = `Personal_Accountant_Pro_Backup_${dateStr}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export const restoreJsonBackup = (jsonString) => {
  try {
    const parsed = JSON.parse(jsonString)
    const data = parsed.data || parsed
    if (!data.bankAccounts || !data.expenses) {
      throw new Error('Invalid backup file structure: missing core finance collections')
    }

    return {
      isDemo: false,
      bankAccounts: data.bankAccounts || [],
      bankTransactions: data.bankTransactions || [],
      expenses: data.expenses || [],
      income: data.income || [],
      loans: data.loans || [],
      loanPayments: data.loanPayments || [],
      categories: data.categories || INITIAL_CATEGORIES,
      settings: { ...INITIAL_SETTINGS, ...(data.settings || {}) },
    }
  } catch (err) {
    throw new Error('Could not parse backup file: ' + err.message)
  }
}

export const getResetDemoState = () => {
  localStorage.setItem(DEMO_MODE_KEY, 'true')
  return {
    isDemo: true,
    bankAccounts: INITIAL_BANK_ACCOUNTS,
    bankTransactions: INITIAL_BANK_TRANSACTIONS,
    expenses: INITIAL_EXPENSES,
    income: INITIAL_INCOME,
    loans: INITIAL_LOANS,
    loanPayments: INITIAL_LOAN_PAYMENTS,
    categories: INITIAL_CATEGORIES,
    settings: INITIAL_SETTINGS,
  }
}

export const getCleanState = () => {
  localStorage.setItem(DEMO_MODE_KEY, 'false')
  return {
    isDemo: false,
    bankAccounts: [],
    bankTransactions: [],
    expenses: [],
    income: [],
    loans: [],
    loanPayments: [],
    categories: INITIAL_CATEGORIES,
    settings: INITIAL_SETTINGS,
  }
}
