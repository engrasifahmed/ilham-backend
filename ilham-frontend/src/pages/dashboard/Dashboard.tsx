import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { applicationsService } from '../../services/applications.service'
import type { UnpaidInvoice, UnreadNotification } from '../../services/applications.service'

export default function Dashboard() {
  const [unpaidInvoices, setUnpaidInvoices] = useState<UnpaidInvoice[]>([])
  const [unreadNotifications, setUnreadNotifications] = useState<UnreadNotification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [invoices, notifications] = await Promise.all([
        applicationsService.getUnpaidInvoices(),
        applicationsService.getUnreadNotifications()
      ])
      setUnpaidInvoices(invoices)
      setUnreadNotifications(notifications)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalUnpaidAmount = unpaidInvoices.reduce((sum, inv) => sum + inv.balance_due, 0)
  const totalUnreadCount = unreadNotifications.reduce((sum, notif) => sum + notif.unread_count, 0)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-white/60">Welcome to Ilham Education Consultancy Service</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Unpaid Invoices Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-xl rounded-2xl p-6 border border-red-500/30"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Unpaid Invoices</h3>
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-white mb-1">
              ${totalUnpaidAmount.toLocaleString()}
            </p>
            <p className="text-sm text-white/60">{unpaidInvoices.length} invoices pending</p>
          </motion.div>

          {/* Unread Notifications Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 backdrop-blur-xl rounded-2xl p-6 border border-yellow-500/30"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Unread Notifications</h3>
              <svg className="w-8 h-8 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-white mb-1">{totalUnreadCount}</p>
            <p className="text-sm text-white/60">
              {unreadNotifications.length} students with unread messages
            </p>
          </motion.div>

          {/* Quick Actions Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 backdrop-blur-xl rounded-2xl p-6 border border-cyan-500/30"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <a
                href="/documents"
                className="block px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors"
              >
                📄 Manage Documents
              </a>
              <a
                href="/counselors"
                className="block px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors"
              >
                👥 Assign Counselors
              </a>
            </div>
          </motion.div>
        </div>

        {/* Unpaid Invoices Table */}
        {unpaidInvoices.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden"
          >
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold text-white">Recent Unpaid Invoices</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                      University
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                      Paid
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                      Balance Due
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {unpaidInvoices.slice(0, 5).map((invoice) => (
                    <tr key={invoice.invoice_id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">{invoice.student_name}</div>
                        <div className="text-xs text-white/60">{invoice.student_email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                        {invoice.university_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        ${invoice.invoice_amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400">
                        ${invoice.total_paid.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-400">
                        ${invoice.balance_due.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Students with Unread Notifications */}
        {unreadNotifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden"
          >
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold text-white">Students with Unread Notifications</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                      Unread Count
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {unreadNotifications.slice(0, 5).map((notif) => (
                    <tr key={notif.student_id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {notif.student_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                        {notif.student_email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 text-sm font-semibold bg-yellow-500/20 text-yellow-400 rounded-full">
                          {notif.unread_count}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  )
}
