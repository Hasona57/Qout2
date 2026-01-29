import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'

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

    const supabase = getSupabaseServer()

    // Check if stock item exists
    const { data: existingStock } = await supabase
      .from('stock_items')
      .select('*')
      .eq('variantId', variantId)
      .eq('locationId', locationId)
      .single()

    if (existingStock) {
      // Update existing stock
      const newQuantity = (existingStock.quantity || 0) + parseFloat(quantity)
      const { data: updatedStock, error } = await supabase
        .from('stock_items')
        .update({
          quantity: newQuantity,
          minStockLevel: minStockLevel !== undefined ? parseFloat(minStockLevel) : existingStock.minStockLevel,
        })
        .eq('id', existingStock.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating stock:', error)
        return NextResponse.json({ error: error.message, success: false }, { status: 500 })
      }

      return NextResponse.json({ data: updatedStock, success: true })
    } else {
      // Create new stock item
      const { data: newStock, error } = await supabase
        .from('stock_items')
        .insert({
          variantId,
          locationId,
          quantity: parseFloat(quantity),
          reservedQuantity: 0,
          minStockLevel: minStockLevel ? parseFloat(minStockLevel) : 0,
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating stock:', error)
        return NextResponse.json({ error: error.message, success: false }, { status: 500 })
      }

      return NextResponse.json({ data: newStock, success: true })
    }
  } catch (error: any) {
    console.error('Error in assign-stock route:', error)
    return NextResponse.json({ error: error.message || 'Failed to assign stock', success: false }, { status: 500 })
  }
}


