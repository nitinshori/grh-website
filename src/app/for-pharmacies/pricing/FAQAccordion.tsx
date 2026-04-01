"use client";

import { useState } from "react";

interface FAQ {
  q: string;
  a: string;
}

export function FAQAccordion({ faqs }: { faqs: FAQ[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className="space-y-3">
      {faqs.map((faq, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={i}
            className="border border-gray-200 rounded-xl overflow-hidden transition-shadow hover:shadow-sm"
          >
            <button
              onClick={() => toggle(i)}
              className="w-full flex items-center justify-between px-6 py-4 text-left"
              aria-expanded={isOpen}
            >
              <span className="font-semibold text-navy-900 pr-4 text-sm sm:text-base">
                {faq.q}
              </span>
              <svg
                className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            <div
              className={`overflow-hidden transition-all duration-200 ${
                isOpen ? "max-h-96" : "max-h-0"
              }`}
            >
              <div className="px-6 pb-4">
                <p className="text-gray-600 text-sm leading-relaxed">
                  {faq.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
