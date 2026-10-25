import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  Building2,
  Calendar,
  CheckCircle2,
  DollarSign,
  Download,
  FileSpreadsheet,
  IndianRupee,
  Landmark,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Sparkles,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import React, { useMemo } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Badge } from '../components/ui/Badge'
import { StatCard } from '../components/ui/StatCard'
import { useFinance } from '../context/FinanceContext'
import { exportFullExcelWorkbook } from '../services/excelService'
import { formatDate, formatINR } from '../utils/formatters'
import { useToast } from '../components/ui/Toast'

export const ReportsPage = () => {
  const {
    expenses,
    income,
    loans,
    loanPayments,
    bankAccounts,
    bankTransactions,
    categories,
    financialTotals,
    loansSummary,
    totalBankBalance,
  } = useFinance()
  const { showToast } = useToast()

  // Trend timeline data (6 months)
  const timelineData = [
    { month: 'May 26', income: 185000, expenses: 84200, savings: 100800, netWorth: 512000 },
    { month: 'Jun 26', income: 192000, expenses: 91500, savings: 100500, netWorth: 612500 },
    { month: 'Jul 26', income: 215000, expenses: 108400, savings: 106600, netWorth: 719100 },
    { month: 'Aug 26', income: 185000, expenses: 94000, savings: 91000, netWorth: 810100 },
    { month: 'Sep 26', income: 230000, expenses: 102300, savings: 127700, netWorth: 937800 },
    {
      month: 'Oct 26',
      income: financialTotals.monthlyIncome || 233450,
      expenses: financialTotals.monthlyExpenses || 96870,
      savings: financialTotals.monthlySavings || 136580,
      netWorth: totalBankBalance || 1074380,
    },
  ]

  // Category breakdown
  const categoryData = useMemo(() => {
    const map = {}
    const totalExp = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)

    expenses.forEach(e => {
      const cat = categories.find(c => c.id === e.category)
      const name = cat ? cat.name : 'Other'
      const color = cat ? cat.color : '#94a3b8'
      if (!map[name]) {
        map[name] = { name, value: 0, color }
      }
      map[name].value += Number(e.amount) || 0
    })

    return Object.values(map)
      .sort((a, b) => b.value - a.value)
      .map(item => ({
        ...item,
        percentage: totalExp > 0 ? Math.round((item.value / totalExp) * 100) : 0,
      }))
  }, [expenses, categories])

  // Merchant Leaderboard
  const merchantRanking = useMemo(() => {
    const map = {}
    expenses.forEach(e => {
      const name = e.merchant || 'Other'
      map[name] = (map[name] || 0) + (Number(e.amount) || 0)
    })
    return Object.entries(map)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6)
  }, [expenses])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Wealth & Financial Reports
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Holistic analysis of your net savings, debt liabilities, and category spending distributions
          </p>
        </div>

        <button
          onClick={() => {
            exportFullExcelWorkbook({
              expenses,
              income,
              loans,
              loanPayments,
              bankAccounts,
              bankTransactions,
              categories,
            })
            showToast('Executive financial report workbook exported!', 'success')
          }}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition shadow-lg shadow-emerald-950/40"
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>Download Executive Report (XLSX)</span>
        </button>
      </div>

      {/* Top Analytical Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Net Savings Recorded"
          value={formatINR(financialTotals.netSavings, { compact: true })}
          subtitle={`₹${financialTotals.monthlySavings.toLocaleString('en-IN')} saved this month`}
          icon={TrendingUp}
          variant="emerald"
        />
        <StatCard
          title="Current Bank Reserves"
          value={formatINR(totalBankBalance, { compact: true })}
          subtitle="Total verified cash liquidity"
          icon={Wallet}
          variant="default"
        />
        <StatCard
          title="Total Loan Liability"
          value={formatINR(loansSummary.outstandingPrincipal, { compact: true })}
          subtitle={`Across ${loans.length} active loan facilities`}
          icon={Landmark}
          variant="amber"
        />
        <StatCard
          title="Net Liquidity Ratio"
          value={
            loansSummary.outstandingPrincipal > 0
              ? `${((totalBankBalance / loansSummary.outstandingPrincipal) * 100).toFixed(1)}%`
              : 'Debt Free'
          }
          subtitle="Cash vs outstanding debt"
          icon={CheckCircle2}
          variant="blue"
        />
      </div>

      {/* Net Worth & Savings Growth Line Chart */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Net Liquid Worth & Savings Growth</h3>
            <p className="text-xs text-slate-400">Month-over-month cumulative reserves trajectory</p>
          </div>
          <Badge variant="emerald" size="sm">
            +52.4% FY Growth
          </Badge>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
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
              <Area
                type="monotone"
                dataKey="netWorth"
                name="Total Bank Reserves (₹)"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorNetWorth)"
              />
              <Line
                type="monotone"
                dataKey="savings"
                name="Monthly Savings (₹)"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Category Breakdown Table + Merchant Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl space-y-4">
          <h3 className="text-sm font-semibold text-white">Expense Category Breakdown</h3>

          <div className="space-y-3">
            {categoryData.map(cat => (
              <div key={cat.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="font-medium text-slate-200">{cat.name}</span>
                  </div>
                  <span className="font-semibold text-white">
                    {formatINR(cat.value)}{' '}
                    <span className="text-slate-400 font-normal">({cat.percentage}%)</span>
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Merchant Leaderboard */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl space-y-4">
          <h3 className="text-sm font-semibold text-white">Top Merchant Spending Leaderboard</h3>

          <div className="space-y-2.5">
            {merchantRanking.map((m, idx) => (
              <div
                key={m.name}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-800/80 bg-slate-950/40 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-800 font-bold text-slate-300">
                    {idx + 1}
                  </span>
                  <span className="font-semibold text-white">{m.name}</span>
                </div>
                <span className="font-bold text-emerald-400">{formatINR(m.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
