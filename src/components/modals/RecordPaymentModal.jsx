import { Calendar, CheckCircle2, DollarSign, FileCheck, IndianRupee } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useFinance } from '../../context/FinanceContext'
import { formatDate, formatINR } from '../../utils/formatters'
import { generateAmortizationSchedule } from '../../utils/loanCalculations'
import { Modal } from '../ui/Modal'
import { useToast } from '../ui/Toast'

export const RecordPaymentModal = ({
  isOpen,
  onClose,
  loan,
  installmentToPay = null,
}) => {
  const { recordLoanPayment, loanPayments, bankAccounts } = useFinance()
  const { showToast } = useToast()

  const [installmentNumber, setInstallmentNumber] = useState(1)
  const [amount, setAmount] = useState('')
  const [principalComponent, setPrincipalComponent] = useState('')
  const [interestComponent, setInterestComponent] = useState('')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10))
  const [paymentMethod, setPaymentMethod] = useState('Auto Debit')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [paymentType, setPaymentType] = useState('full') // 'full' | 'partial' | 'advance'
  const [deductFromBank, setDeductFromBank] = useState(true)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!loan) return

    const schedule = generateAmortizationSchedule(loan, loanPayments)
    const targetInstallment = installmentToPay || schedule.find(s => s.status !== 'paid' && s.status !== 'advance_paid') || schedule[0]

    if (targetInstallment) {
      setInstallmentNumber(targetInstallment.installmentNumber)
      setAmount(String(targetInstallment.emiAmount))
      setPrincipalComponent(String(targetInstallment.principalComponent))
      setInterestComponent(String(targetInstallment.interestComponent))
      setPaymentType('full')
      setPaymentDate(new Date().toISOString().slice(0, 10))
      setReferenceNumber(`ACH/${Date.now().toString().slice(-8)}`)
      setNotes(`Installment #${targetInstallment.installmentNumber} payment`)
    }
  }, [loan, installmentToPay, isOpen, loanPayments])

  // Recalculate components when amount changes
  const handleAmountChange = (newAmount) => {
    setAmount(newAmount)
    const num = Number(newAmount) || 0
    if (loan && loan.emiAmount > 0) {
      // Split proportionally based on scheduled breakdown
      const standardEMI = loan.emiAmount
      const pRatio = 0.7
      const pComp = Math.round(num * pRatio)
      const iComp = num - pComp
      setPrincipalComponent(String(pComp))
      setInterestComponent(String(iComp))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!amount || Number(amount) <= 0) {
      showToast('Please enter a valid payment amount', 'error')
      return
    }

    let status = 'paid'
    if (paymentType === 'partial') status = 'partially_paid'
    if (paymentType === 'advance') status = 'advance_paid'

    const payload = {
      loanId: loan.id,
      installmentNumber: Number(installmentNumber),
      amount: Number(amount),
      principalComponent: Number(principalComponent) || Math.round(Number(amount) * 0.7),
      interestComponent: Number(interestComponent) || Math.round(Number(amount) * 0.3),
      paymentDate: new Date(paymentDate).toISOString(),
      paymentMethod,
      referenceNumber: referenceNumber.trim() || `PAY/${Date.now().toString().slice(-6)}`,
      status,
      deductFromBank: Boolean(loan.linkedBankAccountId && deductFromBank),
      notes: notes.trim(),
    }

    recordLoanPayment(payload)
    showToast(`Payment of ${formatINR(payload.amount)} recorded for ${loan.loanName}`, 'success')
    onClose()
  }

  if (!loan) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Record EMI Payment: ${loan.loanName}`}
      subtitle={`Lender: ${loan.lender} • Scheduled EMI: ${formatINR(loan.emiAmount)}`}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Payment Type Toggle */}
        <div className="grid grid-cols-3 gap-2 p-1 bg-slate-950/60 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setPaymentType('full')
              setAmount(String(loan.emiAmount))
            }}
            className={`py-1.5 text-xs font-semibold rounded-lg transition ${
              paymentType === 'full' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Full EMI
          </button>
          <button
            type="button"
            onClick={() => setPaymentType('partial')}
            className={`py-1.5 text-xs font-semibold rounded-lg transition ${
              paymentType === 'partial' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Partial Payment
          </button>
          <button
            type="button"
            onClick={() => setPaymentType('advance')}
            className={`py-1.5 text-xs font-semibold rounded-lg transition ${
              paymentType === 'advance' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Advance EMI
          </button>
        </div>

        {/* Installment # & Payment Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Installment Number <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              min="1"
              max={loan.tenureMonths || 360}
              required
              value={installmentNumber}
              onChange={(e) => setInstallmentNumber(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 px-3 text-xs text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Payment Date <span className="text-rose-400">*</span>
            </label>
            <input
              type="date"
              required
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 px-3 text-xs text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Amount Paid */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Amount Paid in INR (₹) <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₹</span>
            <input
              type="number"
              required
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="e.g. 39045"
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 pl-8 pr-3 text-sm font-bold text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Breakdown into Principal and Interest Component */}
        <div className="grid grid-cols-2 gap-4 p-3 rounded-xl border border-slate-800 bg-slate-950/40">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Principal Portion (₹)</label>
            <input
              type="number"
              value={principalComponent}
              onChange={(e) => setPrincipalComponent(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 py-1.5 px-2.5 text-xs font-semibold text-emerald-400 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Interest Portion (₹)</label>
            <input
              type="number"
              value={interestComponent}
              onChange={(e) => setInterestComponent(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 py-1.5 px-2.5 text-xs font-semibold text-amber-400 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Payment Method & Reference */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Payment Mode</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 px-3 text-xs text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="Auto Debit">NACH / ECS Auto-Debit</option>
              <option value="UPI">UPI (GPay, PhonePe, Paytm)</option>
              <option value="Netbanking">Net Banking / NEFT</option>
              <option value="Credit Card Bill">Credit Card Bill</option>
              <option value="Cheque">Cheque Deposit</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">UTR / Reference No.</label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g. NACH/002918401"
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 px-3 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Bank linkage toggle */}
        {loan.linkedBankAccountId && (
          <div className="flex items-center gap-2 rounded-xl bg-slate-950/60 p-2.5 border border-slate-800 text-xs text-slate-300">
            <input
              type="checkbox"
              id="deductFromBank"
              checked={deductFromBank}
              onChange={(e) => setDeductFromBank(e.target.checked)}
              className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="deductFromBank" className="cursor-pointer">
              Record debit transaction in linked bank account statement
            </label>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Notes</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Payment confirmation or memo..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2 px-3 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
          />
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
            Confirm Payment
          </button>
        </div>
      </form>
    </Modal>
  )
}
