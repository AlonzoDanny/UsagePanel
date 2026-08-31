import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { env } from '../config/env'
import { getCurrentUser, signOut as endSession } from '../services/authService'
import type { Profile } from '../types/auth'

interface AuthContextValue {
  user: Profile | null
  profile: Profile | null
  isLoading: boolean
  isConfigured: boolean
  signOut: () => Promise<void>
}
const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(() => env.isApiConfigured)
  useEffect(() => {
    if (!env.isApiConfigured) return
    getCurrentUser()
      .then(setProfile)
      .finally(() => setIsLoading(false))
  }, [])
  async function signOut() {
    await endSession()
    setProfile(null)
  }
  return (
    <AuthContext.Provider
      value={{
        user: profile,
        profile,
        isLoading,
        isConfigured: env.isApiConfigured,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider.')
  return context
}
