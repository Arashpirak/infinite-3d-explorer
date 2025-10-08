import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production'

export function generateToken(payload: { userId: string; phone: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): { userId: string; phone: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; phone: string }
  } catch {
    return null
  }
}

export function getUserIdFromRequest(request: NextRequest): string | null {
  const token = request.cookies.get('session')?.value
  if (!token) return null
  
  const decoded = verifyToken(token)
  return decoded?.userId || null
}
