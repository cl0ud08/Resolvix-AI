'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { listTickets, Ticket } from '@/lib/api'
import { getUserFromToken } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'

const priorityConfig: Record<string, { label: string; className: string }> = {
  urgent: { label: 'Urgent', className: 'bg-red-500/10 text-red-400' },
  high: { label: 'High', className: 'bg-orange-500/10 text-orange-400' },
  medium: { label: 'Medium', className: 'bg-amber-500/10 text-amber-400' },
  low: { label: 'Low', className: 'bg-gray-500/10 text-gray-400' },
}

const statusConfig: Record<string, { label: string; className: string }> = {
  open: { label: 'Open', className: 'bg-blue-500/10 text-blue-400' },
  in_progress: {
    label: 'In Progress',
    className: 'bg-purple-500/10 text-purple-400',
  },
  resolved: { label: 'Resolved', className: 'bg-green-500/10 text-green-400' },
  closed: { label: 'Closed', className: 'bg-gray-500/10 text-gray-500' },
}

export default function DashboardPage() {
  const router = useRouter()

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)

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
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />

      <main className="flex-1 p-8">

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              My Tickets
            </h1>
            <p className="mt-1 text-sm text-gray-400">
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
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="rounded-2xl border border-gray-800 bg-gray-900 py-20 text-center">
            <p className="mb-4 text-4xl">🎫</p>
            <p className="mb-1 font-medium text-gray-200">
              No tickets yet
            </p>
            <p className="mb-6 text-sm text-gray-500">
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
                  className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900 p-4 hover:border-blue-500/50 hover:shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-white">
                      {ticket.subject}
                    </p>

                    <p className="mt-0.5 truncate text-sm text-gray-500">
                      {ticket.description}
                    </p>

                    <div className="mt-2 flex items-center gap-3">
                      {ticket.ai_category && (
                        <span className="text-xs text-gray-500">
                          {ticket.ai_category}
                        </span>
                      )}

                      <span className="text-xs text-gray-600">
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