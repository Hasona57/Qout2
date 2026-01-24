import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
      .eq('id', params.id)
      .single()

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found', success: false },
        { status: 404 }
      )
    }

    // Check if variant already exists
    const { data: existingVariant } = await supabase
      .from('product_variants')
      .select('id')
      .eq('productId', params.id)
      .eq('sizeId', sizeId)
      .eq('colorId', colorId)
      .single()

    if (existingVariant) {
      return NextResponse.json(
        { error: 'Variant with this size and color already exists', success: false },
        { status: 400 }
      )
    }

    // Create variant
    const { data: variant, error: variantError } = await supabase
      .from('product_variants')
      .insert({
        productId: params.id,
        sizeId,
        colorId,
        sku,
        weight: parseFloat(weight || '0.5'),
        barcode: barcode || null,
        costPrice: costPrice !== undefined ? parseFloat(costPrice) : product.costPrice,
        retailPrice: retailPrice !== undefined ? parseFloat(retailPrice) : product.retailPrice,
        isActive: isActive !== false,
      })
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

