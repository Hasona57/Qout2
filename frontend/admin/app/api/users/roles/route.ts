import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseServer } from '@/lib/firebase'

export async function GET(request: NextRequest) {
  try {
    const { db } = getFirebaseServer()

    let roles = await db.getAll('roles')
    
    // Sort by name
    roles.sort((a: any, b: any) => {
      const nameA = (a.name || '').toLowerCase()
      const nameB = (b.name || '').toLowerCase()
      return nameA.localeCompare(nameB)
    })

    return NextResponse.json({ data: roles || [], success: true })
  } catch (error: any) {
    console.error('Error in roles route:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch roles' }, { status: 500 })
  }
}







