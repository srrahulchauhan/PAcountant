import { Building2, IndianRupee, Lock, ShieldCheck } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useFinance } from '../../context/FinanceContext'
import { formatINR } from '../../utils/formatters'
import { Modal } from '../ui/Modal'
import { useToast } from '../ui/Toast'

const COMMON_BANKS = [
  'HDFC Bank',
  'State Bank of India',
  'ICICI Bank',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'Punjab National Bank',
  'Bank of Baroda',
  'IndusInd Bank',
  'IDFC FIRST Bank',
  'Citibank India',
  'Standard Chartered',
  'HSBC India',
  'Yes Bank',
  'Federal Bank',
]

export const AddBankModal = ({
  isOpen,
  onClose,
  editingBank = null,
}) => {
  const { addBankAccount, updateBankAccount } = useFinance()
  const { showToast } = useToast()

  const [bankName, setBankName] = useState('HDFC Bank')
  const [customBank, setCustomBank] = useState('')
  const [accountNickname, setAccountNickname] = useState('')
  const [accountType, setAccountType] = useState('Savings')
  const [accountHolder, setAccountHolder] = useState('Aditya Sharma')
  const [accountNumber, setAccountNumber] = useState('')
  const [openingBalance, setOpeningBalance] = useState('')
  const [openingBalanceDate, setOpeningBalanceDate] = useState(new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (editingBank) {
      if (COMMON_BANKS.includes(editingBank.bankName)) {
        setBankName(editingBank.bankName)
        setCustomBank('')
      } else {
        setBankName('Other')
        setCustomBank(editingBank.bankName)
      }
      setAccountNickname(editingBank.accountNickname || '')
      setAccountType(editingBank.accountType || 'Savings')
      setAccountHolder(editingBank.accountHolder || '')
      setAccountNumber(editingBank.maskedNumber ? editingBank.maskedNumber.replace(/[^\d]/g, '') : '')
      setOpeningBalance(String(editingBank.openingBalance || ''))
      setOpeningBalanceDate(editingBank.openingBalanceDate ? editingBank.openingBalanceDate.slice(0, 10) : new Date().toISOString().slice(0, 10))
      setNotes(editingBank.notes || '')
    } else {
      setBankName('HDFC Bank')
      setCustomBank('')
      setAccountNickname('')
      setAccountType('Savings')
      setAccountHolder('Aditya Sharma')
      setAccountNumber('')
      setOpeningBalance('50000')
      setOpeningBalanceDate(new Date().toISOString().slice(0, 10))
      setNotes('')
    }
  }, [editingBank, isOpen])

  const handleSubmit = (e) => {
    e.preventDefault()
    const resolvedBankName = bankName === 'Other' ? customBank.trim() : bankName

    if (!resolvedBankName) {
      showToast('Please enter the bank name', 'error')
      return
    }
    if (!accountNickname.trim()) {
      showToast('Please enter an account nickname', 'error')
      return
    }

    const payload = {
      bankName: resolvedBankName,
      accountNickname: accountNickname.trim(),
      accountType,
      accountHolder: accountHolder.trim() || 'Account Holder',
      accountNumber: accountNumber.trim() || '0000',
      openingBalance: Number(openingBalance) || 0,
      openingBalanceDate,
      notes: notes.trim(),
    }

    if (editingBank) {
      updateBankAccount(editingBank.id, payload)
      showToast(`Bank account ${payload.accountNickname} updated`, 'success')
    } else {
      addBankAccount(payload)
      showToast(`Bank account "${payload.bankName} - ${payload.accountNickname}" added`, 'success')
    }

    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingBank ? 'Edit Bank Account' : 'Add Bank Account'}
      subtitle="Connect any personal bank to track real-time cash flow and statements"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Privacy security disclaimer */}
        <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3 text-xs text-slate-300">
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-emerald-300">Bank Grade Security Guarantee:</strong> We never request or store your banking passwords, UPI PINs, CVVs, or NetBanking credentials. Account numbers are masked automatically for your privacy.
          </p>
        </div>

        {/* Bank Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Select Bank</label>
            <select
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 px-3 text-xs text-white focus:border-emerald-500 focus:outline-none"
            >
              {COMMON_BANKS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
              <option value="Other">Other Bank (Custom)</option>
            </select>
          </div>

          {bankName === 'Other' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Enter Bank Name</label>
              <input
                type="text"
                required
                value={customBank}
                onChange={(e) => setCustomBank(e.target.value)}
                placeholder="e.g. DBS Bank India, Saraswat Bank"
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 px-3 text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Account Nickname <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={accountNickname}
              onChange={(e) => setAccountNickname(e.target.value)}
              placeholder="e.g. Primary Salary, Emergency Fund"
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 px-3 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Account Type & Account Holder */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Account Type</label>
            <select
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 px-3 text-xs text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="Savings">Savings Account</option>
              <option value="Salary">Salary Account</option>
              <option value="Current">Current Account</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Fixed Deposit">Fixed Deposit / Term Deposit</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Account Holder Name</label>
            <input
              type="text"
              value={accountHolder}
              onChange={(e) => setAccountHolder(e.target.value)}
              placeholder="e.g. Aditya Sharma"
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 px-3 text-xs text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Account Number & Opening Balance */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Account Number (Last 4 digits or full)
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="e.g. 5010049281928"
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 pl-9 pr-3 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Will be masked as •••• •••• {accountNumber.slice(-4) || '••••'}
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Opening Balance in INR (₹) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₹</span>
              <input
                type="number"
                step="any"
                required
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                placeholder="e.g. 75000"
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 pl-8 pr-3 text-xs font-semibold text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Opening Date & Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Opening Balance Date</label>
            <input
              type="date"
              required
              value={openingBalanceDate}
              onChange={(e) => setOpeningBalanceDate(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 px-3 text-xs text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Notes / Branch Info</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Indiranagar Branch, IFSC Code..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 px-3 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
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
            {editingBank ? 'Update Account' : 'Add Account'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
