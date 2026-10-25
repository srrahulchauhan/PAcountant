import {
  AlertCircle,
  ArrowDownLeft,
  ArrowRight,
  ArrowRightLeft,
  ArrowUpRight,
  Building2,
  Calendar,
  CheckCircle2,
  CreditCard,
  Download,
  Edit2,
  FileSpreadsheet,
  FileText,
  Filter,
  IndianRupee,
  Layers,
  Lock,
  Plus,
  Repeat,
  Search,
  ShieldCheck,
  Trash2,
  TrendingUp,
  UploadCloud,
  X,
} from 'lucide-react'
import React, { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AddBankModal } from '../components/modals/AddBankModal'
import { ImportStatementModal } from '../components/modals/ImportStatementModal'
import { TransferModal } from '../components/modals/TransferModal'
import { Badge } from '../components/ui/Badge'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'
import { Modal } from '../components/ui/Modal'
import { StatCard } from '../components/ui/StatCard'
import { useFinance } from '../context/FinanceContext'
import { formatDate, formatINR } from '../utils/formatters'
import { useToast } from '../components/ui/Toast'

export const BanksPage = () => {
  const { bankId: routeBankId } = useParams()
  const navigate = useNavigate()
  const {
    bankAccounts,
    bankTransactions,
    deleteBankAccount,
    addBankTransaction,
    deleteBankTransaction,
    totalBankBalance,
  } = useFinance()
  const { showToast } = useToast()

  // Selected Bank ID (null means Overview Dashboard; string means dedicated account ledger view)
  const [selectedBankId, setSelectedBankId] = useState(routeBankId || null)
  const [searchQuery, setSearchQuery] = useState('')
  const [txTypeFilter, setTxTypeFilter] = useState('all') // 'all' | 'credit' | 'debit' | 'transfer'

  // Modals
  const [isAddBankOpen, setIsAddBankOpen] = useState(false)
  const [editingBank, setEditingBank] = useState(null)
  const [isTransferOpen, setIsTransferOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isManualTxOpen, setIsManualTxOpen] = useState(false)
  const [deleteBankTarget, setDeleteBankTarget] = useState(null)
  const [deleteTxTarget, setDeleteTxTarget] = useState(null)

  // Manual Transaction Form State
  const [manualTx, setManualTx] = useState({
    description: '',
    amount: '',
    type: 'debit',
    referenceNumber: '',
    transactionDate: new Date().toISOString().slice(0, 10),
    transactionType: 'Online',
    notes: '',
  })

  // Selected Bank Object
  const currentBank = bankAccounts.find(b => b.id === selectedBankId) || null

  // Portfolio aggregates
  const bankStats = useMemo(() => {
    let totalCredits = 0
    let totalDebits = 0

    bankTransactions.forEach(t => {
      if (t.type === 'credit') totalCredits += Number(t.amount) || 0
      if (t.type === 'debit') totalDebits += Number(t.amount) || 0
    })

    return {
      totalCredits,
      totalDebits,
      activeAccountsCount: bankAccounts.length,
      savingsAccountsCount: bankAccounts.filter(b => b.accountType === 'Savings' || b.accountType === 'Salary').length,
      creditCardsCount: bankAccounts.filter(b => b.accountType === 'Credit Card').length,
    }
  }, [bankTransactions, bankAccounts])

  // Filtered transactions for selected bank (or all banks if overview)
  const displayedTransactions = useMemo(() => {
    let list = bankTransactions

    if (selectedBankId) {
      list = list.filter(t => t.bankAccountId === selectedBankId)
    }

    if (txTypeFilter === 'credit') {
      list = list.filter(t => t.type === 'credit' && !t.isTransfer)
    } else if (txTypeFilter === 'debit') {
      list = list.filter(t => t.type === 'debit' && !t.isTransfer)
    } else if (txTypeFilter === 'transfer') {
      list = list.filter(t => t.isTransfer)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        t =>
          (t.description && t.description.toLowerCase().includes(q)) ||
          (t.referenceNumber && t.referenceNumber.toLowerCase().includes(q)) ||
          String(t.amount).includes(q)
      )
    }

    return [...list].sort(
      (a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
    )
  }, [bankTransactions, selectedBankId, txTypeFilter, searchQuery])

  // Running balance calculation for dedicated single-bank ledger
  const ledgerWithRunningBalance = useMemo(() => {
    if (!currentBank) return []

    // Sort ascending to accumulate running balance from opening
    const ascTx = [...displayedTransactions].sort(
      (a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime()
    )

    let current = Number(currentBank.openingBalance) || 0
    const calculatedList = ascTx.map(t => {
      if (t.type === 'credit') current += Number(t.amount) || 0
      if (t.type === 'debit') current -= Number(t.amount) || 0
      return {
        ...t,
        runningBalance: current,
      }
    })

    // Return in reverse (newest first)
    return calculatedList.reverse()
  }, [displayedTransactions, currentBank])

  const handleManualTxSubmit = (e) => {
    e.preventDefault()
    if (!selectedBankId) {
      showToast('Please select a bank account first', 'error')
      return
    }
    if (!manualTx.amount || Number(manualTx.amount) <= 0) {
      showToast('Please enter a valid amount', 'error')
      return
    }

    addBankTransaction({
      ...manualTx,
      bankAccountId: selectedBankId,
      amount: Number(manualTx.amount),
      transactionDate: new Date(manualTx.transactionDate).toISOString(),
      referenceNumber: manualTx.referenceNumber || `TXN/${Date.now().toString().slice(-8)}`,
    })

    showToast(`Transaction of ${formatINR(manualTx.amount)} recorded in bank ledger`, 'success')
    setIsManualTxOpen(false)
    setManualTx({
      description: '',
      amount: '',
      type: 'debit',
      referenceNumber: '',
      transactionDate: new Date().toISOString().slice(0, 10),
      transactionType: 'Online',
      notes: '',
    })
  }

  const handleDeleteBank = () => {
    if (!deleteBankTarget) return
    deleteBankAccount(deleteBankTarget.id)
    showToast(`Bank account ${deleteBankTarget.accountNickname} deleted`, 'info')
    if (selectedBankId === deleteBankTarget.id) setSelectedBankId(null)
    setDeleteBankTarget(null)
  }

  const handleDeleteTx = () => {
    if (!deleteTxTarget) return
    deleteBankTransaction(deleteTxTarget.id)
    showToast('Transaction removed from bank ledger', 'info')
    setDeleteTxTarget(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {selectedBankId && (
              <button
                onClick={() => setSelectedBankId(null)}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-medium bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg"
              >
                ← All Banks
              </button>
            )}
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {currentBank ? `${currentBank.bankName} (${currentBank.accountNickname})` : 'Personal Bank Accounts'}
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {currentBank
              ? `Masked A/c: ${currentBank.maskedNumber} • Account Type: ${currentBank.accountType}`
              : 'Multi-bank portfolio manager with statement reconciliation and automated balance calculation'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsTransferOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-700 transition"
          >
            <Repeat className="h-3.5 w-3.5 text-amber-400" />
            <span>Transfer Funds</span>
          </button>
          <button
            onClick={() => setIsImportOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-700 transition"
          >
            <UploadCloud className="h-3.5 w-3.5 text-emerald-400" />
            <span>Import Statement</span>
          </button>
          {selectedBankId ? (
            <button
              onClick={() => setIsManualTxOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition shadow-lg shadow-emerald-950/40"
            >
              <Plus className="h-4 w-4" />
              <span>Record Bank Tx</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setEditingBank(null)
                setIsAddBankOpen(true)
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition shadow-lg shadow-emerald-950/40"
            >
              <Plus className="h-4 w-4" />
              <span>Add Bank Account</span>
            </button>
          )}
        </div>
      </div>

      {/* Top Aggregate KPI Cards */}
      {!selectedBankId ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Bank Liquidity"
            value={formatINR(totalBankBalance, { compact: true })}
            subtitle="Across all configured accounts"
            icon={Building2}
            variant="emerald"
          />
          <StatCard
            title="Total Account Credits"
            value={formatINR(bankStats.totalCredits, { compact: true })}
            subtitle="Inflows and deposits"
            icon={ArrowDownLeft}
            variant="emerald"
          />
          <StatCard
            title="Total Account Debits"
            value={formatINR(bankStats.totalDebits, { compact: true })}
            subtitle="Outflows, EMIs & card spends"
            icon={ArrowUpRight}
            variant="rose"
          />
          <StatCard
            title="Active Accounts"
            value={bankStats.activeAccountsCount}
            subtitle={`${bankStats.savingsAccountsCount} savings, ${bankStats.creditCardsCount} credit cards`}
            icon={CreditCard}
            variant="blue"
          />
        </div>
      ) : (
        /* Dedicated Single Bank Summary Cards */
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <StatCard
            title="Current Calculated Balance"
            value={formatINR(currentBank.calculatedBalance)}
            subtitle="Opening + Credits - Debits"
            icon={Building2}
            variant="emerald"
          />
          <StatCard
            title="Opening Balance"
            value={formatINR(currentBank.openingBalance)}
            subtitle={`As of ${formatDate(currentBank.openingBalanceDate)}`}
            icon={Calendar}
            variant="default"
          />
          <StatCard
            title="Total Credits"
            value={formatINR(currentBank.totalCredits)}
            subtitle="Inflows into this account"
            icon={ArrowDownLeft}
            variant="emerald"
          />
          <StatCard
            title="Total Debits"
            value={formatINR(currentBank.totalDebits)}
            subtitle="Outflows from this account"
            icon={ArrowUpRight}
            variant="rose"
          />
        </div>
      )}

      {/* Bank Account Cards Grid (Visible on Overview) */}
      {!selectedBankId && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Your Bank Accounts ({bankAccounts.length})</h3>
            <span className="text-xs text-slate-400">Click any card to open isolated account ledger</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {bankAccounts.map((bank) => (
              <div
                key={bank.id}
                onClick={() => setSelectedBankId(bank.id)}
                className="group cursor-pointer rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 p-5 hover:border-slate-700 transition shadow-xl relative overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-slate-200 group-hover:bg-emerald-600 group-hover:text-white transition">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-emerald-400 transition">
                        {bank.bankName}
                      </h4>
                      <p className="text-[10px] text-slate-400">{bank.accountNickname}</p>
                    </div>
                  </div>
                  <Badge variant={bank.accountType === 'Credit Card' ? 'amber' : 'emerald'} size="sm">
                    {bank.accountType}
                  </Badge>
                </div>

                <div className="mt-4">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    Calculated Balance
                  </span>
                  <div className="text-xl font-extrabold text-white tracking-tight mt-0.5">
                    {formatINR(bank.calculatedBalance)}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-slate-800/80">
                  <span className="font-mono text-slate-500">{bank.maskedNumber}</span>
                  <span className="text-emerald-400 font-semibold group-hover:translate-x-0.5 transition flex items-center gap-1">
                    <span>View Ledger</span>
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transactions / Ledger Section */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl space-y-4">
        {/* Table Filter & Controls Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-semibold text-white">
              {currentBank ? `${currentBank.accountNickname} Transaction Ledger` : 'Recent Bank Statement Activity'}
            </h3>
            <p className="text-xs text-slate-400">
              Verified deposits, debits, UPI transfers, and account reconciliations
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter pills */}
            <div className="flex items-center p-1 bg-slate-950/80 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setTxTypeFilter('all')}
                className={`px-2.5 py-1 font-medium rounded-lg transition ${
                  txTypeFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setTxTypeFilter('credit')}
                className={`px-2.5 py-1 font-medium rounded-lg transition ${
                  txTypeFilter === 'credit' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Credits
              </button>
              <button
                onClick={() => setTxTypeFilter('debit')}
                className={`px-2.5 py-1 font-medium rounded-lg transition ${
                  txTypeFilter === 'debit' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Debits
              </button>
              <button
                onClick={() => setTxTypeFilter('transfer')}
                className={`px-2.5 py-1 font-medium rounded-lg transition ${
                  txTypeFilter === 'transfer' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Transfers
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search narration, UTR..."
                className="rounded-xl border border-slate-800 bg-slate-950/80 py-1.5 pl-8 pr-3 text-xs text-white placeholder:text-slate-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Description / Narration</th>
                <th className="py-2.5 px-3">UTR / Ref</th>
                <th className="py-2.5 px-3">Type</th>
                {!selectedBankId && <th className="py-2.5 px-3">Bank Account</th>}
                <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                {selectedBankId && <th className="py-2.5 px-3 text-right">Running Balance</th>}
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {(selectedBankId ? ledgerWithRunningBalance : displayedTransactions).length === 0 ? (
                <tr>
                  <td colSpan={selectedBankId ? 7 : 7}>
                    <EmptyState
                      title="No bank transactions found"
                      description="Add a transaction or import your monthly bank statement."
                      actionLabel={selectedBankId ? 'Add Transaction' : 'Import Statement'}
                      onAction={() => (selectedBankId ? setIsManualTxOpen(true) : setIsImportOpen(true))}
                    />
                  </td>
                </tr>
              ) : (
                (selectedBankId ? ledgerWithRunningBalance : displayedTransactions).map((t) => {
                  const bank = bankAccounts.find(b => b.id === t.bankAccountId)

                  return (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3 whitespace-nowrap">{formatDate(t.transactionDate)}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`rounded-lg p-1 shrink-0 ${
                              t.isTransfer
                                ? 'bg-blue-500/10 text-blue-400'
                                : t.type === 'credit'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-rose-500/10 text-rose-400'
                            }`}
                          >
                            {t.isTransfer ? (
                              <ArrowRightLeft className="h-3 w-3" />
                            ) : t.type === 'credit' ? (
                              <ArrowDownLeft className="h-3 w-3" />
                            ) : (
                              <ArrowUpRight className="h-3 w-3" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{t.description}</p>
                            {t.isTransfer && (
                              <span className="text-[10px] text-blue-400 font-medium">Internal Transfer</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400 text-[11px]">{t.referenceNumber || '—'}</td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <Badge
                          variant={t.isTransfer ? 'blue' : t.type === 'credit' ? 'emerald' : 'rose'}
                          size="sm"
                        >
                          {t.isTransfer ? 'Transfer' : t.type === 'credit' ? 'Credit' : 'Debit'}
                        </Badge>
                      </td>
                      {!selectedBankId && (
                        <td className="py-3 px-3 whitespace-nowrap text-slate-300">
                          {bank ? `${bank.bankName} (${bank.accountNickname})` : '—'}
                        </td>
                      )}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <span
                          className={`font-bold ${
                            t.type === 'credit' ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {t.type === 'credit' ? '+' : '-'}{formatINR(t.amount)}
                        </span>
                      </td>
                      {selectedBankId && (
                        <td className="py-3 px-3 text-right whitespace-nowrap font-semibold text-slate-200">
                          {formatINR(t.runningBalance)}
                        </td>
                      )}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => setDeleteTxTarget(t)}
                          className="text-slate-500 hover:text-rose-400 transition"
                          title="Delete transaction"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <AddBankModal
        isOpen={isAddBankOpen}
        onClose={() => {
          setIsAddBankOpen(false)
          setEditingBank(null)
        }}
        editingBank={editingBank}
      />

      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        defaultFromBankId={selectedBankId}
      />

      <ImportStatementModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        targetBankId={selectedBankId}
      />

      {/* Manual Transaction Modal */}
      {selectedBankId && (
        <Modal
          isOpen={isManualTxOpen}
          onClose={() => setIsManualTxOpen(false)}
          title={`Record Bank Transaction: ${currentBank?.bankName}`}
          subtitle={`Adding directly to ${currentBank?.accountNickname} ledger`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleManualTxSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Transaction Type</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setManualTx({ ...manualTx, type: 'debit' })}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition ${
                    manualTx.type === 'debit' ? 'bg-rose-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Debit / Withdrawal (-)
                </button>
                <button
                  type="button"
                  onClick={() => setManualTx({ ...manualTx, type: 'credit' })}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition ${
                    manualTx.type === 'credit' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Credit / Deposit (+)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Description / Narration</label>
              <input
                type="text"
                required
                value={manualTx.description}
                onChange={(e) => setManualTx({ ...manualTx, description: e.target.value })}
                placeholder="e.g. ATM Cash Withdrawal, Client Payment"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3 text-xs text-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Amount in INR (₹)</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={manualTx.amount}
                  onChange={(e) => setManualTx({ ...manualTx, amount: e.target.value })}
                  placeholder="e.g. 5000"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3 text-xs font-bold text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={manualTx.transactionDate}
                  onChange={(e) => setManualTx({ ...manualTx, transactionDate: e.target.value })}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Reference / UTR Number</label>
              <input
                type="text"
                value={manualTx.referenceNumber}
                onChange={(e) => setManualTx({ ...manualTx, referenceNumber: e.target.value })}
                placeholder="e.g. IMPS/002918401"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-xs text-white focus:outline-none"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsManualTxOpen(false)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-500 shadow-lg"
              >
                Add to Ledger
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Bank Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteBankTarget)}
        onClose={() => setDeleteBankTarget(null)}
        onConfirm={handleDeleteBank}
        title="Delete Bank Account?"
        message={`Are you sure you want to delete ${deleteBankTarget?.bankName} (${deleteBankTarget?.accountNickname}) and its transactions?`}
        confirmText="Delete Account"
        isDestructive={true}
      />

      {/* Delete Transaction Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTxTarget)}
        onClose={() => setDeleteTxTarget(null)}
        onConfirm={handleDeleteTx}
        title="Delete Bank Transaction?"
        message={`Remove "${deleteTxTarget?.description}" from account ledger? If part of an internal transfer, the partner record will also be removed.`}
        confirmText="Delete"
        isDestructive={true}
      />
    </div>
  )
}
