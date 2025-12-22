import React from 'react';
import { Shield, Zap, Lock, Brain } from 'lucide-react';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
}

const features: Feature[] = [
  {
    icon: <Zap className="w-8 h-8" />,
    title: "Auto-Solve",
    description: "Automatically solve questions on supported sites. Save hours of study time.",
    gradient: "from-yellow-400 to-orange-500"
  },
  {
    icon: <Shield className="w-8 h-8" />,
    title: "Privacy Guard",
    description: "Your data is completely private and secure. We never store or share your information.",
    gradient: "from-green-400 to-emerald-500"
  },
  {
    icon: <Lock className="w-8 h-8" />,
    title: "Secure Integration",
    description: "Seamlessly integrate with your browser without installing suspicious software.",
    gradient: "from-blue-400 to-cyan-500"
  },
  {
    icon: <Brain className="w-8 h-8" />,
    title: "Smart Detection",
    description: "Intelligently detect and adapt to different question formats across platforms.",
    gradient: "from-purple-400 to-pink-500"
  }
];

export default function Features() {
  return (
    <div className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Why Choose CaptureAI?
          </h2>
          <p className="text-xl text-gray-600">
            Powerful features designed to enhance your learning experience
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
            >
              <div className={`bg-gradient-to-r ${feature.gradient} w-12 h-12 rounded-lg flex items-center justify-center text-white mb-4`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}