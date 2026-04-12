"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

/**
 * Google Analytics 4 component.
 * Only loads the GA script after the user has accepted analytics cookies
 * via the CookieConsent banner (consent value "all").
 *
 * To activate:
 *  1. Create a GA4 property at https://analytics.google.com
 *  2. Copy the Measurement ID (starts with "G-")
 *  3. Add it to Vercel env vars as NEXT_PUBLIC_GA_MEASUREMENT_ID
 */

function hasAnalyticsConsent(): boolean {
  if (typeof document === "undefined") return false;
  const match = document.cookie
    .split("; ")
    .find((c) => c.startsWith("grh_cookie_consent="));
  if (!match) return false;
  try {
    const raw = decodeURIComponent(match.split("=")[1] ?? "");
    const parsed = JSON.parse(raw) as { v: string; c: string };
    return parsed.c === "all";
  } catch {
    return false;
  }
}

export function GoogleAnalytics() {
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    setConsent(hasAnalyticsConsent());
  }, []);

  if (!GA_ID || !consent) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
    </>
  );
}
