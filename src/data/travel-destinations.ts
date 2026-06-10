/**
 * Travel destinations — clinical reference for the pharmacist-facing
 * destination checker at /for-pharmacies/dashboard/travel-checker.
 *
 * Source of truth for clinical content: NaTHNaC (Travel Health Pro).
 * Each entry should carry a `lastReviewed` stamp once a GRH clinician
 * (Chris/Nitin) has signed off against the live NaTHNaC page for that
 * country. Treat anything without a `lastReviewed` field as DRAFT and
 * surface a warning banner in the UI.
 *
 * Adding a new destination:
 *   1. Pull the NaTHNaC country page and read it through.
 *   2. Map each recommendation into a VaccineRecommendation. Use the
 *      `pgdId` of the PGD that delivers it on the GRH platform — most
 *      routine vaccines route through `travel-core` (the combo PGD).
 *   3. Set `trigger` to 'all' for routine, or list TriggerConditions
 *      for conditional ("only if rural / long-stay / animal contact").
 *   4. Populate malaria + entry requirements.
 *   5. Set `asks` to only the questions that actually change a rec —
 *      don't ask about rural travel if no rec depends on it.
 *   6. Have Chris sign off, set `lastReviewed: 'YYYY-MM'`.
 */

export type PgdRoute =
  | 'travel-core'
  | 'anti-malarials'
  | 'dengue'
  | 'rabies'
  | 'japanese-encephalitis'
  | 'meningitis-acwy-travel'
  | 'altitude-sickness'
  | 'travellers-diarrhoea'
  | 'typhoid'
  | 'yellow-fever'
  | 'hep-ab-travel'

/** Single trigger object. A recommendation fires if ANY trigger
 *  matches the consultation answers, and within a trigger ALL set
 *  fields must hold. Use multiple trigger objects to express OR
 *  across different combinations. */
export interface TriggerCondition {
  rural?: true
  longStay?: true               // > 4 weeks
  outdoorActivities?: true      // hiking, camping, fieldwork
  animalContact?: true          // farmers, vets, kids, bat caves
  medicalWork?: true            // HCWs, lab workers
  sexualContact?: true          // counselled as risk
  bodyMods?: true               // tattoos, piercings, dental abroad
  hajj?: true                   // Hajj/Umrah pilgrimage
  vfr?: true                    // visiting friends/relatives
}

export interface VaccineRecommendation {
  /** Display name shown on the recommendation card. */
  vaccine: string
  /** PGD that delivers this vaccine on the GRH platform. */
  pgdId: PgdRoute
  /** Clinical justification shown to the pharmacist (1 sentence). */
  reason: string
  /** 'all' = routine, fires for everyone going here.
   *  Array of TriggerCondition = conditional, fires if any match. */
  trigger: 'all' | TriggerCondition[]
}

export interface MalariaProfile {
  risk: 'none' | 'very-low' | 'low' | 'moderate' | 'high'
  /** Geographic distribution within the country */
  regions?: string
  /** Seasonal pattern */
  seasonality?: string
  /** Whether to recommend the anti-malarials PGD in results */
  recommendAntimalarials: boolean
  /** Free-text notes, e.g. drug resistance patterns */
  notes?: string
}

export interface EntryRequirement {
  /** Vaccine name shown in the badge */
  vaccine: string
  /** Conditions / details. Be explicit about country-of-origin rules. */
  details: string
}

export interface DestinationAsks {
  rural?: boolean
  longStay?: boolean
  activities?: boolean
  vfr?: boolean
  hajj?: boolean
}

export interface TravelDestination {
  iso: string                  // ISO 3166-1 alpha-2
  name: string
  region:
    | 'South Asia'
    | 'SE Asia'
    | 'East Asia'
    | 'Sub-Saharan Africa'
    | 'North Africa & MENA'
    | 'Europe'
    | 'North America'
    | 'Central America'
    | 'South America'
    | 'Oceania'
    | 'Caribbean'
  /** One-sentence headline shown above the results. */
  oneLiner: string
  recommendations: VaccineRecommendation[]
  asks: DestinationAsks
  malaria: MalariaProfile
  entryRequirements: EntryRequirement[]
  /** YYYY-MM. UI shows a draft warning until this is set. */
  lastReviewed?: string
  /** Free-form notes from NaTHNaC. Shown in a sidebar callout. */
  notes?: string
}

// ─── Country profiles ──────────────────────────────────────────────
//
// All five seed entries are DRAFT (no lastReviewed) — Chris/Nitin to
// validate against NaTHNaC before they go live to pharmacists.

export const destinations: TravelDestination[] = [
  // ═══ PAKISTAN ═══
  {
    iso: 'PK',
    name: 'Pakistan',
    region: 'South Asia',
    oneLiner:
      'Routine Hepatitis A and tetanus booster for everyone. Typhoid for most. Rabies + Hepatitis B for rural travel, long stays or VFR. Malaria present at lower altitudes.',
    asks: {
      rural: true,
      longStay: true,
      activities: true,
      vfr: true,
    },
    recommendations: [
      {
        vaccine: 'Hepatitis A',
        pgdId: 'travel-core',
        reason: 'Food/water-borne — recommended for all travellers.',
        trigger: 'all',
      },
      {
        vaccine: 'Tetanus / Diphtheria / Polio booster',
        pgdId: 'travel-core',
        reason:
          'Polio remains endemic in Pakistan — boost if last dose was >10 years ago, or if travelling for >4 weeks.',
        trigger: 'all',
      },
      {
        vaccine: 'Typhoid',
        pgdId: 'travel-core',
        reason:
          'Significant typhoid burden including drug-resistant strains — recommended for most travellers, especially VFR.',
        trigger: [{ rural: true }, { longStay: true }, { vfr: true }],
      },
      {
        vaccine: 'Hepatitis B',
        pgdId: 'travel-core',
        reason:
          'For long stays, healthcare/aid work, sexual contact, tattoos/piercings, or VFR with extended community contact.',
        trigger: [
          { longStay: true },
          { medicalWork: true },
          { sexualContact: true },
          { bodyMods: true },
          { vfr: true },
        ],
      },
      {
        vaccine: 'Rabies (pre-exposure)',
        pgdId: 'rabies',
        reason:
          'Dog-mediated rabies endemic. Recommend for rural travel, animal contact, long stays, and children (less likely to report bites).',
        trigger: [
          { rural: true },
          { animalContact: true },
          { longStay: true },
          { outdoorActivities: true },
        ],
      },
    ],
    malaria: {
      risk: 'moderate',
      regions:
        'All areas below 2500m — particularly Sindh, southern Punjab and Balochistan. Karachi is low risk.',
      seasonality: 'Year-round, peak April–October.',
      recommendAntimalarials: true,
      notes:
        'P. falciparum and P. vivax both circulate. Chloroquine resistance widespread — first-line is atovaquone/proguanil or doxycycline.',
    },
    entryRequirements: [
      {
        vaccine: 'Yellow Fever',
        details:
          'Certificate required for travellers ≥1 year old arriving from a country with risk of YF transmission. No risk in Pakistan itself.',
      },
    ],
    notes:
      'NaTHNaC currently advises that polio vaccination is recommended for ALL travellers due to ongoing wild poliovirus circulation. Long-stay (>4 weeks) travellers may be required to show proof of polio vaccination on departure.',
  },

  // ═══ INDIA ═══
  {
    iso: 'IN',
    name: 'India',
    region: 'South Asia',
    oneLiner:
      'Routine Hepatitis A, typhoid and tetanus booster. Rabies and Hepatitis B for rural, long-stay or VFR. Malaria across most of the country.',
    asks: {
      rural: true,
      longStay: true,
      activities: true,
      vfr: true,
    },
    recommendations: [
      {
        vaccine: 'Hepatitis A',
        pgdId: 'travel-core',
        reason: 'Recommended for all travellers.',
        trigger: 'all',
      },
      {
        vaccine: 'Typhoid',
        pgdId: 'travel-core',
        reason: 'High typhoid risk including drug-resistant strains.',
        trigger: 'all',
      },
      {
        vaccine: 'Tetanus / Diphtheria / Polio booster',
        pgdId: 'travel-core',
        reason: 'Standard booster if >10 years since last dose.',
        trigger: 'all',
      },
      {
        vaccine: 'Hepatitis B',
        pgdId: 'travel-core',
        reason:
          'For long stays, healthcare work, sexual contact, tattoos/piercings, or VFR.',
        trigger: [
          { longStay: true },
          { medicalWork: true },
          { sexualContact: true },
          { bodyMods: true },
          { vfr: true },
        ],
      },
      {
        vaccine: 'Rabies (pre-exposure)',
        pgdId: 'rabies',
        reason:
          'India has the world\'s highest burden of dog-mediated rabies. Recommend for rural travel, animal contact, long stays, children.',
        trigger: [
          { rural: true },
          { animalContact: true },
          { longStay: true },
          { outdoorActivities: true },
        ],
      },
      {
        vaccine: 'Japanese Encephalitis',
        pgdId: 'japanese-encephalitis',
        reason:
          'Risk in rural rice-growing/pig-farming areas, particularly during/after monsoon. Consider for rural travel of ≥1 month or repeated travel to risk areas.',
        trigger: [{ rural: true, longStay: true }],
      },
    ],
    malaria: {
      risk: 'moderate',
      regions:
        'Risk in almost all of India below 2000m — including major cities (Delhi, Mumbai, Chennai, Kolkata). No risk in parts of Himachal Pradesh, J&K, Sikkim above 2000m.',
      seasonality:
        'Year-round, peak during/after monsoon (June–October).',
      recommendAntimalarials: true,
      notes:
        'Mostly P. vivax with some P. falciparum (chloroquine-resistant). Atovaquone/proguanil or doxycycline preferred.',
    },
    entryRequirements: [
      {
        vaccine: 'Yellow Fever',
        details:
          'Certificate required for travellers ≥9 months old arriving from any country with risk of YF transmission, including airport transit >12 hours.',
      },
    ],
  },

  // ═══ THAILAND ═══
  {
    iso: 'TH',
    name: 'Thailand',
    region: 'SE Asia',
    oneLiner:
      'Routine Hepatitis A and tetanus booster. Typhoid, Hep B and rabies for off-tourist-route, long stay or higher-risk activities. Limited malaria, JE risk in rural areas.',
    asks: {
      rural: true,
      longStay: true,
      activities: true,
    },
    recommendations: [
      {
        vaccine: 'Hepatitis A',
        pgdId: 'travel-core',
        reason: 'Recommended for all travellers.',
        trigger: 'all',
      },
      {
        vaccine: 'Tetanus / Diphtheria / Polio booster',
        pgdId: 'travel-core',
        reason: 'Standard booster if >10 years since last dose.',
        trigger: 'all',
      },
      {
        vaccine: 'Typhoid',
        pgdId: 'travel-core',
        reason:
          'For travellers eating outside tourist resorts or staying with locals.',
        trigger: [{ rural: true }, { longStay: true }, { vfr: true }],
      },
      {
        vaccine: 'Hepatitis B',
        pgdId: 'travel-core',
        reason:
          'For long stays, medical work, sexual contact, or body modifications (Thailand is a common tattoo/piercing destination).',
        trigger: [
          { longStay: true },
          { medicalWork: true },
          { sexualContact: true },
          { bodyMods: true },
        ],
      },
      {
        vaccine: 'Rabies (pre-exposure)',
        pgdId: 'rabies',
        reason:
          'Endemic — including in Bangkok. Consider for backpackers, cyclists, children, and anyone with significant outdoor or animal contact.',
        trigger: [
          { rural: true },
          { animalContact: true },
          { longStay: true },
          { outdoorActivities: true },
        ],
      },
      {
        vaccine: 'Japanese Encephalitis',
        pgdId: 'japanese-encephalitis',
        reason:
          'Risk in rural rice-growing/pig-farming areas. Recommend for rural stays of ≥1 month or shorter stays with significant rural exposure.',
        trigger: [{ rural: true, longStay: true }],
      },
    ],
    malaria: {
      risk: 'very-low',
      regions:
        'Limited to forested border areas with Myanmar, Cambodia and Laos. No risk in Bangkok, Chiang Mai, Phuket, Koh Samui, or other main tourist resorts.',
      seasonality: 'Year-round in risk areas.',
      recommendAntimalarials: false,
      notes:
        'Bite-avoidance usually sufficient. Chemoprophylaxis only for rural travel along specific border regions — check NaTHNaC for current advice.',
    },
    entryRequirements: [
      {
        vaccine: 'Yellow Fever',
        details:
          'Certificate required for travellers ≥1 year old arriving from a country with risk of YF transmission.',
      },
    ],
  },

  // ═══ KENYA ═══
  {
    iso: 'KE',
    name: 'Kenya',
    region: 'Sub-Saharan Africa',
    oneLiner:
      'Routine Hepatitis A and tetanus booster, plus Yellow Fever for most travellers. Typhoid, Hep B and rabies for higher-risk profiles. High malaria risk across most of country.',
    asks: {
      rural: true,
      longStay: true,
      activities: true,
      vfr: true,
    },
    recommendations: [
      {
        vaccine: 'Hepatitis A',
        pgdId: 'travel-core',
        reason: 'Recommended for all travellers.',
        trigger: 'all',
      },
      {
        vaccine: 'Tetanus / Diphtheria / Polio booster',
        pgdId: 'travel-core',
        reason: 'Standard booster if >10 years since last dose.',
        trigger: 'all',
      },
      {
        vaccine: 'Yellow Fever',
        pgdId: 'yellow-fever',
        reason:
          'YF transmission risk in much of Kenya — recommended for all travellers ≥9 months old to risk areas. Required for entry from YF-endemic countries.',
        trigger: 'all',
      },
      {
        vaccine: 'Typhoid',
        pgdId: 'travel-core',
        reason:
          'Recommended for all travellers visiting non-tourist areas, eating local food, or VFR.',
        trigger: [{ rural: true }, { vfr: true }, { longStay: true }],
      },
      {
        vaccine: 'Hepatitis B',
        pgdId: 'travel-core',
        reason:
          'For long stays, healthcare/aid work, sexual contact, tattoos/piercings, or VFR.',
        trigger: [
          { longStay: true },
          { medicalWork: true },
          { sexualContact: true },
          { bodyMods: true },
          { vfr: true },
        ],
      },
      {
        vaccine: 'Rabies (pre-exposure)',
        pgdId: 'rabies',
        reason:
          'Endemic. Recommend for rural travel, safari/outdoor work, long stays, and children.',
        trigger: [
          { rural: true },
          { animalContact: true },
          { longStay: true },
          { outdoorActivities: true },
        ],
      },
    ],
    malaria: {
      risk: 'high',
      regions:
        'Year-round risk across most of Kenya below 2500m, including coastal resorts (Mombasa, Diani, Watamu) and most safari destinations. No risk in Nairobi city centre or Kenyan Highlands above 2500m.',
      seasonality: 'Year-round, with peaks following the rainy seasons.',
      recommendAntimalarials: true,
      notes:
        'Predominantly P. falciparum. First-line chemoprophylaxis: atovaquone/proguanil, doxycycline, or mefloquine.',
    },
    entryRequirements: [
      {
        vaccine: 'Yellow Fever',
        details:
          'Certificate required for travellers ≥1 year old arriving from a country with risk of YF transmission, including >12 hour airport transit.',
      },
    ],
    notes:
      'Most of Kenya is classed as YF risk by WHO — the UK YF vaccine recommendation runs broader than the Kenyan entry requirement. Counsel patient that YF is recommended for their own protection as well as for onward travel.',
  },

  // ═══ SAUDI ARABIA ═══
  {
    iso: 'SA',
    name: 'Saudi Arabia',
    region: 'North Africa & MENA',
    oneLiner:
      'Routine Hepatitis A and tetanus booster. Meningitis ACWY is mandatory for Hajj/Umrah pilgrims. Conditional Hep B, Typhoid and Rabies for longer or higher-risk stays.',
    asks: {
      hajj: true,
      longStay: true,
      activities: true,
      vfr: true,
    },
    recommendations: [
      {
        vaccine: 'Hepatitis A',
        pgdId: 'travel-core',
        reason: 'Recommended for all travellers.',
        trigger: 'all',
      },
      {
        vaccine: 'Tetanus / Diphtheria / Polio booster',
        pgdId: 'travel-core',
        reason: 'Standard booster if >10 years since last dose.',
        trigger: 'all',
      },
      {
        vaccine: 'Meningitis ACWY',
        pgdId: 'meningitis-acwy-travel',
        reason:
          'MANDATORY for Hajj/Umrah — valid certificate (issued ≥10 days and ≤3 years before arrival) is a Saudi entry requirement.',
        trigger: [{ hajj: true }],
      },
      {
        vaccine: 'Typhoid',
        pgdId: 'travel-core',
        reason:
          'For travellers visiting non-tourist areas, eating local food extensively, or VFR.',
        trigger: [{ longStay: true }, { vfr: true }],
      },
      {
        vaccine: 'Hepatitis B',
        pgdId: 'travel-core',
        reason:
          'For long stays, healthcare/aid work, sexual contact, tattoos/piercings, or VFR.',
        trigger: [
          { longStay: true },
          { medicalWork: true },
          { sexualContact: true },
          { bodyMods: true },
          { vfr: true },
        ],
      },
      {
        vaccine: 'Rabies (pre-exposure)',
        pgdId: 'rabies',
        reason:
          'Endemic in animal populations. Consider for rural travel, animal contact, long stays.',
        trigger: [
          { rural: true },
          { animalContact: true },
          { longStay: true },
        ],
      },
    ],
    malaria: {
      risk: 'very-low',
      regions:
        'Very limited risk in southwestern provinces (Asir, Jazan) at altitudes below 2000m, excluding the high-altitude areas of Asir province. No risk in Mecca, Medina, Jeddah, Riyadh or other major cities.',
      seasonality: 'Year-round in risk areas, peak September–January.',
      recommendAntimalarials: false,
      notes:
        'Bite-avoidance generally sufficient. Chemoprophylaxis only for travel to specific rural southwestern areas.',
    },
    entryRequirements: [
      {
        vaccine: 'Meningitis ACWY',
        details:
          'MANDATORY for all Hajj/Umrah pilgrims. Quadrivalent ACWY certificate must have been issued ≥10 days and ≤3 years (conjugate vaccine) before arrival. Saudi authorities check on entry.',
      },
      {
        vaccine: 'Polio',
        details:
          'For travellers from polio-affected countries (currently includes Afghanistan, Pakistan, and selected African nations) — proof of polio vaccination within previous 12 months may be required.',
      },
      {
        vaccine: 'Yellow Fever',
        details:
          'Certificate required for travellers ≥1 year old arriving from a country with risk of YF transmission.',
      },
    ],
    notes:
      'Hajj/Umrah pilgrims should be counselled about heat-related illness, deep vein thrombosis from long flights, MERS-CoV (avoid contact with camels), and respiratory infection transmission in crowds. GRH should consider building a dedicated Hajj/Umrah package post-launch.',
  },

  // ═══ BANGLADESH ═══
  {
    iso: 'BD',
    name: 'Bangladesh',
    region: 'South Asia',
    oneLiner:
      'Routine Hepatitis A, typhoid and tetanus booster. Hep B, rabies and JE for rural / long-stay / VFR. Malaria in Chittagong Hill Tracts; no risk in Dhaka.',
    asks: { rural: true, longStay: true, activities: true, vfr: true },
    recommendations: [
      { vaccine: 'Hepatitis A', pgdId: 'travel-core', reason: 'Recommended for all travellers.', trigger: 'all' },
      { vaccine: 'Typhoid', pgdId: 'travel-core', reason: 'High typhoid risk including drug-resistant strains.', trigger: 'all' },
      { vaccine: 'Tetanus / Diphtheria / Polio booster', pgdId: 'travel-core', reason: 'Booster if >10 years since last dose.', trigger: 'all' },
      { vaccine: 'Hepatitis B', pgdId: 'travel-core', reason: 'For long stays, healthcare/aid work, sexual contact, body modifications, or VFR.', trigger: [{ longStay: true }, { medicalWork: true }, { sexualContact: true }, { bodyMods: true }, { vfr: true }] },
      { vaccine: 'Rabies (pre-exposure)', pgdId: 'rabies', reason: 'Dog-mediated rabies endemic. Consider for rural travel, animal contact, long stays, and children.', trigger: [{ rural: true }, { animalContact: true }, { longStay: true }, { outdoorActivities: true }] },
      { vaccine: 'Japanese Encephalitis', pgdId: 'japanese-encephalitis', reason: 'Risk in rural rice-growing areas, particularly monsoon (Jun–Oct). Consider for rural stays ≥1 month.', trigger: [{ rural: true, longStay: true }] },
    ],
    malaria: {
      risk: 'low',
      regions: 'Chittagong Hill Tracts and rural east. No risk in Dhaka or main tourist routes.',
      seasonality: 'Year-round, peak during/after monsoon.',
      recommendAntimalarials: true,
      notes: 'P. falciparum dominant in CHT — chloroquine resistance widespread. Atovaquone/proguanil or doxycycline.',
    },
    entryRequirements: [
      { vaccine: 'Yellow Fever', details: 'Certificate required for travellers ≥1 year arriving from a country with risk of YF transmission, including airport transit >12 hours.' },
    ],
  },

  // ═══ SRI LANKA ═══
  {
    iso: 'LK',
    name: 'Sri Lanka',
    region: 'South Asia',
    oneLiner:
      'Routine Hepatitis A and tetanus booster. Typhoid, Hep B and rabies for higher-risk profiles. WHO-certified malaria-free since 2016.',
    asks: { rural: true, longStay: true, activities: true, vfr: true },
    recommendations: [
      { vaccine: 'Hepatitis A', pgdId: 'travel-core', reason: 'Recommended for all travellers.', trigger: 'all' },
      { vaccine: 'Tetanus / Diphtheria / Polio booster', pgdId: 'travel-core', reason: 'Booster if >10 years since last dose.', trigger: 'all' },
      { vaccine: 'Typhoid', pgdId: 'travel-core', reason: 'For travellers eating outside main tourist circuit, rural stays, or VFR.', trigger: [{ rural: true }, { longStay: true }, { vfr: true }] },
      { vaccine: 'Hepatitis B', pgdId: 'travel-core', reason: 'For long stays, healthcare/aid work, sexual contact, body modifications, or VFR.', trigger: [{ longStay: true }, { medicalWork: true }, { sexualContact: true }, { bodyMods: true }, { vfr: true }] },
      { vaccine: 'Rabies (pre-exposure)', pgdId: 'rabies', reason: 'Endemic. Recommend for rural travel, animal contact, long stays, children.', trigger: [{ rural: true }, { animalContact: true }, { longStay: true }, { outdoorActivities: true }] },
      { vaccine: 'Japanese Encephalitis', pgdId: 'japanese-encephalitis', reason: 'Limited rural risk. Consider for extended rural stays during transmission season.', trigger: [{ rural: true, longStay: true }] },
    ],
    malaria: { risk: 'none', recommendAntimalarials: false, notes: 'WHO-certified malaria-free since September 2016. Bite-avoidance for dengue still important.' },
    entryRequirements: [
      { vaccine: 'Yellow Fever', details: 'Certificate required for travellers ≥1 year arriving from a country with risk of YF transmission.' },
    ],
  },

  // ═══ NEPAL ═══
  {
    iso: 'NP',
    name: 'Nepal',
    region: 'South Asia',
    oneLiner:
      'Routine Hepatitis A, typhoid and tetanus booster. Rabies and Hep B for rural / long stay. JE for rural Terai. Altitude sickness counselling for trekkers.',
    asks: { rural: true, longStay: true, activities: true, vfr: true },
    recommendations: [
      { vaccine: 'Hepatitis A', pgdId: 'travel-core', reason: 'Recommended for all travellers.', trigger: 'all' },
      { vaccine: 'Typhoid', pgdId: 'travel-core', reason: 'High typhoid risk in Nepal.', trigger: 'all' },
      { vaccine: 'Tetanus / Diphtheria / Polio booster', pgdId: 'travel-core', reason: 'Booster if >10 years since last dose.', trigger: 'all' },
      { vaccine: 'Hepatitis B', pgdId: 'travel-core', reason: 'For long stays, healthcare/aid work, sexual contact, body modifications, or VFR.', trigger: [{ longStay: true }, { medicalWork: true }, { sexualContact: true }, { bodyMods: true }, { vfr: true }] },
      { vaccine: 'Rabies (pre-exposure)', pgdId: 'rabies', reason: 'Endemic. Trekkers, rural workers and long-stay travellers especially.', trigger: [{ rural: true }, { animalContact: true }, { longStay: true }, { outdoorActivities: true }] },
      { vaccine: 'Japanese Encephalitis', pgdId: 'japanese-encephalitis', reason: 'Risk in rural Terai lowlands, particularly monsoon (Jun–Oct). Consider for rural stays ≥1 month.', trigger: [{ rural: true, longStay: true }] },
      { vaccine: 'Altitude sickness prophylaxis', pgdId: 'altitude-sickness', reason: 'For trekkers ascending >2500m (Everest Base Camp, Annapurna Circuit, etc).', trigger: [{ outdoorActivities: true }] },
    ],
    malaria: {
      risk: 'low',
      regions: 'Rural Terai lowland districts (Indian border belt). No risk in Kathmandu, Pokhara or trekking routes above 1500m.',
      seasonality: 'May–October.',
      recommendAntimalarials: true,
      notes: 'Mainly P. vivax. Atovaquone/proguanil or doxycycline for rural Terai stays.',
    },
    entryRequirements: [
      { vaccine: 'Yellow Fever', details: 'Certificate required for travellers ≥1 year arriving from a country with risk of YF transmission.' },
    ],
    notes:
      'Altitude sickness is the dominant clinical risk for trekking travellers. Counsel patient on ascent rate, recognising AMS symptoms, and acetazolamide use.',
  },

  // ═══ VIETNAM ═══
  {
    iso: 'VN',
    name: 'Vietnam',
    region: 'SE Asia',
    oneLiner:
      'Routine Hepatitis A and tetanus booster. Typhoid, Hep B, rabies and JE for off-tourist-route / long-stay travel. Very limited malaria.',
    asks: { rural: true, longStay: true, activities: true, vfr: true },
    recommendations: [
      { vaccine: 'Hepatitis A', pgdId: 'travel-core', reason: 'Recommended for all travellers.', trigger: 'all' },
      { vaccine: 'Tetanus / Diphtheria / Polio booster', pgdId: 'travel-core', reason: 'Booster if >10 years since last dose.', trigger: 'all' },
      { vaccine: 'Typhoid', pgdId: 'travel-core', reason: 'For travellers eating outside main tourist circuit or VFR.', trigger: [{ rural: true }, { longStay: true }, { vfr: true }] },
      { vaccine: 'Hepatitis B', pgdId: 'travel-core', reason: 'For long stays, healthcare/aid work, sexual contact, body modifications, or VFR.', trigger: [{ longStay: true }, { medicalWork: true }, { sexualContact: true }, { bodyMods: true }, { vfr: true }] },
      { vaccine: 'Rabies (pre-exposure)', pgdId: 'rabies', reason: 'Endemic. Recommend for rural travel, animal contact, long stays.', trigger: [{ rural: true }, { animalContact: true }, { longStay: true }, { outdoorActivities: true }] },
      { vaccine: 'Japanese Encephalitis', pgdId: 'japanese-encephalitis', reason: 'Risk in rural rice-growing areas. Consider for rural stays ≥1 month or significant rural exposure during transmission season.', trigger: [{ rural: true, longStay: true }] },
    ],
    malaria: {
      risk: 'very-low',
      regions: 'Limited to rural/forested border areas (Central Highlands, southern provinces near Cambodian border). No risk in Hanoi, HCMC, Hue, Hoi An, coastal resorts, or Mekong/Red River deltas.',
      seasonality: 'Year-round in risk areas.',
      recommendAntimalarials: false,
      notes: 'Bite-avoidance usually sufficient. Chemoprophylaxis only for rural Central Highlands or southern border stays.',
    },
    entryRequirements: [
      { vaccine: 'Yellow Fever', details: 'Certificate required for travellers ≥1 year arriving from a country with risk of YF transmission.' },
    ],
  },

  // ═══ INDONESIA ═══
  {
    iso: 'ID',
    name: 'Indonesia',
    region: 'SE Asia',
    oneLiner:
      'Routine Hepatitis A and tetanus booster. Rabies is a particular concern in Bali. Malaria risk varies dramatically — high in eastern islands, very low in Bali and main resorts.',
    asks: { rural: true, longStay: true, activities: true, vfr: true },
    recommendations: [
      { vaccine: 'Hepatitis A', pgdId: 'travel-core', reason: 'Recommended for all travellers.', trigger: 'all' },
      { vaccine: 'Tetanus / Diphtheria / Polio booster', pgdId: 'travel-core', reason: 'Booster if >10 years since last dose.', trigger: 'all' },
      { vaccine: 'Typhoid', pgdId: 'travel-core', reason: 'For travellers visiting non-tourist areas, VFR, or extended stays.', trigger: [{ rural: true }, { longStay: true }, { vfr: true }] },
      { vaccine: 'Hepatitis B', pgdId: 'travel-core', reason: 'For long stays, healthcare/aid work, sexual contact, body modifications, or VFR.', trigger: [{ longStay: true }, { medicalWork: true }, { sexualContact: true }, { bodyMods: true }, { vfr: true }] },
      { vaccine: 'Rabies (pre-exposure)', pgdId: 'rabies', reason: 'Endemic — particular concern in Bali where dog-bite incidents are high among tourists. Recommend for most travellers spending time outdoors, with children, or on longer stays.', trigger: [{ rural: true }, { animalContact: true }, { longStay: true }, { outdoorActivities: true }] },
      { vaccine: 'Japanese Encephalitis', pgdId: 'japanese-encephalitis', reason: 'Risk in rural rice-growing/pig-farming areas — Java, Bali, eastern islands. Consider for rural stays ≥1 month.', trigger: [{ rural: true, longStay: true }] },
    ],
    malaria: {
      risk: 'moderate',
      regions: 'High in Papua and West Papua (year-round, all areas). Moderate in eastern Indonesia (Maluku, Nusa Tenggara). Very low in rural Java, Sumatra, Sulawesi, Kalimantan. No risk in Jakarta, Bali, Ubud, urban tourist areas.',
      seasonality: 'Year-round in risk areas.',
      recommendAntimalarials: true,
      notes: 'Drug resistance varies. Papua especially — multi-drug resistant P. falciparum. Atovaquone/proguanil, doxycycline or mefloquine depending on destination.',
    },
    entryRequirements: [
      { vaccine: 'Yellow Fever', details: 'Certificate required for travellers ≥9 months arriving from a country with risk of YF transmission, including airport transit >12 hours.' },
    ],
  },

  // ═══ PHILIPPINES ═══
  {
    iso: 'PH',
    name: 'Philippines',
    region: 'SE Asia',
    oneLiner:
      'Routine Hepatitis A and tetanus booster. Rabies, typhoid, Hep B and JE for higher-risk profiles. Limited malaria in rural Palawan, Mindanao.',
    asks: { rural: true, longStay: true, activities: true, vfr: true },
    recommendations: [
      { vaccine: 'Hepatitis A', pgdId: 'travel-core', reason: 'Recommended for all travellers.', trigger: 'all' },
      { vaccine: 'Tetanus / Diphtheria / Polio booster', pgdId: 'travel-core', reason: 'Booster if >10 years since last dose.', trigger: 'all' },
      { vaccine: 'Typhoid', pgdId: 'travel-core', reason: 'For travellers eating outside main tourist circuit, rural stays, or VFR.', trigger: [{ rural: true }, { longStay: true }, { vfr: true }] },
      { vaccine: 'Hepatitis B', pgdId: 'travel-core', reason: 'For long stays, healthcare/aid work, sexual contact, body modifications, or VFR.', trigger: [{ longStay: true }, { medicalWork: true }, { sexualContact: true }, { bodyMods: true }, { vfr: true }] },
      { vaccine: 'Rabies (pre-exposure)', pgdId: 'rabies', reason: 'Endemic — Philippines has one of the highest rabies burdens in SE Asia. Recommend broadly for rural travel, animal contact, children, long stays.', trigger: [{ rural: true }, { animalContact: true }, { longStay: true }, { outdoorActivities: true }] },
      { vaccine: 'Japanese Encephalitis', pgdId: 'japanese-encephalitis', reason: 'Risk in rural rice-growing/pig-farming areas year-round. Consider for rural stays ≥1 month.', trigger: [{ rural: true, longStay: true }] },
    ],
    malaria: {
      risk: 'low',
      regions: 'Rural areas below 600m in Palawan, Mindanao (incl. Sulu archipelago) and parts of Mindoro. No risk in Manila, Cebu, Bohol or main tourist resorts.',
      seasonality: 'Year-round in risk areas.',
      recommendAntimalarials: true,
      notes: 'P. falciparum dominant. Atovaquone/proguanil or doxycycline.',
    },
    entryRequirements: [
      { vaccine: 'Yellow Fever', details: 'Certificate required for travellers ≥9 months arriving from a country with risk of YF transmission.' },
    ],
  },

  // ═══ CAMBODIA ═══
  {
    iso: 'KH',
    name: 'Cambodia',
    region: 'SE Asia',
    oneLiner:
      'Routine Hepatitis A, typhoid and tetanus booster. Rabies, Hep B and JE for higher-risk profiles. Multi-drug-resistant malaria in forested border areas — bite avoidance critical.',
    asks: { rural: true, longStay: true, activities: true, vfr: true },
    recommendations: [
      { vaccine: 'Hepatitis A', pgdId: 'travel-core', reason: 'Recommended for all travellers.', trigger: 'all' },
      { vaccine: 'Typhoid', pgdId: 'travel-core', reason: 'Significant typhoid risk.', trigger: 'all' },
      { vaccine: 'Tetanus / Diphtheria / Polio booster', pgdId: 'travel-core', reason: 'Booster if >10 years since last dose.', trigger: 'all' },
      { vaccine: 'Hepatitis B', pgdId: 'travel-core', reason: 'For long stays, healthcare/aid work, sexual contact, body modifications, or VFR.', trigger: [{ longStay: true }, { medicalWork: true }, { sexualContact: true }, { bodyMods: true }, { vfr: true }] },
      { vaccine: 'Rabies (pre-exposure)', pgdId: 'rabies', reason: 'Endemic. Limited post-exposure access outside Phnom Penh.', trigger: [{ rural: true }, { animalContact: true }, { longStay: true }, { outdoorActivities: true }] },
      { vaccine: 'Japanese Encephalitis', pgdId: 'japanese-encephalitis', reason: 'Risk in rural rice-growing areas. Consider for rural stays ≥1 month.', trigger: [{ rural: true, longStay: true }] },
    ],
    malaria: {
      risk: 'moderate',
      regions: 'Forested border areas with Thailand, Laos and Vietnam. No risk in Phnom Penh, around Tonle Sap or central urban Siem Reap. Risk in rural areas around Angkor temples is very low.',
      seasonality: 'Year-round in risk areas, peak during/after rains (May–Oct).',
      recommendAntimalarials: true,
      notes: 'Multi-drug-resistant P. falciparum confirmed in western border provinces — including resistance to mefloquine and artemisinin. Specialist advice if travel includes those regions; atovaquone/proguanil or doxycycline first-line elsewhere.',
    },
    entryRequirements: [
      { vaccine: 'Yellow Fever', details: 'Certificate required for travellers ≥1 year arriving from a country with risk of YF transmission.' },
    ],
  },

  // ═══ CHINA ═══
  {
    iso: 'CN',
    name: 'China',
    region: 'East Asia',
    oneLiner:
      'Routine Hepatitis A and tetanus booster. Typhoid, Hep B, rabies and JE for rural travel / long stay. Altitude for Tibet. Malaria essentially eliminated.',
    asks: { rural: true, longStay: true, activities: true, vfr: true },
    recommendations: [
      { vaccine: 'Hepatitis A', pgdId: 'travel-core', reason: 'Recommended for all travellers.', trigger: 'all' },
      { vaccine: 'Tetanus / Diphtheria / Polio booster', pgdId: 'travel-core', reason: 'Booster if >10 years since last dose.', trigger: 'all' },
      { vaccine: 'Typhoid', pgdId: 'travel-core', reason: 'For travellers visiting non-tourist areas, rural stays or VFR.', trigger: [{ rural: true }, { longStay: true }, { vfr: true }] },
      { vaccine: 'Hepatitis B', pgdId: 'travel-core', reason: 'For long stays, healthcare/aid work, sexual contact, body modifications, or VFR.', trigger: [{ longStay: true }, { medicalWork: true }, { sexualContact: true }, { bodyMods: true }, { vfr: true }] },
      { vaccine: 'Rabies (pre-exposure)', pgdId: 'rabies', reason: 'Endemic. Recommend for rural travel, animal contact, long stays.', trigger: [{ rural: true }, { animalContact: true }, { longStay: true }, { outdoorActivities: true }] },
      { vaccine: 'Japanese Encephalitis', pgdId: 'japanese-encephalitis', reason: 'Risk in rural eastern, southern and central China — particularly summer/autumn. Consider for rural stays ≥1 month.', trigger: [{ rural: true, longStay: true }] },
      { vaccine: 'Altitude sickness prophylaxis', pgdId: 'altitude-sickness', reason: 'For travel to Tibet (Lhasa 3650m) and high-altitude western regions.', trigger: [{ outdoorActivities: true }] },
    ],
    malaria: {
      risk: 'very-low',
      regions: 'Very limited residual risk in rural Yunnan along Myanmar border. No risk on standard tourist routes (Beijing, Shanghai, Xi\'an, Yangtze, Guilin) or in cities.',
      seasonality: 'Seasonal, May–November.',
      recommendAntimalarials: false,
      notes: 'China declared malaria-free by WHO 2021. Chemoprophylaxis very rarely indicated.',
    },
    entryRequirements: [
      { vaccine: 'Yellow Fever', details: 'Certificate required for travellers ≥1 year arriving from a country with risk of YF transmission.' },
    ],
  },

  // ═══ NIGERIA ═══
  {
    iso: 'NG',
    name: 'Nigeria',
    region: 'Sub-Saharan Africa',
    oneLiner:
      'Routine Hepatitis A, Yellow Fever, typhoid and tetanus booster — YF certificate mandatory for entry. Meningitis ACWY for northern Nigeria. High malaria risk countrywide.',
    asks: { rural: true, longStay: true, activities: true, vfr: true },
    recommendations: [
      { vaccine: 'Hepatitis A', pgdId: 'travel-core', reason: 'Recommended for all travellers.', trigger: 'all' },
      { vaccine: 'Yellow Fever', pgdId: 'yellow-fever', reason: 'YF transmission present countrywide. Recommended for all travellers ≥9 months and a Nigerian entry requirement.', trigger: 'all' },
      { vaccine: 'Typhoid', pgdId: 'travel-core', reason: 'High typhoid risk.', trigger: 'all' },
      { vaccine: 'Tetanus / Diphtheria / Polio booster', pgdId: 'travel-core', reason: 'Booster if >10 years since last dose.', trigger: 'all' },
      { vaccine: 'Hepatitis B', pgdId: 'travel-core', reason: 'For long stays, healthcare/aid work, sexual contact, body modifications, or VFR.', trigger: [{ longStay: true }, { medicalWork: true }, { sexualContact: true }, { bodyMods: true }, { vfr: true }] },
      { vaccine: 'Rabies (pre-exposure)', pgdId: 'rabies', reason: 'Endemic. Recommend for rural travel, animal contact, long stays, children.', trigger: [{ rural: true }, { animalContact: true }, { longStay: true }, { outdoorActivities: true }] },
      { vaccine: 'Meningitis ACWY', pgdId: 'meningitis-acwy-travel', reason: 'Northern Nigeria sits in the African meningitis belt — high risk Dec–Jun. Recommend for travel to northern states (Kano, Kaduna, Sokoto, etc).', trigger: [{ rural: true }, { longStay: true }, { vfr: true }] },
    ],
    malaria: {
      risk: 'high',
      regions: 'High year-round transmission countrywide including all urban areas (Lagos, Abuja).',
      seasonality: 'Year-round, with seasonal peaks following rains.',
      recommendAntimalarials: true,
      notes: 'Predominantly chloroquine-resistant P. falciparum. Atovaquone/proguanil, doxycycline, or mefloquine.',
    },
    entryRequirements: [
      { vaccine: 'Yellow Fever', details: 'MANDATORY for all travellers ≥9 months old, regardless of country of origin. Saudi authorities and many onward African destinations also require proof if travelling from Nigeria.' },
    ],
  },

  // ═══ GHANA ═══
  {
    iso: 'GH',
    name: 'Ghana',
    region: 'Sub-Saharan Africa',
    oneLiner:
      'Routine Hepatitis A, Yellow Fever, typhoid and tetanus booster — YF certificate mandatory for entry. Meningitis ACWY for northern Ghana. High malaria risk.',
    asks: { rural: true, longStay: true, activities: true, vfr: true },
    recommendations: [
      { vaccine: 'Hepatitis A', pgdId: 'travel-core', reason: 'Recommended for all travellers.', trigger: 'all' },
      { vaccine: 'Yellow Fever', pgdId: 'yellow-fever', reason: 'YF transmission countrywide. Recommended for all travellers ≥9 months and required for entry.', trigger: 'all' },
      { vaccine: 'Typhoid', pgdId: 'travel-core', reason: 'High typhoid risk.', trigger: 'all' },
      { vaccine: 'Tetanus / Diphtheria / Polio booster', pgdId: 'travel-core', reason: 'Booster if >10 years since last dose.', trigger: 'all' },
      { vaccine: 'Hepatitis B', pgdId: 'travel-core', reason: 'For long stays, healthcare/aid work, sexual contact, body modifications, or VFR.', trigger: [{ longStay: true }, { medicalWork: true }, { sexualContact: true }, { bodyMods: true }, { vfr: true }] },
      { vaccine: 'Rabies (pre-exposure)', pgdId: 'rabies', reason: 'Endemic. Recommend for rural travel, animal contact, long stays, children.', trigger: [{ rural: true }, { animalContact: true }, { longStay: true }, { outdoorActivities: true }] },
      { vaccine: 'Meningitis ACWY', pgdId: 'meningitis-acwy-travel', reason: 'Northern Ghana sits in the African meningitis belt. Recommend for travel to Upper East, Upper West and Northern Region — particularly Dec–Jun.', trigger: [{ rural: true }, { longStay: true }, { vfr: true }] },
    ],
    malaria: {
      risk: 'high',
      regions: 'High year-round transmission countrywide including Accra.',
      seasonality: 'Year-round.',
      recommendAntimalarials: true,
      notes: 'Chloroquine-resistant P. falciparum. Atovaquone/proguanil, doxycycline, or mefloquine.',
    },
    entryRequirements: [
      { vaccine: 'Yellow Fever', details: 'MANDATORY for all travellers ≥9 months old, regardless of country of origin.' },
    ],
  },

  // ═══ TANZANIA ═══
  {
    iso: 'TZ',
    name: 'Tanzania',
    region: 'Sub-Saharan Africa',
    oneLiner:
      'Routine Hepatitis A, typhoid and tetanus booster. Yellow Fever recommended for many travellers. High malaria risk including Zanzibar. Altitude counselling for Kilimanjaro.',
    asks: { rural: true, longStay: true, activities: true, vfr: true },
    recommendations: [
      { vaccine: 'Hepatitis A', pgdId: 'travel-core', reason: 'Recommended for all travellers.', trigger: 'all' },
      { vaccine: 'Tetanus / Diphtheria / Polio booster', pgdId: 'travel-core', reason: 'Booster if >10 years since last dose.', trigger: 'all' },
      { vaccine: 'Yellow Fever', pgdId: 'yellow-fever', reason: 'YF transmission risk in much of mainland Tanzania. Strongly recommended; also commonly required by onward destinations.', trigger: 'all' },
      { vaccine: 'Typhoid', pgdId: 'travel-core', reason: 'For most travellers — particularly rural, long stay or VFR.', trigger: [{ rural: true }, { longStay: true }, { vfr: true }] },
      { vaccine: 'Hepatitis B', pgdId: 'travel-core', reason: 'For long stays, healthcare/aid work, sexual contact, body modifications, or VFR.', trigger: [{ longStay: true }, { medicalWork: true }, { sexualContact: true }, { bodyMods: true }, { vfr: true }] },
      { vaccine: 'Rabies (pre-exposure)', pgdId: 'rabies', reason: 'Endemic. Recommend for rural travel, animal contact, long stays, safari, children.', trigger: [{ rural: true }, { animalContact: true }, { longStay: true }, { outdoorActivities: true }] },
      { vaccine: 'Altitude sickness prophylaxis', pgdId: 'altitude-sickness', reason: 'For Kilimanjaro climbers (summit 5895m).', trigger: [{ outdoorActivities: true }] },
    ],
    malaria: {
      risk: 'high',
      regions: 'Year-round risk below 1800m across most of the country, including Zanzibar (moderate but persistent) and most safari destinations.',
      seasonality: 'Year-round, peak with the rains.',
      recommendAntimalarials: true,
      notes: 'P. falciparum dominant. Atovaquone/proguanil, doxycycline, or mefloquine.',
    },
    entryRequirements: [
      { vaccine: 'Yellow Fever', details: 'Certificate required for travellers ≥1 year arriving from a country with risk of YF transmission (incl. Kenya transit).' },
    ],
  },

  // ═══ SOUTH AFRICA ═══
  {
    iso: 'ZA',
    name: 'South Africa',
    region: 'Sub-Saharan Africa',
    oneLiner:
      'Routine Hepatitis A and tetanus booster. Typhoid, Hep B and rabies for higher-risk profiles. Malaria limited to NE — including Kruger.',
    asks: { rural: true, longStay: true, activities: true, vfr: true },
    recommendations: [
      { vaccine: 'Hepatitis A', pgdId: 'travel-core', reason: 'Recommended for all travellers.', trigger: 'all' },
      { vaccine: 'Tetanus / Diphtheria / Polio booster', pgdId: 'travel-core', reason: 'Booster if >10 years since last dose.', trigger: 'all' },
      { vaccine: 'Typhoid', pgdId: 'travel-core', reason: 'For travellers eating outside main tourist circuit, rural stays or VFR.', trigger: [{ rural: true }, { longStay: true }, { vfr: true }] },
      { vaccine: 'Hepatitis B', pgdId: 'travel-core', reason: 'For long stays, healthcare/aid work, sexual contact, body modifications, or VFR.', trigger: [{ longStay: true }, { medicalWork: true }, { sexualContact: true }, { bodyMods: true }, { vfr: true }] },
      { vaccine: 'Rabies (pre-exposure)', pgdId: 'rabies', reason: 'Endemic. Recommend for rural travel, animal contact, long stays, children.', trigger: [{ rural: true }, { animalContact: true }, { longStay: true }, { outdoorActivities: true }] },
    ],
    malaria: {
      risk: 'low',
      regions: 'Low-altitude north-eastern areas — Mpumalanga (incl. Kruger National Park), Limpopo, and northern KwaZulu-Natal. No risk in Cape Town, Johannesburg, Garden Route or Drakensberg.',
      seasonality: 'Higher Oct–May.',
      recommendAntimalarials: true,
      notes: 'P. falciparum. Atovaquone/proguanil, doxycycline, or mefloquine for travel to Kruger / northern provinces.',
    },
    entryRequirements: [
      { vaccine: 'Yellow Fever', details: 'Certificate required for travellers ≥1 year arriving from a country with risk of YF transmission, including airport transit >12 hours.' },
    ],
  },

  // ═══ UGANDA ═══
  {
    iso: 'UG',
    name: 'Uganda',
    region: 'Sub-Saharan Africa',
    oneLiner:
      'Routine Hepatitis A, Yellow Fever, typhoid and tetanus booster — YF required for entry. Meningitis ACWY for northern regions. High malaria risk countrywide.',
    asks: { rural: true, longStay: true, activities: true, vfr: true },
    recommendations: [
      { vaccine: 'Hepatitis A', pgdId: 'travel-core', reason: 'Recommended for all travellers.', trigger: 'all' },
      { vaccine: 'Yellow Fever', pgdId: 'yellow-fever', reason: 'YF transmission countrywide. Recommended for all ≥9 months and required for entry.', trigger: 'all' },
      { vaccine: 'Typhoid', pgdId: 'travel-core', reason: 'High typhoid risk.', trigger: 'all' },
      { vaccine: 'Tetanus / Diphtheria / Polio booster', pgdId: 'travel-core', reason: 'Booster if >10 years since last dose.', trigger: 'all' },
      { vaccine: 'Hepatitis B', pgdId: 'travel-core', reason: 'For long stays, healthcare/aid work, sexual contact, body modifications, or VFR.', trigger: [{ longStay: true }, { medicalWork: true }, { sexualContact: true }, { bodyMods: true }, { vfr: true }] },
      { vaccine: 'Rabies (pre-exposure)', pgdId: 'rabies', reason: 'Endemic. Recommend for rural travel, animal contact, long stays, children.', trigger: [{ rural: true }, { animalContact: true }, { longStay: true }, { outdoorActivities: true }] },
      { vaccine: 'Meningitis ACWY', pgdId: 'meningitis-acwy-travel', reason: 'Northern Uganda is in the meningitis belt. Recommend for travel to northern districts, particularly Dec–Jun.', trigger: [{ rural: true }, { longStay: true }, { vfr: true }] },
    ],
    malaria: {
      risk: 'high',
      regions: 'High year-round risk across the country including Kampala. Lower risk in higher-altitude areas above 1800m.',
      seasonality: 'Year-round.',
      recommendAntimalarials: true,
      notes: 'Chloroquine-resistant P. falciparum. Atovaquone/proguanil, doxycycline, or mefloquine.',
    },
    entryRequirements: [
      { vaccine: 'Yellow Fever', details: 'Required for travellers ≥1 year arriving from any country.' },
    ],
  },

  // ═══ ETHIOPIA ═══
  {
    iso: 'ET',
    name: 'Ethiopia',
    region: 'Sub-Saharan Africa',
    oneLiner:
      'Routine Hepatitis A, Yellow Fever, typhoid and tetanus booster. Meningitis ACWY for highland and northern travel. Malaria below 2000m — none in Addis Ababa.',
    asks: { rural: true, longStay: true, activities: true, vfr: true },
    recommendations: [
      { vaccine: 'Hepatitis A', pgdId: 'travel-core', reason: 'Recommended for all travellers.', trigger: 'all' },
      { vaccine: 'Yellow Fever', pgdId: 'yellow-fever', reason: 'YF transmission risk below 2300m. Recommended for most travellers.', trigger: 'all' },
      { vaccine: 'Typhoid', pgdId: 'travel-core', reason: 'High typhoid risk.', trigger: 'all' },
      { vaccine: 'Tetanus / Diphtheria / Polio booster', pgdId: 'travel-core', reason: 'Booster if >10 years since last dose.', trigger: 'all' },
      { vaccine: 'Hepatitis B', pgdId: 'travel-core', reason: 'For long stays, healthcare/aid work, sexual contact, body modifications, or VFR.', trigger: [{ longStay: true }, { medicalWork: true }, { sexualContact: true }, { bodyMods: true }, { vfr: true }] },
      { vaccine: 'Rabies (pre-exposure)', pgdId: 'rabies', reason: 'Endemic. Recommend for rural travel, animal contact, long stays, children.', trigger: [{ rural: true }, { animalContact: true }, { longStay: true }, { outdoorActivities: true }] },
      { vaccine: 'Meningitis ACWY', pgdId: 'meningitis-acwy-travel', reason: 'Ethiopia sits in the meningitis belt. Recommend for travel to highland and northern areas, particularly Dec–Jun.', trigger: [{ rural: true }, { longStay: true }, { vfr: true }] },
    ],
    malaria: {
      risk: 'moderate',
      regions: 'Risk below 2000m across most of the country, particularly rural lowlands. No risk in Addis Ababa (high altitude) or above 2500m.',
      seasonality: 'Higher Jun–Dec.',
      recommendAntimalarials: true,
      notes: 'Mixed P. falciparum and P. vivax. Atovaquone/proguanil, doxycycline, or mefloquine.',
    },
    entryRequirements: [
      { vaccine: 'Yellow Fever', details: 'Certificate required for travellers ≥1 year arriving from a country with risk of YF transmission.' },
    ],
  },

  // ═══ EGYPT ═══
  {
    iso: 'EG',
    name: 'Egypt',
    region: 'North Africa & MENA',
    oneLiner:
      'Routine Hepatitis A and tetanus booster. Typhoid, Hep B and rabies for higher-risk profiles. No malaria. Counsel on schistosomiasis avoidance (don\'t swim in Nile fresh water).',
    asks: { rural: true, longStay: true, activities: true, vfr: true },
    recommendations: [
      { vaccine: 'Hepatitis A', pgdId: 'travel-core', reason: 'Recommended for all travellers.', trigger: 'all' },
      { vaccine: 'Tetanus / Diphtheria / Polio booster', pgdId: 'travel-core', reason: 'Booster if >10 years since last dose.', trigger: 'all' },
      { vaccine: 'Typhoid', pgdId: 'travel-core', reason: 'For travellers eating outside main tourist circuit, rural stays, or VFR.', trigger: [{ rural: true }, { longStay: true }, { vfr: true }] },
      { vaccine: 'Hepatitis B', pgdId: 'travel-core', reason: 'For long stays, healthcare/aid work, sexual contact, body modifications, or VFR.', trigger: [{ longStay: true }, { medicalWork: true }, { sexualContact: true }, { bodyMods: true }, { vfr: true }] },
      { vaccine: 'Rabies (pre-exposure)', pgdId: 'rabies', reason: 'Endemic. Recommend for rural travel, animal contact, long stays.', trigger: [{ rural: true }, { animalContact: true }, { longStay: true }, { outdoorActivities: true }] },
    ],
    malaria: { risk: 'none', recommendAntimalarials: false, notes: 'No malaria risk. Schistosomiasis present in fresh water — counsel against swimming in the Nile or Lake Nasser.' },
    entryRequirements: [
      { vaccine: 'Yellow Fever', details: 'Certificate required for travellers ≥9 months arriving from a country with risk of YF transmission, including Sudan and selected other African countries.' },
    ],
  },

  // ═══ MOROCCO ═══
  {
    iso: 'MA',
    name: 'Morocco',
    region: 'North Africa & MENA',
    oneLiner:
      'Routine Hepatitis A and tetanus booster. Typhoid, Hep B and rabies for higher-risk profiles. No malaria.',
    asks: { rural: true, longStay: true, activities: true, vfr: true },
    recommendations: [
      { vaccine: 'Hepatitis A', pgdId: 'travel-core', reason: 'Recommended for all travellers.', trigger: 'all' },
      { vaccine: 'Tetanus / Diphtheria / Polio booster', pgdId: 'travel-core', reason: 'Booster if >10 years since last dose.', trigger: 'all' },
      { vaccine: 'Typhoid', pgdId: 'travel-core', reason: 'For travellers eating outside main tourist circuit, rural stays, or VFR.', trigger: [{ rural: true }, { longStay: true }, { vfr: true }] },
      { vaccine: 'Hepatitis B', pgdId: 'travel-core', reason: 'For long stays, healthcare/aid work, sexual contact, body modifications, or VFR.', trigger: [{ longStay: true }, { medicalWork: true }, { sexualContact: true }, { bodyMods: true }, { vfr: true }] },
      { vaccine: 'Rabies (pre-exposure)', pgdId: 'rabies', reason: 'Endemic. Recommend for rural travel, animal contact, long stays, children.', trigger: [{ rural: true }, { animalContact: true }, { longStay: true }, { outdoorActivities: true }] },
    ],
    malaria: { risk: 'none', recommendAntimalarials: false, notes: 'WHO-certified malaria-free since 2010.' },
    entryRequirements: [
      { vaccine: 'Yellow Fever', details: 'Certificate required for travellers ≥1 year arriving from a country with risk of YF transmission.' },
    ],
  },

  // ═══ UNITED ARAB EMIRATES ═══
  {
    iso: 'AE',
    name: 'United Arab Emirates',
    region: 'North Africa & MENA',
    oneLiner:
      'Routine Hepatitis A and tetanus booster. Hep B and rabies for higher-risk profiles. No malaria.',
    asks: { longStay: true, activities: true, vfr: true },
    recommendations: [
      { vaccine: 'Hepatitis A', pgdId: 'travel-core', reason: 'Recommended for all travellers.', trigger: 'all' },
      { vaccine: 'Tetanus / Diphtheria / Polio booster', pgdId: 'travel-core', reason: 'Booster if >10 years since last dose.', trigger: 'all' },
      { vaccine: 'Hepatitis B', pgdId: 'travel-core', reason: 'For long stays, healthcare work, sexual contact, body modifications, or VFR.', trigger: [{ longStay: true }, { medicalWork: true }, { sexualContact: true }, { bodyMods: true }, { vfr: true }] },
      { vaccine: 'Rabies (pre-exposure)', pgdId: 'rabies', reason: 'Endemic at low levels in animal populations. Consider for long stays or significant animal contact.', trigger: [{ animalContact: true }, { longStay: true }] },
    ],
    malaria: { risk: 'none', recommendAntimalarials: false, notes: 'No malaria risk. WHO-certified malaria-free since 2007.' },
    entryRequirements: [
      { vaccine: 'Yellow Fever', details: 'Certificate required for travellers ≥9 months arriving from a country with risk of YF transmission.' },
    ],
  },

  // ═══ TURKEY ═══
  {
    iso: 'TR',
    name: 'Turkey',
    region: 'North Africa & MENA',
    oneLiner:
      'Routine Hepatitis A and tetanus booster. Typhoid, Hep B and rabies for rural / long stay / VFR. Very low residual malaria risk.',
    asks: { rural: true, longStay: true, activities: true, vfr: true },
    recommendations: [
      { vaccine: 'Hepatitis A', pgdId: 'travel-core', reason: 'Recommended for all travellers.', trigger: 'all' },
      { vaccine: 'Tetanus / Diphtheria / Polio booster', pgdId: 'travel-core', reason: 'Booster if >10 years since last dose.', trigger: 'all' },
      { vaccine: 'Typhoid', pgdId: 'travel-core', reason: 'For travellers eating outside main tourist circuit, rural stays, or VFR.', trigger: [{ rural: true }, { longStay: true }, { vfr: true }] },
      { vaccine: 'Hepatitis B', pgdId: 'travel-core', reason: 'For long stays, healthcare/aid work, sexual contact, body modifications, or VFR.', trigger: [{ longStay: true }, { medicalWork: true }, { sexualContact: true }, { bodyMods: true }, { vfr: true }] },
      { vaccine: 'Rabies (pre-exposure)', pgdId: 'rabies', reason: 'Endemic. Recommend for rural travel, animal contact, long stays, children.', trigger: [{ rural: true }, { animalContact: true }, { longStay: true }, { outdoorActivities: true }] },
    ],
    malaria: {
      risk: 'very-low',
      regions: 'Very limited residual risk in rural south-eastern areas near the Syrian border. No risk on main tourist routes (Istanbul, Cappadocia, Aegean/Mediterranean coast).',
      seasonality: 'May–October if any.',
      recommendAntimalarials: false,
      notes: 'Bite avoidance only. Chemoprophylaxis rarely indicated.',
    },
    entryRequirements: [
      { vaccine: 'Yellow Fever', details: 'Certificate required for travellers ≥1 year arriving from a country with risk of YF transmission.' },
    ],
  },

  // ═══ BRAZIL ═══
  {
    iso: 'BR',
    name: 'Brazil',
    region: 'South America',
    oneLiner:
      'Routine Hepatitis A and tetanus booster. Yellow Fever strongly recommended (now extends to coastal areas). Typhoid, Hep B, rabies for higher-risk. Malaria in Amazon basin. Dengue ubiquitous — consider Qdenga.',
    asks: { rural: true, longStay: true, activities: true, vfr: true },
    recommendations: [
      { vaccine: 'Hepatitis A', pgdId: 'travel-core', reason: 'Recommended for all travellers.', trigger: 'all' },
      { vaccine: 'Tetanus / Diphtheria / Polio booster', pgdId: 'travel-core', reason: 'Booster if >10 years since last dose.', trigger: 'all' },
      { vaccine: 'Yellow Fever', pgdId: 'yellow-fever', reason: 'YF transmission risk now extends across most of Brazil, including coastal areas around Rio and São Paulo. Recommended for almost all travellers.', trigger: 'all' },
      { vaccine: 'Typhoid', pgdId: 'travel-core', reason: 'For travellers visiting non-tourist areas, rural stays, or VFR.', trigger: [{ rural: true }, { longStay: true }, { vfr: true }] },
      { vaccine: 'Hepatitis B', pgdId: 'travel-core', reason: 'For long stays, healthcare/aid work, sexual contact, body modifications, or VFR.', trigger: [{ longStay: true }, { medicalWork: true }, { sexualContact: true }, { bodyMods: true }, { vfr: true }] },
      { vaccine: 'Rabies (pre-exposure)', pgdId: 'rabies', reason: 'Endemic. Recommend for rural travel, animal contact, long stays, children. Bat-mediated rabies particularly important in Amazon.', trigger: [{ rural: true }, { animalContact: true }, { longStay: true }, { outdoorActivities: true }] },
      { vaccine: 'Dengue (Qdenga)', pgdId: 'dengue', reason: 'Dengue widespread. Consider for repeat travellers or those with prior dengue exposure spending extended time in transmission areas.', trigger: [{ longStay: true }, { vfr: true }] },
    ],
    malaria: {
      risk: 'moderate',
      regions: 'Amazon basin (Acre, Amapá, Amazonas, Maranhão, Mato Grosso, Pará, Rondônia, Roraima, Tocantins) — particularly rural and forested areas. No risk in Rio de Janeiro, São Paulo, Iguaçu Falls or coastal resorts.',
      seasonality: 'Year-round in risk areas.',
      recommendAntimalarials: true,
      notes: 'Mixed P. vivax and P. falciparum. Atovaquone/proguanil or doxycycline.',
    },
    entryRequirements: [
      { vaccine: 'Yellow Fever', details: 'No requirement on entry. However, many onward destinations (e.g. South Africa, Australia, China) require proof if travelling from Brazil.' },
    ],
  },

  // ═══ PERU ═══
  {
    iso: 'PE',
    name: 'Peru',
    region: 'South America',
    oneLiner:
      'Routine Hepatitis A and tetanus booster. Yellow Fever for jungle areas. Typhoid, Hep B, rabies for higher-risk. Malaria in Amazon basin. Altitude critical for Cusco / Machu Picchu.',
    asks: { rural: true, longStay: true, activities: true, vfr: true },
    recommendations: [
      { vaccine: 'Hepatitis A', pgdId: 'travel-core', reason: 'Recommended for all travellers.', trigger: 'all' },
      { vaccine: 'Tetanus / Diphtheria / Polio booster', pgdId: 'travel-core', reason: 'Booster if >10 years since last dose.', trigger: 'all' },
      { vaccine: 'Yellow Fever', pgdId: 'yellow-fever', reason: 'YF transmission risk in jungle areas below 2300m. Recommended for travel to Amazon basin, jungle treks, Manú/Tambopata.', trigger: [{ rural: true }, { outdoorActivities: true }] },
      { vaccine: 'Typhoid', pgdId: 'travel-core', reason: 'For travellers visiting non-tourist areas, rural stays or VFR.', trigger: [{ rural: true }, { longStay: true }, { vfr: true }] },
      { vaccine: 'Hepatitis B', pgdId: 'travel-core', reason: 'For long stays, healthcare/aid work, sexual contact, body modifications, or VFR.', trigger: [{ longStay: true }, { medicalWork: true }, { sexualContact: true }, { bodyMods: true }, { vfr: true }] },
      { vaccine: 'Rabies (pre-exposure)', pgdId: 'rabies', reason: 'Endemic. Bat-mediated rabies in Amazon. Recommend for rural / jungle travel, animal contact, long stays, children.', trigger: [{ rural: true }, { animalContact: true }, { longStay: true }, { outdoorActivities: true }] },
      { vaccine: 'Altitude sickness prophylaxis', pgdId: 'altitude-sickness', reason: 'Essential to discuss for travel to Cusco (3400m), Machu Picchu, Lake Titicaca (3800m), Colca Canyon.', trigger: [{ outdoorActivities: true }] },
    ],
    malaria: {
      risk: 'moderate',
      regions: 'Amazon basin below 2000m — Loreto, Madre de Dios, parts of San Martín, Ucayali. No risk in Lima, Cusco, Machu Picchu, Lake Titicaca or coastal areas.',
      seasonality: 'Year-round in risk areas.',
      recommendAntimalarials: true,
      notes: 'Mostly P. vivax with some P. falciparum. Atovaquone/proguanil or doxycycline.',
    },
    entryRequirements: [
      { vaccine: 'Yellow Fever', details: 'Certificate required for travellers ≥9 months arriving from a country with risk of YF transmission.' },
    ],
    notes:
      'Altitude sickness is the dominant clinical risk for the Cusco / Machu Picchu circuit. Counsel patient on ascent rate, recognising AMS symptoms, and acetazolamide use.',
  },

  // ═══ ARGENTINA ═══
  {
    iso: 'AR',
    name: 'Argentina',
    region: 'South America',
    oneLiner:
      'Routine Hepatitis A and tetanus booster. Yellow Fever for northern jungle areas. Typhoid, Hep B and rabies for higher-risk profiles. No malaria.',
    asks: { rural: true, longStay: true, activities: true, vfr: true },
    recommendations: [
      { vaccine: 'Hepatitis A', pgdId: 'travel-core', reason: 'Recommended for all travellers.', trigger: 'all' },
      { vaccine: 'Tetanus / Diphtheria / Polio booster', pgdId: 'travel-core', reason: 'Booster if >10 years since last dose.', trigger: 'all' },
      { vaccine: 'Yellow Fever', pgdId: 'yellow-fever', reason: 'YF transmission risk in northern jungle provinces (Misiones, parts of Corrientes, Jujuy, Salta). Recommended for travel to Iguazú Falls.', trigger: [{ rural: true }, { outdoorActivities: true }] },
      { vaccine: 'Typhoid', pgdId: 'travel-core', reason: 'For travellers visiting non-tourist areas, rural stays or VFR.', trigger: [{ rural: true }, { longStay: true }, { vfr: true }] },
      { vaccine: 'Hepatitis B', pgdId: 'travel-core', reason: 'For long stays, healthcare/aid work, sexual contact, body modifications, or VFR.', trigger: [{ longStay: true }, { medicalWork: true }, { sexualContact: true }, { bodyMods: true }, { vfr: true }] },
      { vaccine: 'Rabies (pre-exposure)', pgdId: 'rabies', reason: 'Endemic. Recommend for rural travel, animal contact, long stays.', trigger: [{ rural: true }, { animalContact: true }, { longStay: true }, { outdoorActivities: true }] },
    ],
    malaria: { risk: 'none', recommendAntimalarials: false, notes: 'No malaria risk. Argentina certified malaria-free by WHO in 2019.' },
    entryRequirements: [
      { vaccine: 'Yellow Fever', details: 'Certificate required for travellers ≥9 months arriving from a country with risk of YF transmission.' },
    ],
  },

  // ═══ COLOMBIA ═══
  {
    iso: 'CO',
    name: 'Colombia',
    region: 'South America',
    oneLiner:
      'Routine Hepatitis A, Yellow Fever and tetanus booster. Typhoid, Hep B and rabies for higher-risk profiles. Malaria below 1600m.',
    asks: { rural: true, longStay: true, activities: true, vfr: true },
    recommendations: [
      { vaccine: 'Hepatitis A', pgdId: 'travel-core', reason: 'Recommended for all travellers.', trigger: 'all' },
      { vaccine: 'Yellow Fever', pgdId: 'yellow-fever', reason: 'YF transmission risk across most of Colombia below 2300m. Recommended for almost all travellers and a Colombian entry requirement from YF countries.', trigger: 'all' },
      { vaccine: 'Tetanus / Diphtheria / Polio booster', pgdId: 'travel-core', reason: 'Booster if >10 years since last dose.', trigger: 'all' },
      { vaccine: 'Typhoid', pgdId: 'travel-core', reason: 'For travellers visiting non-tourist areas, rural stays or VFR.', trigger: [{ rural: true }, { longStay: true }, { vfr: true }] },
      { vaccine: 'Hepatitis B', pgdId: 'travel-core', reason: 'For long stays, healthcare/aid work, sexual contact, body modifications, or VFR.', trigger: [{ longStay: true }, { medicalWork: true }, { sexualContact: true }, { bodyMods: true }, { vfr: true }] },
      { vaccine: 'Rabies (pre-exposure)', pgdId: 'rabies', reason: 'Endemic. Recommend for rural travel, animal contact, long stays, children.', trigger: [{ rural: true }, { animalContact: true }, { longStay: true }, { outdoorActivities: true }] },
    ],
    malaria: {
      risk: 'moderate',
      regions: 'Risk below 1600m across much of the country — particularly Chocó, Amazon basin, Caribbean coastal lowlands, Pacific lowlands. No risk in Bogotá or above 1600m.',
      seasonality: 'Year-round in risk areas.',
      recommendAntimalarials: true,
      notes: 'Mixed P. vivax and P. falciparum. Atovaquone/proguanil or doxycycline.',
    },
    entryRequirements: [
      { vaccine: 'Yellow Fever', details: 'Certificate required for travellers ≥1 year arriving from a country with risk of YF transmission.' },
    ],
  },

  // ═══ JAMAICA ═══
  {
    iso: 'JM',
    name: 'Jamaica',
    region: 'Caribbean',
    oneLiner:
      'Routine Hepatitis A and tetanus booster. Typhoid, Hep B and rabies for higher-risk profiles. No malaria.',
    asks: { rural: true, longStay: true, activities: true, vfr: true },
    recommendations: [
      { vaccine: 'Hepatitis A', pgdId: 'travel-core', reason: 'Recommended for all travellers.', trigger: 'all' },
      { vaccine: 'Tetanus / Diphtheria / Polio booster', pgdId: 'travel-core', reason: 'Booster if >10 years since last dose.', trigger: 'all' },
      { vaccine: 'Typhoid', pgdId: 'travel-core', reason: 'For travellers eating outside resorts, rural stays or VFR.', trigger: [{ rural: true }, { longStay: true }, { vfr: true }] },
      { vaccine: 'Hepatitis B', pgdId: 'travel-core', reason: 'For long stays, healthcare/aid work, sexual contact, body modifications, or VFR.', trigger: [{ longStay: true }, { medicalWork: true }, { sexualContact: true }, { bodyMods: true }, { vfr: true }] },
      { vaccine: 'Rabies (pre-exposure)', pgdId: 'rabies', reason: 'Bat-mediated rabies present. Consider for rural travel, animal contact, long stays.', trigger: [{ rural: true }, { animalContact: true }, { longStay: true }] },
    ],
    malaria: { risk: 'none', recommendAntimalarials: false, notes: 'No malaria risk. Dengue and chikungunya present — bite avoidance.' },
    entryRequirements: [
      { vaccine: 'Yellow Fever', details: 'Certificate required for travellers ≥1 year arriving from a country with risk of YF transmission.' },
    ],
  },

  // ═══ DOMINICAN REPUBLIC ═══
  {
    iso: 'DO',
    name: 'Dominican Republic',
    region: 'Caribbean',
    oneLiner:
      'Routine Hepatitis A and tetanus booster. Typhoid, Hep B and rabies for higher-risk profiles. Limited malaria in rural border with Haiti.',
    asks: { rural: true, longStay: true, activities: true, vfr: true },
    recommendations: [
      { vaccine: 'Hepatitis A', pgdId: 'travel-core', reason: 'Recommended for all travellers.', trigger: 'all' },
      { vaccine: 'Tetanus / Diphtheria / Polio booster', pgdId: 'travel-core', reason: 'Booster if >10 years since last dose.', trigger: 'all' },
      { vaccine: 'Typhoid', pgdId: 'travel-core', reason: 'For travellers eating outside resorts, rural stays or VFR.', trigger: [{ rural: true }, { longStay: true }, { vfr: true }] },
      { vaccine: 'Hepatitis B', pgdId: 'travel-core', reason: 'For long stays, healthcare/aid work, sexual contact, body modifications, or VFR.', trigger: [{ longStay: true }, { medicalWork: true }, { sexualContact: true }, { bodyMods: true }, { vfr: true }] },
      { vaccine: 'Rabies (pre-exposure)', pgdId: 'rabies', reason: 'Endemic. Recommend for rural travel, animal contact, long stays.', trigger: [{ rural: true }, { animalContact: true }, { longStay: true }] },
    ],
    malaria: {
      risk: 'low',
      regions: 'Limited rural risk in provinces along the Haitian border (Dajabón, Elías Piña) and parts of La Altagracia. No risk in main resorts (Punta Cana, Puerto Plata, Bávaro) or Santo Domingo for short stays.',
      seasonality: 'Year-round in risk areas.',
      recommendAntimalarials: true,
      notes: 'P. falciparum, chloroquine-sensitive. Chloroquine, atovaquone/proguanil or doxycycline.',
    },
    entryRequirements: [
      { vaccine: 'Yellow Fever', details: 'Certificate required for travellers ≥1 year arriving from a country with risk of YF transmission.' },
    ],
  },

  // ═══ MEXICO ═══
  {
    iso: 'MX',
    name: 'Mexico',
    region: 'Central America',
    oneLiner:
      'Routine Hepatitis A and tetanus booster. Typhoid, Hep B and rabies for higher-risk profiles. Limited malaria in rural southern states only.',
    asks: { rural: true, longStay: true, activities: true, vfr: true },
    recommendations: [
      { vaccine: 'Hepatitis A', pgdId: 'travel-core', reason: 'Recommended for all travellers.', trigger: 'all' },
      { vaccine: 'Tetanus / Diphtheria / Polio booster', pgdId: 'travel-core', reason: 'Booster if >10 years since last dose.', trigger: 'all' },
      { vaccine: 'Typhoid', pgdId: 'travel-core', reason: 'For travellers eating outside main tourist circuit, rural stays or VFR.', trigger: [{ rural: true }, { longStay: true }, { vfr: true }] },
      { vaccine: 'Hepatitis B', pgdId: 'travel-core', reason: 'For long stays, healthcare/aid work, sexual contact, body modifications, or VFR.', trigger: [{ longStay: true }, { medicalWork: true }, { sexualContact: true }, { bodyMods: true }, { vfr: true }] },
      { vaccine: 'Rabies (pre-exposure)', pgdId: 'rabies', reason: 'Endemic. Recommend for rural travel, animal contact, long stays, children. Bat-mediated rabies in caves.', trigger: [{ rural: true }, { animalContact: true }, { longStay: true }, { outdoorActivities: true }] },
    ],
    malaria: {
      risk: 'very-low',
      regions: 'Limited rural risk in southern states — Chiapas (selected areas), parts of Oaxaca, Nayarit, Sinaloa, Quintana Roo. No risk in Mexico City, Yucatán resorts (Cancún, Playa del Carmen, Tulum, Cozumel), Pacific resorts (Acapulco), or main urban areas.',
      seasonality: 'Year-round in risk areas.',
      recommendAntimalarials: false,
      notes: 'P. vivax, chloroquine-sensitive. Chemoprophylaxis only for travel to specific rural risk areas — bite avoidance otherwise.',
    },
    entryRequirements: [
      { vaccine: 'Yellow Fever', details: 'Certificate required for travellers ≥1 year arriving from a country with risk of YF transmission.' },
    ],
  },
]

export function findDestination(iso: string): TravelDestination | null {
  const needle = iso.toUpperCase()
  return destinations.find((d) => d.iso === needle) ?? null
}

export function listDestinations(): TravelDestination[] {
  // Sort by name for the picker
  return [...destinations].sort((a, b) => a.name.localeCompare(b.name))
}
