import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServer()

    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(
          *,
          variant:variantId(*)
        ),
        user:userId(*)
      `)
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('Error fetching orders:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: orders || [], success: true })
  } catch (error: any) {
    console.error('Error in orders route:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch orders' }, { status: 500 })
  }
}

