"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

/**
 * Google Tag Manager container loader.
 * Only loads after the user has accepted analytics cookies via the
 * CookieConsent banner (consent value "all").
 *
 * To activate:
 *  1. Create a container at https://tagmanager.google.com
 *  2. Copy the container ID (starts with "GTM-")
 *  3. Add it to Vercel env vars as NEXT_PUBLIC_GTM_ID
 *
 * Once loaded, components can push events with:
 *   pushDataLayerEvent("book_demo_submit") // from "@/lib/gtm"
 *
 * Inside GTM, build a Trigger of type "Custom Event" matching the
 * event name, then attach a Google Ads Conversion Linker tag.
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

export function GoogleTagManager() {
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    setConsent(hasAnalyticsConsent());
  }, []);

  if (!GTM_ID || !consent) return null;

  return (
    <>
      <Script id="gtm-init" strategy="afterInteractive">
        {`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${GTM_ID}');
        `}
      </Script>
      {/* noscript fallback iframe — required by GTM for users with JS disabled. */}
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
        />
      </noscript>
    </>
  );
}
