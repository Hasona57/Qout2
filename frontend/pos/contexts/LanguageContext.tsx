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
    'pos': 'نقاط البيع',
    'search': 'بحث',
    'addToCart': 'أضف للسلة',
    'cart': 'السلة',
    'total': 'الإجمالي',
    'checkout': 'الدفع',
    'paymentMethod': 'طريقة الدفع',
    'cash': 'نقد',
    'vodafoneCash': 'فودافون كاش',
    'instapay': 'انستا باي',
    'fawry': 'فوري',
    'customer': 'العميل',
    'walkIn': 'عميل عابر',
    'selectCustomer': 'اختر عميل',
    'quantity': 'الكمية',
    'price': 'السعر',
    'remove': 'حذف',
    'clear': 'مسح',
    'invoice': 'فاتورة',
    'invoiceNumber': 'رقم الفاتورة',
    'date': 'التاريخ',
    'items': 'العناصر',
    'subtotal': 'المجموع الفرعي',
    'discount': 'الخصم',
    'total': 'الإجمالي',
    'print': 'طباعة',
    'newSale': 'بيع جديد',
    'loading': 'جاري التحميل...',
    'error': 'حدث خطأ',
    'success': 'نجح',
    'location': 'الموقع',
    'logout': 'تسجيل الخروج',
  },
  en: {
    'pos': 'Point of Sale',
    'search': 'Search',
    'addToCart': 'Add to Cart',
    'cart': 'Cart',
    'total': 'Total',
    'checkout': 'Checkout',
    'paymentMethod': 'Payment Method',
    'cash': 'Cash',
    'vodafoneCash': 'Vodafone Cash',
    'instapay': 'Instapay',
    'fawry': 'Fawry',
    'customer': 'Customer',
    'walkIn': 'Walk-in Customer',
    'selectCustomer': 'Select Customer',
    'quantity': 'Quantity',
    'price': 'Price',
    'remove': 'Remove',
    'clear': 'Clear',
    'invoice': 'Invoice',
    'invoiceNumber': 'Invoice Number',
    'date': 'Date',
    'items': 'Items',
    'subtotal': 'Subtotal',
    'discount': 'Discount',
    'total': 'Total',
    'print': 'Print',
    'newSale': 'New Sale',
    'loading': 'Loading...',
    'error': 'An error occurred',
    'success': 'Success',
    'location': 'Location',
    'logout': 'Logout',
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ar')

  useEffect(() => {
    const saved = localStorage.getItem('pos-language')
    if (saved === 'en' || saved === 'ar') {
      setLanguageState(saved)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('pos-language', lang)
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

