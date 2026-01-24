import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('locationId')

    const supabase = getSupabaseServer()

    // Get stock items - show all items (including 0 quantity) for admin view
    // But we can filter to show only available if needed
    let stockQuery = supabase
      .from('stock_items')
      .select('*')

    if (locationId) {
      stockQuery = stockQuery.eq('locationId', locationId)
    }

    const { data: stockData, error } = await stockQuery

    if (error) {
      console.error('Error fetching stock:', error)
      console.error('Error details:', error.message, error.code, error.details)
      return NextResponse.json({ data: [], success: true })
    }

    console.log(`Fetched ${stockData?.length || 0} stock items for locationId: ${locationId || 'all'}`)
    let stock = stockData || []

    // Get related data
    if (stock && stock.length > 0) {
      const variantIds = [...new Set(stock.map((s: any) => s.variantId).filter(Boolean))]
      const locationIds = [...new Set(stock.map((s: any) => s.locationId).filter(Boolean))]

      const [variantsResult, locationsResult] = await Promise.all([
        variantIds.length > 0 ? supabase.from('product_variants').select('*').in('id', variantIds) : { data: [] },
        locationIds.length > 0 ? supabase.from('stock_locations').select('*').in('id', locationIds) : { data: [] },
      ])

      const variants = variantsResult.data || []
      const productIds = [...new Set(variants.map((v: any) => v.productId).filter(Boolean))]
      
      // Get products
      const { data: products } = productIds.length > 0 ? await supabase
        .from('products')
        .select('*')
        .in('id', productIds) : { data: [] }

      // Get sizes and colors for variants
      const sizeIds = [...new Set(variants.map((v: any) => v.sizeId).filter(Boolean))]
      const colorIds = [...new Set(variants.map((v: any) => v.colorId).filter(Boolean))]

      const [sizesResult, colorsResult] = await Promise.all([
        sizeIds.length > 0 ? supabase.from('sizes').select('*').in('id', sizeIds) : { data: [] },
        colorIds.length > 0 ? supabase.from('colors').select('*').in('id', colorIds) : { data: [] },
      ])

      const productMap = new Map((products || []).map((p: any) => [p.id, p]))
      const sizeMap = new Map((sizesResult.data || []).map((s: any) => [s.id, s]))
      const colorMap = new Map((colorsResult.data || []).map((c: any) => [c.id, c]))
      const locationMap = new Map((locationsResult.data || []).map((l: any) => [l.id, l]))

      stock = stock.map((item: any) => {
        const variant = variants.find((v: any) => v.id === item.variantId)
        const product = variant ? productMap.get(variant.productId) : null
        return {
          ...item,
          variant: variant ? {
            ...variant,
            product: product || null,
            size: sizeMap.get(variant.sizeId) || null,
            color: colorMap.get(variant.colorId) || null,
          } : null,
          location: locationMap.get(item.locationId) || null,
        }
      })
    }

    return NextResponse.json({ data: stock || [], success: true })
  } catch (error: any) {
    console.error('Error in stock route:', error)
    return NextResponse.json({ data: [], success: true })
  }
}

