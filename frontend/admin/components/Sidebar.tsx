'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '../lib/auth'
import { useRouter } from 'next/navigation'

const menuItems = [
  { name: 'لوحة التحكم', href: '/', icon: '📊' },
  { name: 'المنتجات', href: '/products', icon: '👕' },
  { name: 'المخزون', href: '/inventory', icon: '📦' },
  { name: 'تعيين المخزون', href: '/inventory/assign-stock', icon: '➕' },
  { name: 'حاسبة المصنع', href: '/factory-calculator', icon: '🧮' },
  { name: 'المبيعات', href: '/sales', icon: '💰' },
  { name: 'الطلبات', href: '/orders', icon: '📋' },
  { name: 'التقارير', href: '/reports', icon: '📈' },
  { name: 'المالية والمصروفات', href: '/finance', icon: '💵' },
  { name: 'الخزينة (الخزنة)', href: '/finance/safe', icon: '🏦' },
  { name: 'المستخدمون', href: '/users', icon: '👥' },
]

export default function Sidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar Content */}
      <div className={`
        fixed top-0 right-0 bottom-0 w-64 bg-gray-900 text-white z-50 transform transition-transform duration-300 ease-in-out shadow-2xl
        ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        lg:static lg:z-auto
      `}>
        <div className="p-4 sm:p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900/50 backdrop-blur-md">
          <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-brand-brown to-brand-cafe bg-clip-text text-transparent">
            لوحة تحكم قوت
          </h1>
          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="lg:hidden text-gray-400 hover:text-white transition p-1"
            aria-label="إغلاق القائمة"
          >
            ✕
          </button>
        </div>

        <nav className="p-3 sm:p-4 pb-20 sm:pb-24 overflow-y-auto h-[calc(100vh-80px)] scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  onClick={() => onClose && window.innerWidth < 1024 && onClose()}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${pathname === item.href
                    ? 'bg-gradient-to-r from-brand-brown to-brand-cafe text-white shadow-lg -translate-x-1'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white hover:-translate-x-1'
                    }`}
                >
                  <span className="text-lg sm:text-xl flex-shrink-0 group-hover:scale-110 transition-transform">{item.icon}</span>
                  <span className="truncate font-medium text-sm sm:text-base">{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="absolute bottom-0 right-0 left-0 p-3 sm:p-4 border-t border-gray-800 bg-gray-900">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-all duration-200 text-sm sm:text-base"
          >
            <span>🚪</span>
            <span className="font-medium">تسجيل الخروج</span>
          </button>
        </div>
      </div>
    </>
  )
}

