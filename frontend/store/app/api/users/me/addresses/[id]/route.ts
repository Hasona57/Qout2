import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseServer } from '@/lib/firebase'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!params || !params.id) {
      return NextResponse.json(
        { error: 'Address ID is required', success: false },
        { status: 400 }
      )
    }

    const { db } = getFirebaseServer()

    // Try addresses table first, then user_addresses
    try {
      await db.remove(`addresses/${params.id}`)
    } catch {
      await db.remove(`user_addresses/${params.id}`)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE address route:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete address', success: false },
      { status: 500 }
    )
  }
}







