'use client'

import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { fetchWithAuth } from '../../lib/auth'
import Link from 'next/link'

export default function InventoryPage() {
  const [locations, setLocations] = useState<any[]>([])
  const [selectedLocation, setSelectedLocation] = useState('')
  const [stockItems, setStockItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLocations()
  }, [])

  useEffect(() => {
    if (selectedLocation) {
      // Add a small delay to ensure location is set
      const timer = setTimeout(() => {
        console.log('Location changed, loading stock for:', selectedLocation)
        loadStock()
      }, 200)
      return () => clearTimeout(timer)
    } else {
      setStockItems([])
    }
  }, [selectedLocation])

  // Refresh data when page becomes visible (e.g., returning from other pages)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && selectedLocation) {
        loadStock()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [selectedLocation])

  // Refresh on focus
  useEffect(() => {
    const handleFocus = () => {
      if (selectedLocation) {
        loadStock()
      }
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [selectedLocation])

  const loadLocations = async () => {
    try {
      const response = await fetchWithAuth('/inventory/locations')
      const data = await response.json()
      setLocations((data.data || []).filter((loc: any) => loc.name !== 'Factory'))
      if (data.data && data.data.length > 0) {
        const filtered = data.data.filter((loc: any) => loc.name !== 'Factory')
        if (filtered.length > 0) {
          setSelectedLocation(filtered[filtered.length - 1].id) // Default to last (usually Store)
        }
      }
    } catch (error) {
      console.error('Error loading locations:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStock = async () => {
    if (!selectedLocation) {
      setStockItems([])
      return
    }
    setLoading(true)
    try {
      console.log('Loading stock for location:', selectedLocation)
      const response = await fetchWithAuth(`/inventory/stock?locationId=${selectedLocation}`)
      if (!response.ok) {
        console.error('Failed to fetch stock:', response.status, response.statusText)
        setStockItems([])
        return
      }
      const data = await response.json()
      console.log('Stock API response:', { success: data.success, count: data.data?.length, locationId: selectedLocation })
      console.log('Stock data sample:', data.data?.slice(0, 2))
      
      // Show all items (including 0 quantity) so admin can see what's assigned
      const allStock = data.data || []
      setStockItems(allStock)
      console.log('Stock items set in state:', allStock.length)
      
      // Force re-render by updating state again
      if (allStock.length === 0) {
        console.warn('No stock items found for location:', selectedLocation)
      }
    } catch (error: any) {
      console.error('Error loading stock:', error)
      console.error('Error details:', error.message, error.stack)
      setStockItems([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <div className="flex gap-3">
            <Link
              href="/inventory/transfer"
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
            >
              Transfer Stock
            </Link>
            <Link
              href="/inventory/assign-stock"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              + Assign Stock
            </Link>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Location
          </label>
          <div className="flex gap-2 items-center">
            <select
              value={selectedLocation}
              onChange={(e) => {
                setSelectedLocation(e.target.value)
                setStockItems([]) // Clear previous data immediately
              }}
              className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a location</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
            {selectedLocation && (
              <button
                type="button"
                onClick={() => {
                  if (selectedLocation) {
                    loadStock()
                  }
                }}
                className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition"
                title="Refresh stock data"
              >
                🔄
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Stock Items</h2>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12 text-gray-500">
                Loading stock...
              </div>
            ) : stockItems.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                {selectedLocation 
                  ? `No stock items found at this location. Add products and variants, then assign stock to this location.`
                  : 'Please select a location to view stock.'}
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Product Variant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Available
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Reserved
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Min Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stockItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.variant?.product?.nameEn || item.variant?.product?.nameAr || 'Unknown Product'} - {item.variant?.size?.code || 'N/A'} / {item.variant?.color?.code || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.variant?.sku}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.reservedQuantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.minStockLevel}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.quantity <= item.minStockLevel
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                            }`}
                        >
                          {item.quantity <= item.minStockLevel ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

