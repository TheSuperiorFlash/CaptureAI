'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export const faqs = [
    {
        question: 'Which browsers are supported?',
        answer: 'CaptureAI is built for Google Chrome only. It uses Chrome-specific extension APIs and has been tested exclusively on Chrome.',
    },
    {
        question: 'What happens when I hit the daily limit?',
        answer: 'Basic accounts get 50 requests per day. When you reach the limit, you can wait for the daily reset or upgrade to Pro for unlimited requests.',
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
        <section className="relative py-24 md:py-32 reveal-up overflow-x-clip">
            <div className="divider-gradient absolute left-0 right-0 top-0" />
            <div className="mx-auto max-w-6xl px-6">
                <div className="grid gap-12 md:grid-cols-[280px_1fr] lg:grid-cols-[360px_1fr]">
                    {/* Left column */}
                    <div className="reveal-up delay-100">
                        <h2 className="mb-5">
                            <span className="text-[--color-text]">FAQ</span>
                        </h2>
                        <p className="text-lg leading-relaxed text-[--color-text-tertiary] max-w-sm">
                            Answers to common questions about CaptureAI, our pricing, and how we protect your privacy.
                        </p>
                    </div>

                    {/* Right column — accordion */}
                    <div className="reveal-up delay-200">
                        <div className="glass-card rounded-3xl p-2 select-none">
                            {faqs.map((faq, index) => {
                                const panelId = `faq-panel-${index}`
                                const buttonId = `faq-button-${index}`
                                return (
                                    <div key={faq.question} className={index > 0 ? 'border-t border-white/[0.04]' : ''}>
                                        <button
                                            type="button"
                                            id={buttonId}
                                            aria-expanded={openIndex === index}
                                            aria-controls={panelId}
                                            onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                            className={`flex w-full items-center justify-between gap-4 px-6 py-6 text-left transition-colors hover:bg-white/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-cyan] focus-visible:bg-white/[0.02] ${index === 0 ? 'rounded-t-2xl' : index === faqs.length - 1 ? 'rounded-b-2xl' : 'rounded-none'}`}
                                        >
                                            <span className={`text-[16px] font-medium transition-colors ${openIndex === index ? 'text-[--color-text]' : 'text-[--color-text-secondary]'}`}>
                                                {faq.question}
                                            </span>
                                            <ChevronDown
                                                className={`h-4 w-4 flex-shrink-0 transition-all duration-300 ease-out ${openIndex === index ? 'rotate-180 text-cyan-400' : 'text-[--color-text-tertiary]'
                                                    }`}
                                            />
                                        </button>
                                        <section
                                            id={panelId}
                                            aria-labelledby={buttonId}
                                            aria-hidden={openIndex !== index}
                                            className={`grid transition-all duration-300 ease-out ${openIndex === index ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                                                }`}
                                        >
                                            <div className="overflow-hidden">
                                                <p className="px-6 pb-6 pt-1 text-[15px] leading-relaxed text-[--color-text-tertiary]">
                                                    {faq.answer}
                                                </p>
                                            </div>
                                        </section>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
