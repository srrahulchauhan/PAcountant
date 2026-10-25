import React from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { ToastProvider } from './components/ui/Toast'
import { FinanceProvider } from './context/FinanceContext'
import { NotificationProvider } from './context/NotificationContext'
import { ThemeProvider } from './context/ThemeContext'
import { BanksPage } from './pages/BanksPage'
import { DashboardPage } from './pages/DashboardPage'
import { ExpensesPage } from './pages/ExpensesPage'
import { LoansPage } from './pages/LoansPage'
import { ReportsPage } from './pages/ReportsPage'
import { SettingsPage } from './pages/SettingsPage'
import { SyncSettingsPage } from './pages/SyncSettingsPage'

function App() {
  return (
    <ThemeProvider>
      <FinanceProvider>
        <NotificationProvider>
          <ToastProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<AppLayout />}>
                  <Route index element={<DashboardPage />} />
                  <Route path="expenses" element={<ExpensesPage />} />
                  <Route path="loans" element={<LoansPage />} />
                  <Route path="banks" element={<BanksPage />} />
                  <Route path="banks/:bankId" element={<BanksPage />} />
                  <Route path="reports" element={<ReportsPage />} />
                  <Route path="sync" element={<SyncSettingsPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </ToastProvider>
        </NotificationProvider>
      </FinanceProvider>
    </ThemeProvider>
  )
}

export default App
