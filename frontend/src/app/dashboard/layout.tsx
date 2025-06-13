'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { auth } from '@/lib/auth'
import { apiClient } from '@/lib/api-client'
import { Navigation } from '@/components/Navigation'
import { LoadingSpinner } from '@/components/LoadingSpinner'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkAuth = async () => {
      // Check if user is authenticated
      if (!auth.isAuthenticated()) {
        router.push('/auth/login')
        return
      }

      // Set auth token for API client
      const token = auth.getToken()
      if (token) {
        apiClient.setAuthToken(token)
      }

      // Verify token is still valid by checking with backend
      try {
        const response = await apiClient.getMe()
        if (!response.success) {
          // Token is invalid, redirect to login
          auth.logout()
          router.push('/auth/login')
          return
        }
      } catch (err) {
        console.error('Auth verification failed:', err)
        // Could be network error, allow user to continue for now
        // In production, you might want to handle this differently
      }

      setIsLoading(false)
    }

    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-base-100">
      <Navigation currentPath={pathname} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
