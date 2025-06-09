"use client"

import { ReactNode, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: ReactNode
}

const publicRoutes = ['/login', '/register', '/forgot-password']

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  
  useEffect(() => {
    if (!isLoading) {
      // If not authenticated and trying to access a protected route
      if (!isAuthenticated && !publicRoutes.includes(pathname)) {
        router.push('/login')
      }
      
      // If authenticated and trying to access auth routes
      if (isAuthenticated && publicRoutes.includes(pathname)) {
        router.push('/')
      }
    }
  }, [isAuthenticated, isLoading, pathname, router])

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-500 mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }
  
  // If it's a public route or user is authenticated for protected route
  if (publicRoutes.includes(pathname) || isAuthenticated) {
    return <>{children}</>
  }
  
  // Don't render anything while redirecting
  return null
}
