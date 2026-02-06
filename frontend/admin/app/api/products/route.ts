import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseServer } from '@/lib/firebase'
import { getAllProducts } from '@/lib/firebase-db-helpers'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const categoryId = searchParams.get('categoryId')
    const isActive = searchParams.get('isActive')
    const search = searchParams.get('search')
    const locationId = searchParams.get('locationId')

    const products = await getAllProducts({
      categoryId: categoryId || undefined,
      isActive: isActive === 'true' ? true : undefined,
      search: search || undefined,
      locationId: locationId || undefined,
    })

    return NextResponse.json({ data: products || [], success: true })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
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

    // Generate product ID
    const productId = Date.now().toString(36) + Math.random().toString(36).substr(2)

    // Prepare product data
    const productData: any = {
      id: productId,
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    console.log('Product data to insert:', JSON.stringify(productData, null, 2))

    // Create product in Firebase
    try {
      await db.set(`products/${productId}`, productData)
      console.log('Product created successfully:', productId)

      // Create product images if provided
      if (images && images.length > 0) {
        console.log('Creating product images:', images.length)
        for (let index = 0; index < images.length; index++) {
          const img = images[index]
          const imageId = Date.now().toString(36) + Math.random().toString(36).substr(2) + index
          const imageData = {
            id: imageId,
            productId: productId,
            url: typeof img === 'string' ? img : (img.url || img),
            altTextAr: typeof img === 'object' ? (img.altTextAr || null) : null,
            altTextEn: typeof img === 'object' ? (img.altTextEn || null) : null,
            sortOrder: index,
            isPrimary: index === 0,
            createdAt: new Date().toISOString(),
          }
          await db.set(`product_images/${imageId}`, imageData)
        }
        console.log('Product images created successfully')
      }

      console.log('Product creation completed successfully')
      return NextResponse.json({ data: productData, success: true })
    } catch (error: any) {
      console.error('Error creating product:', error)
      return NextResponse.json(
        { 
          error: error.message || 'Failed to create product', 
          success: false,
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        { status: 500 }
      )
    }
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



