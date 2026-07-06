'use client'

import { useEffect, useState } from 'react'
import { getToken } from '@/lib/auth'

interface TicketMessage {
  id: string
  ticket_id: string
  sender_type: 'customer' | 'agent' | 'ai'
  sender_id: string | null
  message: string
  created_at: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function fetchMessages(ticketId: string): Promise<TicketMessage[]> {
  const token = getToken()
  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/messages`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to load messages')
  return res.json()
}

async function sendMessage(ticketId: string, message: string): Promise<TicketMessage> {
  const token = getToken()
  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message }),
  })
  if (!res.ok) throw new Error('Failed to send message')
  return res.json()
}

const senderLabel: Record<string, string> = {
  customer: 'You',
  agent: 'Support Agent',
  ai: 'AI Assistant',
}

const senderColor: Record<string, string> = {
  customer: 'bg-blue-600',
  agent: 'bg-green-600',
  ai: 'bg-purple-600',
}

export default function MessageThread({ ticketId }: { ticketId: string }) {
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchMessages(ticketId)
      .then(setMessages)
      .catch(() => setError('Could not load messages'))
      .finally(() => setLoading(false))
  }, [ticketId])

  async function handleSend() {
    if (!draft.trim()) return

    setSending(true)
    setError('')

    try {
      const msg = await sendMessage(ticketId, draft.trim())
      setMessages((prev) => [...prev, msg])
      setDraft('')
    } catch {
      setError('Failed to send message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
      <h2 className="mb-4 font-semibold text-white">Conversation</h2>

      {loading ? (
        <p className="text-sm text-gray-500">Loading messages...</p>
      ) : messages.length === 0 ? (
        <p className="text-sm text-gray-500">No messages yet. Start the conversation below.</p>
      ) : (
        <div className="mb-4 space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className="rounded-lg bg-gray-800 p-3">
              <div className="mb-1 flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium text-white ${
                    senderColor[msg.sender_type] || 'bg-gray-600'
                  }`}
                >
                  {senderLabel[msg.sender_type] || msg.sender_type}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(msg.created_at).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-gray-300">{msg.message}</p>
            </div>
          ))}
        </div>
      )}

      {error && <p className="mb-2 text-sm text-red-400">{error}</p>}

      <div className="flex gap-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message..."
          rows={2}
          className="flex-1 rounded-lg border border-gray-700 bg-gray-800 p-2 text-sm text-white"
        />
        <button
          onClick={handleSend}
          disabled={sending || !draft.trim()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  )
}