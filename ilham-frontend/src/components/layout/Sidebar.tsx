import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'

const navItems = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Students', path: '/students' },
  { label: 'Universities', path: '/universities' },
  { label: 'Finance', path: '/finance' },
]

export default function Sidebar() {
  return (
    <motion.aside
      initial={{ x: -80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="w-64 bg-white/10 backdrop-blur-xl border-r border-white/20 p-6"
    >
      <h2 className="text-2xl font-bold mb-8 text-cyan-300">
        Ilham Admin
      </h2>

      <nav className="space-y-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `block px-4 py-2 rounded-lg transition ${
                isActive
                  ? 'bg-cyan-400 text-black font-semibold'
                  : 'hover:bg-white/20'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </motion.aside>
  )
}
