import { AlertCircle, CheckCircle, FileSpreadsheet, Info, UploadCloud } from 'lucide-react'
import React, { useState } from 'react'
import { useFinance } from '../../context/FinanceContext'
import { parseUploadedStatement } from '../../services/excelService'
import { formatINR } from '../../utils/formatters'
import { Modal } from '../ui/Modal'
import { useToast } from '../ui/Toast'

export const ImportStatementModal = ({ isOpen, onClose, targetBankId = null }) => {
  const { bankAccounts, importBankTransactions } = useFinance()
  const { showToast } = useToast()

  const [selectedBankId, setSelectedBankId] = useState(targetBankId || bankAccounts[0]?.id || '')
  const [fileData, setFileData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [mapping, setMapping] = useState({
    dateCol: '',
    descCol: '',
    refCol: '',
    amountCol: '',
    typeCol: '',
    debitCol: '',
    creditCol: '',
  })
  const [importSummary, setImportSummary] = useState(null)

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setLoading(true)
    setImportSummary(null)
    try {
      const parsed = await parseUploadedStatement(file)
      setFileData(parsed)
      setMapping({
        dateCol: parsed.suggestedMapping.dateCol || parsed.headers[0] || '',
        descCol: parsed.suggestedMapping.descCol || parsed.headers[1] || '',
        refCol: parsed.suggestedMapping.refCol || '',
        amountCol: parsed.suggestedMapping.amountCol || '',
        typeCol: '',
        debitCol: parsed.suggestedMapping.debitCol || '',
        creditCol: parsed.suggestedMapping.creditCol || '',
      })
    } catch (err) {
      showToast(err.message || 'Failed to parse statement file', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = () => {
    if (!selectedBankId) {
      showToast('Please select a target bank account', 'error')
      return
    }
    if (!fileData || !fileData.dataRows) {
      showToast('Please upload a statement file first', 'error')
      return
    }

    const headers = fileData.headers
    const dateIdx = headers.indexOf(mapping.dateCol)
    const descIdx = headers.indexOf(mapping.descCol)
    const refIdx = headers.indexOf(mapping.refCol)
    const amountIdx = headers.indexOf(mapping.amountCol)
    const debitIdx = headers.indexOf(mapping.debitCol)
    const creditIdx = headers.indexOf(mapping.creditCol)

    if (dateIdx === -1 || descIdx === -1) {
      showToast('Date and Description column mappings are required', 'error')
      return
    }

    const processedList = []

    fileData.dataRows.forEach((row, idx) => {
      const rawDate = row[dateIdx]
      const desc = String(row[descIdx] || 'Bank Transaction').trim()
      const ref = refIdx !== -1 && row[refIdx] ? String(row[refIdx]) : `STMT/${Date.now().toString().slice(-6)}_${idx}`

      let amount = 0
      let type = 'debit'

      // Check if separate debit & credit columns exist
      if (debitIdx !== -1 && row[debitIdx] && Number(row[debitIdx]) > 0) {
        amount = Number(row[debitIdx])
        type = 'debit'
      } else if (creditIdx !== -1 && row[creditIdx] && Number(row[creditIdx]) > 0) {
        amount = Number(row[creditIdx])
        type = 'credit'
      } else if (amountIdx !== -1 && row[amountIdx]) {
        const rawAmt = Number(row[amountIdx])
        amount = Math.abs(rawAmt)
        type = rawAmt < 0 ? 'debit' : 'credit'
      }

      if (amount > 0) {
        let validDate = new Date()
        try {
          const parsedD = new Date(rawDate)
          if (!isNaN(parsedD.getTime())) validDate = parsedD
        } catch {
          validDate = new Date()
        }

        processedList.push({
          transactionDate: validDate.toISOString(),
          description: desc,
          referenceNumber: ref,
          amount,
          type,
          transactionType: 'Online',
          isTransfer: false,
          notes: 'Imported from bank statement',
        })
      }
    })

    if (processedList.length === 0) {
      showToast('No valid transactions could be parsed from the file with current column mappings', 'error')
      return
    }

    const result = importBankTransactions(selectedBankId, processedList)
    setImportSummary({
      totalParsed: processedList.length,
      imported: result.addedCount,
      duplicatesSkipped: processedList.length - result.addedCount,
    })

    showToast(`Successfully imported ${result.addedCount} transactions! (${processedList.length - result.addedCount} duplicates skipped)`, 'success')
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import Bank Statement"
      subtitle="Upload CSV or XLSX statement, map columns, and reconcile transactions"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Bank Account Selector */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Target Bank Account</label>
          <select
            value={selectedBankId}
            onChange={(e) => setSelectedBankId(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 px-3 text-xs text-white focus:border-emerald-500 focus:outline-none"
          >
            {bankAccounts.map((b) => (
              <option key={b.id} value={b.id}>
                {b.bankName} - {b.accountNickname} ({b.maskedNumber})
              </option>
            ))}
          </select>
        </div>

        {/* Upload Dropzone */}
        {!fileData ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-800 bg-slate-950/40 p-6 text-center hover:border-slate-700 transition">
            <label className="flex flex-col items-center justify-center cursor-pointer">
              <FileSpreadsheet className="h-10 w-10 text-emerald-400 mb-2" />
              <span className="text-sm font-semibold text-slate-200">
                {loading ? 'Reading and parsing statement...' : 'Upload CSV or Excel Statement (.xlsx, .csv)'}
              </span>
              <span className="text-xs text-slate-400 mt-1">
                Supports HDFC, SBI, ICICI, Axis, and all major Indian bank statement exports
              </span>
              <span className="mt-4 rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition">
                Browse Files
              </span>
              <input
                type="file"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        ) : (
          <div className="space-y-4">
            {/* File loaded pill */}
            <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-950/20 px-3 py-2 text-xs text-emerald-300">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                <span>
                  <strong>{fileData.fileName}</strong> ({fileData.dataRows.length} rows detected)
                </span>
              </div>
              <button
                onClick={() => setFileData(null)}
                className="text-xs text-slate-400 hover:text-white underline"
              >
                Upload different file
              </button>
            </div>

            {/* Column Mapping Section */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Column Mapping (Auto-Detected)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Date Column *</label>
                  <select
                    value={mapping.dateCol}
                    onChange={(e) => setMapping({ ...mapping, dateCol: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 py-1.5 px-2 text-xs text-white"
                  >
                    {fileData.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Description / Narration *</label>
                  <select
                    value={mapping.descCol}
                    onChange={(e) => setMapping({ ...mapping, descCol: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 py-1.5 px-2 text-xs text-white"
                  >
                    {fileData.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Debit / Withdrawal (₹)</label>
                  <select
                    value={mapping.debitCol}
                    onChange={(e) => setMapping({ ...mapping, debitCol: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 py-1.5 px-2 text-xs text-white"
                  >
                    <option value="">None / Combined Amount</option>
                    {fileData.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Credit / Deposit (₹)</label>
                  <select
                    value={mapping.creditCol}
                    onChange={(e) => setMapping({ ...mapping, creditCol: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 py-1.5 px-2 text-xs text-white"
                  >
                    <option value="">None / Combined Amount</option>
                    {fileData.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Combined Amount Column</label>
                  <select
                    value={mapping.amountCol}
                    onChange={(e) => setMapping({ ...mapping, amountCol: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 py-1.5 px-2 text-xs text-white"
                  >
                    <option value="">Use Debit/Credit Columns</option>
                    {fileData.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Reference / UTR / Chq</label>
                  <select
                    value={mapping.refCol}
                    onChange={(e) => setMapping({ ...mapping, refCol: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 py-1.5 px-2 text-xs text-white"
                  >
                    <option value="">Auto-generate Reference</option>
                    {fileData.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Import summary result if executed */}
            {importSummary && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3 text-xs text-emerald-200">
                <p className="font-semibold text-emerald-400">Statement Import Results:</p>
                <p>• {importSummary.imported} new transactions imported to account ledger</p>
                <p>• {importSummary.duplicatesSkipped} duplicate transactions detected and skipped automatically</p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
          >
            {importSummary ? 'Done' : 'Cancel'}
          </button>
          {fileData && !importSummary && (
            <button
              type="button"
              onClick={handleImport}
              className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-950/40 hover:bg-emerald-500 transition"
            >
              Parse & Reconcile Transactions
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}
