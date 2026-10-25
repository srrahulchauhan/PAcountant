import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpDown,
  ArrowUpRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit2,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  IndianRupee,
  Layers,
  Plus,
  Receipt,
  Search,
  Tag,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react'
import React, { useMemo, useState } from 'react'
import { AddExpenseModal } from '../components/modals/AddExpenseModal'
import { Badge } from '../components/ui/Badge'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'
import { Modal } from '../components/ui/Modal'
import { ProgressBar } from '../components/ui/ProgressBar'
import { useFinance } from '../context/FinanceContext'
import { exportTransactionsToCSV, exportFullExcelWorkbook } from '../services/excelService'
import { formatDate, formatDateTime, formatINR } from '../utils/formatters'
import { useToast } from '../components/ui/Toast'

export const ExpensesPage = () => {
  const { expenses, income, categories, bankAccounts, deleteExpense, deleteIncome } = useFinance()
  const { showToast } = useToast()

  // State
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'expense' | 'income'
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedMethod, setSelectedMethod] = useState('all')
  const [selectedBank, setSelectedBank] = useState('all')
  const [dateFilter, setDateFilter] = useState('month') // 'today' | 'week' | 'month' | 'last_month' | 'all' | 'custom'
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  
  // Sorting & Pagination
  const [sortBy, setSortBy] = useState('date') // 'date' | 'amount' | 'name'
  const [sortOrder, setSortOrder] = useState('desc') // 'asc' | 'desc'
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [previewReceipt, setPreviewReceipt] = useState(null)

  // Merge expenses and income into unified view with types
  const allTransactions = useMemo(() => {
    const list = []
    if (activeTab === 'all' || activeTab === 'expense') {
      expenses.forEach(e => {
        const cat = categories.find(c => c.id === e.category)
        const bank = bankAccounts.find(b => b.id === e.bankAccountId)
        list.push({
          ...e,
          type: 'expense',
          categoryName: cat ? cat.name : 'Other',
          categoryColor: cat ? cat.color : '#94a3b8',
          bankName: bank ? bank.bankName : null,
          bankNickname: bank ? bank.accountNickname : null,
          title: e.merchant || e.description || 'Expense',
        })
      })
    }
    if (activeTab === 'all' || activeTab === 'income') {
      income.forEach(i => {
        const cat = categories.find(c => c.id === i.category)
        const bank = bankAccounts.find(b => b.id === i.bankAccountId)
        list.push({
          ...i,
          type: 'income',
          categoryName: cat ? cat.name : 'Income',
          categoryColor: cat ? cat.color : '#10b981',
          bankName: bank ? bank.bankName : null,
          bankNickname: bank ? bank.accountNickname : null,
          title: i.source || i.description || 'Income',
        })
      })
    }
    return list
  }, [expenses, income, categories, bankAccounts, activeTab])

  // Filter transactions based on date, search, category, method, bank
  const filteredTransactions = useMemo(() => {
    const now = new Date()

    return allTransactions.filter(item => {
      // 1. Text Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchTitle = (item.title || '').toLowerCase().includes(query)
        const matchDesc = (item.description || '').toLowerCase().includes(query)
        const matchMerchant = (item.merchant || '').toLowerCase().includes(query)
        const matchSource = (item.source || '').toLowerCase().includes(query)
        const matchAmount = String(item.amount).includes(query)
        if (!matchTitle && !matchDesc && !matchMerchant && !matchSource && !matchAmount) return false
      }

      // 2. Category Filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false
      }

      // 3. Payment Method Filter
      if (selectedMethod !== 'all' && item.paymentMethod !== selectedMethod) {
        return false
      }

      // 4. Bank Filter
      if (selectedBank !== 'all' && item.bankAccountId !== selectedBank) {
        return false
      }

      // 5. Date Filter
      const itemDate = new Date(item.date)
      if (dateFilter === 'today') {
        return itemDate.toDateString() === now.toDateString()
      }
      if (dateFilter === 'week') {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        return itemDate >= oneWeekAgo
      }
      if (dateFilter === 'month') {
        return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear()
      }
      if (dateFilter === 'last_month') {
        const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1
        const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
        return itemDate.getMonth() === prevMonth && itemDate.getFullYear() === prevYear
      }
      if (dateFilter === 'custom' && startDate && endDate) {
        const start = new Date(startDate)
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        return itemDate >= start && itemDate <= end
      }

      return true
    })
  }, [allTransactions, searchQuery, selectedCategory, selectedMethod, selectedBank, dateFilter, startDate, endDate])

  // Sorting
  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      let comparison = 0
      if (sortBy === 'date') {
        comparison = new Date(b.date).getTime() - new Date(a.date).getTime()
      } else if (sortBy === 'amount') {
        comparison = Number(b.amount) - Number(a.amount)
      } else if (sortBy === 'name') {
        comparison = (a.title || '').localeCompare(b.title || '')
      }
      return sortOrder === 'asc' ? -comparison : comparison
    })
  }, [filteredTransactions, sortBy, sortOrder])

  // Pagination
  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage) || 1
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return sortedTransactions.slice(start, start + itemsPerPage)
  }, [sortedTransactions, currentPage, itemsPerPage])

  // Summary figures for filtered view
  const filteredTotals = useMemo(() => {
    const totalExp = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
    const totalInc = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
    return { totalExp, totalInc, net: totalInc - totalExp }
  }, [filteredTransactions])

  // Top Merchants Breakdown
  const topMerchants = useMemo(() => {
    const map = {}
    expenses.forEach(e => {
      const name = e.merchant || 'Other'
      map[name] = (map[name] || 0) + (Number(e.amount) || 0)
    })
    return Object.entries(map)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
  }, [expenses])

  // Spending Comparison vs Last Month
  const monthlyComparison = useMemo(() => {
    const now = new Date()
    const thisMonthExpenses = expenses
      .filter(e => {
        const d = new Date(e.date)
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      })
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0)

    const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1
    const lastYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
    const lastMonthExpenses = expenses
      .filter(e => {
        const d = new Date(e.date)
        return d.getMonth() === lastMonth && d.getFullYear() === lastYear
      })
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0)

    const diff = thisMonthExpenses - lastMonthExpenses
    const pct = lastMonthExpenses > 0 ? Math.round((diff / lastMonthExpenses) * 100) : 0
    return { thisMonthExpenses, lastMonthExpenses, diff, pct, isLower: diff < 0 }
  }, [expenses])

  const handleDelete = () => {
    if (!deleteTarget) return
    if (deleteTarget.type === 'expense') {
      deleteExpense(deleteTarget.id)
      showToast('Expense deleted successfully', 'info')
    } else {
      deleteIncome(deleteTarget.id)
      showToast('Income record deleted', 'info')
    }
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Expense & Income Tracker
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Record, categorize, and reconcile your daily spends with zero duplicate counting
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportTransactionsToCSV(filteredTransactions, 'filtered_expenses.csv')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-700 transition"
            title="Export filtered records to CSV"
          >
            <Download className="h-3.5 w-3.5 text-blue-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => {
              exportFullExcelWorkbook({ expenses, income, bankAccounts, categories })
              showToast('Complete financial workbook downloaded as .xlsx', 'success')
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-700 transition"
            title="Export complete workbook with all 8 sheets"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
            <span>Excel (.xlsx)</span>
          </button>
          <button
            onClick={() => {
              setEditingItem(null)
              setIsModalOpen(true)
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition shadow-lg shadow-emerald-950/40"
          >
            <Plus className="h-4 w-4" />
            <span>Record Transaction</span>
          </button>
        </div>
      </div>

      {/* Top Insights Row: Spend vs Last Month + Filter Totals + Top Merchant */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Month vs Month Comparison Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-xl">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
            Monthly Spend Trend
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-bold text-white">
              {formatINR(monthlyComparison.thisMonthExpenses)}
            </span>
            <span
              className={`inline-flex items-center text-xs font-semibold px-1.5 py-0.5 rounded ${
                monthlyComparison.isLower
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-rose-500/10 text-rose-400'
              }`}
            >
              {monthlyComparison.pct > 0 ? `+${monthlyComparison.pct}%` : `${monthlyComparison.pct}%`}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            vs {formatINR(monthlyComparison.lastMonthExpenses)} in previous month
          </p>
        </div>

        {/* Filtered Range Outflow / Inflow Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-xl">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
            Filtered Period Totals
          </span>
          <div className="mt-1 flex items-center justify-between">
            <div>
              <span className="text-xs text-rose-400 font-semibold">Expense:</span>
              <p className="text-base font-bold text-white">-{formatINR(filteredTotals.totalExp)}</p>
            </div>
            <div>
              <span className="text-xs text-emerald-400 font-semibold">Income:</span>
              <p className="text-base font-bold text-white">+{formatINR(filteredTotals.totalInc)}</p>
            </div>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Net Surplus: <strong className="text-emerald-400">{formatINR(filteredTotals.net)}</strong>
          </p>
        </div>

        {/* Top Merchant Leaderboard Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-xl">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
            Top Spends by Merchant
          </span>
          <div className="mt-1.5 space-y-1">
            {topMerchants.slice(0, 2).map((m, idx) => (
              <div key={m.name} className="flex items-center justify-between text-xs">
                <span className="text-slate-300 truncate">
                  {idx + 1}. {m.name}
                </span>
                <span className="font-semibold text-slate-200">{formatINR(m.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-xl space-y-3">
        {/* Row 1: Tabs + Search + Date Range */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center p-1 bg-slate-950/80 rounded-xl border border-slate-800 shrink-0">
            <button
              onClick={() => {
                setActiveTab('all')
                setCurrentPage(1)
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === 'all' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Records
            </button>
            <button
              onClick={() => {
                setActiveTab('expense')
                setCurrentPage(1)
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === 'expense' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Expenses
            </button>
            <button
              onClick={() => {
                setActiveTab('income')
                setCurrentPage(1)
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === 'income' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Income
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Search by merchant, notes, or amount..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-1.5 pl-8 pr-3 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Quick Date Range Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {['today', 'week', 'month', 'last_month', 'all', 'custom'].map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  setDateFilter(mode)
                  setCurrentPage(1)
                }}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition ${
                  dateFilter === mode
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-slate-200'
                }`}
              >
                {mode === 'today'
                  ? 'Today'
                  : mode === 'week'
                  ? 'This Week'
                  : mode === 'month'
                  ? 'This Month'
                  : mode === 'last_month'
                  ? 'Last Month'
                  : mode === 'all'
                  ? 'All Time'
                  : 'Custom'}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Secondary Dropdown Filters (Category, Method, Bank) + Custom Date Range */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/60 text-xs">
          {/* Custom Date Pickers */}
          {dateFilter === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-lg border border-slate-800 bg-slate-950 py-1 px-2 text-xs text-white focus:outline-none"
              />
              <span className="text-slate-500">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-lg border border-slate-800 bg-slate-950 py-1 px-2 text-xs text-white focus:outline-none"
              />
            </div>
          )}

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value)
              setCurrentPage(1)
            }}
            className="rounded-lg border border-slate-800 bg-slate-950 py-1.5 px-2.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Payment Method Dropdown */}
          <select
            value={selectedMethod}
            onChange={(e) => {
              setSelectedMethod(e.target.value)
              setCurrentPage(1)
            }}
            className="rounded-lg border border-slate-800 bg-slate-950 py-1.5 px-2.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">All Payment Methods</option>
            <option value="UPI">UPI</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Debit Card">Debit Card</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Cash">Cash</option>
          </select>

          {/* Bank Account Dropdown */}
          <select
            value={selectedBank}
            onChange={(e) => {
              setSelectedBank(e.target.value)
              setCurrentPage(1)
            }}
            className="rounded-lg border border-slate-800 bg-slate-950 py-1.5 px-2.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">All Bank Accounts</option>
            {bankAccounts.map((b) => (
              <option key={b.id} value={b.id}>
                {b.bankName} - {b.accountNickname}
              </option>
            ))}
          </select>

          {/* Reset Filters */}
          {(selectedCategory !== 'all' ||
            selectedMethod !== 'all' ||
            selectedBank !== 'all' ||
            searchQuery ||
            dateFilter !== 'month') && (
            <button
              onClick={() => {
                setSelectedCategory('all')
                setSelectedMethod('all')
                setSelectedBank('all')
                setSearchQuery('')
                setDateFilter('month')
                setCurrentPage(1)
              }}
              className="text-xs text-slate-400 hover:text-white underline ml-auto"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Transactions Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th
                  onClick={() => {
                    setSortBy('date')
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                  }}
                  className="py-3 px-4 cursor-pointer hover:text-white transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Date & Time</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => {
                    setSortBy('name')
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                  }}
                  className="py-3 px-4 cursor-pointer hover:text-white transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Merchant / Description</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Bank Account</th>
                <th
                  onClick={() => {
                    setSortBy('amount')
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                  }}
                  className="py-3 px-4 text-right cursor-pointer hover:text-white transition"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Amount (INR)</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center">Receipt</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan="8">
                    <EmptyState
                      title="No transactions match your filters"
                      description="Try widening your date range or removing active filters."
                      actionLabel="Record New Transaction"
                      onAction={() => {
                        setEditingItem(null)
                        setIsModalOpen(true)
                      }}
                    />
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/40 transition">
                    {/* Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-medium text-slate-200">{formatDate(tx.date)}</span>
                      <span className="text-[10px] text-slate-500 block">
                        {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>

                    {/* Merchant / Title */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={`rounded-lg p-1.5 shrink-0 ${
                            tx.type === 'income'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-rose-500/10 text-rose-400'
                          }`}
                        >
                          {tx.type === 'income' ? (
                            <ArrowDownLeft className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{tx.title}</p>
                          {tx.description && tx.description !== tx.title && (
                            <p className="text-[11px] text-slate-400 truncate max-w-xs">{tx.description}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <Badge variant="slate" size="sm" dot>
                        <span style={{ color: tx.categoryColor }}>{tx.categoryName}</span>
                      </Badge>
                      {tx.subcategory && (
                        <span className="text-[10px] text-slate-500 block mt-0.5">{tx.subcategory}</span>
                      )}
                    </td>

                    {/* Payment Method */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-400">
                      {tx.paymentMethod || '—'}
                    </td>

                    {/* Linked Bank */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {tx.bankName ? (
                        <div>
                          <span className="font-medium text-slate-200">{tx.bankName}</span>
                          <span className="text-[10px] text-slate-500 block">{tx.bankNickname}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Unlinked</span>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <span
                        className={`text-sm font-bold ${
                          tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '-'}{formatINR(tx.amount)}
                      </span>
                    </td>

                    {/* Receipt */}
                    <td className="py-3.5 px-4 text-center">
                      {tx.receiptUrl ? (
                        <button
                          onClick={() => setPreviewReceipt(tx.receiptUrl)}
                          className="rounded-lg p-1 text-emerald-400 hover:bg-emerald-500/10 transition"
                          title="View Receipt Attachment"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingItem(tx)
                            setIsModalOpen(true)
                          }}
                          className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition"
                          title="Edit transaction"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(tx)}
                          className="rounded-lg p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                          title="Delete transaction"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {sortedTransactions.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800 text-xs text-slate-400">
            <span>
              Showing {Math.min((currentPage - 1) * itemsPerPage + 1, sortedTransactions.length)} to{' '}
              {Math.min(currentPage * itemsPerPage, sortedTransactions.length)} of {sortedTransactions.length} records
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="rounded-lg p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2 font-medium text-slate-300">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="rounded-lg p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Transaction Modal */}
      <AddExpenseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingItem(null)
        }}
        initialType={activeTab === 'income' ? 'income' : 'expense'}
        editingItem={editingItem}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete ${deleteTarget?.type === 'income' ? 'Income' : 'Expense'} Record?`}
        message={`Are you sure you want to permanently delete "${deleteTarget?.title}" (${formatINR(
          deleteTarget?.amount
        )})? If linked to a bank transaction, the bank ledger will be adjusted automatically.`}
        confirmText="Delete Record"
        isDestructive={true}
      />

      {/* Receipt Preview Modal */}
      {previewReceipt && (
        <Modal
          isOpen={Boolean(previewReceipt)}
          onClose={() => setPreviewReceipt(null)}
          title="Receipt Attachment Preview"
          maxWidth="max-w-md"
        >
          <div className="p-2">
            <img src={previewReceipt} alt="Receipt preview" className="w-full rounded-xl object-contain max-h-96" />
          </div>
        </Modal>
      )}
    </div>
  )
}
