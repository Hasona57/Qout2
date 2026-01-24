import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServer()

    // Get purchase orders first
    let { data: purchaseOrders, error } = await supabase
      .from('purchase_orders')
      .select('*')
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('Error fetching purchase orders:', error)
      return NextResponse.json({ data: [], success: true })
    }

    // Get related data
    if (purchaseOrders && purchaseOrders.length > 0) {
      const orderIds = purchaseOrders.map((po: any) => po.id)
      const supplierIds = [...new Set(purchaseOrders.map((po: any) => po.supplierId).filter(Boolean))]

      // Get items
      const { data: items } = await supabase
        .from('purchase_order_items')
        .select('*')
        .in('purchaseOrderId', orderIds)

      // Get suppliers
      const { data: suppliers } = supplierIds.length > 0 ? await supabase
        .from('suppliers')
        .select('*')
        .in('id', supplierIds) : { data: [] }

      const supplierMap = new Map((suppliers || []).map((s: any) => [s.id, s]))

      // Combine data
      purchaseOrders = purchaseOrders.map((po: any) => ({
        ...po,
        supplier: supplierMap.get(po.supplierId) || null,
        items: (items || []).filter((item: any) => item.purchaseOrderId === po.id),
      }))
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

