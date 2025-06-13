'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, ArrowRight, FlaskConical, TrendingUp, Sparkles } from 'lucide-react'
import { auth } from '@/lib/auth'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to dashboard if already authenticated
    if (auth.isAuthenticated()) {
      router.push('/dashboard')
    }
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-100 to-base-200">
      {/* Header */}
      <header className="navbar bg-base-100/80 backdrop-blur-sm border-b border-base-200 px-4 sm:px-6 lg:px-8">
        <div className="navbar-start">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            <span className="text-lg sm:text-xl font-bold">Journal</span>
          </div>
        </div>
        <div className="navbar-end space-x-2">
          <Link href="/auth/login" className="btn btn-ghost btn-sm sm:btn-md">
            Login
          </Link>
          <Link href="/auth/register" className="btn btn-primary btn-sm sm:btn-md">
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container-responsive py-8 sm:py-16">
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-base-content mb-4 sm:mb-6 leading-tight">
            Understand Your{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              Personal Growth
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-base-content/70 mb-6 sm:mb-8 max-w-3xl mx-auto px-4">
            A conversational journal powered by AI that helps you discover whether your self-experiments 
            are actually improving your life. Built for structured reflection and deep insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <Link href="/auth/register" className="btn btn-primary btn-lg">
              Start Your Journey
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
            <Link href="/auth/login" className="btn btn-outline btn-lg">
              Login
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid-responsive-1-3 mb-12 sm:mb-16">
          <div className="card bg-base-100 shadow-lg animate-fade-in">
            <div className="card-body text-center p-6">
              <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              </div>
              <h3 className="card-title justify-center text-lg sm:text-xl">Conversational Journal</h3>
              <p className="text-base-content/70 text-sm sm:text-base">
                AI-powered conversations that guide you to deeper reflection and uncover patterns in your daily experiences.
              </p>
            </div>
          </div>

          <div className="card bg-base-100 shadow-lg animate-fade-in">
            <div className="card-body text-center p-6">
              <div className="mx-auto mb-4 p-3 bg-secondary/10 rounded-full w-fit">
                <FlaskConical className="h-6 w-6 sm:h-8 sm:w-8 text-secondary" />
              </div>
              <h3 className="card-title justify-center text-lg sm:text-xl">Self-Experiments</h3>
              <p className="text-base-content/70 text-sm sm:text-base">
                Track structured lifestyle experiments with daily tasks and see how they correlate with your mood and growth.
              </p>
            </div>
          </div>

          <div className="card bg-base-100 shadow-lg animate-fade-in">
            <div className="card-body text-center p-6">
              <div className="mx-auto mb-4 p-3 bg-accent/10 rounded-full w-fit">
                <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-accent" />
              </div>
              <h3 className="card-title justify-center text-lg sm:text-xl">Character Stats</h3>
              <p className="text-base-content/70 text-sm sm:text-base">
                Gamify your personal development with RPG-inspired stats that grow based on your real actions and reflections.
              </p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">How It Works</h2>
          <div className="steps steps-vertical lg:steps-horizontal w-full">
            <div className="step step-primary">
              <div className="text-left">
                <h3 className="font-bold text-sm sm:text-base">Write & Reflect</h3>
                <p className="text-xs sm:text-sm text-base-content/70">Share your thoughts and experiences</p>
              </div>
            </div>
            <div className="step step-primary">
              <div className="text-left">
                <h3 className="font-bold text-sm sm:text-base">AI Conversation</h3>
                <p className="text-xs sm:text-sm text-base-content/70">Get thoughtful follow-up questions</p>
              </div>
            </div>
            <div className="step step-primary">
              <div className="text-left">
                <h3 className="font-bold text-sm sm:text-base">Extract Insights</h3>
                <p className="text-xs sm:text-sm text-base-content/70">Automatic tagging and pattern recognition</p>
              </div>
            </div>
            <div className="step step-primary">
              <div className="text-left">
                <h3 className="font-bold text-sm sm:text-base">Track Progress</h3>
                <p className="text-xs sm:text-sm text-base-content/70">See how experiments affect your growth</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="card bg-gradient-to-r from-primary to-secondary text-primary-content animate-scale-in">
          <div className="card-body text-center p-6 sm:p-8">
            <h2 className="card-title text-2xl sm:text-3xl justify-center mb-4 flex-wrap">
              <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 mr-2" />
              Ready to Start Your Growth Journey?
            </h2>
            <p className="text-lg sm:text-xl mb-6 opacity-90 max-w-2xl mx-auto">
              Join others who are using structured reflection to understand what actually works in their lives.
            </p>
            <Link href="/auth/register" className="btn btn-outline btn-lg text-white border-white hover:bg-white hover:text-primary">
              Create Your Account
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer footer-center p-6 sm:p-10 bg-base-200 text-base-content mt-12 sm:mt-16">
        <aside>
          <div className="flex items-center space-x-2 mb-4">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">Journal</span>
          </div>
          <p className="text-base-content/70 text-sm sm:text-base max-w-md">
            Personal growth through structured reflection and AI-powered insights.
          </p>
        </aside>
      </footer>
    </div>
  )
}
