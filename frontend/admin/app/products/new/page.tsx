'use client'

import { useState, useEffect } from 'react'
import Layout from '../../../components/Layout'
import { fetchWithAuth, API_URL } from '../../../lib/auth'
import { useRouter } from 'next/navigation'

export default function NewProductPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<any[]>([])
  const [sizes, setSizes] = useState<any[]>([])
  const [colors, setColors] = useState<any[]>([])
  const [formData, setFormData] = useState({
    nameAr: '',
    nameEn: '',
    descriptionAr: '',
    descriptionEn: '',
    // sku field removed from UI, will be generated
    categoryId: '',
    costPrice: '',
    retailPrice: '',
    isActive: true,
    isFeatured: false,
  })
  const [variants, setVariants] = useState<Array<{
    sizeId: string
    colorId: string
    sku: string
    weight: string
    barcode: string
  }>>([])
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [selectedColors, setSelectedColors] = useState<string[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [categoriesRes, sizesRes, colorsRes] = await Promise.all([
        fetchWithAuth('/products/categories'),
        fetchWithAuth('/products/sizes'),
        fetchWithAuth('/products/colors'),
      ])
      const categoriesData = await categoriesRes.json()
      const sizesData = await sizesRes.json()
      const colorsData = await colorsRes.json()
      setCategories(categoriesData.data || [])
      setSizes(sizesData.data || [])
      setColors(colorsData.data || [])
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      // Upload files one by one (backend accepts single file)
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('entityType', 'product')
        formData.append('entityId', 'temp') // Will be updated after product creation

        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/attachments/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        })

        if (!response.ok) throw new Error('Upload failed')
        const data = await response.json()
        return data.data?.url || data.url || data
      })

      const uploadedUrls = await Promise.all(uploadPromises)
      setImages([...images, ...uploadedUrls])
    } catch (error) {
      console.error('Error uploading images:', error)
      alert('خطأ في رفع الصور')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  // Auto-generate a short random alphanumeric SKU part
  const generateSkuSuffix = () => {
    return Math.random().toString(36).substring(2, 7).toUpperCase();
  }

  // Auto-generate a 13-digit barcode (simple random implementation)
  const generateBarcode = () => {
    return Math.floor(Math.random() * 1000000000000).toString().padStart(13, '0');
  }

  const generateVariants = () => {
    if (selectedSizes.length === 0 || selectedColors.length === 0) {
      alert('الرجاء اختيار مقاس واحد على الأقل ولون واحد على الأقل')
      return
    }

    const newVariants: any[] = []
    selectedSizes.forEach((sizeId) => {
      selectedColors.forEach((colorId) => {
        const size = sizes.find((s) => s.id === sizeId)
        const color = colors.find((c) => c.id === colorId)
        newVariants.push({
          sizeId: sizeId,
          colorId: colorId,
          // Use generated base SKU or random 'PROD-XXXX'
          sku: `${Math.random().toString(36).substring(2, 7).toUpperCase()}-${size?.code || sizeId}-${color?.code || colorId}-${generateSkuSuffix()}`,
          weight: '0.5',
          barcode: generateBarcode(),
        })
      })
    })
    setVariants(newVariants)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Create product with auto-generated SKU
      const productResponse = await fetchWithAuth('/products', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          sku: Math.random().toString(36).substring(2, 10).toUpperCase(),
        }),
      })

      const productData = await productResponse.json()

      if (!productResponse.ok) {
        throw new Error(productData.message || 'Failed to create product')
      }

      const productId = (productData.data || productData).id
      if (!productId) {
        throw new Error('Product created but no ID returned');
      }

      // Update product with images
      if (images.length > 0) {
        await fetchWithAuth(`/products/${productId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            images: images.map((url) => ({ url })),
          }),
        })
      }

      // Create variants
      for (const variant of variants) {
        const variantRes = await fetchWithAuth(`/products/${productId}/variants`, {
          method: 'POST',
          body: JSON.stringify(variant),
        })
        if (!variantRes.ok) {
          const errData = await variantRes.json().catch(() => ({}));
          throw new Error(`Failed to create variant: ${errData.message || 'Unknown error'}`);
        }
      }

      router.push('/products')
    } catch (error) {
      console.error('Error creating product:', error)
      alert('خطأ في إنشاء المنتج')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">منتج جديد</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              صور المنتج
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 mb-4">
              {images.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Product ${index + 1}`}
                    className="w-full h-24 sm:h-32 object-cover rounded-lg border border-gray-200"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23f3f4f6"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%239ca3af"%3EError%3C/text%3E%3C/svg%3E';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-red-600 text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-xs sm:text-base"
                  >
                    ×
                  </button>
                </div>
              ))}
              <label className="w-full h-24 sm:h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-brand-cafe transition text-xs sm:text-sm">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
                {uploading ? 'جاري الرفع...' : '+ إضافة صورة'}
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الاسم (عربي) *
              </label>
              <input
                type="text"
                value={formData.nameAr}
                onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-cafe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الاسم (إنجليزي) *
              </label>
              <input
                type="text"
                value={formData.nameEn}
                onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-cafe"
              />
            </div>

            {/* SKU field removed */}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الفئة
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-cafe"
              >
                <option value="">اختر الفئة</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nameEn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                سعر التكلفة (جنيه) *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-cafe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                سعر البيع (جنيه) *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.retailPrice}
                onChange={(e) => setFormData({ ...formData, retailPrice: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-cafe"
              />
            </div>


          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الوصف (عربي)
            </label>
            <textarea
              value={formData.descriptionAr}
              onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الوصف (إنجليزي)
            </label>
            <textarea
              value={formData.descriptionEn}
              onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="mr-2"
              />
              نشط
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                className="mr-2"
              />
              مميز
            </label>
          </div>

          <div className="border-t pt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">متغيرات المنتج</h2>
            </div>

            {/* Flexible Variant Selection */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اختر المقاسات (اختياري - اختر مقاسات محددة)
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {sizes.map((size) => (
                    <label key={size.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedSizes.includes(size.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSizes([...selectedSizes, size.id])
                          } else {
                            setSelectedSizes(selectedSizes.filter((id) => id !== size.id))
                          }
                        }}
                        className="mr-2"
                      />
                      <span>{size.nameAr || size.code}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اختر الألوان (اختياري - اختر ألوان محددة)
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {colors.map((color) => (
                    <label key={color.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedColors.includes(color.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedColors([...selectedColors, color.id])
                          } else {
                            setSelectedColors(selectedColors.filter((id) => id !== color.id))
                          }
                        }}
                        className="mr-2"
                      />
                      <span>{color.nameAr || color.code}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={generateVariants}
              className="px-4 py-2 bg-brand-cafe text-white rounded-lg hover:bg-brand-cafe-dark mb-4"
            >
              {selectedSizes.length > 0 && selectedColors.length > 0
                ? `إنشاء المتغيرات (${selectedSizes.length} × ${selectedColors.length})`
                : 'إنشاء جميع المتغيرات'}
            </button>

            {variants.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {variants.map((variant, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg flex items-center space-x-4">
                    <span className="text-sm">
                      {sizes.find((s) => s.id === variant.sizeId)?.code} /{' '}
                      {colors.find((c) => c.id === variant.colorId)?.code}
                    </span>
                    <input
                      type="text"
                      placeholder="رمز المنتج"
                      value={variant.sku}
                      onChange={(e) => {
                        const newVariants = [...variants]
                        newVariants[index].sku = e.target.value
                        setVariants(newVariants)
                      }}
                      className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
                    />
                    <input
                      type="text"
                      placeholder="الوزن (كجم)"
                      value={variant.weight}
                      onChange={(e) => {
                        const newVariants = [...variants]
                        newVariants[index].weight = e.target.value
                        setVariants(newVariants)
                      }}
                      className="w-24 px-3 py-1 border border-gray-300 rounded text-sm"
                    />
                    <input
                      type="text"
                      placeholder="الباركود"
                      value={variant.barcode}
                      onChange={(e) => {
                        const newVariants = [...variants]
                        newVariants[index].barcode = e.target.value
                        setVariants(newVariants)
                      }}
                      className="w-32 px-3 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm sm:text-base w-full sm:w-auto text-center"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm sm:text-base w-full sm:w-auto"
            >
              {loading ? 'جاري الإنشاء...' : 'إنشاء المنتج'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}

