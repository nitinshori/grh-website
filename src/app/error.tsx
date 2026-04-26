"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to Sentry or console in production
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-bold text-red-400 mb-4">500</p>
      <h1 className="text-2xl font-bold text-navy-900 mb-2">
        Something went wrong
      </h1>
      <p className="text-gray-500 mb-8 max-w-md">
        We&apos;re sorry — an unexpected error occurred. Please try again, and
        if the problem persists, get in touch.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={reset}
          className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-lg transition-colors"
        >
          Try again
        </button>
        <Link
          href="/"
          className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-navy-900 font-semibold rounded-lg transition-colors"
        >
          Go to homepage
        </Link>
      </div>
    </div>
  );
}
