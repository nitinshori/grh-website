import type { Metadata } from "next";
import { PGDCatalogueClient } from "./PGDCatalogueClient";
import { ALL_PGDS } from "@/lib/pgd-access";

const BASE_URL = "https://getrealhealthpgd.co.uk";

export const metadata: Metadata = {
  title: "PGD Catalogue — 60+ Services for UK Pharmacies",
  description:
    "60+ PGDs for UK community pharmacies: weight management (Wegovy, Mounjaro, Saxenda), travel vaccines, HRT, TRT, ED, hair loss, contraception, UTIs and more. All included in the £100/month flat fee.",
  alternates: { canonical: `${BASE_URL}/for-pharmacies/pgd-catalogue` },
};

// FAQ JSON-LD — answers the catalogue questions AI engines actually receive
// from buyers. Mirror these in any on-page accordion if/when one ships.
const faqs = [
  {
    q: "What PGD services does Get Real Health provide?",
    a: "60+ PGDs across weight management (Wegovy, Mounjaro, Saxenda, Mysimba, Orlistat), hormone therapy (HRT, TRT), travel vaccines (yellow fever, rabies, Japanese encephalitis, anti-malarials), sexual health (ED, contraception, emergency contraception, STI testing, BV, thrush, gonorrhoea, herpes management), respiratory (asthma rescue, COPD, hayfever), dermatology (acne, eczema, rosacea, impetigo, cold sores), CVD (statins, hypertension), paediatric UTI, smoking cessation, dental bridging, alopecia treatment, and many more.",
  },
  {
    q: "Are weight-loss PGDs like Wegovy and Mounjaro included?",
    a: "Yes. Wegovy, Mounjaro, Saxenda, Mysimba, and Orlistat are all included PGDs. There is also a GLP-1 monitoring PGD for dose-titration follow-ups. All weight-management services share the same £100/month flat fee — no extra fees per consultation or per service.",
  },
  {
    q: "Are travel vaccinations included?",
    a: "Yes. The travel-core PGD covers the routine travel vaccines, plus dedicated PGDs for yellow fever, rabies, Japanese encephalitis, meningitis ACWY, dengue, altitude sickness, anti-malarials, and travellers' diarrhoea — all included in the £100/month fee.",
  },
  {
    q: "Which sexual-health services are covered?",
    a: "ED treatment, contraception (including emergency and postnatal), STI testing, gonorrhoea treatment, herpes management, premature ejaculation, BV, thrush, and HPV vaccination. PrEP for HIV prevention is on the roadmap.",
  },
  {
    q: "Are HRT and TRT included?",
    a: "Yes. HRT (including testosterone for women), TRT (testosterone replacement for men), and BPH (benign prostatic hyperplasia) are included PGDs. Dr Nitin Shori is the named clinician on every one — he helped build large-scale online TRT prescribing at Pharmacy2U.",
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
  eligibleRegion: [{ "@type": "Country", name: "United Kingdom" }],
  url: `${BASE_URL}/for-pharmacies/pricing`,
};

const itemListJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Get Real Health — PGD Catalogue",
  description:
    "Patient Group Directions available to GRH-subscribed UK community pharmacies. All included in the single £100/month per pharmacy fee.",
  numberOfItems: ALL_PGDS.length,
  itemListElement: ALL_PGDS.map((pgd, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@type": "Service",
      name: `${pgd.title} PGD`,
      description: `${pgd.title} (${pgd.subtitle}) — ${pgd.category} Patient Group Direction for UK community pharmacies. Includes electronic consultation tool, training and clinical governance.`,
      category: pgd.category,
      serviceType: "Patient Group Direction",
      provider,
      areaServed: { "@type": "Country", name: "United Kingdom" },
      audience: {
        "@type": "Audience",
        audienceType: "UK community pharmacies and pharmacists",
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
