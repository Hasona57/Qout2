import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServer()

    // Get order first
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !order) {
      console.error('Error fetching order:', error)
      return NextResponse.json({ data: null, success: false, error: 'Order not found' }, { status: 404 })
    }

    // Get related data
    const orderId = order.id

    // Get order items
    const { data: items } = await supabase
      .from('order_items')
      .select('*')
      .eq('orderId', orderId)

    // Get variants for items
    const variantIds = [...new Set((items || []).map((item: any) => item.variantId).filter(Boolean))]
    const { data: variants } = variantIds.length > 0 ? await supabase
      .from('product_variants')
      .select('*')
      .in('id', variantIds) : { data: [] }

    const variantMap = new Map((variants || []).map((v: any) => [v.id, v]))

    // Get user
    const { data: user } = order.userId ? await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', order.userId)
      .single() : { data: null }

    // Combine data
    const orderWithDetails = {
      ...order,
      items: (items || []).map((item: any) => ({
        ...item,
        variant: variantMap.get(item.variantId) || null,
      })),
      user: user || null,
    }

    return NextResponse.json({ data: orderWithDetails, success: true })
  } catch (error: any) {
    console.error('Error in order route:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch order' }, { status: 500 })
  }
}

