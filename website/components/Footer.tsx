import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
    return (
        <footer className="border-t border-[--color-border-subtle]">
            <div className="mx-auto max-w-6xl px-6 py-12">
                <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-1">
                        <div className="mb-3 flex items-center gap-2.5">
                            <Image src="/icon128.png" alt="CaptureAI" width={24} height={24} />
                            <span className="text-sm font-semibold text-[--color-text]">CaptureAI</span>
                        </div>
                        <p className="text-sm leading-relaxed text-[--color-text-tertiary]">
                            AI-powered screenshot answers for students.
                        </p>
                    </div>

                    {/* Product */}
                    <div>
                        <h4 className="mb-3 text-sm font-medium text-[--color-text-secondary]">Product</h4>
                        <ul className="space-y-2">
                            <li><Link href="/#features" className="text-sm text-[--color-text-tertiary] transition-colors hover:text-[--color-text-secondary]">Features</Link></li>
                            <li><Link href="/#pricing" className="text-sm text-[--color-text-tertiary] transition-colors hover:text-[--color-text-secondary]">Pricing</Link></li>
                            <li><Link href="/download" className="text-sm text-[--color-text-tertiary] transition-colors hover:text-[--color-text-secondary]">Download</Link></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h4 className="mb-3 text-sm font-medium text-[--color-text-secondary]">Support</h4>
                        <ul className="space-y-2">
                            <li><Link href="/help" className="text-sm text-[--color-text-tertiary] transition-colors hover:text-[--color-text-secondary]">Help Center</Link></li>
                            <li><Link href="/contact" className="text-sm text-[--color-text-tertiary] transition-colors hover:text-[--color-text-secondary]">Contact</Link></li>
                            <li><a href="https://github.com/TheSuperiorFlash/CaptureAI" target="_blank" rel="noopener noreferrer" className="text-sm text-[--color-text-tertiary] transition-colors hover:text-[--color-text-secondary]">GitHub</a></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="mb-3 text-sm font-medium text-[--color-text-secondary]">Legal</h4>
                        <ul className="space-y-2">
                            <li><Link href="/privacy" className="text-sm text-[--color-text-tertiary] transition-colors hover:text-[--color-text-secondary]">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="text-sm text-[--color-text-tertiary] transition-colors hover:text-[--color-text-secondary]">Terms of Service</Link></li>
                        </ul>
                    </div>
                </div>

                {/* Bottom */}
                <div className="mt-10 border-t border-[--color-border-subtle] pt-6">
                    <p className="text-xs text-[--color-text-tertiary]">
                        &copy; {new Date().getFullYear()} CaptureAI. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    )
}
