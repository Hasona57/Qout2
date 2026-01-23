'use client'

import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { fetchWithAuth } from '../../lib/auth'
import { useNotification } from '../../contexts/NotificationContext'

export default function FinancePage() {
    const { showNotification } = useNotification()
    const [activeTab, setActiveTab] = useState<'expenses' | 'payroll'>('expenses')
    const [expenses, setExpenses] = useState<any[]>([])
    const [payroll, setPayroll] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    // Expense Form State
    const [showAddExpense, setShowAddExpense] = useState(false)
    const [newExpense, setNewExpense] = useState({
        title: '',
        amount: '',
        type: 'other',
        description: '',
        date: new Date().toISOString().split('T')[0],
        isRecurring: false,
    })

    // Notification for 1st of month
    const [showNotificationBanner, setShowNotificationBanner] = useState(false)

    useEffect(() => {
        checkMonthNotification()
        loadData()
    }, [])

    const checkMonthNotification = () => {
        const today = new Date()
        if (today.getDate() === 1) {
            setShowNotificationBanner(true)
            // Optional: Also show a toast
            showNotification('Reminder: It\'s the 1st of the month. Please log recurring expenses.', 'info')
        }
    }

    const loadData = async () => {
        try {
            setLoading(true)
            const [expensesRes, payrollRes] = await Promise.all([
                fetchWithAuth('/finance/expenses'),
                fetchWithAuth('/finance/payroll'),
            ])

            const expensesData = await expensesRes.json()
            const expensesList = expensesData.data || expensesData
            setExpenses(Array.isArray(expensesList) ? expensesList : [])

            const payrollData = await payrollRes.json()
            setPayroll(payrollData.data || payrollData || null)

        } catch (error) {
            console.error('Error loading finance data:', error)
            showNotification('Failed to load finance data', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateExpense = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await fetchWithAuth('/finance/expenses', {
                method: 'POST',
                body: JSON.stringify({
                    ...newExpense,
                    amount: parseFloat(newExpense.amount),
                }),
            })
            setShowAddExpense(false)
            setNewExpense({
                title: '',
                amount: '',
                type: 'other',
                description: '',
                date: new Date().toISOString().split('T')[0],
                isRecurring: false,
            })
            loadData()
            showNotification('Expense added successfully', 'success')
        } catch (error) {
            showNotification('Failed to add expense', 'error')
        }
    }

    const handleDeleteExpense = async (id: string) => {
        if (!confirm('Are you sure?')) return
        try {
            await fetchWithAuth(`/finance/expenses/${id}`, {
                method: 'DELETE',
            })
            loadData()
            showNotification('Expense deleted', 'success')
        } catch (error) {
            showNotification('Failed to delete expense', 'error')
        }
    }

    return (
        <Layout>
            <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Finance & Expenses</h1>
                    <button
                        onClick={() => setShowAddExpense(true)}
                        className="px-6 py-2 bg-brand-cafe text-white rounded-lg hover:bg-brand-cafe-dark transition font-medium shadow-md"
                    >
                        + Add Expense
                    </button>
                </div>

                {showNotificationBanner && (
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg shadow-sm">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <span className="text-blue-500 text-xl">ℹ️</span>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-blue-700 font-medium">
                                    It's the 1st of the month! Please remember to log recurring expenses (Rent, Electricity, etc.).
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex space-x-4 mb-6 border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('expenses')}
                        className={`pb-3 px-4 font-medium transition-all ${activeTab === 'expenses'
                            ? 'text-brand-cafe border-b-2 border-brand-cafe'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Expenses Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('payroll')}
                        className={`pb-3 px-4 font-medium transition-all ${activeTab === 'payroll'
                            ? 'text-brand-cafe border-b-2 border-brand-cafe'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Payroll
                    </button>
                </div>

                {/* Add Expense Modal/Form Area */}
                {showAddExpense && (
                    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 mb-8 animate-fade-in-down">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">New Expense</h3>
                        <form onSubmit={handleCreateExpense} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                                <input
                                    type="text"
                                    required
                                    value={newExpense.title}
                                    onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                                    placeholder="e.g. Office Rent"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-brand-cafe focus:border-brand-cafe"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Amount (EGP)</label>
                                <input
                                    type="number"
                                    required
                                    value={newExpense.amount}
                                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-brand-cafe focus:border-brand-cafe"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                                <select
                                    value={newExpense.type}
                                    onChange={(e) => setNewExpense({ ...newExpense, type: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-brand-cafe focus:border-brand-cafe"
                                >
                                    <option value="rent">Rent</option>
                                    <option value="electricity">Electricity</option>
                                    <option value="water">Water</option>
                                    <option value="salary">Salary Payment</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                                <input
                                    type="date"
                                    required
                                    value={newExpense.date}
                                    onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-brand-cafe focus:border-brand-cafe"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                <input
                                    type="text"
                                    value={newExpense.description}
                                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-brand-cafe focus:border-brand-cafe"
                                />
                            </div>
                            <div className="flex items-center pt-6">
                                <input
                                    type="checkbox"
                                    id="recurring"
                                    checked={newExpense.isRecurring}
                                    onChange={(e) => setNewExpense({ ...newExpense, isRecurring: e.target.checked })}
                                    className="w-5 h-5 text-brand-cafe rounded focus:ring-brand-cafe"
                                />
                                <label htmlFor="recurring" className="ml-2 text-sm font-medium text-gray-700">Recurring Monthly</label>
                            </div>
                            <div className="md:col-span-3 flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAddExpense(false)}
                                    className="px-6 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-brand-cafe text-white rounded-lg hover:bg-brand-cafe-dark transition shadow"
                                >
                                    Save Expense
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Content Tabs */}
                {loading ? (
                    <div className="text-center py-12">Loading...</div>
                ) : (
                    <>
                        {activeTab === 'expenses' && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recurring</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {Array.isArray(expenses) && expenses.map((expense) => (
                                            <tr key={expense.id} className="hover:bg-gray-50 transition">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(expense.date).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {expense.title}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold
                            ${expense.type === 'rent' ? 'bg-purple-100 text-purple-800' :
                                                            expense.type === 'salary' ? 'bg-green-100 text-green-800' :
                                                                'bg-gray-100 text-gray-800'}`}>
                                                        {expense.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {expense.description || '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                                    {Number(expense.amount).toFixed(2)} EGP
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {expense.isRecurring ? '✅' : '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                    <button
                                                        onClick={() => handleDeleteExpense(expense.id)}
                                                        className="text-red-500 hover:text-red-700 transition"
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {expenses.length === 0 && (
                                    <div className="text-center py-12 text-gray-400">No expenses recorded.</div>
                                )}
                            </div>
                        )}

                        {activeTab === 'payroll' && payroll && (
                            <div className="space-y-6">
                                {/* Payroll Summary Card */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                                        <h3 className="text-blue-100 text-sm font-medium mb-1">Total Monthly Payroll</h3>
                                        <div className="text-3xl font-bold">{payroll.totalMonthly?.toFixed(2) || '0.00'} EGP</div>
                                        <div className="mt-4 text-sm text-blue-100">{payroll.count} Salaried Employees</div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job Title</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monthly Salary</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employment Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {payroll.users && payroll.users.map((user: any) => (
                                                <tr key={user.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {user.name}
                                                        <div className="text-xs text-gray-500">{user.email}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.jobTitle || '-'}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{user.role?.name}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{Number(user.salary).toFixed(2)} EGP</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {user.employmentDate ? new Date(user.employmentDate).toLocaleDateString() : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </Layout>
    )
}
