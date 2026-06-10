/**
 * Multi-tenant configuration.
 *
 * GRH operates one Next.js app that serves multiple "tenants" identified
 * by the hostname the request arrived on. Each tenant has its own theme
 * (logo, brand colours), its own footer copy, and its own auth flow.
 *
 *   getrealhealthpgd.co.uk            → default GRH experience (public marketing + auth'd dashboard)
 *   hubrx.getrealhealthpgd.co.uk      → HubRx-branded portal (auth'd only, no marketing)
 *
 * To add a new tenant later (e.g. for another B2B partner) you:
 *   1. Add an entry to the TENANTS map below
 *   2. Add the hostname → slug mapping in hostnameToTenantSlug
 *   3. Configure DNS + Vercel domain
 *   4. Set the relevant SSO secret env var
 *
 * The middleware reads the Host header, looks up the tenant slug, and
 * injects an `x-tenant` request header so server components can call
 * `getTenant()` to retrieve the active tenant config.
 */

export type TenantSlug = 'grh' | 'hubrx'

export interface TenantTheme {
  /** Primary brand colour — used for CTAs, links, accent elements */
  primary: string
  /** Hover state for primary */
  primaryHover: string
  /** Text on top of primary background */
  textOnPrimary: string
  /** Secondary accent — for highlights, badges */
  accent: string
  /** Dark navigation/footer background */
  navBg: string
  /** Light surface (cards) */
  surface: string
}

export interface TenantLogo {
  /** Path to logo file under public/ (e.g. /logos/hubrx.svg). Leave null
   *  to fall back to a text logo with the tenant displayName. */
  src: string | null
  width: number
  height: number
  alt: string
}

export interface TenantConfig {
  slug: TenantSlug
  /** Hostname this tenant lives on. Used for canonical URL generation. */
  canonicalHost: string
  /** Human-readable name shown in headers, emails etc */
  displayName: string
  /** One-line strapline. Optional — used on the login screen subtitle. */
  strapline?: string
  logo: TenantLogo
  theme: TenantTheme
  /** SSO config. When set, the /sso endpoint will accept tokens for
   *  this tenant. */
  sso: {
    enabled: boolean
    /** Env var name that holds the HMAC secret used to sign JWTs from
     *  the partner's identity provider. */
    secretEnvVar: string
    /** Where to send users after a successful SSO if they have NOT yet
     *  completed mandatory training. */
    onboardingRedirect: string
    /** Where to send users after a successful SSO if they HAVE completed
     *  training. Usually the main dashboard. */
    dashboardRedirect: string
  }
  /** When true, the public marketing routes (/, /about, /for-pharmacies/*
   *  excluding the auth'd dashboard) are 404'd on this tenant's hostname.
   *  HubRx pharmacies should only ever see the auth'd portal. */
  hideMarketing: boolean
  /** Footer legal-entity line. Shown beneath the tenant's footer. */
  footerLegalEntity: string
  /** Whether to show the "Powered by Get Real Health" footnote on
   *  tenant-themed pages. Set true for white-label tenants, false on
   *  the default GRH tenant where the brand IS the product. */
  showPoweredBy: boolean
}

// ── GRH default ──────────────────────────────────────────────────
// This is what the world sees on getrealhealthpgd.co.uk. Everyone
// who isn't coming in through a partner subdomain (Jane, Moin, the
// public, future direct customers) gets this experience.
const grhTenant: TenantConfig = {
  slug: 'grh',
  canonicalHost: 'getrealhealthpgd.co.uk',
  displayName: 'Get Real Health',
  strapline: 'PGDs, Clinical Training & Governance for UK Pharmacies',
  logo: {
    // Existing GRH header builds the logo from inline JSX, so we leave
    // src null and the Header component will continue to render the
    // existing wordmark for this tenant.
    src: null,
    width: 220,
    height: 40,
    alt: 'Get Real Health',
  },
  theme: {
    primary: '#0F766E', // teal-700
    primaryHover: '#115E59', // teal-800
    textOnPrimary: '#FFFFFF',
    accent: '#0EA5A4',
    navBg: '#0F172A', // navy-900
    surface: '#FFFFFF',
  },
  sso: {
    enabled: false,
    secretEnvVar: '',
    onboardingRedirect: '/for-pharmacies/dashboard/training',
    dashboardRedirect: '/for-pharmacies/dashboard',
  },
  hideMarketing: false,
  footerLegalEntity:
    'Get Real Health Limited · Company Number 12744898 · Registered in England and Wales',
  showPoweredBy: false,
}

// ── HubRx Insights tenant ────────────────────────────────────────
// Served on hubrx.getrealhealthpgd.co.uk (v1) and optionally
// pgd.hubrx.co.uk later. Users arrive via SSO from HubRx Insights.
//
// TODO once Sam shares the actual brand assets:
//   1. Drop the official HubRx logo at public/logos/hubrx.svg (or .png)
//      and update `logo.src` below.
//   2. Replace the placeholder hex values below with HubRx's brand hex
//      codes — easiest way is to inspect their site visually in Chrome
//      DevTools.
//   3. Confirm `displayName` wording matches what HubRx wants pharmacies
//      to see (e.g. "HubRx PGD Service" vs "HubRx Clinical Services").
const hubrxTenant: TenantConfig = {
  slug: 'hubrx',
  canonicalHost: 'hubrx.getrealhealthpgd.co.uk',
  displayName: 'HubRx PGD Service',
  strapline: 'Patient Group Directions for HubRx member pharmacies',
  logo: {
    // HubRx wordmark + "Transforming Independent Pharmacy" strapline.
    // Saved at public/logos/hubrx.png. 200x122 native (taller aspect
    // because it includes the strapline beneath the wordmark) — the
    // TenantHeader applies h-12 w-auto so it stays inline with the
    // standard header height.
    src: '/logos/hubrx.png',
    width: 200,
    height: 122,
    alt: 'HubRx — Transforming Independent Pharmacy',
  },
  theme: {
    // Sampled directly from hrx.creedev.co.uk:
    //   primary       #046bd2  (chevron blue, primary link colour)
    //   primaryHover  #045cb4  (darker variant for hover state)
    //   accent        #ef7627  ("BOOK A CALL" CTA orange)
    //   navBg         #283382  (deep indigo of the hero banner / nav)
    primary: '#046bd2',
    primaryHover: '#045cb4',
    textOnPrimary: '#FFFFFF',
    accent: '#ef7627',
    navBg: '#283382',
    surface: '#FFFFFF',
  },
  sso: {
    enabled: true,
    secretEnvVar: 'HUBRX_SSO_SECRET',
    onboardingRedirect: '/for-pharmacies/dashboard/training',
    dashboardRedirect: '/for-pharmacies/dashboard',
  },
  hideMarketing: true,
  footerLegalEntity:
    'Clinical service delivered by Get Real Health Limited (Company Number 12744898), an Independent Medical Agency registered with the Care Quality Commission and Healthcare Inspectorate Wales.',
  showPoweredBy: true,
}

// ── Tenant lookup ────────────────────────────────────────────────

const TENANTS: Record<TenantSlug, TenantConfig> = {
  grh: grhTenant,
  hubrx: hubrxTenant,
}

/**
 * Returns the tenant for a given hostname.
 *
 * Accepts hostnames in any of these forms:
 *   - "hubrx.getrealhealthpgd.co.uk"
 *   - "hubrx.getrealhealthpgd.co.uk:443"
 *   - "hubrx.localhost:3000"           (local dev convenience)
 *   - undefined / empty                (returns default GRH tenant)
 */
export function tenantFromHost(host: string | null | undefined): TenantConfig {
  if (!host) return grhTenant
  const cleanHost = host.toLowerCase().split(':')[0].trim()

  // HubRx — accept both the live subdomain and local-dev variants
  // ("hubrx.localhost:3000", "hubrx.lvh.me:3000") to make it easy
  // to test the white-label without messing with /etc/hosts.
  if (
    cleanHost === 'hubrx.getrealhealthpgd.co.uk' ||
    cleanHost.startsWith('hubrx.localhost') ||
    cleanHost.startsWith('hubrx.lvh.me') ||
    cleanHost === 'pgd.hubrx.co.uk' // reserved for later if Sam wants it on their domain
  ) {
    return hubrxTenant
  }

  return grhTenant
}

export function getTenantBySlug(slug: TenantSlug): TenantConfig {
  return TENANTS[slug]
}

export const ALL_TENANT_SLUGS = Object.keys(TENANTS) as TenantSlug[]
