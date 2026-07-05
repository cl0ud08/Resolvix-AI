export interface User {
  id: string
  email: string
  full_name: string
  role: 'customer' | 'agent' | 'admin'
}

export function saveToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('access_token', token)
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('access_token')
}

export function removeToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('access_token')
}

export function isLoggedIn(): boolean {
  return !!getToken()
}

export function getUserFromToken(): User | null {
  const token = getToken()
  if (!token) return null

  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return {
      id: payload.sub,
      email: payload.email || '',
      full_name: payload.full_name || '',
      role: payload.role,
    }
  } catch {
    return null
  }
}

export function logout(): void {
  if (typeof window === 'undefined') return
  removeToken()
  window.location.href = '/login'
}