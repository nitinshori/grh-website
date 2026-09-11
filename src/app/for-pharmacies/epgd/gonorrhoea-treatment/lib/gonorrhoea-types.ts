import { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";

// Aligned to the Gonorrhoea Treatment PGD (ceftriaxone 1 g reconstituted with
// 3.5 mL lidocaine 1%), version 004, issued 11 September 2026.
export const PGD_VERSION_LABEL =
  "Gonorrhoea Treatment PGD (ceftriaxone 1 g with lidocaine 1%), version 004, issued 11 September 2026";

export type GonorrhoeaInfectionSite = "" | "genital" | "rectal" | "pharyngeal";

export interface GonorrhoeaAssessment {
  neatPositive: boolean; // positive NAAT for N. gonorrhoeae
  epidemiologicalLink: boolean; // OR strong clinical suspicion with a clear epidemiological link
  infectionSite: GonorrhoeaInfectionSite;
  pharyngealGonorrhoea: boolean;
  cephalosporinAllergy: boolean; // known anaphylaxis or severe hypersensitivity to cephalosporins
  severePenicillinAllergy: boolean; // anaphylaxis (cross-reactivity about 1 to 2 percent)
  mildPenicillinAllergy: boolean; // caution: clinical assessment required
  lidocaineContraindication: boolean; // hypersensitivity to lidocaine or amide local anaesthetics, or any SmPC contraindication (severe heart block without a pacemaker, hypovolaemia, porphyria)
  complicatedInfection: boolean; // disseminated infection, meningitis, endocarditis: hospital treatment
  renalImpairmentEgfrUnder30: boolean; // caution: standard dose suitable for eGFR over 30
  severeHepaticImpairment: boolean; // caution: monitor
  anticoagulantTherapy: boolean; // caution: may potentiate warfarin, monitor INR
  probenecid: boolean; // caution: avoid concurrent use
  pregnancyStatus: string; // caution only: ceftriaxone is safe in pregnancy; complicated cases refer to obstetrics
  ableToAttendTestOfCure: boolean; // inclusion: test of cure at 2 weeks
  partnerNotificationPlanned: boolean;
  testOfCurePlanned: boolean;
  coTestsOffered: boolean;
  lastSexualContact: string;
}

export interface GonorrhoeaAdministration {
  adrenalineAvailable: boolean; // adrenaline 1 in 1,000 immediately available, in date, with a telephone
  anaphylaxisProtocolAvailable: boolean; // written protocol and trained administrator
  ceftriaxoneBatch: string;
  ceftriaxoneExpiry: string;
  lidocaineBatch: string;
  lidocaineExpiry: string;
  injectionSite: "" | "gluteal-left" | "gluteal-right"; // intramuscular into gluteal muscle
  notGivenIntravenously: boolean; // lidocaine-reconstituted solution must never be given IV
  observationCompleted: boolean; // 15 minutes seated, recorded
}

export interface GonorrhoeaCounselling {
  counselledOnTreatment: boolean;
  discussedPartnerNotification: boolean;
  counselledOnAbstinence: boolean;
  offeredCoTesting: boolean;
  providedWrittenInfo: boolean;
  testOfCureAdvice: boolean; // attend test of cure at 2 weeks
  injectionSiteAdvice: boolean; // mild pain and swelling normal, resolves in 24 to 48 hours
  allergyAndColitisAdvice: boolean; // seek immediate attention for allergic reaction; seek advice for severe diarrhoea or abdominal pain
}

export interface GonorrhoeaConsultationState {
  patient: BasePatientDetails;
  consent: BaseConsent;
  assessment: GonorrhoeaAssessment;
  administration: GonorrhoeaAdministration;
  counselling: GonorrhoeaCounselling;
  summary: BaseSummary;
  currentStep: number;
}

// Consent sits before anything is administered. The earlier scaffold validated
// consent on the Summary step, after the injection had been recorded
// (adversarial review, 11 Sep 2026).
export const STEP_LABELS = ["Patient Details", "Consent", "Diagnostic Confirmation", "Assessment", "Contraindications", "Counselling", "Treatment", "Summary"];
export const TOTAL_STEPS = STEP_LABELS.length;

export const MEDICINE_DETAILS = {
  name: "Ceftriaxone 1g powder for solution for injection, reconstituted with 3.5 mL of lidocaine 1% solution for injection",
  dose: "1 g as a single intramuscular dose",
  route: "Intramuscular injection into gluteal muscle. The lidocaine-reconstituted solution must NEVER be given intravenously.",
  quantity: "Single dose treatment (1 vial of 1 g powder)",
  treatmentPeriod: "Single administration. Test of cure at 2 weeks. Partner notification essential.",
} as const;

export function createInitialConsultationState(): GonorrhoeaConsultationState {
  return {
    patient: { firstName: "", lastName: "", dateOfBirth: "", age: null, gpName: "", gpPractice: "", gpAddress: "", gpPhone: "", gpEmail: "", gpOdsCode: "", nhsNumber: "", address: "", phone: "", email: "" },
    consent: { informedConsentGiven: false, idVerified: false, idType: "", patientAwarePrivateService: false },
    assessment: {
      neatPositive: false,
      epidemiologicalLink: false,
      infectionSite: "",
      pharyngealGonorrhoea: false,
      cephalosporinAllergy: false,
      severePenicillinAllergy: false,
      mildPenicillinAllergy: false,
      lidocaineContraindication: false,
      complicatedInfection: false,
      renalImpairmentEgfrUnder30: false,
      severeHepaticImpairment: false,
      anticoagulantTherapy: false,
      probenecid: false,
      pregnancyStatus: "",
      ableToAttendTestOfCure: false,
      partnerNotificationPlanned: false,
      testOfCurePlanned: false,
      coTestsOffered: false,
      lastSexualContact: "",
    },
    administration: {
      adrenalineAvailable: false,
      anaphylaxisProtocolAvailable: false,
      ceftriaxoneBatch: "",
      ceftriaxoneExpiry: "",
      lidocaineBatch: "",
      lidocaineExpiry: "",
      injectionSite: "",
      notGivenIntravenously: false,
      observationCompleted: false,
    },
    counselling: {
      counselledOnTreatment: false,
      discussedPartnerNotification: false,
      counselledOnAbstinence: false,
      offeredCoTesting: false,
      providedWrittenInfo: false,
      testOfCureAdvice: false,
      injectionSiteAdvice: false,
      allergyAndColitisAdvice: false,
    },
    summary: { pharmacistName: "", pharmacistGPhC: "", pharmacyName: "", pharmacyAddress: "", consultationDate: new Date().toISOString().split("T")[0], consultationTime: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }), clinicalNotes: "" },
    currentStep: 0,
  };
}
