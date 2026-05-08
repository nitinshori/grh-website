import { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";

export interface GenitalWartsAssessment {
  externalWartsOnly: boolean;
  keratinisedSkinConfirmed: boolean;
  internalWartsPresent: boolean;
  cervicalWarts: boolean;
  analWarts: boolean;
  immunosuppressed: boolean;
  pregnancyStatus: string;
  openWoundsPresent: boolean;
  wartCount: number | null;
}

export interface GenitalWartsCounselling {
  explainedApplicationTechnique: boolean;
  discussedBurningIrritation: boolean;
  counselledOnCondoms: boolean;
  discussedHPVVaccination: boolean;
  providedWrittenInfo: boolean;
}

export interface GenitalWartsConsultationState {
  patient: BasePatientDetails;
  consent: BaseConsent;
  assessment: GenitalWartsAssessment;
  counselling: GenitalWartsCounselling;
  summary: BaseSummary;
  currentStep: number;
}

export const STEP_LABELS = ["Patient Details", "Wart Assessment", "Location Check", "Contraindications", "Counselling", "Treatment Plan", "Summary"];
export const TOTAL_STEPS = STEP_LABELS.length;

export function createInitialConsultationState(): GenitalWartsConsultationState {
  return {
    patient: { firstName: "", lastName: "", dateOfBirth: "", age: null, gpName: "", gpPractice: "", gpAddress: "", gpPhone: "", gpOdsCode: "", nhsNumber: "", address: "", phone: "", email: "" },
    consent: { informedConsentGiven: false, idVerified: false, idType: "", patientAwarePrivateService: false },
    assessment: { externalWartsOnly: false, keratinisedSkinConfirmed: false, internalWartsPresent: false, cervicalWarts: false, analWarts: false, immunosuppressed: false, pregnancyStatus: "", openWoundsPresent: false, wartCount: null },
    counselling: { explainedApplicationTechnique: false, discussedBurningIrritation: false, counselledOnCondoms: false, discussedHPVVaccination: false, providedWrittenInfo: false },
    summary: { pharmacistName: "", pharmacistGPhC: "", pharmacyName: "", pharmacyAddress: "", consultationDate: new Date().toISOString().split("T")[0], consultationTime: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }), clinicalNotes: "" },
    currentStep: 0,
  };
}
