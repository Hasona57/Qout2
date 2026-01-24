import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const supabase = getSupabaseServer()

    // Get safe transactions - try different table names
    let transactions: any[] = []
    let error: any = null
    
    // Try safe_transactions first
    let safeQuery = supabase
      .from('safe_transactions')
      .select('*')
      .order('createdAt', { ascending: false })
    
    if (startDate) {
      safeQuery = safeQuery.gte('createdAt', startDate)
    }
    if (endDate) {
      const endDateWithTime = `${endDate}T23:59:59.999Z`
      safeQuery = safeQuery.lte('createdAt', endDateWithTime)
    }
    
    const result = await safeQuery
    transactions = result.data || []
    error = result.error
    
    // If table doesn't exist, try to get data from payments and invoices
    if (error && (error.code === 'PGRST116' || error.message?.includes('does not exist'))) {
      // Get data from payments and invoices instead
      const [paymentsResult, invoicesResult] = await Promise.all([
        supabase.from('payments').select('*').order('createdAt', { ascending: false }),
        supabase.from('invoices').select('*').eq('status', 'paid').order('createdAt', { ascending: false }),
      ])
      
      const payments = paymentsResult.data || []
      const invoices = invoicesResult.data || []
      
      // Transform to safe transaction format
      transactions = [
        ...payments.map((p: any) => ({
          id: p.id,
          type: 'income',
          amount: p.amount || p.total || '0',
          method: p.paymentMethod || 'unknown',
          code: p.paymentMethod || 'unknown',
          date: p.createdAt || p.date,
          reference: `PAY-${p.id?.substring(0, 8)}`,
        })),
        ...invoices.map((inv: any) => ({
          id: inv.id,
          type: 'income',
          amount: inv.total || '0',
          method: 'Invoice',
          code: 'invoice',
          date: inv.createdAt,
          reference: inv.invoiceNumber || `INV-${inv.id?.substring(0, 8)}`,
        })),
      ]
      
      // Filter by date if provided
      if (startDate || endDate) {
        transactions = transactions.filter((t: any) => {
          const tDate = new Date(t.date)
          if (startDate && tDate < new Date(startDate)) return false
          if (endDate) {
            const end = new Date(endDate)
            end.setHours(23, 59, 59, 999)
            if (tDate > end) return false
          }
          return true
        })
      }
      
      error = null
    }


    if (error) {
      console.error('Error fetching safe status:', error)
      // If table doesn't exist, return empty data
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

