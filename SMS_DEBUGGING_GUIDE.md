# SMS Service Debugging Guide

## ✅ **Current Status**

Your SMS service is now using the **exact same implementation** as your working test folder:
- ✅ **API Endpoint**: `https://rest.payamak-panel.com/api/SendSMS/SendSMS`
- ✅ **Authentication**: Username/Password (not API key)
- ✅ **Environment Variables**: `MP_USERNAME`, `MP_PASSWORD`, `MP_FROM`
- ✅ **Added Debugging**: Console logs for troubleshooting

## 🔍 **Debugging Steps**

### 1. **Check Configuration**
Visit: `https://your-domain.com/api/test-config`

This will show you:
- ✅ Whether environment variables are set
- ✅ Configuration status
- ❌ Any missing credentials

### 2. **Test SMS Service**
Visit: `https://your-domain.com/api/test-sms`

Send a POST request with:
```json
{
  "phone": "09123456789",
  "message": "Test message"
}
```

### 3. **Check Server Logs**
Look for these console logs:
- `SMS Request:` - Shows the request being sent
- `SMS Response Status:` - HTTP status code
- `SMS Response Data:` - API response

## 🚨 **Common Issues**

### **Issue 1: Environment Variables Not Set**
**Symptoms**: Error about missing credentials
**Solution**: 
```bash
MP_USERNAME="your_username"
MP_PASSWORD="your_password"
MP_FROM="5000****"
```

### **Issue 2: Wrong API Endpoint**
**Symptoms**: 404 or connection errors
**Solution**: Verify the endpoint is correct

### **Issue 3: Invalid Credentials**
**Symptoms**: 401 or 403 errors
**Solution**: Check username/password in Melipayamak dashboard

### **Issue 4: Network Issues**
**Symptoms**: Timeout or connection errors
**Solution**: Check server network access to Melipayamak API

## 📋 **Environment Variables for Production**

Make sure these are set in your Render dashboard:

```bash
MP_USERNAME="your_melipayamak_username"
MP_PASSWORD="your_melipayamak_password"
MP_FROM="5000****"
```

## 🧪 **Testing Commands**

### **Test Configuration:**
```bash
curl https://your-domain.com/api/test-config
```

### **Test SMS:**
```bash
curl -X POST https://your-domain.com/api/test-sms \
  -H "Content-Type: application/json" \
  -d '{"phone": "09123456789", "message": "Test message"}'
```

## 📊 **Expected Response**

### **Successful SMS:**
```json
{
  "success": true,
  "message": "پیامک با موفقیت ارسال شد",
  "details": {
    "success": true,
    "messageId": "some_id",
    "details": "response_data"
  }
}
```

### **Failed SMS:**
```json
{
  "success": false,
  "message": "خطا در ارسال پیامک",
  "details": {
    "success": false,
    "error": "error_message",
    "details": "api_response"
  }
}
```

## 🔧 **Next Steps**

1. **Deploy the updated code** with debugging
2. **Check `/api/test-config`** to verify environment variables
3. **Test with `/api/test-sms`** to see detailed logs
4. **Check server logs** for debugging information
5. **Share the logs** if issues persist

## 📱 **Production Testing**

After deployment:
1. Try user registration
2. Check server logs for SMS requests
3. Verify SMS delivery
4. Test password reset functionality

**The SMS service is now exactly like your working test implementation with added debugging!** 🔍📱
