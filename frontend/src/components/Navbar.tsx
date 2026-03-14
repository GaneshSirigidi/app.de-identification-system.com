import { Link, useLocation } from 'react-router-dom'
import { ShieldCheck, LayoutDashboard, FileText } from 'lucide-react'
import clsx from 'clsx'

export default function Navbar() {
  const { pathname } = useLocation()

  const navItems = [
    { to: '/', label: 'De-identify', icon: FileText },
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ]

  return (
    <nav className="bg-blue-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <ShieldCheck className="w-7 h-7 text-blue-300" />
            <div>
              <span className="text-lg font-bold tracking-tight">MedShield</span>
              <span className="ml-2 text-xs text-blue-300 font-medium">HIPAA De-identification</span>
            </div>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  pathname === to
                    ? 'bg-blue-700 text-white'
                    : 'text-blue-200 hover:bg-blue-800 hover:text-white',
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}
