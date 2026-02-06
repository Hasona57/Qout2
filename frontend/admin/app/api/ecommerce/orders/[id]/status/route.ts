import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseServer } from '@/lib/firebase'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { db } = getFirebaseServer()

    const existingOrder = await db.get(`orders/${params.id}`)
    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    await db.update(`orders/${params.id}`, {
      ...existingOrder,
      status: body.status,
      updatedAt: new Date().toISOString(),
    })

    const updatedOrder = await db.get(`orders/${params.id}`)
    return NextResponse.json({ data: updatedOrder, success: true })
  } catch (error: any) {
    console.error('Error updating order status:', error)
    return NextResponse.json({ error: error.message || 'Failed to update order status' }, { status: 500 })
  }
}







