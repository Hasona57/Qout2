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
      const allLocationIds = [
        ...transfers.map((t: any) => t.fromLocationId),
        ...transfers.map((t: any) => t.toLocationId),
      ].filter(Boolean)
      const locationIds = [...new Set(allLocationIds)]

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

    if (fromLocationId === toLocationId) {
      return NextResponse.json(
        { error: 'Source and destination locations must be different', success: false },
        { status: 400 }
      )
    }

    const supabase = getSupabaseServer()

    // Validate all items first before creating transfer
    const validationErrors: string[] = []
    for (const item of items) {
      const { variantId, quantity } = item
      const qty = parseFloat(String(quantity))

      if (!variantId || isNaN(qty) || qty <= 0) {
        validationErrors.push(`Invalid quantity for variant ${variantId}`)
        continue
      }

      // Check source stock
      const { data: sourceStock, error: stockError } = await supabase
        .from('stock_items')
        .select('*')
        .eq('variantId', variantId)
        .eq('locationId', fromLocationId)
        .single()

      if (stockError || !sourceStock) {
        validationErrors.push(`No stock found for variant ${variantId} at source location`)
        continue
      }

      const availableQuantity = parseFloat(String(sourceStock.quantity || 0))
      if (availableQuantity < qty) {
        validationErrors.push(`Insufficient stock for variant ${variantId}. Available: ${availableQuantity}, Requested: ${qty}`)
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: validationErrors.join('; '), success: false },
        { status: 400 }
      )
    }

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
      const qty = parseFloat(String(quantity))

      // Get source stock again (to ensure we have latest data)
      const { data: sourceStock, error: sourceError } = await supabase
        .from('stock_items')
        .select('*')
        .eq('variantId', variantId)
        .eq('locationId', fromLocationId)
        .single()

      if (sourceError || !sourceStock) {
        // Rollback transfer
        await supabase.from('stock_transfers').delete().eq('id', transfer.id)
        return NextResponse.json(
          { error: `Stock not found for variant ${variantId} at source location`, success: false },
          { status: 400 }
        )
      }

      const availableQty = parseFloat(String(sourceStock.quantity || 0))
      if (availableQty < qty) {
        // Rollback transfer
        await supabase.from('stock_transfers').delete().eq('id', transfer.id)
        return NextResponse.json(
          { error: `Insufficient stock for variant ${variantId}. Available: ${availableQty}, Requested: ${qty}`, success: false },
          { status: 400 }
        )
      }

      // Create transfer item
      const { error: itemError } = await supabase.from('stock_transfer_items').insert({
        transferId: transfer.id,
        variantId,
        quantity: qty,
      })

      if (itemError) {
        console.error('Error creating transfer item:', itemError)
        // Rollback transfer
        await supabase.from('stock_transfers').delete().eq('id', transfer.id)
        return NextResponse.json(
          { error: `Failed to create transfer item: ${itemError.message}`, success: false },
          { status: 500 }
        )
      }

      // Update source location (decrease)
      const newSourceQty = availableQty - qty
      const { error: updateSourceError } = await supabase
        .from('stock_items')
        .update({ quantity: newSourceQty })
        .eq('id', sourceStock.id)

      if (updateSourceError) {
        console.error('Error updating source stock:', updateSourceError)
        // Rollback transfer and items
        await supabase.from('stock_transfer_items').delete().eq('transferId', transfer.id)
        await supabase.from('stock_transfers').delete().eq('id', transfer.id)
        return NextResponse.json(
          { error: `Failed to update source stock: ${updateSourceError.message}`, success: false },
          { status: 500 }
        )
      }

      // Update or create destination location (increase)
      const { data: destStock, error: destError } = await supabase
        .from('stock_items')
        .select('*')
        .eq('variantId', variantId)
        .eq('locationId', toLocationId)
        .single()

      if (destStock) {
        const newDestQty = parseFloat(String(destStock.quantity || 0)) + qty
        const { error: updateDestError } = await supabase
          .from('stock_items')
          .update({ quantity: newDestQty })
          .eq('id', destStock.id)

        if (updateDestError) {
          console.error('Error updating destination stock:', updateDestError)
          // Rollback everything
          await supabase.from('stock_items').update({ quantity: availableQty }).eq('id', sourceStock.id)
          await supabase.from('stock_transfer_items').delete().eq('transferId', transfer.id)
          await supabase.from('stock_transfers').delete().eq('id', transfer.id)
          return NextResponse.json(
            { error: `Failed to update destination stock: ${updateDestError.message}`, success: false },
            { status: 500 }
          )
        }
      } else {
        const { error: insertDestError } = await supabase.from('stock_items').insert({
          variantId,
          locationId: toLocationId,
          quantity: qty,
          reservedQuantity: 0,
          minStockLevel: sourceStock.minStockLevel || 0,
        })

        if (insertDestError) {
          console.error('Error creating destination stock:', insertDestError)
          // Rollback everything
          await supabase.from('stock_items').update({ quantity: availableQty }).eq('id', sourceStock.id)
          await supabase.from('stock_transfer_items').delete().eq('transferId', transfer.id)
          await supabase.from('stock_transfers').delete().eq('id', transfer.id)
          return NextResponse.json(
            { error: `Failed to create destination stock: ${insertDestError.message}`, success: false },
            { status: 500 }
          )
        }
      }
    }

    // Update transfer status to completed
    const { error: statusError } = await supabase
      .from('stock_transfers')
      .update({ status: 'completed', completedAt: new Date().toISOString() })
      .eq('id', transfer.id)

    if (statusError) {
      console.error('Error updating transfer status:', statusError)
      // Transfer succeeded but status update failed - log but don't fail
    }

    return NextResponse.json({ data: transfer, success: true })
  } catch (error: any) {
    console.error('Error in transfer route:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to create transfer', 
        success: false,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

