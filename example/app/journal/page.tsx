"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Send, ArrowLeft, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface Message {
  id: string
  content: string
  isUser: boolean
  timestamp: Date
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

export default function JournalSession() {
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-slate-600" />
              <span className="font-semibold text-slate-800">Journal Session</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="max-w-4xl mx-auto px-4 py-6 h-[calc(100vh-5rem)] flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-6">
          {messages.map((message) => (
            <div key={message.id} className={cn("flex", message.isUser ? "justify-end" : "justify-start")}>
              <Card
                className={cn(
                  "max-w-[80%] p-4 shadow-sm",
                  message.isUser
                    ? "bg-emerald-500 text-white border-emerald-500"
                    : "bg-white text-slate-800 border-slate-200",
                )}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
                <p className={cn("text-xs mt-2 opacity-70", message.isUser ? "text-emerald-100" : "text-slate-500")}>
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </Card>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <Card className="bg-white text-slate-800 border-slate-200 p-4 shadow-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                  <div
                    className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <div
                    className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
              </Card>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <div className="flex space-x-3">
            <Input
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Share your thoughts..."
              className="flex-1 border-0 focus-visible:ring-0 text-slate-800 placeholder:text-slate-500"
              disabled={isTyping}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!currentInput.trim() || isTyping}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
