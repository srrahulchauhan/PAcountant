/**
 * Excel & CSV Service for Personal Accountant Pro
 * Powered by SheetJS (xlsx)
 * Supports:
 * - Multi-sheet formatted Excel workbook export (.xlsx)
 * - CSV export of filtered records
 * - Statement import with column detection and mapping preview
 */

import * as XLSX from 'xlsx'
import { formatDate, formatINR } from '../utils/formatters'

/**
 * Generate and download a comprehensive multi-sheet Excel workbook
 */
export const exportFullExcelWorkbook = (data) => {
  const wb = XLSX.utils.book_new()

  // 1. Executive Summary Sheet
  const totalIncome = (data.income || []).reduce((sum, i) => sum + (Number(i.amount) || 0), 0)
  const totalExpenses = (data.expenses || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
  const netSavings = totalIncome - totalExpenses
  const totalBankBalance = (data.bankAccounts || []).reduce((sum, b) => {
    // Calculated balance
    const credits = (data.bankTransactions || [])
      .filter(t => t.bankAccountId === b.id && t.type === 'credit')
      .reduce((s, t) => s + (Number(t.amount) || 0), 0)
    const debits = (data.bankTransactions || [])
      .filter(t => t.bankAccountId === b.id && t.type === 'debit')
      .reduce((s, t) => s + (Number(t.amount) || 0), 0)
    return sum + (Number(b.openingBalance) || 0) + credits - debits
  }, 0)

  const totalLoanPrincipal = (data.loans || []).reduce((sum, l) => sum + (Number(l.principalAmount) || 0), 0)

  const summaryRows = [
    ['PERSONAL ACCOUNTANT PRO — FINANCIAL SUMMARY REPORT'],
    [`Generated On: ${formatDate(new Date())}`],
    ['Currency: INR (₹)'],
    [''],
    ['Key Metric', 'Amount (₹)', 'Notes'],
    ['Total Income Recorded', totalIncome, 'All verified income streams'],
    ['Total Expenses Recorded', totalExpenses, 'Daily & recurring expenses'],
    ['Net Recorded Savings', netSavings, 'Income minus Expenses'],
    ['Total Calculated Bank Balance', totalBankBalance, 'Sum across all active bank accounts'],
    ['Total Loan Liabilities (Principal)', totalLoanPrincipal, 'Active loan portfolio'],
    [''],
    ['Account Portfolio Overview:'],
    ...((data.bankAccounts || []).map(b => [b.bankName, b.accountNickname, b.accountType, b.maskedNumber])),
  ]
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows)
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

  // 2. Expenses Sheet
  const expenseHeaders = [
    'Expense ID',
    'Date (DD/MM/YYYY)',
    'Amount (₹)',
    'Category',
    'Subcategory',
    'Merchant / Payee',
    'Payment Method',
    'Bank Account',
    'Description',
    'Bank Linked',
  ]
  const expenseRows = (data.expenses || []).map(e => {
    const cat = (data.categories || []).find(c => c.id === e.category)
    const bank = (data.bankAccounts || []).find(b => b.id === e.bankAccountId)
    return [
      e.id,
      formatDate(e.date),
      Number(e.amount) || 0,
      cat ? cat.name : e.category,
      e.subcategory || 'General',
      e.merchant || '—',
      e.paymentMethod || '—',
      bank ? `${bank.bankName} (${bank.accountNickname})` : 'Unlinked',
      e.description || '',
      e.isLinkedToBank ? 'YES' : 'NO',
    ]
  })
  const wsExpenses = XLSX.utils.aoa_to_sheet([expenseHeaders, ...expenseRows])
  XLSX.utils.book_append_sheet(wb, wsExpenses, 'Expenses')

  // 3. Income Sheet
  const incomeHeaders = [
    'Income ID',
    'Date (DD/MM/YYYY)',
    'Amount (₹)',
    'Source',
    'Category',
    'Bank Account',
    'Payment Method',
    'Description',
  ]
  const incomeRows = (data.income || []).map(i => {
    const cat = (data.categories || []).find(c => c.id === i.category)
    const bank = (data.bankAccounts || []).find(b => b.id === i.bankAccountId)
    return [
      i.id,
      formatDate(i.date),
      Number(i.amount) || 0,
      i.source || '—',
      cat ? cat.name : i.category,
      bank ? `${bank.bankName} (${bank.accountNickname})` : 'Unlinked',
      i.paymentMethod || 'Bank Transfer',
      i.description || '',
    ]
  })
  const wsIncome = XLSX.utils.aoa_to_sheet([incomeHeaders, ...incomeRows])
  XLSX.utils.book_append_sheet(wb, wsIncome, 'Income')

  // 4. Loans & EMIs Sheet
  const loanHeaders = [
    'Loan ID',
    'Loan Name',
    'Lender',
    'Loan Type',
    'Principal Amount (₹)',
    'Interest Rate (% p.a.)',
    'Calculation Method',
    'Monthly EMI (₹)',
    'Tenure (Months)',
    'Monthly Due Day',
    'Start Date',
    'Notes',
  ]
  const loanRows = (data.loans || []).map(l => [
    l.id,
    l.loanName,
    l.lender,
    l.loanType,
    Number(l.principalAmount) || 0,
    Number(l.interestRate) || 0,
    l.calculationMethod === 'flat' ? 'Flat Rate' : 'Reducing Balance',
    Number(l.emiAmount) || 0,
    Number(l.tenureMonths) || 0,
    l.monthlyDueDay || 1,
    formatDate(l.startDate),
    l.notes || '',
  ])
  const wsLoans = XLSX.utils.aoa_to_sheet([loanHeaders, ...loanRows])
  XLSX.utils.book_append_sheet(wb, wsLoans, 'Loans')

  // 5. EMI Payments Sheet
  const paymentHeaders = [
    'Payment ID',
    'Loan ID',
    'Installment #',
    'Payment Date',
    'Amount Paid (₹)',
    'Principal Portion (₹)',
    'Interest Portion (₹)',
    'Payment Mode',
    'Reference / UTR',
    'Status',
    'Notes',
  ]
  const paymentRows = (data.loanPayments || []).map(p => [
    p.id,
    p.loanId,
    p.installmentNumber,
    formatDate(p.paymentDate),
    Number(p.amount) || 0,
    Number(p.principalComponent) || 0,
    Number(p.interestComponent) || 0,
    p.paymentMethod || 'Auto Debit',
    p.referenceNumber || '—',
    p.status || 'paid',
    p.notes || '',
  ])
  const wsPayments = XLSX.utils.aoa_to_sheet([paymentHeaders, ...paymentRows])
  XLSX.utils.book_append_sheet(wb, wsPayments, 'EMI Payments')

  // 6. Bank Accounts Sheet
  const bankHeaders = [
    'Bank Account ID',
    'Bank Name',
    'Account Nickname',
    'Account Type',
    'Account Holder',
    'Masked Account Number',
    'Opening Balance (₹)',
    'Opening Date',
    'Calculated Balance (₹)',
    'Notes',
  ]
  const bankRows = (data.bankAccounts || []).map(b => {
    const credits = (data.bankTransactions || [])
      .filter(t => t.bankAccountId === b.id && t.type === 'credit')
      .reduce((s, t) => s + (Number(t.amount) || 0), 0)
    const debits = (data.bankTransactions || [])
      .filter(t => t.bankAccountId === b.id && t.type === 'debit')
      .reduce((s, t) => s + (Number(t.amount) || 0), 0)
    const calcBal = (Number(b.openingBalance) || 0) + credits - debits

    return [
      b.id,
      b.bankName,
      b.accountNickname,
      b.accountType,
      b.accountHolder,
      b.maskedNumber || '••••',
      Number(b.openingBalance) || 0,
      formatDate(b.openingBalanceDate),
      calcBal,
      b.notes || '',
    ]
  })
  const wsBanks = XLSX.utils.aoa_to_sheet([bankHeaders, ...bankRows])
  XLSX.utils.book_append_sheet(wb, wsBanks, 'Bank Accounts')

  // 7. Bank Transactions Sheet
  const btHeaders = [
    'Tx ID',
    'Bank ID',
    'Date',
    'Description',
    'Type (Credit/Debit)',
    'Amount (₹)',
    'Reference / UTR',
    'Transaction Type',
    'Internal Transfer',
    'Notes',
  ]
  const btRows = (data.bankTransactions || []).map(t => [
    t.id,
    t.bankAccountId,
    formatDate(t.transactionDate),
    t.description,
    (t.type || '').toUpperCase(),
    Number(t.amount) || 0,
    t.referenceNumber || '—',
    t.transactionType || 'Online',
    t.isTransfer ? 'YES' : 'NO',
    t.notes || '',
  ])
  const wsBT = XLSX.utils.aoa_to_sheet([btHeaders, ...btRows])
  XLSX.utils.book_append_sheet(wb, wsBT, 'Bank Transactions')

  // 8. Budgets Sheet
  const budgetHeaders = ['Category', 'Monthly Budget (₹)', 'Type']
  const budgetRows = (data.categories || [])
    .filter(c => c.type === 'expense')
    .map(c => [c.name, Number(c.budget) || 0, c.type])
  const wsBudgets = XLSX.utils.aoa_to_sheet([budgetHeaders, ...budgetRows])
  XLSX.utils.book_append_sheet(wb, wsBudgets, 'Budgets')

  // Write and trigger download
  const dateStr = new Date().toISOString().split('T')[0]
  XLSX.writeFile(wb, `Personal_Accountant_Pro_${dateStr}.xlsx`)
}

/**
 * Export filtered transactions directly to CSV
 */
export const exportTransactionsToCSV = (items, filename = 'expenses_export.csv') => {
  const headers = ['Date', 'Amount (INR)', 'Category', 'Subcategory', 'Merchant', 'Payment Method', 'Notes']
  const rows = items.map(item => [
    formatDate(item.date),
    item.amount,
    item.categoryName || item.category,
    item.subcategory || '',
    item.merchant || '',
    item.paymentMethod || '',
    `"${(item.description || '').replace(/"/g, '""')}"`,
  ])

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Parse an uploaded statement file (CSV or XLSX)
 * Detects headers and returns sample rows for mapping
 */
export const parseUploadedStatement = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

        if (!rawJson || rawJson.length === 0) {
          throw new Error('Empty file or no readable data found.')
        }

        // Find header row (the first row with at least 3 non-empty values)
        let headerRowIndex = 0
        for (let i = 0; i < Math.min(rawJson.length, 10); i++) {
          const row = rawJson[i]
          if (Array.isArray(row) && row.filter(cell => cell !== undefined && cell !== '').length >= 3) {
            headerRowIndex = i
            break
          }
        }

        const headers = rawJson[headerRowIndex].map(h => String(h || '').trim())
        const dataRows = rawJson.slice(headerRowIndex + 1).filter(r => r && r.length > 0)

        // Best guess mappings
        const guess = {
          dateCol: headers.find(h => /date|txn.*date|value.*date/i.test(h)) || headers[0],
          descCol: headers.find(h => /desc|particulars|narration|remarks/i.test(h)) || headers[1],
          refCol: headers.find(h => /ref|utr|chq|cheque/i.test(h)) || '',
          debitCol: headers.find(h => /debit|withdrawal|dr/i.test(h)) || '',
          creditCol: headers.find(h => /credit|deposit|cr/i.test(h)) || '',
          amountCol: headers.find(h => /amount|trans.*amt/i.test(h)) || '',
        }

        resolve({
          fileName: file.name,
          headers,
          dataRows,
          suggestedMapping: guess,
        })
      } catch (err) {
        reject(err)
      }
    }

    reader.onerror = (err) => reject(err)
    reader.readAsArrayBuffer(file)
  })
}
