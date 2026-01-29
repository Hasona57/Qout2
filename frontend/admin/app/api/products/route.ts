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
    let body: any = {}
    
    try {
      body = await request.json()
    } catch (jsonError: any) {
      console.error('Error parsing JSON:', jsonError)
      return NextResponse.json(
        { error: 'Invalid JSON in request body', success: false },
        { status: 400 }
      )
    }

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

    console.log('=== CREATE PRODUCT DEBUG ===')
    console.log('Request body:', JSON.stringify(body, null, 2))

    // Validate required fields
    if (!nameAr || !nameEn) {
      console.error('Validation failed: nameAr or nameEn missing')
      return NextResponse.json(
        { error: 'nameAr and nameEn are required', success: false },
        { status: 400 }
      )
    }

    // Prepare product data
    const productData: any = {
      nameAr,
      nameEn,
      descriptionAr: descriptionAr || null,
      descriptionEn: descriptionEn || null,
      sku: sku || null,
      categoryId: categoryId || null,
      costPrice: parseFloat(String(costPrice || '0')) || 0,
      retailPrice: parseFloat(String(retailPrice || '0')) || 0,
      isActive: isActive !== false,
      isFeatured: isFeatured === true,
    }

    console.log('Product data to insert:', JSON.stringify(productData, null, 2))

    // Create product
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single()

    if (productError) {
      console.error('Error creating product:', productError)
      console.error('Error code:', productError.code)
      console.error('Error details:', productError.details)
      console.error('Error hint:', productError.hint)
      console.error('Error message:', productError.message)
      return NextResponse.json(
        { 
          error: productError.message || 'Failed to create product', 
          success: false,
          details: process.env.NODE_ENV === 'development' ? {
            code: productError.code,
            details: productError.details,
            hint: productError.hint
          } : undefined
        },
        { status: 500 }
      )
    }

    if (!product) {
      console.error('Product created but no data returned')
      return NextResponse.json(
        { error: 'Product created but no data returned', success: false },
        { status: 500 }
      )
    }

    console.log('Product created successfully:', product.id)

    // Create product images if provided
    if (images && images.length > 0 && product) {
      console.log('Creating product images:', images.length)
      const imageRecords = images.map((img: any, index: number) => ({
        productId: product.id,
        url: typeof img === 'string' ? img : (img.url || img),
        altTextAr: typeof img === 'object' ? (img.altTextAr || null) : null,
        altTextEn: typeof img === 'object' ? (img.altTextEn || null) : null,
        sortOrder: index,
        isPrimary: index === 0,
      }))

      console.log('Image records to insert:', JSON.stringify(imageRecords, null, 2))

      const { error: imagesError } = await supabase
        .from('product_images')
        .insert(imageRecords)

      if (imagesError) {
        console.error('Error creating product images:', imagesError)
        console.error('Error code:', imagesError.code)
        console.error('Error details:', imagesError.details)
        // Don't fail the whole request if images fail
      } else {
        console.log('Product images created successfully')
      }
    }

    console.log('Product creation completed successfully')
    return NextResponse.json({ data: product, success: true })
  } catch (error: any) {
    console.error('Error in POST products route:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to create product', 
        success: false,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}



