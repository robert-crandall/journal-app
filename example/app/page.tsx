"use client"

import { useRef } from "react"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  BookOpen,
  Calendar,
  Settings,
  User,
  Plus,
  MessageCircle,
  CheckCircle2,
  Target,
  Sparkles,
  Clock,
  Menu,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface Todo {
  id: string
  text: string
  completed: boolean
  category: "growth" | "wellness" | "learning" | "connection"
  createdAt: Date
}

interface JournalEntry {
  id: string
  preview: string
  mood: string
  createdAt: Date
  wordCount: number
}

interface Message {
  id: string
  content: string
  isUser: boolean
  timestamp: Date
}

const growthSuggestions = [
  { text: "Read for 20 minutes", category: "learning" as const },
  { text: "Practice gratitude meditation", category: "wellness" as const },
  { text: "Call a friend or family member", category: "connection" as const },
  { text: "Learn something new today", category: "growth" as const },
  { text: "Take a mindful walk", category: "wellness" as const },
  { text: "Write down 3 things you're grateful for", category: "growth" as const },
  { text: "Try a new healthy recipe", category: "wellness" as const },
  { text: "Practice a skill for 30 minutes", category: "learning" as const },
]

const categoryColors = {
  growth: "bg-emerald-100 text-emerald-800 border-emerald-200",
  wellness: "bg-blue-100 text-blue-800 border-blue-200",
  learning: "bg-purple-100 text-purple-800 border-purple-200",
  connection: "bg-orange-100 text-orange-800 border-orange-200",
}

const categoryIcons = {
  growth: Target,
  wellness: Sparkles,
  learning: BookOpen,
  connection: MessageCircle,
}

const journalQuestions = [
  "How are you feeling right now?",
  "What was the highlight of your day?",
  "What challenged you today?",
  "What are you grateful for?",
  "How did you take care of yourself today?",
  "What did you learn about yourself?",
  "What would you like to let go of from today?",
  "What are you looking forward to tomorrow?",
  "How did you connect with others today?",
  "What small moment brought you joy?",
]

export default function Dashboard() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTodo, setNewTodo] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "Welcome to your journal space. I'm here to help you reflect on your day. Let's start with something simple - how are you feeling right now?",
      isUser: false,
      timestamp: new Date(),
    },
  ])
  const [currentInput, setCurrentInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [questionIndex, setQuestionIndex] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Mock journal entries
  const [journalEntries] = useState<JournalEntry[]>([
    {
      id: "1",
      preview: "Today was challenging but I learned a lot about resilience. The morning started rough but...",
      mood: "Reflective",
      createdAt: new Date(Date.now() - 86400000), // Yesterday
      wordCount: 234,
    },
    {
      id: "2",
      preview: "Feeling grateful for the small moments today. Had a wonderful conversation with my colleague...",
      mood: "Grateful",
      createdAt: new Date(Date.now() - 172800000), // 2 days ago
      wordCount: 189,
    },
    {
      id: "3",
      preview: "Accomplished my reading goal today! Finished that book I've been working on for weeks...",
      mood: "Accomplished",
      createdAt: new Date(Date.now() - 259200000), // 3 days ago
      wordCount: 156,
    },
  ])

  const addTodo = (text: string, category: Todo["category"] = "growth") => {
    if (!text.trim()) return

    const newTodoItem: Todo = {
      id: Date.now().toString(),
      text: text.trim(),
      completed: false,
      category,
      createdAt: new Date(),
    }

    setTodos((prev) => [...prev, newTodoItem])
    setNewTodo("")
  }

  const toggleTodo = (id: string) => {
    setTodos((prev) => prev.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)))
  }

  const addSuggestedTodo = (suggestion: (typeof growthSuggestions)[0]) => {
    addTodo(suggestion.text, suggestion.category)
  }

  const getNextQuestion = () => {
    const responses = [
      "That's really insightful. Thank you for sharing that with me.",
      "I appreciate you opening up about that.",
      "It sounds like you've given this some thought.",
      "Thank you for being so honest with yourself.",
      "That's a beautiful way to look at it.",
      "I can hear the emotion in your words.",
      "It takes courage to reflect like this.",
    ]

    const randomResponse = responses[Math.floor(Math.random() * responses.length)]
    const nextQuestion = journalQuestions[(questionIndex + 1) % journalQuestions.length]

    return `${randomResponse} ${nextQuestion}`
  }

  const handleSendMessage = async () => {
    if (!currentInput.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: currentInput,
      isUser: true,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setCurrentInput("")
    setIsTyping(true)

    // Simulate AI thinking time
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: getNextQuestion(),
        isUser: false,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiResponse])
      setQuestionIndex((prev) => (prev + 1) % journalQuestions.length)
      setIsTyping(false)
    }, 1500)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const completedCount = todos.filter((todo) => todo.completed).length
  const totalCount = todos.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Navigation Bar */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
              <BookOpen className="h-6 w-6 text-slate-600" />
              <span className="text-xl font-semibold text-slate-800">Mindful Growth</span>
            </div>

            <div className="hidden md:flex items-center space-x-6">
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-800">
                <Calendar className="h-4 w-4 mr-2" />
                Entries
              </Button>
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-800">
                <User className="h-4 w-4 mr-2" />
                Profile
              </Button>
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-800">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/20" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-slate-200 p-4">
            <div className="space-y-2">
              <Button variant="ghost" className="w-full justify-start text-slate-600">
                <Calendar className="h-4 w-4 mr-2" />
                Entries
              </Button>
              <Button variant="ghost" className="w-full justify-start text-slate-600">
                <User className="h-4 w-4 mr-2" />
                Profile
              </Button>
              <Button variant="ghost" className="w-full justify-start text-slate-600">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Dashboard */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Good morning! ✨</h1>
          <p className="text-slate-600">Let's make today meaningful with reflection and growth.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Growth Tasks */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-slate-800">
                    <Target className="h-5 w-5 mr-2 text-emerald-600" />
                    Today's Growth
                  </CardTitle>
                  <Badge variant="outline" className="text-slate-600">
                    {completedCount}/{totalCount} completed
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add new todo */}
                <div className="flex space-x-2">
                  <Input
                    value={newTodo}
                    onChange={(e) => setNewTodo(e.target.value)}
                    placeholder="Add a growth goal for today..."
                    onKeyPress={(e) => e.key === "Enter" && addTodo(newTodo)}
                    className="flex-1"
                  />
                  <Button onClick={() => addTodo(newTodo)} className="bg-emerald-500 hover:bg-emerald-600">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Todo list */}
                <div className="space-y-3">
                  {todos.map((todo) => {
                    const IconComponent = categoryIcons[todo.category]
                    return (
                      <div
                        key={todo.id}
                        className="flex items-center space-x-3 p-3 rounded-lg bg-slate-50 border border-slate-100"
                      >
                        <Checkbox
                          checked={todo.completed}
                          onCheckedChange={() => toggleTodo(todo.id)}
                          className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                        />
                        <IconComponent className="h-4 w-4 text-slate-500" />
                        <span
                          className={cn(
                            "flex-1 text-sm",
                            todo.completed ? "line-through text-slate-500" : "text-slate-800",
                          )}
                        >
                          {todo.text}
                        </span>
                        <Badge variant="outline" className={cn("text-xs", categoryColors[todo.category])}>
                          {todo.category}
                        </Badge>
                      </div>
                    )
                  })}
                </div>

                {/* Growth suggestions */}
                {todos.length === 0 && (
                  <div className="space-y-3">
                    <p className="text-sm text-slate-600 font-medium">Suggested growth activities:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {growthSuggestions.slice(0, 4).map((suggestion, index) => {
                        const IconComponent = categoryIcons[suggestion.category]
                        return (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => addSuggestedTodo(suggestion)}
                            className="justify-start h-auto p-3 text-left"
                          >
                            <IconComponent className="h-4 w-4 mr-2 text-slate-500" />
                            <span className="text-sm">{suggestion.text}</span>
                          </Button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Journal Entries */}
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-slate-800">
                  <MessageCircle className="h-5 w-5 mr-2 text-blue-600" />
                  Recent Reflections
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {journalEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-4 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="outline" className="text-xs text-slate-600">
                        {entry.mood}
                      </Badge>
                      <div className="flex items-center text-xs text-slate-500 space-x-2">
                        <Clock className="h-3 w-3" />
                        <span>{entry.createdAt.toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{entry.wordCount} words</span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-700 line-clamp-2">{entry.preview}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Start New Journal Session */}
          <div className="space-y-6">
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-slate-800">
                  <Sparkles className="h-5 w-5 mr-2 text-purple-600" />
                  Journal Session
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-600">
                  Take a moment to reflect on your thoughts, feelings, and experiences.
                </p>
                <Link href="/journal" className="block">
                  <Button className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Start New Journal
                  </Button>
                </Link>

                <div className="pt-4 border-t border-slate-200">
                  <h4 className="text-sm font-medium text-slate-800 mb-3">Quick Check-in</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {["😊", "😔", "😤", "🤔", "😌", "😴"].map((emoji) => (
                      <Button key={emoji} variant="outline" size="sm" className="h-12">
                        <span className="text-2xl">{emoji}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Progress Overview */}
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-slate-800">
                  <CheckCircle2 className="h-5 w-5 mr-2 text-green-600" />
                  This Week
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Journal entries</span>
                    <Badge variant="outline" className="text-green-700 bg-green-50">
                      3
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Growth goals completed</span>
                    <Badge variant="outline" className="text-blue-700 bg-blue-50">
                      12
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Mindful moments</span>
                    <Badge variant="outline" className="text-purple-700 bg-purple-50">
                      8
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
