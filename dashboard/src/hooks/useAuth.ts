import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { User } from '../types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  })

  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        setAuthState(prev => ({ ...prev, isLoading: false }))
        return
      }

      const response = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })

      setAuthState({
        user: response.data,
        isAuthenticated: true,
        isLoading: false,
        error: null
      })
    } catch (error) {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: '認証に失敗しました'
      })
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const login = useCallback(async () => {
    try {
      // OAuth認証フローを開始
      window.location.href = '/api/auth/github/authorize'
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        error: 'ログインに失敗しました'
      }))
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      localStorage.removeItem('auth_token')
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      })
    } catch (error) {
      console.error('ログアウトエラー:', error)
    }
  }, [])

  return {
    ...authState,
    login,
    logout,
    checkAuth
  }
}