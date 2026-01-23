'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { isAuthenticated, fetchWithAuth } from '../../../lib/auth'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'

export default function OrderDetailsPage({ params }: { params: { id: string } }) {
    const router = useRouter()
    const [order, setOrder] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push(`/login?redirect=/orders/${params.id}`)
            return
        }
        loadOrder()
    }, [params.id])

    const loadOrder = async () => {
        try {
            const response = await fetchWithAuth(`/ecommerce/orders/${params.id}`)
            if (!response.ok) {
                throw new Error('Order not found')
            }
            const data = await response.json()
            setOrder(data.data || data)
        } catch (err: any) {
            setError(err.message || 'Failed to load order')
        } finally {
            setLoading(false)
        }
    }

    const [showReturnModal, setShowReturnModal] = useState(false)
    const [returnReason, setReturnReason] = useState('')
    const [selectedReturnItems, setSelectedReturnItems] = useState<{ [key: string]: number }>({})

    const handleReturnClick = () => {
        setShowReturnModal(true)
    }

    const handleQuantityChange = (itemId: string, qty: number, max: number) => {
        if (qty < 0) qty = 0;
        if (qty > max) qty = max;

        setSelectedReturnItems(prev => {
            const copy = { ...prev };
            if (qty === 0) {
                delete copy[itemId];
            } else {
                copy[itemId] = qty;
            }
            return copy;
        })
    }

    const submitReturn = async () => {
        if (Object.keys(selectedReturnItems).length === 0) {
            alert('يرجى اختيار منتج واحد على الأقل للإرجاع');
            return;
        }

        try {
            setLoading(true);
            const items = Object.entries(selectedReturnItems).map(([orderItemId, quantity]) => ({
                orderItemId,
                quantity
            }));

            const response = await fetchWithAuth('/sales/returns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: order.id,
                    reason: returnReason || 'Return requested by user',
                    items
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'فشل طلب الإرجاع');
            }

            alert('تم تقديم طلب الإرجاع بنجاح');
            setShowReturnModal(false);
            loadOrder(); // Reload to update status
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col" dir="rtl">
                <Header />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-cafe border-t-transparent"></div>
                </div>
                <Footer />
            </div>
        )
    }

    if (error || !order) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col" dir="rtl">
                <Header />
                <div className="flex-1 container mx-auto px-4 py-16 text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">عذراً، لم يتم العثور على الطلب</h1>
                    <p className="text-gray-600 mb-8">{error}</p>
                    <Link href="/" className="bg-brand-cafe text-white px-6 py-3 rounded-lg hover:bg-brand-brown transition">
                        عودة للرئيسية
                    </Link>
                </div>
                <Footer />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-brand-cream/30 font-sans" dir="rtl">
            <Header />

            <main className="container mx-auto px-6 py-12">
                <div className="max-w-4xl mx-auto">
                    {/* Return Modal */}
                    {showReturnModal && (
                        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center backdrop-blur-sm p-4">
                            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                    <h3 className="font-bold text-xl text-brand-brown-dark font-serif">طلب إرجاع منتجات</h3>
                                    <button onClick={() => setShowReturnModal(false)} className="text-gray-400 hover:text-red-500">✕</button>
                                </div>
                                <div className="p-6 overflow-y-auto">
                                    <p className="text-sm text-gray-600 mb-4">يرجى تحديد المنتجات التي ترغب في إرجاعها:</p>
                                    <div className="space-y-4 mb-6">
                                        {order.items.map((item: any) => (
                                            <div key={item.id} className="flex gap-4 items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                                                <input
                                                    type="checkbox"
                                                    checked={!!selectedReturnItems[item.id]}
                                                    onChange={(e) => handleQuantityChange(item.id, e.target.checked ? item.quantity : 0, item.quantity)}
                                                    className="w-5 h-5 accent-brand-brown"
                                                />
                                                <div className="flex-1">
                                                    <p className="font-bold text-sm text-gray-900">{item.variant?.product?.nameAr || 'منتج'}</p>
                                                    <p className="text-xs text-gray-500">الكمية المشتراة: {item.quantity}</p>
                                                </div>
                                                {selectedReturnItems[item.id] ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-gray-500">إرجاع:</span>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max={item.quantity}
                                                            value={selectedReturnItems[item.id]}
                                                            onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value), item.quantity)}
                                                            className="w-16 p-1 border rounded text-center"
                                                        />
                                                    </div>
                                                ) : null}
                                            </div>
                                        ))}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">سبب الإرجاع</label>
                                        <textarea
                                            value={returnReason}
                                            onChange={(e) => setReturnReason(e.target.value)}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none"
                                            rows={3}
                                            placeholder="يرجى ذكر سبب الإرجاع..."
                                        ></textarea>
                                    </div>
                                </div>
                                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                                    <button onClick={() => setShowReturnModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-900">إلغاء</button>
                                    <button
                                        onClick={submitReturn}
                                        className="px-6 py-2 bg-brand-brown text-white rounded-lg hover:bg-brand-brown-dark transition font-bold shadow-lg shadow-brand-brown/20"
                                    >
                                        تأكيد الطلب
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Success Banner */}
                    <div className="bg-white border border-brand-gold/30 rounded-3xl p-10 text-center mb-10 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/5 rounded-bl-full -mr-8 -mt-8"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-brown/5 rounded-tr-full -ml-8 -mb-8"></div>

                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10">
                            <span className="text-4xl text-green-600">✓</span>
                        </div>
                        <h1 className="text-4xl font-bold text-brand-brown-dark font-serif mb-4 relative z-10">تفاصيل الطلب</h1>
                        <p className="text-gray-600 text-lg relative z-10">رقم الطلب: <span className="font-mono font-bold text-brand-brown text-xl bg-brand-brown/10 px-3 py-1 rounded-lg mx-2">{order.orderNumber}</span></p>
                    </div>

                    <div className="bg-white rounded-3xl shadow-sm border border-brand-cafe/10 overflow-hidden">
                        {/* Order Header */}
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center flex-wrap gap-6 bg-gray-50/50">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">تاريخ الطلب</p>
                                <p className="font-bold text-brand-brown-dark text-lg font-serif">{new Date(order.createdAt).toLocaleDateString('ar-EG')}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1">حالة الطلب</p>
                                <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold
                  ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                  ${order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' : ''}
                  ${order.status === 'shipped' ? 'bg-purple-100 text-purple-800' : ''}
                  ${order.status === 'delivered' ? 'bg-green-100 text-green-800' : ''}
                  ${order.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
                  ${order.status === 'returned' ? 'bg-orange-100 text-orange-800' : ''}
                  ${order.status === 'partially_returned' ? 'bg-orange-50 text-orange-700' : ''}
                `}>
                                    {order.status === 'pending' && 'قيد الانتظار'}
                                    {order.status === 'confirmed' && 'تم التأكيد'}
                                    {order.status === 'shipped' && 'تم الشحن'}
                                    {order.status === 'delivered' && 'تم التوصيل'}
                                    {order.status === 'cancelled' && 'ملغي'}
                                    {order.status === 'returned' && 'مرتجع'}
                                    {order.status === 'partially_returned' && 'مرتجع جزئياً'}
                                </span>
                            </div>
                            {/* Return Button logic: if delivered or shipped or user wants to return? Usually after delivery. For now allow on delivered */}
                            {['delivered', 'shipped'].includes(order.status) && (
                                <button
                                    onClick={handleReturnClick}
                                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-red-600 transition"
                                >
                                    إرجاع منتجات
                                </button>
                            )}
                        </div>

                        {/* Items */}
                        <div className="p-8">
                            <h2 className="font-bold text-2xl mb-6 text-brand-brown-dark font-serif">المنتجات</h2>
                            <div className="space-y-6">
                                {order.items.map((item: any) => (
                                    <div key={item.id} className="flex gap-6 py-4 border-b border-gray-100 last:border-0 items-center">
                                        <div className="w-20 h-20 bg-gray-50 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0">
                                            {item.variant?.product?.images && item.variant.product.images.length > 0 ? (
                                                <img src={item.variant.product.images[0].url} alt={item.variant.product.nameAr} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-2xl">👕</div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-lg text-gray-900 mb-1 font-serif">
                                                {item.variant?.product?.nameAr || item.variant?.product?.nameEn || 'منتج'}
                                            </h3>
                                            <div className="flex flex-wrap gap-2 text-sm text-gray-500 mb-2">
                                                <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{item.variant?.color?.name}</span>
                                                <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{item.variant?.size?.name}</span>
                                            </div>
                                            <p className="text-xs text-gray-400 font-mono">SKU: {item.variant?.sku}</p>
                                        </div>
                                        <div className="text-left rtl:text-right">
                                            <p className="text-sm text-gray-500 mb-1">الكمية: {item.quantity}</p>
                                            <p className="font-bold text-brand-brown text-lg">{parseFloat(item.total).toFixed(2)} ج.م</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="bg-gray-50/80 p-8 space-y-4">
                            <div className="flex justify-between text-gray-600">
                                <span>المجموع الفرعي</span>
                                <span className="font-semibold">{parseFloat(order.subtotal).toFixed(2)} ج.م</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>الشحن</span>
                                <span className="font-semibold">{parseFloat(order.shippingFee).toFixed(2)} ج.م</span>
                            </div>
                            <div className="flex justify-between text-2xl font-bold text-brand-brown-dark pt-6 border-t border-gray-200/50 mt-4">
                                <span>الإجمالي</span>
                                <span>{parseFloat(order.total).toFixed(2)} <span className="text-sm font-normal text-brand-cafe">ج.م</span></span>
                            </div>
                        </div>

                        {/* Address & Payment Info */}
                        <div className="p-8 grid md:grid-cols-2 gap-10 border-t border-gray-100">
                            <div>
                                <h3 className="font-bold text-lg mb-4 text-brand-brown font-serif flex items-center gap-2">
                                    <span className="text-xl">📍</span> عنوان التوصيل
                                </h3>
                                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                    <p className="font-bold text-gray-900 mb-1">{order.deliveryAddress?.label || 'المنزل'}</p>
                                    <p className="text-gray-600 leading-relaxed text-sm">
                                        {order.deliveryAddress?.street}<br />
                                        مبنى {order.deliveryAddress?.buildingNumber}، طابق {order.deliveryAddress?.floor}، شقة {order.deliveryAddress?.apartment}<br />
                                        {order.deliveryAddress?.city}, {order.deliveryAddress?.governorate}<br />
                                        <span className="text-brand-brown mt-2 block ltr:text-left" dir="ltr">{order.deliveryAddress?.phone}</span>
                                    </p>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-4 text-brand-brown font-serif flex items-center gap-2">
                                    <span className="text-xl">💳</span> طريقة الدفع
                                </h3>
                                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                                    <div className="text-3xl opacity-80">💵</div>
                                    <div>
                                        <p className="font-bold text-gray-900">
                                            {order.paymentMethod === 'cod' ? 'الدفع عند الاستلام' : 'دفع إلكتروني'}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {order.paymentMethod === 'cod' ? 'سيتم الدفع نقداً للمندوب' : 'تم الدفع بنجاح'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 text-center">
                        <Link href="/" className="inline-block px-10 py-4 bg-brand-brown text-white rounded-xl hover:bg-brand-brown-dark shadow-lg shadow-brand-brown/20 transition font-bold text-lg group">
                            <span className="group-hover:ml-2 transition-all">متابعة التسوق</span>
                        </Link>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
