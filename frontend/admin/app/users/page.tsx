'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Layout from '../../components/Layout'
import { fetchWithAuth } from '../../lib/auth'
import { useNotification } from '../../contexts/NotificationContext'

export default function UsersPage() {
  const { showNotification } = useNotification()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const response = await fetchWithAuth('/users')
      const data = await response.json()
      setUsers(data.data || [])
    } catch (error) {
      console.error('Error loading users:', error)
      showNotification('فشل تحميل المستخدمين', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return

    try {
      await fetchWithAuth(`/users/${userId}`, {
        method: 'DELETE',
      })
      loadData()
      showNotification('تم حذف المستخدم بنجاح', 'success')
    } catch (error) {
      showNotification('فشل حذف المستخدم', 'error')
    }
  }

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">المستخدمون</h1>
        <Link
          href="/users/new"
          className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-brand-cafe text-white rounded-lg hover:bg-brand-cafe-dark disabled:opacity-50 transition font-semibold shadow-lg shadow-brand-cafe/20 text-sm sm:text-base text-center"
        >
          + مستخدم جديد
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12">جاري التحميل...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الاسم / البريد الإلكتروني
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الدور
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  تفاصيل الوظيفة
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الحالة
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  إجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      {user.phone && <div className="text-xs text-gray-400 mt-1">{user.phone}</div>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize border border-gray-200">
                      {user.role?.name || 'غير متوفر'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.jobTitle || '-'}</div>
                    {user.employeeCode && (
                      <div className="text-xs text-gray-500 font-mono mt-1">الرمز: {user.employeeCode}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                        }`}
                    >
                      {user.isActive ? 'نشط' : 'غير نشط'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {(user.role?.name?.toLowerCase() === 'customer' || 
                      user.role?.name?.toLowerCase() === 'user' ||
                      user.role?.name?.toLowerCase() === 'pos manager' ||
                      user.role?.name?.toLowerCase() === 'employee' ||
                      user.role?.name?.toLowerCase() === 'sales') && (
                      <Link
                        href={`/users/${user.id}/details`}
                        className="text-blue-600 hover:text-blue-900 px-3 py-1 rounded bg-blue-100 hover:bg-blue-200 transition"
                      >
                        التفاصيل
                      </Link>
                    )}
                    <Link
                      href={`/users/${user.id}`}
                      className="text-brand-cafe hover:text-brand-cafe-dark px-3 py-1 rounded bg-brand-cafe/10 hover:bg-brand-cafe/20 transition"
                    >
                      تعديل
                    </Link>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-600 hover:text-red-900 px-3 py-1 rounded bg-red-100 hover:bg-red-200 transition"
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">👥</div>
              <h3 className="text-lg font-medium text-gray-900">لم يتم العثور على مستخدمين</h3>
              <p className="text-gray-500 mt-1">ابدأ بإنشاء مستخدم جديد.</p>
            </div>
          )}
        </div>
      )}
    </Layout>
  )
}

