'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useCart } from '../contexts/CartContext'
import { isAuthenticated } from '../lib/auth'
import { useLanguage } from '../contexts/LanguageContext'
import LanguageSwitcher from './LanguageSwitcher'

export default function Header() {
    const { totalItems } = useCart()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [wishlistCount, setWishlistCount] = useState(0)
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
        const updateWishlistCount = () => {
            const saved = localStorage.getItem('wishlist')
            const list = saved ? JSON.parse(saved) : []
            setWishlistCount(list.length)
        }

        updateWishlistCount()
        window.addEventListener('storage', updateWishlistCount)
        // Custom event for wishlist updates if needed within the same tab
        window.addEventListener('wishlist-updated', updateWishlistCount)

        return () => {
            window.removeEventListener('storage', updateWishlistCount)
            window.removeEventListener('wishlist-updated', updateWishlistCount)
        }
    }, [])

    return (
        <>
            <header className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-brand-cafe/20" dir="rtl">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex justify-between items-center">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="w-20 h-20 relative transition-transform hover:scale-105">
                                <img
                                    src="/logo.svg"
                                    alt="قُوت - Qout"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <div className="hidden sm:block">
                                <h1 className="text-2xl font-bold text-brand-brown group-hover:text-brand-brown-dark transition-colors font-serif tracking-wide">
                                    قُوت
                                </h1>
                                <p className="text-[10px] text-brand-cafe font-medium tracking-[0.2em] uppercase">متجر العبايات</p>
                            </div>
                        </Link>

                        {/* Desktop Nav */}
                        <nav className="hidden md:flex items-center gap-8">
                            <Link href="/" className="text-brand-brown font-medium hover:text-brand-gold transition relative group">
                                الرئيسية
                                <span className="absolute -bottom-1 right-0 w-0 h-0.5 bg-brand-gold group-hover:w-full transition-all duration-300"></span>
                            </Link>
                            <Link href="/cart" className="text-brand-brown font-medium hover:text-brand-gold transition relative group">
                                السلة
                                {totalItems > 0 && (
                                    <span className="absolute -top-2 -left-3 bg-brand-brown text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-md">
                                        {totalItems}
                                    </span>
                                )}
                            </Link>
                            {isClient && wishlistCount > 0 && (
                                <Link href="/wishlist" className="text-brand-brown font-medium hover:text-brand-gold transition relative group">
                                    المفضلة
                                    <span className="absolute -top-2 -left-3 bg-brand-cafe text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-md">
                                        {wishlistCount}
                                    </span>
                                </Link>
                            )}
                            {isClient && isAuthenticated() ? (
                                <Link href="/account" className="px-5 py-2 bg-brand-brown text-white rounded-full hover:bg-brand-brown-dark transition shadow-lg shadow-brand-brown/20 text-sm font-medium">
                                    حسابي
                                </Link>
                            ) : (
                                <Link href="/login" className="px-5 py-2 border border-brand-brown text-brand-brown rounded-full hover:bg-brand-brown hover:text-white transition text-sm font-medium">
                                    تسجيل الدخول
                                </Link>
                            )}
                        </nav>

                        {/* Mobile Menu Button */}
                        <div className="flex items-center gap-4 md:hidden">
                            <Link href="/cart" className="relative p-2 text-brand-brown">
                                <span className="text-2xl">🛒</span>
                                {totalItems > 0 && (
                                    <span className="absolute top-0 right-0 bg-brand-brown text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                                        {totalItems}
                                    </span>
                                )}
                            </Link>
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="p-2 text-brand-brown hover:bg-brand-cream/50 rounded-lg transition"
                            >
                                <div className="w-6 h-5 flex flex-col justify-between">
                                    <span className={`w-full h-0.5 bg-current transform transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
                                    <span className={`w-full h-0.5 bg-current transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`} />
                                    <span className={`w-full h-0.5 bg-current transform transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-2.5' : ''}`} />
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            <div
                className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
                onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Mobile Menu Drawer */}
            <div className={`fixed top-0 left-0 h-full w-[80%] max-w-sm bg-white shadow-2xl z-[70] transform transition-transform duration-300 md:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 h-full flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-10 h-10 relative">
                                <img src="/logo.svg" alt="Qout" className="w-full h-full object-contain" />
                            </div>
                            <span className="text-xl font-bold text-brand-brown font-serif">قُوت</span>
                        </Link>
                        <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-gray-400 hover:text-red-500 transition">
                            ✕
                        </button>
                    </div>

                    <nav className="space-y-2 flex-1">
                        <Link
                            href="/"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center gap-4 px-4 py-3 text-brand-brown-dark hover:bg-brand-cream/30 rounded-xl transition font-medium"
                        >
                            <span>🏠</span> الرئيسة
                        </Link>
                        <Link
                            href="/cart"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center gap-4 px-4 py-3 text-brand-brown-dark hover:bg-brand-cream/30 rounded-xl transition font-medium"
                        >
                            <span>🛒</span> السلة
                            {totalItems > 0 && <span className="mr-auto bg-brand-brown text-white text-xs px-2 py-1 rounded-full">{totalItems}</span>}
                        </Link>
                        <Link
                            href="/wishlist"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center gap-4 px-4 py-3 text-brand-brown-dark hover:bg-brand-cream/30 rounded-xl transition font-medium"
                        >
                            <span>❤️</span> المفضلة
                            {isClient && wishlistCount > 0 && <span className="mr-auto bg-brand-cafe text-white text-xs px-2 py-1 rounded-full">{wishlistCount}</span>}
                        </Link>

                        <div className="border-t border-brand-cafe/10 my-4 pt-4">
                            {isClient && isAuthenticated() ? (
                                <Link
                                    href="/account"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="flex items-center gap-4 px-4 py-3 text-brand-brown-dark hover:bg-brand-cream/30 rounded-xl transition font-medium"
                                >
                                    <span>👤</span> حسابي
                                </Link>
                            ) : (
                                <Link
                                    href="/login"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="flex items-center gap-4 px-4 py-3 text-brand-brown-dark hover:bg-brand-cream/30 rounded-xl transition font-medium"
                                >
                                    <span>🔐</span> تسجيل الدخول
                                </Link>
                            )}
                        </div>
                    </nav>

                    <div className="text-center text-xs text-brand-cafe font-medium pt-8 border-t border-brand-cafe/10">
                        <p>© 2026 قُوت - Qout</p>
                    </div>
                </div>
            </div>
        </>
    )
}
