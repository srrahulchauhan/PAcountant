import { AnimatePresence, motion } from 'framer-motion'
import React, { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AddExpenseModal } from '../modals/AddExpenseModal'
import { DemoBanner } from './DemoBanner'
import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'

export const AppLayout = () => {
  const location = useLocation()
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-emerald-500 selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          onOpenQuickAdd={() => setIsQuickAddOpen(true)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />

        {/* Demo Mode Notice Banner */}
        <DemoBanner />

        {/* Main Routed Page View with Framer Motion AnimatePresence */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Global Quick Add Transaction Modal */}
      <AddExpenseModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        initialType="expense"
      />
    </div>
  )
}
