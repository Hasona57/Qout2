import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseServer } from '@/lib/firebase'

export async function POST(request: NextRequest) {
  try {
    const { db } = getFirebaseServer()
    const body = await request.json()

    const { orderId, reason, items } = body

    if (!orderId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'orderId and items array are required', success: false },
        { status: 400 }
      )
    }

    // Create return record
    const returnId = Date.now().toString(36) + Math.random().toString(36).substr(2)
    const returnRecord = {
      id: returnId,
      orderId,
      reason: reason || 'Return requested by user',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await db.set(`returns/${returnId}`, returnRecord)

    // Create return items
    for (const item of items) {
      const itemId = Date.now().toString(36) + Math.random().toString(36).substr(2) + 'ret'
      await db.set(`return_items/${itemId}`, {
        id: itemId,
        returnId: returnId,
        orderItemId: item.orderItemId,
        quantity: item.quantity,
        createdAt: new Date().toISOString(),
      })
    }

    return NextResponse.json({ data: returnRecord, success: true })
  } catch (error: any) {
    console.error('Error in returns route:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create return', success: false },
      { status: 500 }
    )
  }
}







