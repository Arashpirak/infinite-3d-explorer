# Environment Variables Setup Guide

## Step 1: Create .env.local File

In your project root directory (`C:\directory\`), create a new file named `.env.local`

## Step 2: Add Environment Variables

Copy and paste this content into your `.env.local` file:

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
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_nextauth_secret_here"

# Node Environment
NODE_ENV="development"
```

## Step 3: Replace Placeholder Values

### Database URL
```bash
DATABASE_URL="postgresql://username:password@localhost:5432/your_database_name"
# OR for SQLite (development):
DATABASE_URL="file:./dev.db"
```

### Melipayamak SMS Service
```bash
MELIPAYAMAK_USERNAME="your_actual_melipayamak_username"
MELIPAYAMAK_PASSWORD="your_actual_melipayamak_password"
MELIPAYAMAK_FROM="5000****"  # Your registered sender number
```

### JWT Secret (Generate secure random strings)
```bash
# Generate at: https://generate-secret.vercel.app/32
JWT_SECRET="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"
NEXTAUTH_SECRET="z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0f9e8d7c6b5a4"
```

## Step 4: Example .env.local File

Here's what your `.env.local` file should look like with real values:

```bash
# Database Configuration
DATABASE_URL="postgresql://myuser:mypassword@localhost:5432/infinite_explorer"

# Melipayamak SMS Service Configuration
MELIPAYAMAK_USERNAME="my_melipayamak_username"
MELIPAYAMAK_PASSWORD="my_melipayamak_password"
MELIPAYAMAK_FROM="5000****"

# JWT Secret for User Authentication
JWT_SECRET="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"

# Next.js Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0f9e8d7c6b5a4"

# Node Environment
NODE_ENV="development"
```

## Step 5: Restart Your Development Server

After creating the `.env.local` file:

```bash
# Stop your current server (Ctrl+C)
# Then restart:
npm run dev
```

## Important Notes

1. **Never commit .env.local to git** - It's already in .gitignore
2. **Use .env.local for development** - Next.js automatically loads it
3. **For production deployment** - Set these variables in your hosting platform
4. **Generate secure secrets** - Use online generators for JWT_SECRET and NEXTAUTH_SECRET

## Where to Get Values

- **DATABASE_URL**: From your database provider (PostgreSQL, MySQL, etc.)
- **MELIPAYAMAK_***: From your Melipayamak account dashboard
- **JWT_SECRET**: Generate at https://generate-secret.vercel.app/32
- **NEXTAUTH_SECRET**: Generate at https://generate-secret.vercel.app/32

## File Location

Your `.env.local` file should be in:
```
w:\ATiRAD\SITE\infinite-3d-explorer\.env.local
```

Right next to your `package.json` file!
