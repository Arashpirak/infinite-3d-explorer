(function () {
  // Determine the base origin of the widget host
  const thisScript = document.currentScript || (function() {
    const scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();
  let baseOrigin;
  try {
    const url = new URL(thisScript && thisScript.src ? thisScript.src : window.location.href);
    baseOrigin = url.origin;
  } catch (e) {
    baseOrigin = window.location.origin;
  }

  // Widget state
  let isMinimized = true;
  let isDragging = false;
  let isResizing = false;
  let dragOffset = { x: 0, y: 0 };
  let resizeStart = { x: 0, y: 0, width: 0, height: 0 };
  let messages = [];
  let isProcessing = false;
  let isRecording = false;
  let recognition = null;

  // Create widget container
  const widget = document.createElement("div");
  widget.id = "chatbot-widget";
  widget.style.position = "fixed";
  widget.style.bottom = "20px";
  widget.style.right = "20px";
  widget.style.width = "350px";
  widget.style.height = "500px";
  widget.style.background = "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)";
  widget.style.borderRadius = "16px";
  widget.style.boxShadow = "0px 8px 32px rgba(0, 0, 0, 0.3)";
  widget.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
  widget.style.fontSize = "14px";
  widget.style.color = "#fff";
  widget.style.zIndex = "99999";
  widget.style.transition = "all 0.3s ease-in-out";
  widget.style.overflow = "hidden";
  widget.style.border = "1px solid rgba(255, 255, 255, 0.1)";

  // Create minimize/maximize button (floating icon)
  const toggleButton = document.createElement("div");
  toggleButton.id = "chatbot-toggle";
  toggleButton.innerHTML = "🤖";
  toggleButton.style.position = "fixed";
  toggleButton.style.bottom = "20px";
  toggleButton.style.right = "20px";
  toggleButton.style.width = "60px";
  toggleButton.style.height = "60px";
  toggleButton.style.background = "linear-gradient(135deg, #08075C 0%, #01ADEF 100%)";
  toggleButton.style.borderRadius = "50%";
  toggleButton.style.display = "flex";
  toggleButton.style.alignItems = "center";
  toggleButton.style.justifyContent = "center";
  toggleButton.style.fontSize = "24px";
  toggleButton.style.cursor = "pointer";
  toggleButton.style.boxShadow = "0px 4px 16px rgba(0, 0, 0, 0.3)";
  toggleButton.style.transition = "all 0.3s ease-in-out";
  toggleButton.style.zIndex = "100000";
  toggleButton.style.border = "2px solid rgba(255, 255, 255, 0.2)";

  // Hover effects
  toggleButton.onmouseover = () => {
    toggleButton.style.transform = "scale(1.1)";
    toggleButton.style.boxShadow = "0px 6px 20px rgba(0, 0, 0, 0.4)";
  };
  toggleButton.onmouseout = () => {
    toggleButton.style.transform = "scale(1)";
    toggleButton.style.boxShadow = "0px 4px 16px rgba(0, 0, 0, 0.3)";
  };

  // Header
  const header = document.createElement("div");
  header.style.background = "linear-gradient(90deg, #08075C 0%, #01ADEF 100%)";
  header.style.padding = "16px";
  header.style.display = "flex";
  header.style.justifyContent = "space-between";
  header.style.alignItems = "center";
  header.style.cursor = "move";
  header.style.userSelect = "none";

  const headerTitle = document.createElement("div");
  headerTitle.innerHTML = `
    <div style="font-size: 16px; font-weight: 600;">دستیار هوشمند - آرش</div>
    <div style="font-size: 12px; opacity: 0.8;">شریک گفتگوی هوشمند شما</div>
  `;

  const headerButtons = document.createElement("div");
  headerButtons.style.display = "flex";
  headerButtons.style.gap = "8px";

  const minimizeBtn = document.createElement("button");
  minimizeBtn.innerHTML = "−";
  minimizeBtn.style.background = "rgba(255, 255, 255, 0.2)";
  minimizeBtn.style.border = "none";
  minimizeBtn.style.borderRadius = "4px";
  minimizeBtn.style.color = "white";
  minimizeBtn.style.width = "24px";
  minimizeBtn.style.height = "24px";
  minimizeBtn.style.cursor = "pointer";
  minimizeBtn.style.fontSize = "16px";
  minimizeBtn.style.display = "flex";
  minimizeBtn.style.alignItems = "center";
  minimizeBtn.style.justifyContent = "center";

  headerButtons.appendChild(minimizeBtn);
  header.appendChild(headerTitle);
  header.appendChild(headerButtons);

  // Messages container
  const messagesContainer = document.createElement("div");
  messagesContainer.style.flex = "1";
  messagesContainer.style.overflowY = "auto";
  messagesContainer.style.padding = "16px";
  messagesContainer.style.background = "#f8f9fa";
  messagesContainer.style.display = "flex";
  messagesContainer.style.flexDirection = "column";
  messagesContainer.style.gap = "12px";

  // Welcome message
  const welcomeMessage = document.createElement("div");
  welcomeMessage.style.display = "flex";
  welcomeMessage.style.justifyContent = "center";
  welcomeMessage.style.alignItems = "center";
  welcomeMessage.style.height = "100%";
  welcomeMessage.style.textAlign = "center";
  welcomeMessage.style.color = "#666";
  welcomeMessage.innerHTML = `
    <div>
      <div style="font-size: 18px; margin-bottom: 8px;">👋 سلام! من آرش هستم</div>
      <div style="font-size: 14px;">دستیار هوشمند شما</div>
      <div style="font-size: 12px; margin-top: 8px; opacity: 0.7;">با تایپ کردن گفتگو را شروع کنید...</div>
    </div>
  `;
  messagesContainer.appendChild(welcomeMessage);

  // Input area
  const inputArea = document.createElement("div");
  inputArea.style.padding = "16px";
  inputArea.style.background = "white";
  inputArea.style.borderTop = "1px solid #e9ecef";
  inputArea.style.display = "flex";
  inputArea.style.gap = "8px";
  inputArea.style.alignItems = "flex-end";

  const inputField = document.createElement("textarea");
  inputField.placeholder = "پیام خود را تایپ کنید...";
  inputField.style.flex = "1";
  inputField.style.minHeight = "40px";
  inputField.style.maxHeight = "100px";
  inputField.style.padding = "8px 12px";
  inputField.style.border = "1px solid #ddd";
  inputField.style.borderRadius = "20px";
  inputField.style.fontSize = "14px";
  inputField.style.fontFamily = "inherit";
  inputField.style.resize = "none";
  inputField.style.outline = "none";
  inputField.style.color = "#333";

  const sendButton = document.createElement("button");
  sendButton.innerHTML = "➤";
  sendButton.style.background = "linear-gradient(90deg, #01ADEF, #0194D1)";
  sendButton.style.border = "none";
  sendButton.style.borderRadius = "50%";
  sendButton.style.width = "40px";
  sendButton.style.height = "40px";
  sendButton.style.color = "white";
  sendButton.style.cursor = "pointer";
  sendButton.style.fontSize = "18px";
  sendButton.style.display = "flex";
  sendButton.style.alignItems = "center";
  sendButton.style.justifyContent = "center";
  sendButton.style.transition = "all 0.2s ease";

  const micButton = document.createElement("button");
  micButton.innerHTML = "🎤";
  micButton.style.background = "rgba(255, 255, 255, 0.1)";
  micButton.style.border = "1px solid rgba(255, 255, 255, 0.3)";
  micButton.style.borderRadius = "50%";
  micButton.style.width = "40px";
  micButton.style.height = "40px";
  micButton.style.color = "white";
  micButton.style.cursor = "pointer";
  micButton.style.fontSize = "16px";
  micButton.style.display = "flex";
  micButton.style.alignItems = "center";
  micButton.style.justifyContent = "center";
  micButton.style.transition = "all 0.2s ease";
  micButton.style.marginRight = "8px";

  inputArea.appendChild(micButton);
  inputArea.appendChild(inputField);
  inputArea.appendChild(sendButton);

  // Resize handle
  const resizeHandle = document.createElement("div");
  resizeHandle.style.position = "absolute";
  resizeHandle.style.bottom = "0";
  resizeHandle.style.right = "0";
  resizeHandle.style.width = "20px";
  resizeHandle.style.height = "20px";
  resizeHandle.style.cursor = "nw-resize";
  resizeHandle.style.background = "linear-gradient(-45deg, transparent 30%, rgba(255,255,255,0.3) 30%, rgba(255,255,255,0.3) 70%, transparent 70%)";

  // Widget content container
  const widgetContent = document.createElement("div");
  widgetContent.style.display = "flex";
  widgetContent.style.flexDirection = "column";
  widgetContent.style.height = "100%";
  widgetContent.style.position = "relative";

  widgetContent.appendChild(header);
  widgetContent.appendChild(messagesContainer);
  widgetContent.appendChild(inputArea);
  widgetContent.appendChild(resizeHandle);

  widget.appendChild(widgetContent);

  // Initialize speech recognition
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'fa-IR'; // Persian language

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      inputField.value = transcript;
      isRecording = false;
      micButton.innerHTML = "🎤";
      micButton.style.background = "rgba(255, 255, 255, 0.1)";
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      isRecording = false;
      micButton.innerHTML = "🎤";
      micButton.style.background = "rgba(255, 255, 255, 0.1)";
    };

    recognition.onend = () => {
      isRecording = false;
      micButton.innerHTML = "🎤";
      micButton.style.background = "rgba(255, 255, 255, 0.1)";
    };
  }

  // Add to page
  document.body.appendChild(toggleButton);
  document.body.appendChild(widget);

  // Initially hide the widget
  widget.style.display = "none";

  // Message functions
  function addMessage(text, sender) {
    const messageDiv = document.createElement("div");
    messageDiv.style.display = "flex";
    messageDiv.style.justifyContent = sender === "user" ? "flex-end" : "flex-start";
    messageDiv.style.marginBottom = "8px";

    const messageBubble = document.createElement("div");
    messageBubble.style.maxWidth = "80%";
    messageBubble.style.padding = "12px 16px";
    messageBubble.style.borderRadius = sender === "user" ? "20px 20px 4px 20px" : "20px 20px 20px 4px";
    messageBubble.style.background = sender === "user" ? "#01ADEF" : "white";
    messageBubble.style.color = sender === "user" ? "white" : "#333";
    messageBubble.style.fontSize = "14px";
    messageBubble.style.lineHeight = "1.4";
    messageBubble.style.wordWrap = "break-word";
    messageBubble.style.boxShadow = "0px 2px 8px rgba(0, 0, 0, 0.1)";
    messageBubble.textContent = text;

    messageDiv.appendChild(messageBubble);
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Remove welcome message if it exists
    if (welcomeMessage.parentNode) {
      welcomeMessage.remove();
    }
  }

  function addTypingIndicator() {
    const typingDiv = document.createElement("div");
    typingDiv.id = "typing-indicator";
    typingDiv.style.display = "flex";
    typingDiv.style.justifyContent = "flex-start";
    typingDiv.style.marginBottom = "8px";

    const typingBubble = document.createElement("div");
    typingBubble.style.padding = "12px 16px";
    typingBubble.style.borderRadius = "20px 20px 20px 4px";
    typingBubble.style.background = "white";
    typingBubble.style.boxShadow = "0px 2px 8px rgba(0, 0, 0, 0.1)";

    const dots = document.createElement("div");
    dots.style.display = "flex";
    dots.style.gap = "4px";
    dots.innerHTML = `
      <div style="width: 8px; height: 8px; background: #ccc; border-radius: 50%; animation: typing 1.4s infinite ease-in-out;"></div>
      <div style="width: 8px; height: 8px; background: #ccc; border-radius: 50%; animation: typing 1.4s infinite ease-in-out 0.2s;"></div>
      <div style="width: 8px; height: 8px; background: #ccc; border-radius: 50%; animation: typing 1.4s infinite ease-in-out 0.4s;"></div>
    `;

    typingBubble.appendChild(dots);
    typingDiv.appendChild(typingBubble);
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function removeTypingIndicator() {
    const typingIndicator = document.getElementById("typing-indicator");
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }

  // Add CSS animations
  const style = document.createElement("style");
  style.textContent = `
    @keyframes typing {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-10px); }
    }
  `;
  document.head.appendChild(style);

  // Chat API function
  async function sendMessage(message) {
    if (isProcessing) return;
    
    isProcessing = true;
    addMessage(message, "user");
    addTypingIndicator();

    try {
      const response = await fetch(baseOrigin + "/api/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: message,
          conversationHistory: messages
        })
      });

      const data = await response.json();
      removeTypingIndicator();

      if (data.success && data.response) {
        addMessage(data.response, "ai");
        messages.push({ role: "user", content: message });
        messages.push({ role: "assistant", content: data.response });
      } else {
        addMessage("متأسفانه در حال حاضر مشکل دارم. لطفاً دوباره تلاش کنید.", "ai");
      }
    } catch (error) {
      removeTypingIndicator();
      addMessage("متأسفانه در اتصال مشکل دارم. لطفاً اتصال اینترنت خود را بررسی کنید.", "ai");
      console.error("Chat widget error:", error);
    } finally {
      isProcessing = false;
    }
  }

  // Event listeners
  toggleButton.onclick = () => {
    if (isMinimized) {
      widget.style.display = "flex";
      toggleButton.style.display = "none";
      isMinimized = false;
    }
  };

  minimizeBtn.onclick = () => {
    widget.style.display = "none";
    toggleButton.style.display = "flex";
    isMinimized = true;
  };


  sendButton.onclick = () => {
    const message = inputField.value.trim();
    if (message && !isProcessing) {
      inputField.value = "";
      sendMessage(message);
    }
  };

  micButton.onclick = () => {
    if (!recognition) {
      alert('Speech recognition not supported in this browser');
      return;
    }

    if (isRecording) {
      recognition.stop();
      isRecording = false;
      micButton.innerHTML = "🎤";
      micButton.style.background = "rgba(255, 255, 255, 0.1)";
    } else {
      recognition.start();
      isRecording = true;
      micButton.innerHTML = "🔴";
      micButton.style.background = "rgba(255, 0, 0, 0.3)";
    }
  };

  inputField.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendButton.click();
    }
  });

  // Auto-resize textarea
  inputField.addEventListener("input", () => {
    inputField.style.height = "auto";
    inputField.style.height = Math.min(inputField.scrollHeight, 100) + "px";
  });

  // Simple dragging functionality
  let startX, startY, initialX, initialY;

  header.addEventListener("mousedown", (e) => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    initialX = widget.offsetLeft;
    initialY = widget.offsetTop;
    widget.style.cursor = "grabbing";
    e.preventDefault();
  });

  document.addEventListener("mousemove", (e) => {
    if (isDragging) {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      const newX = initialX + deltaX;
      const newY = initialY + deltaY;
      
      // Keep widget within viewport
      const maxX = window.innerWidth - widget.offsetWidth;
      const maxY = window.innerHeight - widget.offsetHeight;
      
      widget.style.left = Math.max(0, Math.min(newX, maxX)) + "px";
      widget.style.top = Math.max(0, Math.min(newY, maxY)) + "px";
      widget.style.right = "auto";
      widget.style.bottom = "auto";
    }
  });

  document.addEventListener("mouseup", () => {
    if (isDragging) {
      isDragging = false;
      widget.style.cursor = "default";
    }
  });

  // Resizing functionality
  resizeHandle.addEventListener("mousedown", (e) => {
    isResizing = true;
    const rect = widget.getBoundingClientRect();
    resizeStart.x = e.clientX;
    resizeStart.y = e.clientY;
    resizeStart.width = rect.width;
    resizeStart.height = rect.height;
    e.preventDefault();
  });

  document.addEventListener("mousemove", (e) => {
    if (isResizing) {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      const newWidth = Math.max(300, Math.min(600, resizeStart.width + deltaX));
      const newHeight = Math.max(400, Math.min(800, resizeStart.height + deltaY));
      widget.style.width = newWidth + "px";
      widget.style.height = newHeight + "px";
    }
  });

  document.addEventListener("mouseup", () => {
    if (isResizing) {
      isResizing = false;
    }
  });

  // Prevent text selection during drag
  header.addEventListener("selectstart", (e) => e.preventDefault());
  resizeHandle.addEventListener("selectstart", (e) => e.preventDefault());

  console.log("🤖 Chatbot widget loaded successfully!");
})();
