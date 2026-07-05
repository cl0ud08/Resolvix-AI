'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signup, login } from '@/lib/api'
import { saveToken } from '@/lib/auth'

type Role = 'customer' | 'agent'

export default function SignupPage() {
  const router = useRouter()

  const [form, setForm] = useState<{
    full_name: string
    email: string
    password: string
    role: Role
  }>({
    full_name: '',
    email: '',
    password: '',
    role: 'customer',
  })

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signup(form)

      const res = await login(form.email, form.password)
      saveToken(res.access_token)

      router.replace('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-md">

        <h1 className="mb-2 text-center text-3xl font-bold">
          Create account
        </h1>

        <p className="mb-8 text-center text-gray-400">
          Join Smart Support
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            type="text"
            name="full_name"
            value={form.full_name}
            onChange={handleChange}
            placeholder="Full Name"
            required
            className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white"
          />

          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            required
            className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white"
          />

          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Password"
            required
            className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white"
          />

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-3 text-white font-medium disabled:opacity-60"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>

        </form>

        <p className="mt-6 text-center text-gray-400">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-400">
            Sign in
          </Link>
        </p>

      </div>
    </main>
  )
}