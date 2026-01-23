'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated, getUser, logout, fetchWithAuth } from '../../lib/auth'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { EGYPT_GOVERNORATES } from '../../lib/locations'

export default function AccountPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [addresses, setAddresses] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddAddress, setShowAddAddress] = useState(false)
  const [newAddress, setNewAddress] = useState({
    street: '',
    city: '',
    governorate: '',
    zipCode: '',
    buildingNumber: '',
    apartmentNumber: '',
    isDefault: false
  })
  const [error, setError] = useState('')

  useEffect(() => {
    // Check auth immediately
    const isAuth = isAuthenticated();
    if (!isAuth) {
      router.push('/login?redirect=/account')
      return
    }

    const currentUser = getUser()
    if (currentUser) {
      setUser(currentUser)
      loadData()
    } else {
      // Fallback if token exists but user data missing
      logout()
      router.push('/login')
    }
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      await Promise.all([loadAddresses(), loadOrders()])
    } finally {
      setLoading(false)
    }
  }

  const loadAddresses = async () => {
    try {
      // Intentionally ignoring 404 for now to prevent crashing if endpoint is missing
      // Logic: try fetch, if 404 set empty.
      const res = await fetchWithAuth('/users/me/addresses')
      if (res.ok) {
        const data = await res.json()
        setAddresses(data.data || [])
      } else {
        console.warn('Failed to fetch addresses:', res.status)
        if (res.status !== 404) {
          setError('Failed to load addresses')
        }
      }
    } catch (error) {
      console.error('Error loading addresses:', error)
      // Don't show error to user immediately if it's just a fetch failure, unless critical
    } finally {
      setLoading(false)
    }
  }

  const loadOrders = async () => {
    try {
      const res = await fetchWithAuth('/ecommerce/orders')
      if (res.ok) {
        const data = await res.json()
        setOrders(data.data || [])
      }
    } catch (error) {
      console.error('Error loading orders:', error)
    }
  }

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetchWithAuth('/users/me/addresses', {
        method: 'POST',
        body: JSON.stringify(newAddress),
      })

      if (res.ok) {
        const address = await res.json()
        setAddresses([...addresses, address])
        setShowAddAddress(false)
        setNewAddress({
          street: '',
          city: '',
          governorate: '',
          zipCode: '',
          buildingNumber: '',
          apartmentNumber: '',
          isDefault: false
        })
      } else {
        throw new Error('Failed to add address: ' + res.status)
      }
    } catch (error) {
      console.error('Error adding address:', error)
      setError('حدث خطأ أثناء إضافة العنوان')
    }
  }

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العنوان؟')) return

    try {
      const res = await fetchWithAuth(`/users/me/addresses/${addressId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setAddresses(addresses.filter(addr => addr.id !== addressId))
      } else {
        throw new Error('Failed to delete address')
      }
    } catch (error) {
      console.error('Error deleting address:', error)
      setError('حدث خطأ أثناء حذف العنوان')
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-cream/30" dir="rtl">
        <Header />
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-cream border-t-brand-brown mb-4"></div>
          <p className="text-brand-brown font-medium">جاري التحميل...</p>
        </div>
        <Footer />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-brand-cream/30 text-gray-800" dir="rtl">
      <Header />

      <main className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h1 className="text-4xl font-bold text-brand-brown-dark font-serif mb-2">حسابي</h1>
              <p className="text-brand-brown/60">أهلاً بك، {user.name} 👋</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-6 py-2 border border-red-200 text-red-500 rounded-full hover:bg-red-50 transition text-sm font-medium"
            >
              تسجيل الخروج
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Account Info */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-brand-cafe/10">
              <h2 className="text-2xl font-bold text-brand-brown-dark font-serif mb-6 border-b border-brand-cafe/10 pb-4">
                المعلومات الشخصية
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-brand-cafe uppercase tracking-wider block mb-1">الاسم</label>
                  <p className="text-lg font-medium text-gray-900">{user.name}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-brand-cafe uppercase tracking-wider block mb-1">البريد الإلكتروني</label>
                  <p className="text-lg font-medium text-gray-900">{user.email}</p>
                </div>
                {user.phone && (
                  <div>
                    <label className="text-xs font-bold text-brand-cafe uppercase tracking-wider block mb-1">رقم الهاتف</label>
                    <p className="text-lg font-medium text-gray-900">{user.phone}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Addresses */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-brand-cafe/10">
              <div className="flex justify-between items-center mb-6 border-b border-brand-cafe/10 pb-4">
                <h2 className="text-2xl font-bold text-brand-brown-dark font-serif">العناوين</h2>
                <button
                  onClick={() => setShowAddAddress(!showAddAddress)}
                  className="text-sm bg-brand-brown text-white px-4 py-2 rounded-full hover:bg-brand-brown-dark transition"
                >
                  {showAddAddress ? 'إلغاء' : '+ إضافة عنوان'}
                </button>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-4 text-sm border border-red-100">
                  {error}
                </div>
              )}

              {showAddAddress && (
                <form onSubmit={handleAddAddress} className="mb-8 bg-brand-cream/20 p-6 rounded-2xl animate-fade-in-up">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">المحافظة</label>
                      <select
                        required
                        value={newAddress.governorate}
                        onChange={e => setNewAddress({ ...newAddress, governorate: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-brand-brown focus:ring-1 focus:ring-brand-brown outline-none bg-white"
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
                      <label className="block text-xs font-bold text-gray-500 mb-1">المدينة (المنطقة)</label>
                      <input
                        type="text"
                        required
                        value={newAddress.city}
                        onChange={e => setNewAddress({ ...newAddress, city: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-brand-brown focus:ring-1 focus:ring-brand-brown outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">الحي / الشارع</label>
                      <input
                        type="text"
                        required
                        value={newAddress.street}
                        onChange={e => setNewAddress({ ...newAddress, street: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-brand-brown focus:ring-1 focus:ring-brand-brown outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">رقم المبنى</label>
                      <input
                        type="text"
                        required
                        value={newAddress.buildingNumber}
                        onChange={e => setNewAddress({ ...newAddress, buildingNumber: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-brand-brown focus:ring-1 focus:ring-brand-brown outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">رقم الشقة (اختياري)</label>
                      <input
                        type="text"
                        value={newAddress.apartmentNumber}
                        onChange={e => setNewAddress({ ...newAddress, apartmentNumber: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-brand-brown focus:ring-1 focus:ring-brand-brown outline-none"
                      />
                    </div>
                  </div>
                  <button type="submit" className="w-full py-3 bg-brand-brown text-white rounded-xl font-bold hover:bg-brand-brown-dark transition shadow-lg">
                    حفظ العنوان
                  </button>
                </form>
              )}

              {addresses.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <span className="text-4xl block mb-2 opacity-50">📍</span>
                  <p>لا توجد عناوين مسجلة</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {addresses.map((addr: any) => (
                    <div key={addr.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex justify-between items-start group hover:border-brand-brown/30 transition">
                      <div>
                        <p className="font-bold text-gray-900">{addr.city} - {addr.street}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          مبنى {addr.buildingNumber}
                          {addr.apartmentNumber && `، شقة ${addr.apartmentNumber}`}
                        </p>
                      </div>
                      {addr.isDefault && (
                        <span className="bg-brand-gold/10 text-brand-brown text-[10px] px-2 py-1 rounded-full font-bold">
                          افتراضي
                        </span>
                      )}
                      <button
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="text-red-400 hover:text-red-600 transition p-2"
                        title="حذف العنوان"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Orders */}
            <div className="md:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-brand-cafe/10">
              <h2 className="text-2xl font-bold text-brand-brown-dark font-serif mb-6 border-b border-brand-cafe/10 pb-4">
                الطلبات السابقة
              </h2>
              <div className="space-y-4">
                {orders.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <span className="text-5xl block mb-4 opacity-30">🛍️</span>
                    <p className="text-lg">لا توجد طلبات حتى الآن</p>
                    <button onClick={() => router.push('/')} className="mt-4 text-brand-brown font-bold hover:underline">
                      ابداي التسوق الآن
                    </button>
                  </div>
                ) : (
                  orders.map((order) => (
                    <div key={order.id} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:border-brand-brown/30 transition">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="font-bold text-lg text-brand-brown-dark">{order.orderNumber}</p>
                          <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString('ar-EG')}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold
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
                      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                        <p className="font-bold text-gray-900">{parseFloat(order.total).toFixed(2)} ج.م</p>
                        <button
                          onClick={() => router.push(`/orders/${order.id}`)}
                          className="text-sm text-brand-brown font-bold hover:underline"
                        >
                          تفاصيل الطلب ←
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

