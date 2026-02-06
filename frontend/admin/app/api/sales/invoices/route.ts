import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseServer } from '@/lib/firebase'

export async function GET(request: NextRequest) {
  try {
    const { db } = getFirebaseServer()

    // Get all invoices
    let invoices = await db.getAll('invoices')
    
    // Sort by createdAt descending
    invoices.sort((a: any, b: any) => {
      const dateA = new Date(a.createdAt || 0).getTime()
      const dateB = new Date(b.createdAt || 0).getTime()
      return dateB - dateA
    })

    // Get related data
    if (invoices && invoices.length > 0) {
      const invoiceIds = invoices.map((inv: any) => inv.id)
      
      // Get invoice items
      const allItems = await db.getAll('invoice_items')
      const items = allItems.filter((item: any) => invoiceIds.includes(item.invoiceId))

      // Get payments
      const allPayments = await db.getAll('payments')
      const payments = allPayments.filter((pay: any) => invoiceIds.includes(pay.invoiceId))

      // Get users
      const userIds = [...new Set(invoices.map((inv: any) => inv.createdById).filter(Boolean))]
      const allUsers = await db.getAll('users')
      const users = allUsers.filter((u: any) => userIds.includes(u.id))

      const userMap = new Map(users.map((u: any) => [u.id, { id: u.id, name: u.name, email: u.email }]))

      // Combine data
      invoices = invoices.map((invoice: any) => ({
        ...invoice,
        items: items.filter((item: any) => item.invoiceId === invoice.id),
        payments: payments.filter((pay: any) => pay.invoiceId === invoice.id),
        createdBy: userMap.get(invoice.createdById) || null,
      }))
    }

    return NextResponse.json({ data: invoices || [], success: true })
  } catch (error: any) {
    console.error('Error in invoices route:', error)
    return NextResponse.json({ data: [], success: true, error: error.message })
  }
}

