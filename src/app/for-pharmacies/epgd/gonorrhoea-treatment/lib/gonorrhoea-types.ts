import { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";

export interface GonorrhoeaAssessment {
  neatPositive: boolean;
  pharyngealGonorrhoea: boolean;
  cephalosporinAllergy: boolean;
  pregnancyStatus: string;
  partnerNotificationPlanned: boolean;
  testOfCurePlanned: boolean;
  coTestsOffered: boolean;
  lastSexualContact: string;
}

export interface GonorrhoeaCounselling {
  counselledOnTreatment: boolean;
  discussedPartnerNotification: boolean;
  counselledOnAbstinence: boolean;
  offeredCoTesting: boolean;
  providedWrittenInfo: boolean;
}

export interface GonorrhoeaConsultationState {
  patient: BasePatientDetails;
  consent: BaseConsent;
  assessment: GonorrhoeaAssessment;
  counselling: GonorrhoeaCounselling;
  summary: BaseSummary;
  currentStep: number;
}

export const STEP_LABELS = ["Patient Details", "Diagnostic Confirmation", "Assessment", "Contraindications", "Counselling", "Treatment", "Summary", "Review"];
export const TOTAL_STEPS = STEP_LABELS.length;

export function createInitialConsultationState(): GonorrhoeaConsultationState {
  return {
    patient: { firstName: "", lastName: "", dateOfBirth: "", age: null, gpName: "", gpPractice: "", nhsNumber: "", address: "", phone: "", email: "" },
    consent: { informedConsentGiven: false, idVerified: false, idType: "", patientAwarePrivateService: false },
    assessment: { neatPositive: false, pharyngealGonorrhoea: false, cephalosporinAllergy: false, pregnancyStatus: "", partnerNotificationPlanned: false, testOfCurePlanned: false, coTestsOffered: false, lastSexualContact: "" },
    counselling: { counselledOnTreatment: false, discussedPartnerNotification: false, counselledOnAbstinence: false, offeredCoTesting: false, providedWrittenInfo: false },
    summary: { pharmacistName: "", pharmacistGPhC: "", pharmacyName: "", pharmacyAddress: "", consultationDate: new Date().toISOString().split("T")[0], consultationTime: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }), clinicalNotes: "" },
    currentStep: 0,
  };
}
