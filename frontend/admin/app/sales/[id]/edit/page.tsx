'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Layout from '../../../../components/Layout'
import { fetchWithAuth } from '../../../../lib/auth'



export default function InvoiceEditPage() {
  const params = useParams()
  const router = useRouter()
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    status: '',
    notes: '',
  })

  useEffect(() => {
    loadInvoice()
  }, [params.id])

  const loadInvoice = async () => {
    try {
      const response = await fetchWithAuth(`/sales/invoices/${params.id}`)
      const data = await response.json()
      const invoiceData = data.data || data
      setInvoice(invoiceData)
      setFormData({
        status: invoiceData.status,
        notes: invoiceData.notes || '',
      })
    } catch (error) {
      console.error('Error loading invoice:', error)
      alert('Failed to load invoice')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await fetchWithAuth(`/sales/invoices/${params.id}`, {
        method: 'PATCH',
        body: JSON.stringify(formData),
      })
      alert('Invoice updated successfully')
      router.push(`/sales/${params.id}`)
    } catch (error: any) {
      console.error('Error updating invoice:', error)
      alert(`Failed to update invoice: ${error.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  if (!invoice) {
    return (
      <Layout>
        <div className="p-8 text-center">Loading...</div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-8 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Edit Invoice</h1>
          <Link
            href={`/sales/${params.id}`}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Invoice Info */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-bold mb-4">Invoice #{invoice.invoiceNumber}</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Date:</span>
                  <span className="ml-2">{new Date(invoice.createdAt).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-gray-600">Total:</span>
                  <span className="ml-2 font-semibold">{parseFloat(invoice.totalAmount || '0').toFixed(2)} EGP</span>
                </div>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-pink"
                required
              >
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="cancelled">Cancelled</option>
                <option value="returned">Returned</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-pink"
                placeholder="Add any notes about this invoice..."
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
              <Link
                href={`/sales/${params.id}`}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-brand-pink text-white rounded-lg hover:bg-brand-pink-dark disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Invoice'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}

