"use client";

import { useState } from "react";

// Practice Digital lead form. Posts to the existing /api/contact pipeline
// with enquiryType "growth" — same rate limiting, notification email and
// auto-reply as the main contact form. Selected services are folded into
// the message body.

const SERVICES = [
  "Patient-facing service pages / website",
  "Google Ads & local SEO",
  "Social media content",
  "Patient email & SMS campaigns",
  "AI phone receptionist (call answering + booking)",
  "Not sure — recommend a plan",
];

export function GrowthForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    pharmacyName: "",
    message: "",
  });
  const [services, setServices] = useState<string[]>([]);

  const update = (field: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const toggle = (s: string) =>
    setServices((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const message = [
        services.length > 0 ? `Interested in: ${services.join("; ")}` : null,
        form.message.trim() || null,
      ]
        .filter(Boolean)
        .join("\n\n") || "General Practice Digital enquiry";
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          pharmacyName: form.pharmacyName,
          enquiryType: "growth",
          message,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }
      setSubmitted(true);
    } catch {
      setError(
        "Unable to send your message. Please try again or email us directly at info@getrealhealthpgd.co.uk.",
      );
      setLoading(false);
    }
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
        <h3 className="font-bold text-navy-900 text-lg mb-1">Request received</h3>
        <p className="text-gray-600 text-sm">
          Thanks, {form.name.split(" ")[0]}. The Practice Digital team will be
          in touch within one working day with a growth plan for your pharmacy.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="g-name" className="block text-sm font-medium text-navy-900 mb-1">
            Full name <span className="text-red-400">*</span>
          </label>
          <input
            id="g-name"
            type="text"
            required
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
            placeholder="Your name"
          />
        </div>
        <div>
          <label htmlFor="g-email" className="block text-sm font-medium text-navy-900 mb-1">
            Email <span className="text-red-400">*</span>
          </label>
          <input
            id="g-email"
            type="email"
            required
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
            placeholder="you@yourpharmacy.co.uk"
          />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="g-phone" className="block text-sm font-medium text-navy-900 mb-1">
            Phone (optional)
          </label>
          <input
            id="g-phone"
            type="tel"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
            placeholder="07..."
          />
        </div>
        <div>
          <label htmlFor="g-pharmacy" className="block text-sm font-medium text-navy-900 mb-1">
            Pharmacy name (optional)
          </label>
          <input
            id="g-pharmacy"
            type="text"
            value={form.pharmacyName}
            onChange={(e) => update("pharmacyName", e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
            placeholder="e.g. Highfield Pharmacy"
          />
        </div>
      </div>

      <fieldset>
        <legend className="block text-sm font-medium text-navy-900 mb-2">
          What would help you most? (tick any)
        </legend>
        <div className="grid sm:grid-cols-2 gap-2">
          {SERVICES.map((s) => (
            <label
              key={s}
              className={`flex items-start gap-2 p-3 rounded-lg border text-sm cursor-pointer transition-colors ${
                services.includes(s)
                  ? "border-teal-400 bg-teal-50 text-navy-900"
                  : "border-gray-200 hover:border-gray-300 text-gray-700"
              }`}
            >
              <input
                type="checkbox"
                checked={services.includes(s)}
                onChange={() => toggle(s)}
                className="mt-0.5 accent-teal-500"
              />
              {s}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="g-message" className="block text-sm font-medium text-navy-900 mb-1">
          Anything else? (optional)
        </label>
        <textarea
          id="g-message"
          rows={3}
          value={form.message}
          onChange={(e) => update("message", e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent resize-y"
          placeholder="Tell us about your pharmacy and what you want to grow…"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full sm:w-auto px-8 py-3 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors text-sm"
      >
        {loading ? "Sending…" : "Get my growth plan"}
      </button>
      <p className="text-xs text-gray-400">
        By submitting this form you agree to our privacy policy. We&apos;ll
        never share your data with third parties.
      </p>
    </form>
  );
}
