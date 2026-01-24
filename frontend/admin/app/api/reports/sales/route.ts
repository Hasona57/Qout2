import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const supabase = getSupabaseServer()

    // Get invoices first
    let invoiceQuery = supabase
      .from('invoices')
      .select('*')
      .eq('status', 'paid')
    
    let orderQuery = supabase
      .from('orders')
      .select('*')
      .in('status', ['pending', 'processing', 'confirmed', 'shipped', 'delivered'])

    if (startDate) {
      invoiceQuery = invoiceQuery.gte('createdAt', startDate)
      orderQuery = orderQuery.gte('createdAt', startDate)
    }
    if (endDate) {
      const endDateWithTime = `${endDate}T23:59:59.999Z`
      invoiceQuery = invoiceQuery.lte('createdAt', endDateWithTime)
      orderQuery = orderQuery.lte('createdAt', endDateWithTime)
    }

    const [invoicesResult, ordersResult] = await Promise.all([
      invoiceQuery,
      orderQuery,
    ])

    // Handle errors gracefully
    let invoices: any[] = []
    let orders: any[] = []

    if (invoicesResult.error) {
      console.error('Error fetching invoices:', invoicesResult.error)
    } else {
      invoices = invoicesResult.data || []
    }

    if (ordersResult.error) {
      console.error('Error fetching orders:', ordersResult.error)
    } else {
      orders = ordersResult.data || []
    }

    // Get invoice items and order items
    if (invoices.length > 0) {
      const invoiceIds = invoices.map((inv: any) => inv.id)
      const { data: invoiceItems } = await supabase
        .from('invoice_items')
        .select('*')
        .in('invoiceId', invoiceIds)
      
      const itemsByInvoice = new Map()
      ;(invoiceItems || []).forEach((item: any) => {
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
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('*')
        .in('orderId', orderIds)
      
      const itemsByOrder = new Map()
      ;(orderItems || []).forEach((item: any) => {
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

