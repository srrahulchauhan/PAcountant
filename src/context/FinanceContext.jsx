import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { syncDataToGoogleSheets } from '../services/googleSheetsService'
import {
  exportJsonBackup,
  getCleanState,
  getInitialData,
  getResetDemoState,
  restoreJsonBackup,
  saveToStorage,
} from '../services/storage'
import { generateId } from '../utils/formatters'
import { calculateLoanMetrics } from '../utils/loanCalculations'

const FinanceContext = createContext()

export const FinanceProvider = ({ children }) => {
  // Load initial state from LocalStorage or Demo Data
  const [data, setData] = useState(() => getInitialData())
  
  // Cloud sync status state
  // 'not_configured' | 'saved_locally' | 'saving' | 'syncing' | 'synced' | 'sync_failed'
  const [syncStatus, setSyncStatus] = useState(() => {
    return data.settings?.googleSheets?.enabled ? 'saved_locally' : 'not_configured'
  })
  const [lastSyncedAt, setLastSyncedAt] = useState(() => data.settings?.googleSheets?.lastSyncTimestamp || null)
  const [syncErrorMessage, setSyncErrorMessage] = useState(null)
  const [pendingChangesCount, setPendingChangesCount] = useState(0)

  // Save to localStorage immediately or debounced
  const persistState = (newState, immediate = true) => {
    setSyncStatus('saving')
    saveToStorage(newState, immediate)
    setTimeout(() => {
      setSyncStatus(newState.settings?.googleSheets?.enabled ? 'saved_locally' : 'not_configured')
    }, 400)

    // Trigger cloud sync if Google Sheets webhook is enabled
    if (newState.settings?.googleSheets?.enabled && newState.settings?.googleSheets?.webhookUrl) {
      setPendingChangesCount(prev => prev + 1)
      if (newState.settings?.googleSheets?.autoSyncOnUpdate) {
        attemptCloudSync(newState)
      }
    }
  }

  // Attempt background sync to Google Sheets
  const attemptCloudSync = async (stateToSync = data) => {
    const webhookUrl = stateToSync.settings?.googleSheets?.webhookUrl
    if (!webhookUrl || !webhookUrl.trim().startsWith('http')) {
      setSyncStatus('not_configured')
      return
    }

    setSyncStatus('syncing')
    setSyncErrorMessage(null)

    try {
      const res = await syncDataToGoogleSheets(webhookUrl, stateToSync)
      if (res.success) {
        setSyncStatus('synced')
        setLastSyncedAt(res.timestamp)
        setPendingChangesCount(0)
        setSyncErrorMessage(null)

        // Update settings timestamp
        setData(prev => {
          const updated = {
            ...prev,
            settings: {
              ...prev.settings,
              googleSheets: {
                ...prev.settings.googleSheets,
                lastSyncTimestamp: res.timestamp,
              },
            },
          }
          saveToStorage(updated, true)
          return updated
        })
      } else {
        setSyncStatus('sync_failed')
        setSyncErrorMessage(res.error || 'Failed to sync with Google Sheets')
      }
    } catch (err) {
      setSyncStatus('sync_failed')
      setSyncErrorMessage(err.message || 'Network sync error')
    }
  }

  // -------------------------------------------------------------
  // CALCULATIONS ENGINE
  // -------------------------------------------------------------

  // Bank Account Balances: Calculated Balance = Opening Balance + Credits - Debits
  const bankAccountsWithBalance = useMemo(() => {
    return (data.bankAccounts || []).map(bank => {
      const bankTx = (data.bankTransactions || []).filter(t => t.bankAccountId === bank.id)
      const totalCredits = bankTx
        .filter(t => t.type === 'credit')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
      const totalDebits = bankTx
        .filter(t => t.type === 'debit')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
      const calculatedBalance = (Number(bank.openingBalance) || 0) + totalCredits - totalDebits

      return {
        ...bank,
        totalCredits,
        totalDebits,
        calculatedBalance,
      }
    })
  }, [data.bankAccounts, data.bankTransactions])

  // Total balance across all bank accounts
  const totalBankBalance = useMemo(() => {
    return bankAccountsWithBalance.reduce((sum, b) => sum + b.calculatedBalance, 0)
  }, [bankAccountsWithBalance])

  // Calculate Loans Metrics: total borrowed, outstanding, interest paid, overdue count
  const loansSummary = useMemo(() => {
    let totalBorrowed = 0
    let outstandingPrincipal = 0
    let totalInterestPaid = 0
    let overdueInstallmentsCount = 0
    let upcomingEMIAmount = 0
    let completedLoansCount = 0

    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    ;(data.loans || []).forEach(loan => {
      const metrics = calculateLoanMetrics(loan, data.loanPayments || [])
      if (!metrics) return

      totalBorrowed += metrics.principal
      outstandingPrincipal += metrics.remainingPrincipal
      totalInterestPaid += metrics.totalInterestPaid
      overdueInstallmentsCount += metrics.overdueCount

      if (metrics.isCompleted) {
        completedLoansCount++
      } else {
        // Check if next installment is in current month and not yet paid
        if (metrics.nextDueInstallment) {
          const nextDate = new Date(metrics.nextDueInstallment.dueDate)
          if (nextDate.getMonth() === currentMonth && nextDate.getFullYear() === currentYear) {
            upcomingEMIAmount += Number(loan.emiAmount) || 0
          }
        }
      }
    })

    return {
      totalBorrowed,
      outstandingPrincipal,
      totalInterestPaid,
      overdueInstallmentsCount,
      upcomingEMIAmount,
      completedLoansCount,
      activeLoansCount: (data.loans || []).length - completedLoansCount,
    }
  }, [data.loans, data.loanPayments])

  // Income & Expense totals (Excluding internal transfers to prevent double counting)
  const financialTotals = useMemo(() => {
    const totalIncome = (data.income || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
    const totalExpenses = (data.expenses || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
    const netSavings = totalIncome - totalExpenses

    // Monthly figures (current month)
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const monthlyIncome = (data.income || [])
      .filter(i => {
        const d = new Date(i.date)
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear
      })
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0)

    const monthlyExpenses = (data.expenses || [])
      .filter(e => {
        const d = new Date(e.date)
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear
      })
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0)

    const monthlySavings = monthlyIncome - monthlyExpenses
    const savingsRate = monthlyIncome > 0 ? Math.round((monthlySavings / monthlyIncome) * 100) : 0

    return {
      totalIncome,
      totalExpenses,
      netSavings,
      monthlyIncome,
      monthlyExpenses,
      monthlySavings,
      savingsRate,
      availableBalance: totalBankBalance, // Real live calculated bank balances
    }
  }, [data.income, data.expenses, totalBankBalance])

  // -------------------------------------------------------------
  // MUTATION ACTIONS
  // -------------------------------------------------------------

  // Add Expense
  const addExpense = (expenseData) => {
    const newId = generateId('exp')
    const timestamp = new Date().toISOString()
    const newExpense = {
      ...expenseData,
      id: newId,
      amount: Number(expenseData.amount) || 0,
      date: expenseData.date || timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    let updatedBankTransactions = [...(data.bankTransactions || [])]

    // If linked to bank, create a corresponding bank debit transaction
    if (newExpense.bankAccountId && newExpense.linkToBank) {
      const bankTxId = generateId('bt')
      const bankTx = {
        id: bankTxId,
        bankAccountId: newExpense.bankAccountId,
        transactionDate: newExpense.date,
        description: `Expense: ${newExpense.merchant ? newExpense.merchant + ' - ' : ''}${newExpense.description || 'Debit'}`,
        referenceNumber: newExpense.referenceNumber || `EXP/${newId.slice(-6).toUpperCase()}`,
        type: 'debit',
        amount: newExpense.amount,
        category: newExpense.category,
        transactionType: 'Online',
        isTransfer: false,
        linkedExpenseId: newId,
        notes: newExpense.description || '',
        createdAt: timestamp,
      }
      updatedBankTransactions.unshift(bankTx)
      newExpense.isLinkedToBank = true
      newExpense.bankTransactionId = bankTxId
    }

    const updatedState = {
      ...data,
      expenses: [newExpense, ...(data.expenses || [])],
      bankTransactions: updatedBankTransactions,
    }

    setData(updatedState)
    persistState(updatedState)
    return newExpense
  }

  // Edit Expense
  const updateExpense = (id, updatedFields) => {
    const timestamp = new Date().toISOString()
    const updatedExpenses = (data.expenses || []).map(exp => {
      if (exp.id === id) {
        return {
          ...exp,
          ...updatedFields,
          amount: Number(updatedFields.amount !== undefined ? updatedFields.amount : exp.amount),
          updatedAt: timestamp,
        }
      }
      return exp
    })

    const updatedState = {
      ...data,
      expenses: updatedExpenses,
    }

    setData(updatedState)
    persistState(updatedState)
  }

  // Delete Expense
  const deleteExpense = (id) => {
    const target = (data.expenses || []).find(e => e.id === id)
    let updatedBankTransactions = [...(data.bankTransactions || [])]

    // If linked to bank, remove or decouple bank transaction
    if (target?.bankTransactionId) {
      updatedBankTransactions = updatedBankTransactions.filter(t => t.id !== target.bankTransactionId)
    }

    const updatedState = {
      ...data,
      expenses: (data.expenses || []).filter(e => e.id !== id),
      bankTransactions: updatedBankTransactions,
    }

    setData(updatedState)
    persistState(updatedState)
  }

  // Add Income
  const addIncome = (incomeData) => {
    const newId = generateId('inc')
    const timestamp = new Date().toISOString()
    const newIncome = {
      ...incomeData,
      id: newId,
      amount: Number(incomeData.amount) || 0,
      date: incomeData.date || timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    let updatedBankTransactions = [...(data.bankTransactions || [])]

    // If linked to bank, create a corresponding bank credit transaction
    if (newIncome.bankAccountId && newIncome.linkToBank) {
      const bankTxId = generateId('bt')
      const bankTx = {
        id: bankTxId,
        bankAccountId: newIncome.bankAccountId,
        transactionDate: newIncome.date,
        description: `Income: ${newIncome.source ? newIncome.source + ' - ' : ''}${newIncome.description || 'Credit'}`,
        referenceNumber: newIncome.referenceNumber || `INC/${newId.slice(-6).toUpperCase()}`,
        type: 'credit',
        amount: newIncome.amount,
        category: newIncome.category,
        transactionType: 'Deposit',
        isTransfer: false,
        linkedIncomeId: newId,
        notes: newIncome.description || '',
        createdAt: timestamp,
      }
      updatedBankTransactions.unshift(bankTx)
      newIncome.isLinkedToBank = true
      newIncome.bankTransactionId = bankTxId
    }

    const updatedState = {
      ...data,
      income: [newIncome, ...(data.income || [])],
      bankTransactions: updatedBankTransactions,
    }

    setData(updatedState)
    persistState(updatedState)
    return newIncome
  }

  // Edit Income
  const updateIncome = (id, updatedFields) => {
    const timestamp = new Date().toISOString()
    const updatedIncome = (data.income || []).map(inc => {
      if (inc.id === id) {
        return {
          ...inc,
          ...updatedFields,
          amount: Number(updatedFields.amount !== undefined ? updatedFields.amount : inc.amount),
          updatedAt: timestamp,
        }
      }
      return inc
    })

    const updatedState = {
      ...data,
      income: updatedIncome,
    }

    setData(updatedState)
    persistState(updatedState)
  }

  // Delete Income
  const deleteIncome = (id) => {
    const target = (data.income || []).find(i => i.id === id)
    let updatedBankTransactions = [...(data.bankTransactions || [])]

    if (target?.bankTransactionId) {
      updatedBankTransactions = updatedBankTransactions.filter(t => t.id !== target.bankTransactionId)
    }

    const updatedState = {
      ...data,
      income: (data.income || []).filter(i => i.id !== id),
      bankTransactions: updatedBankTransactions,
    }

    setData(updatedState)
    persistState(updatedState)
  }

  // Add Loan
  const addLoan = (loanData) => {
    const newId = generateId('loan')
    const timestamp = new Date().toISOString()
    const newLoan = {
      ...loanData,
      id: newId,
      principalAmount: Number(loanData.principalAmount) || 0,
      interestRate: Number(loanData.interestRate) || 0,
      tenureMonths: Number(loanData.tenureMonths) || 12,
      emiAmount: Number(loanData.emiAmount) || 0,
      monthlyDueDay: Number(loanData.monthlyDueDay) || 5,
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    const updatedState = {
      ...data,
      loans: [newLoan, ...(data.loans || [])],
    }

    setData(updatedState)
    persistState(updatedState)
    return newLoan
  }

  // Update Loan
  const updateLoan = (id, updatedFields) => {
    const timestamp = new Date().toISOString()
    const updatedLoans = (data.loans || []).map(loan => {
      if (loan.id === id) {
        return {
          ...loan,
          ...updatedFields,
          updatedAt: timestamp,
        }
      }
      return loan
    })

    const updatedState = {
      ...data,
      loans: updatedLoans,
    }

    setData(updatedState)
    persistState(updatedState)
  }

  // Delete Loan
  const deleteLoan = (id) => {
    const updatedState = {
      ...data,
      loans: (data.loans || []).filter(l => l.id !== id),
      loanPayments: (data.loanPayments || []).filter(p => p.loanId !== id),
    }

    setData(updatedState)
    persistState(updatedState)
  }

  // Record EMI Payment (full, partial, or advance)
  const recordLoanPayment = (paymentData) => {
    const newId = generateId('lp')
    const timestamp = new Date().toISOString()
    const targetLoan = (data.loans || []).find(l => l.id === paymentData.loanId)

    const newPayment = {
      ...paymentData,
      id: newId,
      amount: Number(paymentData.amount) || 0,
      principalComponent: Number(paymentData.principalComponent) || Math.round(Number(paymentData.amount) * 0.7),
      interestComponent: Number(paymentData.interestComponent) || Math.round(Number(paymentData.amount) * 0.3),
      paymentDate: paymentData.paymentDate || timestamp,
      status: paymentData.status || 'paid',
      createdAt: timestamp,
    }

    let updatedBankTransactions = [...(data.bankTransactions || [])]

    // If auto-debit linked to bank account, record bank debit transaction
    if (targetLoan?.linkedBankAccountId && paymentData.deductFromBank !== false) {
      const bankTx = {
        id: generateId('bt'),
        bankAccountId: targetLoan.linkedBankAccountId,
        transactionDate: newPayment.paymentDate,
        description: `EMI Payment: ${targetLoan.loanName} (Inst #${newPayment.installmentNumber})`,
        referenceNumber: newPayment.referenceNumber || `EMI/${newId.slice(-6).toUpperCase()}`,
        type: 'debit',
        amount: newPayment.amount,
        category: 'cat_rent',
        transactionType: 'Online',
        isTransfer: false,
        notes: `Loan EMI payment for ${targetLoan.loanName}`,
        createdAt: timestamp,
      }
      updatedBankTransactions.unshift(bankTx)
    }

    const updatedState = {
      ...data,
      loanPayments: [newPayment, ...(data.loanPayments || [])],
      bankTransactions: updatedBankTransactions,
    }

    setData(updatedState)
    persistState(updatedState)
    return newPayment
  }

  // Delete / Reverse EMI Payment
  const deleteLoanPayment = (id) => {
    const updatedState = {
      ...data,
      loanPayments: (data.loanPayments || []).filter(p => p.id !== id),
    }

    setData(updatedState)
    persistState(updatedState)
  }

  // Add Bank Account
  const addBankAccount = (bankData) => {
    const newId = generateId('bank')
    const timestamp = new Date().toISOString()
    const maskedNumber = bankData.accountNumber
      ? `•••• •••• ${String(bankData.accountNumber).slice(-4)}`
      : '•••• •••• 0000'

    const newAccount = {
      ...bankData,
      id: newId,
      openingBalance: Number(bankData.openingBalance) || 0,
      maskedNumber,
      accountNumber: undefined, // Never store raw sensitive number in plain state
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    const updatedState = {
      ...data,
      bankAccounts: [...(data.bankAccounts || []), newAccount],
    }

    setData(updatedState)
    persistState(updatedState)
    return newAccount
  }

  // Update Bank Account
  const updateBankAccount = (id, updatedFields) => {
    const timestamp = new Date().toISOString()
    const updatedAccounts = (data.bankAccounts || []).map(b => {
      if (b.id === id) {
        return {
          ...b,
          ...updatedFields,
          openingBalance: Number(updatedFields.openingBalance !== undefined ? updatedFields.openingBalance : b.openingBalance),
          updatedAt: timestamp,
        }
      }
      return b
    })

    const updatedState = {
      ...data,
      bankAccounts: updatedAccounts,
    }

    setData(updatedState)
    persistState(updatedState)
  }

  // Delete Bank Account
  const deleteBankAccount = (id) => {
    const updatedState = {
      ...data,
      bankAccounts: (data.bankAccounts || []).filter(b => b.id !== id),
      bankTransactions: (data.bankTransactions || []).filter(t => t.bankAccountId !== id),
    }

    setData(updatedState)
    persistState(updatedState)
  }

  // Add Bank Transaction (Manual entry)
  const addBankTransaction = (txData) => {
    const newId = generateId('bt')
    const timestamp = new Date().toISOString()
    const newTx = {
      ...txData,
      id: newId,
      amount: Number(txData.amount) || 0,
      transactionDate: txData.transactionDate || timestamp,
      createdAt: timestamp,
    }

    const updatedState = {
      ...data,
      bankTransactions: [newTx, ...(data.bankTransactions || [])],
    }

    setData(updatedState)
    persistState(updatedState)
    return newTx
  }

  // Delete Bank Transaction
  const deleteBankTransaction = (id) => {
    const target = (data.bankTransactions || []).find(t => t.id === id)
    let updatedTx = (data.bankTransactions || []).filter(t => t.id !== id)

    // If part of an internal transfer pair, also delete matching partner
    if (target?.transferPairId) {
      updatedTx = updatedTx.filter(t => t.id !== target.transferPairId)
    }

    const updatedState = {
      ...data,
      bankTransactions: updatedTx,
    }

    setData(updatedState)
    persistState(updatedState)
  }

  // Internal Transfer Between Two Bank Accounts
  // Strictly excluded from income/expenses and creates matching Debit + Credit
  const transferBetweenAccounts = ({ fromBankId, toBankId, amount, date, reference, notes }) => {
    const sourceBank = bankAccountsWithBalance.find(b => b.id === fromBankId)
    const destBank = bankAccountsWithBalance.find(b => b.id === toBankId)

    if (!sourceBank || !destBank) {
      throw new Error('Both source and destination bank accounts must be specified')
    }
    if (fromBankId === toBankId) {
      throw new Error('Source and destination bank accounts cannot be the same')
    }
    const transferAmount = Number(amount) || 0
    if (transferAmount <= 0) {
      throw new Error('Transfer amount must be greater than zero')
    }

    const timestamp = date || new Date().toISOString()
    const debitId = generateId('bt')
    const creditId = generateId('bt')
    const ref = reference || `TRF/${generateId('ref').slice(-8).toUpperCase()}`

    // 1. Debit from source bank
    const debitTx = {
      id: debitId,
      bankAccountId: fromBankId,
      transactionDate: timestamp,
      description: `Transfer to ${destBank.bankName} (${destBank.accountNickname})`,
      referenceNumber: ref,
      type: 'debit',
      amount: transferAmount,
      transactionType: 'Transfer',
      isTransfer: true,
      transferLinkedAccountId: toBankId,
      transferPairId: creditId,
      notes: notes || 'Internal account transfer',
      createdAt: timestamp,
    }

    // 2. Credit to destination bank
    const creditTx = {
      id: creditId,
      bankAccountId: toBankId,
      transactionDate: timestamp,
      description: `Transfer from ${sourceBank.bankName} (${sourceBank.accountNickname})`,
      referenceNumber: ref,
      type: 'credit',
      amount: transferAmount,
      transactionType: 'Transfer',
      isTransfer: true,
      transferLinkedAccountId: fromBankId,
      transferPairId: debitId,
      notes: notes || 'Internal account transfer',
      createdAt: timestamp,
    }

    const updatedState = {
      ...data,
      bankTransactions: [debitTx, creditTx, ...(data.bankTransactions || [])],
    }

    setData(updatedState)
    persistState(updatedState)
    return { debitTx, creditTx }
  }

  // Import Statement Transactions with duplicate checking
  const importBankTransactions = (bankAccountId, newTransactions) => {
    const existing = (data.bankTransactions || []).filter(t => t.bankAccountId === bankAccountId)
    const addedList = []

    newTransactions.forEach(item => {
      // Check for duplicate: same amount, date, and description/reference
      const isDuplicate = existing.some(
        e =>
          Math.abs(e.amount - item.amount) < 0.01 &&
          e.type === item.type &&
          (e.referenceNumber === item.referenceNumber || e.description === item.description)
      )

      if (!isDuplicate) {
        addedList.push({
          ...item,
          id: generateId('bt'),
          bankAccountId,
          createdAt: new Date().toISOString(),
        })
      }
    })

    const updatedState = {
      ...data,
      bankTransactions: [...addedList, ...(data.bankTransactions || [])],
    }

    setData(updatedState)
    persistState(updatedState)
    return { addedCount: addedList.length, totalAttempted: newTransactions.length }
  }

  // Category management
  const addCategory = (categoryData) => {
    const newCat = {
      ...categoryData,
      id: generateId('cat'),
      budget: Number(categoryData.budget) || 0,
    }
    const updatedState = {
      ...data,
      categories: [...(data.categories || []), newCat],
    }
    setData(updatedState)
    persistState(updatedState)
    return newCat
  }

  const updateCategory = (id, fields) => {
    const updatedCategories = (data.categories || []).map(c => {
      if (c.id === id) {
        return {
          ...c,
          ...fields,
          budget: Number(fields.budget !== undefined ? fields.budget : c.budget),
        }
      }
      return c
    })
    const updatedState = { ...data, categories: updatedCategories }
    setData(updatedState)
    persistState(updatedState)
  }

  const deleteCategory = (id) => {
    const updatedState = {
      ...data,
      categories: (data.categories || []).filter(c => c.id !== id),
    }
    setData(updatedState)
    persistState(updatedState)
  }

  // Update Settings
  const updateSettings = (partialSettings) => {
    const updatedSettings = {
      ...data.settings,
      ...partialSettings,
      googleSheets: {
        ...data.settings?.googleSheets,
        ...(partialSettings.googleSheets || {}),
      },
      notifications: {
        ...data.settings?.notifications,
        ...(partialSettings.notifications || {}),
      },
      excelExport: {
        ...data.settings?.excelExport,
        ...(partialSettings.excelExport || {}),
      },
    }

    const updatedState = { ...data, settings: updatedSettings }
    setData(updatedState)
    persistState(updatedState, true)
  }

  // Reset demo or clear
  const resetToDemo = () => {
    const demoState = getResetDemoState()
    setData(demoState)
    persistState(demoState, true)
    setSyncStatus(demoState.settings?.googleSheets?.enabled ? 'saved_locally' : 'not_configured')
  }

  const clearAll = () => {
    const emptyState = getCleanState()
    setData(emptyState)
    persistState(emptyState, true)
    setSyncStatus('not_configured')
  }

  const restoreFromBackup = (jsonString) => {
    const restored = restoreJsonBackup(jsonString)
    setData(restored)
    persistState(restored, true)
  }

  return (
    <FinanceContext.Provider
      value={{
        // Raw collections
        expenses: data.expenses || [],
        income: data.income || [],
        loans: data.loans || [],
        loanPayments: data.loanPayments || [],
        bankAccounts: bankAccountsWithBalance,
        bankTransactions: data.bankTransactions || [],
        categories: data.categories || [],
        settings: data.settings || {},
        isDemo: data.isDemo,

        // Financial totals & KPI values
        totalBankBalance,
        financialTotals,
        loansSummary,

        // Sync state
        syncStatus,
        lastSyncedAt,
        syncErrorMessage,
        pendingChangesCount,
        triggerCloudSync: () => attemptCloudSync(data),

        // Actions
        addExpense,
        updateExpense,
        deleteExpense,
        addIncome,
        updateIncome,
        deleteIncome,
        addLoan,
        updateLoan,
        deleteLoan,
        recordLoanPayment,
        deleteLoanPayment,
        addBankAccount,
        updateBankAccount,
        deleteBankAccount,
        addBankTransaction,
        deleteBankTransaction,
        transferBetweenAccounts,
        importBankTransactions,
        addCategory,
        updateCategory,
        deleteCategory,
        updateSettings,
        resetToDemo,
        clearAll,
        exportJsonBackup: () => exportJsonBackup(data),
        restoreFromBackup,
      }}
    >
      {children}
    </FinanceContext.Provider>
  )
}

export const useFinance = () => {
  const context = useContext(FinanceContext)
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider')
  }
  return context
}
