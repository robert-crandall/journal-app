'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { BookOpen, Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { auth } from '@/lib/auth'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorMessage } from '@/components/ErrorMessage'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await apiClient.login(data)
      
      if (response.success && response.data) {
        auth.login(response.data.user, response.data.token)
        apiClient.setAuthToken(response.data.token)
        router.push('/dashboard')
      } else {
        setError(response.error || 'Login failed')
      }
    } catch (err) {
      setError('Unable to connect to the server. Please try again.')
      console.error('Login error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-100 to-base-200 flex items-center justify-center p-4">
      <div className="card w-full max-w-sm sm:max-w-md bg-base-100 shadow-xl animate-scale-in">
        <div className="card-body p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <span className="text-xl sm:text-2xl font-bold">Journal</span>
            </div>
            <h1 className="text-lg sm:text-xl font-semibold text-base-content">Welcome Back</h1>
            <p className="text-sm sm:text-base text-base-content/60">Sign in to continue your growth journey</p>
          </div>

          {/* Error Message */}
          {error && (
            <ErrorMessage 
              message={error} 
              onRetry={() => setError(null)}
              className="mb-4"
            />
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Field */}
            <div className="form-control">
              <label className="label">
                <span className="label-text text-sm sm:text-base">Email</span>
              </label>
              <div className="relative">
                <input
                  {...register('email')}
                  type="email"
                  placeholder="Enter your email"
                  className={`input input-bordered w-full pl-10 text-sm sm:text-base ${errors.email ? 'input-error' : ''}`}
                  disabled={isLoading}
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-base-content/40" />
              </div>
              {errors.email && (
                <label className="label">
                  <span className="label-text-alt text-error text-xs">{errors.email.message}</span>
                </label>
              )}
            </div>

            {/* Password Field */}
            <div className="form-control">
              <label className="label">
                <span className="label-text text-sm sm:text-base">Password</span>
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className={`input input-bordered w-full pl-10 pr-10 text-sm sm:text-base ${errors.password ? 'input-error' : ''}`}
                  disabled={isLoading}
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-base-content/40" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-base-content/40 hover:text-base-content"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <label className="label">
                  <span className="label-text-alt text-error text-xs">{errors.password.message}</span>
                </label>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={isLoading}
            >
              {isLoading ? <LoadingSpinner size="sm" /> : 'Sign In'}
            </button>
          </form>

          {/* Footer Links */}
          <div className="divider text-xs">or</div>
          
          <div className="text-center space-y-2">
            <p className="text-sm text-base-content/60">
              Don't have an account?{' '}
              <Link href="/auth/register" className="link link-primary">
                Sign up
              </Link>
            </p>
            <Link href="/" className="link link-neutral text-xs">
              ← Back to homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
