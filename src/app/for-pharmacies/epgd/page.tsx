import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getPharmacyPgdSlugs } from '@/lib/pgd-access'

export const metadata: Metadata = {
  title: 'ePGD Consultations',
  description:
    'Digital consultation tools for pharmacists. Guided PGD workflows with clinical decision support, dose recommendations, counselling checklists, and printable consultation records.',
}

const epgds = [
  // ── Men's Health ──
  { slug: 'ed', title: 'Erectile Dysfunction', subtitle: 'Sildenafil & Tadalafil', category: "Men's Health", color: 'bg-blue-500' },
  { slug: 'hair-loss', title: 'Hair Loss (Male Pattern)', subtitle: 'Finasteride / Dutasteride', category: "Men's Health", color: 'bg-blue-500' },
  { slug: 'premature-ejaculation', title: 'Premature Ejaculation', subtitle: 'Dapoxetine / Priligy', category: "Men's Health", color: 'bg-blue-500' },
  { slug: 'bph', title: 'Benign Prostatic Hyperplasia', subtitle: 'Tamsulosin with IPSS Assessment', category: "Men's Health", color: 'bg-blue-500' },
  { slug: 'trt', title: 'Testosterone Replacement', subtitle: 'Testosterone Undecanoate / Gel', category: "Men's Health", color: 'bg-blue-500' },

  // ── Women's Health ──
  { slug: 'emergency-contraception', title: 'Emergency Contraception', subtitle: 'Levonorgestrel & Ulipristal', category: "Women's Health", color: 'bg-pink-500' },
  { slug: 'hrt', title: 'HRT (Menopause)', subtitle: 'Oestradiol / Combined HRT', category: "Women's Health", color: 'bg-pink-500' },
  { slug: 'thrush', title: 'Thrush (Vaginal Candidiasis)', subtitle: 'Fluconazole / Clotrimazole', category: "Women's Health", color: 'bg-pink-500' },
  { slug: 'bv', title: 'Bacterial Vaginosis', subtitle: 'Metronidazole Oral / Vaginal Gel', category: "Women's Health", color: 'bg-pink-500' },
  { slug: 'recurrent-uti', title: 'Recurrent UTI Prophylaxis', subtitle: 'Nitrofurantoin Low-Dose Prophylaxis', category: "Women's Health", color: 'bg-pink-500' },
  { slug: 'postnatal-contraception', title: 'Postnatal Contraception', subtitle: 'POP / Desogestrel Initiation', category: "Women's Health", color: 'bg-pink-500' },
  { slug: 'testosterone-women', title: 'Testosterone for Women', subtitle: 'Androfeme Cream for Menopausal Libido', category: "Women's Health", color: 'bg-pink-500' },
  { slug: 'period-delay', title: 'Period Delay', subtitle: 'Norethisterone 5mg', category: "Women's Health", color: 'bg-pink-500' },

  // ── Sexual Health ──
  { slug: 'sti-testing', title: 'STI Testing & Treatment', subtitle: 'Chlamydia / Gonorrhoea / Syphilis', category: 'Sexual Health', color: 'bg-fuchsia-500' },
  { slug: 'prep', title: 'HIV PrEP', subtitle: 'Tenofovir / Emtricitabine Monitoring', category: 'Sexual Health', color: 'bg-fuchsia-500' },
  { slug: 'gonorrhoea-treatment', title: 'Gonorrhoea Treatment', subtitle: 'IM Ceftriaxone Protocol', category: 'Sexual Health', color: 'bg-fuchsia-500' },
  { slug: 'herpes-management', title: 'Genital Herpes Management', subtitle: 'Aciclovir / Valaciclovir', category: 'Sexual Health', color: 'bg-fuchsia-500' },
  { slug: 'genital-warts', title: 'Genital Warts', subtitle: 'Podophyllotoxin / Imiquimod', category: 'Sexual Health', color: 'bg-fuchsia-500' },

  // ── Weight Management ──
  { slug: 'wegovy', title: 'Wegovy (Semaglutide)', subtitle: 'GLP-1 RA with BMI Calculator', category: 'Weight Management', color: 'bg-emerald-500' },
  { slug: 'mounjaro', title: 'Mounjaro (Tirzepatide)', subtitle: 'GLP-1/GIP Dual Agonist', category: 'Weight Management', color: 'bg-emerald-500' },
  { slug: 'saxenda', title: 'Saxenda (Liraglutide)', subtitle: 'GLP-1 RA Daily Injection', category: 'Weight Management', color: 'bg-emerald-500' },
  { slug: 'mysimba', title: 'Mysimba', subtitle: 'Naltrexone / Bupropion Oral', category: 'Weight Management', color: 'bg-emerald-500' },
  { slug: 'orlistat', title: 'Orlistat', subtitle: 'Lipase Inhibitor with BMI Check', category: 'Weight Management', color: 'bg-emerald-500' },
  { slug: 'glp1-monitoring', title: 'GLP-1 Monitoring Follow-Up', subtitle: 'Weight, Side Effects & Dose Titration', category: 'Weight Management', color: 'bg-emerald-500' },

  // ── Skin ──
  { slug: 'acne', title: 'Acne Treatment', subtitle: 'Topical Retinoids / Antibiotics', category: 'Skin', color: 'bg-amber-500' },
  { slug: 'cold-sores', title: 'Cold Sores', subtitle: 'Aciclovir Cream / Oral', category: 'Skin', color: 'bg-amber-500' },
  { slug: 'eczema', title: 'Eczema Management', subtitle: 'Emollients & Topical Steroids', category: 'Skin', color: 'bg-amber-500' },
  { slug: 'impetigo', title: 'Impetigo', subtitle: 'Fusidic Acid & Flucloxacillin', category: 'Skin', color: 'bg-amber-500' },
  { slug: 'rosacea', title: 'Rosacea', subtitle: 'Ivermectin / Metronidazole Topical', category: 'Skin', color: 'bg-amber-500' },
  { slug: 'wound-care', title: 'Wound Care & Closure', subtitle: 'Assessment, Closure & Dressings', category: 'Skin', color: 'bg-amber-500' },
  { slug: 'alopecia-minoxidil', title: 'Alopecia (Minoxidil)', subtitle: 'Topical Minoxidil Supply', category: 'Skin', color: 'bg-amber-500' },

  // ── Acute & Infection ──
  { slug: 'uti', title: 'UTI Treatment', subtitle: 'Nitrofurantoin & Trimethoprim', category: 'Acute & Infection', color: 'bg-orange-500' },
  { slug: 'sore-throat', title: 'Sore Throat Test & Treat', subtitle: 'FeverPAIN Score + Pen V / Clarithromycin', category: 'Acute & Infection', color: 'bg-orange-500' },
  { slug: 'shingles-treatment', title: 'Shingles Acute Treatment', subtitle: 'Valaciclovir & Aciclovir', category: 'Acute & Infection', color: 'bg-orange-500' },
  { slug: 'ear-infection', title: 'Ear Infection (Otitis)', subtitle: 'Amoxicillin / Ciprofloxacin Drops', category: 'Acute & Infection', color: 'bg-orange-500' },
  { slug: 'eye-infections', title: 'Eye Infections', subtitle: 'Chloramphenicol / Fusidic Acid', category: 'Acute & Infection', color: 'bg-orange-500' },
  { slug: 'dental-bridging', title: 'Dental Bridging Antibiotics', subtitle: 'Amoxicillin / Metronidazole', category: 'Acute & Infection', color: 'bg-orange-500' },
  { slug: 'threadworms', title: 'Threadworms', subtitle: 'Mebendazole Single Dose', category: 'Acute & Infection', color: 'bg-orange-500' },

  // ── Respiratory ──
  { slug: 'asthma-rescue', title: 'Asthma Rescue Inhaler', subtitle: 'Salbutamol Emergency Supply', category: 'Respiratory', color: 'bg-cyan-500' },
  { slug: 'copd', title: 'COPD Management', subtitle: 'SABA / LABA / ICS Inhalers', category: 'Respiratory', color: 'bg-cyan-500' },
  { slug: 'hayfever', title: 'Hayfever & Allergic Rhinitis', subtitle: 'Fexofenadine / Nasal Steroids', category: 'Respiratory', color: 'bg-cyan-500' },

  // ── Cardiovascular ──
  { slug: 'hypertension', title: 'Hypertension Monitoring', subtitle: 'ABPM & Lifestyle with Referral', category: 'Cardiovascular', color: 'bg-red-500' },
  { slug: 'statins', title: 'Statins & Lipid Management', subtitle: 'Atorvastatin / Rosuvastatin', category: 'Cardiovascular', color: 'bg-red-500' },
  { slug: 'diabetes-monitoring', title: 'Diabetes Monitoring', subtitle: 'HbA1c Review & Medication Check', category: 'Cardiovascular', color: 'bg-red-500' },

  // ── Mental Health ──
  { slug: 'smoking-varenicline', title: 'Smoking Cessation (Varenicline)', subtitle: 'Champix with Fagerström Score', category: 'Mental Health', color: 'bg-teal-500' },
  { slug: 'smoking-nrt', title: 'Smoking Cessation (NRT)', subtitle: 'Patches, Gum & Inhalators', category: 'Mental Health', color: 'bg-teal-500' },
  { slug: 'alcohol-reduction', title: 'Alcohol Reduction', subtitle: 'AUDIT-C Score & Brief Intervention', category: 'Mental Health', color: 'bg-teal-500' },
  { slug: 'anxiety-propranolol', title: 'Anxiety (Propranolol)', subtitle: 'Situational Anxiety / Performance', category: 'Mental Health', color: 'bg-teal-500' },
  { slug: 'sleep-melatonin', title: 'Sleep (Melatonin)', subtitle: 'Short-Term Insomnia Management', category: 'Mental Health', color: 'bg-teal-500' },
  { slug: 'adhd-monitoring', title: 'ADHD Monitoring', subtitle: 'Shared-Care Medication Review', category: 'Mental Health', color: 'bg-teal-500' },

  // ── Vaccines ──
  { slug: 'flu', title: 'Flu Vaccination', subtitle: 'Private Flu Vaccine Administration', category: 'Vaccines', color: 'bg-sky-500' },
  { slug: 'covid-booster', title: 'COVID-19 Booster', subtitle: 'mRNA / Protein Subunit Vaccines', category: 'Vaccines', color: 'bg-sky-500' },
  { slug: 'shingles-vaccine', title: 'Shingles Vaccine (Shingrix)', subtitle: 'Recombinant Zoster Vaccine', category: 'Vaccines', color: 'bg-sky-500' },
  { slug: 'hpv', title: 'HPV Vaccination', subtitle: 'Gardasil 9 (9-Valent)', category: 'Vaccines', color: 'bg-sky-500' },
  { slug: 'pneumococcal', title: 'Pneumococcal Vaccine', subtitle: 'PCV / PPV23 Administration', category: 'Vaccines', color: 'bg-sky-500' },
  { slug: 'chickenpox', title: 'Chickenpox (Varicella)', subtitle: 'Varivax / Varilrix', category: 'Vaccines', color: 'bg-sky-500' },
  { slug: 'mmr', title: 'MMR Vaccine', subtitle: 'Measles, Mumps & Rubella', category: 'Vaccines', color: 'bg-sky-500' },
  { slug: 'meningitis-b', title: 'Meningitis B Vaccine', subtitle: 'Bexsero / Trumenba', category: 'Vaccines', color: 'bg-sky-500' },
  { slug: 'rsv', title: 'RSV Vaccine', subtitle: 'Abrysvo / Arexvy', category: 'Vaccines', color: 'bg-sky-500' },

  // ── Travel Health ──
  { slug: 'travel-core', title: 'Travel Health Consultation', subtitle: 'Risk Assessment & Vaccine Planning', category: 'Travel Health', color: 'bg-indigo-500' },
  { slug: 'anti-malarials', title: 'Anti-Malarials', subtitle: 'Atovaquone-Proguanil / Doxycycline / Mefloquine', category: 'Travel Health', color: 'bg-indigo-500' },
  { slug: 'altitude-sickness', title: 'Altitude Sickness', subtitle: 'Acetazolamide Prophylaxis', category: 'Travel Health', color: 'bg-indigo-500' },
  { slug: 'travellers-diarrhoea', title: "Travellers' Diarrhoea", subtitle: 'Ciprofloxacin / Loperamide', category: 'Travel Health', color: 'bg-indigo-500' },
  { slug: 'dengue', title: 'Dengue Vaccine', subtitle: 'Qdenga (TAK-003)', category: 'Travel Health', color: 'bg-indigo-500' },
  { slug: 'rabies', title: 'Rabies Vaccine', subtitle: 'Pre-Exposure Prophylaxis', category: 'Travel Health', color: 'bg-indigo-500' },
  { slug: 'japanese-encephalitis', title: 'Japanese Encephalitis', subtitle: 'Ixiaro Vaccine', category: 'Travel Health', color: 'bg-indigo-500' },
  { slug: 'meningitis-acwy-travel', title: 'Meningitis ACWY (Travel)', subtitle: 'Nimenrix / MenQuadfi', category: 'Travel Health', color: 'bg-indigo-500' },

  // ── Occupational Health ──
  { slug: 'hep-b-occupational', title: 'Hepatitis B (Occupational)', subtitle: 'Engerix-B / HBvaxPRO', category: 'Occupational Health', color: 'bg-violet-500' },

  // ── Paediatrics ──
  { slug: 'paediatric-uti', title: 'Paediatric UTI', subtitle: 'Trimethoprim / Nitrofurantoin (Paeds)', category: 'Paediatrics', color: 'bg-lime-500' },
]

const categoryOrder = [
  "Men's Health",
  "Women's Health",
  'Sexual Health',
  'Weight Management',
  'Skin',
  'Acute & Infection',
  'Respiratory',
  'Cardiovascular',
  'Mental Health',
  'Vaccines',
  'Travel Health',
  'Occupational Health',
  'Paediatrics',
]

export default async function EPGDIndexPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const isSuperAdmin = session.user.role === 'super_admin'

  // Get the PGD slugs this user's pharmacy can access
  let allowedSlugs: string[] = []
  if (isSuperAdmin) {
    allowedSlugs = epgds.map((e) => e.slug)
  } else if (session.user.pharmacyId) {
    allowedSlugs = await getPharmacyPgdSlugs(session.user.pharmacyId)
  }

  const allowedSet = new Set(allowedSlugs)
  const accessibleEpgds = epgds.filter((e) => allowedSet.has(e.slug))

  const categories = categoryOrder.filter((cat) =>
    accessibleEpgds.some((e) => e.category === cat)
  )

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <Link href="/for-pharmacies" className="hover:text-teal-600 transition-colors">
              For Pharmacies
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">ePGD Consultations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">ePGD Consultations</h1>
          <p className="text-sm text-gray-500 mt-2 max-w-2xl">
            Digital clinical decision support tools for pharmacists. Each ePGD guides you through a
            complete PGD consultation — from patient screening to medicine supply — with built-in
            safety checks and printable consultation records.
          </p>
        </div>

        {/* Stats bar */}
        <div className="flex flex-wrap gap-4 sm:gap-6 mb-8 text-sm">
          <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
            <span className="text-2xl font-bold text-teal-600">{accessibleEpgds.length}</span>
            <span className="text-gray-500 ml-2">ePGDs available</span>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
            <span className="text-2xl font-bold text-gray-900">{categories.length}</span>
            <span className="text-gray-500 ml-2">clinical categories</span>
          </div>
        </div>

        {/* Empty state */}
        {accessibleEpgds.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-400 text-3xl mb-4">
              🔒
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">No ePGDs Assigned</h2>
            <p className="text-gray-500 max-w-md mx-auto">
              Your pharmacy does not have any ePGD subscriptions yet. Contact your administrator to
              get started.
            </p>
          </div>
        )}

        {/* Category sections */}
        <div className="space-y-10">
          {categories.map((cat) => {
            const items = accessibleEpgds.filter((e) => e.category === cat)
            return (
              <div key={cat}>
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${items[0].color}`} />
                  {cat}
                  <span className="text-xs font-normal text-gray-400 ml-1">({items.length})</span>
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((tool) => (
                    <Link
                      key={tool.slug}
                      href={`/for-pharmacies/epgd/${tool.slug}`}
                      className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-teal-300 transition-all overflow-hidden"
                    >
                      <div className={`h-1.5 ${tool.color}`} />
                      <div className="p-5">
                        <h3 className="text-base font-bold text-gray-900 group-hover:text-teal-700 transition-colors">
                          {tool.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">{tool.subtitle}</p>
                        <div className="flex items-center justify-end mt-4 pt-3 border-t border-gray-100">
                          <span className="text-xs font-medium text-teal-600 group-hover:text-teal-700">
                            Open ePGD &rarr;
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer note */}
        <div className="mt-10 text-center">
          <p className="text-xs text-gray-400 max-w-lg mx-auto">
            Each ePGD follows NICE guidelines and is designed as a clinical decision support aid —
            the pharmacist retains full clinical responsibility.
          </p>
        </div>
      </div>
    </div>
  )
}
