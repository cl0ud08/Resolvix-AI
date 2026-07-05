'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createTicket } from '@/lib/api'
import { getUserFromToken } from '@/lib/auth'

export default function NewTicketPage() {
  const router = useRouter()

  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const user = getUserFromToken()
    if (!user) {
      router.replace('/login')
    }
  }, [router])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const ticket = await createTicket(subject, description)
      router.replace(`/tickets/${ticket.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create ticket')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <nav className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
        <span className="text-lg font-bold">Smart Support</span>
        <button
          onClick={() => router.push('/dashboard')}
          className="text-sm text-gray-400 hover:text-white"
        >
          ← Back
        </button>
      </nav>

      <div className="mx-auto max-w-2xl p-6">
        <h1 className="mb-6 text-xl font-bold">Create new ticket</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            required
            className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white"
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your issue"
            required
            rows={6}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white"
          />

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-3 text-white font-medium disabled:opacity-60"
          >
            {loading ? 'Creating...' : 'Create ticket'}
          </button>
        </form>
      </div>
    </div>
  )
}