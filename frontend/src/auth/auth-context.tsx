import { useState, useCallback, type ReactNode } from 'react'
import { AuthContext } from './auth-context-def'
import type { AuthContextValue } from './auth-context-def'
import type { AuthUser } from '../types/user'

const STORAGE_KEY = 'billiards_user'

function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const user = JSON.parse(raw) as AuthUser
    if (!user.token) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return user
  } catch (e) {
    console.error('[auth-context] loadUser: token parse error', e)
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadUser)

  const signIn = useCallback((u: AuthUser) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
    setUser(u)
  }, [])

  const signOut = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }, [])

  const updateUser = useCallback((u: AuthUser) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
    setUser(u)
  }, [])

  const value: AuthContextValue = { user, signIn, signOut, updateUser }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
