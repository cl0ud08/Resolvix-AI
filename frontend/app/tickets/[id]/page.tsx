'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getTicket, Ticket } from '@/lib/api'
import { getUserFromToken } from '@/lib/auth'

function SentimentBadge({ sentiment }: { sentiment: string | null }) {
  if (!sentiment) return null
  const colors: Record<string, string> = {
    positive: 'text-green-400',
    neutral: 'text-yellow-400',
    negative: 'text-red-400',
  }
  return (
    <span className={`font-medium ${colors[sentiment] || 'text-gray-400'}`}>
      {sentiment}
    </span>
  )
}

export default function TicketDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const user = getUserFromToken()

  useEffect(() => {
    if (!user) {
      window.location.href = '/login'
      return
    }
    loadTicket()
  }, [])

  async function loadTicket() {
    try {
      const data = await getTicket(id as string)
      setTicket(data)
    } catch {
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400">Loading ticket...</p>
    </div>
  )

  if (!ticket) return null

  const aiReady = ticket.ai_category || ticket.ai_suggested_reply

  return (
    <div className="min-h-screen">
      <nav className="border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <span className="font-bold text-lg">Smart Support</span>
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white text-sm transition-colors"
        >
          ← Back
        </button>
      </nav>

      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Ticket header */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h1 className="text-xl font-bold mb-1">{ticket.subject}</h1>
          <p className="text-gray-400 text-sm mb-4">
            {new Date(ticket.created_at).toLocaleString()}
          </p>
          <p className="text-gray-300">{ticket.description}</p>
        </div>

        {/* Status row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Status', value: ticket.status },
            { label: 'Priority', value: ticket.priority },
            { label: 'Category', value: ticket.ai_category || '—' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-gray-500 text-xs mb-1">{label}</p>
              <p className="font-medium capitalize">{value}</p>
            </div>
          ))}
        </div>

        {/* AI Analysis section */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            🤖 AI Analysis
            {!aiReady && (
              <span className="text-xs text-yellow-400 font-normal">
                Processing... (refresh in a moment)
              </span>
            )}
          </h2>

          {aiReady ? (
            <div className="space-y-4">
              <div>
                <p className="text-gray-500 text-xs mb-1">Sentiment</p>
                <SentimentBadge sentiment={ticket.ai_sentiment} />
              </div>
              {ticket.ai_suggested_reply && (
                <div>
                  <p className="text-gray-500 text-xs mb-1">Suggested Reply</p>
                  <p className="text-gray-300 bg-gray-800 rounded-lg p-3 text-sm leading-relaxed">
                    {ticket.ai_suggested_reply}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">
              AI is analyzing this ticket in the background.
              Refresh the page in a few seconds to see the results.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}