import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServer()

    // Get all stats in parallel
    const [
      productsResult,
      ordersResult,
      invoicesResult,
      lowStockResult,
    ] = await Promise.all([
      supabase.from('products').select('id', { count: 'exact' }).eq('isActive', true),
      supabase.from('orders').select('id', { count: 'exact' }),
      supabase.from('invoices').select('id', { count: 'exact' }).eq('status', 'paid'),
      supabase
        .from('stock_items')
        .select('id')
        .lt('quantity', 10),
    ])

    // Get recent activity (last 10 orders and invoices)
    const [recentOrders, recentInvoices] = await Promise.all([
      supabase
        .from('orders')
        .select('id, createdAt, status, total')
        .order('createdAt', { ascending: false })
        .limit(5),
      supabase
        .from('invoices')
        .select('id, createdAt, status, total')
        .order('createdAt', { ascending: false })
        .limit(5),
    ])

    const recentActivity = [
      ...(recentOrders.data || []).map((order: any) => ({
        id: order.id,
        type: 'order',
        date: order.createdAt,
        status: order.status,
        amount: order.total,
      })),
      ...(recentInvoices.data || []).map((invoice: any) => ({
        id: invoice.id,
        type: 'invoice',
        date: invoice.createdAt,
        status: invoice.status,
        amount: invoice.total,
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)

    return NextResponse.json({
      data: {
        products: productsResult.count || 0,
        orders: ordersResult.count || 0,
        sales: invoicesResult.count || 0,
        lowStock: lowStockResult.data?.length || 0,
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

