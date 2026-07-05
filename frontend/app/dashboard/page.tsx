'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
  in_progress: {
    label: 'In Progress',
    className: 'bg-purple-100 text-purple-700',
  },
  resolved: { label: 'Resolved', className: 'bg-green-100 text-green-700' },
  closed: { label: 'Closed', className: 'bg-slate-100 text-slate-500' },
}

export default function DashboardPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)

  const router = useRouter()

  useEffect(() => {
    const user = getUserFromToken()

    if (!user) {
      router.replace('/login')
      return
    }

    async function loadTickets() {
      try {
        const data = await listTickets()
        setTickets(data)
      } finally {
        setLoading(false)
      }
    }

    loadTickets()
  }, [router])

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              My Tickets
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Track and manage your support requests
            </p>
          </div>

          <Link
            href="/tickets/new"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + New Ticket
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white py-20 text-center">
            <p className="mb-4 text-4xl">🎫</p>
            <p className="mb-1 font-medium text-slate-700">
              No tickets yet
            </p>
            <p className="mb-6 text-sm text-slate-400">
              Submit a ticket and our AI will triage it instantly
            </p>

            <Link
              href="/tickets/new"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Submit your first ticket
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => {
              const priority =
                priorityConfig[ticket.priority] ?? priorityConfig.low
              const status =
                statusConfig[ticket.status] ?? statusConfig.open

              return (
                <Link
                  key={ticket.id}
                  href={`/tickets/${ticket.id}`}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 hover:border-blue-300 hover:shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900">
                      {ticket.subject}
                    </p>

                    <p className="mt-0.5 truncate text-sm text-slate-400">
                      {ticket.description}
                    </p>

                    <div className="mt-2 flex items-center gap-3">
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

                  <div className="ml-4 flex shrink-0 gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${priority.className}`}
                    >
                      {priority.label}
                    </span>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}
                    >
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