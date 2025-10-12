# Test SMS Service Deployment Guide

## 🎯 **Purpose**

Deploy your Test-Melipayamak folder as a separate service to test SMS functionality independently from your main application.

## 🚀 **Deploy to Render**

### **Step 1: Create New Web Service**
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. **Important**: Set the **Root Directory** to `Test-Melipayamak`

### **Step 2: Configure Build Settings**
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Node Version**: `18` or `20`
- **Root Directory**: `Test-Melipayamak`

### **Step 3: Set Environment Variables**
In Render dashboard, add these environment variables:
```bash
MP_USERNAME="your_melipayamak_username"
MP_PASSWORD="your_melipayamak_password"
MP_FROM="5000****"
```

### **Step 4: Deploy**
Click **"Deploy"** and wait for deployment to complete.

## 🧪 **Testing Your Deployed Service**

### **1. Test Credentials**
Visit: `https://your-test-service-name.onrender.com/test-credentials`

**Expected Response:**
```json
{
  "success": true,
  "message": "Credentials are valid!",
  "credit": "your_credit_info",
  "credentials": {
    "username": "your_username",
    "from": "5000****",
    "hasPassword": true
  }
}
```

### **2. Test SMS Sending**
Visit: `https://your-test-service-name.onrender.com/`

Use the web interface:
1. Enter your phone number: `09123456789`
2. Enter test message: `Test message from server`
3. Click **"ارسال پیامک"** (Send SMS)

### **3. API Testing**
```bash
# Test credentials
curl https://your-test-service-name.onrender.com/test-credentials

# Send SMS
curl -X POST https://your-test-service-name.onrender.com/send-sms \
  -H "Content-Type: application/json" \
  -d '{"to": "09123456789", "text": "Test from server"}'
```

## 📊 **What to Look For**

### **✅ Success Indicators:**
- Credentials test returns `"success": true`
- SMS sending returns `"success": true`
- You receive the SMS on your phone
- Console shows `"✅ SMS sent successfully!"`

### **❌ Failure Indicators:**
- Credentials test returns `"success": false`
- SMS sending returns `"success": false`
- No SMS received
- Console shows `"❌ SMS sending failed:"`

## 🔍 **Debugging**

### **Check Server Logs:**
1. Go to Render dashboard
2. Click on your test service
3. Go to **"Logs"** tab
4. Look for:
   - `SMS Request:` - Shows the request being sent
   - `SMS Response Status:` - HTTP status code
   - `SMS Response Data:` - API response

### **Common Issues:**
1. **Environment variables not set** - Check Render dashboard
2. **Wrong credentials** - Verify in Melipayamak dashboard
3. **Network issues** - Check if server can reach Melipayamak API
4. **Invalid phone number** - Use format `09123456789`

## 🎯 **Expected Results**

### **If SMS Works on Server:**
- ✅ Your credentials are correct
- ✅ Network access is working
- ✅ Issue is in your main application integration

### **If SMS Doesn't Work on Server:**
- ❌ Credentials might be wrong
- ❌ Network access issues
- ❌ Melipayamak API problems

## 📱 **Next Steps**

### **If Test Service Works:**
1. Compare the working test service with your main app
2. Check environment variables in main app
3. Verify API integration in main app

### **If Test Service Doesn't Work:**
1. Check Melipayamak credentials
2. Contact Melipayamak support
3. Verify account status and credit

## 🚀 **Quick Deploy Commands**

```bash
# 1. Push your code to GitHub
git add .
git commit -m "Add SMS test service"
git push

# 2. Deploy on Render (via dashboard)
# - Create new web service
# - Set root directory to Test-Melipayamak
# - Add environment variables
# - Deploy
```

**This will help you determine if the issue is with your credentials, network, or application integration!** 🔍📱
