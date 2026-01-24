import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this'

async function getUserIdFromToken(request: NextRequest): Promise<string | null> {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }
    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET) as any
    return decoded.sub || decoded.id || null
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

    const supabase = getSupabaseServer()
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

    for (const item of items) {
      const { variantId, quantity, unitPrice, costPrice } = item
      const qty = parseFloat(quantity) || 0
      const price = parseFloat(unitPrice) || 0
      const itemTotal = qty * price
      subtotal += itemTotal

      // Get variant to get cost price if not provided
      const { data: variant } = await supabase
        .from('product_variants')
        .select('costPrice')
        .eq('id', variantId)
        .single()

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

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}`

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
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
      })
      .select()
      .single()

    if (invoiceError) {
      console.error('Error creating invoice:', invoiceError)
      return NextResponse.json({ error: invoiceError.message, success: false }, { status: 500 })
    }

    // Create invoice items
    for (const item of invoiceItems) {
      const { error: itemError } = await supabase
        .from('invoice_items')
        .insert({
          invoiceId: invoice.id,
          ...item,
        })

      if (itemError) {
        console.error('Error creating invoice item:', itemError)
        // Rollback invoice
        await supabase.from('invoices').delete().eq('id', invoice.id)
        return NextResponse.json({ error: 'Failed to create invoice items', success: false }, { status: 500 })
      }

      // Update stock
      if (locationId) {
        const { data: stock } = await supabase
          .from('stock_items')
          .select('*')
          .eq('variantId', item.variantId)
          .eq('locationId', locationId)
          .single()

        if (stock) {
          const newQuantity = (stock.quantity || 0) - item.quantity
          await supabase
            .from('stock_items')
            .update({ quantity: Math.max(0, newQuantity) })
            .eq('id', stock.id)
        }
      }
    }

    return NextResponse.json({ data: invoice, success: true })
  } catch (error: any) {
    console.error('Error in invoices route:', error)
    return NextResponse.json({ error: error.message || 'Failed to create invoice', success: false }, { status: 500 })
  }
}

