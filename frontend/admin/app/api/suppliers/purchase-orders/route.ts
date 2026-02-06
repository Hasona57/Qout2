import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseServer } from '@/lib/firebase'

export async function GET(request: NextRequest) {
  try {
    const { db } = getFirebaseServer()

    // Get purchase orders first
    let purchaseOrders = await db.getAll('purchase_orders')

    // Sort by createdAt descending
    purchaseOrders.sort((a: any, b: any) => {
      const dateA = new Date(a.createdAt || 0).getTime()
      const dateB = new Date(b.createdAt || 0).getTime()
      return dateB - dateA
    })

    // Get related data
    if (purchaseOrders && purchaseOrders.length > 0) {
      const orderIds = purchaseOrders.map((po: any) => po.id)
      const supplierIds = [...new Set(purchaseOrders.map((po: any) => po.supplierId).filter(Boolean))]

      // Get items
      const allItems = await db.getAll('purchase_order_items')
      const items = allItems.filter((item: any) => orderIds.includes(item.purchaseOrderId))

      // Get suppliers
      const allSuppliers = await db.getAll('suppliers')
      const suppliers = supplierIds.length > 0 
        ? allSuppliers.filter((s: any) => supplierIds.includes(s.id))
        : []

      const supplierMap = new Map(suppliers.map((s: any) => [s.id, s]))

      // Combine data
      purchaseOrders = purchaseOrders.map((po: any) => ({
        ...po,
        supplier: supplierMap.get(po.supplierId) || null,
        items: items.filter((item: any) => item.purchaseOrderId === po.id),
      }))
    }

    return NextResponse.json({ data: purchaseOrders || [], success: true })
  } catch (error: any) {
    console.error('Error in purchase orders route:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch purchase orders' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { db } = getFirebaseServer()

    const purchaseOrderId = Date.now().toString(36) + Math.random().toString(36).substr(2)
    const purchaseOrder = {
      id: purchaseOrderId,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await db.set(`purchase_orders/${purchaseOrderId}`, purchaseOrder)

    return NextResponse.json({ data: purchaseOrder, success: true })
  } catch (error: any) {
    console.error('Error creating purchase order:', error)
    return NextResponse.json({ error: error.message || 'Failed to create purchase order' }, { status: 500 })
  }
}

