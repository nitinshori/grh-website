"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { GOOGLE_ADS_ID } from "@/lib/google-ads";

/**
 * Loads the Google tag (gtag.js) for the Google Ads account, so that
 * conversions can be reported with trackAdsConversion() from "@/lib/google-ads".
 *
 * Loaded only once the visitor has accepted analytics cookies, matching
 * GoogleTagManager and GoogleAnalytics. The tag sets cookies, so consent is
 * required under PECR. Consent is read on mount, so a visitor who accepts
 * mid-session is measured from their next page view onwards.
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

export function GoogleAdsTag() {
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    setConsent(hasAnalyticsConsent());
  }, []);

  if (!consent) return null;

  return (
    <>
      <Script
        id="google-ads-tag-src"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`}
      />
      <Script id="google-ads-tag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = window.gtag || gtag;
          gtag('js', new Date());
          gtag('config', '${GOOGLE_ADS_ID}');
        `}
      </Script>
    </>
  );
}
