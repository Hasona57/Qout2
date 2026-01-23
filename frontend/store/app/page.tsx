'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
// Using regular img tag for logo
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { useCart } from '../contexts/CartContext'
import { isAuthenticated } from '../lib/auth'

import { API_URL } from '../lib/auth'
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function Home() {
  const router = useRouter()
  const { totalItems, addItem } = useCart()
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 })
  const [wishlist, setWishlist] = useState<string[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([])
  const [isClient, setIsClient] = useState(false)


  useEffect(() => {
    setIsClient(true)
    fetchData()
    loadWishlist()
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [selectedCategory, searchQuery, sortBy, priceRange])

  const loadWishlist = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('wishlist')
      setWishlist(saved ? JSON.parse(saved) : [])
    }
  }

  const toggleWishlist = (productId: string) => {
    const newWishlist = wishlist.includes(productId)
      ? wishlist.filter((id) => id !== productId)
      : [...wishlist, productId]
    setWishlist(newWishlist)
    if (typeof window !== 'undefined') {
      localStorage.setItem('wishlist', JSON.stringify(newWishlist))
      window.dispatchEvent(new Event('wishlist-updated'))
    }
  }

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        axios.get(`${API_URL}/products`, { params: { isActive: true } }),
        axios.get(`${API_URL}/products/categories`),
      ])
      const allProducts = productsRes.data.data || []
      setProducts(allProducts)
      setCategories(categoriesRes.data.data || [])

      // Featured products
      setFeaturedProducts(allProducts.filter((p: any) => p.isFeatured).slice(0, 8))
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const params: any = { isActive: true }
      if (selectedCategory) params.categoryId = selectedCategory
      if (searchQuery) params.search = searchQuery

      const response = await axios.get(`${API_URL}/products`, { params })
      let filteredProducts = response.data.data || []

      // Price filter
      filteredProducts = filteredProducts.filter((p: any) => {
        const price = parseFloat(p.retailPrice || '0')
        return price >= priceRange.min && price <= priceRange.max
      })

      // Sort
      filteredProducts.sort((a: any, b: any) => {
        switch (sortBy) {
          case 'price-low':
            return parseFloat(a.retailPrice || '0') - parseFloat(b.retailPrice || '0')
          case 'price-high':
            return parseFloat(b.retailPrice || '0') - parseFloat(a.retailPrice || '0')
          case 'name':
            return a.nameAr.localeCompare(b.nameAr)
          case 'newest':
          default:
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        }
      })

      setProducts(filteredProducts)
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const handleQuickAdd = (product: any) => {
    if (!product.variants || product.variants.length === 0) {
      router.push(`/products/${product.id}`)
      return
    }

    const firstVariant = product.variants[0]
    addItem({
      variantId: firstVariant.id,
      productId: product.id,
      productName: product.nameAr,
      variantName: `${product.nameAr} - ${firstVariant.size?.nameAr || ''} - ${firstVariant.color?.nameAr || ''}`,
      size: firstVariant.size?.nameAr || '',
      color: firstVariant.color?.nameAr || '',
      price: firstVariant.retailPrice || product.retailPrice,
      quantity: 1,
      image: product.images?.[0]?.url || '',
      sku: firstVariant.sku || '',
    })
  }

  return (
    <div className="min-h-screen bg-platinum-50 text-slate-800" dir="rtl">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-brand-cream/30 py-24 lg:py-40">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-gold/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-brown/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3"></div>

        <div className="container mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full glass border-brand-gold/20 text-brand-brown-dark text-sm font-semibold mb-10 shadow-soft animate-fade-in-up">
            <span className="w-2 h-2 rounded-full bg-brand-gold animate-pulse"></span>
            كولكشن رمضان 2026
          </div>

          <h1 className="text-6xl md:text-8xl font-bold text-brand-brown-dark mb-8 font-serif leading-tight animate-fade-in-up delay-100 tracking-tight">
            أناقة تليق بكِ <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-gold to-brand-brown relative inline-block">
              في كل تفصيل
              <svg className="absolute w-full h-4 -bottom-2 left-0 text-brand-gold/30" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
              </svg>
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-600 mb-14 max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-200 font-light">
            اكتشفي مجموعتنا الحصرية من العبايات المصممة لتعكس جمالك وأسلوبك الفريد.
            جودة لا تضاهى، وتصاميم تخطف الأنظار.
          </p>

          <div className="max-w-2xl mx-auto relative group animate-fade-in-up delay-300 z-20">
            <div className="absolute -inset-1 bg-gradient-to-r from-brand-gold to-brand-brown rounded-full blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
            <div className="relative flex bg-white/80 backdrop-blur-xl rounded-full shadow-medium overflow-hidden p-2 border border-white/50">
              <input
                type="text"
                placeholder="ابحثي عن العباية النادرة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-4 rounded-r-full text-slate-800 placeholder-slate-400 focus:outline-none text-lg bg-transparent font-medium"
              />
              <button className="px-12 py-4 bg-gradient-to-r from-brand-brown to-brand-brown-dark text-white rounded-full hover:shadow-lg hover:scale-105 transition-all duration-300 font-bold text-lg shadow-md flex items-center gap-2">
                <span>بحث</span>
              </button>
            </div>
          </div>
        </div>
      </section >

      {/* Featured Products */}
      {
        featuredProducts.length > 0 && !searchQuery && (
          <section className="py-24 bg-white relative">
            <div className="absolute inset-0 bg-brand-cream/20 skew-y-1 transform origin-bottom-right -z-10"></div>
            <div className="container mx-auto px-6">
              <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-6">
                <div className="text-center md:text-right">
                  <h2 className="text-4xl font-bold text-brand-brown-dark font-serif mb-3">المنتجات المميزة</h2>
                  <div className="h-1.5 w-32 bg-gradient-to-r from-brand-gold to-transparent mx-auto md:mx-0 rounded-full"></div>
                </div>
                <Link href="/?category=featured" className="group flex items-center gap-3 text-brand-brown font-bold hover:text-brand-brown-dark transition px-8 py-3 glass rounded-full hover:shadow-medium">
                  <span>عرض المجموعة الكاملة</span>
                  <span className="group-hover:-translate-x-1 transition-transform text-xl">←</span>
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                {featuredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    wishlist={wishlist}
                    onToggleWishlist={toggleWishlist}
                    onQuickAdd={handleQuickAdd}
                  />
                ))}
              </div>
            </div>
          </section>
        )
      }

      {/* Main Content */}
      <section className="container mx-auto px-6 py-20">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar */}
          <aside className="lg:w-80 space-y-10 flex-shrink-0">
            <div className="glass rounded-[2rem] p-8 sticky top-28">
              <h3 className="text-2xl font-bold mb-8 text-brand-brown-dark font-serif border-b border-brand-brown/10 pb-5">تصفية المنتجات</h3>

              {/* Categories */}
              <div className="mb-10">
                <span className="block text-brand-gold-dark text-sm font-bold uppercase tracking-wider mb-4">التصنيفات</span>
                <div className="space-y-3">
                  <button
                    onClick={() => setSelectedCategory('')}
                    className={`w-full text-right px-5 py-4 rounded-2xl transition-all duration-300 font-medium flex justify-between items-center ${!selectedCategory
                      ? 'bg-brand-brown text-white shadow-lg shadow-brand-brown/20 scale-105'
                      : 'bg-white/50 text-slate-600 hover:bg-white hover:text-brand-brown hover:shadow-sm'
                      }`}
                  >
                    <span>الكل</span>
                    {!selectedCategory && <span>✓</span>}
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full text-right px-5 py-4 rounded-2xl transition-all duration-300 font-medium flex justify-between items-center ${selectedCategory === category.id
                        ? 'bg-brand-brown text-white shadow-lg shadow-brand-brown/20 scale-105'
                        : 'bg-white/50 text-slate-600 hover:bg-white hover:text-brand-brown hover:shadow-sm'
                        }`}
                    >
                      <span>{category.nameAr}</span>
                      {selectedCategory === category.id && <span>✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-10">
                <h4 className="block text-brand-gold-dark text-sm font-bold uppercase tracking-wider mb-6">نطاق السعر</h4>
                <div className="space-y-6">
                  <input
                    type="range"
                    min="0"
                    max="10000"
                    step="100"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: parseInt(e.target.value) })}
                    className="w-full accent-brand-brown h-2 bg-gray-200 rounded-full appearance-none cursor-pointer hover:bg-gray-300 transition"
                  />
                  <div className="flex justify-between items-center font-medium">
                    <div className="px-4 py-2 bg-white rounded-xl text-sm text-slate-600 shadow-sm">{priceRange.min} ج.م</div>
                    <div className="px-4 py-2 bg-brand-brown text-white rounded-xl text-sm shadow-md">{priceRange.max} ج.م</div>
                  </div>
                </div>
              </div>

              {/* Sort */}
              <div>
                <h4 className="block text-brand-gold-dark text-sm font-bold uppercase tracking-wider mb-6">الترتيب</h4>
                <div className="relative group">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-5 py-4 bg-white/50 border border-transparent hover:border-brand-gold/30 rounded-2xl focus:ring-2 focus:ring-brand-gold/20 outline-none text-slate-700 cursor-pointer appearance-none shadow-sm transition-all"
                  >
                    <option value="newest">✨ وصل حديثاً</option>
                    <option value="price-low">💰 الأقل سعراً</option>
                    <option value="price-high">💎 الأعلى سعراً</option>
                    <option value="name">📝 الاسم (أ-ي)</option>
                  </select>
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none text-brand-brown group-hover:scale-110 transition-transform">
                    ▼
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-200">
              <h2 className="text-3xl font-bold text-slate-800 font-serif">
                {selectedCategory ? categories.find(c => c.id === selectedCategory)?.nameAr : 'جميع المنتجات'}
                <span className="text-lg font-medium text-slate-500 mr-4 px-3 py-1 bg-white rounded-lg shadow-sm">
                  {products.length} منتج
                </span>
              </h2>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-40">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-brand-cream rounded-full animate-spin border-t-brand-brown"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-2xl">⏳</div>
                </div>
                <p className="text-brand-brown font-bold mt-6 text-xl animate-pulse">جاري تحضير الجمال...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    wishlist={wishlist}
                    onToggleWishlist={toggleWishlist}
                    onQuickAdd={handleQuickAdd}
                  />
                ))}
              </div>
            )}

            {!loading && products.length === 0 && (
              <div className="text-center py-40 glass rounded-[3rem] border-2 border-dashed border-slate-200 mx-auto max-w-2xl">
                <div className="text-8xl mb-8 opacity-50 animate-bounce">🧥</div>
                <h3 className="text-3xl font-bold text-slate-800 mb-4">عذراً، لم نجد نتائج</h3>
                <p className="text-slate-500 mb-10 max-w-md mx-auto text-lg">لم نعثر على منتجات تطابق خيارات البحث الحالية. جربي تغيير الفلتر أو البحث عن منتج آخر.</p>
                <button
                  onClick={() => {
                    setSelectedCategory('')
                    setSearchQuery('')
                    setPriceRange({ min: 0, max: 10000 })
                  }}
                  className="px-10 py-4 bg-brand-brown text-white rounded-2xl hover:bg-brand-brown-dark transition shadow-lg shadow-brand-brown/20 font-bold"
                >
                  عرض جميع المنتجات
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div >
  )
}

function ProductCard({ product, wishlist, onToggleWishlist, onQuickAdd }: any) {
  const [imageError, setImageError] = useState(false)

  return (
    <div className="group relative bg-white rounded-[2rem] border border-transparent hover:border-brand-gold/30 overflow-hidden hover:shadow-medium transition-all duration-500 flex flex-col h-full">
      {/* Wishlist Button */}
      <button
        onClick={() => onToggleWishlist(product.id)}
        className="absolute top-5 left-5 z-20 w-12 h-12 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white hover:scale-110 transition-all shadow-sm opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 duration-300"
      >
        <span className={`text-xl ${wishlist.includes(product.id) ? 'text-red-500 scale-110' : 'text-slate-400 hover:text-red-400'}`}>
          {wishlist.includes(product.id) ? '❤️' : '🤍'}
        </span>
      </button>

      {/* Featured Badge */}
      {product.isFeatured && (
        <span className="absolute top-5 right-5 bg-gradient-to-r from-brand-gold to-brand-gold-dark text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-glow z-20 backdrop-blur-md bg-opacity-90 tracking-wide uppercase">
          ✨ مميز
        </span>
      )}

      <Link href={`/products/${product.id}`} className="block relative aspect-[3/4] bg-platinum-100 overflow-hidden">
        {product.images && product.images.length > 0 && !imageError ? (
          <img
            src={product.images[0].url}
            alt={product.nameAr}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-1000 ease-out"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-brand-brown/20 bg-brand-cream/30">
            <span className="text-7xl opacity-50">👗</span>
          </div>
        )}

        {/* Quick Add Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-6 translate-y-full group-hover:translate-y-0 transition duration-500 ease-out z-20 bg-gradient-to-t from-black/50 to-transparent pt-20">
          <button
            onClick={(e) => {
              e.preventDefault()
              onQuickAdd(product)
            }}
            className="w-full bg-white text-brand-brown py-4 rounded-xl font-bold hover:bg-brand-brown hover:text-white transition-all shadow-lg text-sm tracking-wide transform hover:-translate-y-1"
          >
            + أضف للسلة سريعاً
          </button>
        </div>
      </Link>

      <div className="p-6 text-right flex-1 flex flex-col justify-between bg-gradient-to-b from-white to-platinum-50/50">
        <Link href={`/products/${product.id}`}>
          <h3 className="font-bold text-slate-800 mb-2 line-clamp-1 hover:text-brand-brown transition duration-300 text-xl font-serif tracking-tight">
            {product.nameAr}
          </h3>
          <p className="text-sm text-slate-500 mb-4 line-clamp-1 font-medium">{product.nameEn}</p>
        </Link>
        <div className="flex justify-end items-center border-t border-slate-100 pt-4 mt-2">
          <span className="text-2xl font-bold text-brand-brown font-serif">
            {parseFloat(product.retailPrice).toLocaleString()} <span className="text-sm font-medium text-slate-400">ج.م</span>
          </span>
        </div>
      </div>
    </div>
  )
}
