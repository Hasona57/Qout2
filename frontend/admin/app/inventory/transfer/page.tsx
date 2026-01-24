'use client'

import { useState, useEffect } from 'react'
import Layout from '../../../components/Layout'
import { fetchWithAuth } from '../../../lib/auth'
import { useRouter } from 'next/navigation'
import { useNotification } from '../../../contexts/NotificationContext'

export default function StockTransferPage() {
  const router = useRouter()
  const { showNotification } = useNotification()
  const [locations, setLocations] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [formData, setFormData] = useState({
    fromLocationId: '',
    toLocationId: '',
    notes: '',
  })
  const [transferItems, setTransferItems] = useState<Array<{
    productId: string
    variantId: string
    quantity: string
    availableQuantity?: number
  }>>([])
  const [loading, setLoading] = useState(false)
  const [availableStock, setAvailableStock] = useState<Map<string, number>>(new Map())

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [locationsRes, productsRes] = await Promise.all([
        fetchWithAuth('/inventory/locations'),
        fetchWithAuth('/products'),
      ])
      const locationsData = await locationsRes.json()
      const productsData = await productsRes.json()
      setLocations(locationsData.data || [])
      setProducts(productsData.data || [])
    } catch (error) {
      console.error('Error loading data:', error)
      showNotification('Failed to load data', 'error')
    }
  }

  const addTransferItem = () => {
    setTransferItems([...transferItems, { productId: '', variantId: '', quantity: '' }])
  }

  const removeTransferItem = (index: number) => {
    setTransferItems(transferItems.filter((_, i) => i !== index))
  }

  const updateTransferItem = async (index: number, field: string, value: string) => {
    const updated = [...transferItems]
    updated[index] = { ...updated[index], [field]: value }
    if (field === 'productId') {
      updated[index].variantId = '' // Reset variant when product changes
      updated[index].availableQuantity = undefined
    }
    if (field === 'variantId' && value && formData.fromLocationId) {
      // Use available stock from map if already loaded, otherwise fetch
      const existingQty = availableStock.get(value)
      if (existingQty !== undefined) {
        updated[index].availableQuantity = existingQty
      } else {
        // Fetch available stock for this variant at source location
        try {
          const stockRes = await fetchWithAuth(`/inventory/stock?locationId=${formData.fromLocationId}`)
          const stockData = await stockRes.json()
          const stockItems = stockData.data || []
          const variantStock = stockItems.find((s: any) => s.variantId === value)
          const availableQty = variantStock ? parseFloat(String(variantStock.quantity || 0)) : 0
          updated[index].availableQuantity = availableQty
          setAvailableStock(prev => new Map(prev.set(value, availableQty)))
        } catch (error) {
          console.error('Error fetching available stock:', error)
          updated[index].availableQuantity = 0
        }
      }
    }
    setTransferItems(updated)
  }

  // Load available stock when source location changes
  useEffect(() => {
    if (formData.fromLocationId) {
      loadAvailableStock()
    } else {
      setAvailableStock(new Map())
      setTransferItems(items => items.map(item => ({ ...item, availableQuantity: undefined })))
    }
  }, [formData.fromLocationId])

  const loadAvailableStock = async () => {
    if (!formData.fromLocationId) return
    try {
      const stockRes = await fetchWithAuth(`/inventory/stock?locationId=${formData.fromLocationId}`)
      const stockData = await stockRes.json()
      const stockItems = stockData.data || []
      const stockMap = new Map<string, number>()
      stockItems.forEach((item: any) => {
        if (item.variantId && item.quantity) {
          stockMap.set(item.variantId, parseFloat(String(item.quantity || 0)))
        }
      })
      setAvailableStock(stockMap)
      
      // Update available quantities for existing transfer items
      setTransferItems(items => items.map(item => {
        if (item.variantId) {
          return { ...item, availableQuantity: stockMap.get(item.variantId) || 0 }
        }
        return item
      }))
    } catch (error) {
      console.error('Error loading available stock:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.fromLocationId || !formData.toLocationId) {
      showNotification('Please select both source and destination locations', 'error')
      return
    }
    if (transferItems.length === 0) {
      showNotification('Please add at least one item to transfer', 'error')
      return
    }
    if (transferItems.some(item => !item.variantId || !item.quantity)) {
      showNotification('Please fill all item fields', 'error')
      return
    }

    // Validate quantities
    const invalidItems = transferItems.filter(item => {
      const qty = parseFloat(item.quantity || '0')
      const available = item.availableQuantity !== undefined ? item.availableQuantity : 0
      return qty <= 0 || qty > available
    })

    if (invalidItems.length > 0) {
      showNotification('Some items have invalid quantities. Please check available stock.', 'error')
      return
    }

    setLoading(true)
    try {
      const response = await fetchWithAuth('/inventory/transfer', {
        method: 'POST',
        body: JSON.stringify({
          fromLocationId: formData.fromLocationId,
          toLocationId: formData.toLocationId,
          items: transferItems.map(item => ({
            variantId: item.variantId,
            quantity: parseFloat(item.quantity),
          })),
          notes: formData.notes,
        }),
      })

      const data = await response.json()
      if (data.success) {
        showNotification('Stock transferred successfully!', 'success')
        // Small delay to ensure data is saved
        await new Promise(resolve => setTimeout(resolve, 1000))
        router.push('/inventory')
        // Force refresh when returning to inventory page
        router.refresh()
      } else {
        showNotification(data.error || 'Failed to transfer stock', 'error')
      }
    } catch (error: any) {
      console.error('Error transferring stock:', error)
      showNotification('Error transferring stock', 'error')
    } finally {
      setLoading(false)
    }
  }

  const getProductVariants = (productId: string) => {
    const product = products.find(p => p.id === productId)
    return product?.variants || []
  }

  return (
    <Layout>
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">نقل المخزون بين المواقع</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-4xl">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  من الموقع *
                </label>
                <select
                  value={formData.fromLocationId}
                  onChange={(e) => setFormData({ ...formData, fromLocationId: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">اختر الموقع المصدر</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  إلى الموقع *
                </label>
                <select
                  value={formData.toLocationId}
                  onChange={(e) => setFormData({ ...formData, toLocationId: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">اختر الموقع الوجهة</option>
                  {locations
                    .filter(loc => loc.id !== formData.fromLocationId)
                    .map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  العناصر المراد نقلها *
                </label>
                <button
                  type="button"
                  onClick={addTransferItem}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  + إضافة عنصر
                </button>
              </div>

              <div className="space-y-4">
                {transferItems.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          المنتج
                        </label>
                        <select
                          value={item.productId}
                          onChange={(e) => updateTransferItem(index, 'productId', e.target.value)}
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

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          المتغير
                        </label>
                        <select
                          value={item.variantId}
                          onChange={(e) => updateTransferItem(index, 'variantId', e.target.value)}
                          required
                          disabled={!item.productId}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        >
                          <option value="">اختر متغيراً</option>
                          {getProductVariants(item.productId).map((variant: any) => (
                            <option key={variant.id} value={variant.id}>
                              {variant.size?.code} / {variant.color?.code}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            الكمية {item.availableQuantity !== undefined && (
                              <span className="text-xs text-gray-500 font-normal">
                                (المتاح: {item.availableQuantity})
                              </span>
                            )}
                          </label>
                          <input
                            type="number"
                            step="1"
                            min="1"
                            max={item.availableQuantity !== undefined ? item.availableQuantity : undefined}
                            value={item.quantity}
                            onChange={(e) => {
                              const qty = e.target.value
                              const maxQty = item.availableQuantity !== undefined ? item.availableQuantity : Infinity
                              if (qty === '' || (parseFloat(qty) >= 1 && parseFloat(qty) <= maxQty)) {
                                updateTransferItem(index, 'quantity', qty)
                              }
                            }}
                            required
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                              item.availableQuantity !== undefined && 
                              parseFloat(item.quantity || '0') > item.availableQuantity
                                ? 'border-red-500 bg-red-50' 
                                : 'border-gray-300'
                            }`}
                            placeholder={item.availableQuantity !== undefined ? `حد أقصى: ${item.availableQuantity}` : ''}
                          />
                          {item.availableQuantity !== undefined && 
                           parseFloat(item.quantity || '0') > item.availableQuantity && (
                            <p className="text-xs text-red-600 mt-1">
                              الكمية المطلوبة ({item.quantity}) تتجاوز المتاح ({item.availableQuantity})
                            </p>
                          )}
                          {item.availableQuantity !== undefined && item.availableQuantity === 0 && (
                            <p className="text-xs text-red-600 mt-1">
                              لا يوجد مخزون متاح لهذا المتغير في الموقع المصدر
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeTransferItem(index)}
                          className="mt-6 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ملاحظات (اختياري)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
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
                disabled={loading || transferItems.length === 0}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'جارٍ النقل...' : 'نقل المخزون'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  )
}

