'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastProps {
    id: string
    message: string
    type: ToastType
    onClose: (id: string) => void
}

export default function Toast({ id, message, type, onClose }: ToastProps) {
    const [isExiting, setIsExiting] = useState(false)

    // Auto-dismiss logic handled by parent context, but we handle exit animation here
    useEffect(() => {
        const timer = setTimeout(() => {
            handleClose()
        }, 5000) // 5 seconds display
        return () => clearTimeout(timer)
    }, [])

    const handleClose = () => {
        setIsExiting(true)
        setTimeout(() => {
            onClose(id)
        }, 300) // Match transition duration
    }

    const bgColors = {
        success: 'bg-green-50 border-green-200 text-green-800',
        error: 'bg-red-50 border-red-200 text-red-800',
        info: 'bg-blue-50 border-blue-200 text-blue-800',
        warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    }

    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️',
        warning: '⚠️',
    }

    if (typeof document === 'undefined') return null

    return createPortal(
        <div
            className={`
        fixed top-4 right-4 z-[9999] pointer-events-auto
        flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border
        transform transition-all duration-300 ease-out
        ${bgColors[type]}
        ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
      `}
            role="alert"
        >
            <span className="text-xl">{icons[type]}</span>
            <p className="font-medium text-sm">{message}</p>
            <button
                onClick={handleClose}
                className="ml-4 opacity-50 hover:opacity-100 transition-opacity"
            >
                ✕
            </button>
        </div>,
        document.body
    )
}
