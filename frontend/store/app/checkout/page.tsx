'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { isAuthenticated, getUser, fetchWithAuth } from '../../lib/auth'
import { useCart } from '../../contexts/CartContext'
import { EGYPT_GOVERNORATES } from '../../lib/locations'
import { NotificationContainer, useNotifications } from '../../components/Notifications'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, totalPrice, clearCart } = useCart()
  const { addNotification } = useNotifications()
  const [user, setUser] = useState<any>(null)
  const [addresses, setAddresses] = useState<any[]>([])
  const [selectedAddress, setSelectedAddress] = useState('')
  const [shippingFee, setShippingFee] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [loading, setLoading] = useState(false)
  const [newAddress, setNewAddress] = useState({
    label: '',
    governorate: '',
    city: '',
    street: '',
    buildingNumber: '',
    floor: '',
    apartment: '',
    phone: '',
  })
  const [showNewAddress, setShowNewAddress] = useState(false)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login?redirect=/checkout')
      return
    }
    if (items.length === 0) {
      router.push('/cart')
      return
    }
    loadData()
  }, [router, items])

  const loadData = async () => {
    try {
      const currentUser = getUser()
      setUser(currentUser)

      const addressesRes = await fetchWithAuth('/users/me/addresses')
      if (addressesRes.ok) {
        const addressesData = await addressesRes.json()
        setAddresses(addressesData.data || [])
        if (addressesData.data?.length > 0) {
          const defaultAddr = addressesData.data.find((a: any) => a.isDefault)
          setSelectedAddress(defaultAddr ? defaultAddr.id : addressesData.data[0].id)
        }
      }
    } catch (error) {
      console.error('Error loading checkout data:', error)
    }
  }

  useEffect(() => {
    if (selectedAddress) {
      // Calculate shipping based on governorate (mock logic for now)
      setShippingFee(50)
    }
  }, [selectedAddress])

  const handleAddAddress = async () => {
    try {
      const response = await fetchWithAuth('/users/me/addresses', {
        method: 'POST',
        body: JSON.stringify(newAddress),
      })

      if (!response.ok) {
        throw new Error(`Failed to add address: ${response.status}`)
      }

      const data = await response.json()
      setAddresses([...addresses, data.data])
      setSelectedAddress(data.data.id)
      setShowNewAddress(false)
      setNewAddress({
        label: '',
        governorate: '',
        city: '',
        street: '',
        buildingNumber: '',
        floor: '',
        apartment: '',
        phone: '',
      })
    } catch (error) {
      console.error('Error adding address:', error)
      addNotification({
        type: 'error',
        title: 'خطأ',
        message: 'فشل إضافة العنوان'
      })
    }
  }

  const handleCheckout = async () => {
    if (!selectedAddress) {
      addNotification({
        type: 'warning',
        title: 'تنبيه',
        message: 'يرجى اختيار عنوان التوصيل'
      })
      return
    }

    setLoading(true)
    try {
      // First, ensure all items are in the backend cart
      for (const item of items) {
        try {
          await fetchWithAuth('/ecommerce/cart/items', {
            method: 'POST',
            body: JSON.stringify({
              variantId: item.variantId,
              quantity: item.quantity,
            }),
          })
        } catch (error) {
          console.error('Error adding item to cart:', error)
        }
      }

      // Then create order from cart
      const response = await fetchWithAuth('/ecommerce/orders', {
        method: 'POST',
        body: JSON.stringify({
          deliveryAddressId: selectedAddress,
          paymentMethod,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'فشل إنشاء الطلب')
      }

      const order = data.data || data
      clearCart()
      addNotification({
        type: 'success',
        title: 'تم الطلب بنجاح',
        message: 'تم استلام طلبك بنجاح! سيتم تحويلك لصفحة الطلب.',
        duration: 3000
      })
      router.push(`/orders/${order.id}`)
    } catch (error: any) {
      console.error('Error creating order:', error)
      const errorMessage = error.message || 'فشل إنشاء الطلب'
      addNotification({
        type: 'error',
        title: 'خطأ',
        message: errorMessage
      })
    } finally {
      setLoading(false)
    }
  }

  const grandTotal = totalPrice + shippingFee

  return (
    <div className="min-h-screen bg-brand-cream/30" dir="rtl">
      <Header />

      <div className="container mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-12 text-brand-brown-dark font-serif border-b-2 border-brand-gold/20 pb-4 inline-block">
          إتمام الطلب
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Checkout Form */}
          <div className="lg:col-span-2 space-y-8">

            {/* Address Selection */}
            <div className="bg-white rounded-3xl shadow-sm border border-brand-cafe/10 p-8">
              <h2 className="text-2xl font-bold mb-6 text-brand-brown-dark font-serif flex items-center gap-2">
                <span className="bg-brand-brown text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
                عنوان التوصيل
              </h2>

              {addresses.length === 0 && !showNewAddress ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">لا يوجد عناوين مسجلة</p>
                  <button
                    onClick={() => setShowNewAddress(true)}
                    className="px-6 py-3 bg-brand-brown text-white rounded-xl hover:bg-brand-brown-dark transition"
                  >
                    + إضافة عنوان جديد
                  </button>
                </div>
              ) : showNewAddress ? (
                <div className="space-y-4 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <h3 className="font-bold text-lg mb-4 text-brand-brown">إضافة عنوان جديد</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الاسم (للمكان)</label>
                    <input
                      type="text"
                      placeholder="المنزل، العمل، إلخ"
                      value={newAddress.label}
                      onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold outline-none transition"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">المحافظة</label>
                      <select
                        value={newAddress.governorate}
                        onChange={(e) => setNewAddress({ ...newAddress, governorate: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold outline-none transition bg-white"
                      >
                        <option value="">اختر المحافظة</option>
                        {EGYPT_GOVERNORATES.map((gov) => (
                          <option key={gov.id} value={gov.name}>
                            {gov.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">المدينة/المنطقة</label>
                      <input
                        type="text"
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold outline-none transition"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">اسم الشارع</label>
                    <input
                      type="text"
                      value={newAddress.street}
                      onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold outline-none transition"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">رقم المبنى</label>
                      <input
                        type="text"
                        value={newAddress.buildingNumber}
                        onChange={(e) => setNewAddress({ ...newAddress, buildingNumber: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">الطابق</label>
                      <input
                        type="text"
                        value={newAddress.floor}
                        onChange={(e) => setNewAddress({ ...newAddress, floor: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">رقم الشقة</label>
                      <input
                        type="text"
                        value={newAddress.apartment}
                        onChange={(e) => setNewAddress({ ...newAddress, apartment: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold outline-none transition"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
                    <input
                      type="tel"
                      value={newAddress.phone}
                      onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold outline-none transition"
                    />
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={handleAddAddress}
                      className="flex-1 px-6 py-3 bg-brand-brown text-white rounded-xl hover:bg-brand-brown-dark transition font-semibold shadow-lg shadow-brand-brown/20"
                    >
                      حفظ العنوان
                    </button>
                    <button
                      onClick={() => setShowNewAddress(false)}
                      className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {addresses.map((address) => (
                    <label
                      key={address.id}
                      className={`block p-5 border-2 rounded-2xl cursor-pointer transition relative overflow-hidden group ${selectedAddress === address.id
                        ? 'border-brand-brown bg-brand-brown/5 shadow-md'
                        : 'border-gray-100 hover:border-brand-brown/30 bg-gray-50'
                        }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        value={address.id}
                        checked={selectedAddress === address.id}
                        onChange={(e) => setSelectedAddress(e.target.value)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 accent-brand-brown"
                      />
                      <div className="mr-10">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-lg text-brand-brown-dark">{address.label || 'عنوان التوصيل'}</p>
                          {address.isDefault && <span className="bg-brand-gold/20 text-brand-brown-dark text-[10px] px-2 py-0.5 rounded-full font-bold">افتراضي</span>}
                        </div>
                        <p className="text-gray-600 text-sm">
                          {address.governorate}, {address.city}, {address.street}
                        </p>
                        <p className="text-gray-500 text-sm mt-1">مبنى {address.buildingNumber}، طابق {address.floor}، شقة {address.apartment}</p>
                        {address.phone && <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">📞 {address.phone}</p>}
                      </div>
                    </label>
                  ))}
                  <button
                    onClick={() => setShowNewAddress(true)}
                    className="w-full p-4 border-2 border-dashed border-brand-brown/30 rounded-2xl hover:bg-brand-brown/5 transition text-brand-brown font-medium flex items-center justify-center gap-2"
                  >
                    <span>+</span> إضافة عنوان جديد
                  </button>
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-3xl shadow-sm border border-brand-cafe/10 p-8">
              <h2 className="text-2xl font-bold mb-6 text-brand-brown-dark font-serif flex items-center gap-2">
                <span className="bg-brand-brown text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
                طريقة الدفع
              </h2>
              <div className="space-y-4">
                <label
                  className={`flex items-center p-5 border-2 rounded-2xl cursor-pointer transition ${paymentMethod === 'cod'
                    ? 'border-brand-brown bg-brand-brown/5 shadow-md'
                    : 'border-gray-100 hover:border-brand-brown/30 bg-gray-50'
                    }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-5 h-5 accent-brand-brown ml-4"
                  />
                  <div>
                    <p className="font-bold text-lg text-brand-brown-dark">الدفع عند الاستلام</p>
                    <p className="text-sm text-gray-500">ادفع نقداً عند استلام طلبك</p>
                  </div>
                  <div className="mr-auto text-2xl opacity-50">💵</div>
                </label>
                {/* Online Payment Removed */}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-sm border border-brand-cafe/10 p-8 sticky top-28">
              <h2 className="text-xl font-bold mb-6 text-brand-brown-dark font-serif border-b border-brand-cafe/10 pb-4">ملخص الطلب</h2>
              <div className="space-y-4 mb-6 custom-scrollbar max-h-[400px] overflow-y-auto pr-2">
                {items.map((item) => (
                  <div key={item.variantId} className="flex gap-4 mb-4">
                    <div className="w-16 h-16 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0">
                      {item.image ? (
                        <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                      ) : <div className="w-full h-full flex items-center justify-center text-xl">👕</div>}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900 line-clamp-1">{item.productName}</p>
                      <p className="text-xs text-gray-500">{item.size} - {item.color} (x{item.quantity})</p>
                      <p className="text-sm font-bold text-brand-brown">{(parseFloat(item.price) * item.quantity).toFixed(2)} ج.م</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 border-t border-dashed border-gray-200 pt-6">
                <div className="flex justify-between text-gray-600">
                  <span>المجموع الفرعي</span>
                  <span className="font-semibold text-gray-900">{totalPrice.toFixed(2)} ج.م</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>الشحن</span>
                  <span className={`font-semibold ${shippingFee > 0 ? 'text-gray-900' : 'text-brand-brown'}`}>
                    {shippingFee > 0 ? `${shippingFee.toFixed(2)} ج.م` : 'سيتم حسابها'}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-4 mt-2">
                  <div className="flex justify-between text-xl font-bold text-brand-brown-dark">
                    <span>الإجمالي</span>
                    <span className="bg-gradient-to-r from-brand-cafe to-brand-brown bg-clip-text text-transparent">{(totalPrice + shippingFee).toFixed(2)} ج.م</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 text-left">شامل الضريبة</p>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={loading || !selectedAddress}
                className="w-full mt-8 px-6 py-4 bg-brand-brown text-white rounded-xl hover:bg-brand-brown-dark transition font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-brown/20 flex items-center justify-center gap-2 group"
              >
                {loading ? (
                  'جاري المعالجة...'
                ) : (
                  <>
                    <span>تأكيد الطلب</span>
                    <span className="group-hover:-translate-x-1 transition-transform">←</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
