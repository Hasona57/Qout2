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
    const { invoiceId, amount, paymentMethodId, notes } = body

    if (!invoiceId || !amount || !paymentMethodId) {
      return NextResponse.json(
        { error: 'invoiceId, amount, and paymentMethodId are required', success: false },
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

    // Get invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single()

    if (invoiceError || !invoice) {
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
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        invoiceId,
        amount: paymentAmount.toFixed(2),
        paymentMethod: paymentMethodId,
        status: 'completed',
        notes: notes || null,
        createdById: userId,
      })
      .select()
      .single()

    if (paymentError) {
      console.error('Error creating payment:', paymentError)
      return NextResponse.json({ error: paymentError.message, success: false }, { status: 500 })
    }

    // Update invoice paid amount and status
    let newStatus = invoice.status
    if (newPaidAmount >= invoiceTotal) {
      newStatus = 'paid'
    } else if (newPaidAmount > 0) {
      newStatus = 'partially_paid'
    }

    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        paidAmount: newPaidAmount.toFixed(2),
        status: newStatus,
      })
      .eq('id', invoiceId)

    if (updateError) {
      console.error('Error updating invoice:', updateError)
      // Payment was created but invoice update failed - this is not ideal but payment is recorded
    }

    return NextResponse.json({ data: payment, success: true })
  } catch (error: any) {
    console.error('Error in payments route:', error)
    return NextResponse.json({ error: error.message || 'Failed to create payment', success: false }, { status: 500 })
  }
}



