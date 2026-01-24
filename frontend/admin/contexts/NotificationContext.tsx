'use client'

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react'
import Toast, { ToastType } from '../components/Toast'

interface Notification {
    id: string
    message: string
    type: ToastType
}

interface NotificationContextType {
    showNotification: (message: string, type: ToastType) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([])

    const showNotification = useCallback((message: string, type: ToastType) => {
        const id = Math.random().toString(36).substring(2, 9)
        setNotifications((prev) => [...prev, { id, message, type }])
    }, [])

    const removeNotification = useCallback((id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id))
    }, [])

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
                {notifications.map((notification) => (
                    // We pass a key but the Toast component handles the portal itself.
                    // Actually, stacking portals might be tricky. 
                    // Better approach: Render the container here (fixed) and Toasts inside.
                    // But Toast.tsx uses createPortal. Let's adjust Toast.tsx logic slightly context-side.
                    // Wait, if Toast uses Portal, they will all stack at document.body level.
                    // We need to position them.
                    // Let's modify: Render Toasts normally here, and this container is fixed.
                    <ToastWrapper
                        key={notification.id}
                        {...notification}
                        onClose={removeNotification}
                        index={notifications.indexOf(notification)}
                    />
                ))}
            </div>
        </NotificationContext.Provider>
    )
}

function ToastWrapper({ id, message, type, onClose, index }: { id: string; message: string; type: ToastType; onClose: (id: string) => void; index: number }) {
    // Simple wrapper to avoid the Portal inside the Portal if we changed approach
    // But since I wrote Toast.tsx to use Portal, let's just use it? 
    // Actually, multiple Portals to body will stack on top of each other (z-index).
    // They won't flow in a list unless we manage the "top" offset.
    // BETTER FIX: Rewrite Toast.tsx to NOT use Portal, and let Provider manage the container.
    return (
        <div className="pointer-events-auto transition-transform duration-300" style={{ transform: `translateY(${index * 10}px)` }}>
            {/* We will overwrite Toast.tsx to remove Portal and just accept className */}
            <ToastInner id={id} message={message} type={type} onClose={onClose} />
        </div>
    )
}

// Temporary internal component until I update the file
function ToastInner({ id, message, type, onClose }: { id: string; message: string; type: ToastType; onClose: (id: string) => void }) {
    const [isExiting, setIsExiting] = useState(false)

    React.useEffect(() => {
        const timer = setTimeout(() => handleClose(), 5000)
        return () => clearTimeout(timer)
    }, [])

    const handleClose = () => {
        setIsExiting(true)
        setTimeout(() => onClose(id), 300)
    }

    // Helper function to get background color with type safety
    const getBgColor = (toastType: ToastType): string => {
        const colors: Record<ToastType, string> = {
            success: 'bg-green-50 border-green-200 text-green-800',
            error: 'bg-red-50 border-red-200 text-red-800',
            info: 'bg-blue-50 border-blue-200 text-blue-800',
            warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        }
        return colors[toastType]
    }

    // Helper function to get icon with type safety
    const getIcon = (toastType: ToastType): string => {
        const iconMap: Record<ToastType, string> = {
            success: '✅',
            error: '❌',
            info: 'ℹ️',
            warning: '⚠️',
        }
        return iconMap[toastType]
    }

    const bgColor = getBgColor(type)
    const icon = getIcon(type)

    return (
        <div
            className={`
        flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border bg-white
        transform transition-all duration-300 ease-out mb-2 w-80
        ${bgColor}
        ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
      `}
            role="alert"
        >
            <span className="text-xl">{icon}</span>
            <p className="font-medium text-sm flex-1">{message}</p>
            <button onClick={handleClose} className="ml-2 opacity-50 hover:opacity-100">✕</button>
        </div>
    )
}

export function useNotification() {
    const context = useContext(NotificationContext)
    if (context === undefined) {
        throw new Error('useNotification must be used within a NotificationProvider')
    }
    return context
}
