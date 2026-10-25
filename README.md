# Personal Accountant Pro — Premium React Finance Dashboard

Personal Accountant Pro is a modern personal finance management web application designed for comprehensive financial tracking in Indian Rupees (INR ₹), featuring daily expense tracking, multi-loan EMI amortization schedules, personal bank accounts management, and cloud synchronization with Google Sheets and Excel.

---

## 🌟 Key Features

### 1. Main Dashboard (`/`)
- **6 Real-Time Live KPI Cards**: Total Income, Total Expenses, Available Bank Balance, Monthly Savings, Outstanding Loan Amount, and Upcoming EMI Amount.
- **Dynamic Animated Counters**: Smooth easing transitions when financial figures update or load.
- **Interactive Visualizations**:
  - Income vs Expenses monthly cash flow comparison chart (Recharts Bar chart).
  - Category-wise expense breakdown donut chart with percentages and tooltips.
  - Quick-view connected bank account liquidity cards with live calculated balances.
  - Upcoming loan installments calendar with countdown badges and instant "Pay EMI" actions.
  - Overdue loan payment alert banner.
  - Category monthly budget limits with automated 80% and 100% threshold warnings.

### 2. Daily Expense & Income Tracker (`/expenses`)
- **Dual Transaction Recording**: Record daily expenses or income streams.
- **Fields**: Amount in INR (₹), Date & Time, Category, Subcategory, Merchant/Source, Description, Payment Method (UPI, Debit Card, Credit Card, Bank Transfer, Cash), Linked Bank Account, and Receipt Attachment preview.
- **Smart Safeguards**:
  - **Duplicate Transaction Warning**: Automatically alerts if an identical amount, date, and merchant was entered.
  - **Zero Double Counting**: Linking an expense or income to a bank account synchronizes the bank ledger without double-counting liabilities.
- **Filters & Search**: Filter by quick periods (Today, This Week, This Month, Last Month, All Time, Custom Range), Category, Payment Method, and Bank Account.
- **Sorting & Pagination**: Sort by Date, Amount, or Merchant with customizable pages.
- **Export Options**: Filtered export to CSV and full workbook export to Excel (.xlsx).

### 3. EMI & Loan Portfolio (`/loans`)
- **Multi-Facility Management**: Track Home Loans, Car Loans, Personal Loans, Education Loans, and Consumer 0% No-Cost EMIs.
- **Documented Interest Formulas**:
  - **Reducing Balance Method** (Standard RBI/Bank formula): $E = \frac{P \cdot r \cdot (1+r)^n}{(1+r)^n - 1}$
  - **Flat Rate Method** (Dealer/consumer durables promotion scheme): $\text{Total Interest} = P \cdot \frac{r}{100} \cdot \frac{n}{12}$
- **Full Amortization Schedule**: Month-by-month breakdown of Opening Principal, Principal Component, Interest Component, EMI Amount, and Closing Balance.
- **Payment Lifecycle**: Record Full EMI, Partial Payment, or Advance EMI with reference numbers and payment modes.
- **Early Prepayment & Foreclosure Simulator**: Test paying extra principal and calculate interest saved and months reduced.

### 4. Personal Bank Accounts Manager (`/banks`)
- **Universal Bank Support**: Add accounts from any Indian bank (HDFC, SBI, ICICI, Axis, Kotak, PNB, etc., or custom banks).
- **Strict Privacy Guarantee**: Never collects or stores bank passwords, PINs, CVVs, or NetBanking credentials. Account numbers are automatically masked as `•••• •••• 7291`.
- **Accurate Balance Formula**:
  $$\text{Calculated Balance} = \text{Opening Balance} + \text{Total Credits} - \text{Total Debits}$$
- **Internal Account Transfers**: Move money between your own accounts with matching Debit and Credit entries, strictly excluded from income/expense metrics.
- **Statement Import & Reconciliation**: Upload CSV or Excel statements with an auto-detecting column mapper and duplicate transaction detection.

### 5. Google Sheets & Excel Auto-Save (`/sync`)
- **Google Sheets Webhook Sync**: Continuous synchronization via a Google Apps Script Web App receiver.
- **Sync Status Queue**: Displays `Saved locally`, `Saving...`, `Syncing...`, `Synced`, or `Sync failed`.
- **Multi-Sheet Formatted Excel Workbook**: Instant download of an 8-sheet formatted `.xlsx` workbook:
  1. *Summary*
  2. *Expenses*
  3. *Income*
  4. *Loans*
  5. *EMI Payments*
  6. *Bank Accounts*
  7. *Bank Transactions*
  8. *Budgets*
- **Offline Safeguard**: Full JSON backup export and restore capability.

---

## 🛠️ Technology Stack

- **Framework**: React 19 with Vite 8
- **Styling**: Tailwind CSS v4 with custom fintech dark/light tokens
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Charts**: Recharts
- **Routing**: React Router v7
- **Excel & Spreadsheet Processing**: SheetJS (`xlsx`)
- **Persistence**: LocalStorage with automatic schema validation and debouncing

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18 or higher; tested on Node v24)
- npm (v9 or higher)

### 2. Installation
```bash
# Clone or navigate to the workspace
cd PA

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available locally at `http://localhost:5173` or `http://localhost:5174`.

### 3. Build for Production
```bash
npm run build
npm run preview
```

---

## 📋 Cloud Integrations Requiring Credentials

Personal Accountant Pro functions as an offline-first, client-side application. The following cloud features require user configuration:

| Integration | Configuration Required | Notes |
| :--- | :--- | :--- |
| **Google Sheets Two-Way Sync** | Google Apps Script Web App URL | Copy the pre-built `.gs` script from **Settings > Data & Sync** and deploy as a Web App in Google Sheets. |
| **Microsoft OneDrive / Excel Live Sync** | Microsoft Graph API Client ID | For continuous direct editing of an online Excel workbook, configure Azure AD App Registration. Downloading offline `.xlsx` workbooks requires zero credentials. |
| **Live Bank Feed (Account Aggregator)** | RBI Account Aggregator (AA) Gateway | Direct live bank aggregation requires an RBI-licensed Account Aggregator integration (e.g. Setu, Finvu). The app currently uses secure statement imports and manual ledger entries. |
| **Automated Background Email Reminders** | SendGrid / AWS SES API Key | Browser notifications operate locally while the browser is open. Automated emails when offline require a serverless trigger or cron runner. |

---

## 📄 License
MIT License. Built with modern React and Tailwind CSS.
# PAcountant
