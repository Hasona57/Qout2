import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('locationId')

    const supabase = getSupabaseServer()

    let stockQuery = supabase
      .from('stock')
      .select(`
        *,
        variant:variantId(*),
        location:locationId(*)
      `)

    if (locationId) {
      stockQuery = stockQuery.eq('locationId', locationId)
    }

    const { data: stock, error } = await stockQuery

    if (error) {
      console.error('Error fetching stock:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: stock || [], success: true })
  } catch (error: any) {
    console.error('Error in stock route:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch stock' }, { status: 500 })
  }
}

