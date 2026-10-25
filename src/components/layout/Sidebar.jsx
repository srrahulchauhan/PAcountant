import {
  BarChart3,
  Building2,
  ChevronLeft,
  ChevronRight,
  Database,
  DollarSign,
  HelpCircle,
  Landmark,
  LayoutDashboard,
  PlusCircle,
  Receipt,
  Settings,
  Sparkles,
  Wallet,
} from 'lucide-react'
import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useFinance } from '../../context/FinanceContext'
import { formatINR } from '../../utils/formatters'

export const Sidebar = ({ isMobileOpen, onCloseMobile, onOpenQuickAdd }) => {
  const location = useLocation()
  const { totalBankBalance, financialTotals } = useFinance()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const navLinks = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Daily Expenses', path: '/expenses', icon: Receipt },
    { name: 'EMI & Loans', path: '/loans', icon: Landmark },
    { name: 'Bank Accounts', path: '/banks', icon: Building2 },
    { name: 'Analytics & Reports', path: '/reports', icon: BarChart3 },
    { name: 'Data & Cloud Sync', path: '/sync', icon: Database },
    { name: 'Settings', path: '/settings', icon: Settings },
  ]

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true
    if (path !== '/' && location.pathname.startsWith(path)) return true
    return false
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-800 bg-slate-950 transition-all duration-300 lg:static ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800">
          <Link to="/" className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-lg shadow-emerald-950/50">
              <Wallet className="h-5 w-5" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1">
                  Personal Accountant <span className="text-emerald-400 text-xs uppercase px-1 py-0.5 rounded bg-emerald-500/10">Pro</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Smart Wealth & EMI</span>
              </div>
            )}
          </Link>

          {/* Collapse Button (Desktop only) */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex h-6 w-6 items-center justify-center rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 transition"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Quick Add Action */}
        <div className="p-3">
          <button
            onClick={() => {
              onOpenQuickAdd()
              if (isMobileOpen) onCloseMobile()
            }}
            className={`flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-950/40 hover:from-emerald-500 hover:to-teal-500 transition ${
              isCollapsed ? 'p-2.5' : ''
            }`}
            title="Add Expense or Income"
          >
            <PlusCircle className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span>Record Transaction</span>}
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 space-y-1 px-3 py-2 overflow-y-auto">
          {navLinks.map((link) => {
            const Icon = link.icon
            const active = isActive(link.path)

            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => {
                  if (isMobileOpen) onCloseMobile()
                }}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-all ${
                  active
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
                title={isCollapsed ? link.name : undefined}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${
                    active ? 'text-emerald-400' : 'text-slate-400'
                  }`}
                />
                {!isCollapsed && <span className="truncate">{link.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Total Liquidity Snapshot Widget (When not collapsed) */}
        {!isCollapsed && (
          <div className="mx-3 mb-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Total Available Bank Balance</span>
              <Sparkles className="h-3 w-3 text-emerald-400" />
            </div>
            <div className="mt-1 text-base font-bold text-white tracking-tight">
              {formatINR(totalBankBalance)}
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-800">
              <span>Monthly Savings:</span>
              <span className="font-semibold text-emerald-400">
                {formatINR(financialTotals.monthlySavings)}
              </span>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="border-t border-slate-800 p-3 text-center">
          {!isCollapsed ? (
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Personal Accountant Pro</span>
              <span className="font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">v1.0</span>
            </div>
          ) : (
            <span className="font-mono text-[9px] text-slate-500">v1.0</span>
          )}
        </div>
      </aside>
    </>
  )
}
