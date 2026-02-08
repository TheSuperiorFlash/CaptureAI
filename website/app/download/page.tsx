import type { Metadata } from 'next'
import { Chrome, Check } from 'lucide-react'

export const metadata: Metadata = {
    title: 'Download - CaptureAI',
    description: 'Download the CaptureAI Chrome extension. Free AI-powered screenshot answers for students.',
    openGraph: {
        title: 'Download CaptureAI',
        description: 'Free Chrome extension for students. Screenshot any question and get instant AI-powered answers.',
        images: ['/og-image.png'],
    },
}

export default function DownloadPage() {
    return (
        <div className="py-20 md:py-28">
            <div className="mx-auto max-w-2xl px-6">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="mb-3 text-[--color-text]">Download</h1>
                    <p className="text-[--color-text-secondary]">
                        Install the Chrome extension and get started.
                    </p>
                </div>

                {/* Download card */}
                <div className="mb-10 rounded-xl border border-[--color-border] p-6">
                    <div className="mb-6 flex items-center gap-3">
                        <Chrome className="h-8 w-8 text-[--color-text-tertiary]" />
                        <div>
                            <h2 className="text-lg font-semibold text-[--color-text]">Chrome Extension</h2>
                            <p className="text-sm text-[--color-text-tertiary]">Google Chrome</p>
                        </div>
                    </div>

                    <a
                        href="https://chromewebstore.google.com/detail/captureai/idpdleplccjjbmdmjkpmmkecmoeomnjd?authuser=0&hl=en"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-lg bg-[--color-accent] py-3 text-center text-sm font-medium text-white transition-colors hover:bg-[--color-accent-hover]"
                    >
                        Add to Chrome — Free
                    </a>
                </div>

                {/* Steps */}
                <div className="mb-10 rounded-xl border border-[--color-border] p-6">
                    <h3 className="mb-6 text-[--color-text]">Setup steps</h3>
                    <ol className="space-y-5">
                        {[
                            {
                                title: 'Install from Chrome Web Store',
                                desc: 'Click the button above to open the store listing, then click "Add to Chrome".',
                            },
                            {
                                title: 'Get your license key',
                                desc: <>Visit <a href="/activate" className="text-[--color-accent-hover] underline underline-offset-2">captureai.dev/activate</a> and enter your email to receive a free key.</>,
                            },
                            {
                                title: 'Activate the extension',
                                desc: 'Open the CaptureAI extension popup, paste your license key, and you\'re ready to go.',
                            },
                            {
                                title: 'Start capturing',
                                desc: 'Press Ctrl+Shift+X to capture any area of your screen and get an instant answer.',
                            },
                        ].map((step, i) => (
                            <li key={i} className="flex gap-4">
                                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[--color-accent] text-xs font-semibold text-white">
                                    {i + 1}
                                </div>
                                <div>
                                    <h4 className="mb-1 text-sm font-medium text-[--color-text]">{step.title}</h4>
                                    <p className="text-sm text-[--color-text-tertiary]">{step.desc}</p>
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>

                {/* Requirements */}
                <div className="rounded-xl border border-[--color-border-subtle] p-6">
                    <h4 className="mb-4 text-sm font-medium text-[--color-text-secondary]">System requirements</h4>
                    <ul className="space-y-2.5">
                        {[
                            'Google Chrome 88 or later',
                            'Internet connection',
                            'Free CaptureAI license key',
                        ].map((req) => (
                            <li key={req} className="flex items-center gap-3">
                                <Check className="h-4 w-4 text-[--color-text-tertiary]" />
                                <span className="text-sm text-[--color-text-tertiary]">{req}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    )
}
