import { Star } from 'lucide-react'

interface Testimonial {
    name: string
    role: string
    company: string
    content: string
    rating: number
    avatar?: string
}

const testimonials: Testimonial[] = [
    {
        name: 'Sarah Chen',
        role: 'Software Engineer',
        company: 'Tech Corp',
        content: 'CaptureAI has completely transformed how I debug code. Instead of spending minutes typing out error messages, I just screenshot and ask. Game changer!',
        rating: 5,
    },
    {
        name: 'Michael Torres',
        role: 'Student',
        company: 'MIT',
        content: 'As a student, this is invaluable. I can capture complex diagrams from lectures and get instant explanations. My study efficiency has doubled.',
        rating: 5,
    },
    {
        name: 'Emily Rodriguez',
        role: 'Product Manager',
        company: 'StartupXYZ',
        content: 'The AI analysis is incredibly accurate. I use it daily for analyzing user feedback screenshots and competitor research. Highly recommended!',
        rating: 5,
    },
]

export default function Testimonials() {
    return (
        <section className="py-24 bg-gradient-to-b from-[#08070e] to-gray-950/50 relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        Loved by thousands of users
                    </h2>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        See what our users are saying about CaptureAI
                    </p>
                </div>

                {/* Testimonials Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {testimonials.map((testimonial, index) => (
                        <div
                            key={index}
                            className="bg-gradient-to-b from-gray-900/50 to-gray-900/30 border border-gray-800 rounded-2xl p-8 backdrop-blur-sm hover:border-blue-500/50 transition-all"
                        >
                            {/* Rating */}
                            <div className="flex gap-1 mb-4">
                                {[...Array(testimonial.rating)].map((_, i) => (
                                    <Star key={i} className="w-5 h-5 fill-blue-400 text-blue-400" />
                                ))}
                            </div>

                            {/* Content */}
                            <p className="text-gray-300 mb-6 leading-relaxed">
                                "{testimonial.content}"
                            </p>

                            {/* Author */}
                            <div className="flex items-center">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mr-4 text-white font-bold">
                                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div>
                                    <div className="font-semibold text-white">{testimonial.name}</div>
                                    <div className="text-sm text-gray-400">
                                        {testimonial.role} at {testimonial.company}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
