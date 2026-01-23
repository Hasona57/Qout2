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
    // Common
    'welcome': 'مرحباً',
    'loading': 'جاري التحميل...',
    'save': 'حفظ',
    'cancel': 'إلغاء',
    'delete': 'حذف',
    'edit': 'تعديل',
    'add': 'إضافة',
    'search': 'بحث',
    'filter': 'تصفية',
    'actions': 'إجراءات',
    'status': 'الحالة',
    'date': 'التاريخ',
    'total': 'الإجمالي',
    'quantity': 'الكمية',
    'price': 'السعر',
    'name': 'الاسم',
    'email': 'البريد الإلكتروني',
    'phone': 'الهاتف',
    'address': 'العنوان',
    'notes': 'ملاحظات',
    'submit': 'إرسال',
    'back': 'رجوع',
    'next': 'التالي',
    'previous': 'السابق',
    'close': 'إغلاق',
    'confirm': 'تأكيد',
    'yes': 'نعم',
    'no': 'لا',
    'success': 'نجح',
    'error': 'خطأ',
    'warning': 'تحذير',
    'info': 'معلومات',
    
    // Navigation
    'dashboard': 'لوحة التحكم',
    'products': 'المنتجات',
    'orders': 'الطلبات',
    'sales': 'المبيعات',
    'inventory': 'المخزون',
    'users': 'المستخدمون',
    'finance': 'المالية',
    'reports': 'التقارير',
    'settings': 'الإعدادات',
    
    // Products
    'product': 'منتج',
    'newProduct': 'منتج جديد',
    'editProduct': 'تعديل المنتج',
    'productName': 'اسم المنتج',
    'description': 'الوصف',
    'category': 'الفئة',
    'sku': 'رمز المنتج',
    'costPrice': 'سعر التكلفة',
    'retailPrice': 'سعر البيع',
    'images': 'الصور',
    'variants': 'المتغيرات',
    'addVariant': 'إضافة متغير',
    'size': 'المقاس',
    'color': 'اللون',
    'stock': 'المخزون',
    'active': 'نشط',
    'inactive': 'غير نشط',
    
    // Orders
    'order': 'طلب',
    'orders': 'الطلبات',
    'orderNumber': 'رقم الطلب',
    'customer': 'العميل',
    'orderDate': 'تاريخ الطلب',
    'orderStatus': 'حالة الطلب',
    'paymentStatus': 'حالة الدفع',
    'orderTotal': 'إجمالي الطلب',
    'orderDetails': 'تفاصيل الطلب',
    'return': 'إرجاع',
    'createReturn': 'إنشاء إرجاع',
    'returnReason': 'سبب الإرجاع',
    'refundMethod': 'طريقة الاسترداد',
    'refundShipping': 'استرداد رسوم الشحن',
    
    // Sales
    'invoice': 'فاتورة',
    'invoices': 'الفواتير',
    'invoiceNumber': 'رقم الفاتورة',
    'createInvoice': 'إنشاء فاتورة',
    'invoiceTotal': 'إجمالي الفاتورة',
    'payment': 'دفع',
    'payments': 'المدفوعات',
    'paymentMethod': 'طريقة الدفع',
    'amount': 'المبلغ',
    
    // Users
    'user': 'مستخدم',
    'users': 'المستخدمون',
    'newUser': 'مستخدم جديد',
    'editUser': 'تعديل المستخدم',
    'role': 'الدور',
    'jobTitle': 'المسمى الوظيفي',
    'employeeCode': 'رمز الموظف',
    'details': 'التفاصيل',
    'userDetails': 'تفاصيل المستخدم',
    'totalOrders': 'إجمالي الطلبات',
    'totalInvoices': 'إجمالي الفواتير',
    'totalPiecesSold': 'إجمالي القطع المباعة',
    'totalSales': 'إجمالي المبيعات',
    'totalProfit': 'إجمالي الربح',
    
    // Finance
    'safe': 'الخزينة',
    'expenses': 'المصروفات',
    'income': 'الدخل',
    'balance': 'الرصيد',
    'cash': 'نقد',
    'cashPOS': 'نقد نقاط البيع',
    'cashOnDelivery': 'الدفع عند الاستلام',
    'vodafoneCash': 'فودافون كاش',
    'instapay': 'انستا باي',
    'fawry': 'فوري',
    
    // Inventory
    'location': 'الموقع',
    'locations': 'المواقع',
    'currentStock': 'المخزون الحالي',
    'reservedStock': 'المخزون المحجوز',
    'availableStock': 'المخزون المتاح',
    'transfer': 'نقل',
    'adjustment': 'تعديل',
    
    // Reports
    'report': 'تقرير',
    'reports': 'التقارير',
    'salesReport': 'تقرير المبيعات',
    'profitReport': 'تقرير الأرباح',
    'period': 'الفترة',
    'from': 'من',
    'to': 'إلى',
    'generate': 'إنشاء',
  },
  en: {
    // Common
    'welcome': 'Welcome',
    'loading': 'Loading...',
    'save': 'Save',
    'cancel': 'Cancel',
    'delete': 'Delete',
    'edit': 'Edit',
    'add': 'Add',
    'search': 'Search',
    'filter': 'Filter',
    'actions': 'Actions',
    'status': 'Status',
    'date': 'Date',
    'total': 'Total',
    'quantity': 'Quantity',
    'price': 'Price',
    'name': 'Name',
    'email': 'Email',
    'phone': 'Phone',
    'address': 'Address',
    'notes': 'Notes',
    'submit': 'Submit',
    'back': 'Back',
    'next': 'Next',
    'previous': 'Previous',
    'close': 'Close',
    'confirm': 'Confirm',
    'yes': 'Yes',
    'no': 'No',
    'success': 'Success',
    'error': 'Error',
    'warning': 'Warning',
    'info': 'Info',
    
    // Navigation
    'dashboard': 'Dashboard',
    'products': 'Products',
    'orders': 'Orders',
    'sales': 'Sales',
    'inventory': 'Inventory',
    'users': 'Users',
    'finance': 'Finance',
    'reports': 'Reports',
    'settings': 'Settings',
    
    // Products
    'product': 'Product',
    'newProduct': 'New Product',
    'editProduct': 'Edit Product',
    'productName': 'Product Name',
    'description': 'Description',
    'category': 'Category',
    'sku': 'SKU',
    'costPrice': 'Cost Price',
    'retailPrice': 'Retail Price',
    'images': 'Images',
    'variants': 'Variants',
    'addVariant': 'Add Variant',
    'size': 'Size',
    'color': 'Color',
    'stock': 'Stock',
    'active': 'Active',
    'inactive': 'Inactive',
    
    // Orders
    'order': 'Order',
    'orders': 'Orders',
    'orderNumber': 'Order Number',
    'customer': 'Customer',
    'orderDate': 'Order Date',
    'orderStatus': 'Order Status',
    'paymentStatus': 'Payment Status',
    'orderTotal': 'Order Total',
    'orderDetails': 'Order Details',
    'return': 'Return',
    'createReturn': 'Create Return',
    'returnReason': 'Return Reason',
    'refundMethod': 'Refund Method',
    'refundShipping': 'Refund Shipping',
    
    // Sales
    'invoice': 'Invoice',
    'invoices': 'Invoices',
    'invoiceNumber': 'Invoice Number',
    'createInvoice': 'Create Invoice',
    'invoiceTotal': 'Invoice Total',
    'payment': 'Payment',
    'payments': 'Payments',
    'paymentMethod': 'Payment Method',
    'amount': 'Amount',
    
    // Users
    'user': 'User',
    'users': 'Users',
    'newUser': 'New User',
    'editUser': 'Edit User',
    'role': 'Role',
    'jobTitle': 'Job Title',
    'employeeCode': 'Employee Code',
    'details': 'Details',
    'userDetails': 'User Details',
    'totalOrders': 'Total Orders',
    'totalInvoices': 'Total Invoices',
    'totalPiecesSold': 'Total Pieces Sold',
    'totalSales': 'Total Sales',
    'totalProfit': 'Total Profit',
    
    // Finance
    'safe': 'Safe',
    'expenses': 'Expenses',
    'income': 'Income',
    'balance': 'Balance',
    'cash': 'Cash',
    'cashPOS': 'Cash POS',
    'cashOnDelivery': 'Cash on Delivery',
    'vodafoneCash': 'Vodafone Cash',
    'instapay': 'Instapay',
    'fawry': 'Fawry',
    
    // Inventory
    'location': 'Location',
    'locations': 'Locations',
    'currentStock': 'Current Stock',
    'reservedStock': 'Reserved Stock',
    'availableStock': 'Available Stock',
    'transfer': 'Transfer',
    'adjustment': 'Adjustment',
    
    // Reports
    'report': 'Report',
    'reports': 'Reports',
    'salesReport': 'Sales Report',
    'profitReport': 'Profit Report',
    'period': 'Period',
    'from': 'From',
    'to': 'To',
    'generate': 'Generate',
    'logout': 'Logout',
    'assignStock': 'Assign Stock',
    'factoryCalculator': 'Factory Calculator',
    'financeExpenses': 'Finance & Expenses',
    'treasurySafe': 'Treasury (Safe)',
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ar')

  useEffect(() => {
    // Load language from localStorage
    const saved = localStorage.getItem('admin-language')
    if (saved === 'en' || saved === 'ar') {
      setLanguageState(saved)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('admin-language', lang)
    // Update HTML dir attribute
    if (typeof document !== 'undefined') {
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
      document.documentElement.lang = lang
    }
  }

  useEffect(() => {
    // Set initial dir and lang
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

