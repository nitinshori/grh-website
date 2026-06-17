// Public SEO landing pages for our highest-intent services.
//
// These are NOT the consultation tools (those live under /for-pharmacies/epgd/*
// and are noindex'd). These are the marketing pages that pharmacy decision-makers
// land on from Google when they search "Wegovy PGD", "Mounjaro PGD" etc.
//
// Each entry drives the dynamic /services/[slug] route plus the corresponding
// Service / Product / FAQPage / BreadcrumbList JSON-LD blocks.

export interface ServicePage {
  slug: string;
  // SEO
  title: string;          // <title> tag
  description: string;    // <meta name="description">
  keywords: string[];

  // Hero
  h1: string;
  subhead: string;
  category: string;       // e.g. "Weight Management" — used in breadcrumb + schema
  drug: string;           // e.g. "Semaglutide 2.4mg" — for Product schema

  // Body
  intro: string;          // 2-3 sentence paragraph after hero
  whatsIncluded: string[];      // bullet list — "What's in this PGD pack"
  differentiators: { title: string; body: string }[]; // 3 cards — "Why with GRH"
  howItWorks: { step: string; title: string; body: string }[];

  // FAQs (also emitted as FAQPage schema)
  faqs: { q: string; a: string }[];

  // Footer CTA
  ctaHeadline: string;
  ctaSubhead: string;
}

const COMMON_INCLUDED = [
  "Full clinical PGD document (signed off by our medical director and clinical pharmacist)",
  "Online training module with CPD certificate",
  "Built-in ePGD consultation tool with prompts, contraindication checks and dose calculators",
  "Editable patient consent and information leaflets",
  "Monitoring schedule template and follow-up reminders",
  "Audit-ready digital consultation records — kept indefinitely, exportable on request",
  "Clinical governance: SOP templates, audit forms, incident-reporting workflow",
  "Per-pharmacy custom PGD documents — multi-site groups can upload their own clinically-signed versions",
];

const COMMON_HOW_IT_WORKS = [
  { step: "01", title: "Sign up", body: "Onboard online in ~10 minutes. Direct Debit via GoCardless. £100 per pharmacy per month — flat. No setup fee, no per-consult charge." },
  { step: "02", title: "Complete training", body: "Online module + written competency check for this PGD. CPD certificate issued automatically. Locums and additional pharmacists are covered under your store fee." },
  { step: "03", title: "Sign the PGD", body: "Authorising pharmacist signs the PGD electronically. You're cleared to start seeing patients the same day training completes." },
  { step: "04", title: "See patients", body: "Use the ePGD tool to run consultations on iPad, laptop or phone. Records save automatically. Patients book direct via your store's GRH listing page or walk in." },
];

export const SERVICE_PAGES: ServicePage[] = [
  // ── Wegovy ──────────────────────────────────────────────────────
  {
    slug: "wegovy",
    title: "Wegovy PGD for UK Pharmacies | Semaglutide 2.4mg",
    description:
      "Wegovy (semaglutide 2.4mg) Patient Group Direction for UK community pharmacy. Includes ePGD consultation tool, training, clinical governance, patient consent forms. £100/month flat — all PGDs included.",
    keywords: [
      "Wegovy PGD",
      "Wegovy pharmacy",
      "Wegovy patient group direction",
      "semaglutide PGD",
      "weight management PGD",
      "Wegovy training pharmacy",
      "private Wegovy pharmacy",
    ],
    h1: "Wegovy PGD for UK Pharmacies",
    subhead:
      "Run a private Wegovy (semaglutide 2.4mg) weight-management service with full clinical governance, written training and a ready-to-launch ePGD consultation tool. £100 per pharmacy per month — every PGD included.",
    category: "Weight Management",
    drug: "Semaglutide 2.4mg (Wegovy)",
    intro:
      "Wegovy is one of the highest-demand private services in UK pharmacy — but it is also one of the most clinically governed. Get Real Health gives you a fully documented PGD, an electronic consultation tool that enforces the eligibility, BMI, contraindication and monitoring rules, and the training and audit pack to keep it compliant. Everything is included in our flat £100 per pharmacy per month fee. No per-consultation upcharges, no per-pharmacist licensing, no separate training cost.",
    whatsIncluded: [
      "Wegovy PGD — full clinical document with eligibility criteria (BMI ≥30, or ≥27 with comorbidity), contraindications, exclusions and dose-escalation schedule",
      ...COMMON_INCLUDED.slice(1),
      "Dose-escalation calculator built into the ePGD tool (0.25mg → 0.5mg → 1mg → 1.7mg → 2.4mg)",
      "BP, weight and BMI tracking with automated trend chart for each patient",
    ],
    differentiators: [
      {
        title: "Training is included — not an extra",
        body: "Every pharmacist (and locum) at your store is covered under one fee. Most other providers charge separately for Wegovy training, then again per pharmacist.",
      },
      {
        title: "ePGD tool — not paper forms",
        body: "Our digital consultation tool runs every contraindication and exclusion check live. It saves the consultation, the consent, the dose escalation history and the follow-up schedule. No filing, no missed reviews.",
      },
      {
        title: "Flat £100/month, all PGDs",
        body: "Pharmadoctor and ECG charge per service or per pharmacist. We don't. Add Wegovy, Mounjaro, HRT, TRT and 60+ others — same fee.",
      },
    ],
    howItWorks: COMMON_HOW_IT_WORKS,
    faqs: [
      {
        q: "Do I need a separate Wegovy PGD or is it included?",
        a: "It's included. Every PGD on our platform is part of the £100/month per pharmacy fee. Wegovy, Mounjaro, the new ongoing GLP-1 monitoring PGD, HRT, TRT — all included. No tiered pricing.",
      },
      {
        q: "Who signs off the Wegovy PGD?",
        a: "Our Wegovy PGD is authored by our medical director (a registered prescriber) and clinically reviewed by our medical lead pharmacist before release. At your end, the authorising pharmacist at each pharmacy signs to confirm they have read, understood and will operate under the PGD. The signed copy is stored electronically and audit-ready.",
      },
      {
        q: "What training is required to supply Wegovy under PGD?",
        a: "Pharmacists must complete the GRH Wegovy training module (covers patient selection, BMI thresholds, contraindications, lifestyle counselling, dose escalation, and red flags) plus the written competency assessment. The module is online, can be completed in roughly an hour, and generates a CPD certificate automatically. The competency record is stored against each pharmacist's profile.",
      },
      {
        q: "How is Wegovy supplied — do you ship the drug?",
        a: "No. GRH provides the PGD, training, clinical governance, the consultation tool and the patient workflow. You source Wegovy from your usual wholesaler. This means the pharmacy keeps the entire margin on the drug — we never sit in the supply chain.",
      },
      {
        q: "What happens at follow-up appointments?",
        a: "The ePGD tool builds a follow-up schedule automatically (typically monthly at first, then 3-monthly). It prompts for weight, BP, side effects and adherence at each review, and won't let you progress the dose-escalation step until the safety checks pass. Reviews are recorded against the patient and you can run reports for audit or for your own clinical governance.",
      },
      {
        q: "Can a locum pharmacist provide Wegovy at my store?",
        a: "Yes — provided they have completed the Wegovy training module and competency assessment, and signed the PGD as an authorised pharmacist. Locum logins are included in your store fee at no extra cost.",
      },
      {
        q: "How does this compare to Pharmadoctor or ECG Training?",
        a: "Pharmadoctor and ECG both offer Wegovy PGDs but charge separately for the PGD, the training, and (with some providers) per pharmacist. GRH includes all three in one flat £100/month per pharmacy fee, and ships the electronic consultation tool out of the box — many other providers either don't have one or sell it as an add-on. A typical comparison: ~£2,500–£2,700/year per pharmacy elsewhere vs £1,200/year with GRH.",
      },
    ],
    ctaHeadline: "Add Wegovy to your private services in days, not months",
    ctaSubhead: "Onboard online, complete training, and start seeing Wegovy patients the same week. £100/month per pharmacy, every PGD included.",
  },

  // ── Mounjaro ────────────────────────────────────────────────────
  {
    slug: "mounjaro",
    title: "Mounjaro PGD for UK Pharmacies | Tirzepatide",
    description:
      "Mounjaro (tirzepatide) Patient Group Direction for UK community pharmacy weight-management services. ePGD consultation tool, dose-escalation calculator, training, clinical governance — all included for £100/month per pharmacy.",
    keywords: [
      "Mounjaro PGD",
      "Mounjaro pharmacy",
      "tirzepatide PGD",
      "Mounjaro patient group direction",
      "weight management PGD",
      "Mounjaro training pharmacy",
      "private Mounjaro pharmacy",
    ],
    h1: "Mounjaro PGD for UK Pharmacies",
    subhead:
      "Offer a private Mounjaro (tirzepatide) weight-management service with the PGD, training, electronic consultation tool and dose-escalation logic built in. £100 per pharmacy per month — flat.",
    category: "Weight Management",
    drug: "Tirzepatide (Mounjaro)",
    intro:
      "Mounjaro is the most clinically effective weight-loss medicine on the UK private market — and the most commercially significant private service most pharmacies will add this year. The challenge is doing it safely. Get Real Health bundles the PGD, the training, the dose-escalation calculator and the audit-ready electronic consultation tool so you can launch a Mounjaro service without building the governance yourself. Same flat £100 per pharmacy per month — no per-consult fees, no per-pharmacist fees.",
    whatsIncluded: [
      "Mounjaro PGD — eligibility (BMI ≥30, or ≥27 with comorbidity), contraindications, exclusions, dose-escalation schedule (2.5mg → 5mg → 7.5mg → 10mg → 12.5mg → 15mg)",
      ...COMMON_INCLUDED.slice(1),
      "Dose-escalation calculator with built-in tolerance and effectiveness review checkpoints",
      "Side-effect tracking and dose-decision support at every review",
    ],
    differentiators: [
      {
        title: "One PGD covers initiation, escalation and maintenance",
        body: "No separate add-ons for monitoring, escalation reviews or 'maintenance' supply. The Mounjaro PGD plus our GLP-1 monitoring PGD cover the full patient journey.",
      },
      {
        title: "Audit-ready out of the box",
        body: "Every consultation, dose change and review is captured digitally with timestamp and pharmacist identity. Run an audit report any time — useful for GPhC and for your own clinical governance.",
      },
      {
        title: "Locums included",
        body: "Pharmacy is built on locum cover. Our pricing reflects that: every pharmacist who works at your store can operate under the PGD at no extra cost once they've completed training.",
      },
    ],
    howItWorks: COMMON_HOW_IT_WORKS,
    faqs: [
      {
        q: "Is the Mounjaro PGD included or is it an add-on?",
        a: "Included. All 60+ PGDs on our platform — Mounjaro, Wegovy, the GLP-1 monitoring PGD, HRT, TRT and everything else — are covered by the single £100/month per pharmacy fee.",
      },
      {
        q: "What about the dose-escalation logic? Is that automated?",
        a: "Yes. The ePGD tool walks the pharmacist through the escalation decision at each review — checking tolerance, side effects, weight loss progress and any new contraindications before authorising the next step (2.5mg → 5mg → 7.5mg → 10mg → 12.5mg → 15mg). If a safety check fails, the tool prevents the escalation and prompts a hold or step-down.",
      },
      {
        q: "Who can supply Mounjaro under the PGD?",
        a: "Any pharmacist working at a GRH-subscribed pharmacy who has completed the Mounjaro training module + written competency assessment and signed the PGD as an authorised user. Locums are covered.",
      },
      {
        q: "Do you handle the drug supply?",
        a: "No — we never sit in the supply chain. You source Mounjaro from your usual wholesaler, which means your pharmacy keeps the full margin on the drug.",
      },
      {
        q: "What's the difference between the Mounjaro PGD and the GLP-1 monitoring PGD?",
        a: "The Mounjaro PGD covers initiation and dose escalation. The GLP-1 monitoring PGD covers ongoing supply and reviews once a patient is stable, including patients who started Mounjaro or Wegovy elsewhere and are transferring care to your pharmacy. Both are included.",
      },
      {
        q: "How does this compare with Pharmadoctor or ECG Training?",
        a: "Pharmadoctor offers a Mounjaro PGD but charges per pharmacist for training and separately for the service pack. ECG sells the PGD and training as separate products. GRH bundles everything — PGD, training, ePGD tool, all 60+ other PGDs — into one flat £100/month per pharmacy fee.",
      },
    ],
    ctaHeadline: "Launch a Mounjaro service in your pharmacy",
    ctaSubhead: "Onboard, train, sign the PGD, see patients. Same flat £100/month fee — every PGD included.",
  },

  // ── TRT ─────────────────────────────────────────────────────────
  {
    slug: "trt",
    title: "TRT PGD for UK Pharmacies | Testosterone Replacement",
    description:
      "Testosterone Replacement Therapy (TRT) Patient Group Direction for UK community pharmacies. Includes initial assessment, blood test triage, ongoing monitoring schedule and the electronic consultation tool. £100/month flat.",
    keywords: [
      "TRT PGD",
      "testosterone PGD",
      "testosterone replacement pharmacy",
      "TRT pharmacy",
      "men's health PGD",
      "private TRT pharmacy",
      "testosterone undecanoate PGD",
    ],
    h1: "TRT PGD for UK Pharmacies",
    subhead:
      "Run a private Testosterone Replacement Therapy service with the PGD, training, blood test triage logic and monitoring schedule built in. £100 per pharmacy per month — every PGD included.",
    category: "Men's Health",
    drug: "Testosterone Undecanoate",
    intro:
      "Private TRT is one of the fastest-growing men's health services in UK pharmacy, but it carries real clinical risk if it's not done properly. Get Real Health provides the PGD, the patient eligibility workflow (symptom screen, two confirmatory testosterone levels, exclusion criteria), the monitoring schedule (PSA, haematocrit, lipid panel) and the electronic consultation tool that enforces every step. Included in our flat £100/month per pharmacy fee.",
    whatsIncluded: [
      "TRT PGD — initial assessment, blood test interpretation thresholds, contraindications, exclusion criteria, dose initiation and maintenance schedule",
      ...COMMON_INCLUDED.slice(1),
      "Blood test interpretation guide with cut-off values for testosterone, PSA, haematocrit, LFTs and lipids",
      "Structured monitoring schedule with automated review reminders",
    ],
    differentiators: [
      {
        title: "Blood test triage built in",
        body: "The ePGD tool checks blood test results against PGD thresholds and flags exclusions automatically — no judgment calls at the counter, no missed contraindications.",
      },
      {
        title: "Designed for the real patient journey",
        body: "Most TRT patients self-refer with symptoms. Our workflow handles symptom screen → blood test request → result review → eligibility decision → initiation → ongoing monitoring as one continuous record.",
      },
      {
        title: "Includes ongoing monitoring",
        body: "PSA, haematocrit and lipid monitoring schedules are built into the patient record. Review reminders fire automatically — you don't have to chase patients manually.",
      },
    ],
    howItWorks: COMMON_HOW_IT_WORKS,
    faqs: [
      {
        q: "Can pharmacists initiate TRT under PGD in the UK?",
        a: "Yes — under a properly authored PGD, with appropriate training, and provided the patient meets the eligibility criteria (symptomatic hypogonadism, confirmed on two early-morning testosterone measurements, with no exclusions). Our PGD spells out every threshold and exclusion in clinical terms, and the ePGD tool enforces them.",
      },
      {
        q: "How does the patient get their blood test?",
        a: "Most pharmacies offer the blood test in-pharmacy (private venous draw or finger-prick depending on your set-up) or refer to a partner phlebotomy provider. The PGD tool captures the test results, interprets them against thresholds, and tells you whether the patient is eligible.",
      },
      {
        q: "What's the monitoring schedule?",
        a: "PSA, haematocrit, lipid panel and total testosterone at 3 months, 6 months and then annually. The ePGD tool builds the review schedule automatically and prompts the pharmacist at each visit. Out-of-range results flag an alert to the pharmacist.",
      },
      {
        q: "Who can authorise TRT supply at the pharmacy?",
        a: "Any pharmacist at a GRH-subscribed pharmacy who has completed the TRT training module, passed the written competency assessment and signed the PGD as an authorised user. Locums are included.",
      },
      {
        q: "Is TRT included in the £100/month or extra?",
        a: "Included. All 60+ PGDs — TRT, HRT, Wegovy, Mounjaro, every other service — are in the same flat £100/month per pharmacy fee. No per-PGD upcharges.",
      },
    ],
    ctaHeadline: "Add a TRT service to your pharmacy",
    ctaSubhead: "PGD, training, blood test workflow, ongoing monitoring. All included.",
  },

  // ── HRT ─────────────────────────────────────────────────────────
  {
    slug: "hrt",
    title: "HRT PGD for UK Pharmacies | Estradiol & Utrogestan",
    description:
      "Hormone Replacement Therapy (HRT) Patient Group Direction for UK community pharmacies. Estradiol, Utrogestan, combined regimens. Initial assessment, ongoing review and the ePGD tool — £100/month flat.",
    keywords: [
      "HRT PGD",
      "HRT pharmacy",
      "estradiol PGD",
      "Utrogestan PGD",
      "menopause pharmacy",
      "hormone replacement therapy PGD",
      "women's health PGD",
      "private HRT pharmacy",
    ],
    h1: "HRT PGD for UK Pharmacies",
    subhead:
      "Offer a private HRT service with the PGD, training, contraindication logic and ongoing review workflow built in. £100 per pharmacy per month — every PGD included.",
    category: "Women's Health",
    drug: "Estradiol / Utrogestan",
    intro:
      "HRT demand has surged since the menopause-care debate broke into the mainstream — and many patients are waiting months for GP review. UK pharmacies can offer initiation, review and ongoing supply under a properly written PGD. Get Real Health provides the PGD (estradiol, Utrogestan, combined regimens, contraindications, red flags), the training, the consultation tool that walks through every menopausal symptom screen, and the audit pack.",
    whatsIncluded: [
      "HRT PGD covering estradiol (patches, gel, spray), Utrogestan, and combined regimens",
      ...COMMON_INCLUDED.slice(1),
      "Greene Climacteric Scale and other validated menopause symptom screens built in",
      "Contraindication and red flag flowcharts (breast cancer history, VTE, undiagnosed bleeding etc.)",
      "12-month review schedule with automated reminders",
    ],
    differentiators: [
      {
        title: "Initiation and review under one PGD",
        body: "Most providers split HRT into separate 'initiation' and 'continuation' PGDs. We don't. One PGD, full patient journey, less paperwork.",
      },
      {
        title: "Validated symptom screens",
        body: "The ePGD tool runs the Greene Climacteric Scale automatically and stores it in the patient record. Easy to demonstrate clinical reasoning during an audit.",
      },
      {
        title: "Designed by clinicians who treat menopausal women",
        body: "Authored by our medical director and reviewed by a pharmacist with women's-health specialism. Not a generic template.",
      },
    ],
    howItWorks: COMMON_HOW_IT_WORKS,
    faqs: [
      {
        q: "Can pharmacists initiate HRT under PGD?",
        a: "Yes — under a properly written PGD that captures contraindications, red flags and the symptom-screening workflow, and provided the pharmacist has completed training. Our HRT PGD covers initiation, review and ongoing supply in one document.",
      },
      {
        q: "What about patients who are already on HRT from their GP?",
        a: "The PGD covers continuation of an existing regimen as well as initiation. The ePGD tool captures the current regimen, treatment history and review status and lets you supply or adjust within the PGD's scope.",
      },
      {
        q: "What about combined regimens with progesterone?",
        a: "Covered. The PGD spells out which combinations are permitted (e.g. estradiol gel + cyclical or continuous Utrogestan depending on menstrual status). The ePGD tool will only let you supply combinations that match the patient's status.",
      },
      {
        q: "What's the review schedule?",
        a: "First review at 3 months, then annually. The tool prompts for symptom score, side effects, blood pressure and any new red flags. Reviews are recorded against the patient and visible for audit.",
      },
      {
        q: "Is HRT included or extra?",
        a: "Included. All 60+ PGDs are bundled into the £100/month per pharmacy fee.",
      },
    ],
    ctaHeadline: "Help your patients get HRT without the waitlist",
    ctaSubhead: "PGD, training, symptom screens, ongoing review. £100/month per pharmacy.",
  },

  // ── Travel vaccinations ────────────────────────────────────────
  {
    slug: "travel-vaccinations",
    title: "Travel Vaccination PGDs for UK Pharmacies",
    description:
      "Travel vaccination Patient Group Directions for UK community pharmacy. Hep A/B, Typhoid, Yellow Fever, MenACWY, Rabies, Japanese Encephalitis, Dengue and more — plus anti-malarials and the travel risk assessment workflow. £100/month flat.",
    keywords: [
      "travel vaccination PGD",
      "travel clinic pharmacy PGD",
      "yellow fever PGD",
      "MenACWY PGD",
      "hep B PGD",
      "rabies PGD",
      "anti-malarials PGD",
      "private travel clinic pharmacy",
      "travel health PGD",
    ],
    h1: "Travel Vaccination PGDs for UK Pharmacies",
    subhead:
      "Run a full private travel clinic with PGDs covering the entire travel itinerary — vaccines, anti-malarials, country risk assessment, certificate issuing. £100 per pharmacy per month, every PGD included.",
    category: "Travel Health",
    drug: "Multiple travel vaccines and anti-malarials",
    intro:
      "Travel health is the single most lucrative private service most pharmacies offer — but only if you can cover the whole itinerary. Get Real Health bundles the full travel suite: the travel risk assessment PGD, all common vaccine PGDs (Hep A/B combined, Typhoid, MenACWY, Yellow Fever for registered YFVCs, Rabies, Japanese Encephalitis, Dengue), and the anti-malarial PGD (atovaquone-proguanil, doxycycline). The ePGD tool runs the country risk assessment, recommends the regimen, captures consent and issues the certificate.",
    whatsIncluded: [
      "Travel risk assessment PGD (country-by-country lookup, itinerary review, activity-based risk)",
      "Vaccine PGDs: Hep A/B (Twinrix / Havrix / Engerix-B), Typhoid (Typhim Vi / Vivotif), MenACWY (MenQuadfi / Nimenrix), Yellow Fever (Stamaril — for registered YFVCs only), Rabies pre-exposure, Japanese Encephalitis (Ixiaro), Dengue (Qdenga)",
      "Anti-malarials PGD (atovaquone-proguanil / doxycycline)",
      "Country risk lookup integrated into the ePGD tool",
      "Patient certificate templates (including ICVP for Yellow Fever and MenACWY for Hajj)",
      "Passport-number capture for re-issuing lost certificates",
      ...COMMON_INCLUDED.slice(1).filter(s => !s.includes("dose-escalation")),
    ],
    differentiators: [
      {
        title: "Whole itinerary in one workflow",
        body: "Country-by-country risk lookup, recommended regimen, vaccines, anti-malarials, food and water advice, sun and altitude — captured as a single consultation. No flipping between tools.",
      },
      {
        title: "Certificate re-issuing built in",
        body: "We capture passport number and date of birth on every travel consultation, so you can reissue certificates years later when the patient inevitably loses them — a common audit point Hajj travellers raise.",
      },
      {
        title: "Yellow Fever — properly handled",
        body: "We don't bundle Stamaril into the standard pharmacy package because only registered YFVCs can supply it. If your pharmacy is YFVC-registered, the PGD and tool are included; if not, the workflow politely deflects.",
      },
    ],
    howItWorks: COMMON_HOW_IT_WORKS,
    faqs: [
      {
        q: "Is every travel PGD included in the £100/month?",
        a: "Yes. Hep A/B, Typhoid, MenACWY, Yellow Fever (for YFVCs), Rabies, Japanese Encephalitis, Dengue, anti-malarials, and the travel risk assessment — all included. No per-vaccine licensing, no add-ons.",
      },
      {
        q: "Do you handle the country risk assessment?",
        a: "Yes. The ePGD tool has a country lookup — pick the destination(s) and the duration, and it returns the recommended vaccines, anti-malarials and country-specific advice. The pharmacist reviews and confirms.",
      },
      {
        q: "What about Yellow Fever — that needs YFVC registration",
        a: "Correct, and we respect that. The Yellow Fever PGD is included but the tool checks whether your pharmacy is registered as a Yellow Fever Vaccination Centre before allowing supply. Registration is via the National Travel Health Network and Centre (NaTHNaC) — we can help you through that process.",
      },
      {
        q: "How do patients book a travel appointment?",
        a: "Through your pharmacy's existing channels — phone, walk-in, or whatever online booking you already use. GRH provides the clinical workflow, PGDs, country risk assessment and certificate issuing once the patient is in front of you; the front-of-shop booking flow stays with your pharmacy.",
      },
      {
        q: "How does the MenACWY workflow handle Hajj certificates?",
        a: "We capture the passport number on the MenACWY consultation, so when the patient asks for a replacement certificate (which happens) you can re-issue it from the patient record. Saudi MoH require MenACWY certification for all Hajj and Umrah pilgrims.",
      },
      {
        q: "How does this compare with PharmaDoctor's travel suite?",
        a: "Pharmadoctor sells travel as a service-package add-on, with per-pharmacist training fees. Pharmadoctor is also strong on the consultation tool side. GRH's approach: bundle the entire travel suite (every common vaccine, anti-malarials, country risk lookup, certificate handling) into the same flat £100/month, with our ePGD tool out of the box. If your store has more than one pharmacist or uses locums, GRH typically works out cheaper.",
      },
    ],
    ctaHeadline: "Launch a private travel clinic this month",
    ctaSubhead: "Every common travel PGD, anti-malarials, country risk, certificates. £100/month per pharmacy, flat.",
  },
];

export const SERVICE_SLUGS = SERVICE_PAGES.map((p) => p.slug);

export function getServicePage(slug: string): ServicePage | undefined {
  return SERVICE_PAGES.find((p) => p.slug === slug);
}
