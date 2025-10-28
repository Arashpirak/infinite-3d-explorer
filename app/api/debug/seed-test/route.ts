import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { upsertDomainInRegistries } from '@/lib/domain-registry'

// Debug-only endpoint to seed a test user and domain in Neon
// Requires ENABLE_DEBUG_SEED=true in environment

export async function POST(_request: NextRequest) {
  try {
    if (process.env.ENABLE_DEBUG_SEED !== 'true') {
      return NextResponse.json({ error: 'Debug seed disabled' }, { status: 403 })
    }

    const testPhone = '+989121234567'
    const testPassword = 'P@ssw0rd!'
    const testEmail = 'test@example.com'
    const testName = 'Test User'
    const testDomain = 'www.test.ir'

    // Create user if not exists
    let user = await db.user.findUnique({ where: { phone: testPhone } })
    if (!user) {
      const hash = await bcrypt.hash(testPassword, 10)
      user = await db.user.create({
        data: {
          phone: testPhone,
          email: testEmail,
          name: testName,
          password: hash,
          status: 'active',
        },
      })
    }

    // Create domain if not exists
    const domainNorm = testDomain.toLowerCase()
    let domain = await db.userDomain.findFirst({ where: { userId: user.id, domain: domainNorm } })
    if (!domain) {
      domain = await db.userDomain.create({
        data: {
          userId: user.id,
          domain: domainNorm,
          status: 'active',
        },
      })
    }

    // Sync registries
    try { await upsertDomainInRegistries(user.id, domainNorm, 'active') } catch {}

    return NextResponse.json({
      success: true,
      user: { id: user.id, phone: user.phone, email: user.email, name: user.name },
      domain: { id: domain.id, domain: domain.domain, status: domain.status, createdAt: domain.createdAt },
      note: 'Use Neon Console → Tables → user_domains to verify.'
    })
  } catch (e) {
    console.error('Seed error', e)
    return NextResponse.json({ error: 'Seed failed' }, { status: 500 })
  }
}


