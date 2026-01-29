import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Return payment methods
    const paymentMethods = [
      { code: 'cash', name: 'نقد', nameEn: 'Cash' },
      { code: 'cash_pos', name: 'نقد نقاط البيع', nameEn: 'Cash POS' },
      { code: 'cod', name: 'الدفع عند الاستلام', nameEn: 'Cash on Delivery' },
      { code: 'vodafone_cash', name: 'فودافون كاش', nameEn: 'Vodafone Cash' },
      { code: 'instapay', name: 'انستا باي', nameEn: 'Instapay' },
      { code: 'fawry', name: 'فوري', nameEn: 'Fawry' },
    ]

    return NextResponse.json({ data: paymentMethods, success: true })
  } catch (error: any) {
    console.error('Error in payment-methods route:', error)
    return NextResponse.json({ data: [], success: true })
  }
}


