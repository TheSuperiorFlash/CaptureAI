'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const verifyPayment = async () => {
      const sessionId = searchParams.get('session_id');

      if (!sessionId) {
        setStatus('error');
        setErrorMessage('No session ID provided');
        return;
      }

      try {
        const response = await fetch(
          'https://backend.captureai.workers.dev/api/subscription/verify-payment',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId })
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Payment verification failed');
        }

        setStatus('success');
      } catch (error) {
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'An error occurred');
      }
    };

    verifyPayment();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[#08070e] relative overflow-hidden flex items-center justify-center px-5 py-20">
      {/* Animated gradient blobs */}
      <div className="absolute top-[10%] left-[20%] w-[400px] h-[400px] bg-blue-500 rounded-full blur-[100px] opacity-30 animate-pulse-slow" />
      <div className="absolute bottom-[10%] right-[20%] w-[350px] h-[350px] bg-green-500 rounded-full blur-[100px] opacity-30 animate-pulse-slow [animation-delay:3s]" />

      <div className="relative z-10 w-full max-w-[500px]">
        <div className="bg-gradient-to-b from-gray-900/80 to-gray-900/90 backdrop-blur-xl border border-blue-500/20 rounded-2xl shadow-2xl p-12 text-center">
          {/* Loading State */}
          {status === 'loading' && (
            <div className="flex items-center justify-center gap-3 text-gray-300 text-base p-5">
              <div className="w-6 h-6 border-[3px] border-gray-700/30 border-t-blue-500 rounded-full animate-spin" />
              <span>Verifying your payment...</span>
            </div>
          )}

          {/* Success State */}
          {status === 'success' && (
            <>
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-scale-in shadow-[0_8px_24px_rgba(16,185,129,0.4)]">
                <div className="text-white text-5xl font-bold">✓</div>
              </div>

              <h1 className="text-[32px] font-bold text-white mb-4">Payment Successful!</h1>
              <p className="text-lg text-gray-300 mb-8">
                Check your email for your Pro license key
              </p>

              <div className="inline-block bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-full text-base font-semibold mb-8 uppercase tracking-wide shadow-[0_4px_12px_rgba(139,92,246,0.3)]">
                PRO TIER
              </div>

              <div className="bg-gray-800/50 border border-gray-700/30 rounded-xl p-6 mb-8 text-left">
                <h3 className="text-base font-semibold text-white mb-4">Next Steps:</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-[0_2px_8px_rgba(59,130,246,0.3)]">
                      1
                    </div>
                    <span className="text-sm text-gray-300">
                      Check your email for your Pro license key
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-[0_2px_8px_rgba(59,130,246,0.3)]">
                      2
                    </div>
                    <span className="text-sm text-gray-300">
                      Open the CaptureAI extension
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-[0_2px_8px_rgba(59,130,246,0.3)]">
                      3
                    </div>
                    <span className="text-sm text-gray-300">
                      Enter your license key to activate Pro features
                    </span>
                  </div>
                </div>
              </div>

              <Link
                href="/activate"
                className="inline-block w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-8 rounded-lg text-base font-semibold no-underline transition-all shadow-[0_4px_12px_rgba(59,130,246,0.3)] hover:-translate-y-0.5 hover:from-blue-700 hover:to-blue-800 hover:shadow-[0_8px_20px_rgba(59,130,246,0.4)]"
              >
                Return to Activation Page
              </Link>
            </>
          )}

          {/* Error State */}
          {status === 'error' && (
            <>
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-scale-in">
                <div className="text-white text-5xl font-bold">✗</div>
              </div>

              <h1 className="text-[32px] font-bold text-white mb-4">
                Payment Verification Failed
              </h1>
              <p className="text-lg text-gray-300 mb-8">
                We couldn&apos;t verify your payment
              </p>

              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg mb-8 text-sm">
                {errorMessage}
              </div>

              <Link
                href="/activate"
                className="inline-block w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-4 px-8 rounded-lg text-base font-semibold no-underline transition-all shadow-[0_4px_12px_rgba(239,68,68,0.3)] hover:-translate-y-0.5 hover:from-red-700 hover:to-red-800 hover:shadow-[0_8px_20px_rgba(239,68,68,0.4)]"
              >
                Return to Activation Page
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#08070e] flex items-center justify-center">
        <div className="w-6 h-6 border-[3px] border-gray-700/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
