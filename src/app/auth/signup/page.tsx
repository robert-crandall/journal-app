'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signUpSchema, type SignUpInput } from '@/lib/schemas'
import { trpc } from '@/lib/trpc/client'
import { UserPlus, Mail, Lock, User, Eye, EyeOff } from 'lucide-react'

export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
  })

  const signUpMutation = trpc.auth.signUp.useMutation({
    onSuccess: async (data) => {
      // Auto sign in after successful registration
      const result = await signIn('credentials', {
        email: data.user.email,
        password: '', // We can't pass the password here for security
        redirect: false,
      })

      if (result?.ok) {
        router.push('/')
        router.refresh()
      } else {
        router.push('/auth/signin')
      }
    },
    onError: (error) => {
      setError(error.message)
    },
  })

  const onSubmit = (data: SignUpInput) => {
    setError('')
    signUpMutation.mutate(data)
  }

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="card w-full max-w-md bg-base-100 shadow-2xl">
        <div className="card-body">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-primary mb-2">Join the Adventure</h1>
            <p className="text-base-content/70">Create your account to start your RPG journey</p>
          </div>

          {error && (
            <div className="alert alert-error mb-4">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="form-control">
              <label className="label" htmlFor="name">
                <span className="label-text font-medium">Name</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-base-content/40" />
                <input
                  id="name"
                  type="text"
                  placeholder="Enter your name"
                  className={`input input-bordered w-full pl-10 transition-all duration-200 focus:scale-[1.02] ${
                    errors.name ? 'input-error' : 'focus:input-primary'
                  }`}
                  {...register('name')}
                />
              </div>
              {errors.name && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.name.message}</span>
                </label>
              )}
            </div>

            <div className="form-control">
              <label className="label" htmlFor="email">
                <span className="label-text font-medium">Email</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-base-content/40" />
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className={`input input-bordered w-full pl-10 transition-all duration-200 focus:scale-[1.02] ${
                    errors.email ? 'input-error' : 'focus:input-primary'
                  }`}
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.email.message}</span>
                </label>
              )}
            </div>

            <div className="form-control">
              <label className="label" htmlFor="password">
                <span className="label-text font-medium">Password</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-base-content/40" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  className={`input input-bordered w-full pl-10 pr-10 transition-all duration-200 focus:scale-[1.02] ${
                    errors.password ? 'input-error' : 'focus:input-primary'
                  }`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-base-content/40 hover:text-base-content"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.password.message}</span>
                </label>
              )}
              <label className="label">
                <span className="label-text-alt text-xs opacity-60">
                  Must be at least 8 characters long
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={signUpMutation.isPending}
              className="btn btn-primary w-full gap-2 mt-6 transition-all duration-200 hover:scale-105"
            >
              {signUpMutation.isPending ? (
                <>
                  <div className="loading loading-spinner loading-sm" />
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus size={20} />
                  Create Account
                </>
              )}
            </button>
          </form>

          <div className="divider">or</div>

          <div className="text-center">
            <p className="text-base-content/70">
              Already have an account?{' '}
              <Link href="/auth/signin" className="link link-primary font-medium">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
