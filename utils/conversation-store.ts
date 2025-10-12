export type ChatMessage = {
  text: string
  sender: "user" | "ai"
  timestamp: number
}

type Listener = (messages: ChatMessage[]) => void

class ConversationStore {
  private messages: ChatMessage[] = []
  private listeners: Listener[] = []

  addMessage(text: string, sender: "user" | "ai") {
    this.messages.push({
      text,
      sender,
      timestamp: Date.now(),
    })
    this.notifyListeners()
  }

  getMessages() {
    return this.messages
  }

  getConversationHistory() {
    // Convert messages to format expected by API
    return this.messages.map(msg => ({
      role: msg.sender === "user" ? "user" : "assistant",
      content: msg.text
    }))
  }

  clearMessages() {
    this.messages = []
    this.notifyListeners()
  }

  subscribe(listener: Listener) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.messages))
  }
}

export const conversationStore = new ConversationStore()
