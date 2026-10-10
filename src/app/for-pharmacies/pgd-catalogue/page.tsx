import type { Metadata } from "next";
import { PGDCatalogueClient } from "./PGDCatalogueClient";
import { ALL_PGDS, COMING_SOON_SLUGS, isPubliclyListedPgd } from "@/lib/pgd-access";

const BASE_URL = "https://getrealhealthpgd.co.uk";

export const metadata: Metadata = {
  title: "PGD Catalogue: 65+ Services for Pharmacies in England and Wales",
  description:
    "65+ PGDs for community pharmacies in England and Wales: weight management (Wegovy, Mounjaro, Saxenda), travel vaccines, ED, hair loss, contraception, UTI and more. All included in the £100/month flat fee.",
  alternates: { canonical: `${BASE_URL}/for-pharmacies/pgd-catalogue` },
};

// FAQ JSON-LD — answers the catalogue questions AI engines actually receive
// from buyers. Mirror these in any on-page accordion if/when one ships.
const faqs = [
  {
    q: "What PGD services does Get Real Health provide?",
    a: "65+ PGDs across weight management (Wegovy, Mounjaro, Saxenda, Mysimba, Orlistat), travel vaccines (yellow fever, rabies, Japanese encephalitis, anti-malarials), sexual health (ED, contraception, emergency contraception, STI testing, BV, thrush, genital warts), respiratory (asthma rescue, COPD, hayfever), dermatology (acne, eczema, rosacea, impetigo, cold sores), smoking cessation, dental bridging, male pattern hair loss (finasteride), and many more. Gonorrhoea treatment and genital herpes are coming soon.",
  },
  {
    q: "Are weight-loss PGDs like Wegovy and Mounjaro included?",
    a: "Yes. Wegovy, Wegovy tablets, Foundayo, Mounjaro, Saxenda, Mysimba, and Orlistat are all included PGDs. All weight-management services share the same £100/month flat fee, with no extra fees per consultation or per service.",
  },
  {
    q: "Are travel vaccinations included?",
    a: "Yes. The travel-core PGD covers hepatitis A, typhoid and oral cholera vaccine, plus dedicated PGDs for hepatitis A and B, typhoid, tetanus, diphtheria and polio, junior travel vaccines, yellow fever, rabies, Japanese encephalitis, meningitis ACWY, dengue, altitude sickness, anti-malarials, and travellers' diarrhoea, all included in the £100/month fee.",
  },
  {
    q: "Which sexual-health services are covered?",
    a: "ED treatment, contraception (including emergency and postnatal), STI testing with chlamydia treatment, genital warts, premature ejaculation, BV, thrush, and HPV vaccination. Gonorrhoea treatment and genital herpes are coming soon.",
  },
  {
    q: "Is BPH included?",
    a: "Yes. Benign prostatic hyperplasia (tamsulosin) is an included PGD. Dr Nitin Shori is the named clinician on every PGD.",
  },
  {
    q: "Who authors the PGDs?",
    a: "Dr Nitin Shori, NHS GP partner and Medical Director of Get Real Health (previously Medical Director of Pharmacy2U Online Doctor Service for 10+ years). He is the named clinician on every PGD. Head Pharmacist Christopher Pilkington (30+ years in community pharmacy and independent prescribing) oversees implementation, training, and clinical governance.",
  },
  {
    q: "Does the platform cover NHS services like Pharmacy First or NMS?",
    a: "No. Get Real Health is a private-services PGD platform. Pharmacy First and NMS are NHS-funded services delivered under NHS contracts and IT systems — they are not PGD services. GRH gives your pharmacy a private revenue stream that runs alongside NHS work, not a replacement for it.",
  },
  {
    q: "Can I request new PGDs to be added?",
    a: "Yes. PGD requests from partner pharmacies feed our development roadmap. We've added 10+ services since launch based on partner requests. Contact the team to flag a service you'd like to offer.",
  },
  {
    q: "Are the PGDs valid in England, Wales, and Scotland?",
    a: "GRH is registered with the Care Quality Commission (CQC) in England and Healthcare Inspectorate Wales (HIW) in Wales. The PGDs are designed for use in those two jurisdictions. We are not currently regulated for Scotland or Northern Ireland.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

// ItemList JSON-LD — exposes the full PGD catalogue as a structured list.
// AI engines (Google AI Overviews, ChatGPT, Perplexity) use this to cite
// "Wegovy PGD pharmacy" type queries by enumerating which provider offers
// which PGD. Each item is also a Service in its own right.
const provider = {
  "@type": "Organization",
  name: "Get Real Health",
  url: BASE_URL,
};

// Get Real Health is registered with the CQC and HIW and serves England and
// Wales only.
const AREA_SERVED = [
  { "@type": "AdministrativeArea", name: "England" },
  { "@type": "AdministrativeArea", name: "Wales" },
];

// Only PGDs that are live and released for public listing: no withdrawn or
// retired services, no drafts, nothing awaiting release (oral minoxidil, ear)
// and no coming-soon placeholders.
const LISTED_PGDS = ALL_PGDS.filter(
  (pgd) => isPubliclyListedPgd(pgd.slug) && !COMING_SOON_SLUGS.has(pgd.slug),
);

const offer = {
  "@type": "Offer",
  price: "100",
  priceCurrency: "GBP",
  priceSpecification: {
    "@type": "UnitPriceSpecification",
    price: "100",
    priceCurrency: "GBP",
    unitCode: "MON",
  },
  availability: "https://schema.org/InStock",
  eligibleRegion: AREA_SERVED,
  url: `${BASE_URL}/for-pharmacies/pricing`,
};

const itemListJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Get Real Health — PGD Catalogue",
  description:
    "Patient Group Directions available to GRH-subscribed community pharmacies in England and Wales. All included in the single £100/month per pharmacy fee.",
  numberOfItems: LISTED_PGDS.length,
  itemListElement: LISTED_PGDS.map((pgd, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@type": "Service",
      name: `${pgd.title} PGD`,
      description: `${pgd.title} (${pgd.subtitle}): ${pgd.category} Patient Group Direction for community pharmacies in England and Wales. Includes electronic consultation tool, optional training and clinical governance.`,
      category: pgd.category,
      serviceType: "Patient Group Direction",
      provider,
      areaServed: AREA_SERVED,
      audience: {
        "@type": "Audience",
        audienceType: "Community pharmacies and pharmacists in England and Wales",
      },
      offers: offer,
    },
  })),
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
    {
      "@type": "ListItem",
      position: 2,
      name: "For Pharmacies",
      item: `${BASE_URL}/for-pharmacies`,
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "PGD Catalogue",
      item: `${BASE_URL}/for-pharmacies/pgd-catalogue`,
    },
  ],
};

export default function PGDCataloguePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <PGDCatalogueClient />
    </>
  );
}
