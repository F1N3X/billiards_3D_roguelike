import { API_BASE_URL } from '../config/constants'
import type { AuthUser } from '../types/user'
import type { LeaderboardEntry, PlayerStats, GameMode } from '../types/game'

async function request<T>(path: string, options?: RequestInit, token?: string): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers,
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { message?: string }
    throw new Error(body.message ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

export function startGameSession(gameMode: GameMode, token: string): Promise<{ sessionId: string }> {
  return request<{ sessionId: string }>('/game-sessions/start', {
    method: 'POST',
    body: JSON.stringify({ gameMode }),
  }, token)
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const data = await request<{ user: Omit<AuthUser, 'token'>; token: string }>('/users/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  return { ...data.user, token: data.token }
}

export async function register(pseudo: string, email: string, password: string): Promise<AuthUser> {
  await request<Omit<AuthUser, 'token'>>('/users', {
    method: 'POST',
    body: JSON.stringify({ pseudo, email, password }),
  })
  const logged = await login(email, password)
  return logged
}

export function updatePseudo(userId: string, pseudo: string, token: string): Promise<Omit<AuthUser, 'token'>> {
  return request<Omit<AuthUser, 'token'>>(`/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify({ pseudo }),
  }, token)
}

export function saveGameHistory(userId: string, gameMode: GameMode, score: number, shots: number, token: string, sessionId: string): Promise<void> {
  return request<void>('/game-history', {
    method: 'POST',
    body: JSON.stringify({ sessionId, userId, gameMode, score, shots }),
  }, token)
}

export function fetchLeaderboard(gameMode: GameMode): Promise<LeaderboardEntry[]> {
  return request<LeaderboardEntry[]>(`/game-history/leaderboard/${gameMode}`)
}

export function fetchPlayerStats(userId: string, gameMode: GameMode): Promise<PlayerStats | null> {
  return request<PlayerStats | null>(`/game-history/stats/${userId}/${gameMode}`)
}
