import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseServer } from '@/lib/firebase'

export async function GET(request: NextRequest) {
  try {
    const { db } = getFirebaseServer()

    const locations = await db.getAll('stock_locations')
    
    // Sort by name
    locations.sort((a: any, b: any) => {
      const nameA = (a.name || '').toLowerCase()
      const nameB = (b.name || '').toLowerCase()
      return nameA.localeCompare(nameB)
    })

    return NextResponse.json({ data: locations || [], success: true })
  } catch (error: any) {
    console.error('Error in locations route:', error)
    return NextResponse.json({ data: [], success: true })
  }
}

