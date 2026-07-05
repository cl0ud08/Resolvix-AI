'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { listTickets, Ticket } from '@/lib/api'
import { getUserFromToken } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'

const priorityConfig: Record<string, { label: string; className: string }> = {
  urgent: { label: 'Urgent', className: 'bg-red-100 text-red-700' },
  high: { label: 'High', className: 'bg-orange-100 text-orange-700' },
  medium: { label: 'Medium', className: 'bg-amber-100 text-amber-700' },
  low: { label: 'Low', className: 'bg-slate-100 text-slate-600' },
}

const statusConfig: Record<string, { label: string; className: string }> = {
  open: { label: 'Open', className: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'In Progress', className: 'bg-purple-100 text-purple-700' },
  resolved: { label: 'Resolved', className: 'bg-green-100 text-green-700' },
  closed: { label: 'Closed', className: 'bg-slate-100 text-slate-500' },
}

export default function DashboardPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const user = getUserFromToken()

  useEffect(() => {
    if (!user) { window.location.href = '/login'; return }
    listTickets().then(setTickets).finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Tickets</h1>
            <p className="text-slate-500 text-sm mt-1">
              Track and manage your support requests
            </p>
          </div>
          <Link
            href="/tickets/new"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            + New Ticket
          </Link>
        </div>

        {/* Ticket list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
            <p className="text-4xl mb-4">🎫</p>
            <p className="text-slate-700 font-medium mb-1">No tickets yet</p>
            <p className="text-slate-400 text-sm mb-6">
              Submit a ticket and our AI will triage it instantly
            </p>
            <Link
              href="/tickets/new"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Submit your first ticket
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map(ticket => {
              const priority = priorityConfig[ticket.priority] || priorityConfig.low
              const status = statusConfig[ticket.status] || statusConfig.open
              return (
                <Link
                  key={ticket.id}
                  href={`/tickets/${ticket.id}`}
                  className="flex items-center justify-between bg-white border border-slate-200 hover:border-blue-300 hover:shadow-sm rounded-xl p-4 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">
                      {ticket.subject}
                    </p>
                    <p className="text-slate-400 text-sm truncate mt-0.5">
                      {ticket.description}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      {ticket.ai_category && (
                        <span className="text-xs text-slate-400">
                          {ticket.ai_category}
                        </span>
                      )}
                      <span className="text-xs text-slate-300">
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4 shrink-0">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${priority.className}`}>
                      {priority.label}
                    </span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${status.className}`}>
                      {status.label}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}