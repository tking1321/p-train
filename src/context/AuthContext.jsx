import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { IS_TRAINER } from '../lib/theme'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedTheme = localStorage.getItem('ptrain_theme')
    applyTheme(savedTheme || 'dark')

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setUser(session.user)
          await fetchProfile(session.user.id)
        }
      } catch (error) {
        console.error('Auth init error:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        await fetchProfile(session.user.id)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
      }
    })

    return () => { subscription.unsubscribe() }
  }, [])

  function applyTheme(theme) {
    if (theme === 'light') {
      document.documentElement.classList.remove('dark')
      document.documentElement.classList.add('light')
    } else {
      document.documentElement.classList.remove('light')
      document.documentElement.classList.add('dark')
    }
  }

  const fetchProfile = async (userId) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      if (data) setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      setUser(data.user)
      await fetchProfile(data.user.id)
      return { success: true, user: data.user }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const signup = async ({ name, email, password, role }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { name, role } },
      })
      if (error) throw error

      if (data.user) {
        setUser(data.user)
        const avatarSeed = encodeURIComponent(name)
        const profileData = {
          id: data.user.id,
          email,
          name,
          display_name: name,
          role,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`,
        }

        const { error: profileError } = await supabase
          .from('profiles')
          .insert(profileData)
        if (profileError) console.error('Profile insert error:', profileError)

        if (IS_TRAINER(role)) {
          const { error: tpError } = await supabase
            .from('trainer_profiles')
            .insert({
              user_id: data.user.id,
              trainer_type: role === 'trainer_business' ? 'business' : 'individual',
              onboarding_step: 1,
            })
          if (tpError) console.error('Trainer profile insert error:', tpError)
        }

        await fetchProfile(data.user.id)
      }
      return { success: true, user: data.user }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const updateProfile = async (updates) => {
    if (!user) return { success: false, error: 'Not authenticated' }
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
      if (error) throw error
      await fetchProfile(user.id)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const setTheme = (theme) => {
    localStorage.setItem('ptrain_theme', theme)
    applyTheme(theme)
  }

  const value = {
    user,
    profile,
    loading,
    login,
    signup,
    logout,
    resetPassword,
    updateProfile,
    refreshProfile: () => profile && fetchProfile(user?.id),
    setTheme,
    isTrainer: profile ? IS_TRAINER(profile.role) : false,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
