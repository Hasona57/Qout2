import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = getSupabaseServer()
    const body = await request.json()

    const {
      sizeId,
      colorId,
      sku,
      weight,
      barcode,
      costPrice,
      retailPrice,
      isActive = true,
    } = body

    // Validate required fields
    if (!sizeId || !colorId || !sku) {
      return NextResponse.json(
        { error: 'sizeId, colorId, and sku are required', success: false },
        { status: 400 }
      )
    }

    // Check if product exists
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, costPrice, retailPrice')
      .eq('id', id)
      .single()

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found', success: false },
        { status: 404 }
      )
    }

    // Check if variant already exists
    const { data: existingVariants, error: checkError } = await supabase
      .from('product_variants')
      .select('id')
      .eq('productId', id)
      .eq('sizeId', sizeId)
      .eq('colorId', colorId)

    // If checkError is not "no rows found", log it but continue
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing variant:', checkError)
    }

    if (existingVariants && existingVariants.length > 0) {
      return NextResponse.json(
        { error: 'Variant with this size and color already exists', success: false },
        { status: 400 }
      )
    }

    // Create variant
    const variantData: any = {
      productId: id,
      sizeId,
      colorId,
      sku,
      weight: weight ? parseFloat(String(weight)) : 0.5,
      barcode: barcode || null,
      isActive: isActive !== false,
    }

    // Handle costPrice and retailPrice
    if (costPrice !== undefined && costPrice !== null && costPrice !== '') {
      variantData.costPrice = parseFloat(String(costPrice))
    } else if (product.costPrice) {
      variantData.costPrice = parseFloat(String(product.costPrice))
    }

    if (retailPrice !== undefined && retailPrice !== null && retailPrice !== '') {
      variantData.retailPrice = parseFloat(String(retailPrice))
    } else if (product.retailPrice) {
      variantData.retailPrice = parseFloat(String(product.retailPrice))
    }

    const { data: variant, error: variantError } = await supabase
      .from('product_variants')
      .insert(variantData)
      .select()
      .single()

    if (variantError) {
      console.error('Error creating variant:', variantError)
      return NextResponse.json(
        { error: variantError.message || 'Failed to create variant', success: false },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: variant, success: true })
  } catch (error: any) {
    console.error('Error in POST variants route:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create variant', success: false },
      { status: 500 }
    )
  }
}

