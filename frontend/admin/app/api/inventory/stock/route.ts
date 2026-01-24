import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('locationId')

    const supabase = getSupabaseServer()

    // Get stock items - only show items with quantity > 0
    let stockQuery = supabase
      .from('stock_items')
      .select('*')
      .gt('quantity', 0) // Only show items with available stock

    if (locationId) {
      stockQuery = stockQuery.eq('locationId', locationId)
    }

    const { data: stockData, error } = await stockQuery

    if (error) {
      console.error('Error fetching stock:', error)
      return NextResponse.json({ data: [], success: true })
    }

    let stock = stockData || []

    // Get related data
    if (stock && stock.length > 0) {
      const variantIds = [...new Set(stock.map((s: any) => s.variantId).filter(Boolean))]
      const locationIds = [...new Set(stock.map((s: any) => s.locationId).filter(Boolean))]

      const [variantsResult, locationsResult] = await Promise.all([
        variantIds.length > 0 ? supabase.from('product_variants').select('*').in('id', variantIds) : { data: [] },
        locationIds.length > 0 ? supabase.from('stock_locations').select('*').in('id', locationIds) : { data: [] },
      ])

      const variantMap = new Map((variantsResult.data || []).map((v: any) => [v.id, v]))
      const locationMap = new Map((locationsResult.data || []).map((l: any) => [l.id, l]))

      stock = stock.map((item: any) => ({
        ...item,
        variant: variantMap.get(item.variantId) || null,
        location: locationMap.get(item.locationId) || null,
      }))
    }

    return NextResponse.json({ data: stock || [], success: true })
  } catch (error: any) {
    console.error('Error in stock route:', error)
    return NextResponse.json({ data: [], success: true })
  }
}

