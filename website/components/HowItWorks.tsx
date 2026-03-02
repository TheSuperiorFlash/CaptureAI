const steps = [
    {
        number: '1',
        title: 'Capture',
        description: 'Press a keyboard shortcut or click the floating button. Drag to select the area of your screen that contains the question.',
    },
    {
        number: '2',
        title: 'Analyze',
        description: 'The extension reads the text from your screenshot, then sends it to an AI model for analysis.',
    },
    {
        number: '3',
        title: 'Answer',
        description: 'The answer appears on-screen in seconds. In Stealth Mode, it shows up subtly right where you need it.',
    },
]

export default function HowItWorks() {
    return (
        <section className="relative py-24 md:py-32">
            {/* Gradient divider top */}
            <div className="divider-gradient absolute left-0 right-0 top-0" />

            <div className="mx-auto max-w-6xl px-6">
                {/* Header */}
                <div className="mx-auto mb-16 max-w-xl text-center">
                    <h2 className="mb-4">
                        <span className="text-[--color-text]">Three steps. </span>
                        <span className="text-gradient-static">That&apos;s it.</span>
                    </h2>
                    <p className="text-[--color-text-secondary]">
                        No setup complexity. Install, activate, capture.
                    </p>
                </div>

                {/* Steps with connecting line */}
                <div className="relative grid gap-8 md:grid-cols-3">
                    {/* Connecting gradient line (desktop only) */}
                    <div className="absolute left-[16.67%] right-[16.67%] top-[22px] hidden h-px bg-gradient-to-r from-blue-500/30 via-cyan-500/20 to-blue-500/30 md:block" />

                    {steps.map((step) => (
                        <div key={step.number} className="relative text-center">
                            {/* Glowing step number */}
                            <div className="relative mx-auto mb-6 flex h-11 w-11 items-center justify-center">
                                <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-md" />
                                <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-sm font-bold text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                                    {step.number}
                                </div>
                            </div>

                            <h3 className="mb-3 text-[--color-text]">{step.title}</h3>
                            <p className="text-sm leading-relaxed text-[--color-text-tertiary]">
                                {step.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
