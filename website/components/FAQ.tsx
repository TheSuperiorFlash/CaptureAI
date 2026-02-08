'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const faqs = [
    {
        question: 'Which browsers are supported?',
        answer: 'CaptureAI is built for Google Chrome only. It uses Chrome-specific extension APIs and has been tested exclusively on Chrome.',
    },
    {
        question: 'What happens when I hit the free tier limit?',
        answer: 'Free accounts get 10 requests per day. When you reach the limit, you can wait for the daily reset or upgrade to Pro for unlimited requests.',
    },
    {
        question: 'Can I upgrade or cancel anytime?',
        answer: 'Yes. You can upgrade to Pro at any point, and cancel your subscription whenever you want. No questions asked.',
    },
    {
        question: 'Is my data stored anywhere?',
        answer: 'Screenshots are processed securely and are not stored on our servers. We don\'t keep copies of your captured images or the questions they contain.',
    },
    {
        question: 'Will my school detect the extension?',
        answer: 'With Privacy Guard (Pro), the extension prevents quiz platforms from detecting its presence. Your browser activity logs appear as normal browsing.',
    },
    {
        question: 'How accurate are the answers?',
        answer: 'CaptureAI uses a capable AI model to analyze questions. Accuracy is high for most subjects, but we recommend reviewing answers as part of your study process.',
    },
]

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(null)

    return (
        <section className="relative py-24 md:py-32">
            <div className="divider-gradient absolute left-0 right-0 top-0" />
            <div className="mx-auto max-w-6xl px-6">
                <div className="grid gap-12 md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr]">
                    {/* Left column */}
                    <div>
                        <h2 className="mb-4">
                            <span className="text-gradient-static">FAQ</span>
                        </h2>
                        <p className="text-sm leading-relaxed text-[--color-text-tertiary]">
                            Common questions about the extension, pricing, and privacy.
                        </p>
                    </div>

                    {/* Right column — accordion */}
                    <div className="glass-card rounded-2xl p-1">
                        {faqs.map((faq, index) => (
                            <div key={index} className={index > 0 ? 'border-t border-white/[0.04]' : ''}>
                                <button
                                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-white/[0.02]"
                                >
                                    <span className="text-[15px] font-medium text-[--color-text]">
                                        {faq.question}
                                    </span>
                                    <ChevronDown
                                        className={`h-4 w-4 flex-shrink-0 text-[--color-text-tertiary] transition-transform duration-300 ease-out ${
                                            openIndex === index ? 'rotate-180' : ''
                                        }`}
                                    />
                                </button>
                                <div
                                    className={`grid transition-all duration-300 ease-out ${
                                        openIndex === index ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                                    }`}
                                >
                                    <div className="overflow-hidden">
                                        <p className="px-6 pb-5 text-sm leading-relaxed text-[--color-text-tertiary]">
                                            {faq.answer}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
