'use client'

import { useState, useEffect, use } from 'react'
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
import { JournalEntryWithTags } from '@/types'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorMessage } from '@/components/ErrorMessage'
import { TagDisplay } from '@/components/TagDisplay'
import { dateUtils, textUtils } from '@/utils'

const continueSchema = z.object({
  content: z.string().min(1, 'Please enter a response').max(2000, 'Response is too long'),
})

type ContinueFormData = z.infer<typeof continueSchema>

interface JournalPageProps {
  params: Promise<{
    id: string
  }>
}

export default function JournalEntryPage({ params }: JournalPageProps) {
  const resolvedParams = use(params)
  const [entry, setEntry] = useState<JournalEntryWithTags | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<Array<{
    role: 'user' | 'assistant'
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
        
        const response = await apiClient.getJournalEntry(resolvedParams.id)
        if (response.success && response.data) {
          setEntry(response.data)
          // Load conversation messages from the entry
          if (response.data.conversationData?.messages) {
            setMessages(response.data.conversationData.messages)
          }
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
  }, [resolvedParams.id])

  const onSendMessage = async (data: ContinueFormData) => {
    if (!entry) return

    setIsSending(true)
    setError(null)

    try {
      const response = await apiClient.continueConversation(entry.id, {
        content: data.content
      })

      if (response.success && response.data) {
        // Update the entry with new conversation data
        setEntry(response.data.entry)
        
        // Update messages from the response
        if (response.data.entry.conversationData?.messages) {
          setMessages(response.data.entry.conversationData.messages)
        }
        
        reset()
      } else {
        setError(response.error || 'Failed to send message')
      }
    } catch (err) {
      console.error('Error sending message:', err)
      setError('Unable to send message')
    } finally {
      setIsSending(false)
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
              <div>
                {entry.conversationData?.messages 
                  ? entry.conversationData.messages
                      .filter((msg: any) => msg.role === 'user')
                      .reduce((total: number, msg: any) => total + textUtils.countWords(msg.content), 0)
                  : 0} words
              </div>
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

      {/* Summary Preview */}
      {entry.summary && (
        <div className="card bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20 shadow-md">
          <div className="card-body">
            <div className="flex items-center mb-3">
              <Sparkles className="h-5 w-5 text-primary mr-2" />
              <h3 className="text-lg font-semibold text-base-content">
                AI-Generated Summary
              </h3>
            </div>
            <div className="prose prose-sm max-w-none text-base-content/90 leading-relaxed">
              {entry.summary.split('\n\n').map((paragraph, index) => (
                <p key={index} className="mb-3 last:mb-0">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Tags Preview */}
      {(entry.contentTags?.length > 0 || entry.toneTags?.length > 0 || entry.characterStats?.length > 0) && (
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body py-3">
            <TagDisplay 
              contentTags={entry.contentTags}
              toneTags={entry.toneTags}
              characterStats={entry.characterStats}
              size="sm"
            />
          </div>
        </div>
      )}

      {/* Chat Interface */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body p-0">
          {/* Chat Messages */}
          <div className="flex flex-col h-[600px]">
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-base-content/60 py-12">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No conversation yet. The AI will start asking follow-up questions.</p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`flex items-start space-x-3 max-w-[80%] ${
                        message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                      }`}
                    >
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-content'
                              : 'bg-secondary text-secondary-content'
                          }`}
                        >
                          {message.role === 'user' ? (
                            <User className="h-4 w-4" />
                          ) : (
                            <Bot className="h-4 w-4" />
                          )}
                        </div>
                      </div>

                      {/* Message Bubble */}
                      <div
                        className={`p-4 rounded-2xl ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-content rounded-br-md'
                            : 'bg-base-200 text-base-content rounded-bl-md'
                        }`}
                      >
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">
                          {message.content}
                        </p>
                        <div
                          className={`text-xs mt-2 opacity-70 ${
                            message.role === 'user' ? 'text-right' : 'text-left'
                          }`}
                        >
                          {dateUtils.formatDate(message.timestamp, 'p')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-base-300 p-4">
              <form onSubmit={handleSubmit(onSendMessage)} className="flex space-x-3">
                <div className="flex-1">
                  <TextareaAutosize
                    {...register('content')}
                    placeholder="Type your response..."
                    className={`textarea textarea-bordered w-full resize-none ${
                      errors.content ? 'textarea-error' : 'focus:textarea-primary'
                    }`}
                    minRows={1}
                    maxRows={4}
                    disabled={isSending}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSubmit(onSendMessage)()
                      }
                    }}
                  />
                  {errors.content && (
                    <div className="text-error text-xs mt-1">{errors.content.message}</div>
                  )}
                </div>
                <button
                  type="submit"
                  className="btn btn-primary btn-circle"
                  disabled={isSending}
                >
                  {isSending ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* AI Analysis Results */}
      {entry.summary && (
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h3 className="card-title text-lg mb-4">
              <Sparkles className="h-5 w-5 text-journal-primary" />
              AI Analysis & Insights
            </h3>
            
            {/* Detailed Summary */}
            <div className="mb-6">
              <h4 className="font-semibold text-base-content mb-3 flex items-center">
                <div className="w-1 h-4 bg-primary rounded mr-2"></div>
                Detailed Summary
              </h4>
              <div className="bg-base-200/50 rounded-lg p-4">
                <div className="prose prose-sm max-w-none text-base-content/90 leading-relaxed">
                  {entry.summary.split('\n\n').map((paragraph, index) => (
                    <p key={index} className="mb-3 last:mb-0">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            {/* Tags & Character Growth */}
            <div>
              <h4 className="font-semibold text-base-content mb-3 flex items-center">
                <div className="w-1 h-4 bg-secondary rounded mr-2"></div>
                Extracted Tags & Character Growth
              </h4>
              <TagDisplay 
                contentTags={entry.contentTags}
                toneTags={entry.toneTags}
                characterStats={entry.characterStats}
                size="md"
              />
              {(!entry.contentTags?.length && !entry.toneTags?.length && !entry.characterStats?.length) && (
                <p className="text-base-content/60 text-sm italic">
                  Tags and character insights will appear here after the conversation is completed and analyzed.
                </p>
              )}
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
