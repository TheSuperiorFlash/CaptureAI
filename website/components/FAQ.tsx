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
        <section className="border-t border-[--color-border-subtle] py-20 md:py-28">
            <div className="mx-auto max-w-6xl px-6">
                <div className="grid gap-12 md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr]">
                    {/* Left column */}
                    <div>
                        <h2 className="mb-3 text-[--color-text]">FAQ</h2>
                        <p className="text-sm text-[--color-text-tertiary]">
                            Common questions about the extension, pricing, and privacy.
                        </p>
                    </div>

                    {/* Right column — accordion */}
                    <div className="divide-y divide-[--color-border-subtle]">
                        {faqs.map((faq, index) => (
                            <div key={index}>
                                <button
                                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                    className="flex w-full items-center justify-between gap-4 py-5 text-left"
                                >
                                    <span className="text-[15px] font-medium text-[--color-text]">
                                        {faq.question}
                                    </span>
                                    <ChevronDown
                                        className={`h-4 w-4 flex-shrink-0 text-[--color-text-tertiary] transition-transform duration-200 ${
                                            openIndex === index ? 'rotate-180' : ''
                                        }`}
                                    />
                                </button>
                                <div
                                    className={`overflow-hidden transition-all duration-200 ${
                                        openIndex === index ? 'max-h-48 pb-5' : 'max-h-0'
                                    }`}
                                >
                                    <p className="text-sm leading-relaxed text-[--color-text-tertiary]">
                                        {faq.answer}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
