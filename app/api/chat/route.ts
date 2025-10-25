import { NextRequest, NextResponse } from 'next/server'

async function fetchWithTimeout(resource: string, options: any) {
  const { timeout = 15000 } = options || {}
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  const response = await fetch(resource, { ...options, signal: controller.signal })
  clearTimeout(id)
  return response
}

// Debug logging function
function debugLog(step: string, data: any, error?: any) {
  const timestamp = new Date().toISOString()
  if (error) {
    console.error(`[${timestamp}] DEBUG ${step}:`, error)
  } else {
    console.log(`[${timestamp}] DEBUG ${step}:`, data)
  }
}

async function fetchGeminiResponse(prompt: string, conversationHistory: Array<{role: string, content: string}> = []) {
  debugLog('GEMINI_START', { prompt: prompt.substring(0, 100) + '...', historyLength: conversationHistory.length })
  
  try {
    // Check if API key exists
    if (!process.env.GEMINI_API_KEY) {
      const error = 'GEMINI_API_KEY environment variable is not set'
      debugLog('GEMINI_API_KEY_MISSING', null, error)
      throw new Error(error)
    }
    
    debugLog('GEMINI_API_KEY_CHECK', 'API key exists')

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

    debugLog('GEMINI_REQUEST_BODY', { 
      messageCount: messages.length, 
      promptLength: prompt.length,
      historyLength: conversationHistory.length 
    })

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${process.env.GEMINI_API_KEY}`
    debugLog('GEMINI_API_URL', apiUrl.replace(process.env.GEMINI_API_KEY, 'HIDDEN_KEY'))

    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      timeout: 15000,
    }

    debugLog('GEMINI_REQUEST_OPTIONS', { 
      method: requestOptions.method, 
      headers: requestOptions.headers,
      bodyLength: requestOptions.body.length 
    })

    debugLog('GEMINI_MAKING_REQUEST', 'Starting fetch request to Gemini API')
    const response = await fetchWithTimeout(apiUrl, requestOptions)
    debugLog('GEMINI_RESPONSE_RECEIVED', { 
      status: response.status, 
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Could not read error response')
      debugLog('GEMINI_API_ERROR', null, { 
        status: response.status, 
        statusText: response.statusText, 
        errorText 
      })
      throw new Error(`Gemini API returned ${response.status}: ${errorText}`)
    }

    debugLog('GEMINI_PARSING_RESPONSE', 'Attempting to parse JSON response')
    const data = await response.json().catch((parseError) => {
      debugLog('GEMINI_JSON_PARSE_ERROR', null, parseError)
      throw new Error(`Failed to parse Gemini response: ${parseError.message}`)
    })
    
    debugLog('GEMINI_RAW_RESPONSE', { 
      hasCandidates: !!data?.candidates,
      candidatesLength: data?.candidates?.length || 0,
      firstCandidate: data?.candidates?.[0] ? 'exists' : 'missing'
    })

    const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    debugLog('GEMINI_EXTRACTED_TEXT', { 
      hasText: !!responseText,
      textLength: responseText?.length || 0,
      textPreview: responseText?.substring(0, 100) + (responseText?.length > 100 ? '...' : '')
    })
    
    if (!responseText) {
      debugLog('GEMINI_NO_RESPONSE_TEXT', null, { 
        dataStructure: JSON.stringify(data, null, 2).substring(0, 500)
      })
      throw new Error('No response text received from Gemini. Check API response structure.')
    }

    debugLog('GEMINI_SUCCESS', { responseLength: responseText.length })
    return { response: responseText }
  } catch (error) {
    debugLog('GEMINI_REQUEST_FAILED', null, error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  debugLog('CHAT_API_START', 'POST request received')
  
  try {
    debugLog('CHAT_API_PARSING_BODY', 'Attempting to parse request body')
    const body = await request.json().catch((parseError) => {
      debugLog('CHAT_API_BODY_PARSE_ERROR', null, parseError)
      throw new Error(`Failed to parse request body: ${parseError.message}`)
    })
    
    debugLog('CHAT_API_BODY_PARSED', { 
      hasMessage: !!body.message,
      messageType: typeof body.message,
      hasHistory: !!body.conversationHistory,
      historyType: Array.isArray(body.conversationHistory) ? 'array' : typeof body.conversationHistory
    })

    const { message, conversationHistory = [] } = body

    if (!message || typeof message !== 'string') {
      debugLog('CHAT_API_VALIDATION_ERROR', null, { 
        message: message, 
        messageType: typeof message 
      })
      return NextResponse.json(
        { 
          error: true, 
          message: 'Message is required and must be a string',
          debug: {
            receivedMessage: message,
            messageType: typeof message,
            step: 'message_validation'
          }
        },
        { status: 400 }
      )
    }

    const trimmedMessage = message.trim()
    if (!trimmedMessage) {
      debugLog('CHAT_API_EMPTY_MESSAGE', null, { originalMessage: message })
      return NextResponse.json(
        { 
          error: true, 
          message: 'Message cannot be empty',
          debug: {
            originalMessage: message,
            step: 'message_trim_validation'
          }
        },
        { status: 400 }
      )
    }

    // Validate conversation history format
    if (!Array.isArray(conversationHistory)) {
      debugLog('CHAT_API_HISTORY_VALIDATION_ERROR', null, { 
        history: conversationHistory, 
        historyType: typeof conversationHistory 
      })
      return NextResponse.json(
        { 
          error: true, 
          message: 'Conversation history must be an array',
          debug: {
            receivedHistory: conversationHistory,
            historyType: typeof conversationHistory,
            step: 'history_validation'
          }
        },
        { status: 400 }
      )
    }

    debugLog('CHAT_API_VALIDATION_SUCCESS', { 
      messageLength: trimmedMessage.length,
      historyLength: conversationHistory.length
    })

    // Limit conversation history to last 10 messages to avoid token limits
    const recentHistory = conversationHistory.slice(-10)
    debugLog('CHAT_API_HISTORY_LIMITED', { 
      originalLength: conversationHistory.length,
      limitedLength: recentHistory.length
    })

    debugLog('CHAT_API_CALLING_GEMINI', 'Starting Gemini API call')
    const result = await fetchGeminiResponse(trimmedMessage, recentHistory)
    debugLog('CHAT_API_GEMINI_SUCCESS', { responseLength: result.response.length })

    const response = {
      success: true,
      response: result.response,
      timestamp: Date.now(),
      debug: {
        messageLength: trimmedMessage.length,
        historyLength: recentHistory.length,
        responseLength: result.response.length,
        step: 'success'
      }
    }

    debugLog('CHAT_API_RESPONSE_SUCCESS', response)
    return NextResponse.json(response)

  } catch (error: any) {
    debugLog('CHAT_API_ERROR', null, error)
    
    const errorResponse = {
      error: true,
      message: 'Failed to get AI response',
      details: error.message || 'Unknown error',
      debug: {
        errorType: error.constructor.name,
        errorMessage: error.message,
        errorStack: error.stack?.substring(0, 500),
        step: 'catch_block'
      }
    }

    debugLog('CHAT_API_ERROR_RESPONSE', errorResponse)
    return NextResponse.json(errorResponse, { status: 500 })
  }
}

// Handle GET requests with a simple test
export async function GET() {
  debugLog('CHAT_API_GET', 'GET request received')
  
  const response = {
    success: true,
    message: 'Chat API is working',
    timestamp: Date.now(),
    debug: {
      environment: process.env.NODE_ENV,
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      step: 'health_check'
    }
  }
  
  debugLog('CHAT_API_GET_RESPONSE', response)
  return NextResponse.json(response)
}