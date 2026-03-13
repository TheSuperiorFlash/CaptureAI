'use client'

import { useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Application error:', error)
    }, [error])

    return (
        <div className="relative overflow-x-hidden py-20 md:py-28">
            <div className="pointer-events-none absolute inset-0 gradient-mesh" />

            <div className="relative z-10 mx-auto max-w-md px-6 text-center">
                <h1 className="mb-4">
                    <span className="text-[--color-text]">Something went </span>
                    <span className="text-gradient-static">wrong</span>
                </h1>
                <p className="mb-8 text-[--color-text-secondary]">
                    An unexpected error occurred. Please try again.
                </p>
                {error.message && (
                    <Alert variant="destructive" className="mb-8 text-left">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error.message}</AlertDescription>
                    </Alert>
                )}
                <button
                    type="button"
                    onClick={reset}
                    className="glow-btn inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-3 text-sm font-semibold text-white transition-all hover:from-blue-500 hover:to-cyan-500"
                >
                    Try again
                </button>
            </div>
        </div>
    )
}
