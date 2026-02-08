import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

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
        <head>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link
                href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
                rel="stylesheet"
            />
        </head>
        <body className="noise">
        <Navbar />
        <main className="min-h-screen">
            {children}
        </main>
        <Footer />
        </body>
        </html>
    )
}
