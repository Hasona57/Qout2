'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Layout from '../../../components/Layout'
import { fetchWithAuth } from '../../../lib/auth'
import { useNotification } from '../../../contexts/NotificationContext'

export default function EditUserPage() {
    const { showNotification } = useNotification()
    const params = useParams()
    const router = useRouter()
    const isNew = params.id === 'new'

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        roleId: '',
        commissionRate: '',
        employeeCode: '',
        salary: '',
        jobTitle: '',
        employmentDate: '',
        isActive: true,
    })

    const [roles, setRoles] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const [rolesRes, userRes] = await Promise.all([
                fetchWithAuth('/users/roles'),
                !isNew ? fetchWithAuth(`/users/${params.id}`) : Promise.resolve(null),
            ])

            const rolesData = await rolesRes.json()
            setRoles(rolesData.data || [])

            if (userRes) {
                const userData = await userRes.json()
                const user = userData.data || userData
                setFormData({
                    name: user.name || '',
                    email: user.email || '',
                    password: '', // Don't fill password on edit
                    phone: user.phone || '',
                    roleId: user.role?.id || user.roleId || '',
                    commissionRate: user.commissionRate || '',
                    employeeCode: user.employeeCode || '',
                    salary: user.salary || '',
                    jobTitle: user.jobTitle || '',
                    employmentDate: user.employmentDate ? user.employmentDate.split('T')[0] : '', // Format for date input
                    isActive: user.isActive ?? true,
                })
            }
        } catch (error) {
            console.error('Error loading data:', error)
            showNotification('فشل تحميل بيانات المستخدم', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            const payload: any = { ...formData }

            // Clean up empty fields
            if (!payload.password) delete payload.password
            if (!payload.phone) delete payload.phone
            if (!payload.employeeCode) delete payload.employeeCode

            // Type conversions
            if (payload.commissionRate) payload.commissionRate = parseFloat(payload.commissionRate)
            if (payload.salary) payload.salary = parseFloat(payload.salary)

            const url = isNew ? '/users' : `/users/${params.id}`
            const method = isNew ? 'POST' : 'PATCH'

            const response = await fetchWithAuth(url, {
                method,
                body: JSON.stringify(payload),
            })

            if (!response.ok) {
                throw new Error('Failed to save user')
            }

            showNotification('تم حفظ المستخدم بنجاح', 'success')
            router.push('/users')
        } catch (error) {
            console.error('Error saving user:', error)
            showNotification('فشل حفظ المستخدم', 'error')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <Layout>
                <div className="text-center py-12">جاري التحميل...</div>
            </Layout>
        )
    }

    return (
        <Layout>
            <div className="max-w-4xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                        {isNew ? 'إنشاء مستخدم جديد' : 'تعديل المستخدم'}
                    </h1>
                    <button
                        onClick={() => router.push('/users')}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium text-sm sm:text-base w-full sm:w-auto"
                    >
                        إلغاء
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">

                    {/* Personal Info Section */}
                    <div>
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">المعلومات الشخصية</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">الاسم *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    className="w-full px-4 py-2 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-cafe focus:border-transparent transition text-sm sm:text-base"
                                    placeholder="الاسم الكامل"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني *</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                    className="w-full px-4 py-2 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-cafe focus:border-transparent transition text-sm sm:text-base"
                                    placeholder="email@example.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {isNew ? 'كلمة المرور *' : 'كلمة مرور جديدة (اتركها فارغة للاحتفاظ بالقديمة)'}
                                </label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required={isNew}
                                    className="w-full px-4 py-2 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-cafe focus:border-transparent transition text-sm sm:text-base"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">الهاتف</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-2 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-cafe focus:border-transparent transition text-sm sm:text-base"
                                    placeholder="+20..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Employment Section */}
                    <div>
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">تفاصيل التوظيف</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">الدور *</label>
                                <select
                                    value={formData.roleId}
                                    onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                                    required
                                    className="w-full px-4 py-2 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-cafe focus:border-transparent transition text-sm sm:text-base"
                                >
                                    <option value="">اختر الدور</option>
                                    {roles.map((role) => (
                                        <option key={role.id} value={role.id}>{role.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">المسمى الوظيفي</label>
                                <input
                                    type="text"
                                    value={formData.jobTitle}
                                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                                    className="w-full px-4 py-2 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-cafe focus:border-transparent transition text-sm sm:text-base"
                                    placeholder="مثال: مندوب مبيعات أول"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">الراتب الشهري (جنيه)</label>
                                <div className="relative">
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">جنيه</span>
                                    <input
                                        type="number"
                                        value={formData.salary}
                                        onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                                        className="w-full pr-14 pl-4 py-2 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-cafe focus:border-transparent transition text-sm sm:text-base"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ التوظيف</label>
                                <input
                                    type="date"
                                    value={formData.employmentDate}
                                    onChange={(e) => setFormData({ ...formData, employmentDate: e.target.value })}
                                    className="w-full px-4 py-2 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-cafe focus:border-transparent transition text-sm sm:text-base"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">نسبة العمولة (%)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.commissionRate}
                                    onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
                                    className="w-full px-4 py-2 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-cafe focus:border-transparent transition text-sm sm:text-base"
                                    placeholder="0%"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">رمز الموظف</label>
                                <input
                                    type="text"
                                    value={formData.employeeCode}
                                    onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                                    className="w-full px-4 py-2 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-cafe focus:border-transparent transition text-sm sm:text-base"
                                    placeholder="مثال: EMP-001"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            className="w-5 h-5 text-brand-cafe border-gray-300 rounded focus:ring-brand-cafe"
                        />
                        <label htmlFor="isActive" className="text-gray-900 font-medium text-sm sm:text-base">حساب نشط</label>
                    </div>

                    <div className="flex justify-end pt-4 sm:pt-6">
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 sm:px-8 py-3 sm:py-4 bg-brand-cafe text-white text-base sm:text-lg font-semibold rounded-xl hover:bg-brand-cafe-dark shadow-lg shadow-brand-cafe/20 transition disabled:opacity-50 disabled:shadow-none w-full sm:w-auto"
                        >
                            {saving ? 'جاري الحفظ...' : (isNew ? 'إنشاء المستخدم' : 'حفظ التغييرات')}
                        </button>
                    </div>

                </form>
            </div>
        </Layout>
    )
}
