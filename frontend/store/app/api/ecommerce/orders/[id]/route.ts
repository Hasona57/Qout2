import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseServer } from '@/lib/firebase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!params || !params.id) {
      return NextResponse.json(
        { error: 'Order ID is required', success: false },
        { status: 400 }
      )
    }

    const { db } = getFirebaseServer()

    // Get order
    const order = await db.get(`orders/${params.id}`)

    if (!order) {
      return NextResponse.json({ data: null, success: false, error: 'Order not found' }, { status: 404 })
    }

    // Get related data
    const [allItems, allVariants, allSizes, allColors, allUsers] = await Promise.all([
      db.getAll('order_items'),
      db.getAll('product_variants'),
      db.getAll('sizes'),
      db.getAll('colors'),
      db.getAll('users'),
    ])

    const items = allItems.filter((item: any) => item.orderId === params.id)
    const variantIds = [...new Set(items.map((item: any) => item.variantId).filter(Boolean))]
    const variants = allVariants.filter((v: any) => variantIds.includes(v.id))

    const sizeIds = [...new Set(variants.map((v: any) => v.sizeId).filter(Boolean))]
    const colorIds = [...new Set(variants.map((v: any) => v.colorId).filter(Boolean))]
    const sizes = allSizes.filter((s: any) => sizeIds.includes(s.id))
    const colors = allColors.filter((c: any) => colorIds.includes(c.id))

    const sizeMap = new Map(sizes.map((s: any) => [s.id, s]))
    const colorMap = new Map(colors.map((c: any) => [c.id, c]))
    const variantMap = new Map(variants.map((v: any) => [v.id, {
      ...v,
      size: sizeMap.get(v.sizeId) || null,
      color: colorMap.get(v.colorId) || null,
    }]))

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
    return NextResponse.json(
      { error: error.message || 'Failed to fetch order', success: false },
      { status: 500 }
    )
  }
}







