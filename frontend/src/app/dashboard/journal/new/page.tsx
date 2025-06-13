'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import TextareaAutosize from 'react-textarea-autosize'
import { 
  BookOpen, 
  Save, 
  ArrowLeft, 
  Sparkles, 
  FlaskConical,
  MessageCircle 
} from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { Experiment } from '@/types'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorMessage } from '@/components/ErrorMessage'

const journalEntrySchema = z.object({
  content: z.string()
    .min(10, 'Please write at least 10 characters')
    .max(10000, 'Entry is too long (max 10,000 characters)'),
  experimentId: z.string().optional(),
})

type JournalEntryFormData = z.infer<typeof journalEntrySchema>

export default function NewJournalEntryPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [experiments, setExperiments] = useState<Experiment[]>([])
  const [showExperimentSelector, setShowExperimentSelector] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<JournalEntryFormData>({
    resolver: zodResolver(journalEntrySchema),
    defaultValues: {
      content: '',
      experimentId: '',
    }
  })

  const content = watch('content')
  const selectedExperimentId = watch('experimentId')

  // Load experiments on mount
  useEffect(() => {
    const loadExperiments = async () => {
      try {
        setIsLoading(true)
        const response = await apiClient.getExperiments()
        if (response.success && response.data) {
          // Filter for active experiments
          const now = new Date()
          const activeExperiments = response.data.filter(exp => {
            const startDate = new Date(exp.startDate)
            const endDate = new Date(exp.endDate)
            return now >= startDate && now <= endDate
          })
          setExperiments(activeExperiments)
        }
      } catch (err) {
        console.error('Error loading experiments:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadExperiments()
  }, [])

  const onSubmit = async (data: JournalEntryFormData) => {
    setIsCreating(true)
    setError(null)

    try {
      const response = await apiClient.createJournalEntry({
        content: data.content,
        experimentId: data.experimentId || undefined,
      })

      if (response.success && response.data) {
        // Redirect to the created entry
        router.push(`/dashboard/journal/${response.data.id}`)
      } else {
        setError(response.error || 'Failed to create journal entry')
      }
    } catch (err) {
      console.error('Error creating journal entry:', err)
      setError('Unable to create journal entry. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const selectedExperiment = experiments.find(exp => exp.id === selectedExperimentId)
  const wordCount = content ? content.trim().split(/\s+/).filter(word => word.length > 0).length : 0

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link 
            href="/dashboard/journal" 
            className="btn btn-ghost btn-circle"
            aria-label="Back to journal"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-base-content flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-journal-primary" />
              New Journal Entry
            </h1>
            <p className="text-base-content/60">Share your thoughts and reflections</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            {/* Experiment Selection */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <FlaskConical className="h-4 w-4 text-experiment-active" />
                <span className="text-sm font-medium">Link to Experiment</span>
              </div>
              <button
                type="button"
                onClick={() => setShowExperimentSelector(!showExperimentSelector)}
                className="btn btn-sm btn-ghost"
              >
                {selectedExperiment ? 'Change' : 'Select'}
              </button>
            </div>

            {showExperimentSelector && (
              <div className="mb-4 p-4 bg-base-50 rounded-lg">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Choose an active experiment (optional)</span>
                  </label>
                  <select
                    {...register('experimentId')}
                    className="select select-bordered"
                    disabled={isLoading}
                  >
                    <option value="">No experiment</option>
                    {experiments.map((experiment) => (
                      <option key={experiment.id} value={experiment.id}>
                        {experiment.title}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => setShowExperimentSelector(false)}
                  className="btn btn-sm btn-ghost mt-2"
                >
                  Done
                </button>
              </div>
            )}

            {selectedExperiment && (
              <div className="alert alert-info mb-4">
                <FlaskConical className="h-4 w-4" />
                <div>
                  <div className="font-medium">Linked to: {selectedExperiment.title}</div>
                  <div className="text-xs opacity-70">{selectedExperiment.description}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setValue('experimentId', '')}
                  className="btn btn-sm btn-ghost"
                >
                  Remove
                </button>
              </div>
            )}

            {/* Main Content Area */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">What's on your mind?</span>
                <span className="label-text-alt text-base-content/60">
                  {wordCount} words
                </span>
              </label>
              <TextareaAutosize
                {...register('content')}
                placeholder="Start writing about your day, thoughts, or experiences. The AI will ask follow-up questions to help you reflect deeper..."
                className={`textarea textarea-bordered w-full resize-none ${
                  errors.content ? 'textarea-error' : 'focus:textarea-primary'
                }`}
                minRows={8}
                maxRows={20}
                disabled={isCreating}
              />
              {errors.content && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.content.message}</span>
                </label>
              )}
            </div>

            {/* Writing Tips */}
            <div className="bg-base-50 rounded-lg p-4 mt-4">
              <div className="flex items-start space-x-2">
                <Sparkles className="h-4 w-4 text-journal-primary mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <div className="font-medium text-base-content mb-1">Writing Tips:</div>
                  <ul className="text-base-content/70 space-y-1 text-xs">
                    <li>• Write about specific events, feelings, or observations from your day</li>
                    <li>• Don't worry about perfect grammar - focus on authentic expression</li>
                    <li>• The AI will ask follow-up questions to help you dig deeper</li>
                    <li>• Mention any experiments you're running to track their impact</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <ErrorMessage 
            message={error} 
            onRetry={() => setError(null)}
          />
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Link href="/dashboard/journal" className="btn btn-ghost">
            Cancel
          </Link>
          
          <div className="flex items-center space-x-3">
            <div className="text-sm text-base-content/60">
              {content.length > 0 && (
                <span>Ready to start the conversation</span>
              )}
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isCreating || !content.trim()}
            >
              {isCreating ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Start Conversation
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
