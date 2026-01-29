'use client'

import { useState, useEffect } from 'react'
import Layout from '../../../components/Layout'
import { fetchWithAuth } from '../../../lib/auth'
import { useRouter } from 'next/navigation'

export default function NewPurchaseOrderPage() {
  const router = useRouter()
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [materials, setMaterials] = useState<any[]>([])
  const [formData, setFormData] = useState({
    supplierId: '',
    expectedDeliveryDate: '',
    notes: '',
    items: [] as Array<{ materialId: string; quantity: number; unitPrice: number }>,
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [suppliersRes, materialsRes] = await Promise.all([
        fetchWithAuth('/suppliers'),
        fetchWithAuth('/products/materials'),
      ])
      const suppliersData = await suppliersRes.json()
      const materialsData = await materialsRes.json()
      setSuppliers(suppliersData.data || [])
      setMaterials(materialsData.data || [])
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { materialId: '', quantity: 0, unitPrice: 0 }],
    })
  }

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items]
    newItems[index] = { ...newItems[index], [field]: value }
    setFormData({ ...formData, items: newItems })
  }

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetchWithAuth('/suppliers/purchase-orders', {
        method: 'POST',
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push('/purchase-orders')
      }
    } catch (error) {
      console.error('Error creating purchase order:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">New Purchase Order</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supplier *
              </label>
              <select
                value={formData.supplierId}
                onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expected Delivery Date
              </label>
              <input
                type="date"
                value={formData.expectedDeliveryDate}
                onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Items</h2>
              <button
                type="button"
                onClick={addItem}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                + Add Item
              </button>
            </div>

            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="col-span-5">
                    <select
                      value={item.materialId}
                      onChange={(e) => updateItem(index, 'materialId', e.target.value)}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Select Material</option>
                      {materials.map((material) => (
                        <option key={material.id} value={material.id}>
                          {material.nameEn} ({material.unit})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      placeholder="Quantity"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value))}
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      placeholder="Unit Price"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value))}
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div className="col-span-1">
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || formData.items.length === 0}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Purchase Order'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}










