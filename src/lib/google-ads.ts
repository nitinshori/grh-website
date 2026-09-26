// Google Ads conversion tracking, without Google Tag Manager.
//
// The site was built to report conversions through GTM: components push a
// named event onto window.dataLayer, and a GTM container turns that into a
// Google Ads conversion. That container was never created, so from launch
// until 26 Sep 2026 the Google Ads account recorded no conversions at all
// and there was no way to tell whether any paid click was worth anything.
//
// Rather than wait on GTM, the Google tag is now loaded directly (see
// components/analytics/GoogleAdsTag.tsx) and conversions are reported with
// gtag straight from the page that completes them. The dataLayer pushes are
// left in place, so adding GTM later changes nothing here.
//
// Conversion IDs come from Google Ads, Goals, Conversions. Adding a new one
// means creating the conversion action there, taking its "send_to" value
// from the event snippet, and adding it to CONVERSIONS below.

export const GOOGLE_ADS_ID = "AW-18464140413";

export const CONVERSIONS = {
  // "Sign-up" conversion action, created 26 Sep 2026. Fires on
  // /onboard/dd-complete once the GoCardless mandate is captured, which is
  // the first moment a pharmacy is genuinely signed up.
  signup: "AW-18464140413/NuStCOn-iYYdEP3YseRE",

  // "Contact enquiry" conversion action, created 26 Sep 2026. Fires on the
  // /contact form once the API has accepted the message. Counted once per
  // click, so a visitor who sends two messages is still one enquiry.
  contact: "AW-18464140413/co7xCJK0uYYdEP3YseRE",
} as const;

export type ConversionName = keyof typeof CONVERSIONS;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Report a conversion to Google Ads.
 *
 * A no-op when the tag has not loaded, which is the case for any visitor who
 * has not accepted analytics cookies. That under-counts conversions relative
 * to actual sign-ups, and is the correct behaviour: the tag sets cookies, so
 * it needs consent under PECR.
 */
export function trackAdsConversion(name: ConversionName): void {
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;
  window.gtag("event", "conversion", { send_to: CONVERSIONS[name] });
}
