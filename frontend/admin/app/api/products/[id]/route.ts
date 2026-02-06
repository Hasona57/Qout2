import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseServer } from '@/lib/firebase'
import { getProductById } from '@/lib/firebase-db-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await getProductById(params.id)

    if (!product) {
      return NextResponse.json({ data: null, success: false, error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({ data: product, success: true })
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

    // Get existing product
    const existingProduct = await db.get(`products/${params.id}`)
    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found', success: false },
        { status: 404 }
      )
    }

    // Prepare update data (only include fields that are provided)
    const updateData: any = {
      ...existingProduct,
      updatedAt: new Date().toISOString(),
    }
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

    // Update product
    await db.update(`products/${params.id}`, updateData)

    // Handle images if provided
    if (images && Array.isArray(images)) {
      // Delete existing images
      const allImages = await db.getAll('product_images')
      const productImages = allImages.filter((img: any) => img.productId === params.id)
      for (const img of productImages) {
        await db.remove(`product_images/${img.id}`)
      }

      // Insert new images
      if (images.length > 0) {
        for (let index = 0; index < images.length; index++) {
          const img = images[index]
          const imageId = Date.now().toString(36) + Math.random().toString(36).substr(2) + index
          const imageData = {
            id: imageId,
            productId: params.id,
            url: typeof img === 'string' ? img : img.url,
            altTextAr: typeof img === 'object' ? img.altTextAr : null,
            altTextEn: typeof img === 'object' ? img.altTextEn : null,
            sortOrder: index,
            isPrimary: index === 0,
            createdAt: new Date().toISOString(),
          }
          await db.set(`product_images/${imageId}`, imageData)
        }
      }
    }

    const updatedProduct = await getProductById(params.id)
    return NextResponse.json({ data: updatedProduct, success: true })
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
  { params }: { params: { id: string } }
) {
  try {
    const { db } = getFirebaseServer()

    // Delete product images first
    const allImages = await db.getAll('product_images')
    const productImages = allImages.filter((img: any) => img.productId === params.id)
    for (const img of productImages) {
      await db.remove(`product_images/${img.id}`)
    }

    // Delete product variants
    const allVariants = await db.getAll('product_variants')
    const productVariants = allVariants.filter((v: any) => v.productId === params.id)
    for (const variant of productVariants) {
      await db.remove(`product_variants/${variant.id}`)
    }

    // Delete product
    await db.remove(`products/${params.id}`)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE product route:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete product', success: false },
      { status: 500 }
    )
  }
}

