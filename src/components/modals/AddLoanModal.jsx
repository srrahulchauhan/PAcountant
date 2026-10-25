import { Calculator, HelpCircle, IndianRupee, Info } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useFinance } from '../../context/FinanceContext'
import { formatINR } from '../../utils/formatters'
import { calculateEMI } from '../../utils/loanCalculations'
import { Modal } from '../ui/Modal'
import { useToast } from '../ui/Toast'

export const AddLoanModal = ({
  isOpen,
  onClose,
  editingLoan = null,
}) => {
  const { bankAccounts, addLoan, updateLoan } = useFinance()
  const { showToast } = useToast()

  const [loanName, setLoanName] = useState('')
  const [lender, setLender] = useState('')
  const [loanType, setLoanType] = useState('Home Loan')
  const [principalAmount, setPrincipalAmount] = useState('')
  const [interestRate, setInterestRate] = useState('8.5')
  const [calculationMethod, setCalculationMethod] = useState('reducing') // 'reducing' | 'flat'
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [tenureMonths, setTenureMonths] = useState('120')
  const [emiAmount, setEmiAmount] = useState('')
  const [monthlyDueDay, setMonthlyDueDay] = useState('5')
  const [linkedBankAccountId, setLinkedBankAccountId] = useState('')
  const [notes, setNotes] = useState('')
  const [showFormulaInfo, setShowFormulaInfo] = useState(false)

  // Auto-calculate EMI whenever principal, rate, tenure, or method changes
  useEffect(() => {
    if (principalAmount && Number(principalAmount) > 0 && tenureMonths && Number(tenureMonths) > 0) {
      const calculated = calculateEMI(principalAmount, interestRate, tenureMonths, calculationMethod)
      setEmiAmount(String(calculated))
    }
  }, [principalAmount, interestRate, tenureMonths, calculationMethod])

  useEffect(() => {
    if (editingLoan) {
      setLoanName(editingLoan.loanName || '')
      setLender(editingLoan.lender || '')
      setLoanType(editingLoan.loanType || 'Home Loan')
      setPrincipalAmount(String(editingLoan.principalAmount || ''))
      setInterestRate(String(editingLoan.interestRate || ''))
      setCalculationMethod(editingLoan.calculationMethod || 'reducing')
      setStartDate(editingLoan.startDate ? editingLoan.startDate.slice(0, 10) : new Date().toISOString().slice(0, 10))
      setTenureMonths(String(editingLoan.tenureMonths || ''))
      setEmiAmount(String(editingLoan.emiAmount || ''))
      setMonthlyDueDay(String(editingLoan.monthlyDueDay || '5'))
      setLinkedBankAccountId(editingLoan.linkedBankAccountId || '')
      setNotes(editingLoan.notes || '')
    } else {
      setLoanName('')
      setLender('')
      setLoanType('Home Loan')
      setPrincipalAmount('')
      setInterestRate('8.5')
      setCalculationMethod('reducing')
      setStartDate(new Date().toISOString().slice(0, 10))
      setTenureMonths('60')
      setEmiAmount('')
      setMonthlyDueDay('5')
      setLinkedBankAccountId(bankAccounts[0]?.id || '')
      setNotes('')
    }
  }, [editingLoan, isOpen, bankAccounts])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!principalAmount || Number(principalAmount) <= 0) {
      showToast('Please enter a valid loan principal amount', 'error')
      return
    }
    if (!loanName.trim()) {
      showToast('Please enter a loan name', 'error')
      return
    }

    const payload = {
      loanName: loanName.trim(),
      lender: lender.trim() || 'Bank / Lender',
      loanType,
      principalAmount: Number(principalAmount),
      interestRate: Number(interestRate) || 0,
      calculationMethod,
      startDate,
      tenureMonths: Number(tenureMonths) || 12,
      emiAmount: Number(emiAmount) || calculateEMI(principalAmount, interestRate, tenureMonths, calculationMethod),
      monthlyDueDay: Number(monthlyDueDay) || 5,
      linkedBankAccountId: linkedBankAccountId || null,
      notes: notes.trim(),
    }

    if (editingLoan) {
      updateLoan(editingLoan.id, payload)
      showToast(`Loan ${payload.loanName} updated`, 'success')
    } else {
      addLoan(payload)
      showToast(`New loan "${payload.loanName}" created with EMI ${formatINR(payload.emiAmount)}`, 'success')
    }

    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingLoan ? 'Edit Loan & EMI' : 'Add New Loan or EMI'}
      subtitle="Track your loan schedule, interest calculations, and installments"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Loan Name & Lender */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Loan Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={loanName}
              onChange={(e) => setLoanName(e.target.value)}
              placeholder="e.g. HDFC Home Loan, SBI Auto Loan"
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 px-3 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Lender / Institution</label>
            <input
              type="text"
              value={lender}
              onChange={(e) => setLender(e.target.value)}
              placeholder="e.g. HDFC Bank, SBI, ICICI, Bajaj Finserv"
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 px-3 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Loan Type & Principal Amount */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Loan Type</label>
            <select
              value={loanType}
              onChange={(e) => setLoanType(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 px-3 text-xs text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="Home Loan">Home Loan</option>
              <option value="Car Loan">Car / Auto Loan</option>
              <option value="Personal Loan">Personal Loan</option>
              <option value="Education Loan">Education Loan</option>
              <option value="Personal / Gadget">Consumer / Gadget No-Cost EMI</option>
              <option value="Gold Loan">Gold Loan</option>
              <option value="Business Loan">Business Loan</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Principal Amount in INR (₹) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₹</span>
              <input
                type="number"
                required
                value={principalAmount}
                onChange={(e) => setPrincipalAmount(e.target.value)}
                placeholder="e.g. 2500000"
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 pl-8 pr-3 text-xs font-semibold text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Interest Rate & Calculation Method */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Interest Rate (% per annum)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                required
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                placeholder="e.g. 8.5"
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 px-3 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-300">Interest Method</label>
              <button
                type="button"
                onClick={() => setShowFormulaInfo(!showFormulaInfo)}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                <HelpCircle className="h-3 w-3" />
                <span>How is it calculated?</span>
              </button>
            </div>
            <select
              value={calculationMethod}
              onChange={(e) => setCalculationMethod(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 px-3 text-xs text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="reducing">Reducing Balance (Standard Banking EMI)</option>
              <option value="flat">Flat Rate Interest</option>
            </select>
          </div>
        </div>

        {/* Calculation explanation accordion */}
        {showFormulaInfo && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3 text-xs text-slate-300 space-y-1.5 leading-relaxed">
            <p className="font-semibold text-emerald-400">Calculation Method Documentation:</p>
            <p>
              • <strong>Reducing Balance:</strong> Monthly interest is calculated only on the remaining outstanding principal using standard banking formula E = [P × r × (1+r)ⁿ] / [(1+r)ⁿ - 1]. Used by most Indian banks (HDFC, SBI, ICICI) for home & car loans.
            </p>
            <p>
              • <strong>Flat Rate:</strong> Interest is calculated upfront on the original loan amount for the entire tenure. Common in consumer durables, gadget financing, or special dealer schemes.
            </p>
          </div>
        )}

        {/* Tenure, Start Date & Due Day */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Tenure (Months) <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              required
              value={tenureMonths}
              onChange={(e) => setTenureMonths(e.target.value)}
              placeholder="e.g. 60"
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 px-3 text-xs text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            {tenureMonths && (
              <span className="text-[10px] text-slate-500 mt-1 block">
                {(Number(tenureMonths) / 12).toFixed(1)} years
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Start Date</label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 px-3 text-xs text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Monthly Due Day (1-31)</label>
            <input
              type="number"
              min="1"
              max="31"
              value={monthlyDueDay}
              onChange={(e) => setMonthlyDueDay(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 px-3 text-xs text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Calculated Monthly EMI Preview */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Auto-Calculated Monthly EMI</span>
            <div className="text-lg font-bold text-emerald-400 mt-0.5">
              {emiAmount ? formatINR(emiAmount) : '—'} <span className="text-xs font-normal text-slate-500">/ month</span>
            </div>
          </div>
          <div className="w-32">
            <label className="block text-[10px] text-slate-400 mb-0.5">Fine-tune EMI (₹)</label>
            <input
              type="number"
              value={emiAmount}
              onChange={(e) => setEmiAmount(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 py-1.5 px-2 text-xs font-semibold text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Linked Bank Account */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Linked Auto-Debit Bank Account</label>
          <select
            value={linkedBankAccountId}
            onChange={(e) => setLinkedBankAccountId(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 px-3 text-xs text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">None (Manual Payments)</option>
            {bankAccounts.map((b) => (
              <option key={b.id} value={b.id}>
                {b.bankName} - {b.accountNickname} ({b.maskedNumber})
              </option>
            ))}
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Notes / Sanction Reference</label>
          <textarea
            rows="2"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Sanction letter number, account reference, asset details..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2 px-3 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
          />
        </div>

        {/* Buttons */}
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
            {editingLoan ? 'Save Loan Changes' : 'Create Loan Schedule'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
