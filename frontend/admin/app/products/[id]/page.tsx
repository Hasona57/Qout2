'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Layout from '../../../components/Layout'
import { fetchWithAuth, API_URL } from '../../../lib/auth'

export default function EditProductPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nameAr: '',
    nameEn: '',
    descriptionAr: '',
    descriptionEn: '',
    sku: '',
    categoryId: '',
    costPrice: '',
    retailPrice: '',
    isActive: true,
    isFeatured: false,
  })
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    loadData()
  }, [params.id])

  const loadData = async () => {
    try {
      const [productRes, categoriesRes] = await Promise.all([
        fetchWithAuth(`/products/${params.id}`),
        fetchWithAuth('/products/categories'),
      ])
      const productData = await productRes.json()
      const categoriesData = await categoriesRes.json()

      const product = productData.data || productData
      setProduct(product)
      setFormData({
        nameAr: product.nameAr || '',
        nameEn: product.nameEn || '',
        descriptionAr: product.descriptionAr || '',
        descriptionEn: product.descriptionEn || '',
        sku: product.sku || '',
        categoryId: product.categoryId || '',
        costPrice: product.costPrice || '',
        retailPrice: product.retailPrice || '',
        isActive: product.isActive ?? true,
        isFeatured: product.isFeatured ?? false,
      })
      setImages(product.images?.map((img: any) => img.url) || [])
      setCategories(categoriesData.data || [])
    } catch (error) {
      console.error('Error loading product:', error)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('entityType', 'product')
        formData.append('entityId', (params.id || 'temp') as string)

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

  const handleDeleteProduct = async () => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return

    try {
      const res = await fetchWithAuth(`/products/${params.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to delete product');
      }
      router.push('/products')
    } catch (error: any) {
      console.error('Error deleting product:', error)
      alert(error.message || 'خطأ في حذف المنتج')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const updateData = {
        ...formData,
        images: images.map((url) => ({ url })),
      }

      const res = await fetchWithAuth(`/products/${params.id}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to update product');
      }

      router.push('/products')
    } catch (error) {
      console.error('Error updating product:', error)
      alert('خطأ في تحديث المنتج')
    } finally {
      setLoading(false)
    }
  }

  if (!product) {
    return (
      <Layout>
        <div className="text-center py-12">جاري التحميل...</div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">تعديل المنتج</h1>
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4 w-full sm:w-auto">
            <button
              onClick={() => router.push(`/products/${params.id}/variants`)}
              className="px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm sm:text-base text-center"
            >
              إدارة المتغيرات
            </button>
            <button
              onClick={() => router.push('/products')}
              className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm sm:text-base text-center"
            >
              العودة للمنتجات
            </button>
            <button
              onClick={handleDeleteProduct}
              className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm sm:text-base text-center"
            >
              حذف المنتج
            </button>
          </div>
        </div>

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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رمز المنتج
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-cafe"
              />
            </div>

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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-cafe"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-cafe"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">نشط</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">مميز</span>
            </label>
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
              className="px-4 sm:px-6 py-2 sm:py-3 bg-brand-cafe text-white rounded-lg hover:bg-brand-cafe-dark disabled:opacity-50 text-sm sm:text-base w-full sm:w-auto"
            >
              {loading ? 'جاري التحديث...' : 'تحديث المنتج'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}

