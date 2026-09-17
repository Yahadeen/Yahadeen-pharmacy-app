'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function PaymentFailedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [reason, setReason] = useState<string>('unknown');

  useEffect(() => {
    setReason(searchParams.get('reason') || 'unknown');
  }, [searchParams]);

  const getErrorMessage = (reason: string) => {
    switch (reason) {
      case 'no_reference':
        return 'No payment reference was provided.';
      case 'payment_failed':
        return 'The payment was not successful.';
      case 'no_order_id':
        return 'Could not find the associated order.';
      case 'update_failed':
        return 'Failed to update the order status.';
      case 'server_error':
        return 'A server error occurred.';
      default:
        return 'An unknown error occurred.';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
        <p className="text-gray-600 mb-6">{getErrorMessage(reason)}</p>
        <div className="space-y-3">
          <button
            onClick={() => router.push('/cart')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
          >
            Try Again
          </button>
          <button
            onClick={() => router.push('/')}
            className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-50 transition"
          >
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>}>
      <PaymentFailedContent />
    </Suspense>
  );
}
