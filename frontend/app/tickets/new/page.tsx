'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createTicket } from '@/lib/api'
import { getUserFromToken } from '@/lib/auth'

export default function NewTicketPage() {
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const user = getUserFromToken()

  if (!user) {
    if (typeof window !== 'undefined') window.location.href = '/login'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const ticket = await createTicket(subject, description)
      router.push(`/tickets/${ticket.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create ticket')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <nav className="border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <span className="font-bold text-lg">Smart Support</span>
        <span className="text-gray-400 text-sm">{user.email}</span>
      </nav>

      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Submit a Ticket</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              required
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
              placeholder="Brief summary of your issue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">
              Description
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
              rows={6}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white resize-none"
              placeholder="Describe your issue in detail..."
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-950 border border-red-800 rounded-lg px-4 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
            >
              {loading ? 'Submitting...' : 'Submit Ticket'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-600 hover:border-gray-400 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}