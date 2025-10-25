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

// Timing utility
class TimingTracker {
  private timings: { [key: string]: number } = {}
  private startTime: number = Date.now()

  start(step: string) {
    this.timings[step] = Date.now()
    debugLog(`TIMING_START_${step}`, { step, timestamp: this.timings[step] })
  }

  end(step: string) {
    const endTime = Date.now()
    const duration = endTime - (this.timings[step] || this.startTime)
    debugLog(`TIMING_END_${step}`, { step, duration: `${duration}ms` })
    return duration
  }

  getTimings() {
    const totalTime = Date.now() - this.startTime
    return { ...this.timings, totalTime }
  }
}

// Direct OpenAI integration (fastest and most reliable)
async function fetchOpenAIResponse(prompt: string, conversationHistory: Array<{role: string, content: string}> = [], timing: TimingTracker) {
  timing.start('OPENAI_REQUEST')
  debugLog('OPENAI_START', { prompt: prompt.substring(0, 100) + '...', historyLength: conversationHistory.length })
  
  try {
    // Check if API key exists
    if (!process.env.OPENAI_API_KEY) {
      const error = 'OPENAI_API_KEY environment variable is not set'
      debugLog('OPENAI_API_KEY_MISSING', null, error)
      throw new Error(error)
    }

    // Convert conversation history to OpenAI format
    const messages = [
      {
        role: "system",
        content: "شما آرش هستید، یک دستیار هوشمند مفید. شما دوستانه، دانشمند و پاسخ‌های مفیدی ارائه می‌دهید. پاسخ‌های خود را گفتگویی و جذاب نگه دارید. اگر در مورد خودتان سوال شد، می‌توانید بگویید که یک دستیار هوشمند هستید که برای کمک به کاربران در کارهای مختلف ایجاد شده‌اید. همیشه به فارسی پاسخ دهید."
      },
      ...conversationHistory.map(msg => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content
      })),
      {
        role: "user",
        content: prompt
      }
    ]

    const requestBody = {
      model: "gpt-3.5-turbo",
      messages: messages,
      max_tokens: 300, // Shorter for faster response
      temperature: 0.7,
      stream: false
    }

    debugLog('OPENAI_REQUEST_BODY', { 
      model: requestBody.model,
      messageCount: messages.length,
      promptLength: prompt.length 
    })

    const apiUrl = "https://api.openai.com/v1/chat/completions"
    const requestOptions = {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody),
      timeout: 5000, // Very fast timeout
    }

    debugLog('OPENAI_MAKING_REQUEST', 'Starting fetch request to OpenAI API')
    const response = await fetchWithTimeout(apiUrl, requestOptions)
    const responseTime = timing.end('OPENAI_REQUEST')
    
    debugLog('OPENAI_RESPONSE_RECEIVED', { 
      status: response.status, 
      statusText: response.statusText,
      ok: response.ok,
      responseTime: `${responseTime}ms`
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Could not read error response')
      debugLog('OPENAI_API_ERROR', null, { 
        status: response.status, 
        statusText: response.statusText, 
        errorText 
      })
      throw new Error(`OpenAI API returned ${response.status}: ${errorText}`)
    }

    timing.start('OPENAI_PARSE')
    debugLog('OPENAI_PARSING_RESPONSE', 'Attempting to parse JSON response')
    const data = await response.json().catch((parseError) => {
      debugLog('OPENAI_JSON_PARSE_ERROR', null, parseError)
      throw new Error(`Failed to parse OpenAI response: ${parseError.message}`)
    })
    
    const parseTime = timing.end('OPENAI_PARSE')
    debugLog('OPENAI_RAW_RESPONSE', { 
      hasChoices: !!data?.choices,
      choicesLength: data?.choices?.length || 0,
      firstChoice: data?.choices?.[0] ? 'exists' : 'missing',
      parseTime: `${parseTime}ms`
    })

    const responseText = data?.choices?.[0]?.message?.content?.trim()
    debugLog('OPENAI_EXTRACTED_TEXT', { 
      hasText: !!responseText,
      textLength: responseText?.length || 0,
      textPreview: responseText?.substring(0, 100) + (responseText?.length > 100 ? '...' : '')
    })
    
    if (!responseText) {
      debugLog('OPENAI_NO_RESPONSE_TEXT', null, { 
        dataStructure: JSON.stringify(data, null, 2).substring(0, 500)
      })
      throw new Error('No response text received from OpenAI. Check API response structure.')
    }

    debugLog('OPENAI_SUCCESS', { 
      responseLength: responseText.length,
      totalTime: `${responseTime + parseTime}ms`
    })
    
    return { 
      response: responseText, 
      model: "gpt-3.5-turbo",
      provider: 'openai',
      timings: {
        requestTime: responseTime,
        parseTime: parseTime,
        totalTime: responseTime + parseTime
      }
    }
  } catch (error) {
    const totalTime = timing.end('OPENAI_REQUEST')
    debugLog('OPENAI_REQUEST_FAILED', null, { error, totalTime: `${totalTime}ms` })
    throw error
  }
}

// OpenRouter fallback function
async function fetchOpenRouterResponse(prompt: string, conversationHistory: Array<{role: string, content: string}> = [], timing: TimingTracker) {
  timing.start('OPENROUTER_REQUEST')
  debugLog('OPENROUTER_START', { prompt: prompt.substring(0, 100) + '...', historyLength: conversationHistory.length })
  
  try {
    // Check if API key exists
    if (!process.env.OPENROUTER_API_KEY) {
      const error = 'OPENROUTER_API_KEY environment variable is not set'
      debugLog('OPENROUTER_API_KEY_MISSING', null, error)
      throw new Error(error)
    }

    // Available models (prioritizing speed and reliability)
    const models = [
      "openai/gpt-3.5-turbo", // Fast, reliable, cheap
      "anthropic/claude-3-haiku", // Very fast, good quality
      "deepseek/deepseek-chat-v3-0324:free", // Free fallback
      "microsoft/phi-3-mini-128k-instruct:free" // Free fallback
    ]
    
    // Use first model (most reliable) or rotate for variety
    const model = models[0] // Use GPT-3.5-turbo for reliability
    debugLog('OPENROUTER_MODEL_SELECTED', { model })

    // Convert conversation history to OpenRouter format
    const messages = [
      {
        role: "system",
        content: "شما آرش هستید، یک دستیار هوشمند مفید. شما دوستانه، دانشمند و پاسخ‌های مفیدی ارائه می‌دهید. پاسخ‌های خود را گفتگویی و جذاب نگه دارید. اگر در مورد خودتان سوال شد، می‌توانید بگویید که یک دستیار هوشمند هستید که برای کمک به کاربران در کارهای مختلف ایجاد شده‌اید. همیشه به فارسی پاسخ دهید."
      },
      ...conversationHistory.map(msg => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content
      })),
      {
        role: "user",
        content: prompt
      }
    ]

    const requestBody = {
      model: model,
      messages: messages,
      max_tokens: 512, // Reduced for faster response
      temperature: 0.7,
      stream: false
    }

    debugLog('OPENROUTER_REQUEST_BODY', { 
      model, 
      messageCount: messages.length,
      promptLength: prompt.length 
    })

    const apiUrl = "https://openrouter.ai/api/v1/chat/completions"
    const requestOptions = {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER || "http://localhost:3000",
        "X-Title": process.env.OPENROUTER_TITLE || "Infinite 3D Explorer"
      },
      body: JSON.stringify(requestBody),
      timeout: 8000, // Reduced timeout for faster failure detection
    }

    debugLog('OPENROUTER_MAKING_REQUEST', 'Starting fetch request to OpenRouter API')
    const response = await fetchWithTimeout(apiUrl, requestOptions)
    const responseTime = timing.end('OPENROUTER_REQUEST')
    
    debugLog('OPENROUTER_RESPONSE_RECEIVED', { 
      status: response.status, 
      statusText: response.statusText,
      ok: response.ok,
      responseTime: `${responseTime}ms`
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Could not read error response')
      debugLog('OPENROUTER_API_ERROR', null, { 
        status: response.status, 
        statusText: response.statusText, 
        errorText 
      })
      throw new Error(`OpenRouter API returned ${response.status}: ${errorText}`)
    }

    timing.start('OPENROUTER_PARSE')
    debugLog('OPENROUTER_PARSING_RESPONSE', 'Attempting to parse JSON response')
    const data = await response.json().catch((parseError) => {
      debugLog('OPENROUTER_JSON_PARSE_ERROR', null, parseError)
      throw new Error(`Failed to parse OpenRouter response: ${parseError.message}`)
    })
    
    const parseTime = timing.end('OPENROUTER_PARSE')
    debugLog('OPENROUTER_RAW_RESPONSE', { 
      hasChoices: !!data?.choices,
      choicesLength: data?.choices?.length || 0,
      firstChoice: data?.choices?.[0] ? 'exists' : 'missing',
      parseTime: `${parseTime}ms`
    })

    const responseText = data?.choices?.[0]?.message?.content?.trim()
    debugLog('OPENROUTER_EXTRACTED_TEXT', { 
      hasText: !!responseText,
      textLength: responseText?.length || 0,
      textPreview: responseText?.substring(0, 100) + (responseText?.length > 100 ? '...' : '')
    })
    
    if (!responseText) {
      debugLog('OPENROUTER_NO_RESPONSE_TEXT', null, { 
        dataStructure: JSON.stringify(data, null, 2).substring(0, 500)
      })
      throw new Error('No response text received from OpenRouter. Check API response structure.')
    }

    debugLog('OPENROUTER_SUCCESS', { 
      responseLength: responseText.length,
      model,
      totalTime: `${responseTime + parseTime}ms`
    })
    
    return { 
      response: responseText, 
      model: model,
      provider: 'openrouter',
      timings: {
        requestTime: responseTime,
        parseTime: parseTime,
        totalTime: responseTime + parseTime
      }
    }
  } catch (error) {
    const totalTime = timing.end('OPENROUTER_REQUEST')
    debugLog('OPENROUTER_REQUEST_FAILED', null, { error, totalTime: `${totalTime}ms` })
    throw error
  }
}

async function fetchGeminiResponse(prompt: string, conversationHistory: Array<{role: string, content: string}> = [], timing: TimingTracker) {
  timing.start('GEMINI_REQUEST')
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
        maxOutputTokens: 512, // Reduced for faster response
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
        timeout: 8000, // Reduced timeout for faster failure detection
      }

    debugLog('GEMINI_REQUEST_OPTIONS', { 
      method: requestOptions.method, 
      headers: requestOptions.headers,
      bodyLength: requestOptions.body.length 
    })

    debugLog('GEMINI_MAKING_REQUEST', 'Starting fetch request to Gemini API')
    const response = await fetchWithTimeout(apiUrl, requestOptions)
    const responseTime = timing.end('GEMINI_REQUEST')
    
    debugLog('GEMINI_RESPONSE_RECEIVED', { 
      status: response.status, 
      statusText: response.statusText,
      ok: response.ok,
      responseTime: `${responseTime}ms`,
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

    timing.start('GEMINI_PARSE')
    debugLog('GEMINI_PARSING_RESPONSE', 'Attempting to parse JSON response')
    const data = await response.json().catch((parseError) => {
      debugLog('GEMINI_JSON_PARSE_ERROR', null, parseError)
      throw new Error(`Failed to parse Gemini response: ${parseError.message}`)
    })
    
    const parseTime = timing.end('GEMINI_PARSE')
    debugLog('GEMINI_RAW_RESPONSE', { 
      hasCandidates: !!data?.candidates,
      candidatesLength: data?.candidates?.length || 0,
      firstCandidate: data?.candidates?.[0] ? 'exists' : 'missing',
      parseTime: `${parseTime}ms`
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

    debugLog('GEMINI_SUCCESS', { 
      responseLength: responseText.length,
      totalTime: `${responseTime + parseTime}ms`
    })
    
    return { 
      response: responseText, 
      provider: 'gemini',
      timings: {
        requestTime: responseTime,
        parseTime: parseTime,
        totalTime: responseTime + parseTime
      }
    }
  } catch (error) {
    const totalTime = timing.end('GEMINI_REQUEST')
    debugLog('GEMINI_REQUEST_FAILED', null, { error, totalTime: `${totalTime}ms` })
    throw error
  }
}

export async function POST(request: NextRequest) {
  const timing = new TimingTracker()
  timing.start('TOTAL_REQUEST')
  debugLog('CHAT_API_START', 'POST request received')
  
  try {
    timing.start('PARSE_BODY')
    debugLog('CHAT_API_PARSING_BODY', 'Attempting to parse request body')
    const body = await request.json().catch((parseError) => {
      debugLog('CHAT_API_BODY_PARSE_ERROR', null, parseError)
      throw new Error(`Failed to parse request body: ${parseError.message}`)
    })
    const parseTime = timing.end('PARSE_BODY')
    
    debugLog('CHAT_API_BODY_PARSED', { 
      hasMessage: !!body.message,
      messageType: typeof body.message,
      hasHistory: !!body.conversationHistory,
      historyType: Array.isArray(body.conversationHistory) ? 'array' : typeof body.conversationHistory,
      parseTime: `${parseTime}ms`
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

    timing.start('LLM_CALL')
    debugLog('CHAT_API_CALLING_LLM', 'Starting LLM API call (OpenAI first, OpenRouter fallback, Gemini last)')
    
    let result
    let provider = 'unknown'
    
    try {
      // Try OpenAI first (fastest and most reliable)
      result = await fetchOpenAIResponse(trimmedMessage, recentHistory, timing)
      provider = 'openai'
      debugLog('CHAT_API_OPENAI_SUCCESS', { responseLength: result.response.length })
    } catch (openaiError) {
      debugLog('CHAT_API_OPENAI_FAILED', null, openaiError)
      debugLog('CHAT_API_FALLBACK_TO_OPENROUTER', 'OpenAI failed, trying OpenRouter')
      
      try {
        // Fallback to OpenRouter
        result = await fetchOpenRouterResponse(trimmedMessage, recentHistory, timing)
        provider = 'openrouter'
        debugLog('CHAT_API_OPENROUTER_SUCCESS', { responseLength: result.response.length })
      } catch (openrouterError) {
        debugLog('CHAT_API_OPENROUTER_FAILED', null, openrouterError)
        debugLog('CHAT_API_FALLBACK_TO_GEMINI', 'OpenRouter failed, trying Gemini')
        
        try {
          // Last resort: Gemini
          result = await fetchGeminiResponse(trimmedMessage, recentHistory, timing)
          provider = 'gemini'
          debugLog('CHAT_API_GEMINI_SUCCESS', { responseLength: result.response.length })
        } catch (geminiError) {
          debugLog('CHAT_API_GEMINI_FAILED', null, geminiError)
          throw new Error(`All APIs failed. OpenAI: ${openaiError.message}, OpenRouter: ${openrouterError.message}, Gemini: ${geminiError.message}`)
        }
      }
    }
    
    const llmTime = timing.end('LLM_CALL')
    const totalTime = timing.end('TOTAL_REQUEST')
    
    const response = {
      success: true,
      response: result.response,
      timestamp: Date.now(),
      provider: provider,
      model: result.model || 'gemini-2.5-pro',
      debug: {
        messageLength: trimmedMessage.length,
        historyLength: recentHistory.length,
        responseLength: result.response.length,
        timings: {
          parseTime: parseTime,
          llmTime: llmTime,
          totalTime: totalTime,
          ...result.timings
        },
        step: 'success'
      }
    }

    debugLog('CHAT_API_RESPONSE_SUCCESS', response)
    return NextResponse.json(response)

  } catch (error: any) {
    const totalTime = timing.end('TOTAL_REQUEST')
    debugLog('CHAT_API_ERROR', null, error)
    
    const errorResponse = {
      error: true,
      message: 'Failed to get AI response',
      details: error.message || 'Unknown error',
      debug: {
        errorType: error.constructor.name,
        errorMessage: error.message,
        errorStack: error.stack?.substring(0, 500),
        totalTime: totalTime,
        timings: timing.getTimings(),
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