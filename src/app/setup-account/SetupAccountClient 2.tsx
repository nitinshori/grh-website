"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function SetupAccountClient() {
  const params = useSearchParams();
  const router = useRouter();
  const id = params.get("id");
  const token = params.get("token");
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!id || !token) {
    return (
      <div className="bg-gray-50 min-h-screen p-8">
        <div className="max-w-md mx-auto bg-white border rounded-xl p-8 text-center">
          <h1 className="text-xl font-bold">Invalid setup link</h1>
          <p className="text-sm text-gray-600 mt-2">Please use the link from the welcome email.</p>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (pwd.length < 10) { setError("Password must be at least 10 characters."); return; }
    if (pwd !== pwd2) { setError("Passwords don't match."); return; }
    setBusy(true);
    try {
      const r = await fetch("/api/setup-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, token, password: pwd }),
      });
      const body = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) { setError(body.error || `${r.status}`); return; }
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    } finally { setBusy(false); }
  }

  if (done) {
    return (
      <div className="bg-gray-50 min-h-screen p-8">
        <div className="max-w-md mx-auto bg-white border rounded-xl p-8 text-center">
          <h1 className="text-xl font-bold text-teal-700">Account ready ✓</h1>
          <p className="text-sm text-gray-600 mt-2">Taking you to sign in…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-md mx-auto px-4 sm:px-6 py-16">
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">Set your password</h1>
          <p className="text-sm text-gray-600 mt-2">
            Welcome — choose a password to finish setting up your account.
          </p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Password (10+ characters)</label>
              <input
                type="password"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                autoComplete="new-password"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Confirm password</label>
              <input
                type="password"
                value={pwd2}
                onChange={(e) => setPwd2(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                autoComplete="new-password"
                required
              />
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>
            )}
            <button
              type="submit"
              disabled={busy}
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 text-white font-semibold rounded-lg"
            >
              {busy ? "Setting up…" : "Set password and sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
