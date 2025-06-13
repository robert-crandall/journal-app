'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BookOpen, Plus, Search, Calendar, Tag } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { JournalEntry } from '@/types'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorMessage } from '@/components/ErrorMessage'
import { dateUtils, textUtils } from '@/utils'

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest')

  useEffect(() => {
    const loadEntries = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const response = await apiClient.getJournalEntries()
        if (response.success && response.data) {
          setEntries(response.data)
        } else {
          setError(response.error || 'Failed to load journal entries')
        }
      } catch (err) {
        console.error('Error loading journal entries:', err)
        setError('Unable to load journal entries')
      } finally {
        setIsLoading(false)
      }
    }

    loadEntries()
  }, [])

  // Filter and sort entries
  const filteredEntries = entries
    .filter(entry => {
      if (!searchQuery) return true
      const searchLower = searchQuery.toLowerCase()
      return (
        entry.title?.toLowerCase().includes(searchLower) ||
        entry.synopsis?.toLowerCase().includes(searchLower) ||
        entry.conversationData?.messages?.some(msg => 
          msg.content.toLowerCase().includes(searchLower)
        )
      )
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB
    })

  if (isLoading) {
    return <LoadingSpinner size="lg" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-base-content flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-journal-primary" />
            Journal Entries
          </h1>
          <p className="text-base-content/60 mt-1">
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'} total
          </p>
        </div>
        
        <Link href="/dashboard/journal/new" className="btn btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          New Entry
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-base-content/40" />
              <input
                type="text"
                placeholder="Search entries..."
                className="input input-bordered w-full pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Sort */}
            <select
              className="select select-bordered w-full sm:w-48"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
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

      {/* Entries List */}
      {filteredEntries.length === 0 ? (
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body text-center py-12">
            <BookOpen className="h-16 w-16 text-base-content/20 mx-auto mb-4" />
            {searchQuery ? (
              <>
                <h3 className="text-lg font-semibold text-base-content mb-2">
                  No entries found
                </h3>
                <p className="text-base-content/60 mb-4">
                  Try adjusting your search terms or create a new entry.
                </p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-base-content mb-2">
                  Start Your Journal Journey
                </h3>
                <p className="text-base-content/60 mb-4">
                  Write your first journal entry and begin reflecting on your personal growth.
                </p>
              </>
            )}
            <Link href="/dashboard/journal/new" className="btn btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Write Your First Entry
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredEntries.map((entry) => (
            <Link
              key={entry.id}
              href={`/dashboard/journal/${entry.id}`}
              className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="card-body">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-base-content line-clamp-1">
                      {entry.title || 'Untitled Entry'}
                    </h3>
                    {entry.synopsis && (
                      <p className="text-sm text-base-content/70 mt-1 line-clamp-1">
                        {entry.synopsis}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center text-xs text-base-content/60 ml-4">
                    <Calendar className="h-3 w-3 mr-1" />
                    {dateUtils.formatDate(entry.createdAt)}
                  </div>
                </div>
                
                <p className="text-base-content/80 line-clamp-3 mb-3">
                  {entry.conversationData?.messages?.length > 0 
                    ? textUtils.truncate(entry.conversationData.messages[0].content, 200)
                    : entry.summary || 'No content'}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-xs text-base-content/60">
                    <span>
                      {entry.conversationData?.messages 
                        ? entry.conversationData.messages
                            .filter(msg => msg.role === 'user')
                            .reduce((total, msg) => total + textUtils.countWords(msg.content), 0)
                        : 0} words
                    </span>
                    <span className="mx-2">•</span>
                    <span>{dateUtils.getRelativeTime(entry.createdAt)}</span>
                  </div>
                  
                  {entry.summary && (
                    <div className="flex items-center text-xs text-journal-primary">
                      <Tag className="h-3 w-3 mr-1" />
                      Analyzed
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
