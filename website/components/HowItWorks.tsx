import { Camera, Cpu, CheckCircle } from 'lucide-react'

interface Step {
    number: string
    icon: React.ElementType
    title: string
    description: string
}

const steps: Step[] = [
    {
        number: '01',
        icon: Camera,
        title: 'Capture Question',
        description: 'Use the Chrome extension to capture any question from your screen with a simple keyboard shortcut or click.',
    },
    {
        number: '02',
        icon: Cpu,
        title: 'AI Analyzes',
        description: 'Our AI instantly processes the captured image, extracts the text, and understands the question.',
    },
    {
        number: '03',
        icon: CheckCircle,
        title: 'Get Answer',
        description: 'Receive accurate, detailed answers in seconds right in your Chrome browser.',
    },
]

export default function HowItWorks() {
    return (
        <section className="py-24 bg-gradient-to-b from-[#08070e] to-gray-950/50 relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b10_1px,transparent_1px),linear-gradient(to_bottom,#1e293b10_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <div className="inline-block px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full mb-4">
                        <span className="text-green-400 text-sm font-semibold">Simple Process</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        How It Works
                    </h2>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Three simple steps to get answers while studying
                    </p>
                </div>

                {/* Steps */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {steps.map((step, index) => {
                        const Icon = step.icon
                        return (
                            <div
                                key={index}
                                className="relative group"
                            >
                                {/* Connector line (only between steps) */}
                                {index < steps.length - 1 && (
                                    <div className="hidden md:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-blue-500/50 to-transparent -translate-x-1/2 z-0" />
                                )}

                                {/* Step card */}
                                <div className="relative bg-gradient-to-b from-gray-900/80 to-gray-900/40 border border-gray-800 rounded-2xl p-8 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all backdrop-blur-sm z-10">
                                    {/* Step number */}
                                    <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/50">
                                        {step.number}
                                    </div>

                                    {/* Icon */}
                                    <div className="w-16 h-16 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-500/20 transition-colors border border-blue-500/20 group-hover:scale-110 transition-transform">
                                        <Icon className="w-8 h-8 text-blue-400 group-hover:text-blue-300 transition-colors" />
                                    </div>

                                    {/* Title */}
                                    <h3 className="text-2xl font-bold text-white mb-3">
                                        {step.title}
                                    </h3>

                                    {/* Description */}
                                    <p className="text-gray-400 leading-relaxed">
                                        {step.description}
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Bottom CTA */}
                <div className="text-center mt-16">
                    <p className="text-lg text-gray-300">
                        Ready to streamline your studying? 
                        <span className="text-blue-400 font-semibold ml-2">Install the Chrome extension today</span>
                    </p>
                </div>
            </div>
        </section>
    )
}
