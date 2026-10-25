import {
  AlertCircle,
  AlertTriangle,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  IndianRupee,
  Landmark,
  Plus,
  Receipt,
  Repeat,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
  Zap,
} from 'lucide-react'
import { motion } from 'framer-motion'
import React, { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AddBankModal } from '../components/modals/AddBankModal'
import { AddExpenseModal } from '../components/modals/AddExpenseModal'
import { AddLoanModal } from '../components/modals/AddLoanModal'
import { RecordPaymentModal } from '../components/modals/RecordPaymentModal'
import { TransferModal } from '../components/modals/TransferModal'
import { AnimatedCounter } from '../components/ui/AnimatedCounter'
import { Badge } from '../components/ui/Badge'
import { ProgressBar } from '../components/ui/ProgressBar'
import { StatCard } from '../components/ui/StatCard'
import { useFinance } from '../context/FinanceContext'
import { formatDate, formatINR, getRelativeDays } from '../utils/formatters'
import { generateAmortizationSchedule } from '../utils/loanCalculations'

// Framer Motion Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
  },
}

export const DashboardPage = () => {
  const navigate = useNavigate()
  const {
    expenses,
    income,
    loans,
    loanPayments,
    bankAccounts,
    categories,
    financialTotals,
    loansSummary,
    totalBankBalance,
  } = useFinance()

  // Modal controllers
  const [modalType, setModalType] = useState(null) // 'expense' | 'income' | 'loan' | 'bank' | 'transfer' | 'pay_emi'
  const [selectedLoanForPayment, setSelectedLoanForPayment] = useState(null)

  // Chart 1: Monthly Income vs Expenses (Last 6 Months)
  const monthlyComparisonData = useMemo(() => {
    return [
      { month: 'May 26', income: 185000, expenses: 84200, savings: 100800 },
      { month: 'Jun 26', income: 192000, expenses: 91500, savings: 100500 },
      { month: 'Jul 26', income: 215000, expenses: 108400, savings: 106600 },
      { month: 'Aug 26', income: 185000, expenses: 94000, savings: 91000 },
      { month: 'Sep 26', income: 230000, expenses: 102300, savings: 127700 },
      {
        month: 'Oct 26 (Current)',
        income: financialTotals.monthlyIncome || 233450,
        expenses: financialTotals.monthlyExpenses || 96870,
        savings: financialTotals.monthlySavings || 136580,
      },
    ]
  }, [financialTotals])

  // Chart 2: Category-wise Expense Donut
  const categoryChartData = useMemo(() => {
    const catMap = {}
    const totalExp = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)

    expenses.forEach(e => {
      const cat = categories.find(c => c.id === e.category)
      const name = cat ? cat.name : 'Other'
      const color = cat ? cat.color : '#94a3b8'
      if (!catMap[name]) {
        catMap[name] = { name, value: 0, color }
      }
      catMap[name].value += Number(e.amount) || 0
    })

    return Object.values(catMap).map(item => ({
      ...item,
      percentage: totalExp > 0 ? Math.round((item.value / totalExp) * 100) : 0,
    }))
  }, [expenses, categories])

  // Upcoming EMIs calculation
  const upcomingEMIs = useMemo(() => {
    const list = []
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    loans.forEach(loan => {
      const schedule = generateAmortizationSchedule(loan, loanPayments)
      const pending = schedule.find(s => s.status !== 'paid' && s.status !== 'advance_paid')
      if (pending) {
        const dueDate = new Date(pending.dueDate)
        const diffDays = Math.round((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        list.push({
          loan,
          installment: pending,
          dueDate,
          diffDays,
          isOverdue: diffDays < 0,
          dueText: getRelativeDays(dueDate),
        })
      }
    })

    return list.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
  }, [loans, loanPayments])

  // Recent transactions
  const recentTransactions = useMemo(() => {
    const combined = [
      ...expenses.map(e => ({
        id: e.id,
        type: 'expense',
        title: e.merchant || e.description,
        subtitle: (categories.find(c => c.id === e.category)?.name) || 'Expense',
        amount: e.amount,
        date: e.date,
        method: e.paymentMethod,
        bankId: e.bankAccountId,
      })),
      ...income.map(i => ({
        id: i.id,
        type: 'income',
        title: i.source || i.description,
        subtitle: (categories.find(c => c.id === i.category)?.name) || 'Income',
        amount: i.amount,
        date: i.date,
        method: i.paymentMethod,
        bankId: i.bankAccountId,
      })),
    ]

    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6)
  }, [expenses, income, categories])

  // Monthly Budget Progress per Category
  const budgetProgress = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const monthExpenses = expenses.filter(e => {
      const d = new Date(e.date)
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear
    })

    return categories
      .filter(c => c.type === 'expense' && c.budget > 0)
      .map(cat => {
        const spent = monthExpenses
          .filter(e => e.category === cat.id)
          .reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
        const percentage = Math.round((spent / cat.budget) * 100)
        return {
          ...cat,
          spent,
          percentage,
          isExceeded: percentage >= 100,
          isWarning: percentage >= 80 && percentage < 100,
        }
      })
      .slice(0, 4)
  }, [categories, expenses])

  const overdueAlerts = upcomingEMIs.filter(u => u.isOverdue)

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Top Welcome & Quick Actions Bar */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Wealth Overview</span>
            <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              <span>Live Engine</span>
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time balance, liabilities, and monthly cash flow metrics for India (INR)
          </p>
        </div>

        {/* Quick Action Button Group */}
        <div className="flex items-center gap-2 flex-wrap">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setModalType('expense')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-500 transition shadow-lg shadow-rose-950/40"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Expense</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setModalType('income')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition shadow-lg shadow-emerald-950/40"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Income</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setModalType('loan')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-700 transition"
          >
            <Landmark className="h-3.5 w-3.5 text-blue-400" />
            <span>Add Loan</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setModalType('bank')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-700 transition"
          >
            <Building2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Add Bank</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setModalType('transfer')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-700 transition"
          >
            <Repeat className="h-3.5 w-3.5 text-amber-400" />
            <span>Transfer</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Overdue Payment Alert Banner (if any) */}
      {overdueAlerts.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="flex items-center justify-between rounded-2xl border border-rose-500/30 bg-gradient-to-r from-rose-950/50 via-slate-900 to-rose-950/30 p-4 text-xs text-rose-200 shadow-xl shadow-rose-950/30"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-rose-500/20 p-2 text-rose-400 animate-pulse">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">
                Attention: {overdueAlerts.length} Loan Installment{overdueAlerts.length > 1 ? 's' : ''} Overdue!
              </p>
              <p className="text-rose-300 mt-0.5">
                {overdueAlerts[0].loan.loanName} EMI of {formatINR(overdueAlerts[0].installment.emiAmount)} was due on {formatDate(overdueAlerts[0].dueDate)}. Please settle immediately.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedLoanForPayment(overdueAlerts[0].loan)
              setModalType('pay_emi')
            }}
            className="rounded-xl bg-rose-600 px-4 py-2 font-semibold text-white hover:bg-rose-500 transition shadow-lg shrink-0"
          >
            Pay Now
          </button>
        </motion.div>
      )}

      {/* 6 Key Financial KPI Stat Cards with Animated Counters */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Income"
          rawNumericValue={financialTotals.totalIncome}
          subtitle={`₹${financialTotals.monthlyIncome?.toLocaleString('en-IN')} this month`}
          icon={ArrowDownLeft}
          variant="emerald"
          trend="+14.2%"
          trendDirection="up"
          trendLabel="vs last month"
          onClick={() => navigate('/expenses')}
        />
        <StatCard
          title="Total Expenses"
          rawNumericValue={financialTotals.totalExpenses}
          subtitle={`₹${financialTotals.monthlyExpenses?.toLocaleString('en-IN')} this month`}
          icon={ArrowUpRight}
          variant="rose"
          trend="-3.8%"
          trendDirection="up"
          trendLabel="spend reduction"
          onClick={() => navigate('/expenses')}
        />
        <StatCard
          title="Available Balance"
          rawNumericValue={totalBankBalance}
          subtitle="Across all bank accounts"
          icon={Wallet}
          variant="default"
          trend="Real-Time"
          trendDirection="neutral"
          onClick={() => navigate('/banks')}
        />
        <StatCard
          title="Monthly Savings"
          rawNumericValue={financialTotals.monthlySavings}
          subtitle={`${financialTotals.savingsRate}% monthly savings rate`}
          icon={TrendingUp}
          variant="emerald"
          trend="+8.5%"
          trendDirection="up"
          onClick={() => navigate('/reports')}
        />
        <StatCard
          title="Outstanding Loans"
          rawNumericValue={loansSummary.outstandingPrincipal}
          subtitle={`${loansSummary.activeLoansCount} active liabilities`}
          icon={Landmark}
          variant="amber"
          onClick={() => navigate('/loans')}
        />
        <StatCard
          title="Upcoming EMIs"
          rawNumericValue={loansSummary.upcomingEMIAmount}
          subtitle="Scheduled for this month"
          icon={Calendar}
          variant="blue"
          onClick={() => navigate('/loans')}
        />
      </motion.div>

      {/* Charts Section: Income vs Expense Bar + Monthly Spending Area */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Income vs Expense Monthly Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <span>Income vs Expense Cash Flow</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </h3>
              <p className="text-xs text-slate-400">Monthly inflows, outflows, and net savings surplus</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300">
              FY 2026-27
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyComparisonData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val) => [formatINR(val), '']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="income" name="Income (₹)" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses (₹)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="savings" name="Net Savings (₹)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Expense Donut Chart */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold text-white">Expense Distribution</h3>
              <p className="text-xs text-slate-400">Spending breakdown by category</p>
            </div>
            <Link to="/expenses" className="text-xs font-semibold text-emerald-400 hover:text-emerald-300">
              View all
            </Link>
          </div>

          <div className="h-52 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val, name, props) => [
                    `${formatINR(val)} (${props.payload.percentage}%)`,
                    props.payload.name,
                  ]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: '#f8fafc',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Donut Legend */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px]">
            {categoryChartData.slice(0, 4).map((cat) => (
              <div key={cat.name} className="flex items-center gap-1.5 truncate">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                <span className="text-slate-300 truncate">{cat.name}</span>
                <span className="text-slate-500 font-semibold ml-auto">{cat.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Bank Account Overview Quick Cards */}
      <motion.div variants={itemVariants} className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Connected Bank Accounts</h3>
            <p className="text-xs text-slate-400">Opening balance plus credits minus debits</p>
          </div>
          <Link to="/banks" className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
            <span>Manage Accounts</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {bankAccounts.map((bank) => (
            <motion.div
              key={bank.id}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              onClick={() => navigate(`/banks/${bank.id}`)}
              className="group cursor-pointer rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950 p-4 hover:border-slate-700 transition shadow-lg"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-300 group-hover:text-white transition">
                  {bank.bankName}
                </span>
                <Badge variant={bank.accountType === 'Salary' ? 'emerald' : bank.accountType === 'Credit Card' ? 'amber' : 'blue'} size="sm">
                  {bank.accountType}
                </Badge>
              </div>

              <div className="text-lg font-bold text-white tracking-tight">
                <AnimatedCounter value={bank.calculatedBalance} compact={false} />
              </div>

              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                <span>{bank.accountNickname}</span>
                <span className="font-mono text-slate-500">{bank.maskedNumber}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Bottom Grid: Upcoming EMIs, Budget Progress, Recent Transactions */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming EMIs Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Upcoming Loan EMIs</h3>
              <p className="text-xs text-slate-400">Scheduled auto-debits and dues</p>
            </div>
            <Link to="/loans" className="text-xs font-semibold text-emerald-400 hover:text-emerald-300">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {upcomingEMIs.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-500">No pending EMIs due this month!</p>
            ) : (
              upcomingEMIs.slice(0, 3).map(({ loan, installment, dueText, isOverdue }) => (
                <div
                  key={`${loan.id}-${installment.installmentNumber}`}
                  className={`p-3 rounded-xl border text-xs transition ${
                    isOverdue
                      ? 'border-rose-500/30 bg-rose-950/20'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white">{loan.loanName}</p>
                      <p className="text-[11px] text-slate-400">
                        Inst #{installment.installmentNumber} • {loan.lender}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-400">{formatINR(installment.emiAmount)}</span>
                      <p className={`text-[10px] font-medium ${isOverdue ? 'text-rose-400' : 'text-slate-400'}`}>
                        {dueText}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <span className="text-[10px] text-slate-500">Due: {formatDate(installment.dueDate)}</span>
                    <button
                      onClick={() => {
                        setSelectedLoanForPayment(loan)
                        setModalType('pay_emi')
                      }}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white px-2.5 py-1 text-[11px] font-semibold transition"
                    >
                      <span>Pay EMI</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Monthly Budget Tracker Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Monthly Budgets</h3>
              <p className="text-xs text-slate-400">Category spending against limits</p>
            </div>
            <Link to="/settings" className="text-xs font-semibold text-emerald-400 hover:text-emerald-300">
              Configure
            </Link>
          </div>

          <div className="space-y-4">
            {budgetProgress.map((budget) => (
              <div key={budget.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: budget.color }} />
                    <span className="font-medium text-slate-200">{budget.name}</span>
                  </div>
                  <span className="text-slate-400">
                    {formatINR(budget.spent)} / <strong className="text-slate-200">{formatINR(budget.budget)}</strong>
                  </span>
                </div>
                <ProgressBar
                  value={budget.spent}
                  max={budget.budget}
                  variant="auto"
                  size="sm"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Financial Transactions Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Recent Transactions</h3>
              <p className="text-xs text-slate-400">Latest expense & income events</p>
            </div>
            <Link to="/expenses" className="text-xs font-semibold text-emerald-400 hover:text-emerald-300">
              View All
            </Link>
          </div>

          <div className="space-y-2.5">
            {recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800/80 bg-slate-950/40 hover:bg-slate-900/80 transition text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`rounded-lg p-2 ${
                      tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                    }`}
                  >
                    {tx.type === 'income' ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="font-medium text-slate-200">{tx.title}</p>
                    <span className="text-[10px] text-slate-500">
                      {tx.subtitle} • {formatDate(tx.date)}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`font-bold ${
                      tx.type === 'income' ? 'text-emerald-400' : 'text-slate-200'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'}{formatINR(tx.amount)}
                  </span>
                  <p className="text-[10px] text-slate-500">{tx.method}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Modals */}
      <AddExpenseModal
        isOpen={modalType === 'expense' || modalType === 'income'}
        onClose={() => setModalType(null)}
        initialType={modalType === 'income' ? 'income' : 'expense'}
      />
      <AddLoanModal
        isOpen={modalType === 'loan'}
        onClose={() => setModalType(null)}
      />
      <AddBankModal
        isOpen={modalType === 'bank'}
        onClose={() => setModalType(null)}
      />
      <TransferModal
        isOpen={modalType === 'transfer'}
        onClose={() => setModalType(null)}
      />
      {selectedLoanForPayment && (
        <RecordPaymentModal
          isOpen={modalType === 'pay_emi'}
          onClose={() => {
            setModalType(null)
            setSelectedLoanForPayment(null)
          }}
          loan={selectedLoanForPayment}
        />
      )}
    </motion.div>
  )
}
