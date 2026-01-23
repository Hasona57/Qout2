'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart } from '../../contexts/CartContext'
import { isAuthenticated } from '../../lib/auth'
import Header from '../../components/Header'
import Footer from '../../components/Footer'

export default function CartPage() {
  const router = useRouter()
  const { items, removeItem, updateQuantity, totalPrice, totalItems } = useCart()

  const handleCheckout = () => {
    if (!isAuthenticated()) {
      router.push('/login?redirect=/checkout')
      return
    }
    router.push('/checkout')
  }

  return (
    <div className="min-h-screen bg-brand-cream/30" dir="rtl">
      <Header />

      <div className="container mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-12 text-brand-brown-dark font-serif border-b-2 border-brand-gold/20 pb-4 inline-block">
          سلة التسوق
        </h1>

        {items.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm border border-brand-cafe/10 p-16 text-center">
            <div className="text-7xl mb-6 opacity-40">🛒</div>
            <p className="text-2xl text-gray-900 font-bold mb-2">سلتك فارغة</p>
            <p className="text-gray-500 mb-8">يبدو أنك لم تقم بإضافة أي منتجات بعد</p>
            <Link
              href="/"
              className="inline-block px-10 py-4 bg-brand-brown text-white rounded-xl hover:bg-brand-brown-dark transition font-semibold text-lg shadow-lg shadow-brand-brown/20"
            >
              تصفح المنتجات
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              {items.map((item) => (
                <div
                  key={item.variantId}
                  className="bg-white rounded-2xl shadow-sm border border-brand-cafe/10 p-6 flex gap-6 hover:shadow-md transition group"
                >
                  <div className="w-32 h-32 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.productName}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">
                        <span>👕</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-xl text-brand-brown-dark font-serif mb-1">{item.productName}</h3>
                        <button
                          onClick={() => removeItem(item.variantId)}
                          className="text-gray-400 hover:text-red-500 transition p-1"
                          title="حذف"
                        >
                          ✕
                        </button>
                      </div>
                      <p className="text-sm text-gray-500 mb-3">
                        <span className="bg-gray-100 px-2 py-1 rounded-md text-xs font-bold text-brand-brown/80">{item.size}</span>
                        <span className="mx-2 text-gray-300">|</span>
                        <span className="bg-gray-100 px-2 py-1 rounded-md text-xs font-bold text-brand-brown/80">{item.color}</span>
                      </p>
                    </div>

                    <div className="flex items-end justify-between">
                      <div className="flex items-center gap-3 bg-gray-50 rounded-lg border border-gray-200 p-1">
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-white hover:shadow-sm rounded transition"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-bold text-brand-brown">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-white hover:shadow-sm rounded transition"
                        >
                          +
                        </button>
                      </div>
                      <div className="text-xl font-bold text-brand-brown-dark">
                        {(parseFloat(item.price) * item.quantity).toFixed(2)} <span className="text-sm font-normal text-brand-cafe">ج.م</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm border border-brand-cafe/10 p-8 sticky top-28">
                <h2 className="text-xl font-bold mb-6 text-brand-brown-dark font-serif border-b border-brand-cafe/10 pb-4">ملخص الطلب</h2>
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-gray-600">
                    <span>المنتجات ({totalItems})</span>
                    <span className="font-semibold text-gray-900">{totalPrice.toFixed(2)} ج.م</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>الشحن</span>
                    <span className="text-sm bg-brand-gold/10 text-brand-brown px-2 py-0.5 rounded">يُحسب عند الدفع</span>
                  </div>
                  <div className="border-t border-dashed border-gray-200 pt-4 mt-4">
                    <div className="flex justify-between text-xl font-bold text-brand-brown-dark">
                      <span>الإجمالي</span>
                      <span>{totalPrice.toFixed(2)} <span className="text-sm font-normal text-brand-cafe">ج.م</span></span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 text-left">شامل الضريبة</p>
                  </div>
                </div>
                <button
                  onClick={handleCheckout}
                  className="w-full bg-brand-brown text-white py-4 rounded-xl font-bold text-lg hover:bg-brand-brown-dark transition shadow-lg shadow-brand-brown/20 flex items-center justify-center gap-2 group"
                >
                  <span>إتمام الطلب</span>
                  <span className="group-hover:-translate-x-1 transition-transform">←</span>
                </button>
                <Link
                  href="/"
                  className="block text-center mt-6 text-sm text-gray-500 hover:text-brand-brown transition underline decoration-dotted"
                >
                  أكملي التسوق
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
