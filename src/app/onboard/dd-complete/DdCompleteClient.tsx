"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { pushDataLayerEvent } from "@/lib/gtm";
import { trackAdsConversion } from "@/lib/google-ads";

type State = "loading" | "ok" | "already" | "error";

export default function DdCompleteClient() {
  const params = useSearchParams();
  const id = params.get("id");
  const token = params.get("token");
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    if (!id || !token) { setState("error"); return; }
    let cancelled = false;
    fetch(`/api/onboarding/${id}/complete-mandate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (r) => {
        const body = (await r.json().catch(() => ({}))) as { error?: string; alreadySetUp?: boolean };
        if (!r.ok) throw new Error("not confirmed");
        return !!body.alreadySetUp;
      })
      .then((alreadySetUp) => {
        if (cancelled) return;
        if (alreadySetUp) {
          // Refresh or second visit: no second conversion.
          setState("already");
        } else {
          setState("ok");
          // Google Ads conversion: onboarding and GoCardless mandate complete.
          // The dataLayer push is for GTM, if a container is ever added.
          // trackAdsConversion reports it to Google Ads directly, which is
          // what actually records the conversion today.
          pushDataLayerEvent("onboard_complete");
          trackAdsConversion("signup");
        }
      })
      .catch((e) => {
        console.error("[dd-complete]", e);
        if (!cancelled) setState("error");
      });
    return () => { cancelled = true; };
  }, [id, token]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-16">
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm text-center">
          {state === "loading" && (
            <>
              <div className="text-2xl font-bold text-gray-900">Finalising your sign-up…</div>
              <p className="text-sm text-gray-500 mt-2">One moment.</p>
            </>
          )}
          {state === "ok" && (
            <>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-teal-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Application received</h1>
              <p className="text-sm text-gray-600 mt-3">
                Thanks. Your Direct Debit is set up and your application is now with us for review.
              </p>
              <p className="text-sm text-gray-600 mt-3">
                We usually approve accounts the same working day, then email your login link.
              </p>
              <p className="text-xs text-gray-500 mt-6">
                If you do not see our email, check your spam folder or contact <a href="mailto:info@getrealhealthpgd.co.uk" className="text-teal-700 underline">info@getrealhealthpgd.co.uk</a>.
              </p>
            </>
          )}
          {state === "already" && (
            <>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-teal-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Application received</h1>
              <p className="text-sm text-gray-600 mt-3">
                Your Direct Debit is already set up. We usually approve the same working day and will email your login link.
              </p>
            </>
          )}
          {state === "error" && (
            <>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
              <p className="text-sm text-gray-600 mt-3">
                We could not confirm your Direct Debit. Please email <a href="mailto:info@getrealhealthpgd.co.uk" className="text-teal-700 underline">info@getrealhealthpgd.co.uk</a> and we will sort it.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
