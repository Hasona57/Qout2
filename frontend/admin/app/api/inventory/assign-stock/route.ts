import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseServer } from '@/lib/firebase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { variantId, locationId, quantity, minStockLevel } = body

    if (!variantId || !locationId || quantity === undefined) {
      return NextResponse.json(
        { error: 'variantId, locationId, and quantity are required', success: false },
        { status: 400 }
      )
    }

    const { db } = getFirebaseServer()

    console.log('=== ASSIGN STOCK DEBUG ===')
    console.log('VariantId:', variantId)
    console.log('LocationId:', locationId)
    console.log('Quantity:', quantity)

    // Check if stock item exists
    const allStock = await db.getAll('stock_items')
    const existingStock = allStock.find((s: any) => s.variantId === variantId && s.locationId === locationId)

    if (existingStock) {
      console.log('Existing stock found:', existingStock)
      // Update existing stock
      const newQuantity = (existingStock.quantity || 0) + parseFloat(quantity)
      console.log('Updating stock - old quantity:', existingStock.quantity, 'new quantity:', newQuantity)
      
      await db.update(`stock_items/${existingStock.id}`, {
        ...existingStock,
        quantity: newQuantity,
        minStockLevel: minStockLevel !== undefined ? parseFloat(minStockLevel) : existingStock.minStockLevel,
        updatedAt: new Date().toISOString(),
      })

      const updatedStock = await db.get(`stock_items/${existingStock.id}`)
      console.log('Stock updated successfully:', updatedStock)
      return NextResponse.json({ data: updatedStock, success: true })
    } else {
      console.log('No existing stock found - creating new stock item')
      // Create new stock item
      const stockId = Date.now().toString(36) + Math.random().toString(36).substr(2)
      const stockData = {
        id: stockId,
        variantId,
        locationId,
        quantity: parseFloat(quantity),
        reservedQuantity: 0,
        minStockLevel: minStockLevel ? parseFloat(minStockLevel) : 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      console.log('Inserting stock data:', stockData)
      
      await db.set(`stock_items/${stockId}`, stockData)

      console.log('Stock created successfully:', stockData)
      return NextResponse.json({ data: stockData, success: true })
    }
  } catch (error: any) {
    console.error('Error in assign-stock route:', error)
    return NextResponse.json({ error: error.message || 'Failed to assign stock', success: false }, { status: 500 })
  }
}



