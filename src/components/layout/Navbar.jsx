import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Check,
  Cloud,
  CloudAlert,
  CloudOff,
  Moon,
  RefreshCw,
  Search,
  Sun,
  User,
} from 'lucide-react'
import React, { useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useFinance } from '../../context/FinanceContext'
import { useNotifications } from '../../context/NotificationContext'
import { useTheme } from '../../context/ThemeContext'
import { formatDate, formatDateTime, formatINR } from '../../utils/formatters'
import { Badge } from '../ui/Badge'
import { useToast } from '../ui/Toast'

export const Navbar = ({ onOpenQuickAdd, onToggleMobileSidebar }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const { showToast } = useToast()
  const {
    syncStatus,
    lastSyncedAt,
    syncErrorMessage,
    triggerCloudSync,
    expenses,
    income,
    loans,
    bankAccounts,
  } = useFinance()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()

  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  // Map route to page title
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Financial Dashboard'
      case '/expenses':
        return 'Daily Expense & Income Tracker'
      case '/loans':
        return 'EMI & Loan Portfolio'
      case '/banks':
        return 'Personal Bank Accounts'
      case '/reports':
        return 'Wealth Reports & Analytics'
      case '/sync':
        return 'Google Sheets & Excel Sync'
      case '/settings':
        return 'Preferences & Categories'
      default:
        if (location.pathname.startsWith('/banks/')) return 'Bank Account Ledger'
        return 'Personal Accountant Pro'
    }
  }

  // Filter global search results across modules
  const searchResults = searchQuery.trim()
    ? {
        expenses: expenses
          .filter(
            e =>
              (e.merchant && e.merchant.toLowerCase().includes(searchQuery.toLowerCase())) ||
              (e.description && e.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
              String(e.amount).includes(searchQuery)
          )
          .slice(0, 4),
        loans: loans
          .filter(
            l =>
              l.loanName.toLowerCase().includes(searchQuery.toLowerCase()) ||
              l.lender.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .slice(0, 3),
        banks: bankAccounts
          .filter(
            b =>
              b.bankName.toLowerCase().includes(searchQuery.toLowerCase()) ||
              b.accountNickname.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .slice(0, 3),
      }
    : null

  const hasSearchResults =
    searchResults &&
    (searchResults.expenses.length > 0 ||
      searchResults.loans.length > 0 ||
      searchResults.banks.length > 0)

  // Sync status pill render
  const renderSyncPill = () => {
    switch (syncStatus) {
      case 'syncing':
        return (
          <button
            onClick={() => navigate('/sync')}
            className="flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-400 hover:bg-blue-500/20 transition"
            title="Syncing changes to Google Sheets"
          >
            <RefreshCw className="h-3 w-3 animate-spin text-blue-400" />
            <span className="hidden sm:inline">Syncing...</span>
          </button>
        )
      case 'synced':
        return (
          <button
            onClick={() => navigate('/sync')}
            className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition"
            title={`Synced with Google Sheets: ${lastSyncedAt ? formatDateTime(lastSyncedAt) : 'Just now'}`}
          >
            <Cloud className="h-3 w-3 text-emerald-400" />
            <span className="hidden sm:inline">Synced</span>
          </button>
        )
      case 'sync_failed':
        return (
          <button
            onClick={() => {
              triggerCloudSync()
              showToast('Retrying Google Sheets synchronization...', 'info')
            }}
            className="flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-400 hover:bg-rose-500/20 transition"
            title={`Sync error: ${syncErrorMessage || 'Click to retry'}`}
          >
            <CloudAlert className="h-3 w-3 text-rose-400" />
            <span className="hidden sm:inline">Sync Failed (Retry)</span>
          </button>
        )
      case 'saving':
        return (
          <span className="flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-300">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="hidden sm:inline">Saving...</span>
          </span>
        )
      case 'saved_locally':
        return (
          <span
            className="flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/60 px-2.5 py-1 text-xs font-medium text-slate-400"
            title="All changes securely saved in local storage"
          >
            <Check className="h-3 w-3 text-emerald-500" />
            <span className="hidden sm:inline">Saved locally</span>
          </span>
        )
      default:
        return (
          <Link
            to="/sync"
            className="flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/40 px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-slate-200 hover:border-slate-700 transition"
            title="Cloud sync not configured. Click to setup Google Sheets integration."
          >
            <CloudOff className="h-3 w-3 text-slate-500" />
            <span className="hidden sm:inline">Sync: Offline</span>
          </Link>
        )
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 sm:px-6 backdrop-blur-xl">
      {/* Left: Mobile trigger & Page title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="rounded-lg p-2 text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
          title="Open menu"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">{getPageTitle()}</h1>
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div className="relative hidden md:block max-w-xs w-full mx-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setIsSearchOpen(true)
            }}
            onFocus={() => setIsSearchOpen(true)}
            placeholder="Search expenses, loans, banks..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900/90 py-1.5 pl-9 pr-4 text-xs text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
          />
        </div>

        {/* Search Results Dropdown */}
        {isSearchOpen && searchQuery.trim() && (
          <div className="absolute left-0 mt-2 w-96 rounded-2xl border border-slate-800 bg-slate-900 p-3 shadow-2xl z-50">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs font-semibold text-slate-400">
              <span>Search Results for "{searchQuery}"</span>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setIsSearchOpen(false)
                }}
                className="text-slate-500 hover:text-white"
              >
                Close
              </button>
            </div>

            {!hasSearchResults ? (
              <p className="py-4 text-center text-xs text-slate-500">No matching financial records found.</p>
            ) : (
              <div className="max-h-72 overflow-y-auto space-y-3">
                {searchResults.expenses.length > 0 && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      Expenses & Spends
                    </span>
                    <div className="mt-1 space-y-1">
                      {searchResults.expenses.map((e) => (
                        <div
                          key={e.id}
                          onClick={() => {
                            setIsSearchOpen(false)
                            navigate('/expenses')
                          }}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800 cursor-pointer text-xs"
                        >
                          <div>
                            <p className="font-medium text-slate-200">{e.merchant || e.description}</p>
                            <span className="text-[10px] text-slate-500">{formatDate(e.date)}</span>
                          </div>
                          <span className="font-semibold text-rose-400">-{formatINR(e.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {searchResults.loans.length > 0 && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      Loans & EMIs
                    </span>
                    <div className="mt-1 space-y-1">
                      {searchResults.loans.map((l) => (
                        <div
                          key={l.id}
                          onClick={() => {
                            setIsSearchOpen(false)
                            navigate('/loans')
                          }}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800 cursor-pointer text-xs"
                        >
                          <div>
                            <p className="font-medium text-slate-200">{l.loanName}</p>
                            <span className="text-[10px] text-slate-500">{l.lender}</span>
                          </div>
                          <span className="font-semibold text-emerald-400">EMI {formatINR(l.emiAmount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {searchResults.banks.length > 0 && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      Bank Accounts
                    </span>
                    <div className="mt-1 space-y-1">
                      {searchResults.banks.map((b) => (
                        <div
                          key={b.id}
                          onClick={() => {
                            setIsSearchOpen(false)
                            navigate(`/banks/${b.id}`)
                          }}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800 cursor-pointer text-xs"
                        >
                          <div>
                            <p className="font-medium text-slate-200">{b.bankName}</p>
                            <span className="text-[10px] text-slate-500">{b.accountNickname}</span>
                          </div>
                          <span className="font-semibold text-slate-200">{formatINR(b.calculatedBalance)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Actions, Sync, Notification Center, Theme Toggle, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Sync Pill */}
        {renderSyncPill()}

        {/* Quick Add Button */}
        <button
          onClick={onOpenQuickAdd}
          className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-emerald-950/40 hover:bg-emerald-500 transition"
        >
          <span className="text-sm leading-none font-bold">+</span>
          <span>Quick Record</span>
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative rounded-xl border border-slate-800 bg-slate-900/80 p-2 text-slate-300 hover:text-white hover:border-slate-700 transition"
            title="Notifications & Due Reminders"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-md shadow-rose-950">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Drawer */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-2xl z-50">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-white">Notifications</h4>
                  {unreadCount > 0 && <Badge variant="rose" size="sm">{unreadCount} new</Badge>}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-emerald-400 hover:text-emerald-300 transition"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="mt-3 max-h-80 overflow-y-auto space-y-2.5">
                {notifications.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-500">No active reminders or alerts.</p>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => markAsRead(notif.id)}
                      className={`p-3 rounded-xl border text-xs transition cursor-pointer ${
                        notif.isRead
                          ? 'bg-slate-900/50 border-slate-800 text-slate-400'
                          : notif.type === 'danger'
                          ? 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                          : notif.type === 'warning'
                          ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                          : 'bg-slate-800/80 border-slate-700 text-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-white">{notif.title}</span>
                        {!notif.isRead && (
                          <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="mt-1 text-slate-300 leading-relaxed">{notif.message}</p>
                      {notif.category === 'loan_emi' && (
                        <div className="mt-2 flex items-center justify-between pt-2 border-t border-slate-800/60">
                          <span className="text-[11px] text-slate-400">Due: {formatDate(notif.dueDate)}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setIsNotifOpen(false)
                              navigate('/loans')
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300"
                          >
                            <span>Pay EMI</span>
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="rounded-xl border border-slate-800 bg-slate-900/80 p-2 text-slate-300 hover:text-white hover:border-slate-700 transition"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-blue-400" />}
        </button>

        {/* User Profile Avatar */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 p-1.5 sm:px-2.5 sm:py-1.5 text-slate-200 hover:border-slate-700 transition"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-600 text-xs font-bold text-white">
              A
            </div>
            <span className="hidden sm:inline text-xs font-medium">Aditya S.</span>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-slate-800 bg-slate-900 p-2 shadow-2xl z-50 text-xs">
              <div className="px-3 py-2 border-b border-slate-800">
                <p className="font-semibold text-white">Aditya Sharma</p>
                <p className="text-[11px] text-slate-400">Personal Pro Plan</p>
              </div>
              <div className="mt-1 space-y-0.5">
                <Link
                  to="/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className="block px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition"
                >
                  Preferences & Settings
                </Link>
                <Link
                  to="/sync"
                  onClick={() => setIsProfileOpen(false)}
                  className="block px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition"
                >
                  Cloud Data & Sync
                </Link>
                <Link
                  to="/reports"
                  onClick={() => setIsProfileOpen(false)}
                  className="block px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition"
                >
                  Financial Reports
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
