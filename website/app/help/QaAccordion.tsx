'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'

type QaItem = { q: string; a: ReactNode };

export default function QaAccordion({ items }: { items: QaItem[] }) {
    const [openIndex, setOpenIndex] = useState<number | null>(null)

    return (
        <div className="rounded-2xl overflow-hidden">
            {items.map((item, index) => {
                const panelId = `qa-panel-${index}`
                const buttonId = `qa-button-${index}`
                return (
                    <div key={index} className={index > 0 ? 'border-t border-white/[0.04]' : ''}>
                        <button
                            type="button"
                            id={buttonId}
                            aria-expanded={openIndex === index}
                            aria-controls={panelId}
                            onClick={() => setOpenIndex(openIndex === index ? null : index)}
                            className="flex w-full items-center justify-between gap-4 py-5 text-left transition-colors hover:bg-white/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-cyan] focus-visible:bg-white/[0.02]"
                        >
                            <span className={`text-sm font-medium transition-colors ${openIndex === index ? 'text-[--color-text]' : 'text-[--color-text-secondary]'}`}>
                                {item.q}
                            </span>
                            <ChevronDown
                                className={`h-4 w-4 flex-shrink-0 transition-all duration-300 ease-out ${openIndex === index ? 'rotate-180 text-cyan-400' : 'text-[--color-text-tertiary]'}`}
                            />
                        </button>
                        <section
                            id={panelId}
                            aria-labelledby={buttonId}
                            aria-hidden={openIndex !== index}
                            className={`grid transition-all duration-300 ease-out ${openIndex === index ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                        >
                            <div className="overflow-hidden">
                                <p className="pb-5 pt-1 text-sm leading-relaxed text-[--color-text-tertiary]">
                                    {item.a}
                                </p>
                            </div>
                        </section>
                    </div>
                )
            })}
        </div>
    )
}
