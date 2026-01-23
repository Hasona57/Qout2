'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Layout from '../../../../components/Layout'
import { fetchWithAuth } from '../../../../lib/auth'

export default function ProductVariantsPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<any>(null)
  const [variants, setVariants] = useState<any[]>([])
  const [sizes, setSizes] = useState<any[]>([])
  const [colors, setColors] = useState<any[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [params.id])

  const loadData = async () => {
    try {
      const [productRes, sizesRes, colorsRes] = await Promise.all([
        fetchWithAuth(`/products/${params.id}`),
        fetchWithAuth('/products/sizes'),
        fetchWithAuth('/products/colors'),
      ])
      const productData = await productRes.json()
      const sizesData = await sizesRes.json()
      const colorsData = await colorsRes.json()

      const product = productData.data || productData
      setProduct(product)
      setVariants(product.variants || [])
      setSizes(sizesData.data || [])
      setColors(colorsData.data || [])
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const handleAddVariants = async () => {
    if (selectedSizes.length === 0 || selectedColors.length === 0) {
      alert('الرجاء اختيار مقاس واحد ولون واحد على الأقل')
      return
    }

    setLoading(true)
    try {
      const newVariants: any[] = []
      selectedSizes.forEach((sizeId) => {
        selectedColors.forEach((colorId) => {
          // Check if variant already exists
          const exists = variants.some(
            (v) => v.size?.id === sizeId && v.color?.id === colorId
          )
          if (!exists) {
            newVariants.push({
              sizeId,
              colorId,
              sku: `${product.sku || 'PROD'}-${sizes.find((s) => s.id === sizeId)?.code}-${colors.find((c) => c.id === colorId)?.code}`,
              weight: '0.5',
              barcode: '',
            })
          }
        })
      })

      for (const variant of newVariants) {
        await fetchWithAuth(`/products/${params.id}/variants`, {
          method: 'POST',
          body: JSON.stringify(variant),
        })
      }

      setSelectedSizes([])
      setSelectedColors([])
      setShowAddForm(false)
      loadData()
    } catch (error) {
      console.error('Error adding variants:', error)
      alert('خطأ في إضافة المتغيرات')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteVariant = async (variantId: string) => {
    if (!confirm('هل أنت متأكد أنك تريد حذف هذا المتغير؟')) return

    try {
      const response = await fetchWithAuth(`/products/variants/${variantId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to delete variant')
      }

      loadData()
      alert('تم حذف المتغير بنجاح!')
    } catch (error: unknown) {
      console.error('Error deleting variant:', error)
      alert('خطأ في حذف المتغير: ' + (error instanceof Error ? error.message : String(error)))
    }
  }

  const handlePrintBarcode = (variant: any) => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const barcodeHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Barcode - ${variant.sku}</title>
          <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39+Text&display=swap" rel="stylesheet">
          <style>
            @media print {
              @page { margin: 0; size: 3in 2in; }
              body { margin: 0; padding: 10px; }
            }
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 20px;
            }
            .barcode-container {
              border: 2px solid #000;
              padding: 15px;
              display: inline-block;
            }
            .product-name {
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .barcode {
              font-family: 'Libre Barcode 39 Text', cursive;
              font-size: 48px;
              margin: 10px 0;
            }
            .sku {
              font-size: 12px;
              margin-top: 10px;
            }
            img {
              max-width: 200px;
              height: auto;
            }
          </style>
        </head>
        <body>
          <div class="barcode-container">
            <div class="product-name">${product.nameEn || product.nameAr}</div>
            <div class="barcode">*${variant.barcode || variant.sku}*</div>
            <div class="sku">SKU: ${variant.sku}</div>
            <div class="sku">${variant.size?.nameAr || variant.size?.code} / ${variant.color?.nameAr || variant.color?.code}</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `
    printWindow.document.write(barcodeHtml)
    printWindow.document.close()
  }

  return (
    <Layout>
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">متغيرات المنتج</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">{product?.nameAr || product?.nameEn}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 sm:px-4 py-2 bg-brand-cafe text-white hover:bg-brand-cafe-dark transition text-sm sm:text-base text-center rounded-lg"
            >
              {showAddForm ? 'إلغاء' : '+ إضافة متغيرات'}
            </button>
            <button
              onClick={() => router.push(`/products/${params.id}`)}
              className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm sm:text-base text-center"
            >
              العودة للمنتج
            </button>
          </div>
        </div>

        {showAddForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">إضافة متغيرات جديدة</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اختر المقاسات
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
                  اختر الألوان
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
              onClick={handleAddVariants}
              disabled={loading || selectedSizes.length === 0 || selectedColors.length === 0}
              className="mt-4 px-4 sm:px-6 py-2 sm:py-3 bg-brand-cafe text-white rounded-lg hover:bg-brand-cafe-dark disabled:opacity-50 text-sm sm:text-base w-full sm:w-auto"
            >
              {loading ? 'جاري الإضافة...' : 'إضافة المتغيرات المحددة'}
            </button>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase">المقاس</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase">اللون</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">رمز المنتج</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase hidden md:table-cell">الباركود</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">الوزن</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase">إجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {variants.map((variant) => (
                <tr key={variant.id} className="hover:bg-gray-50">
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                    {variant.size?.nameAr || variant.size?.code || 'غير متوفر'}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                    {variant.color?.nameAr || variant.color?.code || 'غير متوفر'}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-mono hidden sm:table-cell">
                    {variant.sku}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-mono hidden md:table-cell">
                    {variant.barcode || '-'}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm hidden lg:table-cell">
                    {variant.weight} كجم
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                    <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                      <button
                        onClick={() => handlePrintBarcode(variant)}
                        className="text-blue-600 hover:text-blue-900 text-xs sm:text-sm"
                      >
                        طباعة الباركود
                      </button>
                      <button
                        onClick={() => handleDeleteVariant(variant.id)}
                        className="text-red-600 hover:text-red-900 text-xs sm:text-sm"
                      >
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {variants.length === 0 && (
            <div className="text-center py-12 text-gray-500 text-sm sm:text-base">
              لم يتم العثور على متغيرات. أضف متغيرات للبدء.
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}



