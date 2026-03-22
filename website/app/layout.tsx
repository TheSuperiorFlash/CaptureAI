import type { Metadata } from 'next'
import '@fontsource/outfit/400.css'
import '@fontsource/outfit/500.css'
import '@fontsource/outfit/600.css'
import '@fontsource/outfit/700.css'
import '@fontsource/outfit/800.css'
import '@fontsource/plus-jakarta-sans/400.css'
import '@fontsource/plus-jakarta-sans/500.css'
import '@fontsource/plus-jakarta-sans/600.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/700.css'
import '@fontsource/inter/800.css'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import GoogleAnalytics from '@/components/GoogleAnalytics'
import { SITE_URL } from '@/lib/constants'
import SmoothScroll from '@/components/SmoothScroll'
import { TooltipProvider } from '@/components/ui/tooltip'

export const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    title: {
        default: 'CaptureAI - AI-Powered Screenshot Answers for Students',
        template: '%s | CaptureAI',
    },
    description: 'Chrome extension that screenshots any question and gives you the answer instantly. Works on Canvas, Moodle, Blackboard, Top Hat, and every learning platform.',
    alternates: {
        canonical: '/',
    },
    keywords: 'AI homework helper, screenshot answers, Chrome extension, AI homework solver, student AI assistant, Canvas help, Moodle helper, Blackboard study tool, online exam helper, AI screenshot tool, homework AI, homework text extraction',
    icons: {
        icon: [
            { url: '/logo.svg', type: 'image/svg+xml' },
            { url: '/logo.png', type: 'image/png' },
        ],
        apple: '/logo.png',
    },
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: SITE_URL,
        siteName: 'CaptureAI',
        title: 'CaptureAI - AI-Powered Screenshot Answers for Students',
        description: 'Chrome extension that screenshots any question and gives you the answer instantly. Works on Canvas, Moodle, Blackboard, Top Hat, and every learning platform.',
        images: [
            {
                url: '/og-image.png',
                width: 1200,
                height: 630,
                alt: 'CaptureAI Chrome Extension',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'CaptureAI - Screenshot Any Question, Get the Answer',
        description: 'Chrome extension that gives you instant AI-powered answers from screenshots.',
        images: ['/og-image.png'],
    },
    verification: {
        google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className="noise antialiased">
                <GoogleAnalytics />
                <TooltipProvider>
                <SmoothScroll>
                    <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[--color-accent] focus:px-4 focus:py-2 focus:text-white">
                        Skip to main content
                    </a>

                    <Navbar />
                    <main id="main-content" className="relative min-h-screen w-full overflow-x-clip">
                        {children}
                    </main>
                    <Footer />
                </SmoothScroll>
                </TooltipProvider>
            </body>
        </html>
    )
}
