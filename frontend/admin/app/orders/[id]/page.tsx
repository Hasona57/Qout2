'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Layout from '../../../components/Layout'
import { fetchWithAuth } from '../../../lib/auth'

export default function OrderDetailsPage({ params }: { params: { id: string } }) {
    const router = useRouter()
    const [order, setOrder] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadOrder()
    }, [])

    const loadOrder = async () => {
        try {
            const response = await fetchWithAuth(`/ecommerce/orders/${params.id}`)
            if (!response.ok) throw new Error('Failed to fetch order')
            const data = await response.json()
            setOrder(data.data || data)
        } catch (error) {
            console.error('Error loading order:', error)
        } finally {
            setLoading(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800'
            case 'confirmed': return 'bg-blue-100 text-blue-800'
            case 'shipped': return 'bg-purple-100 text-purple-800'
            case 'delivered': return 'bg-green-100 text-green-800'
            case 'cancelled': return 'bg-red-100 text-red-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    if (loading) return <Layout><div className="p-4 sm:p-8 text-center">جاري التحميل...</div></Layout>
    if (!order) return <Layout><div className="p-4 sm:p-8 text-center text-red-500">الطلب غير موجود</div></Layout>

    return (
        <Layout>
            <div className="p-3 sm:p-4 lg:p-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
                        <Link href="/orders" className="text-gray-500 hover:text-gray-700 text-sm sm:text-base">
                            ← العودة للطلبات
                        </Link>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">الطلب رقم #{order.orderNumber}</h1>
                            <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${getStatusColor(order.status)}`}>
                                {order.status === 'pending' ? 'قيد الانتظار' :
                                 order.status === 'confirmed' ? 'مؤكد' :
                                 order.status === 'shipped' ? 'تم الشحن' :
                                 order.status === 'delivered' ? 'تم التسليم' :
                                 order.status === 'cancelled' ? 'ملغي' : order.status}
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                        {order.status !== 'shipped' && order.status !== 'delivered' && order.status !== 'cancelled' && (
                            <button
                                onClick={async () => {
                                    if (confirm('هل تريد وضع هذا الطلب كمرسل للتسليم؟')) {
                                        try {
                                            const res = await fetchWithAuth(`/ecommerce/orders/${order.id}/status`, {
                                                method: 'PATCH',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ status: 'shipped' })
                                            });
                                            if (res.ok) {
                                                loadOrder();
                                                alert('تم تحديث تفاصيل الطلب');
                                            } else {
                                                alert('فشل تحديث الحالة');
                                            }
                                        } catch (e) {
                                            console.error(e);
                                            alert('خطأ في تحديث الحالة');
                                        }
                                    }
                                }}
                                className="px-4 sm:px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium text-sm sm:text-base text-center"
                            >
                                🚚 إرسال للتسليم
                            </button>
                        )}
                        <Link
                            href={`/orders/${order.id}/return`}
                            className="px-4 sm:px-6 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-medium text-sm sm:text-base text-center"
                        >
                            إرجاع العناصر
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                    {/* Main Info */}
                    <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                        {/* Items */}
                        <div className="bg-white rounded-lg shadow overflow-x-auto">
                            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                                <h3 className="font-semibold text-gray-900 text-base sm:text-lg">عناصر الطلب</h3>
                            </div>
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-semibold text-gray-500 uppercase">المنتج</th>
                                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">السعر</th>
                                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-semibold text-gray-500 uppercase">الكمية</th>
                                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-semibold text-gray-500 uppercase">الإجمالي</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {order.items.map((item: any) => (
                                        <tr key={item.id}>
                                            <td className="px-3 sm:px-6 py-3 sm:py-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {item.variant?.product?.nameAr || item.variant?.product?.nameEn || 'غير متوفر'}
                                                </div>
                                                <div className="text-xs sm:text-sm text-gray-500 font-mono">
                                                    رمز المنتج: {item.variant?.sku}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    {item.variant?.color?.nameAr || item.variant?.color?.name} / {item.variant?.size?.nameAr || item.variant?.size?.name}
                                                </div>
                                            </td>
                                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-gray-500 hidden sm:table-cell">
                                                {parseFloat(item.unitPrice).toFixed(2)} جنيه
                                            </td>
                                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-gray-500">{item.quantity}</td>
                                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm font-medium text-gray-900">
                                                {parseFloat(item.total).toFixed(2)} جنيه
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Payment Info */}
                        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                            <h3 className="font-semibold text-gray-900 mb-4 text-base sm:text-lg">معلومات الدفع</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-500">طريقة الدفع</p>
                                    <p className="font-medium">{order.paymentMethod}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">حالة الدفع</p>
                                    <p className="font-medium">{order.paymentStatus || 'قيد الانتظار'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4 sm:space-y-6">
                        {/* Customer Info */}
                        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                            <h3 className="font-semibold text-gray-900 mb-4 text-base sm:text-lg">تفاصيل العميل</h3>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <p className="text-gray-500">الاسم</p>
                                    <p className="font-medium">{order.user?.name}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">البريد الإلكتروني</p>
                                    <p className="font-medium break-all">{order.user?.email}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">الهاتف</p>
                                    <p className="font-medium">{order.user?.phone || 'غير متوفر'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Shipping Address */}
                        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                            <h3 className="font-semibold text-gray-900 mb-4 text-base sm:text-lg">عنوان الشحن</h3>
                            {order.deliveryAddress ? (
                                <div className="text-sm text-gray-600">
                                    <p>{order.deliveryAddress.street}</p>
                                    <p>{order.deliveryAddress.city}، {order.deliveryAddress.governorate}</p>
                                    <p>{order.deliveryAddress.postalCode}</p>
                                    <p className="mt-2 text-gray-500">الهاتف: {order.deliveryAddress.phone}</p>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">لم يتم تقديم عنوان الشحن</p>
                            )}
                        </div>

                        {/* Order Summary */}
                        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                            <h3 className="font-semibold text-gray-900 mb-4 text-base sm:text-lg">ملخص الطلب</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">المجموع الفرعي</span>
                                    <span>{parseFloat(order.subtotal).toFixed(2)} جنيه</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">الشحن</span>
                                    <span>{parseFloat(order.shippingFee || '0').toFixed(2)} جنيه</span>
                                </div>
                                <div className="flex justify-between font-bold text-base sm:text-lg pt-2 border-t border-gray-100 mt-2">
                                    <span>الإجمالي</span>
                                    <span className="text-brand-brown">{parseFloat(order.total).toFixed(2)} جنيه</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    )
}
