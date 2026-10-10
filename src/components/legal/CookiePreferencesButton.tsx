"use client";

/**
 * Re-opens the cookie consent banner. CookieConsent listens for the
 * "grh:show-cookie-banner" window event.
 */
export function CookiePreferencesButton({
  className,
  children = "Cookie preferences",
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("grh:show-cookie-banner"))}
      className={className}
    >
      {children}
    </button>
  );
}
