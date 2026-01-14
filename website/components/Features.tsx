import { Camera, Zap, MessageSquare, Repeat, Eye, Shield, MousePointer, Infinity, LucideIcon } from 'lucide-react'

interface Feature {
    icon: LucideIcon
    title: string
    description: string
    isPro?: boolean
}

const features: Feature[] = [
    {
        icon: Camera,
        title: 'Capture',
        description: 'Screenshot any question with a simple keyboard shortcut. Fast and easy.',
        isPro: false,
    },
    {
        icon: MousePointer,
        title: 'Floating UI',
        description: 'Always accessible interface that stays on top. Just click to get started.',
        isPro: false,
    },
    {
        icon: Eye,
        title: 'Stealth Mode',
        description: 'Answers appear discreetly right where you need them. No obvious popups or alerts.',
        isPro: false,
    },
    {
        icon: Zap,
        title: 'Works Anywhere',
        description: 'Use on any website - homework sites, quizzes, study platforms, anywhere.',
        isPro: false,
    },
    {
        icon: Repeat,
        title: 'Auto-Solve',
        description: 'Automatically solve questions on Vocabulary.com.',
        isPro: true,
    },
    {
        icon: Shield,
        title: 'Privacy Guard',
        description: 'Your activity stays completely private. No one can detect the extension.',
        isPro: true,
    },
    {
        icon: MessageSquare,
        title: 'Ask Mode',
        description: 'Ask follow-up questions and get detailed explanations for any topic.',
        isPro: true,
    },
    {
        icon: Infinity,
        title: 'Unlimited Requests',
        description: 'No daily limits. Solve as many questions as you need.',
        isPro: true,
    },
]

export default function Features() {
    return (
        <section id="features" className="py-24 bg-[#08070e] relative">
            {/* Subtle gradient background */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/5 to-transparent"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        Powerful Features
                    </h2>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Everything you need in a Chrome extension for students
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((feature, index) => {
                        const Icon = feature.icon
                        return (
                            <div
                                key={index}
                                className="group p-6 rounded-xl border border-gray-800 bg-gradient-to-b from-gray-900/50 to-gray-900/30 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all backdrop-blur-sm relative"
                            >
                                {feature.isPro && (
                                    <div className="absolute top-3 right-3 bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-lg">
                                        PRO
                                    </div>
                                )}
                                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors border border-blue-500/20">
                                    <Icon className="w-6 h-6 text-blue-400 group-hover:text-blue-300 transition-colors" />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-400 leading-relaxed">
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