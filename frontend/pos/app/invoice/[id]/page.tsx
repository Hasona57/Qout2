'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { fetchWithAuth } from '../../../lib/auth'

export default function InvoicePrintPage() {
  const params = useParams()
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
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (invoice && !loading) {
      window.print()
    }
  }, [invoice, loading])

  if (loading) {
    return <div className="p-8">Loading invoice...</div>
  }

  if (!invoice) {
    return <div className="p-8">Invoice not found</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto" dir="rtl">
      <style jsx>{`
        @media print {
          @page {
            margin: 0.5cm;
            size: A4;
          }
          body {
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none;
          }
        }
      `}</style>

      {/* Header */}
      <div className="text-center mb-8 border-b-2 border-gray-800 pb-4">
        <div className="flex items-center justify-center gap-4 mb-4">
          <img
            src="/logo.jpg"
            alt="قُوت - Qout"
            className="w-20 h-20 object-contain"
          />
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-gold to-brand-pink bg-clip-text text-transparent">
              قُوت - Qout
            </h1>
            <p className="text-sm text-gray-600">للعبايات</p>
          </div>
        </div>
        <h2 className="text-2xl font-bold">فاتورة مبيعات</h2>
        <p className="text-gray-600">Sales Invoice</p>
      </div>

      {/* Invoice Details */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="font-semibold mb-2">معلومات الفاتورة</h3>
          <p className="text-sm">رقم الفاتورة: <span className="font-mono">{invoice.invoiceNumber}</span></p>
          <p className="text-sm">التاريخ: {new Date(invoice.createdAt).toLocaleDateString('ar-EG')}</p>
          <p className="text-sm">الحالة: <span className="font-semibold">{invoice.status}</span></p>
        </div>
        <div>
          <h3 className="font-semibold mb-2">معلومات العميل</h3>
          {invoice.customer ? (
            <>
              <p className="text-sm">الاسم: {invoice.customer.name}</p>
              {invoice.customer.phone && <p className="text-sm">الهاتف: {invoice.customer.phone}</p>}
              {invoice.customer.email && <p className="text-sm">البريد: {invoice.customer.email}</p>}
            </>
          ) : (
            <p className="text-sm">عميل مباشر (Walk-in)</p>
          )}
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full border-collapse border border-gray-300 mb-8">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-4 py-2 text-right">المنتج</th>
            <th className="border border-gray-300 px-4 py-2 text-right">المقاس</th>
            <th className="border border-gray-300 px-4 py-2 text-right">اللون</th>
            <th className="border border-gray-300 px-4 py-2 text-center">الكمية</th>
            <th className="border border-gray-300 px-4 py-2 text-left">السعر</th>
            <th className="border border-gray-300 px-4 py-2 text-left">الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items?.map((item: any, index: number) => (
            <tr key={index}>
              <td className="border border-gray-300 px-4 py-2">
                {item.variant?.product?.nameAr || item.variant?.product?.nameEn || 'Product'}
              </td>
              <td className="border border-gray-300 px-4 py-2">
                {item.variant?.size?.nameAr || item.variant?.size?.code || '-'}
              </td>
              <td className="border border-gray-300 px-4 py-2">
                {item.variant?.color?.nameAr || item.variant?.color?.code || '-'}
              </td>
              <td className="border border-gray-300 px-4 py-2 text-center">{item.quantity}</td>
              <td className="border border-gray-300 px-4 py-2">{parseFloat(item.unitPrice).toFixed(2)} ج.م</td>
              <td className="border border-gray-300 px-4 py-2">{parseFloat(item.total).toFixed(2)} ج.م</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-64 space-y-2">
          <div className="flex justify-between">
            <span>المجموع الفرعي:</span>
            <span className="font-semibold">{parseFloat(invoice.subtotal || '0').toFixed(2)} ج.م</span>
          </div>
          {invoice.discount && parseFloat(invoice.discount) > 0 && (
            <div className="flex justify-between text-red-600">
              <span>الخصم:</span>
              <span>-{parseFloat(invoice.discount).toFixed(2)} ج.م</span>
            </div>
          )}
          <div className="flex justify-between text-xl font-bold border-t-2 border-gray-800 pt-2">
            <span>الإجمالي:</span>
            <span className="text-brand-pink">{parseFloat(invoice.total || '0').toFixed(2)} ج.م</span>
          </div>
        </div>
      </div>

      {/* Payments */}
      {invoice.payments && invoice.payments.length > 0 && (
        <div className="mb-8">
          <h3 className="font-semibold mb-2">المدفوعات</h3>
          <div className="space-y-1">
            {invoice.payments.map((payment: any, index: number) => (
              <div key={index} className="flex justify-between text-sm">
                <span>{payment.method}: {parseFloat(payment.amount).toFixed(2)} ج.م</span>
                <span>{new Date(payment.createdAt).toLocaleDateString('ar-EG')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-sm text-gray-600 border-t border-gray-300 pt-4">
        <p>شكراً لزيارتكم</p>
        <p>Thank you for your visit</p>
        <p className="mt-2">© 2024 قُوت - Qout. جميع الحقوق محفوظة.</p>
      </div>

      {/* Print Button */}
      <div className="no-print mt-8 text-center">
        <button
          onClick={() => window.print()}
          className="px-6 py-3 bg-brand-pink text-white rounded-lg hover:bg-brand-pink-dark"
        >
          طباعة الفاتورة
        </button>
      </div>
    </div>
  )
}









