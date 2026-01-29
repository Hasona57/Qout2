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

    console.log('=== ASSIGN STOCK DEBUG ===')
    console.log('VariantId:', variantId)
    console.log('LocationId:', locationId)
    console.log('Quantity:', quantity)

    // Check if stock item exists
    const { data: existingStock, error: checkError } = await supabase
      .from('stock_items')
      .select('*')
      .eq('variantId', variantId)
      .eq('locationId', locationId)
      .maybeSingle()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error checking existing stock:', checkError)
    }

    if (existingStock) {
      console.log('Existing stock found:', existingStock)
      // Update existing stock
      const newQuantity = (existingStock.quantity || 0) + parseFloat(quantity)
      console.log('Updating stock - old quantity:', existingStock.quantity, 'new quantity:', newQuantity)
      
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
        console.error('Error details:', error.message, error.code, error.details, error.hint)
        return NextResponse.json({ 
          error: error.message || 'Failed to update stock', 
          success: false,
          details: process.env.NODE_ENV === 'development' ? error : undefined
        }, { status: 500 })
      }

      console.log('Stock updated successfully:', updatedStock)
      return NextResponse.json({ data: updatedStock, success: true })
    } else {
      console.log('No existing stock found - creating new stock item')
      // Create new stock item
      const stockData = {
        variantId,
        locationId,
        quantity: parseFloat(quantity),
        reservedQuantity: 0,
        minStockLevel: minStockLevel ? parseFloat(minStockLevel) : 0,
      }
      console.log('Inserting stock data:', stockData)
      
      const { data: newStock, error } = await supabase
        .from('stock_items')
        .insert(stockData)
        .select()
        .single()

      if (error) {
        console.error('Error creating stock:', error)
        console.error('Error details:', error.message, error.code, error.details, error.hint)
        return NextResponse.json({ 
          error: error.message || 'Failed to create stock', 
          success: false,
          details: process.env.NODE_ENV === 'development' ? error : undefined
        }, { status: 500 })
      }

      console.log('Stock created successfully:', newStock)
      return NextResponse.json({ data: newStock, success: true })
    }
  } catch (error: any) {
    console.error('Error in assign-stock route:', error)
    return NextResponse.json({ error: error.message || 'Failed to assign stock', success: false }, { status: 500 })
  }
}



