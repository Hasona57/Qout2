import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const { searchParams } = new URL(request.url)
    
    const categoryId = searchParams.get('categoryId')
    const isActive = searchParams.get('isActive')
    const search = searchParams.get('search')
    const locationId = searchParams.get('locationId')

    // Build query
    let query = supabase
      .from('products')
      .select(`
        *,
        variants (
          *,
          size:sizeId (*),
          color:colorId (*)
        ),
        images (*),
        category:categoryId (*)
      `)

    if (isActive === 'true') {
      query = query.eq('isActive', true)
    }

    if (categoryId) {
      query = query.eq('categoryId', categoryId)
    }

    if (search) {
      query = query.or(`nameAr.ilike.%${search}%,nameEn.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If locationId provided, add stock information
    if (locationId && data) {
      const productsWithStock = await Promise.all(
        data.map(async (product: any) => {
          if (product.variants && product.variants.length > 0) {
            const variantIds = product.variants.map((v: any) => v.id)
            const { data: stockData } = await supabase
              .from('stock_items')
              .select('variantId, quantity')
              .eq('locationId', locationId)
              .in('variantId', variantIds)

            const stockMap = new Map(stockData?.map((s: any) => [s.variantId, s.quantity]) || [])

            product.variants = product.variants.map((variant: any) => ({
              ...variant,
              stockQuantity: stockMap.get(variant.id) || 0,
            }))
          }
          return product
        })
      )
      return NextResponse.json({ data: productsWithStock, success: true })
    }

    return NextResponse.json({ data, success: true })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const body = await request.json()

    const { data, error } = await supabase
      .from('products')
      .insert(body)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data, success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}


