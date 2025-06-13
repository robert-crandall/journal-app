'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import TextareaAutosize from 'react-textarea-autosize'
import { 
  ArrowLeft, 
  MessageCircle, 
  Bot, 
  User, 
  Send,
  Calendar,
  Tag,
  FlaskConical,
  Sparkles,
  Edit3,
  Trash2
} from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { JournalEntry } from '@/types'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorMessage } from '@/components/ErrorMessage'
import { dateUtils, textUtils } from '@/utils'

const continueSchema = z.object({
  content: z.string().min(1, 'Please enter a response').max(2000, 'Response is too long'),
})

type ContinueFormData = z.infer<typeof continueSchema>

interface JournalPageProps {
  params: {
    id: string
  }
}

export default function JournalEntryPage({ params }: JournalPageProps) {
  const [entry, setEntry] = useState<JournalEntry | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isContinuing, setIsContinuing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [followUpQuestion, setFollowUpQuestion] = useState<string | null>(null)
  const [conversationHistory, setConversationHistory] = useState<Array<{
    type: 'user' | 'ai'
    content: string
    timestamp: string
  }>>([])
  const router = useRouter()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContinueFormData>({
    resolver: zodResolver(continueSchema),
  })

  useEffect(() => {
    const loadEntry = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const response = await apiClient.getJournalEntry(params.id)
        if (response.success && response.data) {
          setEntry(response.data)
          // TODO: Load conversation history from backend if available
        } else {
          setError(response.error || 'Failed to load journal entry')
        }
      } catch (err) {
        console.error('Error loading journal entry:', err)
        setError('Unable to load journal entry')
      } finally {
        setIsLoading(false)
      }
    }

    loadEntry()
  }, [params.id])

  const onContinueConversation = async (data: ContinueFormData) => {
    if (!entry) return

    setIsContinuing(true)
    setError(null)

    try {
      const response = await apiClient.continueConversation(entry.id, {
        content: data.content
      })

      if (response.success && response.data) {
        // Add user message to conversation
        const userMessage = {
          type: 'user' as const,
          content: data.content,
          timestamp: new Date().toISOString()
        }
        
        setConversationHistory(prev => [...prev, userMessage])
        
        // Update entry with new data
        setEntry(response.data.entry)
        
        // Set follow-up question if provided
        if (response.data.followUpQuestion) {
          setFollowUpQuestion(response.data.followUpQuestion)
          const aiMessage = {
            type: 'ai' as const,
            content: response.data.followUpQuestion,
            timestamp: new Date().toISOString()
          }
          setConversationHistory(prev => [...prev, aiMessage])
        } else {
          setFollowUpQuestion(null)
        }
        
        reset()
      } else {
        setError(response.error || 'Failed to continue conversation')
      }
    } catch (err) {
      console.error('Error continuing conversation:', err)
      setError('Unable to continue conversation')
    } finally {
      setIsContinuing(false)
    }
  }

  if (isLoading) {
    return <LoadingSpinner size="lg" />
  }

  if (!entry) {
    return (
      <div className="text-center py-12">
        <div className="text-base-content/60 mb-4">Journal entry not found</div>
        <Link href="/dashboard/journal" className="btn btn-primary">
          Back to Journal
        </Link>
      </div>
    )
  }

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
            <h1 className="text-2xl font-bold text-base-content">
              {entry.title || 'Journal Entry'}
            </h1>
            <div className="flex items-center space-x-4 text-sm text-base-content/60 mt-1">
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {dateUtils.formatDate(entry.createdAt, 'PPP')}
              </div>
              <div>{textUtils.countWords(entry.content)} words</div>
              <div>{dateUtils.getRelativeTime(entry.createdAt)}</div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="btn btn-ghost btn-sm">
            <Edit3 className="h-4 w-4" />
          </button>
          <button className="btn btn-ghost btn-sm text-error">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Entry Metadata */}
      {entry.synopsis && (
        <div className="alert alert-info">
          <Sparkles className="h-4 w-4" />
          <div>
            <div className="font-medium">Synopsis</div>
            <div className="text-sm">{entry.synopsis}</div>
          </div>
        </div>
      )}

      {/* Original Entry */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-brand-700" />
              </div>
            </div>
            <div className="flex-1">
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap">{entry.content}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conversation History */}
      {conversationHistory.length > 0 && (
        <div className="space-y-4">
          {conversationHistory.map((message, index) => (
            <div key={index} className="card bg-base-100 shadow-sm">
              <div className="card-body">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.type === 'user' 
                        ? 'bg-brand-100' 
                        : 'bg-journal-primary/10'
                    }`}>
                      {message.type === 'user' ? (
                        <User className="h-4 w-4 text-brand-700" />
                      ) : (
                        <Bot className="h-4 w-4 text-journal-primary" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="prose prose-sm max-w-none">
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                    <div className="text-xs text-base-content/60 mt-2">
                      {dateUtils.getRelativeTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Continue Conversation */}
      {followUpQuestion && (
        <div className="card bg-gradient-to-r from-journal-primary/5 to-journal-secondary/5 border border-journal-primary/20">
          <div className="card-body">
            <div className="flex items-start space-x-3 mb-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-journal-primary/10 rounded-full flex items-center justify-center">
                  <Bot className="h-4 w-4 text-journal-primary" />
                </div>
              </div>
              <div className="flex-1">
                <div className="prose prose-sm max-w-none">
                  <p>{followUpQuestion}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit(onContinueConversation)} className="space-y-4">
              <div className="form-control">
                <TextareaAutosize
                  {...register('content')}
                  placeholder="Share your thoughts..."
                  className={`textarea textarea-bordered w-full resize-none ${
                    errors.content ? 'textarea-error' : 'focus:textarea-primary'
                  }`}
                  minRows={3}
                  maxRows={8}
                  disabled={isContinuing}
                />
                {errors.content && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.content.message}</span>
                  </label>
                )}
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isContinuing}
                >
                  {isContinuing ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Response
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Analysis Results */}
      {entry.summary && (
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h3 className="card-title text-lg mb-4">
              <Sparkles className="h-5 w-5 text-journal-primary" />
              AI Analysis
            </h3>
            
            <div className="prose prose-sm max-w-none">
              <h4>Summary</h4>
              <p>{entry.summary}</p>
            </div>

            {/* Tags would go here */}
            <div className="flex items-center space-x-2 mt-4">
              <Tag className="h-4 w-4 text-base-content/60" />
              <span className="text-sm text-base-content/60">
                Content and tone tags will appear here after AI processing
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <ErrorMessage 
          message={error} 
          onRetry={() => setError(null)}
        />
      )}
    </div>
  )
}
