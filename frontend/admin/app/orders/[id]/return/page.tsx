'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Layout from '../../../../components/Layout'
import { fetchWithAuth } from '../../../../lib/auth'

export default function ReturnOrderPage({ params }: { params: { id: string } }) {
    const router = useRouter()
    const { id } = params
    const [order, setOrder] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [returnItems, setReturnItems] = useState<{ [key: string]: number }>({}) // itemId -> quantity
    const [returns, setReturns] = useState<any[]>([]) // Previous returns
    const [reason, setReason] = useState('')
    const [notes, setNotes] = useState('')
    const [refundShipping, setRefundShipping] = useState(false)
    const [refundMethod, setRefundMethod] = useState('cash_pos')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        fetchOrder()
        fetchReturns()
    }, [id])

    const fetchOrder = async () => {
        try {
            const res = await fetchWithAuth(`/ecommerce/orders/${id}`)
            const data = await res.json()
            setOrder(data.data || data)
        } catch (error) {
            console.error('Error fetching order:', error)
            alert('Error fetching order')
        } finally {
            setLoading(false)
        }
    }

    const fetchReturns = async () => {
        try {
            // Fetch returns for this order
            const res = await fetchWithAuth(`/sales/returns?orderId=${id}`)
            const data = await res.json()
            setReturns(data.data || data || [])
        } catch (error) {
            console.error('Error fetching returns:', error)
            // If endpoint doesn't exist, set empty array
            setReturns([])
        }
    }

    // Calculate remaining quantity for each item
    const getRemainingQuantity = (itemId: string, originalQuantity: number) => {
        let returned = 0
        for (const ret of returns) {
            if (ret.items) {
                for (const retItem of ret.items) {
                    if (retItem.orderItemId === itemId) {
                        returned += retItem.quantity || 0
                    }
                }
            }
        }
        return Math.max(0, originalQuantity - returned)
    }

    const handleQuantityChange = (itemId: string, max: number, value: string) => {
        let qty = parseInt(value)
        if (isNaN(qty)) qty = 0
        if (qty < 0) qty = 0
        if (qty > max) qty = max

        setReturnItems(prev => ({
            ...prev,
            [itemId]: qty
        }))
    }

    const handleSubmit = async () => {
        const itemsToReturn = Object.entries(returnItems)
            .filter(([_, qty]) => qty > 0)
            .map(([itemId, qty]) => ({
                invoiceItemId: itemId, // Mapping to generalized field (logic handles it as orderItemId if orderId present)
                quantity: qty
            }))

        if (itemsToReturn.length === 0) {
            alert('Please select at least one item to return')
            return
        }

        if (!reason) {
            alert('Please provide a reason')
            return
        }

        setSubmitting(true)
        try {
            const res = await fetchWithAuth('/sales/returns', {
                method: 'POST',
                body: JSON.stringify({
                    orderId: id,
                    items: itemsToReturn,
                    reason,
                    notes,
                    refundShipping, // Send the flag
                    refundMethod // Send the refund method
                })
            })

            if (!res.ok) throw new Error('Return failed')

            alert('Return processed successfully')
            router.push(`/orders/${id}`)
        } catch (error) {
            console.error(error)
            alert('Failed to process return')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return <Layout><div className="p-8">Loading...</div></Layout>
    if (!order) return <Layout><div className="p-4 sm:p-8">الطلب غير موجود</div></Layout>

    return (
        <Layout>
            <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
                <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">إنشاء إرجاع للطلب رقم #{order.orderNumber}</h1>

                <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-4 sm:mb-6">
                    <h2 className="font-bold mb-4 text-lg">اختر العناصر المراد إرجاعها</h2>
                    <div className="space-y-4">
                        {order.items.map((item: any) => {
                            const remainingQty = getRemainingQuantity(item.id, item.quantity)
                            const alreadyReturned = item.quantity - remainingQty
                            return (
                                <div key={item.id} className="flex justify-between items-center border-b pb-4">
                                    <div>
                                        <p className="font-medium">{item.variant?.product?.nameAr || item.variant?.product?.nameEn || 'منتج'}</p>
                                        <p className="text-xs sm:text-sm text-gray-500">
                                            رمز المنتج: {item.variant?.sku} | المقاس: {item.variant?.size?.nameAr || item.variant?.size?.name} | اللون: {item.variant?.color?.nameAr || item.variant?.color?.name}
                                        </p>
                                        <p className="text-xs sm:text-sm text-gray-500">
                                            مباع: {item.quantity} | السعر: {item.unitPrice} جنيه
                                            {alreadyReturned > 0 && (
                                                <span className="text-orange-600 mr-2">
                                                    (تم إرجاع: {alreadyReturned}، المتبقي: {remainingQty})
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                                        <label className="text-xs sm:text-sm font-medium">كمية الإرجاع:</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max={remainingQty}
                                            value={returnItems[item.id] || 0}
                                            onChange={(e) => handleQuantityChange(item.id, remainingQty, e.target.value)}
                                            className="w-20 border rounded p-1 text-sm"
                                            disabled={remainingQty === 0}
                                        />
                                        {remainingQty === 0 && (
                                            <span className="text-xs text-red-500">تم الإرجاع بالكامل</span>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-4 sm:mb-6">
                    <h2 className="font-bold mb-4 text-lg">تفاصيل الإرجاع</h2>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">السبب</label>
                        <select
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full border rounded p-2 text-sm sm:text-base"
                        >
                            <option value="">اختر السبب</option>
                            <option value="defect">معيب</option>
                            <option value="wrong_item">عنصر خاطئ</option>
                            <option value="customer_request">طلب العميل</option>
                            <option value="other">أخرى</option>
                        </select>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">ملاحظات</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full border rounded p-2 text-sm sm:text-base"
                            rows={3}
                            placeholder="أضف أي ملاحظات إضافية..."
                        />
                    </div>
                    {/* Add Shipping Refund Option */}
                    <div className="mb-4 flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="refundShipping"
                            checked={refundShipping}
                            onChange={(e) => setRefundShipping(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300"
                        />
                        <label htmlFor="refundShipping" className="text-sm font-medium cursor-pointer select-none">
                            استرداد رسوم الشحن ({order.shippingFee || 0} جنيه)؟
                        </label>
                    </div>
                    {/* Refund Method Selection */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">طريقة الاسترداد</label>
                        <select
                            value={refundMethod}
                            onChange={(e) => setRefundMethod(e.target.value)}
                            className="w-full border rounded p-2 text-sm sm:text-base"
                        >
                            <option value="vodafone_cash">فودافون كاش</option>
                            <option value="instapay">انستا باي</option>
                            <option value="fawry">فوري</option>
                            <option value="cash_pos">نقد نقاط البيع</option>
                            <option value="cod">الدفع عند الاستلام</option>
                        </select>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4">
                    <button
                        onClick={() => router.back()}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded text-sm sm:text-base"
                    >
                        إلغاء
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 text-sm sm:text-base"
                    >
                        {submitting ? 'جاري المعالجة...' : 'إنشاء الإرجاع'}
                    </button>
                </div>
            </div>
        </Layout>
    )
}
