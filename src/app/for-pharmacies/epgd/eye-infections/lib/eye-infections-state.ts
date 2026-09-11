// State shape and initial-state factory for the Chloramphenicol eye drops and
// eye ointment (Bacterial Conjunctivitis) ePGD. Version 002, issued
// 11 September 2026. The clinical logic lives in EyeInfectionsClient.tsx.

import type { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";

export const PGD_STRAPLINE =
  "Chloramphenicol eye drops and eye ointment (Bacterial Conjunctivitis) PGD, version 002, issued 11 September 2026";

export type ConsentBasis = "" | "patient" | "gillick" | "parental";

export interface EyeConsent extends BaseConsent {
  /** Who gave consent: the patient (16+), a Gillick-competent child, or a
   *  person with parental responsibility. Required when age < 16. */
  consentBasis: ConsentBasis;
  consentGivenByName: string;
  consentGivenByRelationship: string;
}

export interface EyeAssessment {
  eyeAffected: string;
  durationSymptoms: string;
  stickyDischarge: boolean;
  redEye: boolean;
  grittySensation: boolean;
  eyelidSwelling: boolean;
  crustingOnWaking: boolean;
  contactLensWearer: boolean;
  chloramphenicolAllergy: boolean;
  boneMarrowProblems: boolean;
  boneMarrowSuppressionOrChemo: boolean;
  pregnantOrBreastfeeding: boolean;
  painInsideEye: boolean;
  photophobia: boolean;
  suspectedCornealUlcerOrAbrasion: boolean;
  suspectedViral: boolean;
  recentSurgeryOrTrauma: boolean;
  onlyOneFunctionalEye: boolean;
  symptomsRecurrent: boolean;
  childUnder2: boolean;
  ableToInstil: boolean;
  /** Attestation that every exclusion and red-flag question was put to the patient. */
  questionsAsked: boolean;
}

export interface EyeTreatment {
  formulation: string;
  dropsBrand: string;
  dropsBatchNumber: string;
  dropsExpiry: string;
  ointmentBrand: string;
  ointmentBatchNumber: string;
  ointmentExpiry: string;
}

export interface EyeCounselling {
  handsBeforeAfter: boolean;
  noSharing: boolean;
  discardContactLenses: boolean;
  completeCourse: boolean;
  discard28Days: boolean;
  returnIfWorse: boolean;
  blurredVisionWarning: boolean;
  innerCanthusPressure: boolean;
  urgentSymptoms: boolean;
  reportAdverse: boolean;
  pregnancyInform: boolean;
  pilSupplied: boolean;
}

export interface EyeSummary extends BaseSummary {
  /** Advice given and referral made when the patient is excluded. */
  exclusionAdvice: string;
}

export interface EyeConsultationState {
  patient: BasePatientDetails;
  consent: EyeConsent;
  assessment: EyeAssessment;
  treatment: EyeTreatment;
  counselling: EyeCounselling;
  summary: EyeSummary;
}

export const STEP_LABELS = ["Patient Details", "Consent", "Assessment", "Treatment", "Counselling", "Summary & Record"] as const;
export const TOTAL_STEPS = STEP_LABELS.length;

export function createInitialEyeState(): EyeConsultationState {
  return {
    patient: { firstName: "", lastName: "", dateOfBirth: "", age: null, gpName: "", gpPractice: "", gpAddress: "", gpPhone: "", gpEmail: "", gpOdsCode: "", nhsNumber: "", address: "", phone: "", email: "" },
    consent: { informedConsentGiven: false, idVerified: false, idType: "", patientAwarePrivateService: false, consentBasis: "", consentGivenByName: "", consentGivenByRelationship: "" },
    assessment: {
      eyeAffected: "",
      durationSymptoms: "",
      stickyDischarge: false,
      redEye: false,
      grittySensation: false,
      eyelidSwelling: false,
      crustingOnWaking: false,
      contactLensWearer: false,
      chloramphenicolAllergy: false,
      boneMarrowProblems: false,
      boneMarrowSuppressionOrChemo: false,
      pregnantOrBreastfeeding: false,
      painInsideEye: false,
      photophobia: false,
      suspectedCornealUlcerOrAbrasion: false,
      suspectedViral: false,
      recentSurgeryOrTrauma: false,
      onlyOneFunctionalEye: false,
      symptomsRecurrent: false,
      childUnder2: false,
      ableToInstil: false,
      questionsAsked: false,
    },
    treatment: {
      formulation: "",
      dropsBrand: "",
      dropsBatchNumber: "",
      dropsExpiry: "",
      ointmentBrand: "",
      ointmentBatchNumber: "",
      ointmentExpiry: "",
    },
    counselling: {
      handsBeforeAfter: false,
      noSharing: false,
      discardContactLenses: false,
      completeCourse: false,
      discard28Days: false,
      returnIfWorse: false,
      blurredVisionWarning: false,
      innerCanthusPressure: false,
      urgentSymptoms: false,
      reportAdverse: false,
      pregnancyInform: false,
      pilSupplied: false,
    },
    summary: {
      pharmacistName: "",
      pharmacistGPhC: "",
      pharmacyName: "",
      pharmacyAddress: "",
      consultationDate: new Date().toISOString().split("T")[0],
      consultationTime: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      clinicalNotes: "",
      exclusionAdvice: "",
    },
  };
}

export const DROPS_LABEL = "Chloramphenicol 0.5% w/v eye drops (P)";
export const OINTMENT_LABEL = "Chloramphenicol 1% w/w eye ointment (P)";
export const DROPS_DOSE = "1 drop into the conjunctival sac of the affected eye(s) every 2 hours for 48 hours, then 1 drop four times daily; 5 days total";
export const OINTMENT_DOSE_ADJUNCT = "Apply to the conjunctival sac of the affected eye(s) at night as an adjunct to the drops; 5 days total";
export const OINTMENT_DOSE_ALONE = "Apply to the conjunctival sac of the affected eye(s) four times daily; 5 days total";

export function describeMedicine(t: EyeTreatment): { name: string; dose: string; quantity: string; duration: string } | null {
  if (t.formulation === "drops") {
    return { name: `${DROPS_LABEL}${t.dropsBrand ? ` (${t.dropsBrand})` : ""}`, dose: DROPS_DOSE, quantity: "1 x 10 ml bottle", duration: "5 days" };
  }
  if (t.formulation === "ointment") {
    return { name: `${OINTMENT_LABEL}${t.ointmentBrand ? ` (${t.ointmentBrand})` : ""}`, dose: OINTMENT_DOSE_ALONE, quantity: "1 x 4 g tube", duration: "5 days" };
  }
  if (t.formulation === "both") {
    return {
      name: `${DROPS_LABEL}${t.dropsBrand ? ` (${t.dropsBrand})` : ""} and ${OINTMENT_LABEL}${t.ointmentBrand ? ` (${t.ointmentBrand})` : ""}`,
      dose: `Drops: ${DROPS_DOSE}. Ointment: ${OINTMENT_DOSE_ADJUNCT}`,
      quantity: "1 x 10 ml bottle and 1 x 4 g tube",
      duration: "5 days",
    };
  }
  return null;
}
