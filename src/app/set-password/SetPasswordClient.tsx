"use client";

import { useState } from "react";
import { validatePassword, passwordErrorMessage, PASSWORD_RULE_TEXT } from "@/lib/password-policy";

export function SetPasswordClient({ uid, token }: { uid: string; token: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const v = validatePassword(password);
    if (!v.ok) {
      setError(passwordErrorMessage(v));
      return;
    }
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, token, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || "Something went wrong. Please try again, or email info@getrealhealthpgd.co.uk.");
        return;
      }
      setDone(true);
    } catch (err) {
      console.error("[set-password]", err);
      setError("Something went wrong. Please try again, or email info@getrealhealthpgd.co.uk.");
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
          minLength={12}
          autoComplete="new-password"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
        />
        <p className="text-xs text-gray-500 mt-1">{PASSWORD_RULE_TEXT}</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={12}
          autoComplete="new-password"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
        />
        <p className="text-xs text-gray-500 mt-1">{PASSWORD_RULE_TEXT}</p>
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
