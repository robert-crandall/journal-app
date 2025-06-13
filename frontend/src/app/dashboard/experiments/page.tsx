'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  FlaskConical, 
  Plus, 
  Calendar, 
  Target, 
  CheckCircle, 
  Clock,
  TrendingUp,
  BookOpen
} from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { Experiment } from '@/types'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorMessage } from '@/components/ErrorMessage'
import { dateUtils, cn } from '@/utils'

export default function ExperimentsPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'upcoming'>('all')

  useEffect(() => {
    const loadExperiments = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const response = await apiClient.getExperiments()
        if (response.success && response.data) {
          setExperiments(response.data)
        } else {
          setError(response.error || 'Failed to load experiments')
        }
      } catch (err) {
        console.error('Error loading experiments:', err)
        setError('Unable to load experiments')
      } finally {
        setIsLoading(false)
      }
    }

    loadExperiments()
  }, [])

  // Categorize experiments by status
  const categorizeExperiment = (experiment: Experiment) => {
    const now = new Date()
    const startDate = new Date(experiment.startDate)
    const endDate = new Date(experiment.endDate)
    
    if (now < startDate) return 'upcoming'
    if (now > endDate) return 'completed'
    return 'active'
  }

  const filteredExperiments = experiments.filter(experiment => {
    if (filter === 'all') return true
    return categorizeExperiment(experiment) === filter
  })

  const getStatusInfo = (experiment: Experiment) => {
    const status = categorizeExperiment(experiment)
    const now = new Date()
    const startDate = new Date(experiment.startDate)
    const endDate = new Date(experiment.endDate)
    
    switch (status) {
      case 'upcoming':
        return {
          status: 'upcoming',
          label: 'Upcoming',
          color: 'text-warning',
          bgColor: 'bg-warning/10',
          icon: Clock,
          description: `Starts ${dateUtils.getRelativeTime(startDate)}`
        }
      case 'active':
        const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        const daysElapsed = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        const progress = Math.min((daysElapsed / totalDays) * 100, 100)
        
        return {
          status: 'active',
          label: 'Active',
          color: 'text-success',
          bgColor: 'bg-success/10',
          icon: Target,
          description: `Day ${daysElapsed} of ${totalDays}`,
          progress
        }
      case 'completed':
        return {
          status: 'completed',
          label: 'Completed',
          color: 'text-base-content/60',
          bgColor: 'bg-base-200',
          icon: CheckCircle,
          description: `Ended ${dateUtils.getRelativeTime(endDate)}`
        }
      default:
        return {
          status: 'unknown',
          label: 'Unknown',
          color: 'text-base-content/60',
          bgColor: 'bg-base-200',
          icon: FlaskConical,
          description: ''
        }
    }
  }

  const statusCounts = {
    all: experiments.length,
    active: experiments.filter(exp => categorizeExperiment(exp) === 'active').length,
    upcoming: experiments.filter(exp => categorizeExperiment(exp) === 'upcoming').length,
    completed: experiments.filter(exp => categorizeExperiment(exp) === 'completed').length,
  }

  if (isLoading) {
    return <LoadingSpinner size="lg" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-base-content flex items-center gap-2">
            <FlaskConical className="h-6 w-6 text-experiment-active" />
            Self-Experiments
          </h1>
          <p className="text-base-content/60 mt-1">
            Track your lifestyle experiments and measure their impact
          </p>
        </div>
        
        <Link href="/dashboard/experiments/new" className="btn btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          New Experiment
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <div className="tabs tabs-boxed">
            {[
              { key: 'all', label: 'All', count: statusCounts.all },
              { key: 'active', label: 'Active', count: statusCounts.active },
              { key: 'upcoming', label: 'Upcoming', count: statusCounts.upcoming },
              { key: 'completed', label: 'Completed', count: statusCounts.completed },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={cn(
                  'tab gap-2',
                  filter === tab.key && 'tab-active'
                )}
              >
                {tab.label}
                <div className="badge badge-sm">{tab.count}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <ErrorMessage 
          message={error} 
          onRetry={() => window.location.reload()}
        />
      )}

      {/* Experiments List */}
      {filteredExperiments.length === 0 ? (
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body text-center py-12">
            <FlaskConical className="h-16 w-16 text-base-content/20 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-base-content mb-2">
              {filter === 'all' 
                ? 'No experiments yet'
                : `No ${filter} experiments`
              }
            </h3>
            <p className="text-base-content/60 mb-4">
              {filter === 'all' 
                ? 'Create your first experiment to start tracking lifestyle changes.'
                : `You don't have any ${filter} experiments at the moment.`
              }
            </p>
            <Link href="/dashboard/experiments/new" className="btn btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Create Experiment
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredExperiments.map((experiment) => {
            const statusInfo = getStatusInfo(experiment)
            const StatusIcon = statusInfo.icon

            return (
              <Link
                key={experiment.id}
                href={`/dashboard/experiments/${experiment.id}`}
                className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="card-body">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-base-content line-clamp-1">
                        {experiment.title}
                      </h3>
                      <p className="text-sm text-base-content/70 mt-1 line-clamp-2">
                        {experiment.description}
                      </p>
                    </div>
                    <div className={cn(
                      'flex items-center px-2 py-1 rounded-full text-xs font-medium ml-4',
                      statusInfo.bgColor,
                      statusInfo.color
                    )}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusInfo.label}
                    </div>
                  </div>

                  {/* Progress Bar for Active Experiments */}
                  {statusInfo.status === 'active' && statusInfo.progress !== undefined && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs text-base-content/60 mb-1">
                        <span>Progress</span>
                        <span>{Math.round(statusInfo.progress)}%</span>
                      </div>
                      <div className="w-full bg-base-200 rounded-full h-2">
                        <div 
                          className="bg-experiment-active h-2 rounded-full transition-all duration-300"
                          style={{ width: `${statusInfo.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Daily Task */}
                  <div className="bg-base-50 rounded-lg p-3 mb-3">
                    <div className="flex items-start space-x-2">
                      <Target className="h-4 w-4 text-experiment-active mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-base-content mb-1">
                          Daily Task
                        </div>
                        <div className="text-xs text-base-content/70">
                          {experiment.dailyTaskDescription}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-base-content/60">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {dateUtils.formatDate(experiment.startDate)} - {dateUtils.formatDate(experiment.endDate)}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center">
                        <BookOpen className="h-3 w-3 mr-1" />
                        View Journal Entries
                      </div>
                      <div className="flex items-center">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {statusInfo.description}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
