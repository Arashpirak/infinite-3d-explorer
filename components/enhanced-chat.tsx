"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mic, MicOff, Send, Trash2, Bug } from "lucide-react"
import { conversationStore, type ChatMessage } from "@/utils/conversation-store"

interface EnhancedChatProps {
  messages: ChatMessage[]
  isTyping?: boolean
  onSendMessage?: (message: string) => void
  onClearChat?: () => void
}

export function EnhancedChat({ messages, isTyping = false, onSendMessage, onClearChat }: EnhancedChatProps) {
  const [inputMessage, setInputMessage] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setInputMessage(transcript)
        setIsRecording(false)
      }

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsRecording(false)
      }

      recognitionRef.current.onend = () => {
        setIsRecording(false)
      }
    }
  }, [])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isProcessing) return

    const message = inputMessage.trim()
    setInputMessage("")
    setIsProcessing(true)

    // Add user message to store
    conversationStore.addMessage(message, "user")

    try {
      console.log('🔍 DEBUG: Sending message to API:', { message, historyLength: conversationStore.getConversationHistory().length })
      
      // Send to AI API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          conversationHistory: conversationStore.getConversationHistory()
        }),
      })

      console.log('🔍 DEBUG: API Response status:', response.status, response.statusText)

      const data = await response.json()
      console.log('🔍 DEBUG: API Response data:', data)

      if (data.success && data.response) {
        // Add AI response to store
        conversationStore.addMessage(data.response, "ai")
        console.log('✅ DEBUG: Successfully added AI response to conversation')
      } else {
        // Handle error with detailed debugging
        const errorMessage = data.debug ? 
          `❌ خطا در API: ${data.message}\n🔍 جزئیات: ${JSON.stringify(data.debug, null, 2)}` :
          `❌ خطا در API: ${data.message || 'خطای نامشخص'}`
        
        console.error('❌ DEBUG: API Error:', data)
        conversationStore.addMessage(errorMessage, "ai")
      }
    } catch (error) {
      console.error('❌ DEBUG: Network/Fetch Error:', error)
      const errorMessage = `❌ خطا در اتصال: ${error instanceof Error ? error.message : 'خطای شبکه نامشخص'}\n🔍 لطفاً کنسول مرورگر را بررسی کنید.`
      conversationStore.addMessage(errorMessage, "ai")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const startRecording = () => {
    if (recognitionRef.current && !isRecording) {
      setIsRecording(true)
      recognitionRef.current.start()
    }
  }

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop()
      setIsRecording(false)
    }
  }

  const clearChat = () => {
    conversationStore.clearMessages()
    if (onClearChat) {
      onClearChat()
    }
  }

  const testAPIConnection = async () => {
    console.log('🔍 DEBUG: Testing API connection...')
    try {
      const response = await fetch('/api/chat', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      console.log('🔍 DEBUG: API Test Response:', data)
      
      const testMessage = data.success ? 
        `✅ تست API موفق: ${data.message}\n🔍 جزئیات: ${JSON.stringify(data.debug, null, 2)}` :
        `❌ تست API ناموفق: ${data.message || 'خطای نامشخص'}`
      
      conversationStore.addMessage(testMessage, "ai")
    } catch (error) {
      console.error('❌ DEBUG: API Test Error:', error)
      conversationStore.addMessage(`❌ خطا در تست API: ${error instanceof Error ? error.message : 'خطای نامشخص'}`, "ai")
    }
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-[#08075C] to-[#01ADEF] p-4 text-white flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">دستیار هوشمند - آرش</h3>
            <p className="text-sm text-white/80">شریک گفتگوی هوشمند شما</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={testAPIConnection}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
              title="Test API Connection"
            >
              <Bug className="h-4 w-4" />
            </Button>
            {messages.length > 0 && (
              <Button
                onClick={clearChat}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Messages Container */}
        <div className="h-64 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <p className="text-lg mb-2">👋 سلام! من آرش هستم، دستیار هوشمند شما.</p>
                <p className="text-sm">با تایپ کردن یا صحبت کردن گفتگو را شروع کنید...</p>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.sender === "user"
                      ? "bg-[#01ADEF] text-white rounded-br-none"
                      : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))
          )}

          {(isTyping || isProcessing) && (
            <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-white text-gray-800 border border-gray-200 rounded-2xl rounded-bl-none px-4 py-3">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-gray-100 p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="پیام خود را تایپ کنید..."
                disabled={isProcessing}
                className="pr-12"
              />
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                disabled={isProcessing}
              >
                {isRecording ? (
                  <MicOff className="h-4 w-4 text-red-500" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isProcessing}
              className="bg-[#01ADEF] hover:bg-[#0194D1] text-white"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            💬 پیام خود را تایپ کنید یا روی میکروفون کلیک کنید تا صحبت کنید
          </p>
        </div>
      </div>
    </div>
  )
}
