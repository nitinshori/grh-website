"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const CONSENT_COOKIE = "grh_cookie_consent";
const CONSENT_VERSION = "1";

type ConsentValue = "all" | "essential";

function readConsent(): ConsentValue | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${CONSENT_COOKIE}=`));
  if (!match) return null;
  const raw = decodeURIComponent(match.split("=")[1] ?? "");
  try {
    const parsed = JSON.parse(raw) as { v: string; c: ConsentValue };
    if (parsed.v !== CONSENT_VERSION) return null;
    return parsed.c;
  } catch {
    return null;
  }
}

function writeConsent(value: ConsentValue) {
  if (typeof document === "undefined") return;
  const oneYear = 60 * 60 * 24 * 365;
  const payload = encodeURIComponent(
    JSON.stringify({ v: CONSENT_VERSION, c: value })
  );
  document.cookie = `${CONSENT_COOKIE}=${payload}; max-age=${oneYear}; path=/; SameSite=Lax`;
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (readConsent() === null) {
      setVisible(true);
    }
    const onShow = () => setVisible(true);
    window.addEventListener("grh:show-cookie-banner", onShow);
    return () => window.removeEventListener("grh:show-cookie-banner", onShow);
  }, []);

  if (!visible) return null;

  const accept = (value: ConsentValue) => {
    writeConsent(value);
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-[60] p-4 sm:p-6 pointer-events-none"
    >
      <div className="pointer-events-auto max-w-3xl mx-auto bg-white border border-gray-200 rounded-2xl shadow-2xl p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex-1">
            <h2 className="text-base font-bold text-navy-900 mb-1">
              We use cookies
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              We use essential cookies to make this site work. With your
              permission, we&apos;d also like to use analytics cookies to
              understand how the site is being used so we can improve it. You
              can change your choice any time on our{" "}
              <Link
                href="/legal/cookies"
                className="text-teal-600 hover:underline font-medium"
              >
                Cookie Policy
              </Link>{" "}
              page.
            </p>
          </div>
          <div className="flex flex-col sm:flex-shrink-0 gap-2 sm:w-44">
            <button
              type="button"
              onClick={() => accept("all")}
              className="px-4 py-2.5 bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Accept all
            </button>
            <button
              type="button"
              onClick={() => accept("essential")}
              className="px-4 py-2.5 bg-white hover:bg-gray-50 text-navy-900 text-sm font-semibold rounded-lg border border-gray-300 transition-colors"
            >
              Essential only
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
