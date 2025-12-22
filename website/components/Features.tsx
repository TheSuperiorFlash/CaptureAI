import { Camera, Zap, Lock, Sparkles, Clock, BarChart, LucideIcon } from 'lucide-react'

interface Feature {
    icon: LucideIcon
    title: string
    description: string
}

const features: Feature[] = [
    {
        icon: Camera,
        title: 'Quick Capture',
        description: 'Press Ctrl+Shift+X to instantly capture any area of your screen. Simple and fast.',
    },
    {
        icon: Sparkles,
        title: 'AI-Powered Analysis',
        description: 'Advanced AI analyzes your screenshots and provides intelligent, contextual answers.',
    },
    {
        icon: Zap,
        title: 'Lightning Fast',
        description: 'Get answers in seconds. No waiting, no hassle - just instant results.',
    },
    {
        icon: Lock,
        title: 'Privacy First',
        description: 'Your screenshots are processed securely and never stored on our servers.',
    },
    {
        icon: Clock,
        title: 'Ask Mode',
        description: 'Capture first, ask questions later. Perfect for when you need to think before asking.',
    },
    {
        icon: BarChart,
        title: 'Usage Tracking',
        description: 'Monitor your API usage with built-in analytics. Know exactly where you stand.',
    },
]

export default function Features() {
    return (
        <section id="features" className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">
                        Everything you need to work smarter
                    </h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Powerful features designed to help you solve problems faster and boost your productivity
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => {
                        const Icon = feature.icon
                        return (
                            <div
                                key={index}
                                className="p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all"
                            >
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                                    <Icon className="w-6 h-6 text-blue-600" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600">
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