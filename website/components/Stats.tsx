import { Users, Zap, Clock, TrendingUp } from 'lucide-react'

interface Stat {
    icon: typeof Users
    value: string
    label: string
    suffix?: string
}

const stats: Stat[] = [
    {
        icon: Users,
        value: '10,000',
        label: 'Active Users',
        suffix: '+',
    },
    {
        icon: Zap,
        value: '500K',
        label: 'Screenshots Analyzed',
        suffix: '+',
    },
    {
        icon: Clock,
        value: '95',
        label: 'Average Response Time',
        suffix: '%',
    },
    {
        icon: TrendingUp,
        value: '4.8',
        label: 'User Rating',
        suffix: '/5',
    },
]

export default function Stats() {
    return (
        <section className="py-24 bg-[#08070e] relative">
            {/* Subtle grid pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b08_1px,transparent_1px),linear-gradient(to_bottom,#1e293b08_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {stats.map((stat, index) => {
                        const Icon = stat.icon
                        return (
                            <div
                                key={index}
                                className="text-center group"
                            >
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl mb-4 group-hover:bg-blue-500/20 transition-all">
                                    <Icon className="w-8 h-8 text-blue-400" />
                                </div>
                                <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                                    {stat.value}
                                    {stat.suffix && (
                                        <span className="text-blue-400">{stat.suffix}</span>
                                    )}
                                </div>
                                <div className="text-gray-400 font-medium">{stat.label}</div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
