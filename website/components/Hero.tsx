import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

export default function Hero() {
    return (
        <section className="relative overflow-hidden pb-28 pt-28 md:pb-36 md:pt-36">
            {/* Layered gradient mesh background */}
            <div className="pointer-events-none absolute inset-0 gradient-mesh" />
            <div className="absolute left-1/2 top-[-200px] h-[700px] w-[900px] -translate-x-1/2 rounded-full bg-blue-600 gradient-blur animate-pulse-glow" />
            <div className="absolute right-[-200px] top-[100px] h-[400px] w-[400px] rounded-full bg-cyan-500 gradient-blur animate-float-slow" />
            <div className="absolute bottom-[-100px] left-[-150px] h-[350px] w-[350px] rounded-full bg-blue-500 gradient-blur" style={{ animationDelay: '2s' }} />

            <div className="relative z-10 mx-auto max-w-6xl px-6">
                <div className="mx-auto max-w-3xl text-center">
                    {/* Badge */}
                    <div className="glass mb-8 inline-flex items-center gap-2.5 rounded-full px-4 py-1.5">
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
                        </span>
                        <span className="text-xs font-medium text-[--color-text-secondary]">Chrome Extension</span>
                        <span className="h-3 w-px bg-[--color-border]" />
                        <span className="text-xs text-[--color-text-tertiary]">Free to start</span>
                    </div>

                    {/* Headline */}
                    <h1 className="mb-6">
                        <span className="text-[--color-text]">Screenshot any question.</span>
                        <br />
                        <span className="text-gradient-static">Get the answer.</span>
                    </h1>

                    {/* Subheading */}
                    <p className="mx-auto mb-10 max-w-xl text-lg text-[--color-text-secondary]">
                        CaptureAI is a Chrome extension that reads your screen, understands the question, and gives you the answer — in seconds. Works on any website.
                    </p>

                    {/* CTA */}
                    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                        <Link
                            href="/activate"
                            className="glow-btn inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-7 py-3.5 text-[15px] font-semibold text-white transition-all hover:from-blue-500 hover:to-cyan-500"
                        >
                            Get Started Free
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                        <Link
                            href="/#features"
                            className="glass inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-[15px] font-medium text-[--color-text-secondary] transition-all hover:text-[--color-text]"
                        >
                            See how it works
                        </Link>
                    </div>
                </div>

                {/* Platform logos */}
                <div className="mt-24">
                    <p className="mb-8 text-center text-sm text-[--color-text-tertiary]">
                        Works on every learning platform
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
                        {[
                            { src: '/platforms/canvas.png', alt: 'Canvas', heightClass: 'h-8' },
                            { src: '/platforms/respondus.png', alt: 'Respondus', heightClass: 'h-7' },
                            { src: '/platforms/moodle.png', alt: 'Moodle', heightClass: 'h-8' },
                            { src: '/platforms/blackboard.png', alt: 'Blackboard', heightClass: 'h-5' },
                            { src: '/platforms/tophat.png', alt: 'Top Hat', heightClass: 'h-5' },
                        ].map((platform) => (
                            <div key={platform.alt} className="opacity-30 grayscale transition-all duration-300 hover:opacity-60 hover:grayscale-0">
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
