import { getToken } from './auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Central fetch wrapper — adds auth header automatically and handles
// non-OK responses consistently. Every API call goes through here
// so we only write error handling logic once.
async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(error.detail || `HTTP ${res.status}`)
  }

  return res.json()
}

// ── Auth ──────────────────────────────────────────────────────
export interface SignupPayload {
  email: string
  password: string
  full_name: string
  role: 'customer' | 'agent'
}

export interface LoginResponse {
  access_token: string
  token_type: string
}

export async function signup(payload: SignupPayload) {
  return request<{ id: string; email: string; role: string }>(
    '/api/auth/signup',
    { method: 'POST', body: JSON.stringify(payload) }
  )
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

// ── Tickets ───────────────────────────────────────────────────
export interface Ticket {
  id: string
  customer_id: string
  subject: string
  description: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  ai_category: string | null
  ai_sentiment: string | null
  ai_suggested_reply: string | null
  sla_minutes: number
  created_at: string
  updated_at: string
}

export async function createTicket(subject: string, description: string): Promise<Ticket> {
  return request<Ticket>('/api/tickets', {
    method: 'POST',
    body: JSON.stringify({ subject, description }),
  })
}

export async function listTickets(): Promise<Ticket[]> {
  return request<Ticket[]>('/api/tickets')
}

export async function getTicket(id: string): Promise<Ticket> {
  return request<Ticket>(`/api/tickets/${id}`)
}

export async function updateTicket(
  id: string,
  payload: { status?: string; priority?: string }
): Promise<Ticket> {
  return request<Ticket>(`/api/tickets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

// ── Notifications ─────────────────────────────────────────────
export interface Notification {
  event_type: string
  ticket_id: string
  message: string
  timestamp: string
}

export async function listNotifications(): Promise<Notification[]> {
  return request<Notification[]>('/api/notifications')
}