"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Edit3,
  Save,
  X,
  Calendar,
  Tag,
  BookOpen,
  Clock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { api, type JournalEntry } from "@/lib/api"
import { formatDistanceToNow, format } from "date-fns"

export default function JournalEntryPage() {
  const params = useParams()
  const entryId = params.id as string
  
  const [entry, setEntry] = useState<JournalEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Edit form state
  const [editTitle, setEditTitle] = useState("")
  const [editCondensedSummary, setEditCondensedSummary] = useState("")
  const [editFullSummary, setEditFullSummary] = useState("")
  const [editContent, setEditContent] = useState("")
  const [editTags, setEditTags] = useState("")

  useEffect(() => {
    if (entryId) {
      loadEntry()
    }
  }, [entryId])

  const loadEntry = async () => {
    try {
      const data = await api.getJournalEntry(entryId)
      setEntry(data)
      // Initialize edit form
      setEditTitle(data.title)
      setEditCondensedSummary(data.condensedSummary)
      setEditFullSummary(data.fullSummary)
      setEditContent(data.content)
      setEditTags(data.tags.join(", "))
    } catch (error) {
      console.error('Failed to load journal entry:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!entry) return
    
    setSaving(true)
    try {
      const tags = editTags.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0)
      
      const updatedEntry = await api.updateJournalEntry(entry.id, {
        title: editTitle,
        condensedSummary: editCondensedSummary,
        fullSummary: editFullSummary,
        content: editContent,
        tags,
      })
      
      setEntry(updatedEntry)
      setEditing(false)
    } catch (error) {
      console.error('Failed to update journal entry:', error)
      alert('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (!entry) return
    
    // Reset form to original values
    setEditTitle(entry.title)
    setEditCondensedSummary(entry.condensedSummary)
    setEditFullSummary(entry.fullSummary)
    setEditContent(entry.content)
    setEditTags(entry.tags.join(", "))
    setEditing(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading journal entry...</p>
        </div>
      </div>
    )
  }

  if (!entry) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Entry not found</h3>
          <p className="text-slate-600 mb-6">The journal entry you're looking for doesn't exist.</p>
          <Link href="/journal/entries">
            <Button>Back to Journal Entries</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/journal/entries">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Entries
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-slate-600" />
                <span className="font-semibold text-slate-800">Journal Entry</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {editing ? (
                <>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    size="sm"
                    disabled={saving}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    size="sm"
                    disabled={saving}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setEditing(true)}
                  size="sm"
                  variant="outline"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            {editing ? (
              <div className="space-y-4">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Entry title..."
                  className="text-xl font-semibold"
                />
                <Textarea
                  value={editCondensedSummary}
                  onChange={(e) => setEditCondensedSummary(e.target.value)}
                  placeholder="Brief summary..."
                  className="min-h-[60px] resize-none"
                />
              </div>
            ) : (
              <>
                <CardTitle className="text-2xl text-slate-800">{entry.title}</CardTitle>
                <p className="text-slate-600 text-lg leading-relaxed">{entry.condensedSummary}</p>
              </>
            )}
            
            <div className="flex items-center space-x-4 text-sm text-slate-500 pt-2">
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(entry.createdAt), "MMMM d, yyyy")}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}</span>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Tags */}
            <div>
              <h3 className="font-semibold text-slate-800 mb-2 flex items-center">
                <Tag className="h-4 w-4 mr-2" />
                Tags
              </h3>
              {editing ? (
                <Input
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  placeholder="Enter tags separated by commas..."
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {entry.tags.length > 0 ? (
                    entry.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-slate-500 italic">No tags</span>
                  )}
                </div>
              )}
            </div>

            {/* Full Summary */}
            <div>
              <h3 className="font-semibold text-slate-800 mb-2">Summary</h3>
              {editing ? (
                <Textarea
                  value={editFullSummary}
                  onChange={(e) => setEditFullSummary(e.target.value)}
                  placeholder="Full summary..."
                  className="min-h-[120px]"
                />
              ) : (
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {entry.fullSummary}
                </p>
              )}
            </div>

            {/* Full Content */}
            <div>
              <h3 className="font-semibold text-slate-800 mb-2">Full Entry</h3>
              {editing ? (
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Full journal entry content..."
                  className="min-h-[300px]"
                />
              ) : (
                <div className="prose prose-slate max-w-none">
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {entry.content}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
