'use client'

import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { fetchWithAuth } from '../../lib/auth'
import Link from 'next/link'

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      const response = await fetchWithAuth('/products')
      const data = await response.json()
      setProducts(data.data || [])
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      await fetchWithAuth(`/products/${productId}`, {
        method: 'DELETE',
      })
      loadProducts()
    } catch (error: any) {
      console.error('Error deleting product:', error)
      alert('Error deleting product: ' + (error.message || error))
    }
  }

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">المنتجات</h1>
        <Link
          href="/products/new"
          className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-brand-cafe text-white rounded-lg hover:bg-brand-cafe-dark disabled:opacity-50 transition font-semibold text-sm sm:text-base text-center"
        >
          + إضافة منتج
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12">جاري التحميل...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المنتج
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  رمز المنتج
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  سعر التكلفة
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  سعر البيع
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  الحالة
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  إجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-3 sm:px-6 py-3 sm:py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{product.nameAr}</div>
                      <div className="text-xs sm:text-sm text-gray-500 hidden sm:block">{product.nameEn}</div>
                      <div className="text-xs text-gray-400 sm:hidden mt-1">{product.sku || 'غير متوفر'}</div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                    {product.sku || 'غير متوفر'}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-900 hidden md:table-cell">
                    {product.costPrice} جنيه
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                    {product.retailPrice} جنيه
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden lg:table-cell">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                        }`}
                    >
                      {product.isActive ? 'نشط' : 'غير نشط'}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm font-medium">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Link
                        href={`/products/${product.id}`}
                        className="text-brand-cafe hover:text-brand-cafe-dark px-2 sm:px-3 py-1 rounded bg-brand-cafe/10 hover:bg-brand-cafe/20 transition text-xs sm:text-sm text-center"
                      >
                        تعديل
                      </Link>
                      <Link
                        href={`/products/${product.id}/variants`}
                        className="text-brand-cafe hover:text-brand-cafe-dark px-2 sm:px-3 py-1 rounded bg-brand-cafe/10 hover:bg-brand-cafe/20 transition text-xs sm:text-sm text-center hidden sm:block"
                      >
                        المتغيرات
                      </Link>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-red-600 hover:text-red-900 px-2 sm:px-3 py-1 rounded bg-red-100 hover:bg-red-200 transition text-xs sm:text-sm"
                      >
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  )
}

