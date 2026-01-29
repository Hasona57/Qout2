'use client'

import { useLanguage } from '../contexts/LanguageContext'

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
        className="relative inline-flex h-8 w-16 items-center rounded-full bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-cafe focus:ring-offset-2"
        role="switch"
        aria-checked={language === 'en'}
        aria-label="Toggle language"
      >
        <span
          className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${
            language === 'en' ? 'translate-x-9' : 'translate-x-1'
          }`}
        />
        <span className="absolute left-2 text-xs font-medium text-gray-600">AR</span>
        <span className="absolute right-2 text-xs font-medium text-gray-600">EN</span>
      </button>
      <span className="text-sm font-medium text-gray-700 hidden sm:inline">
        {language === 'ar' ? 'عربي' : 'English'}
      </span>
    </div>
  )
}




