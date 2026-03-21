import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
    return (
        <footer className="relative reveal-up overflow-x-clip">
            {/* Gradient top border */}
            <div className="divider-gradient" />

            {/* Subtle glow behind footer */}
            <div className="pointer-events-none absolute left-1/2 top-0 h-[300px] w-[800px] -translate-x-1/2 rounded-full bg-[#0047ff] opacity-[0.05] blur-[120px]" />

            <div className="relative mx-auto max-w-6xl px-6 py-16 md:py-24">
                <div className="grid grid-cols-2 gap-12 md:grid-cols-4 reveal-up delay-100">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-1">
                        <div className="mb-4 flex items-center gap-3">
                            <Image src="/logo.svg" alt="CaptureAI" width={28} height={28} />
                            <span className="text-[17px] font-semibold tracking-tight text-[--color-text]">CaptureAI</span>
                        </div>
                        <p className="text-[15px] leading-relaxed text-[--color-text-tertiary] max-w-[200px]">
                            AI-powered answers delivered instantly.
                        </p>
                    </div>

                    {/* Product */}
                    <div>
                        <h4 className="mb-5 text-[15px] font-semibold tracking-wide text-[--color-text]">Product</h4>
                        <ul className="space-y-3.5">
                            <li><Link href="/#features" className="text-[15px] font-medium text-[--color-text-tertiary] transition-colors duration-200 hover:text-cyan-400">Features</Link></li>
                            <li><Link href="/#pricing" className="text-[15px] font-medium text-[--color-text-tertiary] transition-colors duration-200 hover:text-cyan-400">Pricing</Link></li>
                            <li><Link href="/download" className="text-[15px] font-medium text-[--color-text-tertiary] transition-colors duration-200 hover:text-cyan-400">Download</Link></li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h4 className="mb-5 text-[15px] font-semibold tracking-wide text-[--color-text]">Resources</h4>
                        <ul className="space-y-3.5">
                            <li><Link href="/blog" className="text-[15px] font-medium text-[--color-text-tertiary] transition-colors duration-200 hover:text-cyan-400">Blog</Link></li>
                            <li><Link href="/help" className="text-[15px] font-medium text-[--color-text-tertiary] transition-colors duration-200 hover:text-cyan-400">Help Center</Link></li>
                            <li><Link href="/contact" className="text-[15px] font-medium text-[--color-text-tertiary] transition-colors duration-200 hover:text-cyan-400">Contact</Link></li>
                            <li><a href="https://github.com/TheSuperiorFlash/CaptureAI" target="_blank" rel="noopener noreferrer" className="text-[15px] font-medium text-[--color-text-tertiary] transition-colors duration-200 hover:text-cyan-400">GitHub</a></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="mb-5 text-[15px] font-semibold tracking-wide text-[--color-text]">Legal</h4>
                        <ul className="space-y-3.5">
                            <li><Link href="/privacy" className="text-[15px] font-medium text-[--color-text-tertiary] transition-colors duration-200 hover:text-cyan-400">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="text-[15px] font-medium text-[--color-text-tertiary] transition-colors duration-200 hover:text-cyan-400">Terms of Service</Link></li>
                        </ul>
                    </div>
                </div>

                {/* Bottom */}
                <div className="mt-20 border-t border-white/[0.04] pt-8 reveal-up delay-200">
                    <p className="text-[14px] text-[--color-text-tertiary]">
                        &copy; {new Date().getFullYear()} CaptureAI. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    )
}
