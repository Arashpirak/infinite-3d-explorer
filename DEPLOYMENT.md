# Deployment Guide - Melipayamak SMS Integration

## Environment Variables Setup

Before deploying your application, you need to configure the following environment variables:

### Required Environment Variables

```bash
# Database
DATABASE_URL="your_database_url_here"

# Melipayamak SMS Service Configuration
MELIPAYAMAK_USERNAME="your_melipayamak_username"
MELIPAYAMAK_PASSWORD="your_melipayamak_password"
MELIPAYAMAK_FROM="5000****"  # Your registered sender number from Melipayamak

# JWT Secret (for authentication)
JWT_SECRET="your_jwt_secret_here"

# Next.js
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your_nextauth_secret_here"
```

## Melipayamak Setup

1. **Register with Melipayamak**: Sign up at [Melipayamak](https://melipayamak.com)
2. **Get Credentials**: Obtain your username and password from your Melipayamak dashboard
3. **Register Sender Number**: Register a sender number (like 5000****) for sending SMS
4. **Configure Environment Variables**: Set the credentials in your hosting environment

## Deployment Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Environment Variables
Configure the environment variables in your hosting platform (Vercel, Netlify, etc.)

### 3. Database Setup
```bash
npx prisma generate
npx prisma db push
```

### 4. Build and Deploy
```bash
npm run build
npm start
```

## SMS Service Features

The integrated SMS service includes:

- **OTP Verification**: Sends verification codes for user registration
- **Password Reset**: Sends OTP for password reset functionality
- **Welcome Messages**: Optional welcome messages for new users
- **Persian Language Support**: All SMS messages are in Persian
- **Error Handling**: Comprehensive error handling and logging

## Testing

To test the SMS functionality:

1. Ensure all environment variables are properly set
2. Use a valid Iranian phone number (format: 09xxxxxxxxx)
3. Check the console logs for SMS sending status
4. Verify SMS delivery on the target device

## Troubleshooting

### Common Issues

1. **SMS Not Sending**: Check Melipayamak credentials and sender number
2. **Invalid Phone Number**: Ensure phone numbers are in Iranian format (09xxxxxxxxx)
3. **Rate Limiting**: The service includes rate limiting to prevent abuse
4. **Environment Variables**: Verify all required environment variables are set

### Logs

Check the application logs for SMS-related errors:
- SMS sending success/failure
- Message IDs for tracking
- Error messages from Melipayamak API

## Security Notes

- Never commit environment variables to version control
- Use strong, unique passwords for Melipayamak account
- Regularly rotate JWT secrets
- Monitor SMS usage to prevent abuse
