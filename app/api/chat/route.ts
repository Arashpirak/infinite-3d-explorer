import { NextRequest, NextResponse } from 'next/server'

async function fetchWithTimeout(resource: string, options: any) {
  const { timeout = 15000 } = options || {}
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  const response = await fetch(resource, { ...options, signal: controller.signal })
  clearTimeout(id)
  return response
}

async function fetchGeminiResponse(prompt: string, conversationHistory: Array<{role: string, content: string}> = []) {
  try {
    // Create conversation context with history
    const messages = [
      {
        role: "user",
        parts: [{ text: "شما آرش هستید، یک دستیار هوشمند مفید. شما دوستانه، دانشمند و پاسخ‌های مفیدی ارائه می‌دهید. پاسخ‌های خود را گفتگویی و جذاب نگه دارید. اگر در مورد خودتان سوال شد، می‌توانید بگویید که یک دستیار هوشمند هستید که برای کمک به کاربران در کارهای مختلف ایجاد شده‌اید. همیشه به فارسی پاسخ دهید." }]
      },
      ...conversationHistory.map(msg => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }]
      })),
      {
        role: "user",
        parts: [{ text: prompt }]
      }
    ]

    const requestBody = {
      contents: messages,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    }

    console.log('Gemini API request:', JSON.stringify(requestBody, null, 2))

    const response = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        timeout: 15000,
      }
    )

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      console.error(`Gemini API error: ${response.status} ${response.statusText}`, errorText)
      throw new Error(`Gemini API returned ${response.status}: ${errorText}`)
    }

    const data = await response.json().catch(() => null)
    
    if (process.env.NODE_ENV !== "production") {
      console.log('Gemini raw response:', JSON.stringify(data, null, 2))
    }

    const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    
    if (!responseText) {
      throw new Error('No response text received from Gemini')
    }

    return { response: responseText }
  } catch (error) {
    console.error('Gemini request failed:', error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, conversationHistory = [] } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: true, message: 'Message is required and must be a string' },
        { status: 400 }
      )
    }

    const trimmedMessage = message.trim()
    if (!trimmedMessage) {
      return NextResponse.json(
        { error: true, message: 'Message cannot be empty' },
        { status: 400 }
      )
    }

    // Validate conversation history format
    if (!Array.isArray(conversationHistory)) {
      return NextResponse.json(
        { error: true, message: 'Conversation history must be an array' },
        { status: 400 }
      )
    }

    // Limit conversation history to last 10 messages to avoid token limits
    const recentHistory = conversationHistory.slice(-10)

    const result = await fetchGeminiResponse(trimmedMessage, recentHistory)

    return NextResponse.json({
      success: true,
      response: result.response,
      timestamp: Date.now()
    })

  } catch (error: any) {
    console.error('Chat API error:', error)
    
    return NextResponse.json(
      {
        error: true,
        message: 'Failed to get AI response',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Handle GET requests with a simple test
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Chat API is working',
    timestamp: Date.now()
  })
}
