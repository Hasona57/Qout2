import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!params || !params.id) {
      return NextResponse.json(
        { error: 'Variant ID is required', success: false },
        { status: 400 }
      )
    }

    const supabase = getSupabaseServer()

    // Get stock items for this variant
    const { data: stockData, error } = await supabase
      .from('stock_items')
      .select('*')
      .eq('variantId', params.id)

    if (error) {
      console.error('Error fetching stock:', error)
      return NextResponse.json({ data: [], success: true })
    }

    let stock = stockData || []

    // Get related data
    if (stock && stock.length > 0) {
      const locationIds = [...new Set(stock.map((s: any) => s.locationId).filter(Boolean))]

      const { data: locations } = locationIds.length > 0 ? await supabase
        .from('stock_locations')
        .select('*')
        .in('id', locationIds) : { data: [] }

      const locationMap = new Map((locations || []).map((l: any) => [l.id, l]))

      stock = stock.map((item: any) => ({
        ...item,
        location: locationMap.get(item.locationId) || null,
      }))
    }

    return NextResponse.json({ data: stock || [], success: true })
  } catch (error: any) {
    console.error('Error in stock route:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch stock', 
        success: false,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

