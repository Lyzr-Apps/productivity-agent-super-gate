'use client'

import { useState, useEffect, useRef } from 'react'
import { FiTarget, FiUser, FiSend } from 'react-icons/fi'
import { callAIAgent } from '@/lib/aiAgent'

// Theme Variables - Forest Light
const THEME_VARS = {
  '--background': '120 15% 98%',
  '--foreground': '150 30% 10%',
  '--card': '120 15% 96%',
  '--card-foreground': '150 30% 10%',
  '--primary': '142 76% 26%',
  '--primary-foreground': '120 15% 98%',
  '--secondary': '120 15% 92%',
  '--accent': '160 60% 30%',
  '--border': '120 15% 88%',
  '--input': '120 12% 80%',
} as React.CSSProperties

// TypeScript Interfaces
interface AgentResponse {
  coaching_advice: string
  actionable_steps: string[]
  relevant_frameworks: string[]
  follow_up_suggestions: string[]
}

interface Message {
  id: string
  role: 'user' | 'agent'
  content: string
  agentResponse?: AgentResponse
  timestamp: Date
}

// Helper function for rendering markdown-like text
function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### '))
          return (
            <h4 key={i} className="font-semibold text-sm mt-3 mb-1">
              {line.slice(4)}
            </h4>
          )
        if (line.startsWith('## '))
          return (
            <h3 key={i} className="font-semibold text-base mt-3 mb-1">
              {line.slice(3)}
            </h3>
          )
        if (line.startsWith('# '))
          return (
            <h2 key={i} className="font-bold text-lg mt-4 mb-2">
              {line.slice(2)}
            </h2>
          )
        if (line.startsWith('- ') || line.startsWith('* '))
          return (
            <li key={i} className="ml-4 list-disc text-sm">
              {formatInline(line.slice(2))}
            </li>
          )
        if (/^\d+\.\s/.test(line))
          return (
            <li key={i} className="ml-4 list-decimal text-sm">
              {formatInline(line.replace(/^\d+\.\s/, ''))}
            </li>
          )
        if (!line.trim()) return <div key={i} className="h-1" />
        return (
          <p key={i} className="text-sm leading-relaxed">
            {formatInline(line)}
          </p>
        )
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold">
        {part}
      </strong>
    ) : (
      part
    )
  )
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showWelcome, setShowWelcome] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [inputValue])

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return

    setShowWelcome(false)
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      // Use aiAgent.ts for AI integration
      const result = await callAIAgent(message, '698e317243d49bda6d7c03a1')

      if (!result.success) {
        throw new Error(result.error || 'Failed to get response')
      }

      // Parse response according to schema
      const agentData = result.response.result || {}

      const data: AgentResponse = {
        coaching_advice: typeof agentData.coaching_advice === 'string' ? agentData.coaching_advice : '',
        actionable_steps: Array.isArray(agentData.actionable_steps) ? agentData.actionable_steps : [],
        relevant_frameworks: Array.isArray(agentData.relevant_frameworks) ? agentData.relevant_frameworks : [],
        follow_up_suggestions: Array.isArray(agentData.follow_up_suggestions) ? agentData.follow_up_suggestions : [],
      }

      const agentMessage: Message = {
        id: `agent-${Date.now()}`,
        role: 'agent',
        content: data.coaching_advice || '',
        agentResponse: data,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, agentMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'agent',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickPrompt = (prompt: string) => {
    setInputValue(prompt)
    textareaRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(inputValue)
    }
  }

  const quickPrompts = [
    'Help me prioritize',
    'Focus tips',
    'Set a goal',
    'Build a habit',
  ]

  return (
    <div style={THEME_VARS} className="min-h-screen bg-background font-sans">
      {/* Gradient Background */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: 'linear-gradient(135deg, hsl(120 25% 96%) 0%, hsl(140 30% 94%) 35%, hsl(160 25% 95%) 70%, hsl(100 20% 96%) 100%)',
        }}
      />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-10 backdrop-blur-md bg-card/75 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <FiTarget className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">
            Productivity Coach
          </h1>
        </div>
      </header>

      {/* Chat Area */}
      <main className="pt-20 pb-32 max-w-4xl mx-auto px-4">
        {/* Welcome Message */}
        {showWelcome && messages.length === 0 && (
          <div className="mb-8 animate-in fade-in duration-500">
            <div className="backdrop-blur-md bg-card/75 rounded-[0.875rem] border border-border p-6 shadow-sm">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FiUser className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 space-y-4">
                  <div className="text-foreground leading-relaxed">
                    <p className="font-medium text-base mb-2">
                      Welcome! I'm your personal productivity coach.
                    </p>
                    <p className="text-sm text-foreground/80">
                      I can help you with task management, focus strategies, goal tracking, habit building, and information filtering. Ask me anything about improving your productivity!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Prompts */}
            <div className="mt-6 space-y-3">
              <p className="text-sm font-medium text-foreground/70 px-2">
                Try asking:
              </p>
              <div className="flex flex-wrap gap-2">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleQuickPrompt(prompt)}
                    className="px-4 py-2 rounded-full bg-accent/10 hover:bg-accent/20 border border-accent/20 text-sm font-medium text-accent transition-all duration-200 hover:scale-105"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                message.role === 'user' ? 'ml-auto max-w-2xl' : 'mr-auto max-w-3xl'
              }`}
            >
              {message.role === 'user' ? (
                <div className="backdrop-blur-md bg-primary/90 rounded-[0.875rem] px-5 py-3 shadow-sm">
                  <p className="text-primary-foreground text-sm leading-relaxed">
                    {message.content}
                  </p>
                </div>
              ) : (
                <div className="backdrop-blur-md bg-card/75 rounded-[0.875rem] border border-border p-6 shadow-sm">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FiUser className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 space-y-4">
                      {/* Coaching Advice */}
                      {message.content && (
                        <div className="text-foreground">
                          {renderMarkdown(message.content)}
                        </div>
                      )}

                      {/* Actionable Steps */}
                      {message.agentResponse &&
                        Array.isArray(message.agentResponse.actionable_steps) &&
                        message.agentResponse.actionable_steps.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-foreground/80">
                              Action Steps:
                            </h4>
                            <ol className="space-y-1.5">
                              {message.agentResponse.actionable_steps.map((step, idx) => (
                                <li
                                  key={idx}
                                  className="flex gap-2 text-sm text-foreground/90"
                                >
                                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                                    {idx + 1}
                                  </span>
                                  <span className="leading-relaxed">{step}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}

                      {/* Relevant Frameworks */}
                      {message.agentResponse &&
                        Array.isArray(message.agentResponse.relevant_frameworks) &&
                        message.agentResponse.relevant_frameworks.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-foreground/80">
                              Frameworks:
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {message.agentResponse.relevant_frameworks.map((framework, idx) => (
                                <span
                                  key={idx}
                                  className="px-3 py-1 rounded-full bg-secondary text-xs font-medium text-foreground border border-border"
                                >
                                  {framework}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Follow-up Suggestions */}
                      {message.agentResponse &&
                        Array.isArray(message.agentResponse.follow_up_suggestions) &&
                        message.agentResponse.follow_up_suggestions.length > 0 && (
                          <div className="space-y-2 pt-2">
                            <h4 className="text-sm font-semibold text-foreground/80">
                              Continue with:
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {message.agentResponse.follow_up_suggestions.map((suggestion, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => handleQuickPrompt(suggestion)}
                                  className="px-3 py-1.5 rounded-full bg-accent/10 hover:bg-accent/20 border border-accent/20 text-xs font-medium text-accent transition-all duration-200 hover:scale-105"
                                >
                                  {suggestion}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Timestamp */}
                      <div className="text-xs text-foreground/40 pt-2">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="mr-auto max-w-3xl animate-in fade-in duration-300">
              <div className="backdrop-blur-md bg-card/75 rounded-[0.875rem] border border-border p-6 shadow-sm">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FiUser className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex items-center gap-1 py-2">
                    <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-10 backdrop-blur-md bg-card/75 border-t border-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1 backdrop-blur-md bg-background/50 rounded-[0.875rem] border border-input shadow-sm">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask your productivity coach..."
                className="w-full px-4 py-3 bg-transparent text-foreground placeholder:text-foreground/40 focus:outline-none resize-none max-h-32 text-sm leading-relaxed"
                rows={1}
                disabled={isLoading}
              />
            </div>
            <button
              onClick={() => handleSendMessage(inputValue)}
              disabled={!inputValue.trim() || isLoading}
              className="w-12 h-12 rounded-[0.875rem] bg-primary hover:bg-primary/90 disabled:bg-primary/40 text-primary-foreground flex items-center justify-center transition-all duration-200 hover:scale-105 disabled:hover:scale-100 shadow-sm disabled:cursor-not-allowed"
            >
              <FiSend className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
