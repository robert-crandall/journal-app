'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  BookOpen, 
  FlaskConical, 
  TrendingUp, 
  Plus, 
  Calendar,
  BarChart3,
  Target
} from 'lucide-react'
import { auth } from '@/lib/auth'
import { apiClient } from '@/lib/api-client'
import { JournalEntry, Experiment, CharacterStat } from '@/types'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorMessage } from '@/components/ErrorMessage'
import { dateUtils, textUtils } from '@/utils'

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recentEntries, setRecentEntries] = useState<JournalEntry[]>([])
  const [activeExperiments, setActiveExperiments] = useState<Experiment[]>([])
  const [characterStats, setCharacterStats] = useState<CharacterStat[]>([])
  
  const user = auth.getUser()

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Load recent journal entries
        const journalResponse = await apiClient.getJournalEntries()
        if (journalResponse.success && journalResponse.data) {
          // Get the 3 most recent entries
          const sorted = journalResponse.data.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          setRecentEntries(sorted.slice(0, 3))
        }

        // Load active experiments
        const experimentsResponse = await apiClient.getExperiments()
        if (experimentsResponse.success && experimentsResponse.data) {
          // Filter for active experiments (current date is between start and end date)
          const now = new Date()
          const active = experimentsResponse.data.filter(exp => {
            const startDate = new Date(exp.startDate)
            const endDate = new Date(exp.endDate)
            return now >= startDate && now <= endDate
          })
          setActiveExperiments(active)
        }

        // Load character stats
        const statsResponse = await apiClient.getCharacterStats()
        if (statsResponse.success && statsResponse.data) {
          setCharacterStats(statsResponse.data.slice(0, 4)) // Show top 4 stats
        }

      } catch (err) {
        console.error('Dashboard loading error:', err)
        setError('Failed to load dashboard data')
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  if (isLoading) {
    return <LoadingSpinner size="lg" />
  }

  if (error) {
    return (
      <div className="flex justify-center">
        <ErrorMessage 
          message={error} 
          onRetry={() => window.location.reload()}
        />
      </div>
    )
  }

  return (
    <div className="spacing-responsive-y">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary to-secondary rounded-xl sm:rounded-2xl p-4 sm:p-6 text-primary-content animate-fade-in">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">
          Welcome back, {user?.name}! 👋
        </h1>
        <p className="text-base sm:text-lg opacity-90">
          Ready to continue your growth journey? Here's what's happening today.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid-responsive-2-4">
        <Link href="/dashboard/journal/new" className="btn btn-primary btn-sm sm:btn-md lg:btn-lg flex-col h-16 sm:h-20">
          <BookOpen className="h-4 w-4 sm:h-6 sm:w-6 mb-1" />
          <span className="text-xs sm:text-sm">New Entry</span>
        </Link>
        <Link href="/dashboard/experiments/new" className="btn btn-outline btn-sm sm:btn-md lg:btn-lg flex-col h-16 sm:h-20">
          <FlaskConical className="h-4 w-4 sm:h-6 sm:w-6 mb-1" />
          <span className="text-xs sm:text-sm">New Experiment</span>
        </Link>
        <Link href="/dashboard/character-stats" className="btn btn-outline btn-sm sm:btn-md lg:btn-lg flex-col h-16 sm:h-20">
          <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 mb-1" />
          <span className="text-xs sm:text-sm">View Stats</span>
        </Link>
        <Link href="/dashboard/journal" className="btn btn-outline btn-sm sm:btn-md lg:btn-lg flex-col h-16 sm:h-20">
          <BarChart3 className="h-4 w-4 sm:h-6 sm:w-6 mb-1" />
          <span className="text-xs sm:text-sm">All Entries</span>
        </Link>
      </div>

      {/* Main Content Grid */}
      <div className="grid-responsive-1-2">
        {/* Recent Journal Entries */}
        <div className="card bg-base-100 shadow-lg animate-slide-up">
          <div className="card-body p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="card-title text-base sm:text-lg">
                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Recent Journal Entries
              </h2>
              <Link href="/dashboard/journal" className="btn btn-sm btn-ghost">
                View All
              </Link>
            </div>
            
            {recentEntries.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <BookOpen className="h-10 w-10 sm:h-12 sm:w-12 text-base-content/20 mx-auto mb-4" />
                <p className="text-base-content/60 mb-4 text-sm sm:text-base">No journal entries yet</p>
                <Link href="/dashboard/journal/new" className="btn btn-primary btn-sm">
                  Write Your First Entry
                </Link>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {recentEntries.map((entry) => (
                  <Link
                    key={entry.id}
                    href={`/dashboard/journal/${entry.id}`}
                    className="block p-3 sm:p-4 border border-base-200 rounded-lg hover:bg-base-50 transition-colors animate-fade-in"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-base-content line-clamp-1 text-sm sm:text-base">
                        {entry.title || 'Untitled Entry'}
                      </h3>
                      <span className="text-xs text-base-content/60 whitespace-nowrap ml-2">
                        {dateUtils.getRelativeTime(entry.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-base-content/70 line-clamp-2">
                      {entry.conversationData?.messages?.length > 0 
                        ? textUtils.truncate(entry.conversationData.messages[0].content, 100)
                        : entry.summary || 'No content'}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Active Experiments */}
        <div className="card bg-base-100 shadow-lg animate-slide-up">
          <div className="card-body p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="card-title text-base sm:text-lg">
                <FlaskConical className="h-4 w-4 sm:h-5 sm:w-5 text-secondary" />
                Active Experiments
              </h2>
              <Link href="/dashboard/experiments" className="btn btn-sm btn-ghost">
                View All
              </Link>
            </div>
            
            {activeExperiments.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <FlaskConical className="h-10 w-10 sm:h-12 sm:w-12 text-base-content/20 mx-auto mb-4" />
                <p className="text-base-content/60 mb-4 text-sm sm:text-base">No active experiments</p>
                <Link href="/dashboard/experiments/new" className="btn btn-primary btn-sm">
                  Start Your First Experiment
                </Link>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {activeExperiments.map((experiment) => (
                  <Link
                    key={experiment.id}
                    href={`/dashboard/experiments/${experiment.id}`}
                    className="block p-3 sm:p-4 border border-base-200 rounded-lg hover:bg-base-50 transition-colors animate-fade-in"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-base-content line-clamp-1 text-sm sm:text-base">
                        {experiment.title}
                      </h3>
                      <div className="flex items-center text-xs text-accent ml-2">
                        <Target className="h-3 w-3 mr-1" />
                        Active
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-base-content/70 line-clamp-1 mb-2">
                      {experiment.description}
                    </p>
                    <div className="flex items-center text-xs text-base-content/60">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span className="truncate">
                        {dateUtils.formatDate(experiment.startDate)} - {dateUtils.formatDate(experiment.endDate)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Character Stats Overview */}
      <div className="card bg-base-100 shadow-lg animate-slide-up">
        <div className="card-body p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="card-title text-base sm:text-lg">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
              Character Stats Progress
            </h2>
            <Link href="/dashboard/character-stats" className="btn btn-sm btn-ghost">
              View All Stats
            </Link>
          </div>
          
          {characterStats.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <TrendingUp className="h-10 w-10 sm:h-12 sm:w-12 text-base-content/20 mx-auto mb-4" />
              <p className="text-base-content/60 mb-4 text-sm sm:text-base">No character stats created yet</p>
              <Link href="/dashboard/character-stats/new" className="btn btn-primary btn-sm">
                Create Your First Stat
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
              {characterStats.map((stat) => (
                <div key={stat.id} className="space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-base-content text-sm sm:text-base">{stat.name}</span>
                    <span className="text-xs sm:text-sm text-base-content/60">{stat.currentXp} XP</span>
                  </div>
                  <div className="w-full bg-base-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((stat.currentXp / 1000) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-base-content/60 line-clamp-1">
                    {stat.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
