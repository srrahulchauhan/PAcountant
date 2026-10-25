import {
  Bell,
  Check,
  CheckCircle2,
  DollarSign,
  Download,
  Edit2,
  Globe,
  Layers,
  Moon,
  Paintbrush,
  Palette,
  Plus,
  RotateCcw,
  ShieldAlert,
  Sun,
  Tag,
  Trash2,
  Upload,
} from 'lucide-react'
import React, { useState } from 'react'
import { Badge } from '../components/ui/Badge'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Modal } from '../components/ui/Modal'
import { useFinance } from '../context/FinanceContext'
import { useNotifications } from '../context/NotificationContext'
import { ACCENT_COLORS, useTheme } from '../context/ThemeContext'
import { formatINR } from '../utils/formatters'
import { useToast } from '../components/ui/Toast'

export const SettingsPage = () => {
  const {
    settings,
    updateSettings,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    resetToDemo,
    clearAll,
  } = useFinance()
  const { theme, toggleTheme, accent, setAccentColor } = useTheme()
  const { browserPermission, requestPermission } = useNotifications()
  const { showToast } = useToast()

  // Modals
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [deleteCatTarget, setDeleteCatTarget] = useState(null)
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false)
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false)

  // Category form state
  const [catName, setCatName] = useState('')
  const [catType, setCatType] = useState('expense')
  const [catColor, setCatColor] = useState('#10b981')
  const [catBudget, setCatBudget] = useState('10000')

  // Notification days preferences state
  const remindDays = settings.notifications?.remindDaysBefore || [3, 2, 0]

  const handleOpenCategoryModal = (cat = null) => {
    if (cat) {
      setEditingCategory(cat)
      setCatName(cat.name)
      setCatType(cat.type)
      setCatColor(cat.color || '#10b981')
      setCatBudget(String(cat.budget || 0))
    } else {
      setEditingCategory(null)
      setCatName('')
      setCatType('expense')
      setCatColor('#10b981')
      setCatBudget('10000')
    }
    setIsCategoryModalOpen(true)
  }

  const handleSaveCategory = (e) => {
    e.preventDefault()
    if (!catName.trim()) {
      showToast('Please enter a category name', 'error')
      return
    }

    const payload = {
      name: catName.trim(),
      type: catType,
      color: catColor,
      budget: Number(catBudget) || 0,
    }

    if (editingCategory) {
      updateCategory(editingCategory.id, payload)
      showToast(`Category "${payload.name}" updated`, 'success')
    } else {
      addCategory(payload)
      showToast(`Category "${payload.name}" created`, 'success')
    }

    setIsCategoryModalOpen(false)
  }

  const toggleRemindDay = (day) => {
    let updated = [...remindDays]
    if (updated.includes(day)) {
      updated = updated.filter(d => d !== day)
    } else {
      updated.push(day)
    }
    updateSettings({
      notifications: {
        remindDaysBefore: updated.sort((a, b) => b - a),
      },
    })
    showToast('Reminder schedule updated', 'info')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          System Preferences & Categories
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure currency standards, theme palettes, category budget limits, and notifications
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Localization & Financial Standards */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-white">Localization & Formats</h3>
            <p className="text-xs text-slate-400">Fixed to Indian Financial & Banking Standards</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/60">
              <div>
                <p className="text-xs font-semibold text-white">Primary Currency</p>
                <p className="text-[11px] text-slate-400">Indian Rupee (INR ₹) with Lakhs & Crores grouping</p>
              </div>
              <Badge variant="emerald" size="md">
                ₹ INR
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/60">
              <div>
                <p className="text-xs font-semibold text-white">Date Format Standard</p>
                <p className="text-[11px] text-slate-400">Indian Standard Day/Month/Year</p>
              </div>
              <Badge variant="blue" size="md">
                DD/MM/YYYY
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/60">
              <div>
                <p className="text-xs font-semibold text-white">Default Date Filter</p>
                <p className="text-[11px] text-slate-400">Dashboard start view range</p>
              </div>
              <select
                value={settings.defaultDateRange || 'month'}
                onChange={(e) => updateSettings({ defaultDateRange: e.target.value })}
                className="rounded-lg border border-slate-800 bg-slate-900 py-1.5 px-2.5 text-xs text-white"
              >
                <option value="month">Current Month</option>
                <option value="today">Today Only</option>
                <option value="week">This Week</option>
                <option value="year">Current Year</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>
        </div>

        {/* Theme & Visual Appearance */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-white">Theme & Accent Styling</h3>
            <p className="text-xs text-slate-400">Personalize dashboard colors and contrast mode</p>
          </div>

          <div className="space-y-4">
            {/* Dark / Light Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/60">
              <div>
                <p className="text-xs font-semibold text-white">Color Mode</p>
                <p className="text-[11px] text-slate-400">Current: {theme === 'dark' ? 'Deep Navy Dark' : 'Clean Light'}</p>
              </div>
              <button
                onClick={toggleTheme}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white transition"
              >
                {theme === 'dark' ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5 text-blue-400" />}
                <span>Switch to {theme === 'dark' ? 'Light' : 'Dark'}</span>
              </button>
            </div>

            {/* Accent Color Palette */}
            <div>
              <p className="text-xs font-medium text-slate-300 mb-2">Accent Highlight Palette</p>
              <div className="grid grid-cols-5 gap-2">
                {Object.entries(ACCENT_COLORS).map(([key, item]) => (
                  <button
                    key={key}
                    onClick={() => setAccentColor(key)}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition ${
                      accent === key
                        ? 'border-white/60 bg-slate-800/80 shadow-md'
                        : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                    }`}
                  >
                    <span className="h-5 w-5 rounded-full" style={{ backgroundColor: item.primary }} />
                    <span className="text-[10px] font-medium text-slate-300">{item.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Notification & Reminder Preferences */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-white">EMI Reminders & Notifications</h3>
            <p className="text-xs text-slate-400">Configurable alerts prior to loan installments</p>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-slate-300 mb-1.5">Notify Me Before Due Date:</p>
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { label: '3 Days Prior', day: 3 },
                  { label: '2 Days Prior', day: 2 },
                  { label: '1 Day Prior', day: 1 },
                  { label: 'On Due Day', day: 0 },
                ].map(({ label, day }) => (
                  <button
                    key={day}
                    onClick={() => toggleRemindDay(day)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition ${
                      remindDays.includes(day)
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    {remindDays.includes(day) && '✓ '}
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/60">
              <div>
                <p className="text-xs font-semibold text-white">Browser Push Notifications</p>
                <p className="text-[11px] text-slate-400">
                  Permission: <strong className="text-slate-200 capitalize">{browserPermission}</strong>
                </p>
              </div>
              <button
                onClick={requestPermission}
                className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white transition"
              >
                {browserPermission === 'granted' ? 'Enabled' : 'Grant Permission'}
              </button>
            </div>
          </div>
        </div>

        {/* Data Reset & Storage Management */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-white">Database & Demo Management</h3>
            <p className="text-xs text-slate-400">Reset sample records or purge local browser storage</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/60">
              <div>
                <p className="text-xs font-semibold text-white">Reset to Realistic Demo Data</p>
                <p className="text-[11px] text-slate-400">
                  Reload pre-configured Indian bank accounts, loans, and expenses
                </p>
              </div>
              <button
                onClick={() => setIsResetConfirmOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white transition shrink-0"
              >
                <RotateCcw className="h-3.5 w-3.5 text-emerald-400" />
                <span>Reload Demo</span>
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-rose-500/20 bg-rose-950/10">
              <div>
                <p className="text-xs font-semibold text-rose-300">Clear All Financial Records</p>
                <p className="text-[11px] text-slate-400">Wipe all local accounts, transactions, and loans</p>
              </div>
              <button
                onClick={() => setIsClearConfirmOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 transition shrink-0 shadow-lg shadow-rose-950/40"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear All Data</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Category Management Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-semibold text-white">Expense & Income Categories ({categories.length})</h3>
            <p className="text-xs text-slate-400">Manage categories, badge colors, and monthly budget limits</p>
          </div>
          <button
            onClick={() => handleOpenCategoryModal(null)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition shadow-md"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Category</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/50 hover:border-slate-700 transition"
            >
              <div className="flex items-center gap-2.5">
                <span className="h-3.5 w-3.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                <div>
                  <p className="text-xs font-semibold text-white">{cat.name}</p>
                  <p className="text-[10px] text-slate-500">
                    {cat.type === 'expense'
                      ? `Budget: ${cat.budget ? formatINR(cat.budget) : 'No Limit'}`
                      : 'Income Stream'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenCategoryModal(cat)}
                  className="rounded-lg p-1 text-slate-400 hover:text-white transition"
                  title="Edit category"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setDeleteCatTarget(cat)}
                  className="rounded-lg p-1 text-slate-400 hover:text-rose-400 transition"
                  title="Delete category"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add / Edit Category Modal */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Create Category'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveCategory} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Category Name</label>
            <input
              type="text"
              required
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="e.g. Pets & Veterinary, Gym, Charity"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3 text-xs text-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Type</label>
              <select
                value={catType}
                onChange={(e) => setCatType(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3 text-xs text-white focus:outline-none"
              >
                <option value="expense">Expense (-)</option>
                <option value="income">Income (+)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Badge Color</label>
              <input
                type="color"
                value={catColor}
                onChange={(e) => setCatColor(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-800 bg-slate-950 cursor-pointer p-1"
              />
            </div>
          </div>

          {catType === 'expense' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Monthly Budget Limit in INR (₹)
              </label>
              <input
                type="number"
                value={catBudget}
                onChange={(e) => setCatBudget(e.target.value)}
                placeholder="e.g. 15000"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3 text-xs text-white focus:outline-none"
              />
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCategoryModalOpen(false)}
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-500 shadow-md"
            >
              {editingCategory ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Category Delete */}
      <ConfirmDialog
        isOpen={Boolean(deleteCatTarget)}
        onClose={() => setDeleteCatTarget(null)}
        onConfirm={() => {
          deleteCategory(deleteCatTarget.id)
          showToast(`Category "${deleteCatTarget.name}" deleted`, 'info')
          setDeleteCatTarget(null)
        }}
        title="Delete Category?"
        message={`Are you sure you want to delete category "${deleteCatTarget?.name}"? Existing transactions will keep their values.`}
        confirmText="Delete Category"
        isDestructive={true}
      />

      {/* Confirm Reload Demo Data */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={() => {
          resetToDemo()
          showToast('Sample INR financial records reloaded', 'success')
        }}
        title="Reload Demo Dataset?"
        message="This will replace current records with realistic Indian demo bank accounts, home & auto loans, and monthly expenses."
        confirmText="Reload Demo Data"
        isDestructive={false}
      />

      {/* Confirm Clear All */}
      <ConfirmDialog
        isOpen={isClearConfirmOpen}
        onClose={() => setIsClearConfirmOpen(false)}
        onConfirm={() => {
          clearAll()
          showToast('All local financial records purged', 'info')
        }}
        title="Clear All Financial Records?"
        message="This will permanently delete all expenses, loans, bank accounts, and transactions. You will start with a completely empty ledger."
        confirmText="Permanently Wipe Data"
        isDestructive={true}
      />
    </div>
  )
}
