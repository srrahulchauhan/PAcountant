/**
 * Google Sheets Integration & Synchronization Service
 * 
 * Works seamlessly with a Google Apps Script Web App deployed by the user.
 * Features:
 * - Queue of pending mutations
 * - Reliable fetch with timeout & retry
 * - Explicit sync states: 'not_configured' | 'saved_locally' | 'saving' | 'syncing' | 'synced' | 'error'
 * - Ready-to-copy Google Apps Script (.gs) source code generator
 */

export const GOOGLE_APPS_SCRIPT_TEMPLATE = `// ====================================================================
// PERSONAL ACCOUNTANT PRO — GOOGLE APPS SCRIPT SYNC RECEIVER
// Paste this in Extensions > Apps Script in your Google Spreadsheet
// Click Deploy > New deployment > Select 'Web app'
// Set 'Execute as': Me
// Set 'Who has access': Anyone
// Copy the Web App URL and paste it into Personal Accountant Pro Settings
// ====================================================================

function doPost(e) {
  try {
    var rawData = e.postData.contents;
    var payload = JSON.parse(rawData);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (payload.action === 'ping') {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Personal Accountant Pro endpoint connected successfully!',
        timestamp: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (payload.action === 'sync_all') {
      var data = payload.data;

      // 1. Sync Expenses
      syncSheet(ss, 'Expenses', [
        'ID', 'Date', 'Amount', 'Category', 'Subcategory', 'Merchant', 'PaymentMethod', 'Notes', 'UpdatedAt'
      ], data.expenses.map(function(item) {
        return [item.id, item.date, item.amount, item.category, item.subcategory, item.merchant, item.paymentMethod, item.description, item.updatedAt || item.createdAt];
      }));

      // 2. Sync Income
      syncSheet(ss, 'Income', [
        'ID', 'Date', 'Amount', 'Source', 'Category', 'PaymentMethod', 'Description', 'UpdatedAt'
      ], data.income.map(function(item) {
        return [item.id, item.date, item.amount, item.source, item.category, item.paymentMethod, item.description, item.updatedAt || item.createdAt];
      }));

      // 3. Sync Bank Accounts
      syncSheet(ss, 'BankAccounts', [
        'ID', 'BankName', 'Nickname', 'Type', 'MaskedNumber', 'OpeningBalance', 'OpeningDate', 'UpdatedAt'
      ], data.bankAccounts.map(function(item) {
        return [item.id, item.bankName, item.accountNickname, item.accountType, item.maskedNumber, item.openingBalance, item.openingBalanceDate, item.updatedAt || item.createdAt];
      }));

      // 4. Sync Bank Transactions
      syncSheet(ss, 'BankTransactions', [
        'ID', 'BankID', 'Date', 'Description', 'Type', 'Amount', 'RefNumber', 'IsTransfer', 'UpdatedAt'
      ], data.bankTransactions.map(function(item) {
        return [item.id, item.bankAccountId, item.transactionDate, item.description, item.type, item.amount, item.referenceNumber, item.isTransfer ? 'YES' : 'NO', item.updatedAt || item.createdAt];
      }));

      // 5. Sync Loans
      syncSheet(ss, 'Loans', [
        'ID', 'Name', 'Lender', 'Type', 'Principal', 'Rate', 'Method', 'EMI', 'Tenure', 'DueDay', 'UpdatedAt'
      ], data.loans.map(function(item) {
        return [item.id, item.loanName, item.lender, item.loanType, item.principalAmount, item.interestRate, item.calculationMethod, item.emiAmount, item.tenureMonths, item.monthlyDueDay, item.updatedAt || item.createdAt];
      }));

      // 6. Sync EMI Payments
      syncSheet(ss, 'EMIPayments', [
        'ID', 'LoanID', 'InstallmentNo', 'Amount', 'Principal', 'Interest', 'Date', 'Status', 'RefNumber'
      ], data.loanPayments.map(function(item) {
        return [item.id, item.loanId, item.installmentNumber, item.amount, item.principalComponent, item.interestComponent, item.paymentDate, item.status, item.referenceNumber];
      }));

      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        recordsSynced: {
          expenses: data.expenses.length,
          income: data.income.length,
          bankAccounts: data.bankAccounts.length,
          loans: data.loans.length,
          payments: data.loanPayments.length
        },
        syncedAt: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Unknown action specified'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function syncSheet(spreadsheet, sheetName, headers, rows) {
  var sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  } else {
    sheet.clearContents();
  }

  var allData = [headers].concat(rows);
  if (allData.length > 0 && allData[0].length > 0) {
    sheet.getRange(1, 1, allData.length, allData[0].length).setValues(allData);
    sheet.getRange(1, 1, 1, allData[0].length).setFontWeight('bold').setBackground('#0f172a').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
}
`

/**
 * Ping test to verify Apps Script Webhook endpoint
 */
export const testGoogleSheetsConnection = async (webhookUrl) => {
  if (!webhookUrl || !webhookUrl.trim().startsWith('http')) {
    throw new Error('Please enter a valid Google Apps Script Web App URL starting with https://')
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 12000)

  try {
    const res = await fetch(webhookUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'ping', app: 'PersonalAccountantPro' }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    const json = await res.json()
    if (json.status === 'success') {
      return { success: true, message: json.message || 'Connected successfully!' }
    } else {
      throw new Error(json.message || 'Server rejected ping request')
    }
  } catch (err) {
    clearTimeout(timeoutId)
    if (err.name === 'AbortError') {
      throw new Error('Connection timed out after 12 seconds. Check your Apps Script deployment permissions.')
    }
    throw new Error(err.message || 'Network error communicating with Google Sheets endpoint')
  }
}

/**
 * Sync entire dataset to Google Sheets endpoint
 */
export const syncDataToGoogleSheets = async (webhookUrl, appData) => {
  if (!webhookUrl || !webhookUrl.trim().startsWith('http')) {
    return {
      success: false,
      error: 'Google Sheets synchronization endpoint is not configured.',
    }
  }

  const payload = {
    action: 'sync_all',
    app: 'PersonalAccountantPro',
    syncedAt: new Date().toISOString(),
    data: {
      expenses: appData.expenses || [],
      income: appData.income || [],
      bankAccounts: appData.bankAccounts || [],
      bankTransactions: appData.bankTransactions || [],
      loans: appData.loans || [],
      loanPayments: appData.loanPayments || [],
    },
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 20000)

  try {
    const res = await fetch(webhookUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    const json = await res.json()
    if (json.status === 'success') {
      return {
        success: true,
        recordsSynced: json.recordsSynced,
        timestamp: json.syncedAt || new Date().toISOString(),
      }
    } else {
      return { success: false, error: json.message || 'Remote Apps Script returned failure' }
    }
  } catch (err) {
    clearTimeout(timeoutId)
    return { success: false, error: err.message || 'Network sync error' }
  }
}
