'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import axios from 'axios'
import { API_URL } from '../../lib/auth'
import Header from '../../components/Header'
import Footer from '../../components/Footer'

export default function WishlistPage() {
    const [wishlistProducts, setWishlistProducts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadWishlist()
    }, [])

    const loadWishlist = async () => {
        try {
            // Get IDs from local storage
            const saved = localStorage.getItem('wishlist')
            const savedIds = saved ? JSON.parse(saved) : []

            if (savedIds.length === 0) {
                setWishlistProducts([])
                setLoading(false)
                return
            }

            // Fetch all active products
            // Ideally we would have an endpoint filter by IDs, but for now we filter client side
            const response = await axios.get(`${API_URL}/products`, { params: { isActive: true } })
            const allProducts = response.data.data || []

            const filtered = allProducts.filter((p: any) => savedIds.includes(p.id))
            setWishlistProducts(filtered)
        } catch (error) {
            console.error('Error fetching wishlist:', error)
        } finally {
            setLoading(false)
        }
    }

    const removeFromWishlist = (id: string) => {
        const saved = localStorage.getItem('wishlist')
        const savedIds = saved ? JSON.parse(saved) : []
        const newIds = savedIds.filter((itemId: string) => itemId !== id)

        localStorage.setItem('wishlist', JSON.stringify(newIds))
        setWishlistProducts(wishlistProducts.filter(p => p.id !== id))
    }

    return (
        <div className="min-h-screen bg-brand-cream/30" dir="rtl">
            <Header />

            <div className="container mx-auto px-6 py-12">
                <h1 className="text-3xl font-bold text-brand-brown-dark font-serif mb-8 border-b-2 border-brand-gold/30 pb-4 inline-block">
                    قائمة الأمنيات
                </h1>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-cream border-t-brand-brown mb-4"></div>
                        <p className="text-brand-brown">جاري التحميل...</p>
                    </div>
                ) : wishlistProducts.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-brand-cafe/10 shadow-sm">
                        <div className="text-6xl mb-6 opacity-30">❤️</div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">قائمة الأمنيات فارغة</h3>
                        <p className="text-gray-500 mb-8">لم تقومي بإضافة أي منتجات للمفضلة بعد</p>
                        <Link
                            href="/"
                            className="px-8 py-3 bg-brand-brown text-white rounded-xl hover:bg-brand-brown-dark transition shadow-lg"
                        >
                            تصفحي المنتجات
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {wishlistProducts.map((product) => (
                            <div key={product.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition group relative">
                                {/* Remove Button */}
                                <button
                                    onClick={() => removeFromWishlist(product.id)}
                                    className="absolute top-4 left-4 z-10 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-red-50 text-gray-400 hover:text-red-500 transition shadow-sm"
                                    title="حذف من المفضلة"
                                >
                                    ✕
                                </button>

                                <Link href={`/products/${product.id}`} className="block relative aspect-[4/5] bg-gray-50">
                                    {product.images && product.images.length > 0 ? (
                                        <img
                                            src={product.images[0].url}
                                            alt={product.nameAr}
                                            className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                            <span>👗</span>
                                        </div>
                                    )}
                                </Link>

                                <div className="p-4">
                                    <h3 className="font-bold text-gray-900 mb-1 line-clamp-1 text-lg font-serif">{product.nameAr}</h3>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="font-bold text-brand-brown text-lg font-serif">{product.retailPrice} <span className="text-sm font-sans">ج.م</span></span>
                                        <Link
                                            href={`/products/${product.id}`}
                                            className="text-xs font-bold text-brand-brown hover:text-brand-brown-dark border border-brand-brown/30 px-3 py-1 rounded-full hover:bg-brand-brown hover:text-white transition"
                                        >
                                            عرض المنتج
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <Footer />
        </div>
    )
}
