import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseServer } from '@/lib/firebase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const { db } = getFirebaseServer()

    // Get safe transactions - try safe_transactions first, then fallback to payments/invoices
    let transactions: any[] = []
    
    try {
      transactions = await db.getAll('safe_transactions')
    } catch (error) {
      // If table doesn't exist, get data from payments and invoices
      const [payments, invoices] = await Promise.all([
        db.getAll('payments'),
        db.getAll('invoices'),
      ])
      
      const paidInvoices = invoices.filter((inv: any) => inv.status === 'paid')
      
      // Transform to safe transaction format
      transactions = [
        ...payments.map((p: any) => ({
          id: p.id,
          type: 'income',
          amount: p.amount || p.total || '0',
          method: p.paymentMethod || 'unknown',
          code: p.paymentMethod || 'unknown',
          date: p.createdAt || p.date,
          createdAt: p.createdAt || p.date,
          reference: `PAY-${p.id?.substring(0, 8)}`,
        })),
        ...paidInvoices.map((inv: any) => ({
          id: inv.id,
          type: 'income',
          amount: inv.total || '0',
          method: 'Invoice',
          code: 'invoice',
          date: inv.createdAt,
          createdAt: inv.createdAt,
          reference: inv.invoiceNumber || `INV-${inv.id?.substring(0, 8)}`,
        })),
      ]
    }
    
    // Filter by date if provided
    if (startDate || endDate) {
      transactions = transactions.filter((t: any) => {
        const tDate = new Date(t.date || t.createdAt)
        if (startDate && tDate < new Date(startDate)) return false
        if (endDate) {
          const end = new Date(endDate)
          end.setHours(23, 59, 59, 999)
          if (tDate > end) return false
        }
        return true
      })
    }
    
    // Sort by date descending
    transactions.sort((a: any, b: any) => {
      const dateA = new Date(a.date || a.createdAt || 0).getTime()
      const dateB = new Date(b.date || b.createdAt || 0).getTime()
      return dateB - dateA
    })

    // Calculate balance and breakdown
    const totalIncome = (transactions || [])
      .filter((t: any) => t.type === 'income' || !t.type)
      .reduce((sum: number, t: any) => sum + parseFloat(t.amount || '0'), 0)

    const totalExpenses = (transactions || [])
      .filter((t: any) => t.type === 'expense')
      .reduce((sum: number, t: any) => sum + parseFloat(t.amount || '0'), 0)

    const balance = totalIncome - totalExpenses

    // Calculate breakdown by payment method
    const breakdown: Record<string, number> = {
      cash: 0,
      cash_pos: 0,
      cod: 0,
      vodafone_cash: 0,
      instapay: 0,
      fawry: 0,
    }

    transactions.forEach((t: any) => {
      if (t.type === 'income' || !t.type) {
        const method = t.code || t.method || 'cash'
        if (breakdown.hasOwnProperty(method)) {
          breakdown[method] += parseFloat(t.amount || '0')
        } else if (method === 'cash' || method?.includes('cash')) {
          breakdown.cash += parseFloat(t.amount || '0')
        }
      }
    })

    // Get recent transactions (last 20)
    const recentTransactions = (transactions || [])
      .sort((a: any, b: any) => {
        const dateA = new Date(a.date || a.createdAt || 0).getTime()
        const dateB = new Date(b.date || b.createdAt || 0).getTime()
        return dateB - dateA
      })
      .slice(0, 20)

    return NextResponse.json({
      data: {
        netCashInHand: balance.toFixed(2),
        totalIncome: totalIncome.toFixed(2),
        totalExpenses: totalExpenses.toFixed(2),
        balance: balance.toFixed(2),
        breakdown: {
          cash: breakdown.cash.toFixed(2),
          cash_pos: breakdown.cash_pos.toFixed(2),
          cod: breakdown.cod.toFixed(2),
          vodafone_cash: breakdown.vodafone_cash.toFixed(2),
          instapay: breakdown.instapay.toFixed(2),
          fawry: breakdown.fawry.toFixed(2),
        },
        transactions: transactions || [],
        recentTransactions,
      },
      success: true,
    })
  } catch (error: any) {
    console.error('Error in safe route:', error)
    return NextResponse.json({
      data: {
        balance: '0.00',
        transactions: [],
        totalIncome: '0.00',
        totalExpenses: '0.00',
      },
      success: true,
    })
  }
}

