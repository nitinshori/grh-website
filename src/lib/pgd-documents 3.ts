/**
 * PGD Document mapping — maps ePGD slugs to their written PGD PDF files.
 * PDFs are stored in /public/pgd-documents/{slug}.pdf
 *
 * 3 PGDs could not be auto-converted due to file size limits:
 *   - trt (Testosterone Replacement)
 *   - testosterone-women (Testosterone for Women)
 *   - travellers-diarrhoea (Traveller's Diarrhoea)
 * These need manual upload to public/pgd-documents/
 */

/** Set of slugs that have a written PGD PDF available */
export const PGD_DOCUMENT_SLUGS = new Set([
  'acne',
  'adhd-monitoring',
  'alcohol-reduction',
  'alopecia-minoxidil',
  'altitude-sickness',
  'anti-malarials',
  'anxiety-propranolol',
  'asthma-rescue',
  'bph',
  'bv',
  'chickenpox',
  'cold-sores',
  'copd',
  'covid-booster',
  'dengue',
  'dental-bridging',
  'diabetes-monitoring',
  'ear-infection',
  'eczema',
  'ed',
  'emergency-contraception',
  'eye-infections',
  'flu',
  'genital-warts',
  'glp1-monitoring',
  'gonorrhoea-treatment',
  'hair-loss',
  'hayfever',
  'hep-b-occupational',
  'herpes-management',
  'hpv',
  'hrt',
  'hypertension',
  'impetigo',
  'japanese-encephalitis',
  'meningitis-acwy-travel',
  'meningitis-b',
  'mmr',
  'mounjaro',
  'mysimba',
  'orlistat',
  'paediatric-uti',
  'period-delay',
  'pneumococcal',
  'postnatal-contraception',
  'premature-ejaculation',
  'prep',
  'rabies',
  'recurrent-uti',
  'rosacea',
  'rsv',
  'saxenda',
  'shingles-treatment',
  'shingles-vaccine',
  'sleep-melatonin',
  'smoking-nrt',
  'smoking-varenicline',
  'sore-throat',
  'statins',
  'sti-testing',
  'threadworms',
  'thrush',
  'travel-core',
  'uti',
  'wegovy',
  'wound-care',
]);

/** Get the download URL for a PGD document, or null if not available */
export function getPgdDocumentUrl(slug: string): string | null {
  if (PGD_DOCUMENT_SLUGS.has(slug)) {
    return `/pgd-documents/${slug}.pdf`;
  }
  return null;
}

/** Check if a written PGD document is available for a given slug */
export function hasPgdDocument(slug: string): boolean {
  return PGD_DOCUMENT_SLUGS.has(slug);
}
