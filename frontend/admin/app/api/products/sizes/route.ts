import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseServer } from '@/lib/firebase'

export async function GET(request: NextRequest) {
  try {
    const { db } = getFirebaseServer()
    let sizes = await db.getAll('sizes')
    
    // Filter active and sort
    sizes = sizes.filter((s: any) => s.isActive !== false)
    sizes.sort((a: any, b: any) => {
      const nameA = (a.nameAr || '').toLowerCase()
      const nameB = (b.nameAr || '').toLowerCase()
      return nameA.localeCompare(nameB)
    })

    return NextResponse.json({ data: sizes || [], success: true })
  } catch (error: any) {
    console.error('Error in sizes route:', error)
    return NextResponse.json({ data: [], success: true })
  }
}







