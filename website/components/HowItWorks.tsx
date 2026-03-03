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
        <section className="relative py-24 md:py-40 reveal-up">
            {/* Gradient divider top */}
            <div className="divider-gradient absolute left-0 right-0 top-0" />

            <div className="pointer-events-none absolute inset-0 aurora-bg opacity-20" />

            <div className="relative z-10 mx-auto max-w-6xl px-6">
                {/* Header */}
                <div className="mx-auto mb-20 max-w-xl text-center reveal-up delay-100">
                    <h2 className="mb-4">
                        <span className="text-[--color-text]">Three steps. </span>
                        <span className="text-gradient">That&apos;s it.</span>
                    </h2>
                    <p className="text-lg text-[--color-text-secondary]">
                        No setup complexity. Install, activate, capture.
                    </p>
                </div>

                {/* Steps with connecting line */}
                <div className="relative grid gap-12 md:gap-8 md:grid-cols-3 reveal-up delay-200">
                    {/* Connecting gradient line (desktop only) */}
                    <div className="absolute left-[16.67%] right-[16.67%] top-[24px] hidden h-px bg-gradient-to-r from-[#0047ff]/40 via-[#00f0ff]/30 to-[#0047ff]/40 md:block" />

                    {steps.map((step, index) => {
                        const staggerDelay = `delay-${((index % 3) + 2) * 100}`

                        return (
                            <div key={step.number} className={`group relative flex flex-col items-center rounded-3xl p-6 text-center transition-all duration-500 hover:bg-white/[0.02] hover:-translate-y-2 reveal-up ${staggerDelay}`}>
                                {/* Glowing step number */}
                                <div className="relative mx-auto mb-8 flex h-12 w-12 items-center justify-center">
                                    <div className="absolute inset-0 rounded-full bg-[#0047ff]/30 blur-md transition-all duration-500 group-hover:bg-[#00f0ff]/60 group-hover:blur-xl group-hover:scale-150" />
                                    <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#0047ff] to-[#00f0ff] text-[15px] font-bold tracking-tight text-white shadow-[0_0_25px_rgba(0,113,255,0.4)] border border-white/10 transition-transform duration-500 group-hover:scale-110">
                                        {step.number}
                                    </div>
                                </div>

                                <h3 className="mb-3 text-[19px] font-semibold text-[--color-text] transition-colors duration-500 group-hover:text-cyan-300">{step.title}</h3>
                                <p className="mx-auto max-w-sm text-[15px] leading-relaxed text-[--color-text-tertiary] transition-colors duration-500 group-hover:text-[--color-text-secondary]">
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
