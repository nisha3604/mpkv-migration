import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

/**
 * AuthProvider — unified for all user types.
 * Candidate (91), College (61), Admin (11/12) all share the same login flow.
 * user.userTypeID and user.dashBoardPath drive role-based routing.
 */
export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [token,   setToken]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedToken = localStorage.getItem('mpkv_token')
    const savedUser  = localStorage.getItem('mpkv_user')
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const login = (tokenValue, userValue) => {
    setToken(tokenValue)
    setUser(userValue)
    localStorage.setItem('mpkv_token', tokenValue)
    localStorage.setItem('mpkv_user',  JSON.stringify(userValue))
  }

  const updateUser = (fields) => {
    setUser(prev => {
      const updated = { ...prev, ...fields }
      localStorage.setItem('mpkv_user', JSON.stringify(updated))
      return updated
    })
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('mpkv_token')
    localStorage.removeItem('mpkv_user')
    sessionStorage.clear()
  }

  // Helpers
  const isCandidate = user?.userTypeID === 91
  const isCollege   = user?.userTypeID === 61
  const isAdmin     = user?.userTypeID === 11 || user?.userTypeID === 12

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      login, logout, updateUser,
      isLoggedIn: !!token,
      isCandidate, isCollege, isAdmin
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
