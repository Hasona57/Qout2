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
      .order('sortOrder', { ascending: true })

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
    console.error('Error in product route:', error)
    return NextResponse.json({ data: null, success: false, error: error.message })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      isActive,
      isFeatured,
      images,
    } = body

    // Prepare update data (only include fields that are provided)
    const updateData: any = {}
    if (nameAr !== undefined) updateData.nameAr = nameAr
    if (nameEn !== undefined) updateData.nameEn = nameEn
    if (descriptionAr !== undefined) updateData.descriptionAr = descriptionAr
    if (descriptionEn !== undefined) updateData.descriptionEn = descriptionEn
    if (sku !== undefined) updateData.sku = sku
    if (categoryId !== undefined) updateData.categoryId = categoryId
    if (costPrice !== undefined && costPrice !== null && costPrice !== '') {
      updateData.costPrice = parseFloat(String(costPrice))
    }
    if (retailPrice !== undefined && retailPrice !== null && retailPrice !== '') {
      updateData.retailPrice = parseFloat(String(retailPrice))
    }
    if (isActive !== undefined) updateData.isActive = isActive
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured

    // Get product first (needed for images update)
    let product: any = null
    if (Object.keys(updateData).length > 0) {
      // Update product only if there's data to update
      const { data: updatedProduct, error: productError } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', params.id)
        .select()
        .single()

      if (productError) {
        console.error('Error updating product:', productError)
        return NextResponse.json(
          { error: productError.message || 'Failed to update product', success: false },
          { status: 500 }
        )
      }
      product = updatedProduct
    } else {
      // If no update data, just get the product
      const { data: existingProduct, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('id', params.id)
        .single()

      if (fetchError) {
        console.error('Error fetching product:', fetchError)
        return NextResponse.json(
          { error: 'Product not found', success: false },
          { status: 404 }
        )
      }
      product = existingProduct
    }

    // Handle images if provided
    if (images && Array.isArray(images) && product) {
      // Delete existing images
      await supabase
        .from('product_images')
        .delete()
        .eq('productId', params.id)

      // Insert new images
      if (images.length > 0) {
        const imageRecords = images.map((img: any, index: number) => ({
          productId: params.id,
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
          console.error('Error updating product images:', imagesError)
          // Don't fail the whole request if images fail
        }
      }
    }

    return NextResponse.json({ data: product, success: true })
  } catch (error: any) {
    console.error('Error in PATCH product route:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to update product', 
        success: false,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = getSupabaseServer()

    // Delete product images first (cascade should handle this, but let's be explicit)
    await supabase
      .from('product_images')
      .delete()
      .eq('productId', id)

    // Delete product variants
    await supabase
      .from('product_variants')
      .delete()
      .eq('productId', id)

    // Delete product
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting product:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to delete product', success: false },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE product route:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete product', success: false },
      { status: 500 }
    )
  }
}

