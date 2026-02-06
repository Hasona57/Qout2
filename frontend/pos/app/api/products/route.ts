import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseServer } from '@/lib/firebase'

export async function GET(request: NextRequest) {
  try {
    const { db } = getFirebaseServer()
    const { searchParams } = new URL(request.url)
    
    const categoryId = searchParams.get('categoryId')
    const isActive = searchParams.get('isActive')
    const search = searchParams.get('search')
    const locationId = searchParams.get('locationId')

    // Get all products
    let products = await db.getAll('products')

    // Filter data
    if (isActive === 'true') {
      products = products.filter((p: any) => p.isActive === true)
    }
    if (categoryId) {
      products = products.filter((p: any) => p.categoryId === categoryId)
    }
    if (search) {
      const searchLower = search.toLowerCase()
      products = products.filter((p: any) => 
        (p.nameAr && p.nameAr.toLowerCase().includes(searchLower)) ||
        (p.nameEn && p.nameEn.toLowerCase().includes(searchLower))
      )
    }

    // Get related data
    if (products && products.length > 0) {
      const productIds = products.map((p: any) => p.id)
      const categoryIds = [...new Set(products.map((p: any) => p.categoryId).filter(Boolean))]

      // Get variants, images, categories, sizes, colors, stock
      const [variants, images, categories, sizes, colors, stockItems] = await Promise.all([
        db.getAll('product_variants').then(v => v.filter((v: any) => productIds.includes(v.productId))),
        db.getAll('product_images').then(i => i.filter((i: any) => productIds.includes(i.productId))),
        categoryIds.length > 0 ? db.getAll('categories').then(c => c.filter((c: any) => categoryIds.includes(c.id))) : Promise.resolve([]),
        db.getAll('sizes'),
        db.getAll('colors'),
        locationId ? db.getAll('stock_items').then(s => s.filter((s: any) => s.locationId === locationId)) : Promise.resolve([]),
      ])

      const categoryMap = new Map(categories.map((c: any) => [c.id, c]))
      const sizeMap = new Map(sizes.map((s: any) => [s.id, s]))
      const colorMap = new Map(colors.map((c: any) => [c.id, c]))
      const stockMap = new Map(stockItems.map((s: any) => [s.variantId, s.quantity]))

      // Combine data
      products = products.map((product: any) => ({
        ...product,
        category: categoryMap.get(product.categoryId) || null,
        variants: variants
          .filter((v: any) => v.productId === product.id)
          .map((v: any) => ({
            ...v,
            size: sizeMap.get(v.sizeId) || null,
            color: colorMap.get(v.colorId) || null,
            stockQuantity: stockMap.get(v.id) || 0,
          })),
        images: images.filter((img: any) => img.productId === product.id),
      }))
    }

    return NextResponse.json({ data: products || [], success: true })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}



