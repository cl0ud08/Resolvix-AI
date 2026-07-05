'use client'

import { useEffect, useState, useCallback } from 'react'
import { listTickets, updateTicket, listNotifications, Ticket, Notification } from '@/lib/api'
import { getUserFromToken } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'
import StatCard from '@/components/StatCard'

const priorityBorder: Record<string, string> = {
  urgent: 'border-l-red-500',
  high: 'border-l-orange-400',
  medium: 'border-l-amber-400',
  low: 'border-l-slate-300',
}

const sentimentColor: Record<string, string> = {
  positive: 'text-green-600',
  neutral: 'text-amber-600',
  negative: 'text-red-600',
}

export default function AgentPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Ticket | null>(null)
  const [updating, setUpdating] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const user = getUserFromToken()
  const loadTickets = useCallback(async () => {
    try {
      const data = await listTickets()
  
      setTickets(data)
  
      setSelected(prev => {
        if (!prev) return null
        return data.find(t => t.id === prev.id) || prev
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!user || user.role === 'customer') {
      window.location.href = '/login'
      return
    }
  
    loadTickets()
  
    const interval = setInterval(loadTickets, 10000)
  
    return () => clearInterval(interval)
  }, [user, loadTickets])

  useEffect(() => {
    async function loadNotifications() {
      const data = await listNotifications()
      setNotifications(data)
    }
  
    loadNotifications()
  }, [tickets])

  

  async function handleStatusUpdate(ticketId: string, status: string) {
    setUpdating(true)
    try {
      const updated = await updateTicket(ticketId, { status })
      setSelected(updated)
      setTickets(prev => prev.map(t => t.id === ticketId ? updated : t))
    } finally {
      setUpdating(false)
    }
  }

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    urgent: tickets.filter(t => t.priority === 'urgent').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="bg-white border-b border-slate-200 px-8 py-5 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Agent Dashboard</h1>
            <p className="text-slate-500 text-sm mt-1">
              Manage tickets and review AI triage results
            </p>
          </div>

          {/* Notification bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <span className="text-xl">🔔</span>
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-12 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                  <h3 className="font-semibold text-sm text-slate-700">
                    Recent Activity
                  </h3>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs"
                  >
                    Close
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-slate-400 text-sm text-center py-6">
                      No notifications yet
                    </p>
                  ) : (
                    notifications.slice(0, 10).map((n, i) => (
                      <div
                        key={i}
                        className="px-4 py-3 border-b border-slate-100 last:border-0"
                      >
                        <p className="text-sm text-slate-700">{n.message}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(n.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="px-8 py-4 grid grid-cols-4 gap-4">
          <StatCard label="Total Tickets" value={stats.total} color="slate" />
          <StatCard label="Open" value={stats.open} color="blue" />
          <StatCard label="Urgent" value={stats.urgent} color="red" />
          <StatCard label="Resolved" value={stats.resolved} color="green" />
        </div>

        {/* Main content */}
        <div className="flex flex-1 overflow-hidden px-8 pb-8 gap-6">
          {/* Ticket list */}
          <div className="w-80 shrink-0 bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-slate-200">
              <h2 className="font-semibold text-slate-700 text-sm">
                All Tickets ({tickets.length})
              </h2>
            </div>
            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full" />
                </div>
              ) : tickets.map(ticket => (
                <button
                  key={ticket.id}
                  onClick={() => setSelected(ticket)}
                  className={`w-full text-left px-4 py-3 border-b border-slate-100 border-l-4 hover:bg-slate-50 transition-colors ${priorityBorder[ticket.priority] || 'border-l-slate-200'} ${selected?.id === ticket.id ? 'bg-blue-50' : ''}`}
                >
                  <p className="font-medium text-sm text-slate-900 truncate">
                    {ticket.subject}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-400 capitalize">
                      {ticket.status.replace('_', ' ')}
                    </span>
                    {ticket.ai_category && (
                      <span className="text-xs text-blue-500">
                        · {ticket.ai_category}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Ticket detail */}
          <div className="flex-1 bg-white border border-slate-200 rounded-2xl overflow-y-auto">
            {!selected ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <p className="text-4xl mb-3">📋</p>
                <p className="font-medium">Select a ticket</p>
                <p className="text-sm">Click any ticket to view details</p>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {selected.subject}
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">
                    {new Date(selected.created_at).toLocaleString()}
                  </p>
                  <p className="text-slate-600 mt-3 leading-relaxed">
                    {selected.description}
                  </p>
                </div>

                <div className="border border-slate-200 rounded-xl p-4">
                  <h3 className="font-semibold text-slate-700 text-sm mb-3">
                    Update Status
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    {['open', 'in_progress', 'resolved', 'closed'].map(status => (
                      <button
                        key={status}
                        onClick={() => handleStatusUpdate(selected.id, status)}
                        disabled={updating || selected.status === status}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                          selected.status === status
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {status.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-4">
                  <h3 className="font-semibold text-slate-700 text-sm mb-3 flex items-center gap-2">
                    🤖 AI Triage Analysis
                    {!selected.ai_category && (
                      <span className="text-xs text-amber-500 font-normal">
                        Processing...
                      </span>
                    )}
                  </h3>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { label: 'Category', value: selected.ai_category },
                      { label: 'Priority', value: selected.priority },
                      { label: 'Sentiment', value: selected.ai_sentiment },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-slate-50 rounded-lg p-3">
                        <p className="text-slate-400 text-xs mb-1">{label}</p>
                        <p className={`font-semibold text-sm capitalize ${
                          label === 'Sentiment' && value
                            ? sentimentColor[value] || 'text-slate-700'
                            : 'text-slate-700'
                        }`}>
                          {value || '—'}
                        </p>
                      </div>
                    ))}
                  </div>

                  {selected.ai_suggested_reply ? (
                    <div>
                      <p className="text-slate-400 text-xs mb-2">
                        AI Suggested Reply
                      </p>
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-slate-700 leading-relaxed">
                        {selected.ai_suggested_reply}
                      </div>
                    </div>
                  ) : (
                    <p className="text-amber-500 text-sm">
                      ⏳ AI analysis in progress — refresh in a moment
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}