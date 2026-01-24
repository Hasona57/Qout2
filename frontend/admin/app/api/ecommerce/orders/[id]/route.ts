import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServer()

    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(
          *,
          variant:variantId(*)
        ),
        user:userId(*)
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching order:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: order, success: true })
  } catch (error: any) {
    console.error('Error in order route:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch order' }, { status: 500 })
  }
}

