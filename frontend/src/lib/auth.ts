// Authentication utilities
import Cookies from 'js-cookie'
import { User } from '@/types'

const TOKEN_KEY = 'journal-auth-token'
const USER_KEY = 'journal-user'

export const auth = {
  // Token management
  setToken(token: string): void {
    Cookies.set(TOKEN_KEY, token, {
      expires: 7, // 7 days
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    })
  },

  getToken(): string | null {
    return Cookies.get(TOKEN_KEY) || null
  },

  removeToken(): void {
    Cookies.remove(TOKEN_KEY)
  },

  // User management
  setUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  },

  getUser(): User | null {
    if (typeof window === 'undefined') return null
    
    const userStr = localStorage.getItem(USER_KEY)
    if (!userStr) return null
    
    try {
      return JSON.parse(userStr)
    } catch {
      return null
    }
  },

  removeUser(): void {
    localStorage.removeItem(USER_KEY)
  },

  // Combined operations
  login(user: User, token: string): void {
    this.setUser(user)
    this.setToken(token)
  },

  logout(): void {
    this.removeUser()
    this.removeToken()
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!(this.getToken() && this.getUser())
  }
}

export default auth
