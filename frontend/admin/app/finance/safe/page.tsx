'use client'

import { useState, useEffect } from 'react'
import Layout from '../../../components/Layout'
import { fetchWithAuth } from '../../../lib/auth'
import Link from 'next/link'

export default function SafePage() {
    const [status, setStatus] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month' | 'last7' | 'last30' | 'custom'>('all')
    const [startDate, setStartDate] = useState<string>('')
    const [endDate, setEndDate] = useState<string>('')
    const [showTransferModal, setShowTransferModal] = useState(false)
    const [transferForm, setTransferForm] = useState({
        fromMethod: '',
        toMethod: '',
        amount: '',
        notes: '',
    })
    const [transferring, setTransferring] = useState(false)
    const paymentMethods = [
        { code: 'cash', name: 'نقد', nameEn: 'Cash' },
        { code: 'cash_pos', name: 'نقد نقاط البيع', nameEn: 'Cash POS' },
        { code: 'cod', name: 'الدفع عند الاستلام', nameEn: 'Cash on Delivery' },
        { code: 'vodafone_cash', name: 'فودافون كاش', nameEn: 'Vodafone Cash' },
        { code: 'instapay', name: 'انستا باي', nameEn: 'Instapay' },
        { code: 'fawry', name: 'فوري', nameEn: 'Fawry' },
    ]

    useEffect(() => {
        fetchSafeStatus()
    }, [dateRange, startDate, endDate])

    const getDateRange = () => {
        const today = new Date()
        today.setHours(23, 59, 59, 999)
        
        switch (dateRange) {
            case 'today':
                const todayStart = new Date()
                todayStart.setHours(0, 0, 0, 0)
                return { start: todayStart.toISOString().split('T')[0], end: today.toISOString().split('T')[0] }
            case 'week':
                const weekStart = new Date()
                weekStart.setDate(weekStart.getDate() - weekStart.getDay())
                weekStart.setHours(0, 0, 0, 0)
                return { start: weekStart.toISOString().split('T')[0], end: today.toISOString().split('T')[0] }
            case 'month':
                const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
                return { start: monthStart.toISOString().split('T')[0], end: today.toISOString().split('T')[0] }
            case 'last7':
                const last7Start = new Date()
                last7Start.setDate(last7Start.getDate() - 7)
                last7Start.setHours(0, 0, 0, 0)
                return { start: last7Start.toISOString().split('T')[0], end: today.toISOString().split('T')[0] }
            case 'last30':
                const last30Start = new Date()
                last30Start.setDate(last30Start.getDate() - 30)
                last30Start.setHours(0, 0, 0, 0)
                return { start: last30Start.toISOString().split('T')[0], end: today.toISOString().split('T')[0] }
            case 'custom':
                return { start: startDate, end: endDate }
            default:
                return { start: '', end: '' }
        }
    }

    const fetchSafeStatus = async () => {
        try {
            setLoading(true)
            const range = getDateRange()
            let url = '/finance/safe'
            const params = new URLSearchParams()
            if (range.start) params.append('startDate', range.start)
            if (range.end) params.append('endDate', range.end)
            if (params.toString()) url += '?' + params.toString()

            const res = await fetchWithAuth(url)
            const data = await res.json()
            // Backend uses TransformInterceptor, so the actual payload is in data.data
            setStatus(data.data || data)
        } catch (error) {
            console.error('Error fetching safe status:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (amount: string) => {
        return parseFloat(amount || '0').toLocaleString('en-EG', {
            style: 'currency',
            currency: 'EGP'
        });
    }

    if (loading) return <Layout><div className="p-4 sm:p-8">جاري تحميل حالة الخزينة...</div></Layout>

    return (
        <Layout>
            <div className="p-3 sm:p-4 lg:p-8 max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6 lg:mb-8">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">الخزينة والمالية</h1>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <button
                            onClick={() => setShowTransferModal(true)}
                            className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm sm:text-base w-full sm:w-auto text-center"
                        >
                            نقل أموال
                        </button>
                        <Link
                            href="/finance"
                            className="px-3 sm:px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-300 transition text-sm sm:text-base w-full sm:w-auto text-center"
                        >
                            العودة للمالية
                        </Link>
                    </div>
                </div>

                {/* Date Range Selector */}
                <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-4 sm:mb-6 lg:mb-8">
                    <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">تصفية حسب النطاق الزمني</h2>
                    <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-end">
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-sm font-medium text-gray-700 mb-2">اختيار سريع</label>
                            <select
                                value={dateRange}
                                onChange={(e) => {
                                    setDateRange(e.target.value as any)
                                    if (e.target.value !== 'custom') {
                                        setStartDate('')
                                        setEndDate('')
                                    }
                                }}
                                className="w-full border rounded-lg p-2 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">كل الوقت</option>
                                <option value="today">اليوم</option>
                                <option value="week">هذا الأسبوع</option>
                                <option value="month">هذا الشهر</option>
                                <option value="last7">آخر 7 أيام</option>
                                <option value="last30">آخر 30 يومًا</option>
                                <option value="custom">نطاق مخصص</option>
                            </select>
                        </div>
                        {dateRange === 'custom' && (
                            <>
                                <div className="flex-1 min-w-[150px]">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ البداية</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div className="flex-1 min-w-[150px]">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ النهاية</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full border rounded-lg p-2 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </>
                        )}
                        {dateRange !== 'all' && (
                            <div className="text-sm text-gray-600">
                                {(() => {
                                    const range = getDateRange()
                                    if (range.start && range.end) {
                                        return `عرض: ${new Date(range.start).toLocaleDateString('ar-EG')} - ${new Date(range.end).toLocaleDateString('ar-EG')}`
                                    }
                                    return ''
                                })()}
                            </div>
                        )}
                    </div>
                </div>



                {/* Main Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                    {/* Net Cash In Hand */}
                    <div className="bg-gradient-to-br from-green-500 to-green-700 text-white rounded-xl p-4 sm:p-6 lg:p-8 shadow-lg">
                        <h3 className="text-base sm:text-lg font-medium opacity-90 mb-2">صافي النقد في الخزينة</h3>
                        <p className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">{formatCurrency(status?.netCashInHand)}</p>
                        <p className="text-xs sm:text-sm opacity-75 mt-3 sm:mt-4">النقد السائل الفعلي المتاح بعد المصروفات.</p>
                    </div>

                    {/* Total Income */}
                    <div className="bg-white border p-4 sm:p-6 lg:p-8 rounded-xl shadow-sm">
                        <h3 className="text-base sm:text-lg font-medium text-gray-500 mb-2">إجمالي الدخل الإجمالي</h3>
                        <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">{formatCurrency(status?.totalIncome)}</p>
                        <div className="mt-3 sm:mt-4 flex items-center text-green-600 text-xs sm:text-sm font-medium">
                            جميع طرق الدفع متضمنة
                        </div>
                    </div>

                    {/* Total Expenses */}
                    <div className="bg-white border p-4 sm:p-6 lg:p-8 rounded-xl shadow-sm">
                        <h3 className="text-base sm:text-lg font-medium text-gray-500 mb-2">إجمالي المصروفات</h3>
                        <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-red-600">{formatCurrency(status?.totalExpenses)}</p>
                        <div className="mt-3 sm:mt-4 flex items-center text-red-600 text-xs sm:text-sm font-medium">
                            مخصوم من النقد
                        </div>
                    </div>
                </div>

                {/* Detailed Breakdown */}
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">تفاصيل الرصيد حسب الطريقة</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
                    {/* Cash POS */}
                    <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-2 h-full bg-green-500"></div>
                        <h4 className="text-gray-500 font-medium text-xs sm:text-sm uppercase tracking-wider mb-2">نقد نقاط البيع</h4>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900">{formatCurrency(status?.breakdown?.cash_pos)}</p>
                        <p className="text-xs text-gray-400 mt-2">نقد نقاط البيع</p>
                    </div>

                    {/* COD */}
                    <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-2 h-full bg-blue-500"></div>
                        <h4 className="text-gray-500 font-medium text-xs sm:text-sm uppercase tracking-wider mb-2">الدفع عند الاستلام</h4>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900">{formatCurrency(status?.breakdown?.cod)}</p>
                        <p className="text-xs text-gray-400 mt-2">مدفوعات الدفع عند الاستلام</p>
                    </div>

                    {/* Vodafone Cash */}
                    <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-2 h-full bg-red-600"></div>
                        <h4 className="text-gray-500 font-medium text-xs sm:text-sm uppercase tracking-wider mb-2">فودافون كاش</h4>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900">{formatCurrency(status?.breakdown?.vodafone_cash)}</p>
                        <p className="text-xs text-gray-400 mt-2">محفظة رقمية</p>
                    </div>

                    {/* Instapay */}
                    <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-2 h-full bg-purple-600"></div>
                        <h4 className="text-gray-500 font-medium text-xs sm:text-sm uppercase tracking-wider mb-2">انستا باي</h4>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900">{formatCurrency(status?.breakdown?.instapay)}</p>
                        <p className="text-xs text-gray-400 mt-2">تطبيق تحويل بنكي</p>
                    </div>

                    {/* Fawry */}
                    <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-2 h-full bg-orange-600"></div>
                        <h4 className="text-gray-500 font-medium text-xs sm:text-sm uppercase tracking-wider mb-2">فوري</h4>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900">{formatCurrency(status?.breakdown?.fawry)}</p>
                        <p className="text-xs text-gray-400 mt-2">دفع فوري</p>
                    </div>
                </div>



                {/* Recent Transactions Table */}
                <div className="mt-6 sm:mt-8 bg-white rounded-lg shadow overflow-x-auto">
                    <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                        <h3 className="text-base sm:text-lg font-bold text-gray-900">الحركات الأخيرة</h3>
                    </div>
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المرجع</th>
                                <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">التاريخ</th>
                                <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الطريقة</th>
                                <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">الحالة</th>
                                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">المبلغ</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {status?.recentTransactions?.map((txn: any) => (
                                <tr key={txn.id} className="hover:bg-gray-50">
                                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                                        {txn.reference} {txn.isexcluded ? <span className="text-xs text-red-500 mr-2">(مستثنى)</span> : ''}
                                    </td>
                                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden sm:table-cell">
                                        {new Date(txn.date).toLocaleDateString('ar-EG')} {new Date(txn.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                                        <span className={`px-2 py-1 rounded text-xs font-medium
                                            ${txn.type === 'expense' ? 'bg-red-100 text-red-800' :
                                                txn.type === 'refund' ? 'bg-orange-100 text-orange-800' :
                                                    txn.code === 'cash' || txn.code === 'cash_pos' ? 'bg-green-100 text-green-800' :
                                                        txn.code === 'cod' ? 'bg-blue-100 text-blue-800' :
                                                            txn.code === 'vodafone_cash' ? 'bg-red-100 text-red-800' :
                                                                txn.code === 'instapay' ? 'bg-purple-100 text-purple-800' :
                                                                    txn.code === 'fawry' ? 'bg-orange-100 text-orange-800' :
                                                                        'bg-gray-100 text-gray-800'}`}>
                                            {txn.method}
                                        </span>
                                    </td>
                                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm hidden md:table-cell">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                                            ${txn.type === 'expense' ? 'bg-red-50 text-red-800' :
                                                txn.type === 'refund' ? 'bg-orange-50 text-orange-800' :
                                                    'bg-green-100 text-green-800'}`}>
                                            {txn.status === 'completed' ? 'مكتمل' : txn.status || 'مكتمل'}
                                        </span>
                                    </td>
                                    <td className={`px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-bold text-left
                                        ${txn.type === 'expense' || txn.type === 'refund' ? 'text-red-600' : 'text-green-600'}`}>
                                        {(txn.type === 'expense' || txn.type === 'refund') ? '-' : '+'}{formatCurrency(txn.amount)}
                                    </td>
                                </tr>
                            ))}
                            {(!status?.recentTransactions || status.recentTransactions.length === 0) && (
                                <tr>
                                    <td colSpan={5} className="px-4 sm:px-6 py-6 sm:py-8 text-center text-gray-500">
                                        لم يتم العثور على معاملات حديثة.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

            </div>

            {/* Money Transfer Modal */}
            {showTransferModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">نقل الأموال بين طرق الدفع</h2>
                        <form onSubmit={async (e) => {
                            e.preventDefault()
                            if (!transferForm.fromMethod || !transferForm.toMethod || !transferForm.amount) {
                                alert('يرجى ملء جميع الحقول')
                                return
                            }
                            setTransferring(true)
                            try {
                                const response = await fetchWithAuth('/finance/transfer', {
                                    method: 'POST',
                                    body: JSON.stringify(transferForm),
                                })
                                const data = await response.json()
                                if (data.success) {
                                    alert('تم نقل الأموال بنجاح!')
                                    setShowTransferModal(false)
                                    setTransferForm({ fromMethod: '', toMethod: '', amount: '', notes: '' })
                                    fetchSafeStatus()
                                } else {
                                    alert(data.error || 'فشل نقل الأموال')
                                }
                            } catch (error) {
                                console.error('Error transferring money:', error)
                                alert('حدث خطأ أثناء نقل الأموال')
                            } finally {
                                setTransferring(false)
                            }
                        }}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        من طريقة الدفع *
                                    </label>
                                    <select
                                        value={transferForm.fromMethod}
                                        onChange={(e) => setTransferForm({ ...transferForm, fromMethod: e.target.value })}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">اختر طريقة الدفع</option>
                                        {paymentMethods.map((method) => (
                                            <option key={method.code} value={method.code}>
                                                {method.name} ({method.nameEn})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        إلى طريقة الدفع *
                                    </label>
                                    <select
                                        value={transferForm.toMethod}
                                        onChange={(e) => setTransferForm({ ...transferForm, toMethod: e.target.value })}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">اختر طريقة الدفع</option>
                                        {paymentMethods
                                            .filter(m => m.code !== transferForm.fromMethod)
                                            .map((method) => (
                                                <option key={method.code} value={method.code}>
                                                    {method.name} ({method.nameEn})
                                                </option>
                                            ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        المبلغ *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        value={transferForm.amount}
                                        onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        ملاحظات (اختياري)
                                    </label>
                                    <textarea
                                        value={transferForm.notes}
                                        onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="flex justify-end space-x-4 space-x-reverse pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowTransferModal(false)
                                            setTransferForm({ fromMethod: '', toMethod: '', amount: '', notes: '' })
                                        }}
                                        className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                        إلغاء
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={transferring}
                                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {transferring ? 'جارٍ النقل...' : 'نقل الأموال'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    )
}
