import { ArrowRightLeft, Building2, IndianRupee, Info } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useFinance } from '../../context/FinanceContext'
import { formatINR } from '../../utils/formatters'
import { Modal } from '../ui/Modal'
import { useToast } from '../ui/Toast'

export const TransferModal = ({ isOpen, onClose, defaultFromBankId = null }) => {
  const { bankAccounts, transferBetweenAccounts } = useFinance()
  const { showToast } = useToast()

  const [fromBankId, setFromBankId] = useState('')
  const [toBankId, setToBankId] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('Internal account transfer')

  useEffect(() => {
    if (bankAccounts.length >= 2) {
      const from = defaultFromBankId || bankAccounts[0].id
      setFromBankId(from)
      const to = bankAccounts.find(b => b.id !== from)?.id || bankAccounts[1].id
      setToBankId(to)
    } else if (bankAccounts.length === 1) {
      setFromBankId(bankAccounts[0].id)
    }
    setAmount('')
    setDate(new Date().toISOString().slice(0, 10))
    setReference(`IMPS/${Date.now().toString().slice(-8)}`)
    setNotes('Internal account transfer')
  }, [bankAccounts, defaultFromBankId, isOpen])

  const sourceBank = bankAccounts.find(b => b.id === fromBankId)
  const destBank = bankAccounts.find(b => b.id === toBankId)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!fromBankId || !toBankId) {
      showToast('Please select both source and destination accounts', 'error')
      return
    }
    if (fromBankId === toBankId) {
      showToast('Source and destination accounts cannot be identical', 'error')
      return
    }
    if (!amount || Number(amount) <= 0) {
      showToast('Please enter a transfer amount greater than zero', 'error')
      return
    }

    try {
      transferBetweenAccounts({
        fromBankId,
        toBankId,
        amount: Number(amount),
        date: new Date(date).toISOString(),
        reference,
        notes,
      })
      showToast(`Transferred ${formatINR(amount)} from ${sourceBank.accountNickname} to ${destBank.accountNickname}`, 'success')
      onClose()
    } catch (err) {
      showToast(err.message || 'Transfer failed', 'error')
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transfer Between Accounts"
      subtitle="Move funds between your personal accounts without affecting expense or income totals"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Informational banner about internal transfers */}
        <div className="flex items-start gap-2.5 rounded-xl border border-blue-500/20 bg-blue-950/20 p-3 text-xs text-slate-300">
          <Info className="h-4 w-4 shrink-0 text-blue-400 mt-0.5" />
          <p className="leading-relaxed">
            Internal transfers create synchronized <strong>Debit</strong> and <strong>Credit</strong> records across the chosen accounts and are automatically excluded from your Income/Expense metrics.
          </p>
        </div>

        {/* From Account & To Account */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              From (Source Account) <span className="text-rose-400">*</span>
            </label>
            <select
              value={fromBankId}
              onChange={(e) => setFromBankId(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 px-3 text-xs text-white focus:border-emerald-500 focus:outline-none"
            >
              {bankAccounts.map((b) => (
                <option key={b.id} value={b.id} disabled={b.id === toBankId}>
                  {b.bankName} - {b.accountNickname} ({formatINR(b.calculatedBalance)})
                </option>
              ))}
            </select>
            {sourceBank && (
              <span className="text-[10px] text-slate-400 mt-1 block">
                Available: <strong className="text-emerald-400">{formatINR(sourceBank.calculatedBalance)}</strong>
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              To (Destination Account) <span className="text-rose-400">*</span>
            </label>
            <select
              value={toBankId}
              onChange={(e) => setToBankId(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 px-3 text-xs text-white focus:border-emerald-500 focus:outline-none"
            >
              {bankAccounts.map((b) => (
                <option key={b.id} value={b.id} disabled={b.id === fromBankId}>
                  {b.bankName} - {b.accountNickname} ({formatINR(b.calculatedBalance)})
                </option>
              ))}
            </select>
            {destBank && (
              <span className="text-[10px] text-slate-400 mt-1 block">
                Current: <strong className="text-slate-200">{formatINR(destBank.calculatedBalance)}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Transfer Amount */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Transfer Amount in INR (₹) <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₹</span>
            <input
              type="number"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 25000"
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 pl-8 pr-3 text-sm font-bold text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Date & Reference */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Transfer Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 px-3 text-xs text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">UTR / Ref Number</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. IMPS/00291820"
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 px-3 text-xs text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Notes / Purpose</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Savings allocation, credit card payment, buffer transfer"
            className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2 px-3 text-xs text-white focus:border-emerald-500 focus:outline-none"
          />
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-950/40 hover:bg-emerald-500 transition"
          >
            Execute Transfer
          </button>
        </div>
      </form>
    </Modal>
  )
}
