import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServer()
    
    // Get product first
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !product) {
      console.error('Error fetching product:', error)
      return NextResponse.json({ data: null, success: false, error: 'Product not found' }, { status: 404 })
    }

    // Get related data
    const productId = product.id

    // Get variants
    const { data: variants } = await supabase
      .from('product_variants')
      .select('*')
      .eq('productId', productId)

    // Get images
    const { data: images } = await supabase
      .from('product_images')
      .select('*')
      .eq('productId', productId)

    // Get category
    const { data: category } = product.categoryId ? await supabase
      .from('categories')
      .select('*')
      .eq('id', product.categoryId)
      .single() : { data: null }

    // Get sizes and colors for variants
    const sizeIds = [...new Set((variants || []).map((v: any) => v.sizeId).filter(Boolean))]
    const colorIds = [...new Set((variants || []).map((v: any) => v.colorId).filter(Boolean))]

    const [sizesResult, colorsResult] = await Promise.all([
      sizeIds.length > 0 ? supabase.from('sizes').select('*').in('id', sizeIds) : { data: [] },
      colorIds.length > 0 ? supabase.from('colors').select('*').in('id', colorIds) : { data: [] },
    ])

    const sizeMap = new Map((sizesResult.data || []).map((s: any) => [s.id, s]))
    const colorMap = new Map((colorsResult.data || []).map((c: any) => [c.id, c]))

    // Combine data
    const productWithDetails = {
      ...product,
      category: category || null,
      variants: (variants || []).map((v: any) => ({
        ...v,
        size: sizeMap.get(v.sizeId) || null,
        color: colorMap.get(v.colorId) || null,
      })),
      images: images || [],
    }

    return NextResponse.json({ data: productWithDetails, success: true })
  } catch (error: any) {
    console.error('Error in GET product route:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch product', 
        success: false,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}



