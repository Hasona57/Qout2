import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Check if variant already exists (by size/color combination)
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

    // Check if SKU already exists (SKU must be unique)
    const { data: existingSku, error: skuCheckError } = await supabase
      .from('product_variants')
      .select('id')
      .eq('sku', sku)
      .limit(1)

    if (skuCheckError && skuCheckError.code !== 'PGRST116') {
      console.error('Error checking existing SKU:', skuCheckError)
    }

    if (existingSku && existingSku.length > 0) {
      return NextResponse.json(
        { error: 'SKU already exists. Please use a unique SKU', success: false },
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
      const parsedCost = parseFloat(String(costPrice))
      if (!isNaN(parsedCost)) {
        variantData.costPrice = parsedCost
      }
    } else if (product.costPrice !== undefined && product.costPrice !== null) {
      const parsedCost = parseFloat(String(product.costPrice))
      if (!isNaN(parsedCost)) {
        variantData.costPrice = parsedCost
      }
    }

    if (retailPrice !== undefined && retailPrice !== null && retailPrice !== '') {
      const parsedRetail = parseFloat(String(retailPrice))
      if (!isNaN(parsedRetail)) {
        variantData.retailPrice = parsedRetail
      }
    } else if (product.retailPrice !== undefined && product.retailPrice !== null) {
      const parsedRetail = parseFloat(String(product.retailPrice))
      if (!isNaN(parsedRetail)) {
        variantData.retailPrice = parsedRetail
      }
    }

    // Ensure prices are set (use product prices as fallback)
    if (variantData.costPrice === undefined || variantData.costPrice === null) {
      variantData.costPrice = product.costPrice || 0
    }
    if (variantData.retailPrice === undefined || variantData.retailPrice === null) {
      variantData.retailPrice = product.retailPrice || 0
    }

    // Validate numeric values
    if (isNaN(variantData.costPrice) || variantData.costPrice < 0) {
      variantData.costPrice = 0
    }
    if (isNaN(variantData.retailPrice) || variantData.retailPrice < 0) {
      variantData.retailPrice = 0
    }
    if (isNaN(variantData.weight) || variantData.weight < 0) {
      variantData.weight = 0.5
    }

    const { data: variant, error: variantError } = await supabase
      .from('product_variants')
      .insert(variantData)
      .select()
      .single()

    if (variantError) {
      console.error('Error creating variant:', variantError)
      console.error('Variant data attempted:', JSON.stringify(variantData, null, 2))
      return NextResponse.json(
        { 
          error: variantError.message || 'Failed to create variant', 
          success: false,
          details: variantError.details || variantError.hint || undefined
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: variant, success: true })
  } catch (error: any) {
    console.error('Error in POST variants route:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to create variant', 
        success: false,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

