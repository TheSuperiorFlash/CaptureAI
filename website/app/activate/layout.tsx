import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Activate CaptureAI - Choose Your Plan',
    description: 'Choose your CaptureAI plan — Basic at $1.49/week for 50 daily requests or Pro at $9.99/month with unlimited AI answers and Privacy Guard.',
    alternates: {
        canonical: '/activate',
    },
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
