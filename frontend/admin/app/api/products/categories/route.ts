import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseServer } from '@/lib/firebase'

export async function GET(request: NextRequest) {
  try {
    const { db } = getFirebaseServer()
    let categories = await db.getAll('categories')
    
    // Filter active and sort
    categories = categories.filter((c: any) => c.isActive !== false)
    categories.sort((a: any, b: any) => {
      const nameA = (a.nameAr || '').toLowerCase()
      const nameB = (b.nameAr || '').toLowerCase()
      return nameA.localeCompare(nameB)
    })

    return NextResponse.json({ data: categories || [], success: true })
  } catch (error: any) {
    console.error('Error in categories route:', error)
    return NextResponse.json({ data: [], success: true })
  }
}







