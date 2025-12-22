import type { Metadata } from 'next'
import Link from 'next/link'
import { Check } from 'lucide-react'

export const metadata: Metadata = {
    title: 'Pricing - CaptureAI',
    description: 'Choose the perfect plan for your needs. Start free, upgrade anytime.',
}

interface Plan {
    name: string
    price: string
    period: string
    description: string
    features: string[]
    cta: string
    href: string
    popular: boolean
}

const plans: Plan[] = [
    {
        name: 'Free',
        price: '$0',
        period: 'forever',
        description: 'Perfect for trying out CaptureAI',
        features: [
            '10 AI requests per day',
            'Basic screenshot capture',
            'Email support',
            'Privacy-focused processing',
        ],
        cta: 'Get Started',
        href: '/download',
        popular: false,
    },
    {
        name: 'Pro',
        price: '$9.99',
        period: 'per month',
        description: 'For power users who need unlimited access',
        features: [
            'Unlimited AI requests',
            'Advanced capture modes',
            'Priority support',
            'Usage analytics',
            'Early access to new features',
            'Cancel anytime',
        ],
        cta: 'Start Free Trial',
        href: '/download',
        popular: true,
    },
]

export default function PricingPage() {
    return (
        <div className="py-24 bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-5xl font-bold text-gray-900 mb-4">
                        Simple, transparent pricing
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Start free, upgrade when you're ready. No credit card required.
                    </p>
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {plans.map((plan) => (
                        <div
                            key={plan.name}
                            className={`relative rounded-2xl p-8 ${
                                plan.popular
                                    ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-2xl scale-105'
                                    : 'bg-white border-2 border-gray-200'
                            }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className={`text-2xl font-bold mb-2 ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                                    {plan.name}
                                </h3>
                                <div className="flex items-baseline mb-2">
                  <span className={`text-5xl font-bold ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                    {plan.price}
                  </span>
                                    <span className={`ml-2 ${plan.popular ? 'text-blue-100' : 'text-gray-600'}`}>
                    {plan.period}
                  </span>
                                </div>
                                <p className={plan.popular ? 'text-blue-100' : 'text-gray-600'}>
                                    {plan.description}
                                </p>
                            </div>

                            <ul className="space-y-4 mb-8">
                                {plan.features.map((feature, index) => (
                                    <li key={index} className="flex items-start">
                                        <Check className={`w-5 h-5 mr-3 flex-shrink-0 ${plan.popular ? 'text-white' : 'text-blue-600'}`} />
                                        <span className={plan.popular ? 'text-white' : 'text-gray-700'}>
                      {feature}
                    </span>
                                    </li>
                                ))}
                            </ul>

                            <Link
                                href={plan.href}
                                className={`block w-full py-4 rounded-lg text-center font-semibold transition-all ${
                                    plan.popular
                                        ? 'bg-white text-blue-600 hover:bg-gray-100'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                            >
                                {plan.cta}
                            </Link>
                        </div>
                    ))}
                </div>

                {/* FAQ Section */}
                <div className="mt-24 max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                        Frequently Asked Questions
                    </h2>
                    <div className="space-y-6">
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Can I upgrade or downgrade anytime?
                            </h3>
                            <p className="text-gray-600">
                                Yes! You can upgrade to Pro anytime, and cancel your subscription whenever you want.
                                No questions asked.
                            </p>
                        </div>
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                What happens when I hit the free tier limit?
                            </h3>
                            <p className="text-gray-600">
                                You'll receive a notification when you approach your daily limit. You can either wait
                                for the daily reset or upgrade to Pro for unlimited requests.
                            </p>
                        </div>
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Is my data secure?
                            </h3>
                            <p className="text-gray-600">
                                Absolutely. We process screenshots securely and never store them on our servers.
                                Your privacy is our top priority.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}