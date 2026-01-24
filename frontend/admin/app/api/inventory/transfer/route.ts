import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServer()

    const { data: transfersData, error } = await supabase
      .from('stock_transfers')
      .select('*')
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('Error fetching transfers:', error)
      return NextResponse.json({ data: [], success: true })
    }

    let transfers = transfersData || []

    // Get related data
    if (transfers && transfers.length > 0) {
      const locationIds = [...new Set([
        ...transfers.map((t: any) => t.fromLocationId),
        ...transfers.map((t: any) => t.toLocationId),
      ]).filter(Boolean)]

      const { data: locations } = locationIds.length > 0 ? await supabase
        .from('stock_locations')
        .select('*')
        .in('id', locationIds) : { data: [] }

      const locationMap = new Map((locations || []).map((l: any) => [l.id, l]))

      transfers = transfers.map((transfer: any) => ({
        ...transfer,
        fromLocation: locationMap.get(transfer.fromLocationId) || null,
        toLocation: locationMap.get(transfer.toLocationId) || null,
      }))
    }

    return NextResponse.json({ data: transfers || [], success: true })
  } catch (error: any) {
    console.error('Error in transfer route:', error)
    return NextResponse.json({ data: [], success: true })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fromLocationId, toLocationId, items, notes } = body

    if (!fromLocationId || !toLocationId || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'fromLocationId, toLocationId, and items are required', success: false },
        { status: 400 }
      )
    }

    const supabase = getSupabaseServer()

    // Generate transfer number
    const transferNumber = `TRF-${Date.now()}`

    // Create transfer record
    const { data: transfer, error: transferError } = await supabase
      .from('stock_transfers')
      .insert({
        transferNumber,
        fromLocationId,
        toLocationId,
        status: 'pending',
        notes: notes || null,
      })
      .select()
      .single()

    if (transferError) {
      console.error('Error creating transfer:', transferError)
      return NextResponse.json({ error: transferError.message, success: false }, { status: 500 })
    }

    // Create transfer items and update stock
    for (const item of items) {
      const { variantId, quantity } = item

      // Check source stock
      const { data: sourceStock } = await supabase
        .from('stock_items')
        .select('*')
        .eq('variantId', variantId)
        .eq('locationId', fromLocationId)
        .single()

      if (!sourceStock || (sourceStock.quantity || 0) < quantity) {
        // Rollback transfer
        await supabase.from('stock_transfers').delete().eq('id', transfer.id)
        return NextResponse.json(
          { error: `Insufficient stock for variant ${variantId}`, success: false },
          { status: 400 }
        )
      }

      // Create transfer item
      await supabase.from('stock_transfer_items').insert({
        transferId: transfer.id,
        variantId,
        quantity: parseFloat(quantity),
      })

      // Update source location (decrease)
      await supabase
        .from('stock_items')
        .update({ quantity: (sourceStock.quantity || 0) - parseFloat(quantity) })
        .eq('id', sourceStock.id)

      // Update or create destination location (increase)
      const { data: destStock } = await supabase
        .from('stock_items')
        .select('*')
        .eq('variantId', variantId)
        .eq('locationId', toLocationId)
        .single()

      if (destStock) {
        await supabase
          .from('stock_items')
          .update({ quantity: (destStock.quantity || 0) + parseFloat(quantity) })
          .eq('id', destStock.id)
      } else {
        await supabase.from('stock_items').insert({
          variantId,
          locationId: toLocationId,
          quantity: parseFloat(quantity),
          reservedQuantity: 0,
          minStockLevel: sourceStock.minStockLevel || 0,
        })
      }
    }

    // Update transfer status to completed
    await supabase
      .from('stock_transfers')
      .update({ status: 'completed', completedAt: new Date().toISOString() })
      .eq('id', transfer.id)

    return NextResponse.json({ data: transfer, success: true })
  } catch (error: any) {
    console.error('Error in transfer route:', error)
    return NextResponse.json({ error: error.message || 'Failed to create transfer', success: false }, { status: 500 })
  }
}

