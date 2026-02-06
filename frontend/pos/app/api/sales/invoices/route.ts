import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseServer } from '@/lib/firebase'
import { verifyIdToken } from '@/lib/firebase-auth-server'

async function getUserIdFromToken(request: NextRequest): Promise<string | null> {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }
    const token = authHeader.substring(7)
    return await verifyIdToken(token)
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { locationId, items, customerId, notes } = body

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Items are required', success: false },
        { status: 400 }
      )
    }

    const { db } = getFirebaseServer()
    const userId = await getUserIdFromToken(request)

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 401 }
      )
    }

    // Calculate totals
    let subtotal = 0
    const invoiceItems = []

    // Get all variants for cost price lookup
    const allVariants = await db.getAll('product_variants')

    for (const item of items) {
      const { variantId, quantity, unitPrice, costPrice } = item
      const qty = parseFloat(quantity) || 0
      const price = parseFloat(unitPrice) || 0
      const itemTotal = qty * price
      subtotal += itemTotal

      // Get variant to get cost price if not provided
      const variant = allVariants.find((v: any) => v.id === variantId)
      const itemCostPrice = costPrice || parseFloat(variant?.costPrice || '0')

      invoiceItems.push({
        variantId,
        quantity: qty,
        unitPrice: price,
        costPrice: itemCostPrice,
        discountAmount: '0',
        total: itemTotal.toFixed(2),
        profitMargin: ((price - itemCostPrice) * qty).toFixed(2),
      })
    }

    const discountAmount = parseFloat(body.discountAmount || '0')
    const taxAmount = parseFloat(body.taxAmount || '0')
    const total = subtotal - discountAmount + taxAmount

    // Generate invoice number and ID
    const invoiceNumber = `INV-${Date.now()}`
    const invoiceId = Date.now().toString(36) + Math.random().toString(36).substr(2)

    // Create invoice
    const invoice = {
      id: invoiceId,
      invoiceNumber,
      customerId: customerId || null,
      createdById: userId,
      status: 'pending',
      saleType: 'retail',
      subtotal: subtotal.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      total: total.toFixed(2),
      paidAmount: '0',
      commissionAmount: '0',
      notes: notes || null,
      locationId: locationId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await db.set(`invoices/${invoiceId}`, invoice)

    // Create invoice items and update stock
    const allStock = await db.getAll('stock_items')
    
    for (const item of invoiceItems) {
      const itemId = Date.now().toString(36) + Math.random().toString(36).substr(2) + 'item'
      await db.set(`invoice_items/${itemId}`, {
        id: itemId,
        invoiceId: invoiceId,
        ...item,
        createdAt: new Date().toISOString(),
      })

      // Update stock
      if (locationId) {
        const stock = allStock.find((s: any) => s.variantId === item.variantId && s.locationId === locationId)

        if (stock) {
          const newQuantity = Math.max(0, (stock.quantity || 0) - item.quantity)
          await db.update(`stock_items/${stock.id}`, {
            ...stock,
            quantity: newQuantity,
            updatedAt: new Date().toISOString(),
          })
        }
      }
    }

    return NextResponse.json({ data: invoice, success: true })
  } catch (error: any) {
    console.error('Error in invoices route:', error)
    return NextResponse.json({ error: error.message || 'Failed to create invoice', success: false }, { status: 500 })
  }
}







