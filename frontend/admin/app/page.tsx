'use client'

import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { fetchWithAuth } from '../lib/auth'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    sales: 0,
    lowStock: 0,
    recentActivity: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const res = await fetchWithAuth('/dashboard/stats')
      const data = await res.json()

      if (data.success || data) {
        // Handle wrapped response or direct response
        const stats = data.data || data;
        setStats({
          products: stats.products || 0,
          orders: stats.orders || 0,
          sales: stats.sales || 0,
          lowStock: stats.lowStock || 0,
          recentActivity: stats.recentActivity || []
        })
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="space-y-8 animate-fade-in pb-10">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-brand-brown-dark via-brand-brown to-brand-gold-dark text-white rounded-2xl sm:rounded-3xl p-6 sm:p-10 shadow-medium relative overflow-hidden group">
          <div className="relative z-10">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3 tracking-tight">مرحباً بعودتك، المدير 👋</h1>
            <p className="text-brand-cream/90 text-base sm:text-lg lg:text-xl font-light">إليك نظرة سريعة على أداء متجرك.</p>
          </div>
          {/* Decorative Elements */}
          <div className="absolute right-0 top-0 h-full w-1/2 bg-white/5 skew-x-12 transform origin-bottom-right transition-transform group-hover:scale-110 duration-700" />
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-brand-gold/20 rounded-full blur-3xl animate-pulse-slow"></div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-brown border-t-transparent"></div>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <StatCard
                title="إجمالي المنتجات"
                value={stats.products}
                icon="👕"
                color="text-blue-500 bg-blue-50 ring-1 ring-blue-100"
              />
              <StatCard
                title="إجمالي الطلبات"
                value={stats.orders}
                icon="📋"
                color="text-green-500 bg-green-50 ring-1 ring-green-100"
              />
              <StatCard
                title="إجمالي المبيعات"
                value={`${stats.sales} جنيه`}
                icon="💰"
                color="text-brand-gold-dark bg-brand-gold/10 ring-1 ring-brand-gold/20"
                highlight
              />
              <StatCard
                title="مخزون منخفض"
                value={stats.lowStock}
                icon="⚠️"
                color="text-red-500 bg-red-50 ring-1 ring-red-100"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {/* Quick Actions */}
              <div className="lg:col-span-2 glass rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-sm">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                  <span className="text-xl sm:text-2xl">⚡</span> إجراءات سريعة
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                  <QuickAction href="/products/new" icon="➕" label="إضافة منتج" color="bg-gradient-to-br from-blue-600 to-blue-700" />
                  <QuickAction href="/inventory/assign-stock" icon="📦" label="تعيين مخزون" color="bg-gradient-to-br from-brand-brown to-brand-brown-dark" />
                  <QuickAction href="/calculator" icon="🧮" label="حاسبة" color="bg-gradient-to-br from-brand-cafe to-brand-brown-light" />
                  <QuickAction href="/orders" icon="📋" label="عرض الطلبات" color="bg-gradient-to-br from-green-600 to-green-700" />
                </div>
              </div>

              {/* Recent Activity */}
              <div className="glass rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-sm h-full">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                  <span className="text-xl sm:text-2xl">🕒</span> النشاط الأخير
                </h2>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {/* @ts-ignore */}
                  {stats.recentActivity && stats.recentActivity.length > 0 ? (
                    // @ts-ignore
                    stats.recentActivity.map((activity: any, idx) => (
                      <div key={activity.id} className="flex items-center gap-4 p-3 hover:bg-white/50 rounded-xl transition-all border border-transparent hover:border-gray-100" style={{ animationDelay: `${idx * 100}ms` }}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-sm
                          ${activity.type === 'income' ? 'bg-green-100 text-green-600' :
                            activity.type === 'expense' ? 'bg-red-100 text-red-600' :
                              'bg-orange-100 text-orange-600'}`}>
                          {activity.type === 'income' ? '💰' : activity.type === 'expense' ? '💸' : '↩️'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-slate-700 truncate">{activity.title}</h4>
                          <p className="text-xs text-slate-400">{new Date(activity.date).toLocaleDateString()}</p>
                        </div>
                        <div className={`font-bold whitespace-nowrap ${activity.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                          {activity.type === 'income' ? '+' : '-'}{activity.amount}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 py-10">
                      <span className="text-4xl mb-2 opacity-50">📭</span>
                      <p>لا يوجد نشاط حديث</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}

function StatCard({ title, value, icon, color, highlight = false }: { title: string, value: string | number, icon: string, color: string, highlight?: boolean }) {
  return (
    <div className={`glass rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-medium border border-white/40 ${highlight ? 'ring-2 ring-brand-gold/30 bg-brand-gold/5' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${color}`}>
          {icon}
        </div>
        {highlight && <span className="flex h-3 w-3 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-gold opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-gold"></span>
        </span>}
      </div>
      <h3 className="text-slate-500 text-sm font-medium mb-1 tracking-wide uppercase">{title}</h3>
      <p className="text-3xl font-bold text-slate-800 tracking-tight">{value}</p>
    </div>
  )
}

function QuickAction({ href, icon, label, color }: { href: string, icon: string, label: string, color: string }) {
  return (
    <a href={href} className={`${color} text-white p-6 rounded-2xl flex flex-col items-center justify-center gap-3 hover:opacity-95 transition-all shadow-sm hover:shadow-glow hover:-translate-y-1 transform duration-300 group`}>
      <span className="text-3xl group-hover:scale-110 transition-transform">{icon}</span>
      <span className="font-medium text-sm tracking-wide">{label}</span>
    </a>
  )
}

