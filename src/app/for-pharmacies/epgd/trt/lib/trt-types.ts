import { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";

export interface TRTAssessment {
  maleConfirmed: boolean;
  labConfirmedLowTestosterone: boolean;
  symptomsPresent: boolean;
  prostateCancer: boolean;
  breastCancer: boolean;
  severeCardiacDisease: boolean;
  severeHepaticDisease: boolean;
  severeRenalDisease: boolean;
  psa: number | null;
  hematocrit: number | null;
  polycythaemia: boolean;
}

export interface TRTCounselling {
  explainedApplicationTechnique: boolean;
  discussedTransferRisk: boolean;
  discussedMonitoring: boolean;
  counselledOnSymptoms: boolean;
}

export interface TRTConsultationState {
  patient: BasePatientDetails;
  consent: BaseConsent;
  assessment: TRTAssessment;
  counselling: TRTCounselling;
  summary: BaseSummary;
  currentStep: number;
}

export const STEP_LABELS = ["Patient Details", "Gender Confirmation", "Clinical Assessment", "Contraindications", "Lab Results", "Counselling", "Gel Supply", "Summary", "Review"];
export const TOTAL_STEPS = STEP_LABELS.length;

export function createInitialConsultationState(): TRTConsultationState {
  return {
    patient: { firstName: "", lastName: "", dateOfBirth: "", age: null, gpName: "", gpPractice: "", nhsNumber: "", address: "", phone: "", email: "" },
    consent: { informedConsentGiven: false, idVerified: false, idType: "", patientAwarePrivateService: false },
    assessment: { maleConfirmed: false, labConfirmedLowTestosterone: false, symptomsPresent: false, prostateCancer: false, breastCancer: false, severeCardiacDisease: false, severeHepaticDisease: false, severeRenalDisease: false, psa: null, hematocrit: null, polycythaemia: false },
    counselling: { explainedApplicationTechnique: false, discussedTransferRisk: false, discussedMonitoring: false, counselledOnSymptoms: false },
    summary: { pharmacistName: "", pharmacistGPhC: "", pharmacyName: "", pharmacyAddress: "", consultationDate: new Date().toISOString().split("T")[0], consultationTime: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }), clinicalNotes: "" },
    currentStep: 0,
  };
}
