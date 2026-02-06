import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseServer } from '@/lib/firebase'

export async function GET(request: NextRequest) {
  try {
    const { db } = getFirebaseServer()
    let colors = await db.getAll('colors')
    
    // Filter active and sort
    colors = colors.filter((c: any) => c.isActive !== false)
    colors.sort((a: any, b: any) => {
      const nameA = (a.nameAr || '').toLowerCase()
      const nameB = (b.nameAr || '').toLowerCase()
      return nameA.localeCompare(nameB)
    })

    return NextResponse.json({ data: colors, success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}









