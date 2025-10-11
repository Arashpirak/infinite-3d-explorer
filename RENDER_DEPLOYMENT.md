# Render Deployment Guide

## Build Command Configuration

For Render deployment, use this build command:

```bash
npm install --legacy-peer-deps && npm run build
```

## Environment Variables for Render

Set these environment variables in your Render dashboard:

### Required Variables
```bash
# Database Configuration
DATABASE_URL="your_database_url_here"

# Melipayamak SMS Service Configuration
MELIPAYAMAK_USERNAME="your_melipayamak_username"
MELIPAYAMAK_PASSWORD="your_melipayamak_password"
MELIPAYAMAK_FROM="5000****"

# JWT Secret for User Authentication
JWT_SECRET="your_very_secure_random_string_here"

# Next.js Configuration
NEXTAUTH_URL="https://your-app-name.onrender.com"
NEXTAUTH_SECRET="your_nextauth_secret_here"

# Node Environment
NODE_ENV="production"
```

## Render Service Configuration

### Build Settings
- **Build Command**: `npm install --legacy-peer-deps && npm run build`
- **Start Command**: `npm start`
- **Node Version**: `18` or `20`

### Environment Variables Setup
1. Go to your Render service dashboard
2. Navigate to "Environment" tab
3. Add each environment variable listed above
4. Make sure to use your actual values (not the placeholders)

## Database Setup

### Option 1: Render PostgreSQL (Recommended)
1. Create a new PostgreSQL database in Render
2. Copy the connection string
3. Set it as `DATABASE_URL` in your environment variables

### Option 2: External Database
Use your existing database connection string

## Deployment Steps

1. **Connect Repository**: Connect your GitHub repository to Render
2. **Configure Build**: Use the build command above
3. **Set Environment Variables**: Add all required environment variables
4. **Deploy**: Click "Deploy" and wait for the build to complete

## Troubleshooting

### If Build Still Fails
Try this alternative build command:
```bash
npm install --force && npm run build
```

### Common Issues
1. **Database Connection**: Ensure DATABASE_URL is correct
2. **Environment Variables**: Double-check all variables are set
3. **Node Version**: Use Node 18 or 20
4. **Build Timeout**: Render has a 15-minute build limit

## Post-Deployment

1. **Test SMS Functionality**: Try registering a new user
2. **Check Logs**: Monitor Render logs for any errors
3. **Database Migration**: Run `npx prisma db push` if needed

## Security Notes

- Never commit `.env` files to your repository
- Use strong, unique secrets for JWT_SECRET and NEXTAUTH_SECRET
- Keep your Melipayamak credentials secure
- Monitor your SMS usage to prevent abuse

## Cost Optimization

- Use Render's free tier for development
- Monitor your Melipayamak SMS usage
- Consider upgrading to paid tier for production
