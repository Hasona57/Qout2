import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseServer } from '@/lib/firebase'

export async function GET(request: NextRequest) {
  try {
    const { db } = getFirebaseServer()

    // Get all data
    const [products, orders, invoices, stockItems] = await Promise.all([
      db.getAll('products'),
      db.getAll('orders'),
      db.getAll('invoices'),
      db.getAll('stock_items'),
    ])

    // Calculate stats
    const activeProducts = products.filter((p: any) => p.isActive === true).length
    const paidInvoices = invoices.filter((i: any) => i.status === 'paid').length
    const lowStock = stockItems.filter((s: any) => (s.quantity || 0) < 10).length

    // Get recent activity (last 10 orders and invoices)
    const recentOrders = orders
      .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 5)
      .map((order: any) => ({
        id: order.id,
        type: 'order',
        date: order.createdAt,
        status: order.status,
        amount: order.total || 0,
      }))

    const recentInvoices = invoices
      .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 5)
      .map((invoice: any) => ({
        id: invoice.id,
        type: 'invoice',
        date: invoice.createdAt,
        status: invoice.status,
        amount: invoice.total || 0,
      }))

    const recentActivity = [...recentOrders, ...recentInvoices]
      .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
      .slice(0, 10)

    return NextResponse.json({
      data: {
        products: activeProducts,
        orders: orders.length,
        sales: paidInvoices,
        lowStock: lowStock,
        recentActivity,
      },
      success: true,
    })
  } catch (error: any) {
    console.error('Error in dashboard stats route:', error)
    return NextResponse.json({
      data: {
        products: 0,
        orders: 0,
        sales: 0,
        lowStock: 0,
        recentActivity: [],
      },
      success: true,
    })
  }
}

