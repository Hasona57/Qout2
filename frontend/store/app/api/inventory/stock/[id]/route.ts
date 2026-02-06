import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseServer } from '@/lib/firebase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!params || !params.id) {
      return NextResponse.json(
        { error: 'Variant ID is required', success: false },
        { status: 400 }
      )
    }

    const { db } = getFirebaseServer()

    // Get stock items for this variant
    const allStock = await db.getAll('stock_items')
    let stock = allStock.filter((s: any) => s.variantId === params.id)

    console.log(`Fetched ${stock?.length || 0} stock items for variant ${params.id}`)

    // Get related data
    if (stock && stock.length > 0) {
      const locationIds = [...new Set(stock.map((s: any) => s.locationId).filter(Boolean))]

      const allLocations = await db.getAll('stock_locations')
      const locations = allLocations.filter((l: any) => locationIds.includes(l.id))

      const locationMap = new Map(locations.map((l: any) => [l.id, l]))

      stock = stock.map((item: any) => ({
        ...item,
        location: locationMap.get(item.locationId) || null,
      }))
    }

    return NextResponse.json({ data: stock || [], success: true })
  } catch (error: any) {
    console.error('Error in stock route:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch stock', 
        success: false,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

