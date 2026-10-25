import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Cloud,
  CloudAlert,
  CloudOff,
  Code2,
  Copy,
  Database,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Info,
  Layers,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Trash2,
  Upload,
} from 'lucide-react'
import React, { useState } from 'react'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { useFinance } from '../context/FinanceContext'
import { exportFullExcelWorkbook } from '../services/excelService'
import {
  GOOGLE_APPS_SCRIPT_TEMPLATE,
  testGoogleSheetsConnection,
} from '../services/googleSheetsService'
import { formatDate, formatDateTime } from '../utils/formatters'
import { useToast } from '../components/ui/Toast'

export const SyncSettingsPage = () => {
  const {
    settings,
    updateSettings,
    syncStatus,
    lastSyncedAt,
    syncErrorMessage,
    pendingChangesCount,
    triggerCloudSync,
    exportJsonBackup,
    restoreFromBackup,
    expenses,
    income,
    loans,
    loanPayments,
    bankAccounts,
    bankTransactions,
    categories,
  } = useFinance()
  const { showToast } = useToast()

  const [webhookUrl, setWebhookUrl] = useState(settings.googleSheets?.webhookUrl || '')
  const [spreadsheetId, setSpreadsheetId] = useState(settings.googleSheets?.spreadsheetId || '')
  const [isAutoSync, setIsAutoSync] = useState(settings.googleSheets?.autoSyncOnUpdate ?? true)
  const [isSyncEnabled, setIsSyncEnabled] = useState(settings.googleSheets?.enabled ?? false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [showScriptModal, setShowScriptModal] = useState(false)
  const [copiedScript, setCopiedScript] = useState(false)

  // Handle saving Google Sheets config
  const handleSaveConfig = (e) => {
    e.preventDefault()
    updateSettings({
      googleSheets: {
        enabled: isSyncEnabled,
        webhookUrl: webhookUrl.trim(),
        spreadsheetId: spreadsheetId.trim(),
        autoSyncOnUpdate: isAutoSync,
      },
    })
    showToast('Google Sheets sync settings updated', 'success')
  }

  // Ping test
  const handleTestConnection = async () => {
    if (!webhookUrl || !webhookUrl.trim().startsWith('http')) {
      showToast('Please enter a valid Google Apps Script Web App URL first', 'error')
      return
    }

    setIsTesting(true)
    setTestResult(null)
    try {
      const res = await testGoogleSheetsConnection(webhookUrl)
      setTestResult({ success: true, message: res.message })
      showToast('Connection verified successfully!', 'success')
    } catch (err) {
      setTestResult({ success: false, message: err.message })
      showToast(err.message, 'error')
    } finally {
      setIsTesting(false)
    }
  }

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE)
    setCopiedScript(true)
    showToast('Apps Script code copied to clipboard!', 'success')
    setTimeout(() => setCopiedScript(false), 3000)
  }

  const handleJsonRestoreUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        restoreFromBackup(event.target.result)
        showToast('Backup restored successfully!', 'success')
      } catch (err) {
        showToast(err.message || 'Failed to restore backup', 'error')
      }
    }
    reader.readAsText(file)
  }

  const renderStatusBadge = () => {
    switch (syncStatus) {
      case 'syncing':
        return (
          <Badge variant="blue" size="md">
            <RefreshCw className="h-3 w-3 animate-spin mr-1" />
            Syncing to Google Sheets...
          </Badge>
        )
      case 'synced':
        return (
          <Badge variant="emerald" size="md" dot>
            Connected & Synced
          </Badge>
        )
      case 'sync_failed':
        return (
          <Badge variant="rose" size="md" dot>
            Sync Error
          </Badge>
        )
      case 'saving':
        return (
          <Badge variant="amber" size="md">
            Saving locally...
          </Badge>
        )
      case 'saved_locally':
        return (
          <Badge variant="emerald" size="md">
            Saved locally in browser
          </Badge>
        )
      default:
        return (
          <Badge variant="slate" size="md">
            Cloud Sync: Not Configured
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          Data & Cloud Synchronization
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure real-time two-way sync with Google Sheets and downloadable multi-sheet Excel workbooks
        </p>
      </div>

      {/* Sync Status Overview Banner */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 p-5 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-400 shrink-0">
              <Cloud className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-base font-bold text-white">Google Sheets Sync Engine</h3>
                {renderStatusBadge()}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Last Successful Sync:{' '}
                <strong className="text-slate-200">
                  {lastSyncedAt ? formatDateTime(lastSyncedAt) : 'Never synced'}
                </strong>{' '}
                • Unsynced Mutations in Queue:{' '}
                <strong className="text-emerald-400">{pendingChangesCount}</strong>
              </p>
              {syncErrorMessage && (
                <p className="text-xs text-rose-400 mt-1 font-medium flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{syncErrorMessage}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isSyncEnabled && (
              <button
                onClick={triggerCloudSync}
                disabled={syncStatus === 'syncing'}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition shadow-lg shadow-emerald-950/40 disabled:opacity-40"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                <span>Retry Sync</span>
              </button>
            )}
            <button
              onClick={() => setShowScriptModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:text-white transition"
            >
              <Code2 className="h-3.5 w-3.5 text-blue-400" />
              <span>View Apps Script Code</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Google Sheets Configuration Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-white">Google Sheets Connection Settings</h3>
              <p className="text-xs text-slate-400">Connect via deployed Google Apps Script Webhook</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isSyncEnabled}
                onChange={(e) => setIsSyncEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Apps Script Web App URL <span className="text-rose-400">*</span>
              </label>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Obtained by clicking Deploy &gt; New deployment &gt; Web app in Google Sheets
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Google Spreadsheet ID (Optional reference)
              </label>
              <input
                type="text"
                value={spreadsheetId}
                onChange={(e) => setSpreadsheetId(e.target.value)}
                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-slate-950/60 p-2.5 border border-slate-800 text-xs text-slate-300">
              <input
                type="checkbox"
                id="autoSync"
                checked={isAutoSync}
                onChange={(e) => setIsAutoSync(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="autoSync" className="cursor-pointer">
                Automatically push transactions to Google Sheets when recorded
              </label>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-xl border text-xs ${
                  testResult.success
                    ? 'border-emerald-500/30 bg-emerald-950/30 text-emerald-300'
                    : 'border-rose-500/30 bg-rose-950/30 text-rose-300'
                }`}
              >
                {testResult.message}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:text-white transition disabled:opacity-50"
              >
                <RefreshCw className={`h-3 w-3 ${isTesting ? 'animate-spin' : ''}`} />
                <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
              </button>

              <button
                type="submit"
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition shadow-lg shadow-emerald-950/40"
              >
                Save Sync Preferences
              </button>
            </div>
          </form>
        </div>

        {/* Excel Export & Backup Operations Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-white">Full Workbook & Local Backups</h3>
            <p className="text-xs text-slate-400">Offline portable exports and complete restore archives</p>
          </div>

          <div className="space-y-3">
            {/* Download Complete Excel Workbook */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/50">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Download Multi-Sheet Excel (.xlsx)</h4>
                  <p className="text-[11px] text-slate-400">
                    Includes 8 separate tabs: Summary, Expenses, Income, Loans, EMIs, Banks, Transactions & Budgets
                  </p>
                </div>
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
                  showToast('Personal Accountant Pro workbook exported!', 'success')
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition shadow-md shrink-0"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export XLSX</span>
              </button>
            </div>

            {/* Download Complete JSON Backup */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/50">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Complete JSON Backup</h4>
                  <p className="text-[11px] text-slate-400">
                    Export entire application state for offline safeguarding or device migration
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  exportJsonBackup()
                  showToast('JSON backup archive downloaded', 'success')
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white transition shrink-0"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export JSON</span>
              </button>
            </div>

            {/* Restore from JSON Backup */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/50">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Restore from Backup</h4>
                  <p className="text-[11px] text-slate-400">
                    Import and reinstate previously exported JSON backup file
                  </p>
                </div>
              </div>
              <label className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white cursor-pointer transition shrink-0">
                <Upload className="h-3.5 w-3.5 text-amber-400" />
                <span>Restore Backup</span>
                <input type="file" accept=".json" onChange={handleJsonRestoreUpload} className="hidden" />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Google Apps Script Modal */}
      <Modal
        isOpen={showScriptModal}
        onClose={() => setShowScriptModal(false)}
        title="Google Apps Script Sync Code (.gs)"
        subtitle="Copy and paste this script into your Google Spreadsheet script editor"
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Step 1: Open Google Sheets &gt; Extensions &gt; Apps Script</span>
            <button
              onClick={handleCopyScript}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition"
            >
              {copiedScript ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedScript ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>

          <pre className="max-h-96 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-[11px] text-slate-300 leading-relaxed selection:bg-emerald-500 selection:text-white">
            {GOOGLE_APPS_SCRIPT_TEMPLATE}
          </pre>

          <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/60 text-slate-400 space-y-1">
            <p className="font-semibold text-slate-200">Deployment Checklist:</p>
            <p>1. In Apps Script, click <strong>Deploy</strong> &gt; <strong>New deployment</strong>.</p>
            <p>2. Select type <strong>Web app</strong>.</p>
            <p>3. Set <strong>Execute as:</strong> Me, and <strong>Who has access:</strong> Anyone.</p>
            <p>4. Copy the Web app URL and paste into the setting above.</p>
          </div>
        </div>
      </Modal>
    </div>
  )
}
