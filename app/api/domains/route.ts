import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { upsertDomainInRegistries } from '@/lib/domain-registry'

// Get user from session token
async function getUserFromToken(token: string) {
  try {
    const session = await db.session.findFirst({
      where: {
        tokenHash: token,
        expiresAt: { gt: new Date() },
        revokedAt: null
      },
      include: { user: true }
    })
    return session?.user
  } catch (error) {
    console.error('Error getting user from token:', error)
    return null
  }
}

// GET - List user's domains
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = await getUserFromToken(token)
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const domains = await db.userDomain.findMany({
      where: { userId: user.id, status: 'active' },
      include: {
        apiUsage: {
          orderBy: { timestamp: 'desc' },
          take: 10
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ 
      success: true, 
      domains: domains.map(domain => ({
        id: domain.id,
        domain: domain.domain,
        status: domain.status,
        createdAt: domain.createdAt,
        recentUsage: domain.apiUsage.slice(0, 5)
      }))
    })

  } catch (error) {
    console.error('Error fetching domains:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Add new domain
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = await getUserFromToken(token)
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { domain } = await request.json()
    
    if (!domain || typeof domain !== 'string') {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 })
    }

    // Validate domain format
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?(\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?)*$/
    if (!domainRegex.test(domain)) {
      return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 })
    }

    // Check if domain already exists for this user
    const existingDomain = await db.userDomain.findFirst({
      where: { 
        userId: user.id, 
        domain: domain.toLowerCase(),
        status: 'active'
      }
    })

    if (existingDomain) {
      return NextResponse.json({ error: 'Domain already exists' }, { status: 409 })
    }

    // Create domain
    const newDomain = await db.userDomain.create({
      data: {
        userId: user.id,
        domain: domain.toLowerCase(),
        status: 'active'
      }
    })

    // sync registries
    try { await upsertDomainInRegistries(user.id, domain.toLowerCase(), 'active') } catch (e) { console.error('registry sync failed', e) }

    return NextResponse.json({ 
      success: true, 
      domain: {
        id: newDomain.id,
        domain: newDomain.domain,
        status: newDomain.status,
        createdAt: newDomain.createdAt
      }
    })

  } catch (error) {
    console.error('Error creating domain:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Remove domain
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = await getUserFromToken(token)
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const domainId = searchParams.get('id')
    
    if (!domainId) {
      return NextResponse.json({ error: 'Domain ID is required' }, { status: 400 })
    }

    // Soft delete domain
    await db.userDomain.update({
      where: { 
        id: domainId,
        userId: user.id // Ensure user owns this domain
      },
      data: { status: 'deleted' }
    })

    // Try to mark deleted in registries
    try {
      const d = await db.userDomain.findFirst({ where: { id: domainId, userId: user.id } })
      if (d) await upsertDomainInRegistries(user.id, d.domain, 'deleted')
    } catch (e) { console.error('registry delete sync failed', e) }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting domain:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
