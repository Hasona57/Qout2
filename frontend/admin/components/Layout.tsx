'use client'

import Sidebar from './Sidebar'
import { getUser } from '../lib/auth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const currentUser = getUser()
    if (!currentUser) {
      router.push('/login')
    } else {
      // Check if user has admin role - SECURITY CHECK
      if (currentUser.role?.name !== 'admin') {
        console.error('Access denied: User does not have admin role', currentUser.role?.name)
        // Clear user data and redirect
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/login?error=access_denied')
      } else {
        setUser(currentUser)
        setLoading(false)
      }
    }
  }, [router])

  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-cafe"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar ثابتة على سطح المكتب، وقابلة للفتح/الإغلاق على الموبايل */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* المحتوى الرئيسي بدون هامش جانبي زائد، مع منع التمرير الأفقي */}
      <div className="flex-1 transition-all duration-300 ease-in-out w-full overflow-x-hidden">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Mobile Hamburger */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                aria-label="فتح القائمة"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <h2 className="text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 truncate">
                مرحباً، {user.name}
              </h2>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <span className="px-2 sm:px-3 py-1 bg-brand-cafe/10 text-brand-cafe rounded-full text-xs sm:text-sm font-medium border border-brand-cafe/20 truncate">
                {user.role?.name}
              </span>
            </div>
          </div>
        </header>

        <main className="p-3 sm:p-4 lg:p-6 xl:p-8 max-w-[1600px] mx-auto min-h-[calc(100vh-80px)]">
          {children}
        </main>
      </div>
    </div>
  )
}


