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

    // Build query - get products first
    let { data, error } = await supabase
      .from('products')
      .select('*')

    if (error) {
      console.error('Error fetching products:', error)
      return NextResponse.json({ data: [], success: true })
    }

    // Filter data
    if (data) {
      if (isActive === 'true') {
        data = data.filter((p: any) => p.isActive === true)
      }
      if (categoryId) {
        data = data.filter((p: any) => p.categoryId === categoryId)
      }
      if (search) {
        const searchLower = search.toLowerCase()
        data = data.filter((p: any) => 
          (p.nameAr && p.nameAr.toLowerCase().includes(searchLower)) ||
          (p.nameEn && p.nameEn.toLowerCase().includes(searchLower))
        )
      }
    }

    // Get related data
    if (data && data.length > 0) {
      const productIds = data.map((p: any) => p.id)
      const categoryIds = [...new Set(data.map((p: any) => p.categoryId).filter(Boolean))]

      // Get variants
      const { data: variants } = await supabase
        .from('product_variants')
        .select('*')
        .in('productId', productIds)

      // Get images
      const { data: images } = await supabase
        .from('product_images')
        .select('*')
        .in('productId', productIds)

      // Get categories
      const { data: categories } = categoryIds.length > 0 ? await supabase
        .from('categories')
        .select('*')
        .in('id', categoryIds) : { data: [] }

      const categoryMap = new Map((categories || []).map((c: any) => [c.id, c]))

      // Get sizes and colors for variants
      const sizeIds = [...new Set((variants || []).map((v: any) => v.sizeId).filter(Boolean))]
      const colorIds = [...new Set((variants || []).map((v: any) => v.colorId).filter(Boolean))]

      const [sizesResult, colorsResult] = await Promise.all([
        sizeIds.length > 0 ? supabase.from('sizes').select('*').in('id', sizeIds) : { data: [] },
        colorIds.length > 0 ? supabase.from('colors').select('*').in('id', colorIds) : { data: [] },
      ])

      const sizeMap = new Map((sizesResult.data || []).map((s: any) => [s.id, s]))
      const colorMap = new Map((colorsResult.data || []).map((c: any) => [c.id, c]))

      // Get stock if locationId provided
      let stockMap = new Map()
      if (locationId && variants) {
        const variantIds = variants.map((v: any) => v.id)
        const { data: stockData } = await supabase
          .from('stock_items')
          .select('variantId, quantity')
          .eq('locationId', locationId)
          .in('variantId', variantIds)
        stockMap = new Map((stockData || []).map((s: any) => [s.variantId, s.quantity]))
      }

      // Combine data
      data = data.map((product: any) => ({
        ...product,
        category: categoryMap.get(product.categoryId) || null,
        variants: (variants || [])
          .filter((v: any) => v.productId === product.id)
          .map((v: any) => ({
            ...v,
            size: sizeMap.get(v.sizeId) || null,
            color: colorMap.get(v.colorId) || null,
            stockQuantity: stockMap.get(v.id) || 0,
          })),
        images: (images || []).filter((img: any) => img.productId === product.id),
      }))
    }

    return NextResponse.json({ data: data || [], success: true })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const body = await request.json()

    const {
      nameAr,
      nameEn,
      descriptionAr,
      descriptionEn,
      sku,
      categoryId,
      costPrice,
      retailPrice,
      isActive = true,
      isFeatured = false,
      images = [],
    } = body

    // Validate required fields
    if (!nameAr || !nameEn) {
      return NextResponse.json(
        { error: 'nameAr and nameEn are required', success: false },
        { status: 400 }
      )
    }

    // Create product
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        nameAr,
        nameEn,
        descriptionAr: descriptionAr || null,
        descriptionEn: descriptionEn || null,
        sku: sku || null,
        categoryId: categoryId || null,
        costPrice: parseFloat(costPrice || '0'),
        retailPrice: parseFloat(retailPrice || '0'),
        isActive: isActive !== false,
        isFeatured: isFeatured === true,
      })
      .select()
      .single()

    if (productError) {
      console.error('Error creating product:', productError)
      return NextResponse.json(
        { error: productError.message || 'Failed to create product', success: false },
        { status: 500 }
      )
    }

    // Create product images if provided
    if (images && images.length > 0 && product) {
      const imageRecords = images.map((img: any, index: number) => ({
        productId: product.id,
        url: typeof img === 'string' ? img : img.url,
        altTextAr: typeof img === 'object' ? img.altTextAr : null,
        altTextEn: typeof img === 'object' ? img.altTextEn : null,
        sortOrder: index,
        isPrimary: index === 0,
      }))

      const { error: imagesError } = await supabase
        .from('product_images')
        .insert(imageRecords)

      if (imagesError) {
        console.error('Error creating product images:', imagesError)
        // Don't fail the whole request if images fail
      }
    }

    return NextResponse.json({ data: product, success: true })
  } catch (error: any) {
    console.error('Error in POST products route:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create product', success: false },
      { status: 500 }
    )
  }
}



