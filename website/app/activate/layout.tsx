import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Activate CaptureAI - Get Your Free AI Homework Helper License',
    description: 'Activate your CaptureAI Chrome extension and start getting instant AI-powered answers to your homework. Free tier includes 10 requests per day. Upgrade to Pro for unlimited homework help.',
    openGraph: {
        title: 'Activate CaptureAI - Free AI Homework Helper',
        description: 'Get your free license key for CaptureAI and start solving homework instantly with AI screenshot analysis.',
        images: ['/og-image.png'],
    },
}

export default function ActivateLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
