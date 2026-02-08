import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const inter = Inter({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700', '800'],
    display: 'swap',
})

export const metadata: Metadata = {
    title: 'CaptureAI - AI-Powered Screenshot Answers for Students',
    description: 'Chrome extension that screenshots any question and gives you the answer instantly. Works on Canvas, Moodle, Blackboard, and every learning platform.',
    keywords: 'AI homework helper, screenshot answers, Chrome extension, AI homework solver, student AI assistant',
    icons: {
        icon: '/icon128.png',
    },
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: 'https://captureai.dev',
        siteName: 'CaptureAI',
        title: 'CaptureAI - AI-Powered Screenshot Answers for Students',
        description: 'Chrome extension that screenshots any question and gives you the answer instantly. Works on Canvas, Moodle, Blackboard, and every learning platform.',
        images: [
            {
                url: '/og-image.png',
                width: 1737,
                height: 1584,
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
        <body className={`noise ${inter.className}`}>
        {/* Blue glow behind translucent navbar */}
        <div className="pointer-events-none fixed top-0 left-0 right-0 z-40 h-32 bg-[radial-gradient(ellipse_at_50%_0%,rgba(37,99,235,0.3)_0%,transparent_70%)]" />
        <Navbar />
        <main className="min-h-screen pt-16">
            {children}
        </main>
        <Footer />
        </body>
        </html>
    )
}
