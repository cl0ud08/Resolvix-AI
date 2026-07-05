'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getUserFromToken, logout, User } from '@/lib/auth'

const customerLinks = [
  { href: '/dashboard', label: 'My Tickets', icon: '🎫' },
  { href: '/tickets/new', label: 'New Ticket', icon: '✏️' },
]

const agentLinks = [
  { href: '/agent', label: 'All Tickets', icon: '📋' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Only runs on client — after hydration
    setUser(getUserFromToken())
  }, [])

  const links = user?.role === 'customer' ? customerLinks : agentLinks

  return (
    <aside className="w-60 border-r border-slate-200 bg-white flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">S</span>
          </div>
          <span className="font-semibold text-slate-900">Smart Support</span>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(link => {
          const active = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span>{link.icon}</span>
              {link.label}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="px-3 py-4 border-t border-slate-200">
        <div className="px-3 py-2 mb-1">
          <p className="text-xs font-medium text-slate-900 truncate">
            {user?.full_name || user?.email || '...'}
          </p>
          <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
        >
          <span>🚪</span>
          Sign out
        </button>
      </div>
    </aside>
  )
}