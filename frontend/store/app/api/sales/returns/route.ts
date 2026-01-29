import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const body = await request.json()

    const { orderId, reason, items } = body

    if (!orderId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'orderId and items array are required', success: false },
        { status: 400 }
      )
    }

    // Create return record
    const { data: returnRecord, error: returnError } = await supabase
      .from('returns')
      .insert({
        orderId,
        reason: reason || 'Return requested by user',
        status: 'pending',
      })
      .select()
      .single()

    if (returnError) {
      console.error('Error creating return:', returnError)
      return NextResponse.json(
        { error: returnError.message || 'Failed to create return', success: false },
        { status: 500 }
      )
    }

    // Create return items
    const returnItems = items.map((item: any) => ({
      returnId: returnRecord.id,
      orderItemId: item.orderItemId,
      quantity: item.quantity,
    }))

    const { error: itemsError } = await supabase
      .from('return_items')
      .insert(returnItems)

    if (itemsError) {
      console.error('Error creating return items:', itemsError)
      // Delete the return record if items failed
      await supabase.from('returns').delete().eq('id', returnRecord.id)
      return NextResponse.json(
        { error: itemsError.message || 'Failed to create return items', success: false },
        { status: 500 }
      )
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


