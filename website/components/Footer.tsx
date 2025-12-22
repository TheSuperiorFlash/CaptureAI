import Link from 'next/link'

export default function Footer() {
    return (
        <footer className="bg-gradient-to-b from-[#08070e] to-black border-t border-gray-800/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center space-x-2 mb-4">
                            <img src="/icon128.png" alt="CaptureAI" className="w-8 h-8" />
                            <span className="text-xl font-bold text-white">CaptureAI</span>
                        </div>
                        <p className="text-gray-400 mb-4 max-w-md">
                            Get instant answers to any question. Screenshot, ask, and learn faster.
                        </p>
                    </div>

                    {/* Product */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Product</h3>
                        <ul className="space-y-2">
                            <li><Link href="/#features" className="text-gray-400 hover:text-blue-400 transition-colors">Features</Link></li>
                            <li><Link href="/pricing" className="text-gray-400 hover:text-blue-400 transition-colors">Pricing</Link></li>
                            <li><Link href="/download" className="text-gray-400 hover:text-blue-400 transition-colors">Download</Link></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Support</h3>
                        <ul className="space-y-2">
                            <li><Link href="/help" className="text-gray-400 hover:text-blue-400 transition-colors">Help</Link></li>
                            <li><Link href="/contact" className="text-gray-400 hover:text-blue-400 transition-colors">Contact</Link></li>
                            <li><a href="https://github.com/TheSuperiorFlash/CaptureAI" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors">GitHub</a></li>
                        </ul>
                    </div>
                </div>

                {/* Bottom */}
                <div className="border-t border-gray-800/50 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-gray-500">
                    <p>&copy; {new Date().getFullYear()} CaptureAI. All rights reserved.</p>
                    <div className="flex gap-4">
                        <Link href="/privacy" className="hover:text-blue-400 transition-colors">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-blue-400 transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}