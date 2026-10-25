import { AlertTriangle, Calendar, FileText, Image, IndianRupee, Layers, Tag, UploadCloud, User } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useFinance } from '../../context/FinanceContext'
import { formatINR } from '../../utils/formatters'
import { Modal } from '../ui/Modal'
import { useToast } from '../ui/Toast'

export const AddExpenseModal = ({
  isOpen,
  onClose,
  initialType = 'expense', // 'expense' | 'income'
  editingItem = null,
}) => {
  const { categories, bankAccounts, addExpense, updateExpense, addIncome, updateIncome, expenses, income } = useFinance()
  const { showToast } = useToast()

  const [type, setType] = useState(initialType)
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16)) // YYYY-MM-DDTHH:mm
  const [category, setCategory] = useState('')
  const [subcategory, setSubcategory] = useState('')
  const [merchant, setMerchant] = useState('')
  const [source, setSource] = useState('')
  const [description, setDescription] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('UPI')
  const [bankAccountId, setBankAccountId] = useState('')
  const [linkToBank, setLinkToBank] = useState(true)
  const [receiptUrl, setReceiptUrl] = useState(null)
  const [duplicateWarning, setDuplicateWarning] = useState(false)

  // Populate form if editing
  useEffect(() => {
    if (editingItem) {
      setType(editingItem.type || (editingItem.source ? 'income' : 'expense'))
      setAmount(editingItem.amount || '')
      setDate(editingItem.date ? new Date(editingItem.date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16))
      setCategory(editingItem.category || '')
      setSubcategory(editingItem.subcategory || '')
      setMerchant(editingItem.merchant || '')
      setSource(editingItem.source || '')
      setDescription(editingItem.description || '')
      setPaymentMethod(editingItem.paymentMethod || 'UPI')
      setBankAccountId(editingItem.bankAccountId || '')
      setLinkToBank(editingItem.isLinkedToBank || false)
      setReceiptUrl(editingItem.receiptUrl || null)
    } else {
      setType(initialType)
      setAmount('')
      setDate(new Date().toISOString().slice(0, 16))
      setSubcategory('')
      setMerchant('')
      setSource('')
      setDescription('')
      setPaymentMethod('UPI')
      setReceiptUrl(null)
      setDuplicateWarning(false)
      // Pick first matching category
      const matched = categories.find(c => c.type === initialType)
      if (matched) setCategory(matched.id)
      if (bankAccounts.length > 0) setBankAccountId(bankAccounts[0].id)
    }
  }, [editingItem, initialType, isOpen, categories, bankAccounts])

  // Filter categories by selected type
  const filteredCategories = categories.filter(c => c.type === type)

  // Duplicate transaction detection
  useEffect(() => {
    if (!amount || Number(amount) <= 0) {
      setDuplicateWarning(false)
      return
    }

    const checkDate = new Date(date).toDateString()
    const numAmount = Number(amount)

    if (type === 'expense') {
      const isDup = expenses.some(
        e =>
          (!editingItem || e.id !== editingItem.id) &&
          Math.abs(e.amount - numAmount) < 0.01 &&
          new Date(e.date).toDateString() === checkDate &&
          e.merchant &&
          merchant &&
          e.merchant.toLowerCase().trim() === merchant.toLowerCase().trim()
      )
      setDuplicateWarning(isDup)
    } else {
      const isDup = income.some(
        i =>
          (!editingItem || i.id !== editingItem.id) &&
          Math.abs(i.amount - numAmount) < 0.01 &&
          new Date(i.date).toDateString() === checkDate &&
          i.source &&
          source &&
          i.source.toLowerCase().trim() === source.toLowerCase().trim()
      )
      setDuplicateWarning(isDup)
    }
  }, [amount, date, merchant, source, type, expenses, income, editingItem])

  const handleReceiptUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setReceiptUrl(event.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!amount || Number(amount) <= 0) {
      showToast('Please enter a valid amount in INR', 'error')
      return
    }

    const payload = {
      amount: Number(amount),
      date: new Date(date).toISOString(),
      category: category || (filteredCategories[0]?.id || 'cat_general'),
      subcategory,
      description,
      paymentMethod,
      bankAccountId: bankAccountId || null,
      linkToBank: Boolean(bankAccountId && linkToBank),
      receiptUrl,
    }

    if (type === 'expense') {
      payload.merchant = merchant || 'General Merchant'
      if (editingItem) {
        updateExpense(editingItem.id, payload)
        showToast('Expense updated successfully', 'success')
      } else {
        addExpense(payload)
        showToast(`Expense of ${formatINR(payload.amount)} added`, 'success')
      }
    } else {
      payload.source = source || 'General Income'
      if (editingItem) {
        updateIncome(editingItem.id, payload)
        showToast('Income updated successfully', 'success')
      } else {
        addIncome(payload)
        showToast(`Income of ${formatINR(payload.amount)} recorded`, 'success')
      }
    }

    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingItem ? `Edit ${type === 'expense' ? 'Expense' : 'Income'}` : 'Record Transaction'}
      subtitle="Track your daily cash flow and bank activities"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Toggle Expense vs Income */}
        {!editingItem && (
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/60 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setType('expense')
                const matched = categories.find(c => c.type === 'expense')
                if (matched) setCategory(matched.id)
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition ${
                type === 'expense'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Expense (-)
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income')
                const matched = categories.find(c => c.type === 'income')
                if (matched) setCategory(matched.id)
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Income (+)
            </button>
          </div>
        )}

        {/* Duplicate Warning Alert */}
        {duplicateWarning && (
          <div className="flex items-center gap-2.5 rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 text-xs text-amber-300">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
            <span>
              <strong>Potential duplicate:</strong> A transaction with amount {formatINR(amount)} on this date already exists for {merchant || source}.
            </span>
          </div>
        )}

        {/* Amount & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Amount in INR (₹) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                ₹
              </span>
              <input
                type="number"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 2450"
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 pl-8 pr-3 text-sm font-semibold text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Date & Time <span className="text-rose-400">*</span>
            </label>
            <input
              type="datetime-local"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 px-3 text-xs text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Category & Subcategory */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 px-3 text-xs text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {type === 'expense' ? 'Subcategory / Tag' : 'Income Stream'}
            </label>
            <input
              type="text"
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              placeholder={type === 'expense' ? 'e.g. Dining Out, Petrol, Grocery' : 'e.g. Salary, Dividend, Bonus'}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 px-3 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Merchant / Source */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            {type === 'expense' ? 'Merchant / Shop / Payee' : 'Income Source / Payer'}
          </label>
          <input
            type="text"
            value={type === 'expense' ? merchant : source}
            onChange={(e) => (type === 'expense' ? setMerchant(e.target.value) : setSource(e.target.value))}
            placeholder={type === 'expense' ? 'e.g. Swiggy, Amazon, D-Mart, Shell Petrol' : 'e.g. TechCorp India, Client Retainer, TCS'}
            className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 px-3 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Payment Method & Bank Account */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 px-3 text-xs text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Debit Card">Debit Card</option>
              <option value="Bank Transfer">Net Banking / NEFT / IMPS</option>
              <option value="Cash">Cash</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Linked Bank Account</label>
            <select
              value={bankAccountId}
              onChange={(e) => setBankAccountId(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 px-3 text-xs text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">None (Unlinked)</option>
              {bankAccounts.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.bankName} - {b.accountNickname} ({formatINR(b.calculatedBalance)})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bank linkage toggle */}
        {bankAccountId && (
          <div className="flex items-center gap-2 rounded-xl bg-slate-950/50 p-2.5 border border-slate-800 text-xs text-slate-300">
            <input
              type="checkbox"
              id="linkToBank"
              checked={linkToBank}
              onChange={(e) => setLinkToBank(e.target.checked)}
              className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="linkToBank" className="cursor-pointer">
              Automatically record corresponding debit/credit in the linked bank account statement
            </label>
          </div>
        )}

        {/* Description / Notes */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Notes / Description</label>
          <textarea
            rows="2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add any specific memo or details..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2 px-3 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
          />
        </div>

        {/* Optional Receipt Attachment */}
        <div className="pt-1">
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Receipt Attachment (Optional)
          </label>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 rounded-xl border border-dashed border-slate-700 bg-slate-950/60 px-3 py-2 text-xs font-medium text-slate-300 hover:border-slate-500 hover:text-white cursor-pointer transition">
              <UploadCloud className="h-4 w-4 text-emerald-400" />
              <span>{receiptUrl ? 'Change Receipt' : 'Upload Receipt'}</span>
              <input type="file" accept="image/*" onChange={handleReceiptUpload} className="hidden" />
            </label>
            {receiptUrl && (
              <div className="flex items-center gap-2">
                <img src={receiptUrl} alt="Receipt preview" className="h-9 w-9 rounded-lg object-cover border border-slate-700" />
                <button
                  type="button"
                  onClick={() => setReceiptUrl(null)}
                  className="text-xs text-rose-400 hover:text-rose-300"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
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
            className={`rounded-xl px-5 py-2 text-xs font-semibold text-white shadow-lg transition ${
              type === 'expense'
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-950/40'
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/40'
            }`}
          >
            {editingItem ? 'Save Changes' : type === 'expense' ? 'Record Expense' : 'Record Income'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
