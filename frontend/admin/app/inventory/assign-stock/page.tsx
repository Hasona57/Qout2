'use client'

import { useState, useEffect } from 'react'
import Layout from '../../../components/Layout'
import { fetchWithAuth } from '../../../lib/auth'
import { useRouter } from 'next/navigation'

export default function AssignStockPage() {
  const router = useRouter()
  const [products, setProducts] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [selectedProduct, setSelectedProduct] = useState('')
  const [selectedVariant, setSelectedVariant] = useState<any>(null)
  const [formData, setFormData] = useState({
    locationId: '',
    quantity: '',
    minStockLevel: '',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedProduct) {
      loadProductVariants()
    }
  }, [selectedProduct])

  const loadData = async () => {
    try {
      const [productsRes, locationsRes] = await Promise.all([
        fetchWithAuth('/products'),
        fetchWithAuth('/inventory/locations'),
      ])
      const productsData = await productsRes.json()
      const locationsData = await locationsRes.json()
      setProducts(productsData.data || [])
      const validLocations = (locationsData.data || []).filter((loc: any) => loc.name !== 'Factory')
      setLocations(validLocations)
      if (validLocations.length > 0) {
        setFormData({ ...formData, locationId: validLocations[0].id })
      }
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const loadProductVariants = async () => {
    try {
      const response = await fetchWithAuth(`/products/${selectedProduct}`)
      const data = await response.json()
      // Product variants are in the response
    } catch (error) {
      console.error('Error loading product:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedVariant) {
      alert('Please select a variant')
      return
    }

    setLoading(true)
    try {
      const response = await fetchWithAuth('/inventory/assign-stock', {
        method: 'POST',
        body: JSON.stringify({
          variantId: selectedVariant.id,
          locationId: formData.locationId,
          quantity: parseFloat(formData.quantity),
          minStockLevel: formData.minStockLevel ? parseFloat(formData.minStockLevel) : undefined,
        }),
      })

      if (response.ok) {
        alert('Stock assigned successfully!')
        router.push('/inventory')
      }
    } catch (error) {
      console.error('Error assigning stock:', error)
      alert('Error assigning stock')
    } finally {
      setLoading(false)
    }
  }

  const selectedProductData = products.find((p) => p.id === selectedProduct)

  return (
    <Layout>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">تعيين المخزون لمتغير منتج</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-2xl">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اختر المنتج *
              </label>
              <select
                value={selectedProduct}
                onChange={(e) => {
                  setSelectedProduct(e.target.value)
                  setSelectedVariant(null)
                }}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">اختر منتجاً</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.nameEn} ({product.nameAr})
                  </option>
                ))}
              </select>
            </div>

            {selectedProductData && selectedProductData.variants && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اختر المتغير *
                </label>
                <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4">
                  {selectedProductData.variants.map((variant: any) => (
                    <div
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      className={`p-3 border rounded-lg cursor-pointer transition ${selectedVariant?.id === variant.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">
                            {variant.size?.code} / {variant.color?.code}
                          </p>
                          <p className="text-sm text-gray-600">رمز: {variant.sku}</p>
                        </div>
                        <div className="text-sm text-gray-500">
                          الوزن: {variant.weight} كجم
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الموقع *
              </label>
              <select
                value={formData.locationId}
                onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">اختر موقعاً</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الكمية *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  حد المخزون الأدنى (اختياري)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.minStockLevel}
                  onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

          <div className="flex justify-end space-x-4 space-x-reverse">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={loading || !selectedVariant}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'جارٍ التعيين...' : 'تعيين المخزون'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  )
}



