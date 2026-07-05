'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signup, login } from '@/lib/api'
import { saveToken } from '@/lib/auth'

export default function SignupPage() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'customer' as 'customer' | 'agent',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signup(form)
      // Auto-login after signup
      const res = await login(form.email, form.password)
      saveToken(res.access_token)
      window.location.href = form.role === 'customer' ? '/dashboard' : '/agent'
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-2 text-center">Create account</h1>
        <p className="text-gray-400 text-center mb-8">
          Join Smart Support
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">
              Full Name
            </label>
            <input
              type="text"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
              placeholder="Harshit Gupta"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">
              I am a...
            </label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
            >
              <option value="customer">Customer</option>
              <option value="agent">Support Agent</option>
            </select>
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-950 border border-red-800 rounded-lg px-4 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-gray-400 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-400 hover:text-blue-300">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}