// Types, constants, schedule tables and the initial state for the Hepatitis
// A / B Travel ePGD. Kept out of the client so the printed summary can import
// them without a cycle.

export const PGD_VERSION =
  "Hepatitis A and Hepatitis B Vaccination (Havrix, Avaxim, Engerix B and Twinrix) PGD v008, issued 11 September 2026"

export const STEP_TITLES = [
  "Patient Details",
  "Consent",
  "Travel Risk Assessment",
  "Eligibility & Vaccine Choice",
  "Schedule & Administration",
  "Post-Vaccine Advice",
  "Pharmacist Summary",
  "Consultation Complete",
]

export type VaccineProduct =
  | ""
  | "twinrix-adult"
  | "twinrix-paediatric"
  | "havrix-monodose"
  | "havrix-junior"
  // Avaxim added 9 Sep 2026 with document v003. v002 authorised Havrix only,
  // so a pharmacy holding Avaxim, a widely stocked UK-licensed hepatitis A
  // vaccine, could not use it. Raised twice by an adopting pharmacy.
  | "avaxim-adult"
  | "avaxim-junior"
  | "engerix-b-adult"
  | "engerix-b-paediatric"

export type Schedule =
  | ""
  | "hepa-single-booster-6-12m"
  | "standard-0-1-6"
  | "accelerated-0-1-2-12m"
  | "rapid-0-7-21-12m"

/** Who gave consent. Under 16: a person with parental responsibility, or the
 *  young person where assessed as Gillick competent (offered from 12 to 15 in
 *  the tool); 16 and over: the patient. Decision 6, 11 September 2026. */
export type ConsentBasis = "" | "parental" | "gillick" | "self"

export const HEP_A_PRODUCTS: VaccineProduct[] = [
  "twinrix-adult", "twinrix-paediatric", "havrix-monodose", "havrix-junior", "avaxim-adult", "avaxim-junior",
]
export const HEP_B_PRODUCTS: VaccineProduct[] = [
  "twinrix-adult", "twinrix-paediatric", "engerix-b-adult", "engerix-b-paediatric",
]

/** Schedules the document permits for each product. */
export const SCHEDULES_FOR_PRODUCT: Record<Exclude<VaccineProduct, "">, Schedule[]> = {
  "havrix-monodose": ["hepa-single-booster-6-12m"],
  "havrix-junior": ["hepa-single-booster-6-12m"],
  "avaxim-adult": ["hepa-single-booster-6-12m"],
  "avaxim-junior": ["hepa-single-booster-6-12m"],
  "engerix-b-adult": ["standard-0-1-6", "accelerated-0-1-2-12m", "rapid-0-7-21-12m"],
  "engerix-b-paediatric": ["standard-0-1-6", "accelerated-0-1-2-12m"],
  "twinrix-adult": ["standard-0-1-6", "rapid-0-7-21-12m"],
  "twinrix-paediatric": ["standard-0-1-6"],
}

export const SCHEDULE_LABEL: Record<Exclude<Schedule, "">, string> = {
  "hepa-single-booster-6-12m": "Hepatitis A monovalent: single dose, booster at 6 to 12 months (Avaxim Junior: 6 months to 15 years)",
  "standard-0-1-6": "Standard: 0, 1 and 6 months",
  "accelerated-0-1-2-12m": "Accelerated: 0, 1 and 2 months, booster at 12 months (Engerix B)",
  "rapid-0-7-21-12m": "Very rapid: 0, 7 and 21 days, plus a dose at 12 months (18 and over under this PGD)",
}

export type DoseNumber = "" | "1" | "2" | "3" | "booster"

/** Dose numbers each schedule has (the document's schedules table). */
export const DOSES_FOR_SCHEDULE: Record<Exclude<Schedule, "">, DoseNumber[]> = {
  "hepa-single-booster-6-12m": ["1", "booster"],
  "standard-0-1-6": ["1", "2", "3"],
  "accelerated-0-1-2-12m": ["1", "2", "3", "booster"],
  "rapid-0-7-21-12m": ["1", "2", "3", "booster"],
}

export const DOSE_LABEL: Record<Exclude<DoseNumber, "">, string> = {
  "1": "Dose 1 (primary)",
  "2": "Dose 2",
  "3": "Dose 3",
  booster: "Booster or 12-month dose",
}

/**
 * Minimum days since the previous dose for a given schedule and dose number
 * (null: first dose, no previous dose applies), and the interval from today
 * to the next dose (null: course complete with this dose). Intervals are the
 * document's schedules; the "next" figures are the nominal gap, and the
 * document's own rule for a late dose is resume, do not restart.
 */
export const SCHEDULE_INTERVALS: Record<Exclude<Schedule, "">, Record<Exclude<DoseNumber, "">, { minDays: number | null; nextDays: number | null; nextLabel: string }>> = {
  "hepa-single-booster-6-12m": {
    "1": { minDays: null, nextDays: 6 * 30, nextLabel: "Booster due 6 to 12 months after the first dose (a late booster still works; do not restart)" },
    "2": { minDays: null, nextDays: null, nextLabel: "" },
    "3": { minDays: null, nextDays: null, nextLabel: "" },
    booster: { minDays: 6 * 30, nextDays: null, nextLabel: "Course complete: long term protection, no further booster for immunocompetent adults" },
  },
  "standard-0-1-6": {
    "1": { minDays: null, nextDays: 28, nextLabel: "Dose 2 due 1 month after dose 1" },
    "2": { minDays: 28, nextDays: 5 * 30, nextLabel: "Dose 3 due 6 months after dose 1 (5 months after dose 2)" },
    "3": { minDays: 5 * 30, nextDays: null, nextLabel: "Course complete" },
    booster: { minDays: null, nextDays: null, nextLabel: "" },
  },
  "accelerated-0-1-2-12m": {
    "1": { minDays: null, nextDays: 28, nextLabel: "Dose 2 due 1 month after dose 1" },
    "2": { minDays: 28, nextDays: 28, nextLabel: "Dose 3 due 2 months after dose 1 (1 month after dose 2)" },
    "3": { minDays: 28, nextDays: 10 * 30, nextLabel: "Booster due at 12 months from dose 1 (10 months after dose 3)" },
    booster: { minDays: 10 * 30, nextDays: null, nextLabel: "Course complete" },
  },
  "rapid-0-7-21-12m": {
    "1": { minDays: null, nextDays: 7, nextLabel: "Dose 2 due on day 7" },
    "2": { minDays: 7, nextDays: 14, nextLabel: "Dose 3 due on day 21 (14 days after dose 2)" },
    "3": { minDays: 14, nextDays: 344, nextLabel: "12-month dose due (about 11 months after dose 3); near-complete hepatitis B protection only after this dose" },
    booster: { minDays: 330, nextDays: null, nextLabel: "Course complete" },
  },
}

export function parseLocalDate(iso: string): Date | null {
  if (!iso) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return null
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return Number.isNaN(d.getTime()) ? null : d
}
export function todayLocal(): Date {
  const n = new Date()
  return new Date(n.getFullYear(), n.getMonth(), n.getDate())
}
export function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 86400000)
}
export function formatLocalDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}
export function addDays(n: number): string {
  const t = todayLocal()
  return formatLocalDate(new Date(t.getFullYear(), t.getMonth(), t.getDate() + n))
}

export const PRODUCT_LABEL: Record<Exclude<VaccineProduct, "">, string> = {
  "twinrix-adult": "Twinrix Adult, Hep A 720 EU + HBsAg 20 mcg, 1.0 mL",
  "twinrix-paediatric": "Twinrix Paediatric, Hep A 360 EU + HBsAg 10 mcg, 0.5 mL",
  "havrix-monodose": "Havrix Monodose, Hep A 1440 ELISA units, 1.0 mL",
  "havrix-junior": "Havrix Junior Monodose, Hep A 720 ELISA units, 0.5 mL",
  "avaxim-adult": "Avaxim, Hep A 160 EU, 0.5 mL",
  "avaxim-junior": "Avaxim Junior, Hep A 80 EU, 0.5 mL",
  "engerix-b-adult": "Engerix B, HBsAg 20 micrograms, 1.0 mL",
  "engerix-b-paediatric": "Engerix B Paediatric, HBsAg 10 micrograms, 0.5 mL",
}

export function createInitialState() {
  return {
    patient: {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      age: null as number | null,
      gpName: "",
      gpPractice: "",
      gpAddress: "",
      gpPhone: "",
      gpEmail: "",
      gpOdsCode: "",
      nhsNumber: "",
      address: "",
      phone: "",
      email: "",
    },
    consent: {
      informedConsentGiven: false,
      idVerified: false,
      idType: "",
      patientAwarePrivateService: false,
    },
    travel: {
      destinations: "",
      departureDate: "",
      durationWeeks: "",
      hepARisk: false,
      hepANonTravelRisk: false,
      hepBRisk: false,
      longerStay: false,
      ruralOrRemote: false,
      healthcareWorkerExposure: false,
      sexualOrBloodExposureRisk: false,
      bodyModificationRisk: false,
      previousHepAVaccine: false,
      previousHepBVaccine: false,
      previousVaccineDetails: "",
      /** A completed hepatitis A course (primary plus booster): no new primary dose. */
      previousHepACourseComplete: false,
      /** A completed hepatitis B primary course: no new primary dose (no reinforcing dose needed if immunocompetent). */
      previousHepBCourseComplete: false,
      previousVaccinationInfoSufficient: false,
      consentBasis: "" as ConsentBasis,
      consentGivenBy: "",
    },
    eligibility: {
      vaccineChoice: "" as VaccineProduct,
      // Common contraindications
      hypersensitivityToVaccine: false,
      hypersensitivityDetails: "",
      acuteFebrileIllness: false,
      previousAnaphylaxisToHepVaccine: false,
      previousHypersensitivityToHepVaccine: false,
      outOfScope: false,
      proofOfImmunityRequired: false,
      // Cautions to document
      pregnant: false,
      pregnancyRiskAssessment: "",
      breastfeeding: false,
      breastfeedingDecision: "",
      immunocompromised: false,
      immunoDetails: "",
      onAnticoagulants: false,
      bleedingDisorder: false,
      chronicLiverDisease: false,
      latexAllergy: false,
      otherVaccinesSameVisit: false,
      twinrixPaedCoAdminRecorded: false,
      yeastAllergy: false, // Hep B vaccines contain recombinant yeast-derived HBsAg
      neomycinAllergy: false, // Hep A vaccines may contain trace neomycin
      // Exclusion outcome (document: record the reason, the advice given and the decision)
      exclusionAdvice: "",
      exclusionReferral: "" as "" | "gp" | "occupational-health" | "travel-clinic" | "hpt-urgent" | "declined",
    },
    administration: {
      vaccineGiven: "" as VaccineProduct,
      schedule: "" as Schedule,
      offLabelScheduleConsented: false,
      doseNumberThisVisit: "" as DoseNumber,
      previousDoseDate: "",
      batchNumber: "",
      expiryDate: "",
      injectionSite: "" as "" | "left-deltoid" | "right-deltoid" | "anterolateral-thigh",
      administeredAt: new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      postObsMinutes: "" as "" | "15" | "30",
      patientWell: false,
      adverseReaction: false,
      adverseReactionDetails: "",
      anaphylaxisKitChecked: false,
      yellowCardDiscussed: false,
      nextDoseDueDate: "",
      courseComplete: false,
    },
    advice: {
      sideEffectsCounselled: false,
      yellowCardLeafletGiven: false,
      pilGiven: false,
      vaccineRecordCardIssued: false,
      gpInformed: false,
      gpInformedDecision: "" as "" | "informed" | "declined",
      followUpScheduleAgreed: false,
      protectionByTravelExplained: false,
      hepCNotCoveredExplained: false,
      travelHealthAdviceProvided: false,
      foodAndWaterHygieneCounselled: false,
      sexualHealthCounselling: false,
    },
    summary: {
      pharmacistName: "",
      pharmacistGPhC: "",
      pharmacyName: "",
      pharmacyAddress: "",
      consultationDate: formatLocalDate(new Date()),
      consultationTime: new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      clinicalNotes: "",
    },
  }
}

export type HepABState = ReturnType<typeof createInitialState>

