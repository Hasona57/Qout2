import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const supabase = getSupabaseServer()

    const { data: order, error } = await supabase
      .from('orders')
      .update({ status: body.status })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating order status:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: order, success: true })
  } catch (error: any) {
    console.error('Error updating order status:', error)
    return NextResponse.json({ error: error.message || 'Failed to update order status' }, { status: 500 })
  }
}



