'use client'

export default function Error({
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
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
                <button
                    onClick={reset}
                    className="glow-btn inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-3 text-sm font-semibold text-white transition-all hover:from-blue-500 hover:to-cyan-500"
                >
                    Try again
                </button>
            </div>
        </div>
    )
}
