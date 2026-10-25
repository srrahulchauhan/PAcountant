/**
 * Financial calculation engine for Loans, EMIs, and Amortization Schedules.
 * Documented formulas:
 * 1. Reducing Balance Method (Standard Banking Formula):
 *    r = annualRate / (12 * 100)
 *    EMI = [P * r * (1 + r)^n] / [(1 + r)^n - 1]
 *    Interest per month = Opening Principal * r
 *    Principal per month = EMI - Interest
 *
 * 2. Flat Rate Method:
 *    Total Interest = Principal * (annualRate / 100) * (tenureMonths / 12)
 *    EMI = (Principal + Total Interest) / tenureMonths
 *    Fixed monthly interest = Total Interest / tenureMonths
 */

/**
 * Calculate Monthly EMI using Reducing Balance method
 */
export const calculateReducingBalanceEMI = (principal, annualRate, tenureMonths) => {
  const p = Number(principal) || 0
  const rate = Number(annualRate) || 0
  const n = Number(tenureMonths) || 0

  if (p <= 0 || n <= 0) return 0
  if (rate === 0) return Math.round(p / n)

  const r = rate / (12 * 100)
  const factor = Math.pow(1 + r, n)
  const emi = (p * r * factor) / (factor - 1)

  return Math.round(emi)
}

/**
 * Calculate Monthly EMI using Flat Rate method
 */
export const calculateFlatRateEMI = (principal, annualRate, tenureMonths) => {
  const p = Number(principal) || 0
  const rate = Number(annualRate) || 0
  const n = Number(tenureMonths) || 0

  if (p <= 0 || n <= 0) return 0
  if (rate === 0) return Math.round(p / n)

  const years = n / 12
  const totalInterest = p * (rate / 100) * years
  const totalPayable = p + totalInterest

  return Math.round(totalPayable / n)
}

/**
 * Calculate EMI based on selected method
 */
export const calculateEMI = (principal, annualRate, tenureMonths, method = 'reducing') => {
  if (method === 'flat') {
    return calculateFlatRateEMI(principal, annualRate, tenureMonths)
  }
  return calculateReducingBalanceEMI(principal, annualRate, tenureMonths)
}

/**
 * Generate full monthly amortization schedule with payment statuses
 */
export const generateAmortizationSchedule = (loan, recordedPayments = []) => {
  if (!loan) return []

  const principal = Number(loan.principalAmount) || 0
  const rate = Number(loan.interestRate) || 0
  const tenure = Number(loan.tenureMonths) || 12
  const method = loan.calculationMethod || 'reducing'
  const monthlyRate = rate / (12 * 100)
  const startDate = new Date(loan.startDate || Date.now())
  const dueDay = Number(loan.monthlyDueDay) || startDate.getDate()

  // Standard EMI
  const scheduledEMI = loan.emiAmount || calculateEMI(principal, rate, tenure, method)

  let remainingPrincipal = principal
  const schedule = []

  // Filter payments for this loan
  const loanPayments = recordedPayments.filter(p => p.loanId === loan.id)

  const now = new Date()
  now.setHours(0, 0, 0, 0)

  for (let installmentNo = 1; installmentNo <= tenure; installmentNo++) {
    if (remainingPrincipal <= 0) break

    // Calculate installment due date
    const dueDate = new Date(startDate.getFullYear(), startDate.getMonth() + installmentNo - 1, dueDay)
    dueDate.setHours(0, 0, 0, 0)

    let interestComponent = 0
    let principalComponent = 0

    if (method === 'flat') {
      const totalInterest = principal * (rate / 100) * (tenure / 12)
      interestComponent = Math.round(totalInterest / tenure)
      principalComponent = scheduledEMI - interestComponent
    } else {
      // Reducing balance
      interestComponent = Math.round(remainingPrincipal * monthlyRate)
      principalComponent = Math.min(scheduledEMI - interestComponent, remainingPrincipal)
    }

    const openingBalance = remainingPrincipal
    const closingBalance = Math.max(0, openingBalance - principalComponent)

    // Check if payment was made for this installment
    const matchingPayment = loanPayments.find(p => p.installmentNumber === installmentNo)
    let status = 'pending'
    let paidAmount = 0
    let paymentDate = null
    let paymentRef = null

    if (matchingPayment) {
      paidAmount = matchingPayment.amount
      paymentDate = matchingPayment.paymentDate
      paymentRef = matchingPayment.referenceNumber
      if (matchingPayment.status) {
        status = matchingPayment.status
      } else if (paidAmount >= scheduledEMI) {
        status = 'paid'
      } else if (paidAmount > 0) {
        status = 'partially_paid'
      }
    } else {
      const diffDays = Math.round((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays < 0) {
        status = 'overdue'
      } else if (diffDays <= 5) {
        status = 'due_soon'
      } else {
        status = 'pending'
      }
    }

    schedule.push({
      installmentNumber: installmentNo,
      dueDate: dueDate.toISOString(),
      openingBalance,
      principalComponent,
      interestComponent,
      emiAmount: scheduledEMI,
      closingBalance,
      status,
      paidAmount,
      paymentDate,
      paymentRef,
    })

    remainingPrincipal = closingBalance
  }

  return schedule
}

/**
 * Calculate comprehensive summary metrics for a loan from real payments
 */
export const calculateLoanMetrics = (loan, recordedPayments = []) => {
  if (!loan) return null

  const principal = Number(loan.principalAmount) || 0
  const payments = recordedPayments.filter(p => p.loanId === loan.id)

  const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
  const totalPrincipalPaid = payments.reduce((sum, p) => sum + (Number(p.principalComponent) || (Number(p.amount) * 0.7)), 0)
  const totalInterestPaid = payments.reduce((sum, p) => sum + (Number(p.interestComponent) || (Number(p.amount) * 0.3)), 0)

  // Remaining principal calculated from total principal portion paid
  const remainingPrincipal = Math.max(0, principal - totalPrincipalPaid)
  const percentRepaid = principal > 0 ? Math.min(100, Math.round((totalPrincipalPaid / principal) * 100)) : 100

  // Schedule to determine overdue and next installment
  const schedule = generateAmortizationSchedule(loan, recordedPayments)
  const paidCount = schedule.filter(s => s.status === 'paid' || s.status === 'advance_paid').length
  const overdueCount = schedule.filter(s => s.status === 'overdue').length
  const nextPending = schedule.find(s => s.status === 'pending' || s.status === 'due_soon' || s.status === 'overdue')

  return {
    principal,
    totalPaid,
    totalPrincipalPaid,
    totalInterestPaid: Math.round(totalInterestPaid),
    remainingPrincipal: Math.round(remainingPrincipal),
    percentRepaid,
    paidCount,
    remainingCount: Math.max(0, schedule.length - paidCount),
    overdueCount,
    nextDueInstallment: nextPending || null,
    isCompleted: remainingPrincipal <= 0 || paidCount >= schedule.length,
  }
}

/**
 * Pre-payment / Foreclosure impact calculator
 * Shows interest savings and tenure reduction
 */
export const calculatePrepaymentImpact = (loan, recordedPayments = [], extraPrincipalPayment = 50000) => {
  const currentMetrics = calculateLoanMetrics(loan, recordedPayments)
  if (!currentMetrics || currentMetrics.remainingPrincipal <= 0) return null

  const extra = Math.min(Number(extraPrincipalPayment) || 0, currentMetrics.remainingPrincipal)
  const newPrincipal = currentMetrics.remainingPrincipal - extra
  const rate = Number(loan.interestRate) || 0
  const monthlyRate = rate / (12 * 100)
  const emi = Number(loan.emiAmount) || 0

  if (emi <= newPrincipal * monthlyRate || monthlyRate === 0) {
    return {
      extraPayment: extra,
      monthsSaved: 0,
      interestSaved: 0,
      newTenureMonths: 0,
    }
  }

  // Formula to calculate remaining months with same EMI:
  // n = -log(1 - (P * r) / EMI) / log(1 + r)
  const remainingMonthsOld = Math.ceil(-Math.log(1 - (currentMetrics.remainingPrincipal * monthlyRate) / emi) / Math.log(1 + monthlyRate))
  const remainingMonthsNew = Math.ceil(-Math.log(1 - (newPrincipal * monthlyRate) / emi) / Math.log(1 + monthlyRate))

  const totalOldPayable = remainingMonthsOld * emi
  const totalNewPayable = extra + (remainingMonthsNew * emi)
  const interestSaved = Math.max(0, totalOldPayable - totalNewPayable)
  const monthsSaved = Math.max(0, remainingMonthsOld - remainingMonthsNew)

  return {
    extraPayment: extra,
    remainingPrincipalAfter: Math.round(newPrincipal),
    monthsSaved,
    interestSaved: Math.round(interestSaved),
    newTenureMonths: remainingMonthsNew,
  }
}
