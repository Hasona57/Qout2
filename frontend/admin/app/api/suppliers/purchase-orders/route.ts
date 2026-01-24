import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServer()

    const { data: purchaseOrders, error } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        supplier:supplierId(*),
        items:purchase_order_items(*)
      `)
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('Error fetching purchase orders:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: purchaseOrders || [], success: true })
  } catch (error: any) {
    console.error('Error in purchase orders route:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch purchase orders' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = getSupabaseServer()

    const { data: purchaseOrder, error } = await supabase
      .from('purchase_orders')
      .insert(body)
      .select()
      .single()

    if (error) {
      console.error('Error creating purchase order:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: purchaseOrder, success: true })
  } catch (error: any) {
    console.error('Error creating purchase order:', error)
    return NextResponse.json({ error: error.message || 'Failed to create purchase order' }, { status: 500 })
  }
}

