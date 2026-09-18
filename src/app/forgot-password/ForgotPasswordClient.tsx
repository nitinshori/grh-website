"use client";

import { useState } from "react";

export function ForgotPasswordClient() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || `Something went wrong (${res.status}). Please try again.`);
        return;
      }
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-green-50 border border-green-200 rounded-md text-sm text-green-900">
          If an account exists for <strong>{email}</strong>, a reset link is on its way. Check your
          junk folder if it has not arrived within a few minutes.
        </div>
        <p className="text-sm text-gray-600">
          Not received it, or not sure which email your account uses? Email{" "}
          <a href="mailto:info@getrealhealthpgd.co.uk" className="underline">
            info@getrealhealthpgd.co.uk
          </a>{" "}
          and we will sort it.
        </p>
        <a href="/login" className="inline-block text-sm font-medium text-teal-700 underline">
          Back to login
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="fp-email" className="block text-sm font-medium text-gray-700 mb-1">
          Email address
        </label>
        <input
          id="fp-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
        />
      </div>
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">{error}</div>
      )}
      <button
        type="submit"
        disabled={busy || !email}
        className="w-full px-4 py-2 bg-teal-600 text-white font-medium rounded-md hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {busy ? "Sending…" : "Send reset link"}
      </button>
      <p className="text-center text-sm">
        <a href="/login" className="text-gray-500 underline">
          Back to login
        </a>
      </p>
    </form>
  );
}
