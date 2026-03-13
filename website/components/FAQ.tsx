'use client'

import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from '@/components/ui/accordion'

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
                            <Accordion>
                                {faqs.map((faq, index) => (
                                    <AccordionItem key={faq.question} value={`faq-${index}`}>
                                        <AccordionTrigger>{faq.question}</AccordionTrigger>
                                        <AccordionContent>
                                            <p>{faq.answer}</p>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
