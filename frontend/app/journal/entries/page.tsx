"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  BookOpen,
  Plus,
  Search,
  Calendar,
  Tag,
  Edit3,
  Trash2,
  ArrowLeft,
  Clock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { api, type JournalEntry } from "@/lib/api"
import { formatDistanceToNow } from "date-fns"

export default function JournalEntries() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  useEffect(() => {
    loadEntries()
  }, [])

  const loadEntries = async () => {
    try {
      const data = await api.getJournalEntries()
      setEntries(data)
    } catch (error) {
      console.error('Failed to load journal entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteEntry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this journal entry?')) return
    
    try {
      await api.deleteJournalEntry(id)
      setEntries(entries.filter(entry => entry.id !== id))
    } catch (error) {
      console.error('Failed to delete entry:', error)
      alert('Failed to delete entry')
    }
  }

  // Get all unique tags
  const allTags = Array.from(new Set(entries.flatMap(entry => entry.tags)))

  // Filter entries based on search and selected tag
  const filteredEntries = entries.filter(entry => {
    const matchesSearch = searchTerm === "" || 
      entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.condensedSummary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesTag = selectedTag === null || entry.tags.includes(selectedTag)
    
    return matchesSearch && matchesTag
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading your journal entries...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-slate-600" />
                <span className="font-semibold text-slate-800">Journal Entries</span>
                <Badge variant="secondary">{entries.length}</Badge>
              </div>
            </div>
            <Link href="/journal">
              <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
                <Plus className="h-4 w-4 mr-2" />
                New Entry
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Search and Filter */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search journal entries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedTag === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTag(null)}
                className={selectedTag === null ? "bg-emerald-500 hover:bg-emerald-600" : ""}
              >
                All Tags
              </Button>
              {allTags.map(tag => (
                <Button
                  key={tag}
                  variant={selectedTag === tag ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  className={selectedTag === tag ? "bg-emerald-500 hover:bg-emerald-600" : ""}
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Journal Entries */}
        {filteredEntries.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              {entries.length === 0 ? "No journal entries yet" : "No entries match your search"}
            </h3>
            <p className="text-slate-600 mb-6">
              {entries.length === 0 
                ? "Start your journaling journey by creating your first entry."
                : "Try adjusting your search terms or filters."
              }
            </p>
            {entries.length === 0 && (
              <Link href="/journal">
                <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Entry
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredEntries.map((entry) => (
              <Card key={entry.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-semibold text-slate-800 line-clamp-2">
                      {entry.title}
                    </CardTitle>
                    <div className="flex items-center space-x-1 ml-2">
                      <Link href={`/journal/entry/${entry.id}`}>
                        <Button variant="ghost" size="sm">
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteEntry(entry.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-slate-500">
                    <Clock className="h-3 w-3" />
                    <span>{formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 text-sm line-clamp-3 mb-3">
                    {entry.condensedSummary}
                  </p>
                  {entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {entry.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
