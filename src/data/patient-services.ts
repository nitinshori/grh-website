/**
 * Patient-facing service categories and descriptions.
 * Maps PGD categories to patient-friendly language — no clinical jargon.
 */

export interface PatientCategory {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  icon: string; // emoji for simple rendering
  color: string; // tailwind bg class
  textColor: string; // tailwind text class
  popularServices: string[];
  whyPharmacy: string;
  seoTitle: string;
  seoDescription: string;
}

export const patientCategories: PatientCategory[] = [
  {
    slug: "travel-health",
    name: "Travel Health",
    tagline: "Jabs, malaria tablets, and travel-ready in one visit",
    description:
      "Heading abroad? Your local pharmacy can provide all the travel vaccinations, anti-malarials, and health advice you need — no GP referral, no waiting weeks. Book a travel consultation and get protected before you go.",
    icon: "✈️",
    color: "bg-blue-50",
    textColor: "text-blue-700",
    popularServices: [
      "Travel vaccinations (typhoid, hepatitis A & B, yellow fever, and more)",
      "Anti-malarial tablets",
      "Dengue fever vaccination",
      "Rabies pre-exposure vaccination",
      "Japanese encephalitis vaccination",
      "Meningitis ACWY (travel & Hajj/Umrah)",
      "Altitude sickness prevention",
      "Traveller's diarrhoea standby treatment",
    ],
    whyPharmacy:
      "GP travel clinics have long waits and limited availability. Your pharmacy can see you this week — often the same day — and provide everything in one appointment.",
    seoTitle: "Travel Vaccinations & Health at Your Local Pharmacy",
    seoDescription:
      "Get travel vaccinations, anti-malarials, and health advice at a pharmacy near you. No GP referral needed. Book today.",
  },
  {
    slug: "vaccines",
    name: "Vaccines & Immunisations",
    tagline: "Private vaccinations without the wait",
    description:
      "From flu jabs to shingles and chickenpox, your pharmacy offers private vaccinations for adults and children — often available the same week. No need to wait for a GP appointment.",
    icon: "💉",
    color: "bg-green-50",
    textColor: "text-green-700",
    popularServices: [
      "Private flu vaccination",
      "Shingles vaccination",
      "Chickenpox vaccination",
      "Pneumococcal vaccination",
      "RSV vaccination",
      "Meningitis B vaccination",
      "HPV vaccination for adults",
      "COVID-19 boosters",
    ],
    whyPharmacy:
      "The NHS doesn't cover every age group for every vaccine. Private pharmacy vaccination fills the gap — quick, convenient, and no referral needed.",
    seoTitle: "Private Vaccinations at Your Local Pharmacy",
    seoDescription:
      "Book private flu, shingles, chickenpox, and other vaccinations at a pharmacy near you. No GP referral. Walk-in and appointment options.",
  },
  {
    slug: "weight-management",
    name: "Weight Management",
    tagline: "Clinically supported weight management at your pharmacy",
    description:
      "Pharmacy-based weight management combines clinical assessment, structured monitoring and ongoing support from a qualified pharmacist. Your pharmacist will discuss whether you may be eligible for treatment based on UK clinical guidelines, and what the right next step is for you.",
    icon: "⚖️",
    color: "bg-orange-50",
    textColor: "text-orange-700",
    popularServices: [
      "Eligibility assessment against UK weight management guidelines",
      "Ongoing monitoring and dose review for those already in treatment",
      "BMI, blood pressure and lifestyle review",
      "Onward referral where appropriate",
    ],
    whyPharmacy:
      "Weight management works best when it's supported in person. Your pharmacist can offer face-to-face consultations, regular monitoring, and continuity of care &mdash; not just a one-off prescription.",
    seoTitle: "Weight Management Services at Your Local Pharmacy",
    seoDescription:
      "Clinically supported weight management at a pharmacy near you. Eligibility assessment, monitoring and face-to-face support from a qualified pharmacist.",
  },
  {
    slug: "womens-health",
    name: "Women's Health",
    tagline: "From contraception to menopause — on your terms",
    description:
      "Access women's health services at your local pharmacy without the long GP wait. Emergency contraception, HRT, UTI treatment, and more — private, convenient, and clinician-led.",
    icon: "🌸",
    color: "bg-pink-50",
    textColor: "text-pink-700",
    popularServices: [
      "Emergency contraception (morning after pill)",
      "HRT initiation for menopause",
      "UTI treatment (same-day antibiotics)",
      "Recurrent UTI prevention",
      "Thrush treatment",
      "Bacterial vaginosis treatment",
    ],
    whyPharmacy:
      "Women's health services are overstretched in the NHS. Your pharmacy offers same-day or next-day consultations for conditions that shouldn't mean weeks of waiting.",
    seoTitle: "Women's Health Services at Your Local Pharmacy",
    seoDescription:
      "Emergency contraception, HRT, UTI treatment, and more at a pharmacy near you. Private, convenient, no GP referral needed.",
  },
  {
    slug: "mens-health",
    name: "Men's Health",
    tagline: "Discreet, professional, no GP needed",
    description:
      "Erectile dysfunction, hair loss, and other men's health concerns — treated privately and professionally at your local pharmacy. No awkward GP appointments. No waiting.",
    icon: "💪",
    color: "bg-purple-50",
    textColor: "text-purple-700",
    popularServices: [
      "Erectile dysfunction assessment and treatment",
      "Male pattern hair loss treatment",
      "Premature ejaculation treatment",
      "Testosterone replacement therapy (TRT)",
    ],
    whyPharmacy:
      "Many men avoid their GP for these conversations. Your pharmacist is trained, professional, and discreet — and you can often be seen the same day.",
    seoTitle: "Men's Health Services at Your Local Pharmacy",
    seoDescription:
      "Erectile dysfunction, hair loss, and men's health treatment at a pharmacy near you. Private, discreet, no GP referral required.",
  },
  {
    slug: "sexual-health",
    name: "Sexual Health",
    tagline: "Testing, treatment, and prevention — fast",
    description:
      "STI testing, PrEP for HIV prevention, and treatment for common infections — available privately at your local pharmacy. Confidential, quick, and no referral needed.",
    icon: "🛡️",
    color: "bg-indigo-50",
    textColor: "text-indigo-700",
    popularServices: [
      "STI testing (Chlamydia, Gonorrhoea, HIV)",
      "PrEP (HIV pre-exposure prophylaxis)",
      "Herpes management",
      "Genital warts treatment",
    ],
    whyPharmacy:
      "Sexual health clinic waits can be weeks long. Your pharmacy offers confidential, same-day access to testing and treatment.",
    seoTitle: "Sexual Health Services at Your Local Pharmacy",
    seoDescription:
      "STI testing, PrEP, and sexual health treatment at a pharmacy near you. Confidential, fast, no GP referral needed.",
  },
  {
    slug: "mental-wellbeing",
    name: "Mental Wellbeing",
    tagline: "Smoking, anxiety, sleep — practical pharmacy support",
    description:
      "Your pharmacy can help with smoking cessation, short-term anxiety relief, sleep support, and alcohol reduction — practical, accessible help without long NHS waits.",
    icon: "🧠",
    color: "bg-violet-50",
    textColor: "text-violet-700",
    popularServices: [
      "Smoking cessation support (with prescription options where suitable)",
      "Alcohol reduction support",
      "Short-term physical anxiety symptom relief",
      "Short-term sleep support",
    ],
    whyPharmacy:
      "NHS mental health services have some of the longest waits in healthcare. Your pharmacy provides quick, practical support for everyday wellbeing concerns.",
    seoTitle: "Mental Wellbeing Support at Your Pharmacy",
    seoDescription:
      "Smoking cessation, anxiety relief, sleep support, and alcohol reduction at a pharmacy near you. Quick, practical help.",
  },
  {
    slug: "skin",
    name: "Skin Conditions",
    tagline: "Acne, eczema, cold sores — treated today",
    description:
      "Prescription-strength skin treatments available at your pharmacy, without waiting months for a dermatology referral. Acne, eczema flares, cold sores, rosacea, and more.",
    icon: "✨",
    color: "bg-amber-50",
    textColor: "text-amber-700",
    popularServices: [
      "Acne treatment (topical and oral)",
      "Rosacea treatment",
      "Cold sore treatment (prescription strength)",
      "Eczema flare management",
      "Minor wound care",
    ],
    whyPharmacy:
      "Dermatology referrals can take months. Your pharmacy can assess and treat common skin conditions the same day with prescription-strength medication.",
    seoTitle: "Skin Condition Treatment at Your Local Pharmacy",
    seoDescription:
      "Acne, eczema, rosacea, and cold sore treatment at a pharmacy near you. Prescription-strength, no GP referral needed.",
  },
  {
    slug: "respiratory",
    name: "Respiratory",
    tagline: "Asthma, hayfever, and sore throats sorted",
    description:
      "Prescription-strength hayfever treatment, asthma rescue inhalers, sore throat test-and-treat, and more — available now at your local pharmacy.",
    icon: "🫁",
    color: "bg-cyan-50",
    textColor: "text-cyan-700",
    popularServices: [
      "Prescription-strength hayfever treatment",
      "Rescue inhaler bridging supply",
      "Sore throat test and treat",
      "COPD symptom management",
    ],
    whyPharmacy:
      "Respiratory symptoms often need rapid attention. Your pharmacy can assess and treat many common respiratory conditions the same day, freeing up GP appointments for more complex care.",
    seoTitle: "Respiratory Treatment at Your Local Pharmacy",
    seoDescription:
      "Hayfever, asthma, sore throat, and respiratory treatment at a pharmacy near you. Same-day access, no GP referral.",
  },
  {
    slug: "heart-health",
    name: "Heart & Diabetes",
    tagline: "Convenient monitoring for long-term conditions",
    description:
      "Blood pressure checks, cholesterol management and diabetes monitoring at your local pharmacy &mdash; complementing your GP care and making it easier to stay on top of long-term conditions between appointments.",
    icon: "❤️",
    color: "bg-red-50",
    textColor: "text-red-700",
    popularServices: [
      "Blood pressure monitoring and treatment",
      "Statin continuation",
      "Diabetes type 2 monitoring",
    ],
    whyPharmacy:
      "Pharmacies are well placed to provide continuation supply and regular check-ups for long-term conditions, working alongside your existing GP care.",
    seoTitle: "Heart & Diabetes Monitoring at Your Pharmacy",
    seoDescription:
      "Blood pressure, cholesterol and diabetes monitoring at a pharmacy near you. Bridging supply and check-ups to support your existing care.",
  },
  {
    slug: "children",
    name: "Children's Health",
    tagline: "Fast treatment for common childhood illnesses",
    description:
      "When your child is unwell, you want a quick clinical assessment from someone you trust. Your pharmacy can assess and treat a range of common childhood conditions &mdash; impetigo, UTIs, threadworms, and more.",
    icon: "👶",
    color: "bg-rose-50",
    textColor: "text-rose-700",
    popularServices: [
      "Impetigo treatment",
      "Paediatric UTI treatment",
      "Threadworm treatment (prescription strength)",
    ],
    whyPharmacy:
      "Parents know how stressful it is when your child is unwell. Your pharmacy can often see and treat children the same day.",
    seoTitle: "Children's Health Services at Your Local Pharmacy",
    seoDescription:
      "Quick treatment for childhood impetigo, UTIs, and threadworms at a pharmacy near you. Same-day access for parents.",
  },
  {
    slug: "minor-ailments",
    name: "Minor Ailments",
    tagline: "Ear infections, eye infections, shingles — sorted fast",
    description:
      "Common ailments that don't need a GP but do need prescription treatment. Your pharmacy can diagnose and treat ear infections, eye infections, shingles, and dental pain — often the same day.",
    icon: "🩹",
    color: "bg-emerald-50",
    textColor: "text-emerald-700",
    popularServices: [
      "Ear infection treatment",
      "Eye infection treatment (prescription strength)",
      "Shingles treatment (time-critical)",
      "Dental pain bridging antibiotics",
    ],
    whyPharmacy:
      "These conditions often need treatment quickly &mdash; shingles, for example, is most effective when started within 72 hours. Your pharmacy can often assess and treat you the same day.",
    seoTitle: "Minor Ailment Treatment at Your Local Pharmacy",
    seoDescription:
      "Ear infections, eye infections, shingles, and dental pain treated at a pharmacy near you. Fast, no GP referral.",
  },
];

/** Get a category by its URL slug */
export function getCategoryBySlug(slug: string): PatientCategory | undefined {
  return patientCategories.find((c) => c.slug === slug);
}
