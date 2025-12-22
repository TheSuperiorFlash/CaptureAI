'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function ActivatePage() {
  const [email, setEmail] = useState('');
  const [selectedTier, setSelectedTier] = useState<'free' | 'pro'>('free');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    type: 'success' | 'error';
    message: string;
    existing?: boolean;
  } | null>(null);

  const handleSignup = async () => {
    // Validation
    if (!email) {
      setResult({ type: 'error', message: 'Please enter your email address' });
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setResult({ type: 'error', message: 'Please enter a valid email address' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      if (selectedTier === 'free') {
        await handleFreeSignup();
      } else {
        await handleProSignup();
      }
    } catch (error) {
      setResult({
        type: 'error',
        message: error instanceof Error ? error.message : 'An error occurred'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFreeSignup = async () => {
    const response = await fetch('https://backend.captureai.workers.dev/api/auth/create-free-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create account');
    }

    setResult({
      type: 'success',
      message: data.existing
        ? `We've sent your existing license key to ${email}`
        : `Your license key has been sent to ${email}`,
      existing: data.existing
    });
  };

  const handleProSignup = async () => {
    const response = await fetch('https://backend.captureai.workers.dev/api/subscription/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to start checkout');
    }

    // Redirect to Stripe checkout
    window.location.href = data.url;
  };

  return (
    <div className="min-h-screen bg-[#08070e] relative overflow-hidden flex items-center justify-center px-5 py-20">
      {/* Animated gradient blobs */}
      <div className="absolute top-[10%] left-[20%] w-[400px] h-[400px] bg-blue-500 rounded-full blur-[100px] opacity-30 animate-pulse-slow" />
      <div className="absolute bottom-[10%] right-[20%] w-[350px] h-[350px] bg-cyan-500 rounded-full blur-[100px] opacity-30 animate-pulse-slow [animation-delay:3s]" />

      <div className="relative z-10 w-full max-w-[550px]">
        <div className="bg-gradient-to-b from-gray-900/80 to-gray-900/90 backdrop-blur-xl border border-blue-500/20 p-11 rounded-[20px] shadow-2xl">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Image
                src="/icon128.png"
                alt="CaptureAI Logo"
                width={64}
                height={64}
              />
            </div>
            <h1 className="text-[32px] font-bold text-white mb-2">CaptureAI</h1>
          </div>

          <p className="text-gray-300 text-center mb-9 leading-relaxed text-base">
            Start solving questions instantly with AI-powered screenshot analysis
          </p>

          {/* Pricing Tabs */}
          <div className="flex gap-3 mb-8">
            <button
              onClick={() => setSelectedTier('free')}
              className={`flex-1 p-5 border rounded-xl transition-all cursor-pointer text-center ${
                selectedTier === 'free'
                  ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                  : 'border-gray-700/50 bg-gray-800/50 hover:border-blue-500/50 hover:bg-gray-800/70'
              }`}
            >
              <h3 className="text-lg text-white mb-2">Free</h3>
              <div className="text-2xl font-bold text-blue-400 mb-2">$0</div>
              <div className="text-[13px] text-gray-400 mb-3">forever</div>
              <ul className="list-none text-left space-y-1.5">
                <li className="text-[13px] text-gray-300 pl-5 relative before:content-['✓'] before:absolute before:left-0 before:text-blue-400 before:font-bold">
                  10 requests/day
                </li>
                <li className="text-[13px] text-gray-300 pl-5 relative before:content-['✓'] before:absolute before:left-0 before:text-blue-400 before:font-bold">
                  Screenshot capture
                </li>
                <li className="text-[13px] text-gray-300 pl-5 relative before:content-['✓'] before:absolute before:left-0 before:text-blue-400 before:font-bold">
                  AI question solving
                </li>
                <li className="text-[13px] text-gray-300 pl-5 relative before:content-['✓'] before:absolute before:left-0 before:text-blue-400 before:font-bold">
                  Privacy-focused
                </li>
              </ul>
            </button>

            <button
              onClick={() => setSelectedTier('pro')}
              className={`flex-1 p-5 border rounded-xl transition-all cursor-pointer text-center ${
                selectedTier === 'pro'
                  ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                  : 'border-gray-700/50 bg-gray-800/50 hover:border-blue-500/50 hover:bg-gray-800/70'
              }`}
            >
              <h3 className="text-lg text-white mb-2">
                Pro{' '}
                <span className="inline-block bg-gradient-to-r from-purple-500 to-purple-600 text-white text-[11px] px-2 py-0.5 rounded ml-2 font-semibold">
                  POPULAR
                </span>
              </h3>
              <div className="text-2xl font-bold text-blue-400 mb-2">$9.99</div>
              <div className="text-[13px] text-gray-400 mb-3">per month</div>
              <ul className="list-none text-left space-y-1.5">
                <li className="text-[13px] text-gray-300 pl-5 relative before:content-['✓'] before:absolute before:left-0 before:text-blue-400 before:font-bold">
                  Unlimited requests
                </li>
                <li className="text-[13px] text-gray-300 pl-5 relative before:content-['✓'] before:absolute before:left-0 before:text-blue-400 before:font-bold">
                  Priority AI processing
                </li>
                <li className="text-[13px] text-gray-300 pl-5 relative before:content-['✓'] before:absolute before:left-0 before:text-blue-400 before:font-bold">
                  Advanced features
                </li>
                <li className="text-[13px] text-gray-300 pl-5 relative before:content-['✓'] before:absolute before:left-0 before:text-blue-400 before:font-bold">
                  Email support
                </li>
              </ul>
            </button>
          </div>

          {/* Email Input */}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSignup()}
            placeholder="Enter your email address"
            autoComplete="email"
            className="w-full p-4 border border-gray-700/50 bg-gray-800/50 rounded-lg text-base text-white transition-all mb-4 placeholder:text-gray-500 focus:outline-none focus:border-blue-500 focus:bg-gray-800/70 focus:ring-4 focus:ring-blue-500/10"
          />

          {/* Submit Button */}
          <button
            onClick={handleSignup}
            disabled={loading}
            className={`w-full p-4 bg-gradient-to-r text-white border-none rounded-lg text-base font-semibold cursor-pointer transition-all shadow-[0_4px_12px_rgba(59,130,246,0.3)] ${
              selectedTier === 'free'
                ? 'from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                : 'from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800'
            } ${
              loading ? 'opacity-60 cursor-not-allowed' : 'hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(59,130,246,0.4)]'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </span>
            ) : selectedTier === 'free' ? (
              'Start Free Trial'
            ) : (
              'Subscribe to Pro - $9.99/month'
            )}
          </button>

          {/* Result Message */}
          {result && (
            <div
              className={`mt-6 p-5 rounded-xl animate-slide-in ${
                result.type === 'success'
                  ? 'bg-green-500/10 border border-green-500/50'
                  : 'bg-red-500/10 border border-red-500/50'
              }`}
            >
              {result.type === 'success' ? (
                <>
                  <div className="text-center text-5xl mb-4">📧</div>
                  <h3 className="text-green-400 mb-3 text-lg font-semibold">
                    {result.existing ? '✅ Welcome Back!' : '✅ Check Your Email!'}
                  </h3>
                  <p className="text-gray-300 mb-4 leading-relaxed">
                    {result.message}
                  </p>
                  <p className="text-gray-300 mb-4 leading-relaxed">
                    <strong>Next steps:</strong>
                    <br />
                    1. Check your email inbox
                    <br />
                    2. Copy your license key
                    <br />
                    3. Open the CaptureAI extension
                    <br />
                    4. Paste and activate!
                  </p>
                  <p className="text-[13px] text-gray-500 mt-4">
                    Don&apos;t see the email? Check your spam folder.
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-red-400 mb-3 text-lg font-semibold">❌ Error</h3>
                  <p className="text-gray-300">{result.message}</p>
                </>
              )}
            </div>
          )}

          {/* Footer Note */}
          <div className="text-center mt-5 pt-5 border-t border-gray-700/30 text-gray-400 text-sm">
            Already have a license key?{' '}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                alert('Open the CaptureAI extension popup to activate your license key');
              }}
              className="text-blue-400 no-underline font-medium transition-colors hover:text-blue-500 hover:underline"
            >
              Activate in extension
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-gray-400 text-sm">
          <p>
            Need help?{' '}
            <a
              href="https://github.com/TheSuperiorFlash/CaptureAI"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 no-underline transition-colors hover:text-blue-500 hover:underline"
            >
              Visit our GitHub
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
