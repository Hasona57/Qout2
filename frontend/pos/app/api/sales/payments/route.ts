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
    const { invoiceId, amount, paymentMethodId, notes } = body

    if (!invoiceId || !amount || !paymentMethodId) {
      return NextResponse.json(
        { error: 'invoiceId, amount, and paymentMethodId are required', success: false },
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

    // Get invoice
    const invoice = await db.get(`invoices/${invoiceId}`)

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found', success: false },
        { status: 404 }
      )
    }

    const paymentAmount = parseFloat(amount)
    const currentPaid = parseFloat(invoice.paidAmount || '0')
    const invoiceTotal = parseFloat(invoice.total || '0')
    const newPaidAmount = currentPaid + paymentAmount

    // Create payment record
    const paymentId = Date.now().toString(36) + Math.random().toString(36).substr(2)
    const payment = {
      id: paymentId,
      invoiceId,
      amount: paymentAmount.toFixed(2),
      paymentMethod: paymentMethodId,
      status: 'completed',
      notes: notes || null,
      createdById: userId,
      createdAt: new Date().toISOString(),
    }

    await db.set(`payments/${paymentId}`, payment)

    // Update invoice paid amount and status
    let newStatus = invoice.status
    if (newPaidAmount >= invoiceTotal) {
      newStatus = 'paid'
    } else if (newPaidAmount > 0) {
      newStatus = 'partially_paid'
    }

    await db.update(`invoices/${invoiceId}`, {
      ...invoice,
      paidAmount: newPaidAmount.toFixed(2),
      status: newStatus,
      updatedAt: new Date().toISOString(),
    })

    return NextResponse.json({ data: payment, success: true })
  } catch (error: any) {
    console.error('Error in payments route:', error)
    return NextResponse.json({ error: error.message || 'Failed to create payment', success: false }, { status: 500 })
  }
}







