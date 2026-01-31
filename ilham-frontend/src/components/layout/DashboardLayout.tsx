import { motion } from 'framer-motion'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-[#081A33] via-[#0B2D55] to-[#00CFFF]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex flex-col flex-1">
        <Topbar />

        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="flex-1 p-6 overflow-y-auto bg-white/10 backdrop-blur-xl"
        >
          {children}
        </motion.main>
      </div>
    </div>
  )
}
