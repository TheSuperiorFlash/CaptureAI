import Link from 'next/link'

export default function Footer() {
    return (
        <footer className="bg-gray-900 text-gray-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center space-x-2 mb-4">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg"></div>
                            <span className="text-xl font-bold text-white">CaptureAI</span>
                        </div>
                        <p className="text-gray-400 mb-4">
                            AI-powered screenshot analysis. Capture, ask, and get instant answers.
                        </p>
                    </div>

                    {/* Product */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Product</h3>
                        <ul className="space-y-2">
                            <li><Link href="/#features" className="hover:text-white transition-colors">Features</Link></li>
                            <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                            <li><Link href="/download" className="hover:text-white transition-colors">Download</Link></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Support</h3>
                        <ul className="space-y-2">
                            <li><Link href="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
                            <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                            <li><a href="mailto:support@captureai.com" className="hover:text-white transition-colors">Email Support</a></li>
                        </ul>
                    </div>
                </div>

                {/* Bottom */}
                <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
                    <p>&copy; {new Date().getFullYear()} CaptureAI. All rights reserved.</p>
                </div>
            </div>
        </footer>
    )
}