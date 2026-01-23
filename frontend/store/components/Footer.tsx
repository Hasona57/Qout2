'use client'

import Link from 'next/link'

export default function Footer() {
    return (
        <footer className="bg-brand-brown-dark text-white pt-20 pb-10 border-t-4 border-brand-gold" dir="rtl">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    <div className="col-span-1 md:col-span-1">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-16 h-16 relative transition-transform hover:scale-105">
                                <img src="/logo.svg" alt="Qout" className="w-full h-full object-contain" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold font-serif tracking-wide text-brand-cream">قُوت</h3>
                                <p className="text-[10px] text-brand-gold uppercase tracking-[0.2em]">Luxury Abayas</p>
                            </div>
                        </div>
                        <p className="text-white/70 leading-relaxed text-sm">
                            الوجهة الأولى للأناقة العصرية. نقدم لكِ عبايات تمزج بين الفخامة والراحة، مصممة لتناسب ذوقك الرفيع في كل المناسبات.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold text-lg mb-6 text-brand-gold font-serif">روابط سريعة</h4>
                        <ul className="space-y-3 text-white/70 text-sm">
                            <li><Link href="/" className="hover:text-white transition duration-300 flex items-center gap-2"><span className="text-brand-gold">›</span> الرئيسية</Link></li>
                            <li><Link href="/cart" className="hover:text-white transition duration-300 flex items-center gap-2"><span className="text-brand-gold">›</span> سلة المشتريات</Link></li>
                            <li><Link href="/wishlist" className="hover:text-white transition duration-300 flex items-center gap-2"><span className="text-brand-gold">›</span> المفضلة</Link></li>
                            <li><Link href="/account" className="hover:text-white transition duration-300 flex items-center gap-2"><span className="text-brand-gold">›</span> حسابي</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-lg mb-6 text-brand-gold font-serif">خدمة العملاء</h4>
                        <ul className="space-y-3 text-white/70 text-sm">
                            <li><Link href="#" className="hover:text-white transition duration-300 flex items-center gap-2"><span className="text-brand-gold">›</span> سياسة الاسترجاع</Link></li>
                            <li><Link href="#" className="hover:text-white transition duration-300 flex items-center gap-2"><span className="text-brand-gold">›</span> الشحن والتوصيل</Link></li>
                            <li><Link href="#" className="hover:text-white transition duration-300 flex items-center gap-2"><span className="text-brand-gold">›</span> الأسئلة الشائعة</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-lg mb-6 text-brand-gold font-serif">تواصلي معنا</h4>
                        <div className="space-y-4 text-white/70 text-sm">
                            <p className="flex items-center gap-3 bg-white/5 p-3 rounded-lg">
                                <span className="text-brand-gold text-lg">📧</span> info@qout.sa
                            </p>
                            <a href="tel:+201023969596" className="flex items-center gap-3 bg-white/5 p-3 rounded-lg hover:bg-white/10 transition">
                                <span className="text-brand-gold text-lg">📱</span> <span dir="ltr">+20 10 23969596</span>
                            </a>
                            <div className="flex gap-4 mt-6">
                                <a
                                    href="https://instagram.com/qout_abayat"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-gold hover:text-brand-brown-dark transition cursor-pointer text-xl"
                                    title="Instagram"
                                >
                                    📷
                                </a>
                                <a
                                    href="https://tiktok.com/@qout.store?_t=ZS-90qMrUnIX6T&_r=1"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-gold hover:text-brand-brown-dark transition cursor-pointer text-xl"
                                    title="TikTok"
                                >
                                    🎵
                                </a>
                                <a
                                    href="https://t.me/+SJuA_7_yybznkjA8"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-gold hover:text-brand-brown-dark transition cursor-pointer text-xl"
                                    title="Telegram"
                                >
                                    ✈️
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="border-t border-white/10 pt-8 text-center">
                    <p className="text-white/40 text-sm">© {new Date().getFullYear()} قُوت - Qout. جميع الحقوق محفوظة.</p>
                </div>
            </div>
        </footer>
    )
}
