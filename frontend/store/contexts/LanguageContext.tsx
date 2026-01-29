'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Language = 'ar' | 'en'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const translations: Record<Language, Record<string, string>> = {
  ar: {
    'home': 'الرئيسية',
    'cart': 'السلة',
    'wishlist': 'المفضلة',
    'account': 'حسابي',
    'login': 'تسجيل الدخول',
    'logout': 'تسجيل الخروج',
    'search': 'بحث',
    'addToCart': 'أضف للسلة',
    'addToWishlist': 'أضف للمفضلة',
    'removeFromWishlist': 'احذف من المفضلة',
    'price': 'السعر',
    'size': 'المقاس',
    'color': 'اللون',
    'quantity': 'الكمية',
    'total': 'الإجمالي',
    'checkout': 'الدفع',
    'continueShopping': 'متابعة التسوق',
    'emptyCart': 'السلة فارغة',
    'emptyWishlist': 'قائمة المفضلة فارغة',
    'orderTotal': 'إجمالي الطلب',
    'shipping': 'الشحن',
    'subtotal': 'المجموع الفرعي',
    'placeOrder': 'تأكيد الطلب',
    'orderPlaced': 'تم تأكيد الطلب',
    'orderNumber': 'رقم الطلب',
    'orderDate': 'تاريخ الطلب',
    'orderStatus': 'حالة الطلب',
    'paymentStatus': 'حالة الدفع',
    'myOrders': 'طلباتي',
    'myAccount': 'حسابي',
    'name': 'الاسم',
    'email': 'البريد الإلكتروني',
    'phone': 'الهاتف',
    'address': 'العنوان',
    'city': 'المدينة',
    'governorate': 'المحافظة',
    'save': 'حفظ',
    'loading': 'جاري التحميل...',
    'error': 'حدث خطأ',
    'success': 'نجح',
  },
  en: {
    'home': 'Home',
    'cart': 'Cart',
    'wishlist': 'Wishlist',
    'account': 'My Account',
    'login': 'Login',
    'logout': 'Logout',
    'search': 'Search',
    'addToCart': 'Add to Cart',
    'addToWishlist': 'Add to Wishlist',
    'removeFromWishlist': 'Remove from Wishlist',
    'price': 'Price',
    'size': 'Size',
    'color': 'Color',
    'quantity': 'Quantity',
    'total': 'Total',
    'checkout': 'Checkout',
    'continueShopping': 'Continue Shopping',
    'emptyCart': 'Your cart is empty',
    'emptyWishlist': 'Your wishlist is empty',
    'orderTotal': 'Order Total',
    'shipping': 'Shipping',
    'subtotal': 'Subtotal',
    'placeOrder': 'Place Order',
    'orderPlaced': 'Order Placed',
    'orderNumber': 'Order Number',
    'orderDate': 'Order Date',
    'orderStatus': 'Order Status',
    'paymentStatus': 'Payment Status',
    'myOrders': 'My Orders',
    'myAccount': 'My Account',
    'name': 'Name',
    'email': 'Email',
    'phone': 'Phone',
    'address': 'Address',
    'city': 'City',
    'governorate': 'Governorate',
    'save': 'Save',
    'loading': 'Loading...',
    'error': 'An error occurred',
    'success': 'Success',
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ar')

  useEffect(() => {
    const saved = localStorage.getItem('store-language')
    if (saved === 'en' || saved === 'ar') {
      setLanguageState(saved)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('store-language', lang)
    if (typeof document !== 'undefined') {
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
      document.documentElement.lang = lang
    }
  }

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
      document.documentElement.lang = language
    }
  }, [language])

  const t = (key: string): string => {
    return translations[language][key] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}





