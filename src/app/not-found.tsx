import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-bold text-teal-500 mb-4">404</p>
      <h1 className="text-2xl font-bold text-navy-900 mb-2">Page not found</h1>
      <p className="text-gray-500 mb-8 max-w-md">
        Sorry, we couldn&apos;t find the page you&apos;re looking for. It may
        have been moved or no longer exists.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/"
          className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-lg transition-colors"
        >
          Go to homepage
        </Link>
        <Link
          href="/contact"
          className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-navy-900 font-semibold rounded-lg transition-colors"
        >
          Contact us
        </Link>
      </div>
    </div>
  );
}
