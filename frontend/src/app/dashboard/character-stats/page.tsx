'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  TrendingUp, 
  Plus, 
  Award, 
  Star, 
  BarChart3,
  Target,
  Zap
} from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { CharacterStat } from '@/types'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorMessage } from '@/components/ErrorMessage'
import { cn } from '@/utils'

export default function CharacterStatsPage() {
  const [stats, setStats] = useState<CharacterStat[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadStats = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const response = await apiClient.getCharacterStats()
        if (response.success && response.data) {
          setStats(response.data)
        } else {
          setError(response.error || 'Failed to load character stats')
        }
      } catch (err) {
        console.error('Error loading character stats:', err)
        setError('Unable to load character stats')
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [])

  const getLevel = (xp: number) => {
    // Simple level calculation: every 100 XP = 1 level
    return Math.floor(xp / 100) + 1
  }

  const getXpForNextLevel = (xp: number) => {
    const currentLevel = getLevel(xp)
    return currentLevel * 100
  }

  const getXpProgress = (xp: number) => {
    const currentLevel = getLevel(xp)
    const xpForCurrentLevel = (currentLevel - 1) * 100
    const xpForNextLevel = currentLevel * 100
    const progressXp = xp - xpForCurrentLevel
    const neededXp = xpForNextLevel - xpForCurrentLevel
    return (progressXp / neededXp) * 100
  }

  const getStatColor = (index: number) => {
    const colors = [
      'text-stat-strength',
      'text-stat-intelligence', 
      'text-stat-wisdom',
      'text-journal-primary',
      'text-experiment-active',
      'text-brand-500'
    ]
    return colors[index % colors.length]
  }

  const getStatBgColor = (index: number) => {
    const colors = [
      'bg-stat-strength',
      'bg-stat-intelligence', 
      'bg-stat-wisdom',
      'bg-journal-primary',
      'bg-experiment-active',
      'bg-brand-500'
    ]
    return colors[index % colors.length]
  }

  const totalXp = stats.reduce((sum, stat) => sum + stat.currentXp, 0)
  const averageLevel = stats.length > 0 ? stats.reduce((sum, stat) => sum + getLevel(stat.currentXp), 0) / stats.length : 0

  if (isLoading) {
    return <LoadingSpinner size="lg" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-base-content flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-stat-intelligence" />
            Character Stats
          </h1>
          <p className="text-base-content/60 mt-1">
            Track your personal development through RPG-inspired progression
          </p>
        </div>
        
        <Link href="/dashboard/character-stats/new" className="btn btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          New Stat
        </Link>
      </div>

      {/* Overview Cards */}
      {stats.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card bg-gradient-to-r from-stat-intelligence to-stat-intelligence/80 text-white">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{totalXp.toLocaleString()}</div>
                  <div className="text-sm opacity-90">Total XP Earned</div>
                </div>
                <Award className="h-8 w-8 opacity-80" />
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-r from-stat-strength to-stat-strength/80 text-white">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{Math.round(averageLevel * 10) / 10}</div>
                  <div className="text-sm opacity-90">Average Level</div>
                </div>
                <Star className="h-8 w-8 opacity-80" />
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-r from-stat-wisdom to-stat-wisdom/80 text-white">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{stats.length}</div>
                  <div className="text-sm opacity-90">Active Stats</div>
                </div>
                <BarChart3 className="h-8 w-8 opacity-80" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <ErrorMessage 
          message={error} 
          onRetry={() => window.location.reload()}
        />
      )}

      {/* Stats List */}
      {stats.length === 0 ? (
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body text-center py-12">
            <TrendingUp className="h-16 w-16 text-base-content/20 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-base-content mb-2">
              Create Your First Character Stat
            </h3>
            <p className="text-base-content/60 mb-4 max-w-md mx-auto">
              Character stats help you gamify personal development. Create stats like "Strength", 
              "Intelligence", or "Creativity" and watch them grow as you journal and complete experiments.
            </p>
            <Link href="/dashboard/character-stats/new" className="btn btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Stat
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
          {stats.map((stat, index) => {
            const level = getLevel(stat.currentXp)
            const progress = getXpProgress(stat.currentXp)
            const xpForNext = getXpForNextLevel(stat.currentXp)
            const xpNeeded = xpForNext - stat.currentXp
            const statColor = getStatColor(index)
            const statBgColor = getStatBgColor(index)

            return (
              <div key={stat.id} className="card bg-base-100 shadow-lg">
                <div className="card-body">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-base-content flex items-center gap-2">
                        <div className={cn(
                          'w-3 h-3 rounded-full',
                          statBgColor
                        )}></div>
                        {stat.name}
                      </h3>
                      <p className="text-base-content/70 mt-1">
                        {stat.description}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-base-content">
                        Level {level}
                      </div>
                      <div className="text-sm text-base-content/60">
                        {stat.currentXp.toLocaleString()} XP
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm text-base-content/60 mb-2">
                      <span>Progress to Level {level + 1}</span>
                      <span>{xpNeeded} XP needed</span>
                    </div>
                    <div className="w-full bg-base-200 rounded-full h-3">
                      <div 
                        className={cn(
                          'h-3 rounded-full transition-all duration-300',
                          statBgColor
                        )}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* XP Sources */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3 p-3 bg-base-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-journal-primary/10 rounded-full flex items-center justify-center">
                          <Target className="h-4 w-4 text-journal-primary" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-base-content">Journal Entries</div>
                        <div className="text-xs text-base-content/60">+5 XP per relevant entry</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 bg-base-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-experiment-active/10 rounded-full flex items-center justify-center">
                          <Zap className="h-4 w-4 text-experiment-active" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-base-content">Daily Tasks</div>
                        <div className="text-xs text-base-content/60">+10 XP per completion</div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="text-xs text-base-content/60 mt-4 text-center">
                    Last updated {new Date(stat.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
