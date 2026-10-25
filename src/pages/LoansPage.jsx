import {
  AlertCircle,
  ArrowRight,
  Calculator,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Download,
  Edit2,
  FileCheck,
  FileSpreadsheet,
  HelpCircle,
  IndianRupee,
  Info,
  Landmark,
  Percent,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  TrendingUp,
} from 'lucide-react'
import React, { useMemo, useState } from 'react'
import { AddLoanModal } from '../components/modals/AddLoanModal'
import { RecordPaymentModal } from '../components/modals/RecordPaymentModal'
import { Badge } from '../components/ui/Badge'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'
import { Modal } from '../components/ui/Modal'
import { ProgressBar } from '../components/ui/ProgressBar'
import { StatCard } from '../components/ui/StatCard'
import { useFinance } from '../context/FinanceContext'
import { formatDate, formatINR, getRelativeDays } from '../utils/formatters'
import {
  calculateLoanMetrics,
  calculatePrepaymentImpact,
  generateAmortizationSchedule,
} from '../utils/loanCalculations'
import { useToast } from '../components/ui/Toast'

export const LoansPage = () => {
  const { loans, loanPayments, deleteLoan, deleteLoanPayment, updateLoan } = useFinance()
  const { showToast } = useToast()

  // Selected Loan for Schedule & Detail view
  const [selectedLoanId, setSelectedLoanId] = useState(loans[0]?.id || null)
  const [activeTab, setActiveTab] = useState('schedule') // 'schedule' | 'history' | 'prepayment'

  // Modals
  const [isAddLoanOpen, setIsAddLoanOpen] = useState(false)
  const [editingLoan, setEditingLoan] = useState(null)
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false)
  const [paymentInstallment, setPaymentInstallment] = useState(null)
  const [deleteLoanTarget, setDeleteLoanTarget] = useState(null)
  const [deletePaymentTarget, setDeletePaymentTarget] = useState(null)
  const [showFormulaModal, setShowFormulaModal] = useState(false)

  // Prepayment Calculator inputs
  const [extraPrepaymentAmount, setExtraPrepaymentAmount] = useState('50000')

  // Selected active loan object
  const currentLoan = loans.find(l => l.id === selectedLoanId) || loans[0] || null

  // Portfolio Summary
  const portfolioSummary = useMemo(() => {
    let totalBorrowed = 0
    let totalOutstanding = 0
    let totalEMIThisMonth = 0
    let totalInterestPaid = 0
    let totalOverdue = 0
    let totalCompleted = 0

    const now = new Date()
    const currentMonth = now.getMonth()

    loans.forEach(l => {
      const metrics = calculateLoanMetrics(l, loanPayments)
      if (!metrics) return
      totalBorrowed += metrics.principal
      totalOutstanding += metrics.remainingPrincipal
      totalInterestPaid += metrics.totalInterestPaid
      totalOverdue += metrics.overdueCount

      if (metrics.isCompleted) {
        totalCompleted++
      } else if (metrics.nextDueInstallment) {
        const nextD = new Date(metrics.nextDueInstallment.dueDate)
        if (nextD.getMonth() === currentMonth) {
          totalEMIThisMonth += l.emiAmount
        }
      }
    })

    return {
      totalBorrowed,
      totalOutstanding,
      totalEMIThisMonth,
      totalInterestPaid,
      totalOverdue,
      totalCompleted,
      activeLoansCount: loans.length - totalCompleted,
    }
  }, [loans, loanPayments])

  // Current Loan Metrics & Amortization Schedule
  const currentLoanMetrics = useMemo(() => {
    if (!currentLoan) return null
    return calculateLoanMetrics(currentLoan, loanPayments)
  }, [currentLoan, loanPayments])

  const amortizationSchedule = useMemo(() => {
    if (!currentLoan) return []
    return generateAmortizationSchedule(currentLoan, loanPayments)
  }, [currentLoan, loanPayments])

  // Prepayment analysis for selected loan
  const prepaymentImpact = useMemo(() => {
    if (!currentLoan) return null
    return calculatePrepaymentImpact(currentLoan, loanPayments, extraPrepaymentAmount)
  }, [currentLoan, loanPayments, extraPrepaymentAmount])

  // Payments log for current loan
  const currentLoanPayments = useMemo(() => {
    if (!currentLoan) return []
    return loanPayments
      .filter(p => p.loanId === currentLoan.id)
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
  }, [currentLoan, loanPayments])

  const handlePayInstallment = (installment) => {
    setPaymentInstallment(installment)
    setIsRecordPaymentOpen(true)
  }

  const handleDeleteLoan = () => {
    if (!deleteLoanTarget) return
    deleteLoan(deleteLoanTarget.id)
    showToast(`Loan ${deleteLoanTarget.loanName} removed`, 'info')
    if (selectedLoanId === deleteLoanTarget.id) {
      const remaining = loans.filter(l => l.id !== deleteLoanTarget.id)
      setSelectedLoanId(remaining[0]?.id || null)
    }
    setDeleteLoanTarget(null)
  }

  const handleDeletePayment = () => {
    if (!deletePaymentTarget) return
    deleteLoanPayment(deletePaymentTarget.id)
    showToast('Payment record reversed successfully', 'info')
    setDeletePaymentTarget(null)
  }

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return <Badge variant="emerald" size="sm" dot>Paid</Badge>
      case 'advance_paid':
        return <Badge variant="emerald" size="sm" dot>Advance Paid</Badge>
      case 'partially_paid':
        return <Badge variant="amber" size="sm" dot>Partially Paid</Badge>
      case 'due_soon':
        return <Badge variant="blue" size="sm" dot>Due Soon</Badge>
      case 'overdue':
        return <Badge variant="rose" size="sm" dot>Overdue</Badge>
      default:
        return <Badge variant="slate" size="sm">Pending</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            EMI & Loan Portfolio
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage your home, auto, personal loans, and no-cost EMIs with documented formulas
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowFormulaModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-700 transition"
          >
            <HelpCircle className="h-3.5 w-3.5 text-emerald-400" />
            <span>Interest Formulas</span>
          </button>
          <button
            onClick={() => {
              setEditingLoan(null)
              setIsAddLoanOpen(true)
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition shadow-lg shadow-emerald-950/40"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Loan</span>
          </button>
        </div>
      </div>

      {/* Portfolio Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Borrowed"
          value={formatINR(portfolioSummary.totalBorrowed, { compact: true })}
          subtitle={`${loans.length} total loan facilities`}
          icon={Landmark}
          variant="default"
        />
        <StatCard
          title="Outstanding Principal"
          value={formatINR(portfolioSummary.totalOutstanding, { compact: true })}
          subtitle="Remaining debt liability"
          icon={DollarSign}
          variant="amber"
        />
        <StatCard
          title="Total EMI Due This Month"
          value={formatINR(portfolioSummary.totalEMIThisMonth, { compact: true })}
          subtitle="Scheduled monthly outflows"
          icon={Calendar}
          variant="blue"
        />
        <StatCard
          title="Total Interest Paid"
          value={formatINR(portfolioSummary.totalInterestPaid, { compact: true })}
          subtitle="Cumulative borrowing cost"
          icon={Percent}
          variant="rose"
        />
        <StatCard
          title="Overdue Installments"
          value={portfolioSummary.totalOverdue}
          subtitle={portfolioSummary.totalOverdue > 0 ? 'Requires immediate action' : 'Zero overdue payments'}
          icon={AlertCircle}
          variant={portfolioSummary.totalOverdue > 0 ? 'rose' : 'emerald'}
        />
        <StatCard
          title="Completed Loans"
          value={portfolioSummary.totalCompleted}
          subtitle="Fully settled / closed"
          icon={CheckCircle2}
          variant="emerald"
        />
      </div>

      {/* Loan Selector Tabs / Cards */}
      {loans.length === 0 ? (
        <EmptyState
          title="No loans or EMIs added yet"
          description="Track your home loan, auto loan, or gadget no-cost EMIs to manage amortization."
          actionLabel="Add Your First Loan"
          onAction={() => {
            setEditingLoan(null)
            setIsAddLoanOpen(true)
          }}
        />
      ) : (
        <div className="space-y-6">
          {/* Horizontal Loan Selector Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {loans.map(loan => {
              const metrics = calculateLoanMetrics(loan, loanPayments)
              const isSelected = selectedLoanId === loan.id

              return (
                <div
                  key={loan.id}
                  onClick={() => setSelectedLoanId(loan.id)}
                  className={`cursor-pointer rounded-2xl border p-4.5 transition-all duration-200 relative overflow-hidden backdrop-blur-xl ${
                    isSelected
                      ? 'border-emerald-500/50 bg-gradient-to-b from-emerald-950/30 to-slate-900 shadow-xl shadow-emerald-950/20'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        {loan.loanName}
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {loan.lender} • {loan.loanType}
                      </p>
                    </div>
                    <Badge variant={loan.calculationMethod === 'flat' ? 'blue' : 'emerald'} size="sm">
                      {loan.interestRate}% {loan.calculationMethod === 'flat' ? 'Flat' : 'Reducing'}
                    </Badge>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4">
                    <ProgressBar
                      value={metrics?.totalPrincipalPaid || 0}
                      max={loan.principalAmount}
                      label={`${metrics?.percentRepaid}% Repaid`}
                      valueLabel={`EMI: ${formatINR(loan.emiAmount)}`}
                      size="sm"
                      variant="emerald"
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
                    <span>
                      Outstanding: <strong className="text-white">{formatINR(metrics?.remainingPrincipal || 0)}</strong>
                    </span>
                    <span className="text-slate-500">
                      {metrics?.paidCount}/{loan.tenureMonths} EMIs
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Detailed View of the Selected Loan */}
          {currentLoan && currentLoanMetrics && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 backdrop-blur-xl space-y-6">
              {/* Selected Loan Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-white">{currentLoan.loanName}</h3>
                    <Badge variant={currentLoanMetrics.isCompleted ? 'emerald' : 'blue'}>
                      {currentLoanMetrics.isCompleted ? 'Loan Fully Closed' : 'Active Facility'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Lender: {currentLoan.lender} • Principal: {formatINR(currentLoan.principalAmount)} • Interest:{' '}
                    {currentLoan.interestRate}% p.a. ({currentLoan.calculationMethod === 'flat' ? 'Flat Rate' : 'Reducing Balance'}) • Monthly Due:{' '}
                    {currentLoan.monthlyDueDay}th
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingLoan(currentLoan)
                      setIsAddLoanOpen(true)
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white transition"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>Edit Loan</span>
                  </button>
                  <button
                    onClick={() => handlePayInstallment(null)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition shadow-lg shadow-emerald-950/40"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Record Payment</span>
                  </button>
                  <button
                    onClick={() => setDeleteLoanTarget(currentLoan)}
                    className="rounded-xl border border-slate-800 p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                    title="Delete loan"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Sub-Tabs: Schedule vs Payment History vs Early Prepayment */}
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <button
                  onClick={() => setActiveTab('schedule')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                    activeTab === 'schedule'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Amortization Schedule ({amortizationSchedule.length} Months)
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                    activeTab === 'history'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Payment History Ledger ({currentLoanPayments.length})
                </button>
                <button
                  onClick={() => setActiveTab('prepayment')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                    activeTab === 'prepayment'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Early Repayment & Foreclosure
                </button>
              </div>

              {/* Tab 1: Amortization Schedule Table */}
              {activeTab === 'schedule' && (
                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">Inst #</th>
                        <th className="py-2.5 px-3">Due Date</th>
                        <th className="py-2.5 px-3 text-right">Opening Principal</th>
                        <th className="py-2.5 px-3 text-right">Principal Component</th>
                        <th className="py-2.5 px-3 text-right">Interest Component</th>
                        <th className="py-2.5 px-3 text-right">Monthly EMI</th>
                        <th className="py-2.5 px-3 text-right">Closing Balance</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {amortizationSchedule.map(item => (
                        <tr key={item.installmentNumber} className="hover:bg-slate-800/40 transition">
                          <td className="py-2.5 px-3 font-semibold text-white">#{item.installmentNumber}</td>
                          <td className="py-2.5 px-3 whitespace-nowrap">{formatDate(item.dueDate)}</td>
                          <td className="py-2.5 px-3 text-right">{formatINR(item.openingBalance)}</td>
                          <td className="py-2.5 px-3 text-right text-emerald-400">{formatINR(item.principalComponent)}</td>
                          <td className="py-2.5 px-3 text-right text-amber-400">{formatINR(item.interestComponent)}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-white">{formatINR(item.emiAmount)}</td>
                          <td className="py-2.5 px-3 text-right">{formatINR(item.closingBalance)}</td>
                          <td className="py-2.5 px-3 text-center">{renderStatusBadge(item.status)}</td>
                          <td className="py-2.5 px-3 text-right">
                            {item.status !== 'paid' && item.status !== 'advance_paid' ? (
                              <button
                                onClick={() => handlePayInstallment(item)}
                                className="rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white px-2.5 py-1 font-semibold text-[11px] transition"
                              >
                                Pay
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-500 font-mono">
                                {item.paymentRef ? item.paymentRef.slice(-6) : 'Settled'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tab 2: Payment History Ledger */}
              {activeTab === 'history' && (
                <div className="space-y-3">
                  {currentLoanPayments.length === 0 ? (
                    <EmptyState
                      title="No payment records found"
                      description="Record your monthly auto-debits or manual EMI transactions."
                      actionLabel="Record First Payment"
                      onAction={() => handlePayInstallment(null)}
                    />
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider">
                          <tr>
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Inst #</th>
                            <th className="py-2.5 px-3">Reference / UTR</th>
                            <th className="py-2.5 px-3">Payment Mode</th>
                            <th className="py-2.5 px-3 text-right">Principal</th>
                            <th className="py-2.5 px-3 text-right">Interest</th>
                            <th className="py-2.5 px-3 text-right">Total Paid</th>
                            <th className="py-2.5 px-3 text-center">Status</th>
                            <th className="py-2.5 px-3 text-right">Reversal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-slate-300">
                          {currentLoanPayments.map(p => (
                            <tr key={p.id} className="hover:bg-slate-800/40 transition">
                              <td className="py-2.5 px-3 whitespace-nowrap">{formatDate(p.paymentDate)}</td>
                              <td className="py-2.5 px-3 font-semibold text-white">#{p.installmentNumber}</td>
                              <td className="py-2.5 px-3 font-mono text-slate-400">{p.referenceNumber || '—'}</td>
                              <td className="py-2.5 px-3">{p.paymentMethod}</td>
                              <td className="py-2.5 px-3 text-right text-emerald-400">{formatINR(p.principalComponent)}</td>
                              <td className="py-2.5 px-3 text-right text-amber-400">{formatINR(p.interestComponent)}</td>
                              <td className="py-2.5 px-3 text-right font-bold text-white">{formatINR(p.amount)}</td>
                              <td className="py-2.5 px-3 text-center">{renderStatusBadge(p.status)}</td>
                              <td className="py-2.5 px-3 text-right">
                                <button
                                  onClick={() => setDeletePaymentTarget(p)}
                                  className="text-slate-500 hover:text-rose-400 transition"
                                  title="Reverse payment record"
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Early Prepayment & Foreclosure Calculator */}
              {activeTab === 'prepayment' && prepaymentImpact && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-emerald-400" />
                      <span>Prepayment Savings Simulator</span>
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Paying extra principal reduces your loan tenure and saves thousands of rupees in compound interest.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Extra Principal Payment (₹)
                        </label>
                        <input
                          type="number"
                          step="1000"
                          value={extraPrepaymentAmount}
                          onChange={(e) => setExtraPrepaymentAmount(e.target.value)}
                          placeholder="e.g. 50000"
                          className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3 text-sm font-bold text-emerald-400 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3 flex flex-col justify-center">
                        <span className="text-[11px] text-emerald-300 font-medium">Estimated Interest Saved</span>
                        <div className="text-xl font-bold text-emerald-400 mt-0.5">
                          {formatINR(prepaymentImpact.interestSaved)}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-0.5">
                          Tenure reduced by <strong>{prepaymentImpact.monthsSaved} months</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Loan Modal */}
      <AddLoanModal
        isOpen={isAddLoanOpen}
        onClose={() => {
          setIsAddLoanOpen(false)
          setEditingLoan(null)
        }}
        editingLoan={editingLoan}
      />

      {/* Record EMI Payment Modal */}
      {currentLoan && (
        <RecordPaymentModal
          isOpen={isRecordPaymentOpen}
          onClose={() => {
            setIsRecordPaymentOpen(false)
            setPaymentInstallment(null)
          }}
          loan={currentLoan}
          installmentToPay={paymentInstallment}
        />
      )}

      {/* Delete Loan Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteLoanTarget)}
        onClose={() => setDeleteLoanTarget(null)}
        onConfirm={handleDeleteLoan}
        title="Delete Loan Facility?"
        message={`Are you sure you want to permanently delete "${deleteLoanTarget?.loanName}" and all associated installment schedules and payment logs?`}
        confirmText="Delete Loan"
        isDestructive={true}
      />

      {/* Delete Payment Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletePaymentTarget)}
        onClose={() => setDeletePaymentTarget(null)}
        onConfirm={handleDeletePayment}
        title="Reverse Payment Record?"
        message="Are you sure you want to reverse this payment? The installment status will revert to pending or overdue and the loan balance will recalculate immediately."
        confirmText="Reverse Payment"
        isDestructive={true}
      />

      {/* Interest Calculation Method Documentation Modal */}
      <Modal
        isOpen={showFormulaModal}
        onClose={() => setShowFormulaModal(false)}
        title="Standard Loan & Interest Calculation Formulas"
        subtitle="Mathematical reference documentation for Personal Accountant Pro"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 space-y-2">
            <h4 className="font-bold text-emerald-400 text-sm">1. Reducing Balance Method (Equated Monthly Installment)</h4>
            <p>
              Standard formula adopted by the Reserve Bank of India (RBI) and commercial banks (HDFC, SBI, ICICI) for mortgages, auto loans, and term loans.
            </p>
            <div className="bg-slate-950 p-2.5 rounded-lg font-mono text-[11px] text-emerald-300">
              EMI = [P × r × (1 + r)ⁿ] / [(1 + r)ⁿ - 1]
            </div>
            <p>Where:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>P</strong> = Principal Loan Amount</li>
              <li><strong>r</strong> = Monthly Interest Rate (Annual Rate / 12 / 100)</li>
              <li><strong>n</strong> = Loan Tenure in Months</li>
              <li><strong>Monthly Interest</strong> = Opening Principal for the month × r</li>
              <li><strong>Monthly Principal</strong> = EMI - Monthly Interest</li>
            </ul>
          </div>

          <div className="p-3.5 rounded-xl border border-blue-500/30 bg-blue-950/20 space-y-2">
            <h4 className="font-bold text-blue-400 text-sm">2. Flat Rate Method</h4>
            <p>
              Commonly used in promotional consumer electronics financing (no-cost EMIs, gadget financing, dealer vehicle promotions).
            </p>
            <div className="bg-slate-950 p-2.5 rounded-lg font-mono text-[11px] text-blue-300">
              Total Interest = Principal × (Annual Rate / 100) × (Tenure in Years)<br />
              EMI = (Principal + Total Interest) / Tenure in Months
            </div>
            <p>
              Under flat rate, the monthly interest portion remains constant across every installment.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  )
}
