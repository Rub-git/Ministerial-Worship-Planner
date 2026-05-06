'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';

export function AccountActivatedClient() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 py-12">
      {/* Centered Container */}
      <div className="w-full max-w-md flex flex-col items-center text-center">
        
        {/* Vertical Logo */}
        <div className="mb-10">
          <Image
            src="/assets/mwp-icon.svg"
            alt="Ministerial Worship Planner"
            width={96}
            height={96}
            className="mx-auto"
            priority
          />
          <h2 className="mt-4 text-xl font-semibold text-[#1E3A8A] tracking-tight">
            Ministerial Worship Planner
          </h2>
          <p className="mt-1 text-sm text-gray-500 italic">
            Structured Worship. Biblical Depth.
          </p>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 leading-snug mb-4">
          Your account has been successfully activated. Welcome.
        </h1>

        {/* Subtext */}
        <div className="text-base text-gray-600 leading-relaxed mb-10 space-y-3">
          <p>
            Your church&apos;s 30-day free trial has now begun.
          </p>
          <p>
            You may now begin organizing your worship programs with structure, clarity, and biblical depth.
          </p>
        </div>

        {/* Gold Button */}
        <button
          onClick={() => router.push('/')}
          className="px-8 py-3 bg-[#C9A227] text-white font-semibold rounded-lg hover:bg-[#B8911F] transition-colors focus:outline-none focus:ring-2 focus:ring-[#C9A227] focus:ring-offset-2"
        >
          Enter Dashboard
        </button>
      </div>
    </div>
  );
}
