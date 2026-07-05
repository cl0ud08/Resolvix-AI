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

  useEffect(() => {
    const user = getUserFromToken()

    if (!user) {
      window.location.href = '/login'
      return
    }

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

    loadTicket()
  }, [id, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-400">Loading ticket...</p>
      </div>
    )
  }

  if (!ticket) return null

  const aiReady = ticket.ai_category || ticket.ai_suggested_reply

  return (
    <div className="min-h-screen">
      <nav className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
        <span className="text-lg font-bold">Smart Support</span>

        <button
          onClick={() => router.back()}
          className="text-sm text-gray-400 transition-colors hover:text-white"
        >
          ← Back
        </button>
      </nav>

      <div className="mx-auto max-w-3xl space-y-6 p-6">
        {/* Ticket */}
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
          <h1 className="mb-1 text-xl font-bold">{ticket.subject}</h1>

          <p className="mb-4 text-sm text-gray-400">
            {new Date(ticket.created_at).toLocaleString()}
          </p>

          <p className="text-gray-300">{ticket.description}</p>
        </div>

        {/* Status */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Status', value: ticket.status },
            { label: 'Priority', value: ticket.priority },
            { label: 'Category', value: ticket.ai_category || '—' },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-lg border border-gray-800 bg-gray-900 p-4"
            >
              <p className="mb-1 text-xs text-gray-500">{label}</p>

              <p className="font-medium capitalize">{value}</p>
            </div>
          ))}
        </div>

        {/* AI */}
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
          <h2 className="mb-4 flex items-center gap-2 font-semibold">
            🤖 AI Analysis

            {!aiReady && (
              <span className="text-xs font-normal text-yellow-400">
                Processing... (refresh in a moment)
              </span>
            )}
          </h2>

          {aiReady ? (
            <div className="space-y-4">
              <div>
                <p className="mb-1 text-xs text-gray-500">Sentiment</p>

                <SentimentBadge sentiment={ticket.ai_sentiment} />
              </div>

              {ticket.ai_suggested_reply && (
                <div>
                  <p className="mb-1 text-xs text-gray-500">
                    Suggested Reply
                  </p>

                  <p className="rounded-lg bg-gray-800 p-3 text-sm leading-relaxed text-gray-300">
                    {ticket.ai_suggested_reply}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              AI is analyzing this ticket in the background. Refresh the page
              in a few seconds to see the results.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}