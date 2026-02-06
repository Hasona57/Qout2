import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseServer } from '@/lib/firebase'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { db } = getFirebaseServer()

    // Delete variant
    await db.remove(`product_variants/${params.id}`)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE variant route:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete variant', success: false },
      { status: 500 }
    )
  }
}







