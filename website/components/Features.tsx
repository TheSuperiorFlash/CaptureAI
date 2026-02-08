import { Camera, MousePointer, Eye, Zap, Repeat, Shield, MessageSquare, Infinity, LucideIcon } from 'lucide-react'

interface Feature {
    icon: LucideIcon
    title: string
    description: string
    pro?: boolean
}

const features: Feature[] = [
    {
        icon: Camera,
        title: 'Screenshot Capture',
        description: 'Select any area of your screen with a keyboard shortcut. The extension reads the text and sends it for analysis automatically.',
    },
    {
        icon: MousePointer,
        title: 'Floating Interface',
        description: 'A small, draggable panel sits on top of any webpage. Click it to capture, view answers, or access settings without leaving your tab.',
    },
    {
        icon: Eye,
        title: 'Stealth Mode',
        description: 'Answers appear inline on the page in a subtle overlay. No popups, no new windows — just the answer, right where you need it.',
    },
    {
        icon: Zap,
        title: 'Works on Any Site',
        description: 'Homework platforms, study guides, PDFs in the browser — if you can see it on screen, CaptureAI can read and answer it.',
    },
    {
        icon: Shield,
        title: 'Privacy Guard',
        description: 'Prevents quiz platforms from detecting extension activity. Your browser logs stay clean and show only normal browsing behavior.',
        pro: true,
    },
    {
        icon: MessageSquare,
        title: 'Ask Mode',
        description: 'Ask follow-up questions about a captured screenshot or type a question directly. Get detailed explanations, not just answers.',
        pro: true,
    },
    {
        icon: Repeat,
        title: 'Auto-Solve',
        description: 'Automatically answers questions on supported platforms like Vocabulary.com. Enable it and let the extension work through problems for you.',
        pro: true,
    },
    {
        icon: Infinity,
        title: 'Unlimited Requests',
        description: 'Free users get 10 requests per day. Pro removes that limit entirely — use CaptureAI as much as you need.',
        pro: true,
    },
]

export default function Features() {
    return (
        <section id="features" className="py-20 md:py-28">
            <div className="mx-auto max-w-6xl px-6">
                {/* Header */}
                <div className="mb-14">
                    <h2 className="mb-3 text-[--color-text]">Features</h2>
                    <p className="text-[--color-text-secondary]">
                        What the extension does, in plain terms.
                    </p>
                </div>

                {/* Grid */}
                <div className="grid gap-px overflow-hidden rounded-xl border border-[--color-border] bg-[--color-border] sm:grid-cols-2 lg:grid-cols-4">
                    {features.map((feature, index) => {
                        const Icon = feature.icon
                        return (
                            <div
                                key={index}
                                className="relative flex flex-col bg-[--color-background] p-6"
                            >
                                {feature.pro && (
                                    <span className="absolute right-4 top-4 rounded-md bg-[--color-accent-muted] px-2 py-0.5 text-[11px] font-semibold text-[--color-accent-hover]">
                                        PRO
                                    </span>
                                )}
                                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[--color-surface]">
                                    <Icon className="h-5 w-5 text-[--color-text-tertiary]" />
                                </div>
                                <h3 className="mb-2 text-base font-semibold text-[--color-text]">
                                    {feature.title}
                                </h3>
                                <p className="text-sm leading-relaxed text-[--color-text-tertiary]">
                                    {feature.description}
                                </p>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
