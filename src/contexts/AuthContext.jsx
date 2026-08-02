import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithRedirect, getRedirectResult, signOut } from 'firebase/auth'
import { auth, googleProvider } from '../firebase'

const AuthContext = createContext(null)

const CACHE_KEY = 'trip_planner_user'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      return cached ? JSON.parse(cached) : undefined
    } catch {
      return undefined
    }
  })

  useEffect(() => {
    getRedirectResult(auth).catch(() => {})
    return onAuthStateChanged(auth, (u) => {
      setUser(u)
      if (u) {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ uid: u.uid, displayName: u.displayName, email: u.email, photoURL: u.photoURL }))
      } else {
        localStorage.removeItem(CACHE_KEY)
      }
    })
  }, [])

  const loginWithGoogle = () => signInWithRedirect(auth, googleProvider)
  const logout = () => signOut(auth)

  return (
    <AuthContext.Provider value={{ user, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
