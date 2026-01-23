'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Layout from '../../../components/Layout'
import { fetchWithAuth } from '../../../lib/auth'



export default function InvoiceViewPage() {
  const params = useParams()
  const router = useRouter()
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInvoice()
  }, [params.id])

  const loadInvoice = async () => {
    try {
      const response = await fetchWithAuth(`/sales/invoices/${params.id}`)
      const data = await response.json()
      setInvoice(data.data || data)
    } catch (error) {
      console.error('Error loading invoice:', error)
      alert('Failed to load invoice')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: string) => {
    return parseFloat(amount || '0').toFixed(2)
  }

  if (loading) return <Layout><div className="p-4 sm:p-8 text-center text-gray-500">جاري تحميل الفاتورة...</div></Layout>
  if (!invoice) return <Layout><div className="p-4 sm:p-8 text-center text-red-500">الفاتورة غير موجودة</div></Layout>

  return (
    <Layout>
      <div className="p-3 sm:p-4 lg:p-8 max-w-5xl mx-auto print:max-w-full print:p-0">

        {/* Actions Bar - Hidden in Print */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 lg:mb-8 print:hidden">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">إدارة الفاتورة</h1>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <Link
              href="/sales"
              className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-700 font-medium text-sm sm:text-base text-center"
            >
              ← العودة للمبيعات
            </Link>
            <Link
              href={`/sales/${invoice.id}/return`}
              className="px-3 sm:px-4 py-2 bg-red-100 text-red-700 border border-red-200 rounded-lg hover:bg-red-200 transition font-medium text-sm sm:text-base text-center"
            >
              ↩ إرجاع العناصر
            </Link>
            <button
              onClick={() => window.print()}
              className="px-3 sm:px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition font-medium flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <span>🖨️</span> طباعة الفاتورة
            </button>
          </div>
        </div>

        {/* Invoice Paper */}
        <div className="bg-white rounded-xl shadow-xl overflow-hidden print:shadow-none print:rounded-none border border-gray-100 print:border-none">

          {/* Header Section */}
          <div className="bg-gray-50 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 border-b border-gray-200 print:bg-white print:px-0 print:py-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-4 sm:gap-0">

              {/* Brand / Logo Area */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-black text-white flex items-center justify-center rounded-lg font-bold text-lg sm:text-xl">ق</div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 tracking-tight">قوت العبايات</h1>
                </div>
                <div className="text-gray-500 text-xs sm:text-sm mt-2 space-y-0.5">
                  <p>شارع الموضة 123، القاهرة، مصر</p>
                  <p>الهاتف: +20 123 456 7890</p>
                  <p>البريد: support@qoteabaya.com</p>
                </div>
              </div>

              {/* Invoice Meta */}
              <div className="text-right w-full sm:w-auto">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light text-gray-400 uppercase tracking-widest mb-3 sm:mb-4">فاتورة</h2>
                <div className="space-y-1 text-sm sm:text-base">
                  <p className="text-gray-600">رقم الفاتورة: <span className="font-bold text-gray-900">{invoice.invoiceNumber}</span></p>
                  <p className="text-gray-600">التاريخ: <span className="font-bold text-gray-900">{new Date(invoice.createdAt).toLocaleDateString('ar-EG')}</span></p>
                  <p className="text-gray-600">الحالة:
                    <span className={`mr-2 px-2 py-0.5 rounded text-xs font-bold uppercase ${invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                        invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          invoice.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                      }`}>
                      {invoice.status === 'paid' ? 'مدفوع' :
                       invoice.status === 'pending' ? 'قيد الانتظار' :
                       invoice.status === 'cancelled' ? 'ملغي' : invoice.status}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Customer & Info */}
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 border-b border-gray-100 print:px-0 print:py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-12">
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">الفاتورة إلى</h3>
                <p className="text-base sm:text-lg font-bold text-gray-900">{invoice.customer?.name || invoice.salesPerson?.name || 'عميل عابر'}</p>
                {invoice.customer?.email && <p className="text-gray-600 text-sm">{invoice.customer.email}</p>}
                {invoice.customer?.phone && <p className="text-gray-600 text-sm">{invoice.customer.phone}</p>}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 print:px-0 overflow-x-auto">
            <table className="w-full text-right min-w-[600px]">
              <thead>
                <tr className="border-b-2 border-gray-800">
                  <th className="py-2 sm:py-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-1/2">وصف العنصر</th>
                  <th className="py-2 sm:py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">الكمية</th>
                  <th className="py-2 sm:py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-left">السعر</th>
                  <th className="py-2 sm:py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-left">الإجمالي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoice.items?.map((item: any, i: number) => (
                  <tr key={i} className="group hover:bg-gray-50 transition print:hover:bg-transparent">
                    <td className="py-3 sm:py-4 pl-4">
                      <p className="font-bold text-gray-900 text-sm sm:text-base">{item.variant?.product?.nameAr || item.variant?.product?.nameEn || 'منتج'}</p>
                      <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                        المقاس: {item.variant?.size?.nameAr || item.variant?.size?.nameEn || item.variant?.size?.code} • اللون: {item.variant?.color?.nameAr || item.variant?.color?.nameEn || '-'}
                        <span className="text-gray-300 mx-2">|</span> رمز المنتج: {item.variant?.sku}
                      </p>
                    </td>
                    <td className="py-3 sm:py-4 text-center font-medium text-gray-700 text-sm sm:text-base">{item.quantity}</td>
                    <td className="py-3 sm:py-4 text-left text-gray-700 text-sm sm:text-base">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-3 sm:py-4 text-left font-bold text-gray-900 text-sm sm:text-base">{formatCurrency(item.totalPrice || item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 bg-gray-50 border-t border-gray-100 print:bg-transparent print:px-0">
            <div className="flex justify-end">
              <div className="w-full sm:w-80 space-y-2 sm:space-y-3">
                <div className="flex justify-between text-gray-600 text-sm sm:text-base">
                  <span>المجموع الفرعي</span>
                  <span className="font-medium">{formatCurrency(invoice.subtotal)} جنيه</span>
                </div>
                {parseFloat(invoice.discountAmount || '0') > 0 && (
                  <div className="flex justify-between text-red-600 text-sm sm:text-base">
                    <span>الخصم</span>
                    <span>-{formatCurrency(invoice.discountAmount)} جنيه</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-900 pt-3 sm:pt-4 border-t border-gray-300">
                  <span className="text-lg sm:text-xl font-bold">الإجمالي</span>
                  <span className="text-lg sm:text-xl font-bold">{formatCurrency(invoice.totalAmount || invoice.total)} جنيه</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm text-gray-500 pt-2">
                  <span>المبلغ المدفوع</span>
                  <span className="font-medium">{formatCurrency(invoice.paidAmount || '0')} جنيه</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer / Notes */}
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 border-t border-gray-200 print:px-0">
            {invoice.notes && (
              <div className="mb-4 sm:mb-6">
                <h4 className="text-sm font-bold text-gray-900 mb-1">ملاحظات:</h4>
                <p className="text-gray-600 text-sm bg-yellow-50 p-3 rounded border border-yellow-100 print:bg-transparent print:border-none print:p-0">
                  {invoice.notes}
                </p>
              </div>
            )}
            <div className="text-center text-sm text-gray-400 mt-6 sm:mt-8">
              <p>شكراً لتعاملك معنا!</p>
              <p className="text-xs mt-1">للاستفسارات، يرجى الاتصال بـ sales@qoteabaya.com</p>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  )
}

