import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Activate CaptureAI - Choose Your Plan',
    description: 'Activate your CaptureAI Chrome extension and start getting instant AI-powered answers. Basic plan includes 50 requests per day. Upgrade to Pro for unlimited homework help.',
    openGraph: {
        title: 'Activate CaptureAI - Choose Your Plan',
        description: 'Choose your CaptureAI plan and start solving homework instantly with AI screenshot analysis.',
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
