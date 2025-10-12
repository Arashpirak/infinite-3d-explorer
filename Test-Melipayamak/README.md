# Melipayamak SMS Test Service

This is a standalone test service for Melipayamak SMS functionality.

## 🚀 Quick Deploy to Render

### 1. Create New Web Service on Render
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select this folder as the root directory

### 2. Configure Build Settings
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Node Version**: `18` or `20`

### 3. Set Environment Variables
Add these in Render dashboard:
```bash
MP_USERNAME="your_melipayamak_username"
MP_PASSWORD="your_melipayamak_password"
MP_FROM="5000****"
```

### 4. Deploy
Click "Deploy" and wait for deployment to complete.

## 🧪 Testing

### Test Credentials
Visit: `https://your-service-name.onrender.com/test-credentials`

### Send Test SMS
Visit: `https://your-service-name.onrender.com/`

Use the web interface to:
1. Enter phone number (e.g., 09123456789)
2. Enter message text
3. Click "ارسال پیامک" (Send SMS)

### API Testing
```bash
# Test credentials
curl https://your-service-name.onrender.com/test-credentials

# Send SMS
curl -X POST https://your-service-name.onrender.com/send-sms \
  -H "Content-Type: application/json" \
  -d '{"to": "09123456789", "text": "Test message"}'
```

## 📱 Features

- ✅ **Credential Testing**: Verify your Melipayamak credentials
- ✅ **SMS Sending**: Send test SMS messages
- ✅ **Persian Interface**: User-friendly Persian web interface
- ✅ **Error Handling**: Detailed error messages
- ✅ **Real-time Feedback**: Success/failure notifications

## 🔧 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MP_USERNAME` | Melipayamak username | `your_username` |
| `MP_PASSWORD` | Melipayamak password | `your_password` |
| `MP_FROM` | Sender number | `5000****` |

## 📊 Expected Responses

### Successful SMS:
```json
{
  "success": true,
  "data": "message_id_or_response"
}
```

### Failed SMS:
```json
{
  "success": false,
  "error": "error_message",
  "details": "api_response_details"
}
```

## 🎯 Purpose

This test service helps you:
1. **Verify credentials** work on the server
2. **Test SMS sending** independently
3. **Debug issues** with detailed logging
4. **Compare results** between local and server

**Deploy this to test if SMS works from your server environment!** 🚀
