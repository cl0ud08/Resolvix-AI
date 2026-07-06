'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getTicket, Ticket } from '@/lib/api'
import { getUserFromToken } from '@/lib/auth'
import MessageThread from '@/components/MessageThread'

function SentimentBadge({ sentiment }: { sentiment: string | null }) {
  if (!sentiment) return null

  const colors: Record<string, string> = {
    positive: 'bg-green-500/10 text-green-400',
    neutral: 'bg-yellow-500/10 text-yellow-400',
    negative: 'bg-red-500/10 text-red-400',
  }

  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
        colors[sentiment] || 'bg-gray-500/10 text-gray-400'
      }`}
    >
      {sentiment}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    open: 'bg-blue-500/10 text-blue-400',
    in_progress: 'bg-purple-500/10 text-purple-400',
    resolved: 'bg-green-500/10 text-green-400',
    closed: 'bg-gray-500/10 text-gray-400',
  }

  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
        colors[status] || 'bg-gray-500/10 text-gray-400'
      }`}
    >
      {status.replace('_', ' ')}
    </span>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    urgent: 'bg-red-500/10 text-red-400',
    high: 'bg-orange-500/10 text-orange-400',
    medium: 'bg-amber-500/10 text-amber-400',
    low: 'bg-gray-500/10 text-gray-400',
  }

  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
        colors[priority] || 'bg-gray-500/10 text-gray-400'
      }`}
    >
      {priority}
    </span>
  )
}

function CategoryBadge({ category }: { category: string | null }) {
  if (!category) {
    return <span className="text-sm text-gray-500">—</span>
  }

  return (
    <span className="inline-block rounded-full bg-indigo-500/10 px-2.5 py-1 text-xs font-medium capitalize text-indigo-400">
      {category}
    </span>
  )
}

export default function TicketDetailPage() {
  const params = useParams()
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id

  const router = useRouter()

  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const user = getUserFromToken()

    if (!user) {
      router.replace('/login')
      return
    }

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
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <p className="text-gray-400">Loading ticket...</p>
      </div>
    )
  }

  if (!ticket) return null

  const aiReady = ticket.ai_category || ticket.ai_suggested_reply

  return (
    <div className="min-h-screen bg-gray-950">
      <nav className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
        <span className="text-lg font-bold text-white">Smart Support</span>

        <button
          onClick={() => router.push('/dashboard')}
          className="text-sm text-gray-400 transition-colors hover:text-white"
        >
          ← Back
        </button>
      </nav>

      <div className="mx-auto max-w-3xl space-y-6 p-6">
        {/* Ticket */}
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
          <h1 className="mb-1 text-xl font-bold text-white">{ticket.subject}</h1>

          <p className="mb-4 text-sm text-gray-400">
            {new Date(ticket.created_at).toLocaleString()}
          </p>

          <p className="text-gray-300">{ticket.description}</p>
        </div>

        {/* Status / Priority / Category */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
            <p className="mb-2 text-xs text-gray-500">Status</p>
            <StatusBadge status={ticket.status} />
          </div>

          <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
            <p className="mb-2 text-xs text-gray-500">Priority</p>
            <PriorityBadge priority={ticket.priority} />
          </div>

          <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
            <p className="mb-2 text-xs text-gray-500">Category</p>
            <CategoryBadge category={ticket.ai_category} />
          </div>
        </div>

        {/* AI */}
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-white">
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
                <p className="mb-2 text-xs text-gray-500">Sentiment</p>
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

        <MessageThread ticketId={ticket.id} />
      </div>
    </div>
  )
}