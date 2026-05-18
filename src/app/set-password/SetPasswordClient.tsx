"use client";

import { useState } from "react";

export function SetPasswordClient({ uid, token }: { uid: string; token: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, token, password }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || `Failed (${res.status})`);
        return;
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-green-50 border border-green-200 rounded-md text-sm text-green-900">
          ✓ Password set. You can now log in.
        </div>
        <a
          href="/login"
          className="inline-block px-4 py-2 bg-teal-600 text-white font-medium rounded-md hover:bg-teal-700"
        >
          Go to login
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
        />
        <p className="text-xs text-gray-500 mt-1">At least 8 characters.</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
        />
      </div>
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-900">{error}</div>
      )}
      <button
        type="submit"
        disabled={busy}
        className="w-full px-4 py-2 bg-teal-600 text-white font-medium rounded-md hover:bg-teal-700 disabled:opacity-60"
      >
        {busy ? "Setting…" : "Set password"}
      </button>
    </form>
  );
}
