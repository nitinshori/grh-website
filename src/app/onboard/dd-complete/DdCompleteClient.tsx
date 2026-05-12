"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { pushDataLayerEvent } from "@/lib/gtm";

type State = "loading" | "ok" | "error";

export default function DdCompleteClient() {
  const params = useSearchParams();
  const id = params.get("id");
  const token = params.get("token");
  const [state, setState] = useState<State>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!id || !token) { setState("error"); setErrorMsg("Missing id or token"); return; }
    let cancelled = false;
    fetch(`/api/onboarding/${id}/complete-mandate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (r) => {
        const body = (await r.json().catch(() => ({}))) as { error?: string };
        if (!r.ok) throw new Error(body.error || `${r.status}`);
      })
      .then(() => {
        if (!cancelled) {
          setState("ok");
          // Google Ads conversion — onboarding + GoCardless mandate complete
          pushDataLayerEvent("onboard_complete");
        }
      })
      .catch((e) => { if (!cancelled) { setState("error"); setErrorMsg(String(e.message || e)); } });
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
                Thanks. Your direct debit is set up and your application is now with us for review. We approve most applications within one working day.
              </p>
              <p className="text-sm text-gray-600 mt-3">
                You'll get an email with a link to set your password and access the platform once we've approved you.
              </p>
              <p className="text-xs text-gray-500 mt-6">
                If you don't see anything within 24 hours, check your spam folder or contact <a href="mailto:hello@getrealhealthpgd.co.uk" className="text-teal-700 underline">hello@getrealhealthpgd.co.uk</a>.
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
                We couldn't finalise your direct debit. Detail: <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">{errorMsg}</code>
              </p>
              <p className="text-sm text-gray-600 mt-3">
                Please email <a href="mailto:hello@getrealhealthpgd.co.uk" className="text-teal-700 underline">hello@getrealhealthpgd.co.uk</a> and we'll sort it.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
