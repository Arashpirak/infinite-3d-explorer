# 🤖 Chatbot Widget Integration Guide

## Overview
This is a fully functional, draggable, and resizable chatbot widget that can be embedded in any website. The widget connects to your AI chat backend and provides a seamless user experience.

## Features
- ✅ **Draggable** - Users can move the widget anywhere on the screen
- ✅ **Resizable** - Users can resize the widget (300x400 to 600x800)
- ✅ **Minimizable** - Collapses to a floating icon
- ✅ **Persian Language** - Full Persian support with RTL layout
- ✅ **Real-time Chat** - Connects to your AI backend
- ✅ **Responsive Design** - Works on desktop and mobile
- ✅ **Customizable** - Easy to customize appearance and behavior

## Quick Integration

### Basic Integration (Recommended)
Add this single line to your website's HTML:

```html
<script src="https://your-domain.com/dist2/embed.js"></script>
```

### Advanced Integration with Customization
```html
<script 
  src="https://your-domain.com/dist2/embed.js"
  data-position="bottom-right"
  data-theme="default"
  data-language="fa"
  data-api-url="https://your-domain.com"
  data-custom-title="My Assistant"
  data-custom-subtitle="How can I help you?"
  data-debug="false">
</script>
```

## Configuration Options

| Attribute | Values | Default | Description |
|-----------|--------|---------|-------------|
| `data-position` | `bottom-right`, `bottom-left`, `top-right`, `top-left` | `bottom-right` | Widget initial position |
| `data-theme` | `default`, `dark`, `light` | `default` | Widget theme |
| `data-language` | `fa`, `en` | `fa` | Interface language |
| `data-api-url` | Any valid URL | Auto-detected | Your API endpoint |
| `data-custom-title` | Any string | "دستیار هوشمند - آرش" | Custom widget title |
| `data-custom-subtitle` | Any string | "شریک گفتگوی هوشمند شما" | Custom subtitle |
| `data-custom-icon` | Image URL | Default robot icon | Custom widget icon |
| `data-debug` | `true`, `false` | `false` | Enable debug mode |

## Examples

### 1. Basic Integration
```html
<!DOCTYPE html>
<html>
<head>
    <title>My Website</title>
</head>
<body>
    <h1>Welcome to My Website</h1>
    <p>This is my content...</p>
    
    <!-- Add chatbot widget -->
    <script src="https://your-domain.com/dist2/embed.js"></script>
</body>
</html>
```

### 2. Customized Widget
```html
<!DOCTYPE html>
<html>
<head>
    <title>My Website</title>
</head>
<body>
    <h1>Welcome to My Website</h1>
    <p>This is my content...</p>
    
    <!-- Add customized chatbot widget -->
    <script 
        src="https://your-domain.com/dist2/embed.js"
        data-position="bottom-left"
        data-custom-title="Customer Support"
        data-custom-subtitle="We're here to help!"
        data-custom-icon="https://your-domain.com/custom-icon.png">
    </script>
</body>
</html>
```

### 3. Multiple Widgets (Different Configurations)
```html
<!DOCTYPE html>
<html>
<head>
    <title>My Website</title>
</head>
<body>
    <h1>Welcome to My Website</h1>
    <p>This is my content...</p>
    
    <!-- Support widget -->
    <script 
        src="https://your-domain.com/dist2/embed.js"
        data-position="bottom-right"
        data-custom-title="Support"
        data-custom-subtitle="Need help?">
    </script>
    
    <!-- Sales widget -->
    <script 
        src="https://your-domain.com/dist2/embed.js"
        data-position="bottom-left"
        data-custom-title="Sales"
        data-custom-subtitle="Interested in our products?">
    </script>
</body>
</html>
```

## API Requirements

Your backend must have the following endpoint:

### POST `/api/chat`
**Request:**
```json
{
  "message": "User message here",
  "conversationHistory": [
    {"role": "user", "content": "Previous user message"},
    {"role": "assistant", "content": "Previous AI response"}
  ]
}
```

**Response:**
```json
{
  "success": true,
  "response": "AI response here",
  "provider": "openai",
  "model": "gpt-3.5-turbo",
  "timestamp": 1234567890
}
```

## Styling and Customization

### CSS Customization
The widget uses CSS custom properties that can be overridden:

```css
:root {
  --chatbot-primary-color: #01ADEF;
  --chatbot-secondary-color: #08075C;
  --chatbot-background: #1a1a2e;
  --chatbot-text-color: #ffffff;
  --chatbot-border-radius: 16px;
  --chatbot-shadow: 0px 8px 32px rgba(0, 0, 0, 0.3);
}
```

### Custom Icon
You can use your own icon by providing a URL:
```html
<script 
  src="https://your-domain.com/dist2/embed.js"
  data-custom-icon="https://your-domain.com/my-icon.png">
</script>
```

## Browser Support
- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+
- ✅ Mobile browsers

## Security Considerations
- The widget only communicates with your specified API endpoint
- No user data is stored locally
- All conversations are handled by your backend
- HTTPS is recommended for production use

## Troubleshooting

### Widget Not Appearing
1. Check browser console for errors
2. Verify the script URL is accessible
3. Ensure your API endpoint is working
4. Check CORS settings if using different domains

### API Connection Issues
1. Verify your API endpoint is correct
2. Check network tab in browser dev tools
3. Ensure your backend is running
4. Check API key configuration

### Styling Issues
1. Check for CSS conflicts with your site
2. Verify z-index values (widget uses 99999)
3. Test on different screen sizes
4. Check browser compatibility

## Support
For technical support or customization requests, please contact your development team.

## License
This widget is provided as-is for integration with your AI chat system.
