"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center justify-center px-6 py-3 bg-white border border-gray-300 hover:border-teal-300 text-gray-700 rounded-lg font-semibold transition-colors"
    >
      Print or save as PDF
    </button>
  );
}
