import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseServer } from '@/lib/firebase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('locationId')

    const { db } = getFirebaseServer()

    console.log('=== STOCK API DEBUG ===')
    console.log('LocationId requested:', locationId)

    // Get all stock items
    let stock = await db.getAll('stock_items')

    // Filter by locationId if provided
    if (locationId) {
      stock = stock.filter((s: any) => s.locationId === locationId)
      console.log('Filtering by locationId:', locationId)
    }

    console.log(`Fetched ${stock?.length || 0} stock items for locationId: ${locationId || 'all'}`)

    // Get related data
    if (stock && stock.length > 0) {
      const variantIds = [...new Set(stock.map((s: any) => s.variantId).filter(Boolean))]
      const locationIds = [...new Set(stock.map((s: any) => s.locationId).filter(Boolean))]

      const [variants, locations, products, sizes, colors] = await Promise.all([
        db.getAll('product_variants').then(v => v.filter((v: any) => variantIds.includes(v.id))),
        db.getAll('stock_locations').then(l => l.filter((l: any) => locationIds.includes(l.id))),
        db.getAll('products'),
        db.getAll('sizes'),
        db.getAll('colors'),
      ])

      const productIds = [...new Set(variants.map((v: any) => v.productId).filter(Boolean))]
      const relevantProducts = products.filter((p: any) => productIds.includes(p.id))

      const productMap = new Map(relevantProducts.map((p: any) => [p.id, p]))
      const sizeMap = new Map(sizes.map((s: any) => [s.id, s]))
      const colorMap = new Map(colors.map((c: any) => [c.id, c]))
      const locationMap = new Map(locations.map((l: any) => [l.id, l]))

      stock = stock.map((item: any) => {
        const variant = variants.find((v: any) => v.id === item.variantId)
        const product = variant ? productMap.get(variant.productId) : null
        return {
          ...item,
          variant: variant ? {
            ...variant,
            product: product || null,
            size: sizeMap.get(variant.sizeId) || null,
            color: colorMap.get(variant.colorId) || null,
          } : null,
          location: locationMap.get(item.locationId) || null,
        }
      })
    }

    return NextResponse.json({ data: stock || [], success: true })
  } catch (error: any) {
    console.error('Error in stock route:', error)
    return NextResponse.json({ data: [], success: true })
  }
}

