import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServer()

    // Get orders first
    let { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('Error fetching orders:', error)
      return NextResponse.json({ data: [], success: true })
    }

    // Get related data
    if (orders && orders.length > 0) {
      const orderIds = orders.map((o: any) => o.id)
      
      // Get order items
      const { data: items } = await supabase
        .from('order_items')
        .select('*')
        .in('orderId', orderIds)

      // Get variants for items
      const variantIds = [...new Set((items || []).map((item: any) => item.variantId).filter(Boolean))]
      const { data: variants } = variantIds.length > 0 ? await supabase
        .from('product_variants')
        .select('*')
        .in('id', variantIds) : { data: [] }

      const variantMap = new Map((variants || []).map((v: any) => [v.id, v]))

      // Get users
      const userIds = [...new Set(orders.map((o: any) => o.userId).filter(Boolean))]
      const { data: users } = userIds.length > 0 ? await supabase
        .from('users')
        .select('id, name, email')
        .in('id', userIds) : { data: [] }

      const userMap = new Map((users || []).map((u: any) => [u.id, u]))

      // Combine data
      orders = orders.map((order: any) => ({
        ...order,
        items: (items || []).filter((item: any) => item.orderId === order.id).map((item: any) => ({
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

