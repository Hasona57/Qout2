import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseServer } from '@/lib/firebase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const { db } = getFirebaseServer()

    // Get all invoices and orders
    const [allInvoices, allOrders, allInvoiceItems, allOrderItems, allVariants] = await Promise.all([
      db.getAll('invoices'),
      db.getAll('orders'),
      db.getAll('invoice_items'),
      db.getAll('order_items'),
      db.getAll('product_variants'),
    ])

    // Filter invoices (paid status)
    let invoices = allInvoices.filter((inv: any) => inv.status === 'paid')
    
    // Filter orders (active statuses)
    let orders = allOrders.filter((o: any) => 
      ['pending', 'processing', 'confirmed', 'shipped', 'delivered'].includes(o.status)
    )

    // Filter by date if provided
    if (startDate) {
      const start = new Date(startDate).getTime()
      invoices = invoices.filter((inv: any) => new Date(inv.createdAt || 0).getTime() >= start)
      orders = orders.filter((o: any) => new Date(o.createdAt || 0).getTime() >= start)
    }
    if (endDate) {
      const end = new Date(`${endDate}T23:59:59.999Z`).getTime()
      invoices = invoices.filter((inv: any) => new Date(inv.createdAt || 0).getTime() <= end)
      orders = orders.filter((o: any) => new Date(o.createdAt || 0).getTime() <= end)
    }

    // Get invoice items and order items
    if (invoices.length > 0) {
      const invoiceIds = invoices.map((inv: any) => inv.id)
      const relevantItems = allInvoiceItems.filter((item: any) => invoiceIds.includes(item.invoiceId))
      
      const itemsByInvoice = new Map()
      relevantItems.forEach((item: any) => {
        if (!itemsByInvoice.has(item.invoiceId)) {
          itemsByInvoice.set(item.invoiceId, [])
        }
        itemsByInvoice.get(item.invoiceId).push(item)
      })
      
      invoices = invoices.map((inv: any) => ({
        ...inv,
        items: itemsByInvoice.get(inv.id) || [],
      }))
    }

    if (orders.length > 0) {
      const orderIds = orders.map((o: any) => o.id)
      const relevantItems = allOrderItems.filter((item: any) => orderIds.includes(item.orderId))
      
      // Add variants to order items
      const variantMap = new Map(allVariants.map((v: any) => [v.id, v]))
      const itemsWithVariants = relevantItems.map((item: any) => ({
        ...item,
        variant: variantMap.get(item.variantId) || null,
      }))
      
      const itemsByOrder = new Map()
      itemsWithVariants.forEach((item: any) => {
        if (!itemsByOrder.has(item.orderId)) {
          itemsByOrder.set(item.orderId, [])
        }
        itemsByOrder.get(item.orderId).push(item)
      })
      
      orders = orders.map((order: any) => ({
        ...order,
        items: itemsByOrder.get(order.id) || [],
      }))
    }

    // Calculate POS totals
    const posSales = invoices.reduce((sum, inv) => {
      return sum + parseFloat(inv.total || '0')
    }, 0)

    const posProfit = invoices.reduce((sum, inv) => {
      const invProfit = (inv.items || []).reduce((itemSum: number, item: any) => {
        const price = parseFloat(item.unitPrice || '0')
        const cost = parseFloat(item.costPrice || '0')
        const qty = item.quantity || 0
        return itemSum + ((price - cost) * qty)
      }, 0)
      return sum + invProfit
    }, 0)

    // Calculate online order totals
    const onlineSales = orders.reduce((sum, order) => {
      return sum + parseFloat(order.total || '0')
    }, 0)

    const onlineProfit = orders.reduce((sum, order) => {
      const orderProfit = (order.items || []).reduce((itemSum: number, item: any) => {
        if (item.variant) {
          const price = parseFloat(item.unitPrice || '0')
          const cost = parseFloat(item.variant.costPrice || '0')
          const qty = item.quantity || 0
          return itemSum + ((price - cost) * qty)
        }
        return itemSum
      }, 0)
      return sum + orderProfit
    }, 0)

    const totalSales = posSales + onlineSales
    const totalProfit = posProfit + onlineProfit

    return NextResponse.json({
      data: {
        posSales: posSales.toFixed(2),
        posProfit: posProfit.toFixed(2),
        onlineSales: onlineSales.toFixed(2),
        onlineProfit: onlineProfit.toFixed(2),
        totalSales: totalSales.toFixed(2),
        totalProfit: totalProfit.toFixed(2),
        invoiceCount: invoices.length,
        orderCount: orders.length,
      },
      success: true,
    })
  } catch (error: any) {
    console.error('Error in sales report route:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate sales report' }, { status: 500 })
  }
}

