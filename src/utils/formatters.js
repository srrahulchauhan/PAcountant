/**
 * Currency & Date formatting utilities tailored for Indian Financial Standards (INR ₹, DD/MM/YYYY)
 */

/**
 * Format a number into Indian Rupee format (e.g., ₹1,25,000 or ₹45,230.50)
 * Handles Indian numbering system (Lakhs and Crores grouping: 2, 2, 3)
 */
export const formatINR = (amount, { showDecimals = false, compact = false } = {}) => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '₹0'
  }

  const num = Number(amount)

  if (compact && Math.abs(num) >= 10000000) {
    // Crores
    return `₹${(num / 10000000).toFixed(2)} Cr`
  }
  if (compact && Math.abs(num) >= 100000) {
    // Lakhs
    return `₹${(num / 100000).toFixed(2)} L`
  }

  const isNegative = num < 0
  const absNum = Math.abs(num)

  // Split integer and decimal parts
  const parts = showDecimals ? absNum.toFixed(2).split('.') : [Math.round(absNum).toString()]
  let intPart = parts[0]
  const decPart = parts[1] ? `.${parts[1]}` : ''

  // Indian comma format: last 3 digits, then every 2 digits
  let lastThree = intPart.substring(intPart.length - 3)
  const otherNumbers = intPart.substring(0, intPart.length - 3)
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree
  }
  const formattedInt = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree

  return `${isNegative ? '-' : ''}₹${formattedInt}${decPart}`
}

/**
 * Format date string into Indian Standard Date: DD/MM/YYYY
 */
export const formatDate = (dateInput) => {
  if (!dateInput) return '—'
  const date = new Date(dateInput)
  if (isNaN(date.getTime())) return '—'

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()

  return `${day}/${month}/${year}`
}

/**
 * Format date string into Indian Date & Time: DD/MM/YYYY, hh:mm A
 */
export const formatDateTime = (dateInput) => {
  if (!dateInput) return '—'
  const date = new Date(dateInput)
  if (isNaN(date.getTime())) return '—'

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()

  let hours = date.getHours()
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  hours = hours ? hours : 12 // the hour '0' should be '12'

  return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`
}

/**
 * Get relative human friendly time for due dates and payments
 */
export const getRelativeDays = (dateInput) => {
  if (!dateInput) return ''
  const target = new Date(dateInput)
  const now = new Date()
  
  // Strip time for accurate day comparison
  target.setHours(0, 0, 0, 0)
  now.setHours(0, 0, 0, 0)

  const diffTime = target.getTime() - now.getTime()
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Due today'
  if (diffDays === 1) return 'Due tomorrow'
  if (diffDays === -1) return '1 day overdue'
  if (diffDays < -1) return `${Math.abs(diffDays)} days overdue`
  if (diffDays <= 7) return `Due in ${diffDays} days`
  return formatDate(dateInput)
}

/**
 * Unique ID generator with prefix
 */
export const generateId = (prefix = 'rec') => {
  const timestamp = Date.now().toString(36)
  const randomStr = Math.random().toString(36).substring(2, 8)
  return `${prefix}_${timestamp}_${randomStr}`
}

/**
 * Mask account number for security: "•••• •••• 4821"
 */
export const maskAccountNumber = (accountNo) => {
  if (!accountNo) return '••••'
  const cleaned = String(accountNo).replace(/\s+/g, '')
  if (cleaned.length <= 4) return `••• ${cleaned}`
  const lastFour = cleaned.slice(-4)
  return `•••• •••• ${lastFour}`
}
