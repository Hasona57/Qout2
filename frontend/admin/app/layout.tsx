import './globals.css'
import { Outfit } from 'next/font/google'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

const outfit = Outfit({ subsets: ['latin'] })

export const metadata = {
  title: 'قُوت - Qout Admin Panel',
  description: 'Admin panel for Qout Abaya',
}

import { NotificationProvider } from '../contexts/NotificationContext'
import { LanguageProvider } from '../contexts/LanguageContext'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning={true}>
      <body className={`${outfit.className} bg-platinum-50 text-slate-800`} suppressHydrationWarning={true}>
        <LanguageProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
