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
    const body = await request.json()

    const productId = Date.now().toString(36) + Math.random().toString(36).substr(2)
    const productData = {
      ...body,
      id: productId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await db.set(`products/${productId}`, productData)

    return NextResponse.json({ data: productData, success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}



