import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
    title: 'CaptureAI - AI-Powered Screenshot Analysis',
    description: 'Instantly analyze screenshots with AI. Ask questions, get answers, solve problems - all with a simple screenshot.',
    keywords: 'AI, screenshot, Chrome extension, image analysis, productivity',
    icons: {
        icon: '/icon128.png',
    },
}

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
        <body>
        <Navbar />
        <main className="min-h-screen">
            {children}
        </main>
        <Footer />
        </body>
        </html>
    )
}