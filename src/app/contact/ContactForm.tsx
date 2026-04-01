"use client";

import { useState } from "react";

type Enquiry =
  | "demo"
  | "pricing"
  | "pgd-enquiry"
  | "patient-enquiry"
  | "other";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    pharmacyName: "",
    enquiryType: "" as Enquiry | "",
    message: "",
  });

  const update = (
    field: keyof typeof formData,
    value: string
  ) => setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, POST to an API route or service (e.g. Resend, SendGrid)
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="bg-teal-50 border border-teal-200 rounded-xl p-8 text-center">
        <svg
          className="w-12 h-12 text-teal-500 mx-auto mb-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="font-bold text-navy-900 text-lg mb-1">
          Message sent
        </h3>
        <p className="text-gray-600 text-sm">
          Thanks, {formData.name.split(" ")[0]}. We&apos;ll be in touch within
          one working day.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name + Email row */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-navy-900 mb-1"
          >
            Full name <span className="text-red-400">*</span>
          </label>
          <input
            id="name"
            type="text"
            required
            value={formData.name}
            onChange={(e) => update("name", e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
            placeholder="Your name"
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-navy-900 mb-1"
          >
            Email <span className="text-red-400">*</span>
          </label>
          <input
            id="email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => update("email", e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
            placeholder="you@example.com"
          />
        </div>
      </div>

      {/* Phone + Pharmacy */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-navy-900 mb-1"
          >
            Phone (optional)
          </label>
          <input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => update("phone", e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
            placeholder="07..."
          />
        </div>
        <div>
          <label
            htmlFor="pharmacy"
            className="block text-sm font-medium text-navy-900 mb-1"
          >
            Pharmacy name (optional)
          </label>
          <input
            id="pharmacy"
            type="text"
            value={formData.pharmacyName}
            onChange={(e) => update("pharmacyName", e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
            placeholder="e.g. Well Pharmacy, Kamsons"
          />
        </div>
      </div>

      {/* Enquiry type */}
      <div>
        <label
          htmlFor="enquiry-type"
          className="block text-sm font-medium text-navy-900 mb-1"
        >
          What is this about? <span className="text-red-400">*</span>
        </label>
        <select
          id="enquiry-type"
          required
          value={formData.enquiryType}
          onChange={(e) => update("enquiryType", e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent bg-white"
        >
          <option value="" disabled>
            Select an option
          </option>
          <option value="demo">Book a demo</option>
          <option value="pricing">Pricing question</option>
          <option value="pgd-enquiry">PGD enquiry (pharmacists)</option>
          <option value="patient-enquiry">Patient enquiry</option>
          <option value="other">Something else</option>
        </select>
      </div>

      {/* Message */}
      <div>
        <label
          htmlFor="message"
          className="block text-sm font-medium text-navy-900 mb-1"
        >
          Message <span className="text-red-400">*</span>
        </label>
        <textarea
          id="message"
          required
          rows={5}
          value={formData.message}
          onChange={(e) => update("message", e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent resize-y"
          placeholder="Tell us how we can help..."
        />
      </div>

      <button
        type="submit"
        className="w-full sm:w-auto px-8 py-3 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-lg transition-colors text-sm"
      >
        Send message
      </button>

      <p className="text-xs text-gray-400">
        By submitting this form you agree to our privacy policy. We&apos;ll
        never share your data with third parties.
      </p>
    </form>
  );
}
