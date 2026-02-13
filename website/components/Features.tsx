import { Camera, MousePointer, Eye, Zap, Repeat, Shield, MessageSquare, Infinity as InfinityIcon, LucideIcon } from 'lucide-react'

interface Feature {
    icon: LucideIcon
    title: string
    description: string
    pro?: boolean
    color: string
    glow: string
}

const features: Feature[] = [
    {
        icon: Camera,
        title: 'Screenshot Capture',
        description: 'Select any area of your screen with a keyboard shortcut. The extension reads the text and sends it for analysis automatically.',
        color: 'from-blue-500/20 to-blue-600/10',
        glow: 'group-hover:shadow-[0_0_20px_rgba(59,130,246,0.1)]',
    },
    {
        icon: MousePointer,
        title: 'Floating Interface',
        description: 'A small, draggable panel sits on top of any webpage. Click it to capture, view answers, or access settings without leaving your tab.',
        color: 'from-cyan-500/20 to-cyan-600/10',
        glow: 'group-hover:shadow-[0_0_20px_rgba(34,211,238,0.1)]',
    },
    {
        icon: Eye,
        title: 'Stealth Mode',
        description: 'Answers appear inline on the page in a subtle overlay. No popups, no new windows — just the answer, right where you need it.',
        color: 'from-sky-500/20 to-sky-600/10',
        glow: 'group-hover:shadow-[0_0_20px_rgba(56,189,248,0.1)]',
    },
    {
        icon: Zap,
        title: 'Works on Any Site',
        description: 'Homework platforms, study guides, PDFs in the browser — if you can see it on screen, CaptureAI can read and answer it.',
        color: 'from-amber-500/20 to-amber-600/10',
        glow: 'group-hover:shadow-[0_0_20px_rgba(245,158,11,0.1)]',
    },
    {
        icon: Shield,
        title: 'Privacy Guard',
        description: 'Prevents quiz platforms from detecting extension activity. Your browser logs stay clean and show only normal browsing behavior.',
        pro: true,
        color: 'from-emerald-500/20 to-emerald-600/10',
        glow: 'group-hover:shadow-[0_0_20px_rgba(16,185,129,0.1)]',
    },
    {
        icon: MessageSquare,
        title: 'Ask Mode',
        description: 'Ask follow-up questions about a captured screenshot or type a question directly. Get detailed explanations, not just answers.',
        pro: true,
        color: 'from-violet-500/20 to-violet-600/10',
        glow: 'group-hover:shadow-[0_0_20px_rgba(139,92,246,0.1)]',
    },
    {
        icon: Repeat,
        title: 'Auto-Solve',
        description: 'Automatically answers questions on supported platforms like Vocabulary.com. Enable it and let the extension work through problems for you.',
        pro: true,
        color: 'from-rose-500/20 to-rose-600/10',
        glow: 'group-hover:shadow-[0_0_20px_rgba(244,63,94,0.1)]',
    },
    {
        icon: InfinityIcon,
        title: 'Unlimited Requests',
        description: 'Free users get 10 requests per day. Pro removes that limit entirely — use CaptureAI as much as you need.',
        pro: true,
        color: 'from-blue-500/20 to-cyan-500/10',
        glow: 'group-hover:shadow-[0_0_20px_rgba(37,99,235,0.1)]',
    },
]

export default function Features() {
    return (
        <section id="features" className="relative py-24 md:py-32">
            <div className="pointer-events-none absolute inset-0 gradient-section" />
            <div className="relative z-10 mx-auto max-w-6xl px-6">
                {/* Header */}
                <div className="mx-auto mb-16 max-w-2xl text-center">
                    <h2 className="mb-4">
                        <span className="text-[--color-text]">Everything you need, </span>
                        <span className="text-gradient-static">nothing you don&apos;t</span>
                    </h2>
                    <p className="text-[--color-text-secondary]">
                        What the extension does, in plain terms.
                    </p>
                </div>

                {/* Grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {features.map((feature, index) => {
                        const Icon = feature.icon
                        return (
                            <div
                                key={feature.title}
                                className={`glass-card group relative flex flex-col rounded-2xl p-6 transition-all duration-300 ${feature.glow}`}
                            >
                                {feature.pro && (
                                    <span className="absolute right-4 top-4 rounded-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-400">
                                        PRO
                                    </span>
                                )}
                                <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color}`}>
                                    <Icon className="h-5 w-5 text-[--color-text-secondary]" />
                                </div>
                                <h3 className="mb-2 text-base font-semibold text-[--color-text]">
                                    {feature.title}
                                </h3>
                                <p className="text-[13px] leading-relaxed text-[--color-text-tertiary]">
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
