import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

const platformLogos = [
    { src: '/platforms/canvas.png', alt: 'Canvas', heightClass: 'h-8' },
    { src: '/platforms/respondus.png', alt: 'Respondus', heightClass: 'h-7' },
    { src: '/platforms/moodle.png', alt: 'Moodle', heightClass: 'h-8' },
    { src: '/platforms/blackboard.png', alt: 'Blackboard', heightClass: 'h-5' },
    { src: '/platforms/tophat.png', alt: 'Top Hat', heightClass: 'h-5' },
]

export default function Hero() {
    return (
        <section className="relative overflow-hidden pb-32 pt-32 md:pb-48 md:pt-40">
            {/* Layered deeper gradient background */}
            <div className="pointer-events-none absolute inset-0 aurora-bg" />
            <div className="absolute left-1/2 top-[-200px] h-[800px] w-[1000px] -translate-x-1/2 rounded-full bg-[#0047ff] gradient-blur gradient-blur-animated animate-pulse-glow" style={{ opacity: 0.15 }} />
            <div className="absolute right-[-100px] top-[50px] h-[500px] w-[500px] rounded-full bg-[#00f0ff] gradient-blur gradient-blur-animated animate-float-slow" style={{ opacity: 0.1 }} />
            <div className="absolute bottom-[-100px] left-[-150px] h-[450px] w-[450px] rounded-full bg-[#1a5cff] gradient-blur gradient-blur-animated animate-pulse-glow" style={{ animationDelay: '2s', opacity: 0.12 }} />

            <div className="relative z-10 mx-auto max-w-6xl px-6">
                <div className="mx-auto max-w-4xl text-center">
                    {/* Badge */}
                    <div className="glass mb-8 inline-flex items-center gap-3 rounded-full px-4 py-1.5 reveal-up delay-100 border-cyan-500/20 bg-[#060913]/80">
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
                        </span>
                        <span className="text-[13px] font-semibold tracking-wide text-cyan-50 uppercase">Chrome Extension</span>
                        <span className="h-3 w-px bg-[--color-border]" />
                        <span className="text-[13px] font-medium text-[--color-text-tertiary]">Free to start</span>
                    </div>

                    {/* Headline */}
                    <h1 className="mb-4 reveal-up delay-200">
                        <span className="text-[--color-text]">Screenshot any question.</span>
                        <br />
                        <span className="text-gradient">Get the exact answer.</span>
                    </h1>

                    {/* Subheading */}
                    <p className="mx-auto mb-10 max-w-2xl text-xl text-[--color-text-secondary] reveal-up delay-300">
                        CaptureAI reads your screen, understands the context, and delivers the correct answer in seconds. Bypasses detection. Works everywhere.
                    </p>

                    {/* CTA */}
                    <div className="flex flex-col items-center gap-6 reveal-up delay-400">
                        <Link
                            href="/activate"
                            className="glow-btn inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#0047ff] to-[#1a5cff] px-10 py-4 text-base font-bold tracking-wide text-white transition-all hover:from-[#1a5cff] hover:to-[#00f0ff] md:px-14 md:py-5 md:text-lg"
                        >
                            Get Started Free
                            <ArrowRight className="h-5 w-5" />
                        </Link>
                        <Link
                            href="/#features"
                            className="inline-flex items-center gap-2 text-[15px] font-semibold text-[--color-text-secondary] transition-colors hover:text-cyan-400"
                        >
                            Explore features
                        </Link>
                    </div>
                </div>

                {/* Platform logos */}
                <div className="mt-28 reveal-up delay-500">
                    <p className="mb-8 text-center text-[13px] font-semibold tracking-widest uppercase text-[--color-text-tertiary]">
                        Undetectable on every learning platform
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
                        {platformLogos.map((platform) => (
                            <div key={platform.alt} className="opacity-40 grayscale transition-all duration-500 hover:opacity-100 hover:grayscale-0">
                                <Image
                                    src={platform.src}
                                    alt={platform.alt}
                                    width={120}
                                    height={40}
                                    className={`${platform.heightClass} w-auto`}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
