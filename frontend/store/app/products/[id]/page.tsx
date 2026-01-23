'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import { useCart } from '../../../contexts/CartContext'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'
import { useNotifications } from '../../../components/Notifications'
import { NotificationContainer } from '../../../components/Notifications'

import { API_URL } from '../../../lib/auth'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { addItem } = useCart()
  const { addNotification } = useNotifications()
  const [product, setProduct] = useState<any>(null)
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [selectedVariant, setSelectedVariant] = useState<any>(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [stockInfo, setStockInfo] = useState<any>({})
  const [mainImage, setMainImage] = useState<string>('')

  useEffect(() => {
    fetchProduct()
  }, [params.id])

  useEffect(() => {
    if (product && selectedSize && selectedColor) {
      const variant = product.variants?.find(
        (v: any) => v.size.id === selectedSize && v.color.id === selectedColor
      )
      setSelectedVariant(variant)
      if (variant) {
        fetchStockInfo(variant.id)
      }
    }
  }, [product, selectedSize, selectedColor])

  const fetchProduct = async () => {
    try {
      const response = await axios.get(`${API_URL}/products/${params.id}`)
      const productData = response.data.data
      setProduct(productData)

      // Set first image as main
      if (productData.images && productData.images.length > 0) {
        setMainImage(productData.images[0].url)
      }

      // Auto-select first available variant
      if (productData.variants && productData.variants.length > 0) {
        const firstVariant = productData.variants[0]
        setSelectedSize(firstVariant.size.id)
        setSelectedColor(firstVariant.color.id)
      }
    } catch (error) {
      console.error('Error fetching product:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStockInfo = async (variantId: string) => {
    try {
      const response = await axios.get(`${API_URL}/inventory/stock/${variantId}`)
      const stockData = response.data.data || response.data || []
      const stock = Array.isArray(stockData) ? stockData : [stockData]

      // Find store location or sum all locations
      const storeStock = stock.find((s: any) =>
        s.location?.name?.toLowerCase().includes('store') ||
        s.location?.name?.toLowerCase().includes('متجر')
      )

      if (storeStock) {
        setStockInfo({
          available: parseInt(storeStock.quantity || '0'), // Match POS/Admin (Physical Stock)
          reserved: parseInt(storeStock.reservedQuantity || '0'),
        })
      } else if (stock.length > 0) {
        // Use first location if store not found
        const firstStock = stock[0]
        setStockInfo({
          available: parseInt(firstStock.quantity || '0'), // Match POS/Admin
          reserved: parseInt(firstStock.reservedQuantity || '0'),
        })
      } else {
        setStockInfo({ available: 0, reserved: 0 })
      }
    } catch (error) {
      console.error('Error fetching stock:', error)
      setStockInfo({ available: 0, reserved: 0 })
    }
  }

  const handleAddToCart = () => {
    if (!selectedVariant) {
      addNotification({
        type: 'warning',
        title: 'يرجى اختيار المقاس واللون',
        message: 'الرجاء اختيار المقاس واللون قبل الإضافة للسلة'
      })
      return
    }

    if (stockInfo.available < quantity) {
      addNotification({
        type: 'error',
        title: 'المخزون غير كافٍ',
        message: `المخزون المتاح: ${stockInfo.available} فقط`
      })
      return
    }

    addItem({
      variantId: selectedVariant.id,
      productId: product.id,
      productName: product.nameAr,
      variantName: `${product.nameAr} - ${selectedVariant.size.nameAr} - ${selectedVariant.color.nameAr}`,
      size: selectedVariant.size.nameAr,
      color: selectedVariant.color.nameAr,
      price: selectedVariant.retailPrice || product.retailPrice,
      quantity,
      image: mainImage,
      sku: selectedVariant.sku,
    })

    addNotification({
      type: 'success',
      title: 'تمت الإضافة للسلة',
      message: 'تمت إضافة المنتج للسلة بنجاح!'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">جاري التحميل...</div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">المنتج غير موجود</div>
      </div>
    )
  }

  const sizes = Array.from(new Map((product.variants || []).map((v: any) => [v.size.id, v.size])).values())
  const colors = Array.from(new Map((product.variants || []).map((v: any) => [v.color.id, v.color])).values())

  return (
    <div className="min-h-screen bg-brand-cream/30 text-gray-800" dir="rtl">
      <NotificationContainer />
      <Header />

      <div className="container mx-auto px-6 py-12">
        <div className="bg-white rounded-3xl shadow-sm border border-brand-cafe/10 overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Images - Left/Top */}
            <div className="p-8 bg-gray-50/50">
              <div className="aspect-[3/4] bg-white rounded-2xl overflow-hidden shadow-sm mb-4 border border-gray-100">
                {mainImage ? (
                  <img
                    src={mainImage}
                    alt={product.nameAr}
                    className="w-full h-full object-cover hover:scale-105 transition duration-700"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                    <span className="text-6xl opacity-20">👕</span>
                  </div>
                )}
              </div>
              {product.images && product.images.length > 1 && (
                <div className="grid grid-cols-5 gap-3">
                  {product.images.map((img: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setMainImage(img.url)}
                      className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${mainImage === img.url
                        ? 'border-brand-brown shadow-md scale-105'
                        : 'border-transparent hover:border-brand-brown/30'
                        }`}
                    >
                      <img
                        src={img.url}
                        alt={`${product.nameAr} ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info - Right/Bottom */}
            <div className="p-8 md:p-12 flex flex-col justify-center">
              <div className="mb-2">
                <span className="text-brand-gold text-sm font-bold tracking-widest uppercase">جديدنا</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-brand-brown-dark mb-4 font-serif leading-tight">
                {product.nameAr}
              </h1>
              <p className="text-xl text-brand-brown/60 mb-8 font-light">{product.nameEn}</p>

              {product.descriptionAr && (
                <div className="mb-8 p-6 bg-brand-cream/20 rounded-2xl border border-brand-cafe/5">
                  <h3 className="text-sm font-bold text-brand-cafe uppercase tracking-wider mb-3">تفاصيل المنتج</h3>
                  <p className="text-gray-700 leading-relaxed text-lg">{product.descriptionAr}</p>
                </div>
              )}

              {/* Price */}
              <div className="mb-8">
                <span className="text-5xl font-bold text-brand-brown-dark font-serif">
                  {selectedVariant?.retailPrice || product.retailPrice}
                  <span className="text-2xl text-brand-cafe mr-2 font-sans font-normal">ج.م</span>
                </span>
              </div>

              {/* Size Selection */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">المقاس</h3>
                  {/* Future: Size Guide Link */}
                </div>
                <div className="flex flex-wrap gap-3">
                  {sizes.map((size: any, index: number) => (
                    <button
                      key={`size-${size.id}-${index}`}
                      onClick={() => setSelectedSize(size.id)}
                      className={`h-12 min-w-[3rem] px-4 rounded-xl border transition font-medium ${selectedSize === size.id
                        ? 'border-brand-brown bg-brand-brown text-white shadow-lg shadow-brand-brown/20'
                        : 'border-gray-200 text-gray-600 hover:border-brand-brown hover:text-brand-brown bg-white'
                        }`}
                    >
                      {size.nameAr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Selection */}
              <div className="mb-8">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">اللون</h3>
                <div className="flex flex-wrap gap-3">
                  {colors.map((color: any, index: number) => (
                    <button
                      key={`color-${color.id}-${index}`}
                      onClick={() => setSelectedColor(color.id)}
                      className={`h-12 px-6 rounded-xl border transition font-medium flex items-center gap-2 ${selectedColor === color.id
                        ? 'border-brand-brown bg-brand-brown text-white shadow-lg shadow-brand-brown/20'
                        : 'border-gray-200 text-gray-600 hover:border-brand-brown hover:text-brand-brown bg-white'
                        }`}
                    >
                      {color.nameAr}
                    </button>
                  ))}
                </div>
              </div>

              <div className="w-full h-px bg-gray-100 mb-8"></div>

              {/* Actions Row */}
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                {/* Quantity */}
                <div className="flex items-center bg-gray-50 rounded-xl border border-gray-200 p-1 w-full sm:w-auto">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-lg bg-white shadow-sm text-gray-600 hover:text-brand-brown flex items-center justify-center transition"
                  >
                    -
                  </button>
                  <span className="text-xl font-bold w-12 text-center text-brand-brown-dark">{quantity}</span>
                  <button
                    onClick={() =>
                      setQuantity(Math.min(stockInfo.available || 999, quantity + 1))
                    }
                    className="w-10 h-10 rounded-lg bg-white shadow-sm text-gray-600 hover:text-brand-brown flex items-center justify-center transition"
                  >
                    +
                  </button>
                </div>

                {/* Add to Cart */}
                <button
                  onClick={handleAddToCart}
                  disabled={!selectedVariant || stockInfo.available === 0}
                  className="flex-1 bg-brand-brown text-white py-3 px-8 rounded-xl font-bold text-lg hover:bg-brand-brown-dark disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-brand-brown/20 flex items-center justify-center gap-2"
                >
                  {stockInfo.available === 0 ? (
                    'غير متوفر'
                  ) : (
                    <>
                      <span>أضف للسلة</span>
                      <span>🛍️</span>
                    </>
                  )}
                </button>
              </div>

              {/* Stock Status */}
              {selectedVariant && (
                <div className={`text-sm font-medium flex items-center gap-2 ${stockInfo.available > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  <span className={`w-2 h-2 rounded-full ${stockInfo.available > 0 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  {stockInfo.available > 0 ? (
                    stockInfo.available < 5 ? `تبقي ${stockInfo.available} فقط!` : 'متوفر في المخزون'
                  ) : 'نفذت الكمية'}
                </div>
              )}

              <Link
                href="/"
                className="block text-center mt-8 text-sm text-gray-400 hover:text-brand-brown transition"
              >
                ← العودة للمتجر
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div >
  )
}

