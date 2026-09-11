import { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";

// Aligned to the Genital Herpes Management PGD, version 003, issued
// 11 September 2026 (aciclovir 400 mg tablets; valaciclovir 500 mg tablets).
// Note: the consultation client for this slug has not been built; page.tsx is
// a "Coming Soon" placeholder. These types and the logic in
// herpes-clinical-logic.ts carry the document's gates and regimens so that a
// client built on them starts aligned.

export type HerpesEpisodeType = "first" | "recurrent" | "suppressive" | "";
export type HerpesMedicine = "aciclovir" | "valaciclovir" | "";

export interface HerpesAssessment {
  /** Inclusion: confirmed or highly suspected genital herpes (HSV-1 or HSV-2 positive or clinical diagnosis). */
  herpesDiagnosed: boolean;
  firstEpisode: boolean;
  episodeType: HerpesEpisodeType;
  episodeFrequency: string;
  /** Suppressive therapy requires 6 or more recurrences a year. */
  recurrencesPerYear: number | null;
  /** Number of 28-day suppressive supplies already made under this PGD (maximum 3 before GP or GUM review). */
  suppressiveSuppliesMade: number | null;
  /** Exclusion: hypersensitivity to aciclovir or valaciclovir. */
  hypersensitivity: boolean;
  /** Exclusion: eGFR below 30 mL/min. */
  severeRenalImpairment: boolean;
  /** Caution: eGFR 30 to 60 mL/min. */
  moderateRenalImpairment: boolean;
  /** Exclusion: severe hepatic impairment. */
  severeHepaticImpairment: boolean;
  /** Caution: mild to moderate hepatic impairment. */
  mildModerateHepaticImpairment: boolean;
  /** Exclusion: immunocompromised, any presentation (HIV, chemotherapy, transplant, biologic or high-dose steroid). */
  immunocompromised: boolean;
  /** Exclusion, emergency referral: suspected disseminated infection, meningitis or encephalitis, or inability to pass urine. */
  emergencyFeatures: boolean;
  /** Exclusion: pregnancy at any gestation. */
  pregnant: boolean;
  /** Exclusion: breastfeeding. */
  breastfeeding: boolean;
  /** Retained: first episode in pregnancy (subset of pregnancy; needs specialist management). */
  pregnancyFirstEpisode: boolean;
  /** Caution: dehydration, crystalline nephropathy risk. */
  dehydrationRisk: boolean;
  /** Caution: neurological disease. */
  neurologicalDisease: boolean;
  lesionCount: number | null;
  symptomsPresent: boolean;
  /** Recurrent episode treatment must start within 48 hours of symptom onset. */
  daysFromOnset: number | null;
  /** First episode extension to 10 days only where new lesions are still forming at day 5. */
  newLesionsAtDay5: boolean;
  medicine: HerpesMedicine;
}

export interface HerpesCounselling {
  explainedViralShedding: boolean;
  counselledOnCondoms: boolean;
  discussedDisclosure: boolean;
  counselledOnTriggers: boolean;
  providedWrittenInfo: boolean;
  /** Not a cure; the virus remains and recurrences are possible. */
  explainedNotACure: boolean;
  /** Avoid all sexual contact during prodrome and active lesions. */
  avoidSexDuringSymptoms: boolean;
  /** Consider HPV vaccination; attend cervical screening. */
  discussedHpvAndScreening: boolean;
  /** If pregnant or planning pregnancy, discuss with GP or obstetrician early. */
  discussedPregnancyPlanning: boolean;
  completeCourse: boolean;
  /** Seek advice if no improvement within 10 days, severe pain, fever or systemic infection. */
  safetyNetting: boolean;
  /** Discuss suppressive therapy if recurrences reach 6 or more a year. */
  discussedSuppressiveOption: boolean;
}

export interface HerpesConsultationState {
  patient: BasePatientDetails;
  consent: BaseConsent;
  assessment: HerpesAssessment;
  counselling: HerpesCounselling;
  summary: BaseSummary;
  currentStep: number;
}

export const PGD_VERSION_LINE = "Genital Herpes Management PGD, version 003, issued 11 September 2026";

export const STEP_LABELS = ["Patient Details", "Herpes Assessment", "Episode Type", "Contraindications", "Counselling", "Treatment", "Summary", "Review"];
export const TOTAL_STEPS = STEP_LABELS.length;

export function createInitialConsultationState(): HerpesConsultationState {
  return {
    patient: { firstName: "", lastName: "", dateOfBirth: "", age: null, gpName: "", gpPractice: "", gpAddress: "", gpPhone: "", gpEmail: "", gpOdsCode: "", nhsNumber: "", address: "", phone: "", email: "" },
    consent: { informedConsentGiven: false, idVerified: false, idType: "", patientAwarePrivateService: false },
    assessment: {
      herpesDiagnosed: false,
      firstEpisode: false,
      episodeType: "",
      episodeFrequency: "",
      recurrencesPerYear: null,
      suppressiveSuppliesMade: null,
      hypersensitivity: false,
      severeRenalImpairment: false,
      moderateRenalImpairment: false,
      severeHepaticImpairment: false,
      mildModerateHepaticImpairment: false,
      immunocompromised: false,
      emergencyFeatures: false,
      pregnant: false,
      breastfeeding: false,
      pregnancyFirstEpisode: false,
      dehydrationRisk: false,
      neurologicalDisease: false,
      lesionCount: null,
      symptomsPresent: false,
      daysFromOnset: null,
      newLesionsAtDay5: false,
      medicine: "",
    },
    counselling: {
      explainedViralShedding: false,
      counselledOnCondoms: false,
      discussedDisclosure: false,
      counselledOnTriggers: false,
      providedWrittenInfo: false,
      explainedNotACure: false,
      avoidSexDuringSymptoms: false,
      discussedHpvAndScreening: false,
      discussedPregnancyPlanning: false,
      completeCourse: false,
      safetyNetting: false,
      discussedSuppressiveOption: false,
    },
    summary: { pharmacistName: "", pharmacistGPhC: "", pharmacyName: "", pharmacyAddress: "", consultationDate: new Date().toISOString().split("T")[0], consultationTime: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }), clinicalNotes: "" },
    currentStep: 0,
  };
}
