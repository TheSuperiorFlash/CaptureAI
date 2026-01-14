import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'CaptureAI - AI Homework Helper Chrome Extension | Get Instant Screenshot Answers',
    description: 'AI-powered homework helper Chrome extension. Screenshot any question and get instant answers. Perfect for students - solve homework, ace quizzes, and study smarter with AI screenshot analysis.',
    keywords: 'AI homework helper, screenshot answers, Chrome extension, AI homework solver, screenshot to answer, homework help AI, study helper, quiz solver, AI screenshot analysis, instant homework answers, student AI assistant, exam helper, academic AI tool',
    icons: {
        icon: '/icon128.png',
    },
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: 'https://captureai.dev',
        siteName: 'CaptureAI',
        title: 'CaptureAI - AI Homework Helper Chrome Extension | Screenshot Answers',
        description: 'AI-powered homework helper Chrome extension. Screenshot any question and get instant answers. Perfect for students studying smarter.',
        images: [
            {
                url: '/og-image.png',
                width: 1737,
                height: 1584,
                alt: 'CaptureAI - AI Homework Helper Chrome Extension',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'CaptureAI - AI Homework Helper Chrome Extension',
        description: 'Screenshot any question and get instant AI-powered answers. The ultimate study companion.',
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
    verification: {
        google: '',
    },
}

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
        <body className={inter.className}>
        <Navbar />
        <main className="min-h-screen">
            {children}
        </main>
        <Footer />
        </body>
        </html>
    )
}