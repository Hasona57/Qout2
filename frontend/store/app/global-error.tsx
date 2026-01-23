'use client'

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <html>
            <body>
                <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
                    <h2 className="text-2xl font-bold mb-4">عذراً، حدث خطأ ما!</h2>
                    <p className="text-red-600 mb-4 bg-red-50 p-2 rounded">{error.message}</p>
                    <button
                        onClick={() => reset()}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        المحاولة مرة أخرى
                    </button>
                </div>
            </body>
        </html>
    )
}
