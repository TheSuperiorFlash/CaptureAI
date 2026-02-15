import Link from 'next/link'

export default function NotFound() {
    return (
        <div className="relative overflow-x-hidden py-20 md:py-28">
            <div className="pointer-events-none absolute inset-0 gradient-mesh" />

            <div className="relative z-10 mx-auto max-w-md px-6 text-center">
                <h1 className="mb-4">
                    <span className="text-gradient-static">404</span>
                </h1>
                <p className="mb-8 text-[--color-text-secondary]">
                    The page you&apos;re looking for doesn&apos;t exist or has been moved.
                </p>
                <Link
                    href="/"
                    className="glow-btn inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-3 text-sm font-semibold text-white transition-all hover:from-blue-500 hover:to-cyan-500"
                >
                    Back to home
                </Link>
            </div>
        </div>
    )
}
