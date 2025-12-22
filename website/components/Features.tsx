import { Camera, Zap, Repeat, Eye, Shield, MousePointer, LucideIcon } from 'lucide-react'

interface Feature {
    icon: LucideIcon
    title: string
    description: string
    gradient: string
}

const features: Feature[] = [
    {
        icon: Camera,
        title: 'Instant Capture',
        description: 'Screenshot any question with a simple keyboard shortcut. Fast, easy, and works everywhere.',
        gradient: 'from-blue-500 to-cyan-500',
    },
    {
        icon: Zap,
        title: 'AI-Powered Answers',
        description: 'Get accurate answers in seconds powered by advanced AI technology.  Never get stuck again.',
        gradient: 'from-cyan-500 to-blue-500',
    },
    {
        icon: MousePointer,
        title: 'Floating UI',
        description: 'Always accessible interface that stays on top. Seamlessly integrated into your workflow.',
        gradient: 'from-blue-600 to-blue-400',
    },
    {
        icon: Eye,
        title: 'Stealth Mode',
        description: 'Answers appear discreetly where you need them.  No obvious popups that draw attention.',
        gradient: 'from-purple-500 to-blue-500',
    },
    {
        icon: Repeat,
        title: 'Auto-Solve',
        description: 'Automatically solve questions on Quizlet and Vocabulary.com. Save hours of study time.',
        gradient: 'from-blue-500 to-indigo-500',
    },
    {
        icon: Shield,
        title:  'Privacy First',
        description: 'Your activity stays completely private. No one can detect the extension or track your usage.',
        gradient: 'from-cyan-600 to-blue-600',
    },
]

export default function Features() {
    return (
        <section id="features" className="py-24 bg-[#08070e] relative">
            {/* Subtle gradient background */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/5 to-transparent"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500 gradient-blur"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <div className="inline-block px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-4">
                        <span className="text-sm text-blue-300 font-semibold">POWERFUL FEATURES</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        Everything you need to succeed
                    </h2>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Packed with features designed to make studying easier and more efficient
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, index) => {
                        const Icon = feature.icon
                        return (
                            <div
                                key={index}
                                className="group relative p-8 rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-900/80 to-gray-900/40 hover:border-blue-500/50 transition-all duration-300 backdrop-blur-sm hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20"
                            >
                                {/* Gradient overlay on hover */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`}></div>

                                <div className="relative">
                                    <div className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-5 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
                                        <Icon className="w-7 h-7 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-300 transition-colors">
                                        {feature.title}
                                    </h3>
                                    <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                                        {feature.description}
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}