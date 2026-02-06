import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseServer } from '@/lib/firebase'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!params || !params.id) {
      return NextResponse.json(
        { error: 'Product ID is required', success: false },
        { status: 400 }
      )
    }

    const { db } = getFirebaseServer()
    
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
    const product = await db.get(`products/${params.id}`)

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found', success: false },
        { status: 404 }
      )
    }

    // Check if variant already exists (by size/color combination)
    const allVariants = await db.getAll('product_variants')
    const existingVariants = allVariants.filter((v: any) => 
      v.productId === params.id && v.sizeId === sizeId && v.colorId === colorId
    )

    if (existingVariants.length > 0) {
      return NextResponse.json(
        { error: 'Variant with this size and color already exists', success: false },
        { status: 400 }
      )
    }

    // Check if SKU already exists (SKU must be unique)
    const existingSku = allVariants.find((v: any) => v.sku === sku)

    if (existingSku) {
      return NextResponse.json(
        { error: 'SKU already exists. Please use a unique SKU', success: false },
        { status: 400 }
      )
    }

    // Create variant
    const variantId = Date.now().toString(36) + Math.random().toString(36).substr(2)
    const variantData: any = {
      id: variantId,
      productId: params.id,
      sizeId,
      colorId,
      sku,
      weight: weight ? parseFloat(String(weight)) : 0.5,
      barcode: barcode || null,
      isActive: isActive !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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

    // Validate variantData before insert
    if (!variantData.productId || !variantData.sizeId || !variantData.colorId || !variantData.sku) {
      return NextResponse.json(
        { error: 'Missing required fields: productId, sizeId, colorId, or sku', success: false },
        { status: 400 }
      )
    }

    await db.set(`product_variants/${variantId}`, variantData)

    return NextResponse.json({ data: variantData, success: true })
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

