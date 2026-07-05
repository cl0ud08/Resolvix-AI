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
  const router = useRouter()
  const params = useParams()

  const id = Array.isArray(params?.id) ? params.id[0] : params?.id

  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)

  // AUTH CHECK
  useEffect(() => {
    const user = getUserFromToken()

    if (!user) {
      router.replace('/login')
    }
  }, [router])

  // FETCH TICKET
  useEffect(() => {
    if (!id) return

    async function loadTicket() {
      try {
        const data = await getTicket(id)
        setTicket(data)
      } catch {
        router.replace('/dashboard')
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

      {/* NAV */}
      <nav className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
        <span className="text-lg font-bold">Smart Support</span>

        <button
          onClick={() => router.push('/dashboard')}
          className="text-sm text-gray-400 hover:text-white"
        >
          ← Back
        </button>
      </nav>

      <div className="mx-auto max-w-3xl space-y-6 p-6">

        {/* TICKET */}
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
          <h1 className="mb-1 text-xl font-bold">
            {ticket.subject}
          </h1>

          <p className="mb-4 text-sm text-gray-400">
            {new Date(ticket.created_at).toLocaleString()}
          </p>

          <p className="text-gray-300">
            {ticket.description}
          </p>
        </div>

        {/* META */}
        <div className="grid grid-cols-3 gap-4">

          <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
            <p className="text-xs text-gray-500">Status</p>
            <p className="font-medium capitalize">{ticket.status}</p>
          </div>

          <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
            <p className="text-xs text-gray-500">Priority</p>
            <p className="font-medium capitalize">{ticket.priority}</p>
          </div>

          <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
            <p className="text-xs text-gray-500">Category</p>
            <p className="font-medium">
              {ticket.ai_category || '—'}
            </p>
          </div>

        </div>

        {/* AI SECTION */}
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">

          <h2 className="mb-4 font-semibold flex items-center gap-2">
            🤖 AI Analysis

            {!aiReady && (
              <span className="text-xs text-yellow-400">
                Processing...
              </span>
            )}
          </h2>

          {aiReady ? (
            <div className="space-y-4">

              <div>
                <p className="text-xs text-gray-500 mb-1">
                  Sentiment
                </p>
                <SentimentBadge sentiment={ticket.ai_sentiment} />
              </div>

              {ticket.ai_suggested_reply && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">
                    Suggested Reply
                  </p>

                  <p className="bg-gray-800 p-3 rounded text-sm text-gray-300">
                    {ticket.ai_suggested_reply}
                  </p>
                </div>
              )}

            </div>
          ) : (
            <p className="text-sm text-gray-500">
              AI is analyzing this ticket. Please refresh shortly.
            </p>
          )}

        </div>

      </div>
    </div>
  )
}