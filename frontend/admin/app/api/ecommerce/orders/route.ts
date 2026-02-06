import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseServer } from '@/lib/firebase'

export async function GET(request: NextRequest) {
  try {
    const { db } = getFirebaseServer()

    // Get all orders
    let orders = await db.getAll('orders')
    
    // Sort by createdAt descending
    orders.sort((a: any, b: any) => {
      const dateA = new Date(a.createdAt || 0).getTime()
      const dateB = new Date(b.createdAt || 0).getTime()
      return dateB - dateA
    })

    // Get related data
    if (orders && orders.length > 0) {
      const orderIds = orders.map((o: any) => o.id)
      
      // Get order items
      const allItems = await db.getAll('order_items')
      const items = allItems.filter((item: any) => orderIds.includes(item.orderId))

      // Get variants for items
      const variantIds = [...new Set(items.map((item: any) => item.variantId).filter(Boolean))]
      const allVariants = await db.getAll('product_variants')
      const variants = allVariants.filter((v: any) => variantIds.includes(v.id))

      const variantMap = new Map(variants.map((v: any) => [v.id, v]))

      // Get users
      const userIds = [...new Set(orders.map((o: any) => o.userId).filter(Boolean))]
      const allUsers = await db.getAll('users')
      const users = allUsers.filter((u: any) => userIds.includes(u.id))

      const userMap = new Map(users.map((u: any) => [u.id, { id: u.id, name: u.name, email: u.email }]))

      // Combine data
      orders = orders.map((order: any) => ({
        ...order,
        items: items.filter((item: any) => item.orderId === order.id).map((item: any) => ({
          ...item,
          variant: variantMap.get(item.variantId) || null,
        })),
        user: userMap.get(order.userId) || null,
      }))
    }

    return NextResponse.json({ data: orders || [], success: true })
  } catch (error: any) {
    console.error('Error in orders route:', error)
    return NextResponse.json({ data: [], success: true, error: error.message })
  }
}

