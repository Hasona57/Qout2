import './globals.css'
import { Cairo } from 'next/font/google'
import { CartProvider } from '../contexts/CartContext'
import { NotificationProvider, NotificationContainer } from '../components/Notifications'
import { LanguageProvider } from '../contexts/LanguageContext'
import Chatbot from '../components/Chatbot'

const cairo = Cairo({ subsets: ['arabic', 'latin'] })

export const metadata = {
  title: 'قُوت - Qout | متجر العبايات',
  description: 'Shop for beautiful abayas',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning={true}>
      <body className={`${cairo.className} bg-platinum-50 text-slate-800 antialiased`} suppressHydrationWarning={true}>
        <LanguageProvider>
          <NotificationProvider>
            <CartProvider>
              {children}
              <Chatbot />
            </CartProvider>
            <NotificationContainer />
          </NotificationProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}

