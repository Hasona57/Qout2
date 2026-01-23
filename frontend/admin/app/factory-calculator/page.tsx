'use client'

import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'

export default function FactoryCalculatorPage() {
    const [meters, setMeters] = useState<number | ''>('')
    const [costPerMeter, setCostPerMeter] = useState<number | ''>('')
    const [pieces, setPieces] = useState<number | ''>('')

    const [totalCost, setTotalCost] = useState<number>(0)
    const [unitCost, setUnitCost] = useState<number>(0)

    useEffect(() => {
        const m = Number(meters) || 0
        const c = Number(costPerMeter) || 0
        const p = Number(pieces) || 0

        const total = m * c
        setTotalCost(total)

        if (p > 0) {
            setUnitCost(total / p)
        } else {
            setUnitCost(0)
        }
    }, [meters, costPerMeter, pieces])

    return (
        <Layout>
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">
                        حاسبة المصنع 🏭
                    </h1>
                    <p className="text-gray-500 mt-2">
                        حساب تكلفة القطعة الواحدة بناءً على استهلاك القماش وعدد القطع المنتجة.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* بطاقة الإدخال */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <span>📝</span> بيانات الإدخال
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">
                                    إجمالي القماش المستخدم (بالمتر)
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={meters}
                                        onChange={(e) => setMeters(e.target.value === '' ? '' : Number(e.target.value))}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-cafe focus:border-transparent transition"
                                        placeholder="مثال: 50"
                                        min="0"
                                    />
                                    <span className="absolute right-4 top-3 text-gray-400">متر</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">
                                    تكلفة المتر الواحد
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-3 text-gray-400">جنيه</span>
                                    <input
                                        type="number"
                                        value={costPerMeter}
                                        onChange={(e) => setCostPerMeter(e.target.value === '' ? '' : Number(e.target.value))}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-cafe focus:border-transparent transition"
                                        placeholder="مثال: 150"
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">
                                    إجمالي عدد القطع المنتجة
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={pieces}
                                        onChange={(e) => setPieces(e.target.value === '' ? '' : Number(e.target.value))}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-cafe focus:border-transparent transition"
                                        placeholder="مثال: 10"
                                        min="1"
                                    />
                                    <span className="absolute right-4 top-3 text-gray-400">قطعة</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* بطاقة النتائج */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-center">
                        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <span>🔎</span> النتائج
                        </h2>

                        <div className="space-y-8">
                            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                                <span className="block text-sm text-gray-500 mb-1">إجمالي تكلفة القماش</span>
                                <div className="text-3xl font-bold text-gray-800 tracking-tight">
                                    {totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    <span className="text-lg text-gray-400 ml-2 font-normal">جنيه</span>
                                </div>
                            </div>

                            <div className="bg-gradient-to-r from-brand-brown/5 to-brand-cafe/5 rounded-xl p-6 border border-brand-brown/10 relative overflow-hidden">
                                <span className="block text-sm text-brand-cafe mb-1 relative z-10 font-bold">تكلفة القطعة الواحدة</span>
                                <div className="text-5xl font-bold text-brand-brown tracking-tight relative z-10">
                                    {unitCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    <span className="text-2xl text-gray-400 ml-2 font-normal">جنيه</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 text-sm text-gray-400 text-center">
                            المعادلة: (المتر × تكلفة المتر) ÷ عدد القطع
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    )
}
