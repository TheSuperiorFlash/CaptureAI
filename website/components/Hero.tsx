import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

export default function Hero() {
    return (
        <section className="relative overflow-hidden pb-24 pt-24 md:pb-32 md:pt-32">
            {/* Subtle background glow — single, restrained */}
            <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 bg-blue-600 gradient-blur" />

            <div className="relative z-10 mx-auto max-w-6xl px-6">
                <div className="mx-auto max-w-3xl text-center">
                    {/* Badge */}
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[--color-border] bg-[--color-surface] px-4 py-1.5">
                        <span className="text-xs font-medium text-[--color-text-secondary]">Chrome Extension</span>
                        <span className="text-xs text-[--color-text-tertiary]">Free to start</span>
                    </div>

                    {/* Headline */}
                    <h1 className="mb-6 text-[--color-text]">
                        Screenshot any question.{' '}
                        <span className="text-[--color-accent-hover]">Get the answer.</span>
                    </h1>

                    {/* Subheading */}
                    <p className="mx-auto mb-10 max-w-xl text-lg text-[--color-text-secondary]">
                        CaptureAI is a Chrome extension that reads your screen, understands the question, and gives you the answer — in seconds. Works on any website.
                    </p>

                    {/* CTA */}
                    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                        <Link
                            href="/activate"
                            className="inline-flex items-center gap-2 rounded-lg bg-[--color-accent] px-6 py-3 text-[15px] font-medium text-white transition-colors hover:bg-[--color-accent-hover]"
                        >
                            Get Started Free
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                        <Link
                            href="/#features"
                            className="inline-flex items-center gap-2 rounded-lg border border-[--color-border] bg-transparent px-6 py-3 text-[15px] font-medium text-[--color-text-secondary] transition-colors hover:border-[--color-text-tertiary] hover:text-[--color-text]"
                        >
                            See how it works
                        </Link>
                    </div>
                </div>

                {/* Platform logos */}
                <div className="mt-20">
                    <p className="mb-6 text-center text-sm text-[--color-text-tertiary]">
                        Works on every learning platform
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
                        {[
                            { src: '/platforms/canvas.png', alt: 'Canvas', h: 'h-8' },
                            { src: '/platforms/respondus.png', alt: 'Respondus', h: 'h-7' },
                            { src: '/platforms/moodle.png', alt: 'Moodle', h: 'h-8' },
                            { src: '/platforms/blackboard.png', alt: 'Blackboard', h: 'h-5' },
                            { src: '/platforms/tophat.png', alt: 'Top Hat', h: 'h-5' },
                        ].map((platform) => (
                            <div key={platform.alt} className="opacity-40 grayscale transition-all hover:opacity-70 hover:grayscale-0">
                                <Image
                                    src={platform.src}
                                    alt={platform.alt}
                                    width={120}
                                    height={40}
                                    className={`${platform.h} w-auto`}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
