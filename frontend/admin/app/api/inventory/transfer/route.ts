import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseServer } from '@/lib/firebase'

export async function GET(request: NextRequest) {
  try {
    const { db } = getFirebaseServer()

    let transfers = await db.getAll('stock_transfers')
    
    // Sort by createdAt descending
    transfers.sort((a: any, b: any) => {
      const dateA = new Date(a.createdAt || 0).getTime()
      const dateB = new Date(b.createdAt || 0).getTime()
      return dateB - dateA
    })

    // Get related data
    if (transfers && transfers.length > 0) {
      const allLocationIds = [
        ...transfers.map((t: any) => t.fromLocationId),
        ...transfers.map((t: any) => t.toLocationId),
      ].filter(Boolean)
      const locationIds = [...new Set(allLocationIds)]

      const allLocations = await db.getAll('stock_locations')
      const locations = allLocations.filter((l: any) => locationIds.includes(l.id))

      const locationMap = new Map(locations.map((l: any) => [l.id, l]))

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

    const { db } = getFirebaseServer()

    // Validate all items first before creating transfer
    const validationErrors: string[] = []
    const allStock = await db.getAll('stock_items')
    
    for (const item of items) {
      const { variantId, quantity } = item
      const qty = parseFloat(String(quantity))

      if (!variantId || isNaN(qty) || qty <= 0) {
        validationErrors.push(`Invalid quantity for variant ${variantId}`)
        continue
      }

      // Check source stock
      const sourceStock = allStock.find((s: any) => s.variantId === variantId && s.locationId === fromLocationId)

      if (!sourceStock) {
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

    // Generate transfer number and ID
    const transferNumber = `TRF-${Date.now()}`
    const transferId = Date.now().toString(36) + Math.random().toString(36).substr(2)

    // Create transfer record
    const transfer = {
      id: transferId,
      transferNumber,
      fromLocationId,
      toLocationId,
      status: 'pending',
      notes: notes || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await db.set(`stock_transfers/${transferId}`, transfer)

    // Create transfer items and update stock
    for (const item of items) {
      const { variantId, quantity } = item
      const qty = parseFloat(String(quantity))

      // Get source stock again (refresh from database)
      const currentStock = await db.getAll('stock_items')
      const sourceStock = currentStock.find((s: any) => s.variantId === variantId && s.locationId === fromLocationId)

      if (!sourceStock) {
        // Rollback transfer
        await db.remove(`stock_transfers/${transferId}`)
        return NextResponse.json(
          { error: `Stock not found for variant ${variantId} at source location`, success: false },
          { status: 400 }
        )
      }

      const availableQty = parseFloat(String(sourceStock.quantity || 0))
      if (availableQty < qty) {
        // Rollback transfer
        await db.remove(`stock_transfers/${transferId}`)
        return NextResponse.json(
          { error: `Insufficient stock for variant ${variantId}. Available: ${availableQty}, Requested: ${qty}`, success: false },
          { status: 400 }
        )
      }

      // Create transfer item
      const transferItemId = Date.now().toString(36) + Math.random().toString(36).substr(2) + 'item'
      await db.set(`stock_transfer_items/${transferItemId}`, {
        id: transferItemId,
        transferId: transferId,
        variantId,
        quantity: qty,
        createdAt: new Date().toISOString(),
      })

      // Update source location (decrease)
      const newSourceQty = availableQty - qty
      await db.update(`stock_items/${sourceStock.id}`, {
        ...sourceStock,
        quantity: newSourceQty,
        updatedAt: new Date().toISOString(),
      })

      // Update or create destination location (increase)
      const destStock = currentStock.find((s: any) => s.variantId === variantId && s.locationId === toLocationId)

      if (destStock) {
        const newDestQty = parseFloat(String(destStock.quantity || 0)) + qty
        await db.update(`stock_items/${destStock.id}`, {
          ...destStock,
          quantity: newDestQty,
          updatedAt: new Date().toISOString(),
        })
      } else {
        const destStockId = Date.now().toString(36) + Math.random().toString(36).substr(2) + 'dest'
        await db.set(`stock_items/${destStockId}`, {
          id: destStockId,
          variantId,
          locationId: toLocationId,
          quantity: qty,
          reservedQuantity: 0,
          minStockLevel: sourceStock.minStockLevel || 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      }
    }

    // Update transfer status to completed
    await db.update(`stock_transfers/${transferId}`, {
      ...transfer,
      status: 'completed',
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    const completedTransfer = await db.get(`stock_transfers/${transferId}`)
    return NextResponse.json({ data: completedTransfer, success: true })
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

