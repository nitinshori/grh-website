/**
 * Single source of truth for legal entity details.
 * Update the placeholders here once and every page (footer, policies, About)
 * will pick them up automatically.
 *
 * TODO before launch:
 *  - Replace COMPANY_NAME with the exact registered name from Companies House
 *  - Replace REGISTERED_OFFICE with the registered office address
 *  - Replace ICO_REGISTRATION with the ICO data protection fee reg number
 *    (or keep null if not yet registered, in which case the policy pages will
 *     show a "registration in progress" notice instead)
 */

export const legal = {
  /** Trading name shown across the public site */
  tradingName: "Get Real Health",

  /** Registered company name on Companies House */
  companyName: "Get Real Health Limited",

  /** Companies House registration number */
  companyNumber: "12744898",

  /** Companies House public profile URL */
  companyHouseUrl:
    "https://find-and-update.company-information.service.gov.uk/company/12744898",

  /** Registered office address — single line, comma-separated */
  registeredOffice:
    "Unit 55, First Floor, St. Asaph Business Park, St. Asaph, Denbighshire, LL17 0JG, United Kingdom",

  /** CQC provider ID (the slug after /provider/ in the CQC URL) */
  cqcProviderId: "1-9971460462",

  /** Public CQC profile URL */
  cqcUrl: "https://www.cqc.org.uk/provider/1-9971460462",

  /** ICO data protection fee registration number, or null if not yet registered */
  icoRegistration: null as string | null,

  /** Public-facing email shown on policy pages and footer */
  contactEmail: "hello@getrealhealth.co.uk",

  /** Privacy / data subject access request email */
  privacyEmail: "privacy@getrealhealth.co.uk",

  /** Public-facing phone number (optional) */
  phone: null as string | null,

  /** Default lawful jurisdiction */
  jurisdiction: "England and Wales",

  /** Date these policies were last updated */
  policiesLastUpdated: "April 2026",
} as const;
