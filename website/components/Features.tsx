import { Camera, Zap, MessageSquare, Repeat, Eye, KeyboardIcon, LucideIcon } from 'lucide-react'

interface Feature {
    icon: LucideIcon
    title: string
    description: string
}

const features: Feature[] = [
    {
        icon: Camera,
        title: 'Quick Capture',
        description: 'Press Ctrl+Shift+X to screenshot any question on your screen. Works with text, images, diagrams, and more.',
    },
    {
        icon: MessageSquare,
        title: 'Instant Answers',
        description: 'Get AI-powered answers to your questions in seconds. Perfect for homework, quizzes, and studying.',
    },
    {
        icon: Repeat,
        title: 'Auto-Solve',
        description: 'Automatically solve multiple-choice questions on Quizlet and Vocabulary.com with one click.',
    },
    {
        icon: Eye,
        title: 'Stealth Mode',
        description: 'Work invisibly - websites can\'t detect you\'re using CaptureAI. Stay focused without distractions.',
    },
    {
        icon: KeyboardIcon,
        title: 'Keyboard Shortcuts',
        description: 'Lightning-fast shortcuts: Ctrl+Shift+X to capture, Ctrl+Shift+F to repeat, Ctrl+Shift+E to toggle.',
    },
    {
        icon: Zap,
        title: 'Works Anywhere',
        description: 'Use CaptureAI on any website - Canvas, Blackboard, Google Classroom, or any online platform.',
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
                        How it works
                    </h2>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Simple, fast, and designed for students
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, index) => {
                        const Icon = feature.icon
                        return (
                            <div
                                key={index}
                                className="group p-6 rounded-xl border border-gray-800 bg-gradient-to-b from-gray-900/50 to-gray-900/30 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all backdrop-blur-sm"
                            >
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