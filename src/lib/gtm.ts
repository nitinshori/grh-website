// Google Tag Manager client-side helpers.
//
// GTM monitors window.dataLayer and fires whichever tags match. We use
// a small set of named events that get imported into Google Ads as
// conversion actions:
//
//   - book_demo_submit  : fires on /book discovery-call confirmation
//   - onboard_complete  : fires on /onboard/dd-complete after the
//                         GoCardless mandate is captured
//
// Calls are no-ops if GTM hasn't loaded (e.g. consent not given, or
// NEXT_PUBLIC_GTM_ID env var unset). Safe to call from any client
// component.

type DataLayerEvent = "book_demo_submit" | "onboard_complete";

interface DataLayerPayload {
  // Optional context. Keep keys simple and non-PII.
  // Do NOT push email, phone or full name into dataLayer — those are
  // visible in the browser and GTM rules can accidentally forward
  // them to third parties.
  value?: number;
  currency?: string;
  pharmacy_size?: string;
  service_category?: string;
}

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export function pushDataLayerEvent(
  event: DataLayerEvent,
  payload: DataLayerPayload = {},
): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...payload });
}
