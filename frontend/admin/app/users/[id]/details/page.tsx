'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Layout from '../../../../components/Layout'
import { fetchWithAuth } from '../../../../lib/auth'
import Link from 'next/link'

export default function UserDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [params.id])

  const loadData = async () => {
    try {
      const res = await fetchWithAuth(`/users/${params.id}/statistics`)
      const responseData = await res.json()
      setData(responseData.data || responseData)
    } catch (error) {
      console.error('Error loading user statistics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: string) => {
    return parseFloat(amount || '0').toLocaleString('en-EG', {
      style: 'currency',
      currency: 'EGP'
    })
  }

  if (loading) return <Layout><div className="p-4 sm:p-8">جاري التحميل...</div></Layout>
  if (!data) return <Layout><div className="p-4 sm:p-8">المستخدم غير موجود</div></Layout>

  const { user, statistics, orders, invoices } = data
  const isCustomer = user.role?.toLowerCase() === 'customer' || user.role?.toLowerCase() === 'user'

  return (
    <Layout>
      <div className="p-3 sm:p-4 lg:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{user.name} - التفاصيل</h1>
            <p className="text-gray-500 mt-1 text-sm sm:text-base">{user.email}</p>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">الدور: {user.role}</p>
          </div>
          <Link
            href="/users"
            className="px-3 sm:px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-300 transition text-sm sm:text-base w-full sm:w-auto text-center"
          >
            العودة للمستخدمين
          </Link>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-2">
              {isCustomer ? 'إجمالي الطلبات' : 'إجمالي الفواتير'}
            </h3>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">
              {isCustomer ? statistics.totalOrders : statistics.totalInvoices}
            </p>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-2">إجمالي القطع المباعة</h3>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{statistics.totalPiecesSold}</p>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-2">إجمالي المبيعات</h3>
            <p className="text-2xl sm:text-3xl font-bold text-green-600">{formatCurrency(statistics.totalSales)}</p>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-2">إجمالي الربح</h3>
            <p className="text-2xl sm:text-3xl font-bold text-blue-600">{formatCurrency(statistics.totalProfit)}</p>
          </div>
        </div>

        {/* Orders Section (for customers) */}
        {isCustomer && orders && orders.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 sm:mb-8">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">الطلبات ({orders.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase">رقم الطلب</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">التاريخ</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase hidden md:table-cell">العناصر</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجمالي</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order: any) => (
                    <tr key={order.id}>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-medium">{order.orderNumber}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                        {new Date(order.createdAt).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.status === 'delivered' ? 'تم التسليم' :
                           order.status === 'cancelled' ? 'ملغي' :
                           order.status === 'pending' ? 'قيد الانتظار' :
                           order.status === 'confirmed' ? 'مؤكد' :
                           order.status === 'shipped' ? 'تم الشحن' : order.status}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-gray-500 hidden md:table-cell">
                        {order.items.length} عنصر
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-medium">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm">
                        <Link
                          href={`/orders/${order.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          عرض
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Invoices Section (for POS managers) */}
        {!isCustomer && invoices && invoices.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 sm:mb-8">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">الفواتير ({invoices.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase">رقم الفاتورة</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">التاريخ</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase hidden md:table-cell">العميل</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">طريقة الدفع</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase hidden xl:table-cell">العناصر</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجمالي</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase hidden 2xl:table-cell">الربح</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.map((invoice: any) => {
                    const totalProfit = invoice.items.reduce((sum: number, item: any) => {
                      return sum + parseFloat(item.profitMargin || '0')
                    }, 0)
                    const paymentMethods = invoice.paymentMethods || []
                    const primaryPaymentMethod = paymentMethods.length > 0 ? paymentMethods[0].method : 'غير محدد'
                    return (
                      <tr key={invoice.id} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-medium">{invoice.invoiceNumber}</td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                          {new Date(invoice.createdAt).toLocaleDateString('ar-EG')}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                          {invoice.customer?.name || invoice.customerName || 'عميل عابر'}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-600 hidden lg:table-cell">
                          <div className="flex flex-col gap-1">
                            {paymentMethods.length > 0 ? (
                              paymentMethods.map((pm: any, idx: number) => (
                                <span key={idx} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                                  {pm.method} ({formatCurrency(pm.amount)})
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-gray-400">غير محدد</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                            invoice.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            invoice.status === 'partially_paid' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {invoice.status === 'paid' ? 'مدفوع' :
                             invoice.status === 'cancelled' ? 'ملغي' :
                             invoice.status === 'partially_paid' ? 'مدفوع جزئياً' :
                             invoice.status === 'pending' ? 'قيد الانتظار' : invoice.status}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-gray-500 hidden xl:table-cell">
                          {invoice.items.length} عنصر
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-medium">
                          {formatCurrency(invoice.total)}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-medium text-blue-600 hidden 2xl:table-cell">
                          {formatCurrency(totalProfit.toString())}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm">
                          <Link
                            href={`/sales/${invoice.id}`}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                          >
                            عرض
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Detailed Items Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              {isCustomer ? 'تفاصيل الطلبات' : 'تفاصيل الفواتير'}
            </h2>
          </div>
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {(isCustomer ? orders : invoices).map((record: any, idx: number) => (
              <div key={record.id} className="border-b border-gray-200 pb-4 sm:pb-6 last:border-b-0">
                {/* Invoice/Order Header with Full Details */}
                <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-3 sm:gap-4">
                    <div className="flex-1">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                        {isCustomer ? `الطلب رقم: ${record.orderNumber}` : `الفاتورة رقم: ${record.invoiceNumber}`}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                        <div>
                          <span className="text-gray-500">التاريخ:</span>
                          <span className="mr-2 font-medium text-gray-700">{new Date(record.createdAt).toLocaleString('ar-EG')}</span>
                        </div>
                        {!isCustomer && record.saleType && (
                          <div>
                            <span className="text-gray-500">نوع البيع:</span>
                            <span className="mr-2 font-medium text-gray-700">{record.saleType === 'retail' ? 'تجزئة' : record.saleType}</span>
                          </div>
                        )}
                        {!isCustomer && record.customer && (
                          <div>
                            <span className="text-gray-500">العميل:</span>
                            <span className="mr-2 font-medium text-gray-700">{record.customer.name || record.customerName || 'عميل عابر'}</span>
                          </div>
                        )}
                        {!isCustomer && record.customer?.phone && (
                          <div>
                            <span className="text-gray-500">هاتف العميل:</span>
                            <span className="mr-2 font-medium text-gray-700">{record.customer.phone}</span>
                          </div>
                        )}
                        {!isCustomer && record.customer?.email && (
                          <div>
                            <span className="text-gray-500">البريد الإلكتروني:</span>
                            <span className="mr-2 font-medium text-gray-700 break-all">{record.customer.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right sm:text-left">
                      <p className="text-xs sm:text-sm text-gray-500 mb-1">الإجمالي</p>
                      <p className="text-lg sm:text-xl font-bold text-gray-900">{formatCurrency(record.total)}</p>
                      {!isCustomer && record.paidAmount && (
                        <>
                          <p className="text-xs sm:text-sm text-gray-500 mt-2 mb-1">المدفوع</p>
                          <p className="text-sm sm:text-base font-semibold text-green-600">{formatCurrency(record.paidAmount)}</p>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Payment Methods Section for Invoices */}
                  {!isCustomer && record.paymentMethods && record.paymentMethods.length > 0 && (
                    <div className="bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-200">
                      <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">طرق الدفع:</h4>
                      <div className="flex flex-wrap gap-2">
                        {record.paymentMethods.map((pm: any, pmIdx: number) => (
                          <div key={pmIdx} className="bg-white rounded-lg px-3 py-2 border border-blue-200 flex-1 min-w-[150px]">
                            <div className="text-xs sm:text-sm font-medium text-gray-900">{pm.method}</div>
                            <div className="text-xs text-gray-600 mt-1">المبلغ: {formatCurrency(pm.amount)}</div>
                            {pm.transactionId && (
                              <div className="text-xs text-gray-500 mt-1">رقم المعاملة: {pm.transactionId}</div>
                            )}
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(pm.createdAt).toLocaleDateString('ar-EG')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Summary for Invoices */}
                  {!isCustomer && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm bg-gray-50 rounded-lg p-3 sm:p-4">
                      <div>
                        <span className="text-gray-500 block mb-1">المجموع الفرعي:</span>
                        <span className="font-medium text-gray-900">{formatCurrency(record.subtotal || record.total)}</span>
                      </div>
                      {parseFloat(record.discountAmount || '0') > 0 && (
                        <div>
                          <span className="text-gray-500 block mb-1">الخصم:</span>
                          <span className="font-medium text-red-600">-{formatCurrency(record.discountAmount)}</span>
                        </div>
                      )}
                      {parseFloat(record.taxAmount || '0') > 0 && (
                        <div>
                          <span className="text-gray-500 block mb-1">الضريبة:</span>
                          <span className="font-medium text-gray-900">{formatCurrency(record.taxAmount)}</span>
                        </div>
                      )}
                      {record.commissionAmount && parseFloat(record.commissionAmount) > 0 && (
                        <div>
                          <span className="text-gray-500 block mb-1">العمولة:</span>
                          <span className="font-medium text-blue-600">{formatCurrency(record.commissionAmount)}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {record.notes && (
                    <div className="bg-yellow-50 rounded-lg p-3 sm:p-4 border border-yellow-200">
                      <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-1">ملاحظات:</h4>
                      <p className="text-xs sm:text-sm text-gray-600">{record.notes}</p>
                    </div>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 sm:px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">المنتج</th>
                        <th className="px-3 sm:px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">المتغير</th>
                        <th className="px-3 sm:px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">الكمية</th>
                        <th className="px-3 sm:px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase hidden md:table-cell">سعر الوحدة</th>
                        <th className="px-3 sm:px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">سعر التكلفة</th>
                        <th className="px-3 sm:px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">الإجمالي</th>
                        {!isCustomer && (
                          <th className="px-3 sm:px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase hidden xl:table-cell">الربح</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {record.items.map((item: any) => {
                        const itemProfit = parseFloat(item.unitPrice || '0') - parseFloat(item.costPrice || '0')
                        const totalItemProfit = itemProfit * item.quantity
                        return (
                          <tr key={item.id}>
                            <td className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-900">{item.variant?.product?.nameAr || item.variant?.product?.nameEn || item.productName}</td>
                            <td className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-500 hidden sm:table-cell">{item.variant?.size?.nameAr || item.variant?.size?.nameEn || ''} / {item.variant?.color?.nameAr || item.variant?.color?.nameEn || ''}</td>
                            <td className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-500">{item.quantity}</td>
                            <td className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-500 hidden md:table-cell">{formatCurrency(item.unitPrice)}</td>
                            <td className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-500 hidden lg:table-cell">{formatCurrency(item.costPrice)}</td>
                            <td className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium">{formatCurrency(item.total)}</td>
                            {!isCustomer && (
                              <td className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium hidden xl:table-cell ${
                                totalItemProfit >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {formatCurrency(totalItemProfit.toString())}
                              </td>
                            )}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}

