import { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";

export interface HerpesAssessment {
  herpesDiagnosed: boolean;
  firstEpisode: boolean;
  episodeFrequency: string;
  severeRenalImpairment: boolean;
  pregnancyFirstEpisode: boolean;
  lesionCount: number | null;
  symptomsPresent: boolean;
  daysFromOnset: number | null;
}

export interface HerpesCounselling {
  explainedViralShedding: boolean;
  counselledOnCondoms: boolean;
  discussedDisclosure: boolean;
  counselledOnTriggers: boolean;
  providedWrittenInfo: boolean;
}

export interface HerpesConsultationState {
  patient: BasePatientDetails;
  consent: BaseConsent;
  assessment: HerpesAssessment;
  counselling: HerpesCounselling;
  summary: BaseSummary;
  currentStep: number;
}

export const STEP_LABELS = ["Patient Details", "Herpes Assessment", "Episode Type", "Contraindications", "Counselling", "Treatment", "Summary", "Review"];
export const TOTAL_STEPS = STEP_LABELS.length;

export function createInitialConsultationState(): HerpesConsultationState {
  return {
    patient: { firstName: "", lastName: "", dateOfBirth: "", age: null, gpName: "", gpPractice: "", nhsNumber: "", address: "", phone: "", email: "" },
    consent: { informedConsentGiven: false, idVerified: false, idType: "", patientAwarePrivateService: false },
    assessment: { herpesDiagnosed: false, firstEpisode: false, episodeFrequency: "", severeRenalImpairment: false, pregnancyFirstEpisode: false, lesionCount: null, symptomsPresent: false, daysFromOnset: null },
    counselling: { explainedViralShedding: false, counselledOnCondoms: false, discussedDisclosure: false, counselledOnTriggers: false, providedWrittenInfo: false },
    summary: { pharmacistName: "", pharmacistGPhC: "", pharmacyName: "", pharmacyAddress: "", consultationDate: new Date().toISOString().split("T")[0], consultationTime: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }), clinicalNotes: "" },
    currentStep: 0,
  };
}
