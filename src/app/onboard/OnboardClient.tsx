"use client";

import { useEffect, useRef, useState } from "react";

// Cloudflare Turnstile script tag is added once on first render.
// Site key is exposed via NEXT_PUBLIC_TURNSTILE_SITE_KEY (safe to publish).
const TURNSTILE_SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js";
declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: { sitekey: string; callback: (token: string) => void; "error-callback"?: () => void }
      ) => string;
      reset: (id: string) => void;
    };
  }
}

type Step = 1 | 2 | 3;

interface FormState {
  pharmacyName: string;
  pharmacyAddress: string;
  pharmacyPostcode: string;
  pharmacyPhone: string;
  pharmacyEmail: string;
  pharmacyGphc: string;
  pharmacyOdsCode: string;
  contactFirstName: string;
  contactLastName: string;
  contactEmail: string;
  contactPhone: string;
  contactGphc: string;
  contactRole: string;
}

const initial: FormState = {
  pharmacyName: "",
  pharmacyAddress: "",
  pharmacyPostcode: "",
  pharmacyPhone: "",
  pharmacyEmail: "",
  pharmacyGphc: "",
  pharmacyOdsCode: "",
  contactFirstName: "",
  contactLastName: "",
  contactEmail: "",
  contactPhone: "",
  contactGphc: "",
  contactRole: "owner",
};

export default function OnboardClient() {
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  // Onboarding row id — persists across step transitions so we can update the
  // same draft as the user progresses, and re-use it for the GoCardless flow.
  const [onboardingId, setOnboardingId] = useState<string | null>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetIdRef = useRef<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  // Mount Turnstile when the user reaches step 3 (DD).
  useEffect(() => {
    if (step !== 3 || !siteKey || !turnstileRef.current) return;
    function render() {
      if (!window.turnstile || !turnstileRef.current) return;
      // Avoid double-render on rerenders
      if (turnstileWidgetIdRef.current) return;
      turnstileWidgetIdRef.current = window.turnstile.render(turnstileRef.current, {
        sitekey: siteKey!,
        callback: (token: string) => setTurnstileToken(token),
        "error-callback": () => setTurnstileToken(null),
      });
    }
    if (window.turnstile) {
      render();
    } else {
      const existing = document.querySelector(`script[src="${TURNSTILE_SCRIPT}"]`);
      if (!existing) {
        const s = document.createElement("script");
        s.src = TURNSTILE_SCRIPT;
        s.async = true;
        s.defer = true;
        s.onload = render;
        document.head.appendChild(s);
      } else {
        existing.addEventListener("load", render);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);
  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const canStep1 = form.pharmacyName.trim().length > 1 && form.pharmacyEmail.includes("@");
  const canStep2 =
    form.contactFirstName.trim().length > 0 &&
    form.contactLastName.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail);

  /**
   * Persist whatever's been entered so far. Called when the user clicks Next
   * on step 1 (captures pharmacy details) or step 2 (captures pharmacist).
   * On the very first call we don't have a turnstile token yet — the server
   * skips captcha verification when no `id` is present AND no token? No — we
   * pass `step` so the server allows partial saves without captcha gating.
   * The captcha runs only on step 3 before the GoCardless redirect.
   */
  async function saveStep(stepNum: 1 | 2): Promise<boolean> {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          step: stepNum,
          id: onboardingId ?? undefined,
        }),
      });
      const body = (await res.json()) as { id?: string; error?: string };
      if (!res.ok || !body.id) {
        throw new Error(body.error || "Couldn't save your progress. Please try again.");
      }
      if (body.id !== onboardingId) setOnboardingId(body.id);
      setBusy(false);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
      return false;
    }
  }

  async function handleStep1Next() {
    if (!canStep1) return;
    const ok = await saveStep(1);
    if (ok) setStep(2);
  }

  async function handleStep2Next() {
    if (!canStep2) return;
    const ok = await saveStep(2);
    if (ok) setStep(3);
  }

  async function handleStartDirectDebit() {
    setBusy(true);
    setError(null);
    try {
      // We may already have an onboarding row from the step-1/step-2 saves.
      // Make sure step 2 data is committed (idempotent — server resolves by id)
      // and capture the captcha token now.
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          step: 2,
          id: onboardingId ?? undefined,
          turnstileToken,
        }),
      });
      const body = (await res.json()) as { id?: string; error?: string };
      if (!res.ok || !body.id) {
        throw new Error(body.error || "Could not start sign-up");
      }
      const id = body.id;
      if (id !== onboardingId) setOnboardingId(id);

      // Now create the GoCardless redirect flow
      const ddRes = await fetch(`/api/onboarding/${id}/start-mandate`, { method: "POST" });
      const ddBody = (await ddRes.json()) as { redirectUrl?: string; error?: string };
      if (!ddRes.ok || !ddBody.redirectUrl) {
        throw new Error(ddBody.error || "Could not start direct debit");
      }
      window.location.href = ddBody.redirectUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Sign up your pharmacy</h1>
          <p className="text-sm text-gray-600 mt-2">
            Three short steps. One flat monthly fee. Every PGD included.
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex-1 flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step >= n ? "bg-teal-600 text-white" : "bg-gray-200 text-gray-500"
                }`}
              >
                {n}
              </div>
              <span className={`text-sm ${step >= n ? "text-gray-900" : "text-gray-400"}`}>
                {n === 1 ? "Pharmacy" : n === 2 ? "Pharmacist" : "Direct Debit"}
              </span>
              {n < 3 && <div className="flex-1 h-px bg-gray-200" />}
            </div>
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 shadow-sm">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Pharmacy details</h2>
              <Input label="Pharmacy name *" value={form.pharmacyName} onChange={set("pharmacyName")} placeholder="High Street Pharmacy" />
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="GPhC premises number" value={form.pharmacyGphc} onChange={set("pharmacyGphc")} placeholder="1234567" />
                <Input label="ODS code (optional)" value={form.pharmacyOdsCode} onChange={set("pharmacyOdsCode")} placeholder="FXXXX" />
              </div>
              <Input label="Address" value={form.pharmacyAddress} onChange={set("pharmacyAddress")} placeholder="123 High Street, Town" />
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Postcode" value={form.pharmacyPostcode} onChange={set("pharmacyPostcode")} placeholder="SW1A 1AA" />
                <Input label="Phone" value={form.pharmacyPhone} onChange={set("pharmacyPhone")} placeholder="01234 567890" type="tel" />
              </div>
              <Input label="Pharmacy email *" value={form.pharmacyEmail} onChange={set("pharmacyEmail")} placeholder="info@pharmacy.co.uk" type="email" />
              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                  {error}
                </div>
              )}
              <button
                disabled={!canStep1 || busy}
                onClick={handleStep1Next}
                className="w-full mt-4 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors"
              >
                {busy ? "Saving…" : "Next: pharmacist details"}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">About you</h2>
              <p className="text-sm text-gray-500">
                You'll be the primary account holder. Other pharmacists at this site can be added later.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="First name *" value={form.contactFirstName} onChange={set("contactFirstName")} />
                <Input label="Last name *" value={form.contactLastName} onChange={set("contactLastName")} />
              </div>
              <Input label="Email *" value={form.contactEmail} onChange={set("contactEmail")} placeholder="you@pharmacy.co.uk" type="email" />
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Mobile" value={form.contactPhone} onChange={set("contactPhone")} type="tel" />
                <Input label="GPhC registration number" value={form.contactGphc} onChange={set("contactGphc")} placeholder="2099001" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Your role</label>
                <select
                  value={form.contactRole}
                  onChange={set("contactRole")}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                >
                  <option value="owner">Owner / Director</option>
                  <option value="superintendent">Superintendent pharmacist</option>
                  <option value="manager">Pharmacy manager</option>
                  <option value="other">Other</option>
                </select>
              </div>
              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                  {error}
                </div>
              )}
              <div className="flex gap-3 mt-4">
                <button onClick={() => setStep(1)} disabled={busy} className="px-5 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50">
                  Back
                </button>
                <button
                  disabled={!canStep2 || busy}
                  onClick={handleStep2Next}
                  className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors"
                >
                  {busy ? "Saving…" : "Next: direct debit"}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Set up your direct debit</h2>
              <p className="text-sm text-gray-600">
                We collect the monthly fee by direct debit through GoCardless. You'll be redirected to a secure GoCardless page where you enter your bank details. Nothing is charged until your account is approved and active.
              </p>
              <ul className="text-sm text-gray-600 space-y-1.5 list-disc list-inside ml-2">
                <li>You can cancel any time with 30 days' notice</li>
                <li>Protected by the UK Direct Debit Guarantee</li>
                <li>No charges while we review your application</li>
              </ul>
              {siteKey && (
                <div className="pt-2">
                  <div ref={turnstileRef} />
                </div>
              )}
              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                  {error}
                </div>
              )}
              <div className="flex gap-3 mt-4">
                <button onClick={() => setStep(2)} disabled={busy} className="px-5 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50">
                  Back
                </button>
                <button
                  onClick={handleStartDirectDebit}
                  disabled={busy || (!!siteKey && !turnstileToken)}
                  className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors"
                  title={siteKey && !turnstileToken ? "Complete the captcha first" : undefined}
                >
                  {busy ? "Redirecting to GoCardless…" : "Continue to GoCardless →"}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-500 mt-6 text-center">
          Already have an account? <a href="/login" className="text-teal-700 hover:underline">Sign in</a>
        </p>
      </div>
    </div>
  );
}

function Input({
  label, value, onChange, placeholder, type = "text",
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-900 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
      />
    </div>
  );
}
