import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseServer } from '@/lib/firebase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { db } = getFirebaseServer()

    // Get order
    const order = await db.get(`orders/${params.id}`)

    if (!order) {
      return NextResponse.json({ data: null, success: false, error: 'Order not found' }, { status: 404 })
    }

    // Get related data
    const [allItems, allVariants, allUsers] = await Promise.all([
      db.getAll('order_items'),
      db.getAll('product_variants'),
      db.getAll('users'),
    ])

    const items = allItems.filter((item: any) => item.orderId === params.id)
    const variantIds = [...new Set(items.map((item: any) => item.variantId).filter(Boolean))]
    const variants = allVariants.filter((v: any) => variantIds.includes(v.id))
    const variantMap = new Map(variants.map((v: any) => [v.id, v]))

    const user = order.userId ? allUsers.find((u: any) => u.id === order.userId) : null

    // Combine data
    const orderWithDetails = {
      ...order,
      id: params.id,
      items: items.map((item: any) => ({
        ...item,
        variant: variantMap.get(item.variantId) || null,
      })),
      user: user ? { id: user.id, name: user.name, email: user.email } : null,
    }

    return NextResponse.json({ data: orderWithDetails, success: true })
  } catch (error: any) {
    console.error('Error in order route:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch order' }, { status: 500 })
  }
}

