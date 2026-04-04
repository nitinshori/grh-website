import { BasePatientDetails, BaseConsent, BaseSummary, ClinicalAlert } from '../../shared/types';

export type EggAllergySeverity = 'none' | 'mild' | 'severe' | '';

export interface FluScreening {
  previousFluVaccine: boolean;
  previousReaction: boolean;
  reactionDetails: string;
  eggAllergy: boolean;
  eggAllergySeverity: EggAllergySeverity;
  currentIllness: boolean;
  illnessDetails: string;
  immunosuppressed: boolean;
  immunosuppressedDetails: string;
  pregnant: boolean;
  breastfeeding: boolean;
  aspirinTherapy: boolean;
  bleedingDisorder: boolean;
  previousGBS: boolean;
  temperature: number | null;
}

export interface FluContraindications {
  anaphylaxisToPreviousDose: boolean;
  severeEggAllergy: boolean;
  acuteFebrileIllness: boolean;
  ageAppropriate: boolean;
}

export interface FluVaccineAdministration {
  vaccineName: string;
  batchNumber: string;
  expiryDate: string;
  injectionSite: 'left-deltoid' | 'right-deltoid' | 'left-thigh' | 'right-thigh' | '';
  route: 'intramuscular' | '';
  doseVolume: string;
  administeredBy: string;
  timeAdministered: string;
}

export interface FluPostVaccineObs {
  observationPeriod: '15-min' | '30-min' | '';
  patientWell: boolean;
  adverseReaction: boolean;
  reactionDetails: string;
  anaphylaxisKitChecked: boolean;
}

export interface FluAdvice {
  commonReactions: boolean;
  seriousReactions: boolean;
  paracetamolAdvice: boolean;
  returnIfConcerned: boolean;
  annualRevaccination: boolean;
}

export interface FluConsultationState {
  patient: BasePatientDetails;
  consent: BaseConsent;
  screening: FluScreening;
  contraindications: FluContraindications;
  administration: FluVaccineAdministration;
  postVaccineObs: FluPostVaccineObs;
  advice: FluAdvice;
  summary: BaseSummary;
  alerts: ClinicalAlert[];
  step: number;
}

export const initialFluScreening = (): FluScreening => ({
  previousFluVaccine: false,
  previousReaction: false,
  reactionDetails: '',
  eggAllergy: false,
  eggAllergySeverity: '',
  currentIllness: false,
  illnessDetails: '',
  immunosuppressed: false,
  immunosuppressedDetails: '',
  pregnant: false,
  breastfeeding: false,
  aspirinTherapy: false,
  bleedingDisorder: false,
  previousGBS: false,
  temperature: null,
});

export const initialFluContraindications = (): FluContraindications => ({
  anaphylaxisToPreviousDose: false,
  severeEggAllergy: false,
  acuteFebrileIllness: false,
  ageAppropriate: false,
});

export const initialFluVaccineAdministration = (): FluVaccineAdministration => ({
  vaccineName: '',
  batchNumber: '',
  expiryDate: '',
  injectionSite: '',
  route: '',
  doseVolume: '0.5ml',
  administeredBy: '',
  timeAdministered: '',
});

export const initialFluPostVaccineObs = (): FluPostVaccineObs => ({
  observationPeriod: '',
  patientWell: false,
  adverseReaction: false,
  reactionDetails: '',
  anaphylaxisKitChecked: false,
});

export const initialFluAdvice = (): FluAdvice => ({
  commonReactions: false,
  seriousReactions: false,
  paracetamolAdvice: false,
  returnIfConcerned: false,
  annualRevaccination: false,
});
