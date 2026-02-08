import { Camera, Cpu, CheckCircle } from 'lucide-react'

const steps = [
    {
        number: '1',
        icon: Camera,
        title: 'Capture',
        description: 'Press a keyboard shortcut or click the floating button. Drag to select the area of your screen that contains the question.',
    },
    {
        number: '2',
        icon: Cpu,
        title: 'Analyze',
        description: 'The extension reads the text from your screenshot using OCR, then sends it to an AI model for analysis.',
    },
    {
        number: '3',
        icon: CheckCircle,
        title: 'Answer',
        description: 'The answer appears on-screen in seconds. In Stealth Mode, it shows up subtly right where you need it.',
    },
]

export default function HowItWorks() {
    return (
        <section className="border-t border-[--color-border-subtle] py-20 md:py-28">
            <div className="mx-auto max-w-6xl px-6">
                {/* Header */}
                <div className="mb-14">
                    <h2 className="mb-3 text-[--color-text]">How it works</h2>
                    <p className="text-[--color-text-secondary]">
                        Three steps. No setup complexity.
                    </p>
                </div>

                {/* Steps */}
                <div className="grid gap-8 md:grid-cols-3">
                    {steps.map((step) => {
                        const Icon = step.icon
                        return (
                            <div key={step.number} className="relative">
                                {/* Step number */}
                                <div className="mb-5 flex h-9 w-9 items-center justify-center rounded-full bg-[--color-accent] text-sm font-semibold text-white">
                                    {step.number}
                                </div>

                                <h3 className="mb-2 text-[--color-text]">{step.title}</h3>
                                <p className="text-sm leading-relaxed text-[--color-text-tertiary]">
                                    {step.description}
                                </p>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
