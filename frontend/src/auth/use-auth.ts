import { useContext } from 'react'
import { AuthContext } from './auth-context-def'
import type { AuthContextValue } from './auth-context-def'

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
