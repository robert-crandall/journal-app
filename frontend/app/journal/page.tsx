"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Send, ArrowLeft, BookOpen, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { api, type ConversationMessage } from "@/lib/api"

interface Message {
  id: string
  content: string
  isUser: boolean
  timestamp: Date
}

export default function JournalSession() {
  const [messages, setMessages] = useState<Message[]>([])
  const [currentInput, setCurrentInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [isCompiling, setIsCompiling] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Start journal session when component mounts
  useEffect(() => {
    const startJournalSession = async () => {
      try {
        const response = await api.startJournal()
        setConversationId(response.conversationId)
        
        const initialMessage: Message = {
          id: "1",
          content: response.initialMessage,
          isUser: false,
          timestamp: new Date(),
        }
        setMessages([initialMessage])
      } catch (error) {
        console.error('Failed to start journal session:', error)
        // Fallback message if API fails
        const fallbackMessage: Message = {
          id: "1",
          content: "Welcome to your journal space. I'm here to help you reflect on your day. Let's start with something simple - how are you feeling right now?",
          isUser: false,
          timestamp: new Date(),
        }
        setMessages([fallbackMessage])
      }
    }

    startJournalSession()
  }, [])

  const handleSendMessage = async () => {
    if (!currentInput.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: currentInput,
      isUser: true,
      timestamp: new Date(),
    }

    setMessages((prev: Message[]) => [...prev, userMessage])
    const messageContent = currentInput
    setCurrentInput("")
    setIsTyping(true)

    try {
      if (conversationId) {
        const response = await api.sendMessage(conversationId, messageContent)
        
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: response.message,
          isUser: false,
          timestamp: new Date(),
        }

        setMessages((prev: Message[]) => [...prev, aiResponse])
        
        // Check if GPT indicates the conversation is complete
        if (response.isComplete) {
          setIsComplete(true)
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      // Fallback response
      const fallbackResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm having trouble connecting right now. Please try again.",
        isUser: false,
        timestamp: new Date(),
      }
      setMessages((prev: Message[]) => [...prev, fallbackResponse])
    }

    setIsTyping(false)
  }

  const handleFinishJournal = async () => {
    if (!conversationId) return

    setIsCompiling(true)
    try {
      const response = await api.compileJournal(conversationId)
      console.log('Journal compiled successfully:', response.entry)
      // Navigate back to dashboard with success
      window.location.href = '/?success=journal-saved'
    } catch (error) {
      console.error('Failed to compile journal:', error)
      alert('Failed to save journal. Please try again.')
    }
    setIsCompiling(false)
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
          {!isComplete ? (
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
              {messages.length > 2 && (
                <Button
                  onClick={handleFinishJournal}
                  disabled={isCompiling}
                  variant="outline"
                  className="border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                >
                  {isCompiling ? (
                    <>
                      <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Finish Journal
                    </>
                  )}
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-slate-600 mb-4">Your journal session is complete!</p>
              <Button
                onClick={handleFinishJournal}
                disabled={isCompiling}
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                {isCompiling ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Saving Journal...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Save Journal Entry
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
