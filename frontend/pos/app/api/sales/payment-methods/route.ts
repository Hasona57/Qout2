import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Return payment methods
    const paymentMethods = [
      { id: 'cash', code: 'cash', name: 'نقد', nameEn: 'Cash' },
      { id: 'cash_pos', code: 'cash_pos', name: 'نقد نقاط البيع', nameEn: 'Cash POS' },
      { id: 'cod', code: 'cod', name: 'الدفع عند الاستلام', nameEn: 'Cash on Delivery' },
      { id: 'vodafone_cash', code: 'vodafone_cash', name: 'فودافون كاش', nameEn: 'Vodafone Cash' },
      { id: 'instapay', code: 'instapay', name: 'انستا باي', nameEn: 'Instapay' },
      { id: 'fawry', code: 'fawry', name: 'فوري', nameEn: 'Fawry' },
    ]

    return NextResponse.json({ data: paymentMethods, success: true })
  } catch (error: any) {
    console.error('Error in payment-methods route:', error)
    return NextResponse.json({ data: [], success: true })
  }
}








