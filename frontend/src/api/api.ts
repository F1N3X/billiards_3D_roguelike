import { API_BASE_URL } from '../config/constants'
import type { AuthUser } from '../types/user'
import type { LeaderboardEntry, PlayerStats, GameMode } from '../types/game'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { message?: string }
    throw new Error(body.message ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

export function login(email: string, password: string): Promise<AuthUser> {
  return request<AuthUser>('/users/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function register(pseudo: string, email: string, password: string): Promise<AuthUser> {
  return request<AuthUser>('/users', {
    method: 'POST',
    body: JSON.stringify({ pseudo, email, password }),
  })
}

export function updatePseudo(userId: string, pseudo: string): Promise<AuthUser> {
  return request<AuthUser>(`/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify({ pseudo }),
  })
}

export function saveGameHistory(userId: string, score: number, shots: number): Promise<void> {
  return request<void>('/game-history', {
    method: 'POST',
    body: JSON.stringify({ userId, gameMode: 'classic', score, shots }),
  })
}

export function fetchLeaderboard(gameMode: GameMode): Promise<LeaderboardEntry[]> {
  return request<LeaderboardEntry[]>(`/game-history/leaderboard/${gameMode}`)
}

export function fetchPlayerStats(userId: string, gameMode: GameMode): Promise<PlayerStats | null> {
  return request<PlayerStats | null>(`/game-history/stats/${userId}/${gameMode}`)
}
