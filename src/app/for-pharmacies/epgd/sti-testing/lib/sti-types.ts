// ─── STI Testing ePGD Types ───

import type { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";

// ─── Extended types for STI Testing PGD ───

export interface STIPatientDetails extends BasePatientDetails {
  genderIdentity: string; // male, female, trans-male, trans-female, non-binary
  // PGD v002 (11 September 2026): aged 13 to 15 only with recorded Fraser
  // competence and a safeguarding assessment with no concern. Under 13 is
  // never supplied.
  fraserCompetent: boolean; // derived: all five Fraser limbs recorded
  // The five Fraser limbs, recorded individually
  fraserUnderstandsAdvice: boolean;
  fraserCannotBePersuaded: boolean; // to inform, or allow the pharmacist to inform, a parent
  fraserLikelyToContinue: boolean; // likely to have sex with or without treatment
  fraserHealthWouldSuffer: boolean; // physical or mental health likely to suffer without it
  fraserBestInterests: boolean;
  safeguardingAssessed: boolean; // partner age, coercion, exploitation indicators asked
  safeguardingConcern: boolean; // partner 18 or over, coercion, exploitation, learning disability
  safeguardingNotes: string;
}

// ─── Chlamydia treatment under the PGD (doxycycline or azithromycin arm) ───

export type STIChlamydiaDiagnosis = "" | "confirmed" | "strongly-suspected";
export type STITreatmentMedicine = "" | "doxycycline" | "azithromycin";

export interface STITreatment {
  treatUnderPgd: boolean; // supply chlamydia treatment under this PGD
  chlamydiaDiagnosis: STIChlamydiaDiagnosis;
  currentMedicines: string; // what the patient takes, asked before any supply ("none" is an answer)
  knownAllergies: string; // asked before any supply ("none known" is an answer)
  brand: string; // brand or manufacturer of the pack supplied
  // Exclusions common to both arms
  pregnant: boolean;
  breastfeeding: boolean;
  severeHepaticImpairment: boolean;
  complicatedInfection: boolean; // e.g. PID, epididymo-orchitis
  // Doxycycline arm
  tetracyclineHypersensitivity: boolean;
  unableToComplyOrSwallow: boolean; // 7-day regimen or swallowing capsules
  doxycyclineUnsuitable: boolean; // any other reason doxycycline is unsuitable
  doxycyclineUnsuitableReason: string;
  // Azithromycin arm
  macrolideHypersensitivity: boolean;
  qtProlongation: boolean; // history of QT prolongation or interacting QT-prolonging drugs
  ergotDerivatives: boolean;
  medicine: STITreatmentMedicine;
}

export interface STIExclusionOutcome {
  adviceGiven: string; // advice given and decision reached when excluded or declines
  referredTo: string; // "" | "sexual-health" | "gp" | "safeguarding" | "other"
  safeguardingReferralMade: boolean;
}

export interface STIRiskAssessment {
  numberOfPartners: number | null; // Last 3 months
  condomUsage: string; // never, sometimes, always
  previousSTIs: boolean;
  previousStiDetail: string;
  currentSymptoms: boolean;
  symptomDetail: string;
  msmStatus: boolean; // Men who have sex with men
  sexWorker: boolean;
  pwid: boolean; // People who inject drugs
  recentTravel: boolean;
  travelDetail: string;
}

export interface STIClinicalAssessment {
  symptomSite: string; // urethral, genital, rectal, pharyngeal, systemic
  urethralDischarge: boolean;
  genitalPain: boolean;
  rectalSymptoms: boolean;
  pharyngealSymptoms: boolean;
  systemicSymptoms: boolean;
  systemicDetail: string;
}

export interface STITestSelection {
  ctGc: boolean; // Chlamydia/Gonorrhoea
  ctGcSampleType: string; // urine, urethral swab, vaginal swab, rectal, pharyngeal
  hiv: boolean;
  hivTestType: string; // rapid, lab
  syphilis: boolean;
  hepatitisB: boolean;
  hepatitisC: boolean;
}

export interface STICounselling {
  windowPeriods: boolean;
  partnerNotification: boolean;
  safeSex: boolean;
  resultsTimeline: boolean;
  positiveTestMeaning: boolean;
  followUp: boolean;
  // Treatment counselling (PGD cautions and follow-up rows); required only
  // when a medicine is supplied under the PGD.
  medicineAdvice: boolean; // doxycycline: water, upright 30 minutes, sun; azithromycin: antacids 2 hours
  abstinenceAdvice: boolean; // no sex until treatment and partner treatment completed (azithromycin: 7 days)
  contraceptionAdvice: boolean; // doxycycline: effective contraception during and for 7 days after
  testOfCureAdvice: boolean; // azithromycin: test of cure if symptoms persist or in pregnancy
  worseningAdvice: boolean; // seek medical advice if worsening, no improvement in 3 to 4 weeks, systemically unwell
  retestAdvice: boolean; // retest at 3 months to detect reinfection; test of cure at least 3 weeks after treatment where required
  pilSupplied: boolean;
}

export interface STIConsultationState {
  patient: STIPatientDetails;
  consent: BaseConsent;
  riskAssessment: STIRiskAssessment;
  clinicalAssessment: STIClinicalAssessment;
  testSelection: STITestSelection;
  treatment: STITreatment;
  counselling: STICounselling;
  exclusionOutcome: STIExclusionOutcome;
  summary: BaseSummary & { testsOrdered: string[] };
  currentStep: number;
}

export type STIAction =
  | { type: "UPDATE_PATIENT"; field: keyof STIPatientDetails; value: any }
  | { type: "UPDATE_CONSENT"; field: keyof BaseConsent; value: any }
  | { type: "UPDATE_RISK_ASSESSMENT"; field: keyof STIRiskAssessment; value: any }
  | { type: "UPDATE_CLINICAL_ASSESSMENT"; field: keyof STIClinicalAssessment; value: any }
  | { type: "UPDATE_TEST_SELECTION"; field: keyof STITestSelection; value: any }
  | { type: "UPDATE_TREATMENT"; field: keyof STITreatment; value: STITreatment[keyof STITreatment] }
  | { type: "UPDATE_COUNSELLING"; field: keyof STICounselling; value: any }
  | { type: "UPDATE_SUMMARY"; field: string; value: any }
  | { type: "UPDATE_EXCLUSION_OUTCOME"; field: keyof STIExclusionOutcome; value: any }
  | { type: "SET_STEP"; step: number }
  | { type: "RESET" };

// ─── Step labels ───

export const STEP_LABELS = [
  "Patient Details",
  "Consent",
  "Risk Assessment",
  "Clinical Assessment",
  "Test Selection",
  "Treatment",
  "Counselling",
  "Summary",
] as const;

export const TOTAL_STEPS = STEP_LABELS.length;

// PGD strapline shown on the record
export const PGD_VERSION_LABEL =
  "Chlamydia treatment PGD (doxycycline 100 mg / azithromycin 500 mg), version 002, issued 11 September 2026";

// ─── Initial state ───

export function createInitialConsultationState(): STIConsultationState {
  return {
    patient: {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      age: null,
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
      genderIdentity: "",
      fraserCompetent: false,
      fraserUnderstandsAdvice: false,
      fraserCannotBePersuaded: false,
      fraserLikelyToContinue: false,
      fraserHealthWouldSuffer: false,
      fraserBestInterests: false,
      safeguardingAssessed: false,
      safeguardingConcern: false,
      safeguardingNotes: "",
    },
    consent: {
      informedConsentGiven: false,
      idVerified: false,
      idType: "",
      patientAwarePrivateService: false,
    },
    riskAssessment: {
      numberOfPartners: null,
      condomUsage: "",
      previousSTIs: false,
      previousStiDetail: "",
      currentSymptoms: false,
      symptomDetail: "",
      msmStatus: false,
      sexWorker: false,
      pwid: false,
      recentTravel: false,
      travelDetail: "",
    },
    clinicalAssessment: {
      symptomSite: "",
      urethralDischarge: false,
      genitalPain: false,
      rectalSymptoms: false,
      pharyngealSymptoms: false,
      systemicSymptoms: false,
      systemicDetail: "",
    },
    testSelection: {
      ctGc: false,
      ctGcSampleType: "",
      hiv: false,
      hivTestType: "",
      syphilis: false,
      hepatitisB: false,
      hepatitisC: false,
    },
    treatment: {
      treatUnderPgd: false,
      chlamydiaDiagnosis: "",
      currentMedicines: "",
      knownAllergies: "",
      brand: "",
      pregnant: false,
      breastfeeding: false,
      severeHepaticImpairment: false,
      complicatedInfection: false,
      tetracyclineHypersensitivity: false,
      unableToComplyOrSwallow: false,
      doxycyclineUnsuitable: false,
      doxycyclineUnsuitableReason: "",
      macrolideHypersensitivity: false,
      qtProlongation: false,
      ergotDerivatives: false,
      medicine: "",
    },
    counselling: {
      windowPeriods: false,
      partnerNotification: false,
      safeSex: false,
      resultsTimeline: false,
      positiveTestMeaning: false,
      followUp: false,
      medicineAdvice: false,
      abstinenceAdvice: false,
      contraceptionAdvice: false,
      testOfCureAdvice: false,
      worseningAdvice: false,
      retestAdvice: false,
      pilSupplied: false,
    },
    exclusionOutcome: {
      adviceGiven: "",
      referredTo: "",
      safeguardingReferralMade: false,
    },
    summary: {
      pharmacistName: "",
      pharmacistGPhC: "",
      pharmacyName: "",
      pharmacyAddress: "",
      consultationDate: new Date().toISOString().split("T")[0],
      consultationTime: new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      clinicalNotes: "",
      testsOrdered: [],
    },
    currentStep: 0,
  };
}
